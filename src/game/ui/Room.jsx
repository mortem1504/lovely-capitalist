import React, { useRef, useState } from "react";
import RoomSkin from "./RoomSkin";
import { Sprite, Portrait } from "./Sprites";
import { door, placementError, footprint } from "../systems/pathfinding";
export default function Room({
  business: b,
  editing,
  selection,
  onSelect,
  onCell,
  onCustomer,
}) {
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map()),
    gesture = useRef(null),
    viewport = useRef(null),
    roomRef = useRef(null);
  const entry = door(b),
    tile = 48;
  const move = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (editing && selection && roomRef.current) {
      const r = roomRef.current.getBoundingClientRect();
      onCell(
        Math.max(
          0,
          Math.min(b.w - 1, Math.floor((e.clientX - r.left) / (48 * zoom))),
        ),
        Math.max(
          0,
          Math.min(b.h - 1, Math.floor((e.clientY - r.top) / (48 * zoom))),
        ),
      );
    }
    const ps = [...pointers.current.values()];
    if (ps.length === 2) {
      const distance = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      if (!gesture.current?.distance) gesture.current = { distance, zoom };
      else
        setZoom(
          Math.max(
            1,
            Math.min(
              2.5,
              (gesture.current.zoom * distance) / gesture.current.distance,
            ),
          ),
        );
    } else if ((!editing || !selection) && gesture.current?.start) {
      setPan({
        x: Math.max(
          -180,
          Math.min(
            180,
            gesture.current.pan.x + e.clientX - gesture.current.start.x,
          ),
        ),
        y: Math.max(
          -180,
          Math.min(
            180,
            gesture.current.pan.y + e.clientY - gesture.current.start.y,
          ),
        ),
      });
    }
  };
  const ghost = selection && {
    id: selection.id || "preview",
    type: selection.type,
    x: selection.x,
    y: selection.y,
    rotation: selection.rotation,
  };
  const valid = ghost && !placementError(b, ghost);
  return (
    <section
      className="room-section"
      data-business={b.type}
      data-editing={editing}
    >
      <div className="room-top">
        <span>
          {editing ? "DESIGN YOUR SPACE" : "LIVE FLOOR"} · {b.w} × {b.h}
        </span>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          Focus
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => setZoom(Math.max(1, zoom - 0.5))}
        >
          −
        </button>
        <button
          aria-label="Zoom in"
          onClick={() => setZoom(Math.min(2.5, zoom + 0.5))}
        >
          +
        </button>
      </div>
      <div
        className="viewport"
        ref={viewport}
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          gesture.current = { start: { x: e.clientX, y: e.clientY }, pan };
        }}
        onPointerMove={move}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          gesture.current = null;
        }}
        onPointerCancel={() => pointers.current.clear()}
      >
        <div
          className="room"
          ref={roomRef}
          style={{
            width: b.w * tile,
            height: b.h * tile,
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          }}
        >
          <RoomSkin templateId={b.roomTemplate} type={b.type} w={b.w} h={b.h} />
          {Array.from({ length: b.w * b.h }, (_, i) => {
            const x = i % b.w,
              y = Math.floor(i / b.w);
            return (
              <button
                aria-label={`Tile ${x + 1}, ${y + 1}`}
                key={i}
                className={
                  "tile " + (entry.x === x && entry.y === y ? "entry" : "")
                }
                style={{ left: x * tile, top: y * tile }}
                onClick={() => editing && onCell(x, y)}
                onPointerUp={() => editing && selection && onCell(x, y)}
              />
            );
          })}
          {b.furniture.map((f) => (
            <button
              aria-label={`Move ${f.type}`}
              key={f.id}
              className={"placed " + (selection?.id === f.id ? "selected" : "")}
              style={{
                left: f.x * tile,
                top: f.y * tile,
                width: footprint(f).w * tile,
                height: footprint(f).h * tile,
                zIndex: f.y + 3,
              }}
              onClick={() => editing && onSelect(f)}
            >
              <Sprite type={f.type} rotation={f.rotation} />
            </button>
          ))}
          {ghost && (
            <div
              className={"ghost " + (valid ? "valid" : "invalid")}
              style={{
                left: ghost.x * tile,
                top: ghost.y * tile,
                width: footprint(ghost).w * tile,
                height: footprint(ghost).h * tile,
                zIndex: 30,
              }}
            >
              <Sprite type={ghost.type} rotation={ghost.rotation} />
            </div>
          )}
          {b.npcs.map((c) => (
            <button
              key={c.id}
              className="customer"
              style={{ left: c.x * tile, top: c.y * tile, zIndex: c.y + 15 }}
              onClick={() => onCustomer(c)}
              aria-label={`${c.name}: ${c.state}`}
            >
              <Portrait seed={c.seed} scale={1} />
              <span>
                {c.state === "Waiting"
                  ? "WORK"
                  : c.state === "Working"
                    ? "…"
                    : c.state === "Leaving"
                      ? "BYE"
                      : c.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="room-caption">
        {editing
          ? "Tap inventory, then a floor tile. Tap placed furniture to move it."
          : "Tap customers to work. Drag to pan · pinch to zoom."}
      </p>
    </section>
  );
}
