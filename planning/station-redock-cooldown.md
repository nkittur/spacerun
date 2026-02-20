# Station Re-docking Cooldown — Design

## Rationale
After departing a station, the player is placed at `starbase.position.y - 1`, which is still within the dock radius of 2.0 units. This causes the docking progress bar to immediately start filling again, re-docking the player if they don't move away fast enough. The fix is a proximity-based cooldown: ignore docking checks until the player has left the station area.

## Design

### Approach
- On departure, set `gameState.dockCooldownStation` to a reference of the current starbase
- In the docking proximity check, skip if `dockCooldownStation` matches the current starbase
- Each frame, check if the player has moved outside the dock radius — if so, clear the cooldown
- This means the player can re-dock at the same station, but only after physically leaving and returning

### State Changes
- `gameState.dockCooldownStation`: reference to the starbase mesh the player just departed from (null when no cooldown)

### Files Modified
- `index.html`:
  - `departStarbase()`: set `gameState.dockCooldownStation = gameState.starbase`
  - Docking proximity check (~line 7749): skip if `dockCooldownStation === starbase`
  - After distance check: clear cooldown when player is outside dock radius

### Edge Cases
- Starbase gets disposed while cooldown is active: cooldown reference becomes stale, but since the starbase is gone the check is never reached
- Player warps away: cooldown is irrelevant in new system
