# Supply Chain Visualization on Galaxy Map — Design

## Rationale
The game has a rich economy with multi-tier production chains (ore→metals→parts, biomass→rations, etc.) and NPC trade flowing between connected systems. But players have no way to see this — they must visit each station and check prices manually. A visual overlay on the star map showing production/consumption, surpluses/shortages, and trade flows would let players plan profitable trade routes at a glance. This transforms the economy from an opaque system into a strategic tool.

## Design

### Toggle Mode
- Add a **"Trade Overlay"** toggle button on the star map UI (top-right corner)
- When active, the map shows supply chain information overlaid on the normal star map
- Only shows data for **discovered** systems (undiscovered remain dark)
- Toggle off returns to the standard map view

### Per-System Indicators
Each discovered system node on the map shows:

#### Production Icons
- Small colored squares/dots next to the system circle showing goods it **produces**
- Uses the `TRADE_GOODS[goodId].color` for each good
- Only shows goods where the system has industries with that output

#### Surplus/Shortage Badges
- Green up-arrow badge: system has surplus (stock > desiredStock + 10) for any good
- Red down-arrow badge: system has shortage (stock < desiredStock - 10) for any good
- Number showing count of goods in surplus/shortage state

### Trade Flow Lines
- When a specific system is **selected** (clicked), show trade flow lines to/from connected systems
- Line color = good's color, line opacity = flow magnitude
- Arrow direction: from surplus system → deficit system
- Only show active flows (where NPC trade flow would actually move goods)

### Tooltip Panel (on hover/click)
When clicking a system in trade overlay mode, show a detail panel:
```
[System Name] — [Faction]
PRODUCES: Metals (surplus +15), Fuel (surplus +8)
NEEDS:    Rations (deficit -20), Electronics (deficit -5)
STOCKS:   [bar chart of top goods by scarcity]
```

### Implementation Approach

#### Star Map Changes
- Add `gameState.starmapTradeOverlay` boolean (default false)
- Add toggle button in star map HTML
- Modify `renderStarMap()` to call `renderTradeOverlay()` when active

#### renderTradeOverlay(ctx, systems, canvasInfo)
- After the base map is drawn, overlay trade data
- For each discovered system:
  - Collect all nodes in that system
  - Aggregate production outputs and consumption inputs
  - Calculate net surplus/deficit per good
  - Draw small colored squares arranged around the system circle
  - Draw surplus/deficit badge (green/red with count)
- For selected system:
  - Draw flow arrows to connected systems with trade imbalances

#### Trade Detail Panel
- Reuse the existing star map info panel (right side)
- When trade overlay is on and a system is selected, append trade info below the existing system details

### State Changes
- `gameState.starmapTradeOverlay`: boolean toggle
- No persistent state needed — all data computed from existing node inventories

### Files Modified
- `index.html`:
  - Star map HTML: add Trade Overlay toggle button
  - `renderStarMap()`: call overlay renderer when active
  - New `renderTradeOverlay()` function
  - New `getSystemTradeProfile(sysId)` helper — aggregates node inventories
  - Star map click handler: show trade details in info panel

### Edge Cases
- System with no nodes (shouldn't happen but guard)
- System not yet discovered: skip overlay
- Node inventory not initialized: use empty defaults
- Many goods in surplus/deficit: limit display to top 4 by magnitude
- Mobile: badges may be too small — consider showing only on selected system

### Incremental Approach
Phase 1 (this implementation):
- Trade overlay toggle
- Per-system surplus/deficit badges
- Production/consumption icons around system nodes
- Trade detail in info panel on click

Phase 2 (future):
- Animated flow lines between systems
- Convoy entities on the map
- Price comparison heatmap mode
- Trade route planner (auto-suggest profitable routes)
