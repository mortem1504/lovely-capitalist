import React, { useState } from "react";
import TemplatePicker from "./TemplatePicker";
import { defaultRoomTemplate } from "../data/roomTemplates";
import {
  businesses,
  definition,
  furniture,
  locations,
  money,
} from "../data/catalog";
import { Sprite, Portrait } from "./Sprites";
import { quality, level, roles } from "../systems/simulation";
import { requirements } from "../systems/pathfinding";
export function CreateBusiness({ cash, onCreate, onBack }) {
  const [type, setType] = useState("coffee"),
    [location, setLocation] = useState("side"),
    [size, setSize] = useState(4),
    [height, setHeight] = useState(4),
    [name, setName] = useState("Lovely Coffee"),
    [roomTemplate, setRoomTemplate] = useState(defaultRoomTemplate("coffee"));
  const d = definition(type),
    cost =
      d.startingCost +
      locations.find((l) => l.id === location).cost +
      (size * height - 16) * 20;
  return (
    <main className="flow">
      <button onClick={onBack}>Back to businesses</button>
      <p className="eyebrow">YOUR NEXT CHAPTER</p>
      <h1>
        Small space.
        <br />
        Big possibility.
      </h1>
      <p>Choose your business. Make every tile yours.</p>
      <h3>01 / THE BUSINESS</h3>
      <div className="choices">
        {businesses.map((d) => (
          <button
            key={d.id}
            className={type === d.id ? "chosen" : ""}
            onClick={() => {
              setType(d.id);
              setRoomTemplate(defaultRoomTemplate(d.id));
              setName("Lovely " + d.name);
            }}
          >
            <Sprite type={d.icon} />
            <b>{d.name}</b>
            <small>
              {d.category} · {money(d.startingCost)}
            </small>
          </button>
        ))}
      </div>
      <p>{d.description}</p>
      <h3>02 / THE SPACE</h3>
      <div className="locations">
        {locations.map((l) => (
          <button
            key={l.id}
            className={l.id === location ? "chosen" : ""}
            onClick={() => setLocation(l.id)}
          >
            <b>{l.name}</b>
            <small>
              {l.cost ? money(l.cost) : "No location premium"} · {l.multiplier}×
              traffic
            </small>
          </button>
        ))}
      </div>
      <div className="dimensions">
        <label>
          Width
          <select value={size} onChange={(e) => setSize(+e.target.value)}>
            {[4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <span>×</span>
        <label>
          Depth
          <select value={height} onChange={(e) => setHeight(+e.target.value)}>
            {[4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <b>{size * height} tiles</b>
      </div>
      <TemplatePicker
        value={roomTemplate}
        type={type}
        w={size}
        h={height}
        onChange={setRoomTemplate}
      />
      <h3>03 / YOUR NAME ABOVE THE DOOR</h3>
      <input
        aria-label="Business name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={28}
      />
      <div className="receipt">
        <span>Space & registration</span>
        <b>{money(cost)}</b>
        <span>Cash after opening</span>
        <b>{money(cash - cost)}</b>
      </div>
      <p className="hint">
        Equipment purchased separately. Rent and salaries charged each game day.
      </p>
      <button
        className="primary wide"
        disabled={cost > cash}
        onClick={() =>
          onCreate({
            businessType: type,
            location,
            w: size,
            h: height,
            name,
            roomTemplate,
          })
        }
      >
        CREATE BUSINESS · {money(cost)}
      </button>
    </main>
  );
}
export function BuildPanel({ b, dispatch, selection, setSelection, onDone }) {
  const [tab, setTab] = useState("inventory"),
    [category, setCategory] = useState("All");
  const items = Object.values(furniture).filter(
    (f) =>
      (category === "All" || f.category === category) &&
      (tab !== "inventory" || b.inventory[f.id] > 0),
  );
  return (
    <section className="build-panel">
      <div className="panel-head">
        <h3>BUILD MODE</h3>
        <button onClick={onDone}>Done</button>
      </div>
      <p className="hint">
        {requirements(b, definition(b.type)).length
          ? "Still needed: " + requirements(b, definition(b.type)).join(", ")
          : "All opening requirements ready."}
      </p>
      <div className="tabs">
        {["inventory", "shop", "room"].map((t) => (
          <button
            className={tab === t ? "chosen" : ""}
            key={t}
            onClick={() => {
              setTab(t);
              setSelection(null);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "room" ? (
        <>
          <TemplatePicker
            value={b.roomTemplate}
            type={b.type}
            w={b.w}
            h={b.h}
            onChange={(roomTemplate) =>
              dispatch({ type: "roomTemplate", id: b.id, roomTemplate })
            }
          />
          <p>
            {b.w} × {b.h} room. Expand by one tile on each side.
          </p>
          <button onClick={() => dispatch({ type: "expand", id: b.id })}>
            Expand · $250
          </button>
        </>
      ) : (
        <>
          <select
            aria-label="Furniture category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              "All",
              ...new Set(Object.values(furniture).map((f) => f.category)),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="carousel">
            {items.map((f) => (
              <button
                key={f.id}
                className={selection?.type === f.id ? "chosen item" : "item"}
                onClick={() =>
                  tab === "shop"
                    ? dispatch({ type: "buy", id: b.id, item: f.id })
                    : setSelection({ type: f.id, x: 0, y: 0, rotation: 0 })
                }
              >
                <Sprite type={f.id} />
                <b>{f.name}</b>
                <small>
                  {f.w}×{f.h} ·{" "}
                  {tab === "shop"
                    ? money(f.price)
                    : `${b.inventory[f.id]} owned`}
                </small>
                <strong>{tab === "shop" ? "BUY" : "SELECT"}</strong>
              </button>
            ))}
            {!items.length && (
              <p>Inventory empty. Buy equipment in Shop first.</p>
            )}
          </div>
        </>
      )}
      {selection && (
        <div className="placement-controls">
          <b>
            {furniture[selection.type].name} · {selection.x + 1},
            {selection.y + 1}
          </b>
          <button
            className="primary"
            onClick={() => {
              dispatch({
                type: "place",
                id: b.id,
                item: selection.type,
                furnitureId: selection.id,
                x: selection.x,
                y: selection.y,
                rotation: selection.rotation,
              });
              setSelection(null);
            }}
          >
            Place
          </button>
          {furniture[selection.type].orientations.length > 1 && (
            <button
              onClick={() =>
                setSelection({
                  ...selection,
                  rotation:
                    (selection.rotation + 1) %
                    furniture[selection.type].orientations.length,
                })
              }
            >
              Rotate
            </button>
          )}
          {selection.id ? (
            <>
              <button
                onClick={() => {
                  dispatch({
                    type: "remove",
                    id: b.id,
                    furnitureId: selection.id,
                  });
                  setSelection(null);
                }}
              >
                Store
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: "remove",
                    id: b.id,
                    furnitureId: selection.id,
                    sell: true,
                  });
                  setSelection(null);
                }}
              >
                Sell 60%
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                dispatch({
                  type: "sellInventory",
                  id: b.id,
                  item: selection.type,
                });
                setSelection(null);
              }}
            >
              Sell 60%
            </button>
          )}
          <button onClick={() => setSelection(null)}>Cancel</button>
        </div>
      )}
    </section>
  );
}
export function DetailPanel({ panel, b, dispatch, close }) {
  return (
    <div className="overlay">
      <section
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={panel === "staff" ? "Staff" : "Finance"}
      >
        <div className="panel-head">
          <h2>{panel === "staff" ? "Your team" : "Business journal"}</h2>
          <button onClick={close}>Close</button>
        </div>
        {panel === "staff" ? (
          <>
            <p>
              Staff unlock at 12 sales ({b.served}/12). Hire for $80; salary $12
              per day. Each role handles its matching work step.
            </p>
            {b.staff.map((s) => (
              <div className="staff-row" key={s.id}>
                <Portrait seed={s.seed} />
                <div>
                  <b>
                    {s.name} · {s.role}
                  </b>
                  <small>
                    Speed {s.speed}× · Skill {s.skill} · Energy {s.energy}%
                  </small>
                </div>
                <button
                  onClick={() =>
                    dispatch({ type: "fire", id: b.id, employee: s.id })
                  }
                >
                  Dismiss
                </button>
              </div>
            ))}
            <div className="role-list">
              {roles(b)
                .filter((role) => !b.staff.some((s) => s.role === role))
                .map((role) => (
                  <button
                    disabled={level(b) < 2}
                    key={role}
                    onClick={() => dispatch({ type: "hire", id: b.id, role })}
                  >
                    Hire {role} · $80
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            <p>
              Day {b.day} · Level {level(b)} ·{" "}
              {
                [
                  "New business",
                  "Local favorite",
                  "Popular spot",
                  "Established business",
                  "City favorite",
                ][level(b) - 1]
              }
            </p>
            <dl>
              {Object.entries({
                "Revenue today": money(b.todayRevenue),
                "Expenses today": money(b.todayExpenses),
                "Profit today": money(b.todayRevenue - b.todayExpenses),
                "Lifetime revenue": money(b.revenue),
                "Lifetime expenses": money(b.expenses),
                "Customers today": b.todayCustomers,
                Satisfaction: b.satisfaction + "%",
                Quality: quality(b) + "%",
                Cleanliness: Math.round(b.cleanliness) + "%",
                Popularity: Math.round((quality(b) + b.satisfaction) / 2) + "%",
                "Average wait":
                  Math.round(b.totalWait / Math.max(1, b.served)) + " sec",
                "Daily staff cost": money(
                  b.staff.reduce((n, s) => n + s.salary, 0),
                ),
                "Base daily rent": money(definition(b.type).rent),
                "Business value": money(
                  definition(b.type).startingCost +
                    b.furniture.reduce(
                      (n, f) => n + furniture[f.type].price * 0.6,
                      0,
                    ) +
                    b.served * 10,
                ),
              }).map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </React.Fragment>
              ))}
            </dl>
            <button onClick={() => dispatch({ type: "clean", id: b.id })}>
              Clean room
            </button>
          </>
        )}
      </section>
    </div>
  );
}
