# Gate Star Map Lock — Design

## Rationale
When the player reaches a warp gate at the end of a system, the star map opens to let them choose a destination. Currently they can close the map and drift backwards, which feels wrong — the gate is a one-way transition point. Making the map non-closeable when triggered by a gate forces a meaningful choice and prevents exploiting the gate zone (e.g., farming the system endlessly).

When the map is opened manually (M key / MAP button), it should remain closeable — the player is just checking the map, not committing to a jump.

## Design

### State
- `gameState.atWarpGate` already tracks whether the map was opened via gate
- No new state needed — just use this flag to conditionally hide the Close button

### UI Changes
- `openStarMap()`: if `gameState.atWarpGate` is true, hide the Close button (`starmapCloseBtn`)
- `openStarMap()`: if not at gate, show the Close button as normal
- M key handler: when `atWarpGate` is true and map is open, don't allow M to close it

### Edge Cases
- Player presses ESC: should also be blocked when at gate
- Player dies while map is open: `playerDestroyed()` already resets `atWarpGate`
- Player has no fuel to reach any system: map stays open, all Jump buttons disabled — player is stuck (design decision: this is intentional, fuel management matters)

### Files Modified
- `index.html`: `openStarMap()`, M key handler, starmapCloseBtn click handler
