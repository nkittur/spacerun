# Exploration Jump Drive Equipment — Design

## Rationale
Currently, players can jump to another system from anywhere by pressing M and using the star map. This trivializes warp gates — why bother reaching the gate if you can jump from anywhere? Making "jump from exploration" require a special equipment item ("FTL Booster") creates a meaningful progression:

- **Early game**: Players must reach warp gates to leave a system, encouraging exploration
- **Mid game**: Players buy an FTL Booster, enabling convenience jumps from anywhere
- **Design tension**: FTL Booster costs credits/resources, so it's a trade-off vs other upgrades

In debug mode, the booster is always available so devs can test freely.

## Design

### Equipment Item
- **Name**: "FTL Booster" (distinct from the jump drive upgrade which controls range/efficiency)
- **Stored in**: `gameState.equipment.ftlBooster` (boolean, default false)
- **Purpose**: Enables opening star map + jumping from exploration mode (not at a gate)

### Behavior
- **Without FTL Booster**: M key and MAP button only work when `atWarpGate` is true. In exploration mode, pressing M shows a brief message "FTL Booster required for in-flight jumps" (toast notification).
- **With FTL Booster (or debug mode)**: M key and MAP button work as currently — open star map anywhere outside combat.
- **At warp gate**: Star map always opens regardless of equipment (the gate provides the jump capability).

### Purchase
- Available in the Outfitter section at stations
- Cost: 500 CR (significant early-game investment)
- One-time purchase, persists across deaths (it's ship equipment)

### State Changes
- Add `gameState.equipment` object: `{ ftlBooster: false }`
- Save/load: include `equipment` in save state
- `applySavedState()`: restore with defaults

### UI Changes
- `openStarMap()`: Add check — if not at gate and not debug mode and no ftlBooster, return early
- M key handler: Same check, plus show toast if blocked
- MAP button handler: Same check
- Outfitter section: Add FTL Booster purchase option

### Files Modified
- `index.html`: `openStarMap()`, M key handler, MAP button handler, outfitter UI, gameState, save/load

### Edge Cases
- Player sells ship with booster? Not applicable — equipment is per-save, not per-ship
- Player dies? Equipment persists (not lost on death, same as upgrades)
