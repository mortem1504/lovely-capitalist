import test from "node:test";
import assert from "node:assert/strict";
import { reduce } from "../src/game/systems/simulation.js";
import { initial } from "../src/game/systems/save.js";
import {
  definition,
  furniture,
  portrait,
  registry,
} from "../src/game/data/catalog.js";
import {
  requirements,
  placementError,
  blocked,
} from "../src/game/systems/pathfinding.js";
import { existsSync } from "node:fs";
function setup(type) {
  let g = reduce(initial(), {
    type: "create",
    businessType: type,
    location: "side",
    w: 4,
    h: 4,
    name: "Test " + type,
  });
  const layout = {
    coffee: [
      ["counter", 0, 0],
      ["coffee", 3, 0],
      ["chair", 0, 2],
      ["chair", 3, 2],
      ["table", 0, 3],
    ],
    laundry: [
      ["counter", 0, 0],
      ["washer", 3, 0],
      ["chair", 0, 2],
    ],
    arcade: [
      ["counter", 0, 0],
      ["arcade", 3, 0],
    ],
  }[type];
  for (const [item, x, y] of layout) {
    g = reduce(g, { type: "buy", id: "b1", item });
    g = reduce(g, { type: "place", id: "b1", item, x, y });
  }
  assert.equal(requirements(g.businesses[0], definition(type)).length, 0);
  return reduce(g, { type: "open", id: "b1" });
}
for (const type of ["coffee", "laundry", "arcade"])
  test(
    type + " full loop pays wallet, customers navigate and save resumes",
    () => {
      let g = setup(type);
      const start = g.cash;
      for (let i = 0; i < 200; i++) {
        for (const c of g.businesses[0].npcs)
          if (c.state === "Waiting")
            g = reduce(g, { type: "work", id: "b1", customer: c.id });
        g = reduce(g, { type: "tick", id: "b1" });
        for (const c of g.businesses[0].npcs)
          assert.equal(blocked(g.businesses[0], c.x, c.y), false);
        if (i === 20) g = JSON.parse(JSON.stringify(g));
        if (g.businesses[0].served >= 2) break;
      }
      assert.ok(g.businesses[0].served >= 2, "at least 2 paid customers");
      assert.equal(g.cash - start, g.businesses[0].revenue);
    },
  );
test("purchase atomic, placement collisions and entrance protected", () => {
  let g = setup("coffee");
  assert.ok(g.cash >= 0);
  const b = g.businesses[0];
  assert.ok(placementError(b, { id: "x", type: "chair", x: 0, y: 0 }));
  assert.ok(placementError(b, { id: "x", type: "chair", x: 2, y: 3 }));
  assert.ok(placementError(b, { id: "x", type: "counter", x: 3, y: 3 }));
});
test("all catalog sprites and portrait layers exist; deterministic portrait", () => {
  for (const f of Object.values(furniture)) {
    assert.ok(existsSync(f.asset));
    for (const p of f.orientations) assert.ok(existsSync(p));
  }
  assert.deepEqual(portrait(849235), portrait(849235));
  assert.notDeepEqual(portrait(1), portrait(2));
  for (const p of portrait(849235))
    assert.ok(registry.some((a) => a.path === p && a.width === 320));
});
test("staff automate service and multiple businesses retain distinct rooms", () => {
  let g = setup("laundry");
  g.businesses[0].served = 12;
  for (const role of ["Cashier", "Attendant", "Server"])
    g = reduce(g, { type: "hire", id: "b1", role });
  const cash = g.cash;
  for (let i = 0; i < 150; i++) g = reduce(g, { type: "tick", id: "b1" });
  assert.ok(g.cash > cash);
  g.cash += 1600;
  g = reduce(g, {
    type: "create",
    businessType: "arcade",
    location: "side",
    w: 5,
    h: 5,
    name: "Second",
  });
  assert.equal(g.businesses.length, 2);
  assert.equal(g.businesses[0].w, 4);
  assert.equal(g.businesses[1].w, 5);
  assert.equal(g.businesses[1].inventory.washer, undefined);
});
