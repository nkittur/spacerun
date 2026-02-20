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
