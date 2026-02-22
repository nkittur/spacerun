# Space Run - Feature Todos

## In Progress


## Pending

### 11. Dynamic Security & Pirate Ecosystem
**Design:** [planning/dynamic-security.md](planning/dynamic-security.md)
**Goal:** Pirates, patrols, convoys, and security form a living ecosystem that creates emergent trade opportunities.

**Interaction Pattern Example:**
A merchant unloads industrial parts cheap → Player finds the supplying factory world → Follows a convoy through low-security space → Draws pirates onto the convoy, destroying it → Sells the parts as demand spikes → Meanwhile pirate activity triggers more patrols in that sector → Patrols push pirates into a previously safe sector → New sector spikes weapon demand → Player buys weapons from the factory they just sold to (trading for goods is cheaper than credits) → Patrol redeployment creates gaps elsewhere → Ripple effects cascade.

**Systems Needed:**
- **Security-driven pirate spawning**: Lower security = more pirates in exploration. Pirate density scales with inverse security level.
- **Security patrols**: Federation/military patrols spawn in higher-security systems. Total patrol count is a global pool (not infinite).
- **Patrol production**: Military starbases produce patrols via munitions/fuel consumption. More production = more patrols available.
- **Pirate migration**: When patrols increase in a sector, pirates migrate to connected lower-security systems. Pirate presence is a per-system value that shifts over time.
- **NPC trade convoys**: Visible multi-ship convoys traveling between connected systems carrying specific goods. Can be attacked/destroyed.
- **Convoy destruction → demand spikes**: When a convoy is destroyed, the destination system's demand for those goods spikes (supply cut off).
- **Pirate activity → security response**: High pirate activity in a system triggers patrol redeployment from adjacent sectors, creating security gaps elsewhere.
- **Goods-for-goods trading**: Option to trade cargo for cargo at stations (barter), cheaper than selling for credits and rebuying.
- **Security level as dynamic stat**: System security fluctuates based on patrol presence vs pirate presence ratio, rather than being static.

## Review

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

