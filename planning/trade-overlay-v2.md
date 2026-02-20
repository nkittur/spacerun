# Improved Trade Overlay — Design

## Rationale
The v1 trade overlay uses colored dots for production and green/red circles with numbers for surplus/deficit. Players can't tell what the dots represent, and the numbered badges are cryptic. A clearer approach uses recognizable emoji icons for each trade good, arranged in labeled rows that immediately communicate "this system exports X" and "this system needs Y".

## Design

### Icons for Trade Goods
Add an `icon` property to each entry in `TRADE_GOODS`:
- Ore: ⛏  Hydrocarbons: 🛢  Biomass: 🌿
- Metals: ⚙  Polymers: 🧪  Rations: 🍞
- Consumer Goods: 📦  Industrial Parts: 🔩  Electronics: 💡
- Fuel: ⛽  Medical: 💊  Munitions: 💥  Narcotics: 💜

### Per-System Display (replaces colored dots and numbered badges)
For each visited system, show two rows of icons near the system node:

**Exports row** (above the system circle, green-tinted):
- Small emoji icons for goods the system has in surplus (stock > desiredStock + 10)
- Drawn with a subtle green underline/glow

**Needs row** (below the system name label, orange-tinted):
- Small emoji icons for goods the system has a deficit in (stock < desiredStock - 10)
- Drawn with a subtle orange underline/glow

If a system has no significant surplus/deficit, nothing is shown (clean map).

### Flow Arrows (when system selected)
Keep directional arrows between selected system and its connections, but:
- Color the arrow using the good's color
- Draw the good's icon at the arrow's midpoint so players know what's flowing

### Info Panel (on click)
When trade overlay is on and a system is clicked, show:
- "Exports: [icon] Ore (+15), [icon] Fuel (+8)"
- "Needs: [icon] Rations (-20), [icon] Electronics (-5)"

### Implementation
- Add `icon` field to each `TRADE_GOODS` entry
- Rewrite `renderTradeOverlay()` to draw emoji icon rows instead of colored squares and badge circles
- Update `drawTradeFlowArrow()` to draw good icon at midpoint
- Update info panel text to include icons

### Files Modified
- `index.html`:
  - `TRADE_GOODS`: add `icon` property
  - `renderTradeOverlay()`: rewrite overlay rendering
  - `drawTradeFlowArrow()`: add icon at midpoint
  - Star map click handler: update trade info text with icons
