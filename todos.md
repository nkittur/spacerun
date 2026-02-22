# Space Run - Feature Todos

## In Progress


## Pending


## Review

### 11. Dynamic Security & Pirate Ecosystem
**Design:** [planning/dynamic-security.md](planning/dynamic-security.md)
Dynamic security, pirate presence, patrol pools, NPC trade convoys, and cascading security events. Pirates grow in low-security systems, migrate when patrols push them out. Patrols redistribute from reserves and military production. Convoys spawn between surplus/deficit systems, can be intercepted by pirates causing demand spikes. Star map shows ☠/🛡 indicators. Bar rumors reflect security state.

### 10. Star Map Mobile UX Overhaul
Shape-coded system markers (hexagon=industrial, diamond=mining, pentagon=military, circle=core/agri, triangle=frontier). Fuel range bubble + unreachable dimming. Bottom sheet selection card with Buying/Selling columns and profit context. Double-tap to jump. Animated profit heatmap overlay with cargo-aware pulsing and directional chevrons.

### 9. Node-Driven Station Generation for Galactic Trading
Stations now derive from world nodes instead of random generation. Each system spawns 1-2 stations matching its nodes, with correct names, services, and economic identity. Tabs filtered by node services (e.g. no Outfitter at mining outposts). Trading UI shows node economy context.

### 8. NPC Ship Encounters — Trade Opportunities
**Design:** [planning/npc-trade-encounters.md](planning/npc-trade-encounters.md)
3 encounter types (Cargo Dump, Fuel Buyer, Trade Intel) on 1-2 civilian ships per system. Pulsing green ring + emoji icon indicators. Proximity + 1s harvest bar interaction. Dialog with Accept/Decline. Targeting corners when in range.

### 7. World Events Affecting Economy
**Design:** [planning/world-events.md](planning/world-events.md)
5 event types (pirate blockade, industrial accident, military mobilization, famine, trade boom) that dynamically affect the economy. Visible in bar rumors, trade overlay markers, and info panel. Fixed NPC trade flow bug.

### 6. Improved Trade Overlay on Galaxy Map
**Design:** [planning/trade-overlay-v2.md](planning/trade-overlay-v2.md)
Emoji icons for trade goods, exports/imports rows with ▲/▼ labels, flow arrows with good icons at midpoint. Replaces v1 colored dots and numbered badges.

### 5. Station Re-docking Cooldown
**Design:** [planning/station-redock-cooldown.md](planning/station-redock-cooldown.md)
Proximity-based cooldown prevents instant re-dock after departing. Clears when player leaves dock radius.

### 4. Supply Chain Visualization on Galaxy Map
**Design:** [planning/supply-chain-map.md](planning/supply-chain-map.md)
Trade overlay toggle on star map showing production dots, surplus/deficit badges, flow arrows, and trade details per system.

### 3. Ship Outfitter UI
**Design:** [planning/ship-outfitter.md](planning/ship-outfitter.md)
Visual outfitter with 3D ship preview, hardpoint/systems/inventory/shop panels in two-column layout.

### 2. Exploration Jump Requires Equipment
**Design:** [planning/jump-drive-equipment.md](planning/jump-drive-equipment.md)
FTL Booster equipment item (500 CR) required for in-flight jumps. Debug mode bypasses.

### 1. Gate Star Map Not Closeable
**Design:** [planning/gate-map-lock.md](planning/gate-map-lock.md)
When the star map is opened by reaching a warp gate, the Close button is hidden — player must select a destination and jump.

## Done

