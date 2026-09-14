import React, { useEffect, useReducer, useState } from "react";
import { createRoot } from "react-dom/client";
import { definition, money, furniture } from "./game/data/catalog";
import { reduce, level, quality } from "./game/systems/simulation";
import { load, save } from "./game/systems/save";
import { requirements } from "./game/systems/pathfinding";
import { Sprite, Portrait } from "./game/ui/Sprites";
import Room from "./game/ui/Room";
import { CreateBusiness, BuildPanel, DetailPanel } from "./game/ui/Panels";
import "./styles.css";
function App() {
  const [g, dispatch] = useReducer(reduce, null, load),
    [screen, setScreen] = useState("hub"),
    [id, setId] = useState(null),
    [editing, setEditing] = useState(false),
    [selection, setSelection] = useState(null),
    [panel, setPanel] = useState(null),
    [customer, setCustomer] = useState(null),
    [saveError, setSaveError] = useState(false);
  const b = g.businesses.find((x) => x.id === id);
  useEffect(() => {
    setSaveError(!save(g));
  }, [g]);
  useEffect(() => {
    if (!id || screen !== "room") return;
    const timer = setInterval(() => {
      if (!document.hidden) dispatch({ type: "tick", id });
    }, 500);
    return () => clearInterval(timer);
  }, [id, screen]);
  useEffect(() => {
    if (!g.message) return;
    const t = setTimeout(
      () => dispatch({ type: "message", message: "" }),
      5000,
    );
    return () => clearTimeout(t);
  }, [g.message]);
  const enter = (id) => {
    setId(id);
    setScreen("room");
    setEditing(false);
    setSelection(null);
    setCustomer(null);
  };
  const create = (fields) => {
    const next = "b" + g.next;
    dispatch({ type: "create", ...fields });
    enter(next);
    setEditing(true);
  };
  const d = b && definition(b.type),
    missing = b && requirements(b, d),
    active =
      b?.npcs.find((n) => n.id === customer) ||
      b?.npcs.find((n) => n.state === "Waiting") ||
      b?.npcs.find((n) => n.state === "Working");
  return (
    <div className="app">
      {screen === "create" ? (
        <CreateBusiness
          cash={g.cash}
          onCreate={create}
          onBack={() => setScreen("hub")}
        />
      ) : screen === "hub" || !b ? (
        <main className="hub">
          <header>
            <span className="brand">
              <span className="ui-coin" aria-hidden="true" />
              LOVELY CAPITALIST
            </span>
            <b>{money(g.cash)}</b>
          </header>
          <div className="hero">
            <p className="eyebrow">EVERYBODY STARTS SOMEWHERE.</p>
            <h1>
              LOVELY
              <br />
              <span>CAPITALIST</span>
            </h1>
            <div className="hero-scene">
              <Sprite type="plant" scale={3} />
              <Sprite type="counter" scale={3} />
              <Sprite type="coffee" scale={3} />
              <Sprite type="arcade" scale={3} />
            </div>
            <p>
              Your place. Your people.
              <br />A little business, a bigger tomorrow.
            </p>
          </div>
          <div className="section-title">
            <h2>My businesses</h2>
            <small>{g.businesses.length} owned</small>
          </div>
          {g.businesses.map((b) => (
            <button
              className="business-card"
              key={b.id}
              onClick={() => enter(b.id)}
            >
              <Sprite type={definition(b.type).icon} />
              <div>
                <h3>{b.name}</h3>
                <small>
                  {b.open ? "OPEN" : "CLOSED"} · Level {level(b)} · {b.w}×{b.h}
                </small>
              </div>
              <b>
                {money(b.todayRevenue)}
                <small>today</small>
              </b>
            </button>
          ))}
          {!g.businesses.length && (
            <p className="intro">
              Start with $1,600. Rent an empty room, buy equipment, and make
              your first sale.
            </p>
          )}
          <button className="primary wide" onClick={() => setScreen("create")}>
            {g.businesses.length
              ? "+ OPEN NEW BUSINESS"
              : "CHOOSE YOUR FIRST BUSINESS"}
          </button>
          <p className="save-note">
            Autosaved on this device · Businesses pause when away.
          </p>
        </main>
      ) : (
        <main className="business">
          <header>
            <button aria-label="My businesses" onClick={() => setScreen("hub")}>
              Back
            </button>
            <div>
              <small>
                {d.name} · LV {level(b)}
              </small>
              <h2>{b.name}</h2>
            </div>
            <b>{money(g.cash)}</b>
          </header>
          <div className="status">
            <span className={b.open ? "open" : ""}>
              {b.open ? "OPEN" : "CLOSED"}
            </span>
            <span>
              DAY {b.day} · {String(Math.floor(b.minute / 60)).padStart(2, "0")}
              :{String(b.minute % 60).padStart(2, "0")}
            </span>
            <span>Quality {quality(b)}%</span>
          </div>
          <Room
            business={b}
            editing={editing}
            selection={selection}
            onSelect={(f) => setSelection({ ...f })}
            onCell={(x, y) => selection && setSelection({ ...selection, x, y })}
            onCustomer={(c) => {
              setCustomer(c.id);
              if (c.state === "Waiting")
                dispatch({ type: "work", id, customer: c.id });
            }}
          />
          {editing ? (
            <BuildPanel
              b={b}
              dispatch={dispatch}
              selection={selection}
              setSelection={setSelection}
              onDone={() => {
                setEditing(false);
                setSelection(null);
              }}
            />
          ) : (
            <section className="work-panel">
              {active ? (
                <>
                  <Portrait seed={active.seed} />
                  <div>
                    <b>{active.name}</b>
                    <p>
                      {active.state === "Leaving"
                        ? "Heading home"
                        : d.steps[active.step]?.[0] || "Thank you!"}
                    </p>
                    <small>
                      {active.state} ·{" "}
                      {Math.max(0, Math.round(active.patience - active.wait))}s
                      patience
                    </small>
                  </div>
                  {active.state === "Waiting" ? (
                    <button
                      className="primary"
                      onClick={() =>
                        dispatch({ type: "work", id, customer: active.id })
                      }
                    >
                      WORK
                    </button>
                  ) : active.state === "Working" ? (
                    <progress
                      aria-label="Task progress"
                      max={d.steps[active.step][3]}
                      value={d.steps[active.step][3] - active.remaining}
                    />
                  ) : null}
                </>
              ) : (
                <div>
                  <b>
                    {b.open
                      ? "Ready for the next customer"
                      : "Your room, your rules."}
                  </b>
                  <p>
                    {b.open
                      ? "Customers will arrive through the entrance."
                      : missing.length
                        ? "Buy and place: " + missing.join(", ")
                        : "All equipment ready. Open your doors!"}
                  </p>
                </div>
              )}
            </section>
          )}
          {!editing && (
            <button
              className="wide primary open-button"
              onClick={() => dispatch({ type: "open", id })}
            >
              {b.open ? "CLOSE TO NEW CUSTOMERS" : "OPEN BUSINESS"}
            </button>
          )}
          {b.served === 0 && !editing && (
            <p className="tutorial">
              First sale: open doors, tap a customer at each work step, then
              collect payment automatically.
            </p>
          )}
          <nav>
            <button
              className={editing ? "chosen" : ""}
              onClick={() => {
                if (b.open || b.npcs.length) {
                  dispatch({
                    type: "message",
                    message:
                      "Close doors and finish current customers before building.",
                  });
                  return;
                }
                setEditing(!editing);
                setSelection(null);
              }}
            >
              Build
            </button>
            <button onClick={() => setPanel("staff")}>Staff</button>
            <button onClick={() => setPanel("finance")}>Finance</button>
            <button onClick={() => setScreen("hub")}>Businesses</button>
          </nav>
          {panel && (
            <DetailPanel
              panel={panel}
              b={b}
              dispatch={dispatch}
              close={() => setPanel(null)}
            />
          )}
        </main>
      )}
      {g.message && (
        <div role="status" className="toast">
          {g.message}
        </div>
      )}
      {saveError && (
        <div role="alert" className="save-error">
          Save failed: browser storage unavailable. Keep this tab open.
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
