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
A "Trade Overlay" toggle on the star map shows supply chain information for visited systems. Toggle button in the star map header activates the overlay.

### Changes
- New HTML: `starmapTradeToggle` button in star map header
- New CSS: `.starmap-trade-toggle` with active state styling
- New `starmapTradeOverlay` boolean toggle
- New `getSystemTradeProfile(sysId)`: aggregates node inventories, industry outputs/inputs, and population consumption for a system — returns `{ produces, consumes, surplus, goods }`
- `renderStarMap()`: calls `renderTradeOverlay()` when toggle is active
- Toggle button listener toggles state and re-renders map

## Station Re-docking Cooldown (Feature 5)
**Design:** [planning/station-redock-cooldown.md](planning/station-redock-cooldown.md)

### What was implemented
After departing a station, the docking proximity check is suppressed until the player physically leaves the dock radius. This prevents the immediate re-dock that occurred because `departStarbase()` places the player at `starbase.y - 1`, which is still within `dockRadius` of 2.0.

### Changes
- Added `gameState.dockCooldownStation` (null by default)
- `departStarbase()`: sets `dockCooldownStation = gameState.starbase`
- Docking proximity check: skips if `dockCooldownStation === starbase`
- Each frame: clears cooldown when player moves outside `starbase.dockRadius`

## Improved Trade Overlay (Feature 6)
**Design:** [planning/trade-overlay-v2.md](planning/trade-overlay-v2.md)

### What was implemented
Replaced the v1 trade overlay (colored dots + confusing green/red numbered circles) with an icon-based approach. Each trade good now has an emoji icon. Systems show two labeled rows:
- **Exports row** (▲, green-tinted): emoji icons for goods in surplus, above the system circle
- **Needs row** (▼, orange-tinted): emoji icons for goods in deficit, below the system name
Flow arrows between connected systems now show the good's icon at the midpoint. Info panel shows "Exports: icon Name (+val)" and "Needs: icon Name (val)".

### Changes
- Added `icon` property to every `TRADE_GOODS` entry (ore=⛏, metals=⚙, rations=🍞, fuel=⛽, etc.)
- Rewrote `renderTradeOverlay()`: draws icon rows with ▲/▼ labels and subtle colored background bars
- Rewrote `drawTradeFlowArrow()`: now takes the full `good` object, draws the good's icon at the arrow midpoint
- Updated star map click handler trade info to use `icon + name + value` format

## World Events Affecting Economy (Feature 7)
**Design:** [planning/world-events.md](planning/world-events.md)

### What was implemented
A full world events system that dynamically disrupts the economy. 5 event types spawn randomly each economy tick, apply economic effects (demand spikes, trade flow disruption, industry shutdowns), and are visible to the player through bar rumors, trade overlay markers, and the system info panel.

### Audit Findings
- `tickWorldEvents()` was a stub — called but did nothing
- `demandSpike` field existed on inventory items but was never set to non-zero
- `npcTradeFlow()` had a bug — iterated `sys.nodes` (undefined) instead of `sys.nodeIds`
- Bar rumors were static flavor text with no connection to world state
- Convoys existed visually in exploration mode but had no economic impact
- Phase 4 event design existed in `economy_design_impl.md` but was never coded

### Event Types
| Type | Icon | Frequency | Duration | Effect |
|------|------|-----------|----------|--------|
| Pirate Blockade | ☠ | Common | 4-6 ticks | Reduces NPC trade flow to 20%, spikes rations/medical demand |
| Industrial Accident | 🔥 | Uncommon | 5-8 ticks | Disables one industry at a node |
| Military Mobilization | ⚔ | Rare | 3-5 ticks | Spikes munitions/fuel/medical demand |
| Famine | 🍂 | Uncommon | 4-7 ticks | Spikes rations/biomass demand |
| Trade Boom | 📈 | Common | 3-5 ticks | Boosts NPC trade flow by 50% |

### Changes
- New `EVENT_TYPES` constant with 5 event types, each with news templates, effects, duration ranges
- Rewrote `tickWorldEvents()`: advances/expires events, resets+reapplies demandSpikes, spawns new events (15% chance/tick, max 3 active)
- New `trySpawnWorldEvent()`: weighted random type selection, finds valid target (lane or node), prevents duplicates
- New `applyEventDemandSpikes()`: sets `demandSpike` on affected node inventories (feeds into existing price calculation)
- New `isIndustryDisabledByEvent()`: checked in `worldEconomyTick()` industry loop to skip disabled industries
- New `getLaneFlowModifier()`: returns combined flow multiplier for a connection from active blockade/boom events
- New `getSystemEvents()`: returns active events affecting a given system
- Fixed `npcTradeFlow()`: changed `sys.nodes` to `sys.nodeIds`, added `getLaneFlowModifier()` call
- Modified `worldEconomyTick()` industry loop: skips industries disabled by events
- Modified `populateBarSection()`: prepends dynamic event rumors (highlighted with orange border) before static rumors
- Modified `renderTradeOverlay()`: draws pulsing event icon badges on affected systems
- Modified star map click handler: shows event names, icons, and ticks remaining in info panel
- `applySavedState()`: ensures `activeEvents`/`eventHistory` arrays exist for old saves
- New CSS `.event-rumor` for highlighted event rumors in the bar

## NPC Ship Trade Encounters (Feature 8)
**Design:** [planning/npc-trade-encounters.md](planning/npc-trade-encounters.md)

### What was implemented
1-2 civilian NPC ships in each exploration system are marked as trade encounter ships. They display a pulsing green ring and an emoji icon above them (💰/⛽/📡). When the player flies within 3 units, targeting corners appear and a 1-second harvest bar fills. On completion, a dialog offers one of 3 encounter types.

### Encounter Types
| Type | Icon | Offer |
|------|------|-------|
| Cargo Dump | 💰 | Buy 5-15 units of a random good at 50% off base price |
| Fuel Buyer | ⛽ | Sell fuel at 2x market rate (5-20 units) |
| Trade Intel | 📡 | Buy a tip (50-100 CR) that applies a demandSpike to a good in the current system |

### Changes
- New `TRADE_ENCOUNTER_TYPES` constant with 3 types, each with `generate()`, `canAccept()`, `apply()` methods
- Modified `generateExplorationTraffic()`: marks 1-2 non-pirate non-warship civilians with `ship.tradeEncounter` data
- New `createEncounterRing(ship)`: pulsing green torus ring around encounter ships
- New `checkTradeEncounterProximity(deltaTime)`: proximity detection with harvest bar, targeting corners, cooldown handling
- New `updateEncounterTargeting(ship)` / `hideEncounterTargeting()`: targeting corner overlay
- New `updateEncounterIcons()`: floating emoji icons above encounter ships (HTML overlay)
- New `openTradeEncounterDialog(ship)`, `acceptTradeEncounter()`, `declineTradeEncounter()`: dialog flow
- New `#tradeEncounterDialog` HTML element with Accept/Decline buttons
- New CSS for encounter dialog, floating icons
- `disposeTrafficShip()`: cleans up encounter ring mesh
- `cleanupExplorationTraffic()`: clears encounter state
- Touch handlers: added `#tradeEncounterDialog` to exclusion list
- New gameState fields: `activeTradeEncounter`, `tradeEncounterCooldown`
- Encounter ring position+pulse updated in `updateExplorationTraffic()` loop
- Lazy ring creation for async mesh loading

## Node-Driven Station Generation (Feature 9)

### What was implemented
Stations now derive from world nodes instead of random generation. Each system spawns exactly as many stations as it has nodes (1-2), inheriting the node's name, services, and economic identity. Station tabs are filtered based on node services.

### Problem Solved
The trade overlay showed production/consumption for systems, but players couldn't reliably trade because: station count was random (0-2, often 0), station type was random, station name was random, and node services were ignored.

### Changes
- `generateLevelConfig()`: replaced random station generation (0-2 random types) with node-derived station objects `{ nodeId, name, type, services }`
- `openDockingScreen()`: extracts station object, sets `lastDockedNode` from station.nodeId, calls `updateStationTabs()`
- `updateStationInterior()`: shows node name (e.g. "Forge Works") instead of random name, shows node type subtitle (e.g. "Refining & manufacturing hub"), hides upgrades panel if no `shipyard` service
- New `updateStationTabs(services)`: shows/hides tab buttons based on node services (outfitter requires `armory`, trading requires `trade`, etc.)
- `updateTradingUI()`: shows node economy context header with name, type, and industries
- HTML: added `#stationSubtitle` element, `#tradingNodeInfo` element
- `applySavedState()`: migrates legacy station format (string[] → object[]) for old saves
- Backward compat: legacy string station entries wrapped in objects automatically

## Star Map Mobile UX Overhaul (Feature 10)

### What was implemented
Five improvements to the galactic star map for mobile usability and trade information clarity.

### 1. Shape-Coded System Markers
Systems now have distinct shapes based on their primary economy type, replacing uniform circles:
- Core (population centers): Circle, blue `#88ccff`
- Industrial (manufacturing): Hexagon, orange `#dd8833`
- Agricultural: Circle, green `#44cc44`
- Mining/Extraction: Diamond, copper `#cc8866`
- Military: Pentagon, red-orange `#ff6644`
- Frontier: Triangle, muted `#999966`

Sizes increased to 9-14px radius (from 5-10) for better touch targets. Faction shown as subtle outline ring. Priority system determines primary type when a system has multiple node types.

### 2. Fuel Range Bubble + Unreachable Dimming
- Translucent radial gradient circle around current system showing max fuel range
- Dashed border at range edge
- Unreachable systems and their connections drawn at 30-35% opacity

### 3. Selection Card (Bottom Sheet)
Replaced the flat text info bar with a structured bottom card:
- Header: shape icon canvas + system name + faction + security pips + close button
- Body: two-column layout — BUYING (deficit goods with sell prices) and SELLING (surplus goods with buy prices)
- Green highlight on goods the player has in cargo
- Events row when active world events affect the system
- Full-width Jump button in footer

### 4. Double-Tap Jump
- Single tap: select system, show card
- Double tap (same system within 400ms): initiate jump if reachable with fuel
- Tap empty space: deselect, hide card
- 2-second charge-up provides cancel window

### 5. Profit Heatmap Overlay
Trade overlay rewritten with profit-focused features:
- Desaturation wash dims the base map
- Cargo-aware pulsing: systems that want player's current cargo get an animated gold ring + profit badge showing best sell price
- Export/import icon rows kept (▲/▼ with emoji icons)
- Directional chevrons replace static arrows — 3 animated `>` marks scroll along the path, with good icon at midpoint
- `requestAnimationFrame` loop runs when trade overlay is active for smooth animation
- Event markers retained with pulsing backgrounds

### Changes
- New `SYSTEM_TYPE_STYLES` constant: shape + color per economy type
- New `getSystemPrimaryType(sys)`: picks highest-priority node type (military > core > industrial > agri > extractor > frontier)
- New `drawSystemShape(ctx, x, y, r, type)`: canvas path for hexagon, diamond, pentagon, triangle, circle
- New `getSystemTradeNode(sysId)`: finds first trade-enabled node in a system
- New `updateSelectionCard(sysId)`: populates bottom sheet with trade data
- New `hideSelectionCard()`: hides card and deselects
- New `drawProfitChevrons()`: animated directional chevrons replacing `drawTradeFlowArrow()`
- New `startStarmapAnimation()` / `stopStarmapAnimation()`: rAF loop for trade overlay
- `renderStarMap()`: shape-coded markers, fuel range bubble, connection/system dimming, increased padding
- `renderTradeOverlay()`: complete rewrite with desaturation wash, cargo pulses, chevrons
- Canvas click handler: double-tap detection, card integration, larger hit radius
- `openStarMap()`: resets card state
- `closeStarMap()`: stops animation loop
- Trade toggle handler: starts/stops animation
- HTML: replaced `#starmapInfo` bar with `#starmapCard` bottom sheet structure
- CSS: replaced `.starmap-info` with `.starmap-card` styles, trade item rows, card columns
