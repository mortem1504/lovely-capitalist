import { roomTemplates, getRoomTemplate } from "../data/roomTemplates.js";
import { definition, furniture, locations } from "../data/catalog.js";
import {
  door,
  access,
  requirements,
  placementError,
  pathfind,
} from "./pathfinding.js";
export const quality = (b) =>
  Math.min(
    100,
    Math.round(
      35 +
        b.furniture.filter((f) => furniture[f.type].tags.includes("decoration"))
          .length *
          7 +
        b.furniture.filter((f) => furniture[f.type].tags.includes("quality"))
          .length *
          8 +
        b.satisfaction * 0.25 +
        b.cleanliness * 0.15,
    ),
  );
export const level = (b) => Math.min(5, 1 + Math.floor(b.served / 12));
export const roles = (b) => [
  ...new Set(
    definition(b.type)
      .steps.map((s) => s[2])
      .filter(Boolean),
  ),
  "Cleaner",
  "Manager",
];
const clone = (s) => structuredClone(s);
function expense(g, b, n) {
  g.cash -= n;
  b.expenses += n;
  b.todayExpenses += n;
}
function startRoute(b, c) {
  const step = definition(b.type).steps[c.step];
  if (!step) {
    c.state = "Leaving";
    c.path = pathfind(b, c, door(b)) || [];
    return;
  }
  const reserved = b.npcs
    .filter((n) => n.id !== c.id && n.state !== "Leaving")
    .map((n) => n.target);
  const choices = b.furniture
    .filter(
      (f) =>
        furniture[f.type].tags.includes(step[1]) && !reserved.includes(f.id),
    )
    .map((f) => ({ f, a: access(b, f, c) }))
    .filter((x) => x.a)
    .sort((a, z) => a.a.path.length - z.a.path.length);
  if (!choices.length) {
    c.state = "Queueing";
    c.target = null;
    return;
  }
  c.target = choices[0].f.id;
  c.path = choices[0].a.path;
  c.state = "Walking";
  c.remaining = step[3];
}
function finishStep(g, b, c) {
  c.step++;
  c.target = null;
  if (c.step >= definition(b.type).steps.length) {
    const d = definition(b.type),
      tip = c.budget > d.basePrice * 1.3 && b.satisfaction > 80 ? 3 : 0,
      paid = d.basePrice + tip;
    g.cash += paid;
    b.revenue += paid;
    b.todayRevenue += paid;
    b.served++;
    b.todayCustomers++;
    b.totalWait += c.wait;
    b.satisfaction = Math.min(100, b.satisfaction + 2);
    b.cleanliness = Math.max(0, b.cleanliness - 4);
    g.message = `${c.name} paid $${paid}. ${b.served === 1 ? "Your first sale!" : ""}`;
  }
  startRoute(b, c);
}
export function reduce(state, a) {
  let g = clone(state),
    b = g.businesses.find((x) => x.id === a.id);
  const fail = (m) => ({ ...state, message: m });
  switch (a.type) {
    case "message":
      g.message = a.message;
      break;
    case "create": {
      const d = definition(a.businessType),
        loc = locations.find((l) => l.id === a.location),
        cost = d.startingCost + loc.cost + (a.w * a.h - 16) * 20;
      if (g.cash < cost) return fail("Not enough cash for this space.");
      g.cash -= cost;
      const id = "b" + g.next++;
      g.businesses.push({
        id,
        type: d.id,
        name: a.name.trim() || `Lovely ${d.name}`,
        w: a.w,
        h: a.h,
        location: loc.id,
        roomTemplate: getRoomTemplate(a.roomTemplate, d.id).id,
        open: false,
        inventory: {},
        furniture: [],
        staff: [],
        npcs: [],
        pool: [],
        spawn: 2,
        seed: g.next * 9123,
        day: 1,
        minute: 480,
        revenue: 0,
        expenses: cost,
        todayRevenue: 0,
        todayExpenses: cost,
        served: 0,
        todayCustomers: 0,
        totalWait: 0,
        satisfaction: 90,
        cleanliness: 100,
      });
      g.message = "Buy required equipment, then place each item in your room.";
      break;
    }
    case "roomTemplate": {
      if (!b || b.open || b.npcs.length)
        return fail("Close and finish customers before changing room style.");
      if (!roomTemplates.some((t) => t.id === a.roomTemplate))
        return fail("Unknown room template.");
      b.roomTemplate = a.roomTemplate;
      g.message = "Room style saved. Your layout is unchanged.";
      break;
    }
    case "buy": {
      const f = furniture[a.item];
      if (g.cash < f.price) return fail("Not enough cash.");
      expense(g, b, f.price);
      b.inventory[f.id] = (b.inventory[f.id] || 0) + 1;
      g.message = f.name + " added to inventory.";
      break;
    }
    case "place": {
      if (b.open || b.npcs.length)
        return fail("Close business and let customers leave before building.");
      const f = {
        id: a.furnitureId || "f" + g.next++,
        type: a.item,
        x: a.x,
        y: a.y,
        rotation: a.rotation || 0,
      };
      const error = placementError(b, f);
      if (error) return fail(error);
      if (!a.furnitureId) {
        if (!b.inventory[a.item]) return fail("Buy this item first.");
        b.inventory[a.item]--;
      }
      b.furniture = b.furniture.filter((x) => x.id !== f.id);
      b.furniture.push(f);
      g.message = "Placed. Keep entrance and equipment reachable.";
      break;
    }
    case "remove": {
      if (b.open || b.npcs.length)
        return fail("Close business before editing.");
      const f = b.furniture.find((f) => f.id === a.furnitureId);
      if (!f) return state;
      b.furniture = b.furniture.filter((x) => x.id !== f.id);
      if (a.sell) {
        const value = Math.floor(furniture[f.type].price * 0.6);
        g.cash += value;
        b.revenue += value;
      } else b.inventory[f.type] = (b.inventory[f.type] || 0) + 1;
      break;
    }
    case "sellInventory":
      if (b.inventory[a.item] > 0) {
        b.inventory[a.item]--;
        const value = Math.floor(furniture[a.item].price * 0.6);
        g.cash += value;
        b.revenue += value;
      }
      break;
    case "open": {
      if (!b.open) {
        const missing = requirements(b, definition(b.type));
        if (missing.length) return fail("Missing: " + missing.join(", "));
        if (g.cash < 0)
          return fail(
            "Sell furniture or work in another business to cover debt.",
          );
      }
      b.open = !b.open;
      g.message = b.open
        ? "Doors open. Tap a waiting customer to work."
        : "Closed to new arrivals. Finish current customers before building.";
      break;
    }
    case "work": {
      const c = b.npcs.find((n) => n.id === a.customer);
      if (!c || c.state !== "Waiting") return state;
      if (b.npcs.some((n) => n.manual && n.state === "Working"))
        return fail("Finish your current task first.");
      c.manual = true;
      c.state = "Working";
      break;
    }
    case "hire": {
      if (level(b) < 2) return fail("Staff unlock after 12 sales.");
      if (g.cash < 80) return fail("Hiring costs $80.");
      if (b.staff.some((s) => s.role === a.role))
        return fail("Role already staffed.");
      expense(g, b, 80);
      b.staff.push({
        id: g.next++,
        name: ["Mina", "Ari", "Jules", "Sora"][g.next % 4],
        seed: g.next * 541,
        role: a.role,
        salary: 12,
        speed: 1.2,
        skill: 1,
        energy: 100,
      });
      break;
    }
    case "fire":
      b.staff = b.staff.filter((s) => s.id !== a.employee);
      break;
    case "clean":
      b.cleanliness = Math.min(100, b.cleanliness + 15);
      g.message = "Room cleaned.";
      break;
    case "expand": {
      if (b.open || b.npcs.length)
        return fail("Close and finish customers before expanding.");
      if (b.w >= 8 || b.h >= 8) return fail("Maximum room size reached.");
      if (g.cash < 250) return fail("Expansion costs $250.");
      expense(g, b, 250);
      b.w++;
      b.h++;
      break;
    }
    case "tick": {
      if (!b || (!b.open && !b.npcs.length)) return state;
      b.minute += 2;
      if (b.minute >= 1320) {
        b.day++;
        b.minute = 480;
        b.todayRevenue = 0;
        b.todayExpenses = 0;
        b.todayCustomers = 0;
        const rent =
          definition(b.type).rent *
            locations.find((l) => l.id === b.location).multiplier +
          (b.w * b.h - 16);
        expense(
          g,
          b,
          Math.round(rent + b.staff.reduce((n, s) => n + s.salary, 0)),
        );
        if (g.cash < 0) {
          b.open = false;
          g.message =
            "Funds below zero. Doors closed; sell spare furniture to recover.";
        }
      }
      if (b.staff.some((s) => s.role === "Cleaner"))
        b.cleanliness = Math.min(100, b.cleanliness + 0.5);
      const d = definition(b.type);
      b.spawn -= 0.5;
      const capacity = Math.min(
        6,
        Math.max(
          2,
          b.furniture.filter((f) =>
            furniture[f.type].tags.includes(d.steps[1][1]),
          ).length * 2,
        ),
      );
      if (b.open && b.spawn <= 0 && b.npcs.length < capacity) {
        b.seed = (Math.imul(b.seed, 1664525) + 1013904223) >>> 0;
        const seed = b.seed,
          c = b.pool.pop() || {};
        Object.assign(c, {
          id: g.next++,
          seed,
          name: ["Mina", "Theo", "Sora", "Jules", "Ari", "Noah", "Luca", "Nia"][
            seed % 8
          ],
          ...door(b),
          step: 0,
          wait: 0,
          patience: 65 + (seed % 50),
          budget: 24 + (seed % 45),
          qualityExpectation: 40 + (seed % 40),
          spendingChance: (seed % 100) / 100,
          state: "Queueing",
          path: [],
          manual: false,
        });
        b.npcs.push(c);
        startRoute(b, c);
        const hour = b.minute / 60,
          peak = hour >= d.peak[0] && hour <= d.peak[1] ? 1.4 : 1;
        b.spawn =
          14 /
          (peak *
            locations.find((l) => l.id === b.location).multiplier *
            (0.7 + quality(b) / 100));
      }
      const assigned = new Set(
        b.npcs
          .filter((n) => n.state === "Working" && n.worker)
          .map((n) => n.worker),
      );
      for (const c of b.npcs) {
        if (c.state === "Leaving") {
          const p = c.path.shift();
          if (p) Object.assign(c, p);
          else c.done = true;
          continue;
        }
        if (c.state === "Walking") {
          const p = c.path[0];
          if (p) Object.assign(c, c.path.shift());
          if (!c.path.length)
            c.state = d.steps[c.step][2] ? "Waiting" : "Working";
        } else if (c.state === "Queueing") startRoute(b, c);
        else if (c.state === "Waiting") {
          const role = d.steps[c.step][2],
            staff = b.staff.find(
              (s) =>
                (s.role === role || s.role === "Manager") &&
                !assigned.has(s.id),
            );
          if (staff) {
            assigned.add(staff.id);
            c.worker = staff.id;
            c.state = "Working";
            c.manual = false;
          }
        } else if (c.state === "Working") {
          if (c.worker) assigned.add(c.worker);
          c.remaining -= 0.5 * (c.worker ? 1.2 : 1);
          if (c.remaining <= 0) {
            c.worker = null;
            c.manual = false;
            finishStep(g, b, c);
          }
        }
        if (["Queueing", "Waiting", "Walking"].includes(c.state)) {
          c.wait += 0.5;
          if (c.wait > c.patience) {
            c.state = "Leaving";
            c.path = pathfind(b, c, door(b)) || [];
            b.satisfaction = Math.max(10, b.satisfaction - 5);
            g.message = c.name + " left after waiting too long.";
          }
        }
      }
      b.pool.push(
        ...b.npcs.filter((c) => c.done).map((c) => ({ ...c, done: false })),
      );
      b.pool = b.pool.slice(-6);
      b.npcs = b.npcs.filter((c) => !c.done);
      break;
    }
    default:
      return state;
  }
  return g;
}
