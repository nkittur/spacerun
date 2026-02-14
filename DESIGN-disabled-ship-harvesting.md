# Disabled Ship Harvesting - Design Document

## Overview
When a combat zone ship reaches 0 HP, instead of exploding immediately, it enters a **disabled** state. The player can then harvest the wreck for enhanced loot. The wreck eventually explodes after taking additional damage (10% of max HP).

## State Machine

```
[Alive] ---(hp <= 0)---> [Disabled + Invulnerable]
                                  |
                          (~1s grace period)
                                  |
                          [Disabled + Harvestable]
                                  |
                    (takes 10% maxHp more damage)
                                  |
                          [Explodes / Drops Loot]
```

## Design Decisions

### Why a grace period?
Bullets already in-flight when the ship becomes disabled would instantly destroy the wreck. A ~1s invulnerability window lets those clear, giving the player a real opportunity to harvest.

### Why gray targeting corners?
The existing targeting-corner system (used for planets) provides a recognizable visual language. Gray communicates "inert/neutral" - the ship is no longer a threat, it's a resource. Corners are drawn as 3D meshes in the combat zone (not HTML overlay like planets) since combat zone ships live in world-space.

### Loot scaling
Disabled ships that are harvested (destroyed by player after disabling) drop enhanced loot:
- **Base loot**: same as current (createLoot + tryDropWeapon)
- **Bonus resources**: scaled by ship level, ship type/size, and a "rarity" factor
- **Equipment chance**: small chance to drop equipment (shields, drones, missiles) in addition to weapons
- Level multiplier: `1 + (gameState.level - 1) * 0.15`
- Size multiplier from ship type scale (bigger ships = more loot)

### Ship properties added
```javascript
ship.disabled = false;          // Is this ship in disabled state?
ship.disabledTime = 0;          // When it became disabled (performance.now())
ship.disabledHp = 0;            // HP pool for harvesting (10% of maxHp)
ship.disabledInvulnerable = true; // Grace period active?
ship.disabledCornerMeshes = [];  // Visual corner bracket meshes
ship.disabledBy = null;          // 'player' or 'npc' - who gets loot credit
```

## Implementation Plan

### 1. Ship state transition (hp <= 0 -> disabled)
- [x] Modify both NPC-bullet and player-bullet death checks (lines ~13443 and ~13488)
- [x] Instead of immediate death, set `ship.disabled = true`, stop AI, stop firing
- [x] Record `ship.disabledTime = performance.now()`
- [x] Set `ship.disabledHp = Math.ceil(ship.maxHp * 0.1)` as remaining harvest HP
- [x] Track who disabled it (`ship.disabledBy = 'player'` or `'npc'`)

### 2. Invulnerability window (~1 second)
- [x] `ship.disabledInvulnerable = true` on disable
- [x] After 1000ms, set to false (checked in updateCombatZone)
- [x] During invulnerability, skip all damage from bullets

### 3. Visual feedback - gray targeting corners
- [x] Create 4 corner bracket meshes (3D planes) around the disabled ship
- [x] Gray color (0.6, 0.6, 0.6) with slight pulse animation
- [x] Corners track ship position as it scrolls with the world
- [x] Clean up corner meshes on ship disposal

### 4. Disabled ship behavior
- [x] No AI movement (drift only, slowing down)
- [x] No target acquisition, no firing
- [x] Still scrolls with the world
- [x] Engine glow dims/changes to gray
- [x] Other ships stop targeting disabled ships

### 5. Damage and destruction of disabled ships
- [x] After invulnerability ends, any damage reduces `ship.disabledHp`
- [x] When `disabledHp <= 0`, ship explodes with enhanced loot
- [x] Enhanced loot function: `createDisabledShipLoot(ship)`

### 6. Enhanced loot drops
- [x] More resources than normal death (scaled by level and ship size)
- [x] Higher weapon drop chance (2x-3x normal)
- [x] New: chance to drop equipment (shields, drones, missiles)
- [x] Credits bonus scaled by level

### 7. Cleanup
- [x] `disposeCombatZoneShip()` updated to clean up corner meshes
- [x] Off-screen disabled ships removed normally
- [x] Target-finding skips disabled ships
- [x] `getCombatZoneTargetPos()` returns null for disabled targets
- [x] Disabled ships excluded from peace-timer faction checks
- [x] Disabled ships excluded from world-scroll loop (handled by updateDisabledShips)

### 8. Proximity harvesting for CZ disabled ships
- [x] `checkBoardingProximity()` extended to also scan `cz.ships` for `disabled && !disabledInvulnerable`
- [x] Uses `ship.currentX`/`ship.currentY` for CZ ships (not Babylon `.position`)
- [x] Shows "HARVESTING..." label (vs "BOARDING..." for arena ships)
- [x] On completion calls `harvestCZDisabledShip()` → `createDisabledShipLoot()` + dispose

### 9. Arena mode disable chance
- [x] Player bullets: reduced from 30% to 4% chance to disable instead of destroy
- [x] Crossfire bullets: reduced from 35% to 4%

## Key Functions Added

| Function | Purpose |
|----------|---------|
| `disableCombatZoneShip(ship, disabledBy)` | Transitions ship to disabled state; dims visuals, stops AI, creates corners |
| `createDisabledCorners(ship)` | Creates 4 gray L-bracket corner meshes around the wreck |
| `updateCZDisabledShips(cz, deltaTime, scrollDist)` | Per-frame update: drift, scroll, corner tracking, invuln timer, cleanup |
| `createDisabledShipLoot(ship)` | Enhanced loot drops: resources, credits, weapons, equipment; scaled by level/size |
| `harvestCZDisabledShip(ship)` | Proximity-board completion for CZ disabled ships: loot + dispose |

## Loot Comparison (Normal Death vs Harvested)

| Aspect | Normal Death | Harvested (Player) |
|--------|-------------|-------------------|
| Resources | Base pieceCount by type | pieceCount * levelMult * sizeMult |
| Resource amounts | 1-3 per piece | 1-3 + floor(level * 0.3) per piece |
| Resource types | By enemy type | Richer pool, Exotic at level 6+ |
| Credits | 10 + random(15) | Scaled by type, level, and size |
| Weapon drop % | 1-8% | 3-25% (2-3x boost) |
| Equipment drop | Never | 0.5-10% chance |
| Score | 10 * wave | 20 * wave |
