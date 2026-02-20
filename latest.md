# Latest Changes

## Gate Star Map Lock (Feature 1)
**Design:** [planning/gate-map-lock.md](planning/gate-map-lock.md)

### What was implemented
When the star map is opened by reaching a warp gate (`gameState.atWarpGate = true`), the Close button is hidden and the M key / Close button click handlers are blocked. The player must select a destination and jump — they cannot back out of a gate.

When opened manually (M key or MAP button), the Close button works normally.

### Changes
- `openStarMap()`: Conditionally hides `starmapCloseBtn` based on `atWarpGate`
- Close button click handler: Guards with `!gameState.atWarpGate`
- M key handler: Guards close action with `!gameState.atWarpGate`

## Exploration Jump Requires Equipment (Feature 2)
**Design:** [planning/jump-drive-equipment.md](planning/jump-drive-equipment.md)

### What was implemented
Opening the star map from exploration mode (M key or MAP button) now requires an "FTL Booster" equipment item. Without it, players can only jump at warp gates. Debug mode bypasses this restriction.

### Changes
- Added `gameState.equipment` object with `ftlBooster: false` default
- New `canJumpFromExploration()` helper checks `atWarpGate || ftlBooster || debugMode`
- `openStarMap()` gates on `canJumpFromExploration()`
- M key and MAP button handlers show "FTL Booster required" toast when blocked
- Added `showHUDToast()` generic notification function
- New `EQUIPMENT_SHOP` constant with FTL Booster (500 CR)
- `updateEquipmentList()` renders purchasable equipment in Outfitter
- Equipment persists in save/load via `getSaveableState()` / `applySavedState()`

## Ship Outfitter UI (Feature 3)
**Design:** [planning/ship-outfitter.md](planning/ship-outfitter.md)

### What was implemented
The Outfitter station tab now has a visual two-column layout with a 3D ship preview, hardpoint management, systems display, inventory, and weapon shop — all in one unified interface.

### Layout
- **Left column**: 3D ship preview (separate Babylon.js engine on `outfitterCanvas`) with auto-rotating ArcRotateCamera + player interaction, and inventory panel below
- **Right column**: Hardpoints panel (equip/remove weapons per slot), Systems & Equipment panel (upgrade levels + purchasable equipment), Weapon Shop panel

### Changes
- New HTML layout in `sectionOutfitter`: `outfitter-layout` with `outfitter-left` / `outfitter-right` columns
- ~120 lines of new CSS for outfitter panels, preview canvas, hardpoint items, inventory items, action buttons
- `updateWeaponsList()` fully rewritten to populate new panel IDs (`outfitterHardpoints`, `outfitterInventory`, `outfitterShop`, `outfitterSystems`)
- New `initOutfitterPreview()`: creates separate Babylon engine+scene on `outfitterCanvas`, loads player's ship model with textures, sets up ArcRotateCamera with auto-rotation behavior
- New `disposeOutfitterPreview()`: cleans up engine/scene/resize handler when leaving outfitter
- `switchStationSection()`: disposes outfitter preview when switching to another tab
- `departStarbase()`: disposes outfitter preview on station departure

## Supply Chain Visualization on Galaxy Map (Feature 4)
**Design:** [planning/supply-chain-map.md](planning/supply-chain-map.md)

### What was implemented
A "Trade Overlay" toggle on the star map shows supply chain information for visited systems: production dots (colored by trade good), surplus/deficit badges (green/red circles with counts), trade flow arrows between connected systems, and detailed trade info in the system details panel.

### Changes
- New HTML: `starmapTradeToggle` button in star map header
- New CSS: `.starmap-trade-toggle` with active state styling
- New `starmapTradeOverlay` boolean toggle
- New `getSystemTradeProfile(sysId)`: aggregates node inventories, industry outputs/inputs, and population consumption for a system — returns `{ produces, consumes, surplus, goods }`
- New `renderTradeOverlay(ctx, world, toScreen)`: draws production dots, surplus/deficit badges, and trade flow arrows on the star map canvas
- New `drawTradeFlowArrow()`: colored directional arrows between systems showing NPC trade flows
- `renderStarMap()`: calls `renderTradeOverlay()` when toggle is active
- Star map click handler: appends trade info (produces, surplus, needs) to system details when overlay is on
- Toggle button listener toggles state and re-renders map
