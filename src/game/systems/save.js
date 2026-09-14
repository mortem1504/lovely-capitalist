import { getRoomTemplate } from "../data/roomTemplates.js";
export const SAVE_KEY = "lovely-capitalist-v2";
export const initial = () => ({
  saveVersion: 2,
  cash: 1600,
  businesses: [],
  next: 1,
  settings: { zoom: 1 },
  message: "",
});
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (
        s.saveVersion === 2 &&
        Number.isFinite(s.cash) &&
        Array.isArray(s.businesses)
      )
        return {
          ...s,
          businesses: s.businesses.map((b) => ({
            ...b,
            roomTemplate: getRoomTemplate(b.roomTemplate, b.type).id,
          })),
        };
    }
    const old = JSON.parse(localStorage.getItem("lovely-capitalist-save"));
    if (old?.businesses) {
      localStorage.setItem(
        "lovely-capitalist-legacy-backup",
        JSON.stringify(old),
      );
      const s = initial();
      s.cash = Math.max(1600, old.cash || 0);
      s.message =
        "Earlier prototype save backed up. Fresh start includes enough capital for equipment.";
      return s;
    }
  } catch {}
  return initial();
}
export function save(s) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
