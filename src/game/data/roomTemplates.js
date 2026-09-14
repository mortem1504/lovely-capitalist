export const roomTemplates = [
  {
    id: "original-teal",
    name: "Classic teal",
    description: "Original reference · cool tile",
    image: "/room-templates/original-teal.png",
    source: "original",
    floor: [32, 64, 16, 16],
  },
  {
    id: "cafe-terracotta",
    name: "Terracotta café",
    description: "Warm walls · cream tile",
    image: "/room-templates/cafe-terracotta.png",
    source: "generated",
    floor: [32, 64, 16, 16],
  },
  {
    id: "laundry-sage",
    name: "Sage laundry",
    description: "Fresh sage · ivory tile",
    image: "/room-templates/laundry-sage.png",
    source: "generated",
    floor: [32, 64, 16, 16],
  },
  {
    id: "arcade-plum",
    name: "Plum arcade",
    description: "Plum walls · slate tile",
    image: "/room-templates/arcade-plum.png",
    source: "generated",
    floor: [32, 64, 16, 16],
  },
];
export const defaultRoomTemplate = (type) =>
  ({
    coffee: "cafe-terracotta",
    laundry: "laundry-sage",
    arcade: "arcade-plum",
  })[type] || "original-teal";
export const getRoomTemplate = (id, type) =>
  roomTemplates.find((t) => t.id === id) ||
  roomTemplates.find((t) => t.id === defaultRoomTemplate(type));
export const roomMetrics = (w, h) => ({
  width: w * 16 + 32,
  height: h * 16 + 56,
  floorX: 16,
  floorY: 48,
  doorX: 16 + Math.floor(w / 2) * 16,
  doorY: 48 + h * 16,
});
