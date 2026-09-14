# Lovely Capitalist

Mobile-first React/Vite business simulation. Run `npm run dev`; make a distributable build with `npm run build`. The build copies original asset folders unchanged into `dist` so the game also works outside the development server.

## Playing

1. Choose Coffee Shop, Laundry, or Arcade, then a location, room dimensions, and name.
2. Buy equipment in Build > Shop. Purchases enter that business's inventory.
3. Select inventory and tap or drag across floor tiles, then Place. Green means valid; red means blocked. Keep the entrance and an approach to every item clear.
4. Tap existing furniture to move, store, or sell it. Rotation appears only for visually verified alternate sprites.
5. Finish Build and open. Customers navigate to equipment. Tap a waiting customer or WORK to complete each service step. Machine cycles run by themselves; completed service credits the wallet.
6. Staff unlock at 12 sales. Matching staff roles automate their tasks. Rent and salaries are charged when an active business rolls into its next day.
7. Close to new arrivals and finish existing customers before editing or expanding. Open more businesses from the hub.

Drag empty room space to pan, pinch or use +/- to zoom, and Focus to reset. In build mode, dragging with an item selected moves its preview; deselect to pan.

## Save and time

Version 2 saves use browser localStorage, autosaving each state change. Each business preserves its layout, inventory, customers and seeds, staff, finance, clock, and progression. Reload opens the hub. Inactive businesses and hidden tabs pause. An empty closed business pauses too. There is no offline-income calculation or cloud sync. Previous prototype saves are retained at their original key and additionally backed up before a fresh funded start.

## Assets and extension

`npm run assets` recursively inspects PNGs using Python/Pillow and rebuilds `src/game/data/assets.json` (5,684 original files) and the summary `manifest.json`. Originals are never renamed, altered, or deleted. Indexed dimensions, alpha, numbered variants, category, and sheet framing are recorded. Numbered furniture files do not expose reliable semantic labels or orientations; the playable catalog is visually curated.

`src/game/data/catalog.js` defines furniture footprints, native sprite sizes, verified orientations, tags, business costs, required tags, and reusable service steps. Each step is `[label, furnitureTag, staffRole, durationSeconds]`; a null role is an automatic machine/customer step. Add definitions to this catalog to extend gameplay. Portraits use the same 32×32 frame from compatible 320×96 skin, eyes, hair, and accessory sheets with a seeded generator. Room floor tiles and coin are sampled directly from the supplied atlases.

Systems are separated into pathfinding/build validation, simulation/economy/staff, saves, and UI modules. Customers share a bounded pool of up to six active entries per room. Simulation runs twice per second, with CSS movement interpolation and images loaded only when displayed. Customers may pass each other in narrow corridors; furniture remains impassable and interaction targets are reserved.

## Verification and scope

`npm test` checks all three full service loops, wallet accounting, collision/entrance protection, deterministic portraits and sprite paths, save serialization mid-service, staff automation, and independent business rooms. Browser-tested at a 390×844 phone viewport: creation, purchases, five placements, opening, manual coffee service, $21 payment, and finance.

This is the first playable slice: three business definitions and thirteen curated furniture items, five business levels, staff automation, room expansion, and multiple businesses. The wider example business list and full thousands-item furniture shop remain content expansion. No multiplayer, cloud save, character-body animation, or background business simulation is included.
