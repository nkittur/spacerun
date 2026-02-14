# Combat Zone Pacing Tuning - Design Document

## Problem
Ships scroll through and off-screen before any meaningful combat happens. The zone needs to feel like an active battlefield where ships actually fight, disable each other, and create harvesting opportunities.

## Changes Summary

### 1. Scroll Speed -30%
- **Where**: `totalScrollDistance` in combat zone init (line ~12243)
- **How**: Multiply total scroll distance by ~1.43x (equivalent to 30% slower scrolling)
- **Effect**: Zone lasts ~37s instead of ~26s, giving ships much more time to fight
- **Why at totalScrollDistance**: Changing `WORLD_SCROLL_SPEED` would affect all game modes. Instead we increase the combat zone's total scroll distance, making it take longer to complete without touching the global constant.

### 2. Projectile Speed +50%
- **Where**: `COMBAT_ZONE_SHIP_TYPES` bulletSpeed values, and `fireCZBurstShot` hardcoded speeds
- **Before → After**:
  - basic: 0.1 → 0.15
  - light: 0.12 → 0.18
  - heavy: 0.08 → 0.12
  - shooter: 0.1 → 0.15
  - fast: 0.1 → 0.15
  - challenger: 0.08 → 0.12
  - fireCZBurstShot autocannon: 0.07 → 0.105
  - fireCZBurstShot burst: 0.12 → 0.18
  - mortar projectile speed: 0.04 → 0.06

### 3. Weapon Cooldowns -20%
- **Where**: `COMBAT_ZONE_SHIP_TYPES` fireRate values
- **Before → After**:
  - basic: 3000 → 2400
  - light: 2000 → 1600
  - heavy: 2500 → 2000
  - shooter: 1500 → 1200
  - fast: 4000 → 3200
  - challenger: 2000 → 1600

### 4. Larger Ships: More Hardpoints + 50% Bigger
- **Multi-shot**: `ship.hardpoints` property — number of simultaneous shots fired
  - basic: 1 (no change)
  - light: 1 (no change)
  - fast: 1 (no change)
  - shooter: 2 (fires two shots with slight offset)
  - heavy: 3 (triple fire, spread pattern)
  - challenger: 4 (quad fire, intimidating)
- **Visual size**: scale increased by 50% for heavy, challenger, and shooter
  - shooter: 1.1 → 1.65
  - heavy: 1.8 → 2.7
  - challenger: 2.0 → 3.0

### 5. HP Tuning for Combat Pacing
**Goal**: Two equal ships fighting should result in one being disabled by about halfway through the zone (~18.5 seconds).

**Math** (post-changes, per ship type, accounting for hardpoints):

| Type | Old HP | New HP | DPS (hardpoints × dmg/cooldown) | Time to disable | Half-zone? |
|------|--------|--------|------|-----------------|------------|
| basic | 90 | 55 | 3.33 (1 × 8/2.4) | 16.5s | ~yes (18.6s) |
| light | 60 | 35 | 3.13 (1 × 5/1.6) | 11.2s | yes |
| fast | 45 | 25 | 1.56 (1 × 5/3.2) | 16.0s | yes |
| shooter | 150 | 65 | 6.67 × 2 = 13.33 (2 × 8/1.2) | ~9.8s vs peer | yes |
| heavy | 300 | 120 | 7.5 × 3 = 22.5 (3 × 15/2.0) | ~16s vs peer | yes |
| challenger | 240 | 110 | 9.38 × 4 = 37.5 (4 × 15/1.6) | ~12s vs peer | yes |

Note: actual times vary due to ±random on fireRate/speed, hit chance (aiming + movement), and level scaling. These are best-case estimates; real fights take ~1.5-2x longer due to maneuvering and missed shots, which still puts disables comfortably within the zone duration.

## Implementation Checklist

- [x] Increase combat zone totalScrollDistance by 1.43x for 30% slower effective scroll
- [x] Update all COMBAT_ZONE_SHIP_TYPES bulletSpeed values (+50%)
- [x] Update fireCZBurstShot bullet speeds (+50%)
- [x] Update mortar projectile speed in fireCZShipWeapon (+50%)
- [x] Update all COMBAT_ZONE_SHIP_TYPES fireRate values (-20%)
- [x] Add `hardpoints` field to COMBAT_ZONE_SHIP_TYPES
- [x] Increase scale by 50% for shooter, heavy, challenger
- [x] Modify fireCZShipWeapon standard case to fire multiple shots based on hardpoints
- [x] Modify fireCZBurstShot to fire multiple simultaneous bullets for multi-hardpoint ships
- [x] Update HP values for combat pacing
- [x] Update `fireCZShipWeapon` for mortar and beam_sweep with hardpoint offsets
