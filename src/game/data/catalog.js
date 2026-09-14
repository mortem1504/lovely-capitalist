import assets from "./runtime-assets.json" with { type: "json" };
export const registry = assets;
const path = (folder, name, n) =>
  `Interior Asset/All furniture/${folder}/${name}_Singles_${n}.png`;
const kitchen = (n) => path("12_Kitchen_Singles", "Kitchen", n),
  bath = (n) => path("3_Bathroom_Singles", "Bathroom", n),
  basement = (n) => path("14_Basement_Singles", "Basement", n),
  living = (n) => path("2_Living_Room_Singles", "Living_Room", n);
function item(
  id,
  name,
  price,
  asset,
  category,
  tags,
  w = 1,
  h = 1,
  orientations = [],
) {
  const meta = assets.find((a) => a.path === asset);
  return {
    id,
    name,
    price,
    asset,
    category,
    tags,
    w,
    h,
    orientations,
    walkable: false,
    interactionPoints: "adjacent",
    ...{ pixelWidth: meta.width, pixelHeight: meta.height },
  };
}
export const furniture = Object.fromEntries(
  [
    item(
      "counter",
      "Service counter",
      120,
      kitchen(121),
      "Counters",
      ["counter"],
      2,
    ),
    item("coffee", "Coffee machine", 220, kitchen(185), "Equipment", [
      "coffee",
    ]),
    item("premiumCoffee", "Espresso station", 540, kitchen(177), "Equipment", [
      "coffee",
      "quality",
    ]),
    item("washer", "Washing machine", 260, bath(87), "Equipment", ["washer"]),
    item("premiumWasher", "Laundry station", 560, bath(83), "Equipment", [
      "washer",
      "quality",
    ]),
    item(
      "arcade",
      "Arcade cabinet",
      300,
      basement(218),
      "Equipment",
      ["arcade"],
      1,
      1,
      [basement(218), basement(221), basement(224)],
    ),
    item("premiumArcade", "Emerald arcade", 580, basement(219), "Equipment", [
      "arcade",
      "quality",
    ]),
    item(
      "chair",
      "Wooden chair",
      45,
      kitchen(272),
      "Seating",
      ["chair"],
      1,
      1,
      [kitchen(272), kitchen(280), kitchen(284)],
    ),
    item("table", "Cafe table", 80, basement(1), "Tables", ["table"], 2),
    item("plant", "Palm plant", 65, living(14), "Plants", ["decoration"]),
    item("lamp", "Floor lamp", 55, living(77), "Lighting", ["decoration"]),
    item("sofa", "Lounge chair", 95, basement(202), "Seating", [
      "chair",
      "decoration",
    ]),
    item("shelf", "Wooden cabinet", 110, living(37), "Storage", [
      "storage",
      "decoration",
    ]),
  ].map((x) => [x.id, x]),
);
export const businesses = [
  {
    id: "coffee",
    name: "Coffee Shop",
    category: "Food",
    startingCost: 350,
    rent: 24,
    basePrice: 18,
    minimumRoomWidth: 4,
    minimumRoomHeight: 4,
    icon: "coffee",
    requiredFurniture: { counter: 1, coffee: 1, chair: 2, table: 1 },
    peak: [8, 11],
    steps: [
      ["Take order", "counter", "Cashier", 2],
      ["Prepare coffee", "coffee", "Barista", 4],
      ["Serve coffee", "chair", "Server", 2],
    ],
    description: "Fresh coffee. Familiar faces. Your little corner of town.",
  },
  {
    id: "laundry",
    name: "Laundry",
    category: "Services",
    startingCost: 400,
    rent: 28,
    basePrice: 30,
    minimumRoomWidth: 4,
    minimumRoomHeight: 4,
    icon: "washer",
    requiredFurniture: { counter: 1, washer: 1, chair: 1 },
    peak: [11, 15],
    steps: [
      ["Accept clothes", "counter", "Cashier", 2],
      ["Load washer", "washer", "Attendant", 3],
      ["Wash clothes", "washer", null, 7],
      ["Return laundry", "counter", "Server", 2],
    ],
    description: "Turn everyday chores into a neighborhood essential.",
  },
  {
    id: "arcade",
    name: "Arcade",
    category: "Entertainment",
    startingCost: 450,
    rent: 30,
    basePrice: 24,
    minimumRoomWidth: 4,
    minimumRoomHeight: 4,
    icon: "arcade",
    requiredFurniture: { counter: 1, arcade: 1 },
    peak: [16, 21],
    steps: [
      ["Sell tokens", "counter", "Cashier", 2],
      ["Play arcade", "arcade", null, 7],
      ["Clean machine", "arcade", "Technician", 3],
    ],
    description: "One more round. Build the best hangout on the block.",
  },
];
export const definition = (id) => businesses.find((b) => b.id === id);
export const locations = [
  { id: "side", name: "Side street", cost: 0, multiplier: 1 },
  { id: "market", name: "Market square", cost: 180, multiplier: 1.25 },
  { id: "station", name: "Station corner", cost: 320, multiplier: 1.5 },
];
export const money = (n) =>
  (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString();
export function portrait(seed) {
  let x = seed >>> 0;
  const rand = (n) => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x % n;
  };
  return ["Skins", "Eyes", "Hairstyles", "Accessories"].flatMap(
    (category, i) => {
      const list = assets.filter(
        (a) =>
          a.path.includes("/" + category + "/") &&
          a.width === 320 &&
          a.height === 96,
      );
      return i === 3 && rand(3) !== 0 ? [] : [list[rand(list.length)].path];
    },
  );
}
