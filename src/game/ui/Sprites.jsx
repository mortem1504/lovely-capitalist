import React, { useMemo } from "react";
import { furniture, portrait } from "../data/catalog.js";
export function Sprite({ type, rotation = 0, scale = 2 }) {
  const f = furniture[type];
  return (
    <img
      draggable="false"
      className="sprite"
      alt={f.name}
      src={"/" + (f.orientations[rotation] || f.asset)}
      style={{ width: f.pixelWidth * scale, height: f.pixelHeight * scale }}
    />
  );
}
export function Portrait({ seed, scale = 2 }) {
  const layers = useMemo(() => portrait(seed), [seed]);
  return (
    <span
      className="portrait"
      style={{ width: 32 * scale, height: 32 * scale }}
    >
      {layers.map((p) => (
        <span
          key={p}
          style={{
            backgroundImage: `url("/${p}")`,
            backgroundSize: `${320 * scale}px ${96 * scale}px`,
          }}
        />
      ))}
    </span>
  );
}
