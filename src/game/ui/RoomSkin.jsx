import React, { useEffect, useRef, useState } from "react";
import { getRoomTemplate, roomMetrics } from "../data/roomTemplates";
const cache = new Map();
function loadImage(url) {
  if (!cache.has(url))
    cache.set(
      url,
      new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => {
          cache.delete(url);
          reject(new Error("Room image unavailable"));
        };
        im.src = url;
      }),
    );
  return cache.get(url);
}
// Render at the original 16px tile resolution, then enlarge by integer 3x.
// Tile the floor and stretch only wall spans; no scaling of gameplay coordinates.
export function paintRoom(ctx, image, template, w, h) {
  const source = document.createElement("canvas");
  source.width = 192;
  source.height = 160;
  const sample = source.getContext("2d");
  sample.imageSmoothingEnabled = false;
  sample.drawImage(image, 0, 0, 192, 160);
  const m = roomMetrics(w, h);
  ctx.clearRect(0, 0, m.width, m.height);
  ctx.imageSmoothingEnabled = false;
  const draw = (sx, sy, sw, sh, x, y, dw = sw, dh = sh) =>
    ctx.drawImage(source, sx, sy, sw, sh, x, y, dw, dh);
  draw(0, 0, 16, 48, 0, 0);
  draw(176, 0, 16, 48, m.width - 16, 0);
  for (let x = 0; x < w; x++) draw(80, 0, 16, 48, 16 + x * 16, 0);
  for (let y = 0; y < h; y++) {
    draw(0, 48, 16, 16, 0, 48 + y * 16);
    draw(176, 48, 16, 16, m.width - 16, 48 + y * 16);
    for (let x = 0; x < w; x++)
      draw(...template.floor, 16 + x * 16, 48 + y * 16);
  }
  draw(0, 144, 16, 8, 0, m.doorY);
  draw(176, 144, 16, 8, m.width - 16, m.doorY);
  for (let x = 0; x < w; x++) {
    if (x === Math.floor(w / 2))
      draw(...template.floor, 16 + x * 16, m.doorY, 16, 8);
    else draw(16, 144, 16, 8, 16 + x * 16, m.doorY);
  }
  return m;
}
export default function RoomSkin({ templateId, type, w, h, preview = false }) {
  const ref = useRef(null),
    [error, setError] = useState(false),
    t = getRoomTemplate(templateId, type),
    m = roomMetrics(w, h);
  useEffect(() => {
    let canceled = false;
    setError(false);
    loadImage(t.image)
      .then((image) => {
        if (!canceled && ref.current)
          paintRoom(ref.current.getContext("2d"), image, t, w, h);
      })
      .catch(() => {
        if (!canceled) setError(true);
      });
    return () => {
      canceled = true;
    };
  }, [t.id, w, h]);
  return (
    <>
      <canvas
        ref={ref}
        className={preview ? "template-preview" : "room-skin"}
        width={m.width}
        height={m.height}
        style={
          preview
            ? undefined
            : { width: m.width * 3, height: m.height * 3, left: -48, top: -144 }
        }
        role="img"
        aria-label={`${t.name}, empty ${w} by ${h} room`}
      />
      {error && (
        <span role="alert">Room template unavailable. Reload to retry.</span>
      )}
    </>
  );
}
