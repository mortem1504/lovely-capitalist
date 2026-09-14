import { furniture } from "../data/catalog.js";
export const door = (b) => ({ x: Math.floor(b.w / 2), y: b.h - 1 });
export function footprint(f) {
  const d = furniture[f.type];
  return { w: d.w, h: d.h };
}
export function blocked(b, x, y, ignore) {
  return (
    x < 0 ||
    y < 0 ||
    x >= b.w ||
    y >= b.h ||
    b.furniture.some((f) => {
      if (f.id === ignore) return false;
      const s = footprint(f);
      return x >= f.x && x < f.x + s.w && y >= f.y && y < f.y + s.h;
    })
  );
}
export function pathfind(b, start, goal) {
  if (blocked(b, goal.x, goal.y)) return null;
  const queue = [[start]],
    seen = new Set([`${start.x},${start.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i],
      p = path.at(-1);
    if (p.x === goal.x && p.y === goal.y) return path.slice(1);
    for (const [dx, dy] of [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy },
        key = `${n.x},${n.y}`;
      if (!seen.has(key) && !blocked(b, n.x, n.y)) {
        seen.add(key);
        queue.push([...path, n]);
      }
    }
  }
  return null;
}
export function access(b, f, start = door(b)) {
  const s = footprint(f),
    points = [];
  for (let x = f.x; x < f.x + s.w; x++)
    points.push({ x, y: f.y + s.h }, { x, y: f.y - 1 });
  for (let y = f.y; y < f.y + s.h; y++)
    points.push({ x: f.x - 1, y }, { x: f.x + s.w, y });
  return points
    .map((p) => ({ point: p, path: pathfind(b, start, p) }))
    .filter((p) => p.path !== null)
    .sort((a, b) => a.path.length - b.path.length)[0];
}
export function placementError(b, f) {
  const s = footprint(f),
    entry = door(b);
  for (let y = f.y; y < f.y + s.h; y++)
    for (let x = f.x; x < f.x + s.w; x++) {
      if (blocked(b, x, y, f.id)) return "Blocked or outside room";
      if (x === entry.x && y === entry.y) return "Keep entrance clear";
    }
  const test = {
    ...b,
    furniture: [...b.furniture.filter((x) => x.id !== f.id), f],
  };
  if (test.furniture.some((x) => !access(test, x)))
    return "Keep a path from entrance to every item";
  return null;
}
export function requirements(b, def) {
  return Object.entries(def.requiredFurniture).flatMap(([tag, n]) => {
    const count = b.furniture.filter(
      (f) => furniture[f.type].tags.includes(tag) && access(b, f),
    ).length;
    return count < n ? [`${n - count} ${tag}`] : [];
  });
}
