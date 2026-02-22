# Dynamic Security & Pirate Ecosystem — Design

## Rationale
The economy runs and events disrupt it, but the player can't meaningfully *cause* disruption. Security is a static number, pirates are random encounters, and convoys are scenery. This feature makes security, pirates, and patrols into a living ecosystem where the player's actions (and inactions) create cascading trade opportunities.

## The Loop
```
Factory produces parts → Convoys carry parts to consumers
        ↓
Low security = more pirates → Pirates attack convoys
        ↓
Convoy destroyed = demand spike at destination
        ↓
Player sells scarce goods at high price
        ↓
Pirate activity triggers patrol response → Patrols drawn from other sectors
        ↓
Depleted sector becomes vulnerable → Pirates migrate there
        ↓
New sector spikes demand for weapons/munitions
        ↓
Player buys from the factory they just sold to → Trade chain
```

## Systems

### 1. Dynamic Security Level
**Currently:** `sys.security` is static (0-5), set at world generation.
**Change:** `sys.security` becomes dynamic, recalculated each economy tick.

```
effectiveSecurity = baseSecurity + patrolPresence - piratePresence
```

- `baseSecurity`: The original static value (0-5). Infrastructure floor.
- `patrolPresence`: Number of patrol ships currently assigned to this system (0-3). Each patrol adds +1 effective security.
- `piratePresence`: Pirate threat level (0.0 - 3.0). Floats based on migration.
- `effectiveSecurity`: Clamped 0-5. Used for pirate spawn rates, displayed on map.

Store on system: `sys.patrolPresence`, `sys.piratePresence`, `sys.effectiveSecurity`.

### 2. Patrol Pool & Production
**Global patrol pool:** `world.patrols = { total, deployed, reserve }`

- `total`: Maximum patrol capacity. Starts at ~8 for the sector.
- `deployed`: Currently assigned to systems (sum of all `sys.patrolPresence`).
- `reserve`: `total - deployed`. Available for redeployment.

**Production:** Military nodes with `ordnanceWorks` industry consume munitions + fuel to produce patrol capacity. Each economy tick:
```
if (node has ordnanceWorks && node.inventory.munitions.stock >= 2 && node.inventory.fuel.stock >= 1) {
    consume 2 munitions, 1 fuel
    world.patrols.total += 0.1 (caps at ~12)
}
```

If no military production, `total` slowly decays (0.05/tick) — patrols wear out without resupply.

**Distribution:** Each tick, patrols redistribute:
1. Systems with high `piratePresence` request more patrols.
2. Patrols move from low-threat to high-threat systems (1 patrol/tick max transfer).
3. When patrols move to a system, they leave the source system.
4. Priority: military systems > core systems > others.

### 3. Pirate Presence & Migration
**Per-system value:** `sys.piratePresence` (float 0.0 - 3.0).

**Base generation:** Each tick, pirate presence grows in low-security systems:
```
growthRate = max(0, (2 - effectiveSecurity) * 0.15)
sys.piratePresence += growthRate
```
Low security systems grow faster. High security suppresses growth.

**Migration:** When patrols increase in a system, pirates migrate:
```
if (patrolPresence > piratePresence * 0.7) {
    // Pirates being pushed out
    overflow = piratePresence * 0.3
    sys.piratePresence -= overflow
    // Distribute to connected systems with lower security
    for each connected system with lower effectiveSecurity:
        neighbor.piratePresence += overflow / numNeighbors
}
```

**Decay:** Pirates slowly decay in high-security systems: `-0.1/tick if effectiveSecurity >= 4`.

**Pirate spawn rate in exploration mode:**
```
pirateChance = 0.1 + piratePresence * 0.15  // 10% base + 15% per presence point
maxPirateShips = floor(1 + piratePresence)
```

### 4. NPC Trade Convoys
**New entity:** Convoys are multi-ship groups traveling between connected systems.

**Spawning:** Each economy tick, for each NPC trade flow:
```
if (tradeSurplus > 20 at source && tradeDeficit < -20 at destination) {
    spawn convoy with 2-4 ships carrying that good
    convoy.goodId, convoy.quantity, convoy.sourceSys, convoy.destSys
}
```

**In exploration mode:** Convoys appear as a cluster of civilian ships with a convoy marker (📦 icon). They travel from source edge to destination edge (or to the warp gate).

**Vulnerability:** Convoys have a `protection` stat based on origin system's security:
- Security 4-5: escorted (1 military ship), hard for pirates to attack
- Security 2-3: unescorted, pirates will engage
- Security 0-1: easy prey

**Convoy destruction:**
- If pirates destroy a convoy (or player attacks it), the goods never arrive.
- Destination system's demand for those goods spikes: `+0.8 demandSpike` for 3 ticks.
- Source system accumulates surplus.
- Creates a `convoyDestroyed` world event visible on the map.

**Player interaction:**
- Player can follow/escort convoys (passive — just being in the same system deters pirates).
- Player can attack convoys (becomes hostile to their faction).
- Player can lure pirates to convoy routes by aggravating pirate ships nearby (attacking them triggers reinforcements that spill over to convoy lanes).

### 5. Pirate Activity → Security Response
When `piratePresence > 1.5` in any system for 2+ consecutive ticks:
```
// Trigger patrol redeployment
nearestMilitarySys = find closest system with military node
if (nearestMilitarySys.patrolPresence > 0) {
    transfer 1 patrol from nearestMilitarySys to affected system
    // This creates a gap at the source
}
```

The redeployment is visible as a world event: "🛡 Security Reinforcements — Patrols redeploying to [System]"

### 6. Goods-for-Goods Trading (Barter)
**At stations:** New "Barter" option alongside Buy/Sell:
- Player offers X units of Good A, receives Y units of Good B.
- Exchange rate based on relative prices: `Y = X * (priceA / priceB) * 1.1` (10% fee vs 15% for sell-then-buy).
- Only available for goods the station actually has in stock.
- Creates trade chains: sell metals at factory → receive consumer goods → sell consumer goods at core world.

### 7. Visual Indicators

**Star map:**
- Security pips already exist — now show `effectiveSecurity` instead of static `security`.
- New icon next to system when pirate presence > 1.0: ☠ with count.
- Patrol presence shown as shield icon: 🛡 with count.
- Convoy routes shown as dotted lines when trade overlay is active.

**Exploration mode:**
- Patrol ships: federation/military ships with patrol behavior (circle the system, engage pirates).
- Pirate density: more pirates spawn in higher-presence systems.
- Convoy groups: cluster of 2-4 ships with convoy icon, traveling together.

**Bar rumors:** Dynamic rumors about pirate activity shifts, patrol movements, convoy losses.

## Implementation Phases

### Phase 1: Dynamic Security + Pirate Migration
- Add `patrolPresence`, `piratePresence`, `effectiveSecurity` to systems
- `tickSecurity()` function: recalculate each economy tick
- Pirate growth, migration, and decay logic
- Update exploration pirate spawn rates to use `piratePresence`
- Security pips show `effectiveSecurity`

### Phase 2: Patrol Pool & Production
- `world.patrols` global pool
- Military production of patrols
- Patrol distribution algorithm
- Patrol redeployment on pirate threats
- Patrol ships visible in exploration mode

### Phase 3: NPC Trade Convoys
- Convoy spawn logic in economy tick
- Convoy ships in exploration mode (cluster travel)
- Convoy destruction → demand spike
- Convoy events on star map

### Phase 4: Barter Trading
- Barter UI in trading screen
- Exchange rate calculation
- Station inventory integration

## Files Modified
- `index.html`:
  - New `tickSecurity()` function (called from `worldEconomyTick()`)
  - Modify `generateExplorationTraffic()`: pirate count from `piratePresence`, patrol ships from `patrolPresence`
  - New `spawnConvoy()` and `updateConvoys()` functions
  - Modify `renderStarMap()`: pirate/patrol indicators
  - Modify `populateBarSection()`: security-related rumors
  - New barter UI in trading section
  - `getSaveableState()` / `applySavedState()`: persist new fields

## Edge Cases
- All patrols destroyed by pirate production outpacing military: spiral of insecurity (intended — creates opportunity)
- Player camps one system: pirates accumulate elsewhere
- Save/load: new fields need defaults for old saves
- Arena mode: no security system (exploration only)
