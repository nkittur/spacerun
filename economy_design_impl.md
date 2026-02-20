# Economy & Persistent World - Implementation Plan

## Current State Summary

Space Run is currently a **run-based roguelike**: linear level progression via warp gates, permadeath with game-over screen, per-run credits/resources that convert to meta-currencies on death, score tracking, and a "Play Again" loop. The game already has exploration mode, factions, NPC traffic, combat zones, stations, and procedural star systems -- all good foundations for a persistent open world.

This plan converts the game into a **persistent open-world space trader** (Escape Velocity / Starsector style) and implements the economy system from `economy_design_starter.md`.

---

## Phase 0: Reframe from Roguelike to Persistent World

**Goal:** Remove all run-based language, mechanics, and UI. Establish persistence as the default.

### 0A. Death & Respawn (replace permadeath)
- **Remove `gameOver()` function** and the game-over panel (`#gameOver`, `#restartBtn`, `#finalCredits`, `#runSummary`, `#metaGains`)
- **New `playerDestroyed()` function:**
  - Fade to black, show "Ship Destroyed" overlay (not game over)
  - Penalty: lose 20% of credits, lose all cargo
  - Respawn at last docked station
  - Save immediately after respawn
- **Remove `convertRunResourcesToMeta()`** -- resources persist directly, no conversion needed
- **Remove `metaState.totalRuns` and `metaState.bestLevel`** tracking

### 0B. Remove Linear Level Progression
- **Remove `gameState.level`** as a linear counter (1, 2, 3...)
- **Remove `generateLevelConfig(levelNum)`** and its wave/threat scaling
- **Remove `startNewLevel(config)`** in its current form
- **Remove warp gate choice UI** (the two-gate picker with WAV/THR/STA previews)
- **Keep `gameState.wave`** internally for difficulty scaling, but rename to `gameState.combatDifficulty` and base it on the current system's danger rating rather than a global counter
- **Keep `enterExplorationMode()`** -- this becomes the default gameplay state when arriving in a system

### 0C. Remove Run-Based Resets
- **Gut `resetGame()`**: it currently wipes everything. Replace with `respawnPlayer()` that only resets health/position, not inventory/credits/progression
- **Remove score system** (`gameState.score` and all `+= score` calls) -- credits are the only currency that matters now
- **Credits persist across sessions** -- remove the reset to 0 in `resetGame()`
- **Stats become lifetime stats**, not per-run (rename `gameState.stats` entries accordingly; remove the reset in `resetGame()`)

### 0D. Title Screen & Save System
- **"New Game"** creates a fresh persistent save (new world seed, starter ship, starting system)
- **"Continue"** loads the persistent save (same as now, but now it's the primary path)
- **Remove "Play Again"** button entirely
- **Auto-save** on: station dock, system transition, every 60 seconds of play
- **Remove "Research Lab"** button (meta-progression goes away; tech unlocks become in-world purchases or quest rewards instead)

### 0E. Documentation Updates
- Update `CLAUDE.md` to remove arena/wave/run references, describe persistent world
- Update `EXPLORATION_MODE_STRATEGY.md` to remove level-end/gate language
- Update `docs/stellar-system.md` to remove gate preview icons section, update fuel = game over to fuel = stranded

---

## Phase 1: Persistent Star Map

**Goal:** Replace the linear level chain with a connected graph of star systems the player can freely travel between.

### 1A. World Graph Data Structure

```javascript
// Persistent world state
gameState.world = {
    seed: <number>,              // World generation seed
    systems: {                   // Map of systemId -> system data
        "sol": {
            name: "Sol",
            x: 0, y: 0,         // Position on star map
            starType: "YellowDwarf",
            securityLevel: 3,    // 1-5, affects piracy
            faction: "federation",
            nodes: ["sol_earth", "sol_mars_station", ...],
            connections: ["alpha_centauri", "barnard", ...],  // Adjacent systems
            discovered: true,
            visited: true
        },
        ...
    },
    nodes: {                     // Map of nodeId -> node (planet/station)
        "sol_earth": {
            name: "Earth",
            systemId: "sol",
            type: "core",        // extractor|agri|industrial|core|frontier|military
            population: "coreWorld",  // outpost|colony|coreWorld
            industries: ["consumerPlant", "electronicsPlant"],
            inventory: { ... },  // Per-good stock levels (see Phase 2)
            services: ["trade", "repair", "fuel", "armory"],
            legality: { narcotics: "contraband" }
        },
        ...
    },
    currentSystem: "sol",
    lastDockedNode: "sol_earth"
};
```

### 1B. Starter Sector Map (10-15 systems)

Design a hand-crafted starter sector that creates natural trade routes. Each system has 1-3 nodes. Systems are connected in a graph (not a line).

```
Suggested layout (connections shown as --):

        [Forge] (industrial)
         /    \
   [Haven]----[Nexus] (core)
    (agri)    / |   \
             /  |    [Bastion] (military)
            /   |
     [Dust] [Reach] (frontier)
   (extractor)  |
         \      |
       [Fringe]--[Void's Edge]
      (frontier)  (extractor)
           \
         [Shadow] (pirate haven, low security)
```

- **Haven**: Agri world. Produces Biomass, Rations. Needs Industrial Parts, Consumer Goods.
- **Forge**: Industrial hub. Refinery + Factory. Needs Ore, Hydrocarbons. Sells Metals, Parts.
- **Nexus**: Core world. High population. Consumes everything, produces Consumer Goods, Electronics.
- **Bastion**: Military base. Consumes Munitions, Fuel, Medical. High security.
- **Dust**: Mining outpost. Produces Ore, some Hydrocarbons. Needs Rations, Consumer Goods.
- **Reach**: Frontier colony. Needs everything, produces little. Volatile prices.
- **Fringe**: Frontier outpost. Low security, pirate-adjacent. Good smuggling staging.
- **Void's Edge**: Remote extractor. Gas harvester. Produces Hydrocarbons, Fuel.
- **Shadow**: Pirate haven. Narcotics market. No tariffs, no law.

Additional systems (to reach 12-15) fill gaps and create longer profitable routes.

### 1C. Star Map UI

- New screen accessible from stations or a hotkey (M)
- Shows discovered systems as nodes, connections as lines
- Color-coded by faction, icon by primary type
- Current system highlighted
- Click system to set destination → calculates fuel cost → "Warp" button
- Undiscovered systems shown as `?` if adjacent to a visited system, hidden otherwise
- Show basic trade info for visited systems (what they produce/need)

### 1D. System Travel

- **Replace warp gates** with star map navigation
- Player selects destination from star map → fuel deducted → warp animation → arrive in new system
- Fuel cost = base cost per jump (scaling with distance on the map)
- Arriving in a system calls `enterExplorationMode()` with system-specific config
- System content (planets, stations, NPC traffic) generated from the persistent `world.systems` data + procedural details from the star type
- **Stranded mechanic**: if fuel = 0, player can't jump. Must harvest hydrogen from gas giants in-system, call for help (costs credits via distress beacon), or slowly drift to a station for expensive refuel

### 1E. System Generation from Node Data

- When entering a system, generate the exploration-mode content from the persistent world data:
  - Star type from `system.starType` (use existing star generation)
  - Planets/stations from `system.nodes[]` (positioned procedurally but consistently via system seed)
  - NPC traffic composition based on system faction, security, and active trade flows
  - Pirate density inversely proportional to security level
- Combat zone difficulty based on system security level and faction hostility, not a global `level` counter

---

## Phase 2: Economy Data Layer

**Goal:** Implement the 12-good economy with production, consumption, and stock-and-flow pricing.

### 2A. Goods Definition

```javascript
const TRADE_GOODS = {
    // Tier 0: Raw
    ore:          { name: "Ore",          tier: 0, basePrice: 20,  mass: 3, volume: 2, legal: true },
    hydrocarbons: { name: "Hydrocarbons", tier: 0, basePrice: 30,  mass: 2, volume: 3, legal: true },
    biomass:      { name: "Biomass",      tier: 0, basePrice: 25,  mass: 1, volume: 3, legal: true,  perishable: true },
    // Tier 1: Processed
    metals:       { name: "Metals",       tier: 1, basePrice: 55,  mass: 4, volume: 1, legal: true },
    polymers:     { name: "Polymers",     tier: 1, basePrice: 50,  mass: 1, volume: 2, legal: true },
    rations:      { name: "Rations",      tier: 1, basePrice: 45,  mass: 1, volume: 2, legal: true,  perishable: true },
    // Tier 2: Manufactured
    consumerGoods:   { name: "Consumer Goods",   tier: 2, basePrice: 100, mass: 1, volume: 2, legal: true },
    industrialParts: { name: "Industrial Parts", tier: 2, basePrice: 120, mass: 3, volume: 1, legal: true },
    electronics:     { name: "Electronics",      tier: 2, basePrice: 150, mass: 1, volume: 1, legal: true },
    // Strategic
    fuel:         { name: "Fuel",            tier: 1, basePrice: 40,  mass: 2, volume: 2, legal: true },
    medical:      { name: "Medical Supplies",tier: 2, basePrice: 180, mass: 1, volume: 1, legal: true },
    munitions:    { name: "Munitions",       tier: 2, basePrice: 160, mass: 3, volume: 1, legal: "restricted" },
    // Contraband
    narcotics:    { name: "Narcotics",       tier: 2, basePrice: 300, mass: 1, volume: 1, legal: false }
};
```

### 2B. Industry Recipes

```javascript
const INDUSTRIES = {
    mine:           { inputs: {},                              outputs: { ore: 10 } },
    gasHarvester:   { inputs: {},                              outputs: { hydrocarbons: 8 } },
    biofarm:        { inputs: {},                              outputs: { biomass: 8 } },
    refinery:       { inputs: { ore: 6 },                     outputs: { metals: 4 } },
    chemPlant:      { inputs: { hydrocarbons: 6 },            outputs: { polymers: 3, fuel: 2 } },
    foodPlant:      { inputs: { biomass: 5 },                 outputs: { rations: 4 } },
    factory:        { inputs: { metals: 3, polymers: 2 },     outputs: { industrialParts: 2 } },
    consumerPlant:  { inputs: { metals: 2, polymers: 2 },     outputs: { consumerGoods: 2 } },
    electronicsPlant: { inputs: { metals: 2, polymers: 1 },   outputs: { electronics: 1 } },
    pharmaLab:      { inputs: { rations: 2, electronics: 1 }, outputs: { medical: 1 } },
    ordnanceWorks:  { inputs: { metals: 3, fuel: 2 },         outputs: { munitions: 2 } }
};
```

### 2C. Node Inventory & Desired Stock

Each node stores per-good:
```javascript
node.inventory[goodId] = {
    stock: 150,         // Current units available
    desiredStock: 200,  // Target based on node type + population + industries
    flow: -3,           // Net production - consumption per tick (can be negative)
    lastPrice: 55,      // Cached current price
    demandSpike: 0      // Event multiplier (0 = normal)
};
```

**Desired stock** calculated from:
- Node type base values (core worlds want more of everything)
- Population tier multiplier (outpost 0.5x, colony 1x, coreWorld 2x)
- Industry needs (inputs have high desired stock)
- Military presence (munitions, fuel, medical desire up)

### 2D. Price Algorithm

```javascript
function calculatePrice(node, goodId) {
    const good = TRADE_GOODS[goodId];
    const inv = node.inventory[goodId];
    if (!inv) return good.basePrice; // Node doesn't trade this good

    // Scarcity: -1 (glutted) to +1 (desperate)
    const scarcity = clamp((inv.desiredStock - inv.stock) / inv.desiredStock, -1, 1);

    // Base price modulated by scarcity
    const a = 1.5; // Price elasticity
    let price = good.basePrice * (1 + a * scarcity);

    // Event spike multiplier
    if (inv.demandSpike > 0) {
        price *= (1 + 0.8 * inv.demandSpike);
    }

    // Tariffs (faction-based)
    const tariff = getTariffRate(node, goodId); // 0-0.3
    price *= (1 + tariff);

    // Floor/ceiling: 30%-300% of base
    price = clamp(price, good.basePrice * 0.3, good.basePrice * 3.0);

    return Math.round(price);
}
```

**Buy vs Sell spread:** Station buys from player at `price * 0.85`, sells to player at `price * 1.0`. This 15% spread prevents trivial same-station arbitrage.

**Anti-exploit damping:** When a player sells large quantities, apply diminishing returns:
```javascript
// Each unit sold nudges stock up, reducing the price for subsequent units
// Process in chunks of 10, recalculating price each chunk
function calculateBulkSellValue(node, goodId, quantity) { ... }
```

### 2E. Production/Consumption Tick

Each "world tick" (triggered on system entry, station dock, and every ~60s of real time):

```javascript
function worldEconomyTick() {
    const now = Date.now();
    const elapsed = now - gameState.world.lastTick;
    const ticks = Math.floor(elapsed / TICK_INTERVAL); // e.g., 1 tick = 1 "day"
    if (ticks === 0) return;

    for (const nodeId in gameState.world.nodes) {
        const node = gameState.world.nodes[nodeId];

        // 1. Run industries: consume inputs, produce outputs
        for (const industryId of node.industries) {
            runIndustry(node, industryId, ticks);
        }

        // 2. Population/military consumption (passive sinks)
        runConsumption(node, ticks);

        // 3. NPC trade flows (abstract: move goods between connected nodes)
        // Handled separately in npcTradeFlow()

        // 4. Recalculate prices
        recalculatePrices(node);
    }

    // 5. NPC trade flows smooth out extreme imbalances
    npcTradeFlow(ticks);

    // 6. Event ticks (advance/expire active events)
    tickEvents(ticks);

    gameState.world.lastTick = now;
}
```

**Industry stalling:** If a node lacks inputs, the industry produces nothing that tick. This creates the cascading shortage mechanic from the design doc.

### 2F. NPC Trade Flows (Abstract)

```javascript
function npcTradeFlow(ticks) {
    // For each pair of connected nodes:
    //   Find goods where price gradient > threshold
    //   Move units from surplus to deficit (scaled by security, distance)
    //   This prevents total economic collapse while leaving room for player profit
    //
    // Flow rate is LOW (~20-40% of what's needed to equalize)
    // This means player intervention is always more efficient than NPCs
    // Higher security = more NPC flow (safer routes = more NPC traders)
    // Lower security = less NPC flow (opportunity for player, but also pirates)
}
```

---

## Phase 3: Cargo & Trading Interface

**Goal:** Let the player carry and trade goods.

### 3A. Cargo Hold

```javascript
// Added to player ship / fleet
gameState.cargo = {
    capacity: 50,        // Total cargo units (mass or volume, whichever is simpler)
    contents: {           // goodId -> quantity
        "ore": 20,
        "electronics": 5
    }
};

function getCargoUsed() {
    return Object.values(gameState.cargo.contents).reduce((s, q) => s + q, 0);
}
function getCargoFree() {
    return gameState.cargo.capacity - getCargoUsed();
}
```

- Starter ship: 50 cargo capacity
- Upgradeable via ship purchases or hold expansions at shipyards
- Cargo lost on death (dropped at death location as salvageable wreck for a limited time)

### 3B. Station Trading UI

When docking at a station that has trade services, show a trading panel:

```
┌─────────────── TRADE: Earth Station ───────────────┐
│                                                      │
│  GOOD            STOCK   PRICE   YOU HAVE   ACTION   │
│  ─────────────────────────────────────────────────    │
│  Ore              340↑    12cr      20      [Sell]    │
│  Metals            45↓    82cr       0      [Buy]     │
│  Consumer Goods    12↓   185cr       0      [Buy]     │
│  Electronics       28     148cr      5      [Sell]    │
│  Rations          180↑    38cr       0      [Buy]     │
│  ...                                                  │
│                                                      │
│  Credits: 2,450        Cargo: 25/50                  │
│                                                      │
│  [Buy 1] [Buy 10] [Buy Max]  [Sell 1] [Sell 10] ... │
└──────────────────────────────────────────────────────┘
```

- Arrows (↑↓) indicate stock trend (rising/falling)
- Color-coded prices: green = below average (good buy), red = above average (good sell here)
- Contraband goods only shown at nodes that trade them (pirate havens, black markets)
- Restricted goods (munitions) show a warning icon in lawful systems; selling triggers faction consequences
- Quantity buttons: 1, 10, Max (with shift-click for custom amount)
- Tooltip on hover: shows base price, current scarcity, tariff breakdown

### 3C. Price Memory & Trade Intel

```javascript
gameState.priceMemory = {
    // nodeId -> { goodId -> { price, timestamp } }
    "sol_earth": {
        "metals": { price: 82, timestamp: 1700000000 },
        ...
    }
};
```

- Prices remembered when the player visits a node (free)
- Stale after N ticks (displayed as dimmed/uncertain)
- **Trade Bulletin** purchasable at stations: refreshes price data for all nodes in that system
- **Regional Feed** subscription: keeps prices updated for a faction's territory (costs credits/tick)
- Star map can show price annotations for remembered goods (e.g., filter by "Metals" → see last known price at each visited node)

---

## Phase 4: Events System

**Goal:** Inject controlled chaos that creates trading opportunities.

### 4A. Event Data Structure

```javascript
const EVENT_TYPES = {
    pirateSpike: {
        name: "Pirate Activity Surge",
        newsTemplate: "Pirate raids intensify along the {lane} corridor",
        effects: [
            { type: "reduceNpcFlow", target: "lane", magnitude: 0.7, duration: 5 },
            { type: "demandSpike", nodeType: "dependent", goods: ["rations", "medical"], magnitude: 0.6 }
        ],
        frequency: "common"
    },
    industrialAccident: {
        name: "Industrial Accident",
        newsTemplate: "{industry} at {node} severely damaged",
        effects: [
            { type: "disableIndustry", target: "specific_node", duration: 7 },
            // Cascade: downstream goods become scarce
        ],
        frequency: "uncommon"
    },
    warFront: {
        name: "Military Mobilization",
        newsTemplate: "Federation fleet mobilizing at {node}",
        effects: [
            { type: "demandSpike", nodeType: "military", goods: ["munitions", "fuel", "medical"], magnitude: 1.0 }
        ],
        frequency: "rare"
    },
    populationBoom: {
        name: "Immigration Wave",
        newsTemplate: "Colonists flooding into {node}",
        effects: [
            { type: "demandSpike", target: "specific_node", goods: ["rations", "consumerGoods"], magnitude: 0.8 }
        ],
        frequency: "uncommon"
    },
    embargo: {
        name: "Trade Embargo",
        newsTemplate: "{faction1} imposes embargo on {faction2} goods",
        effects: [
            { type: "blockTrade", factionPair: true, duration: 10 }
        ],
        frequency: "rare"
    }
};
```

### 4B. Event Lifecycle

- **Spawn:** Random chance per world tick, weighted by event frequency. Max 2-3 concurrent events.
- **Active:** Effects apply each tick (demand spikes, flow reductions, industry shutdowns)
- **News:** Displayed in a scrolling news ticker at the top of the screen and on the star map
- **Self-correction:** After duration expires, effects taper off over 2-3 additional ticks (not instant snap-back). As described in the design doc, nodes may find alternative suppliers if shortages persist, creating new trade flow patterns.
- **Player-visible:** Active events shown on star map with affected nodes/lanes highlighted

### 4C. News Ticker

- Thin scrolling bar at top of screen (exploration and station views)
- Shows active events and recent resolutions
- Clicking a news item highlights affected systems on the star map
- Format: `"[DAY 47] Pirate raids intensify along the Forge-Dust corridor. Metals shipments disrupted."`

---

## Phase 5: Contracts & Early Guidance

**Goal:** Give new players direction and guaranteed income.

### 5A. Contract System

```javascript
const contract = {
    id: "c_001",
    type: "delivery",           // delivery | escort (future)
    issuerNode: "sol_earth",
    good: "rations",
    quantity: 30,
    destinationNode: "reach_colony",
    deadline: 10,               // World ticks remaining
    reward: 2500,               // Credits
    reputationReward: { federation: 5 },
    penalty: { credits: 500 },  // For failure/expiry
    status: "active"            // available | active | completed | failed
};
```

- **Available at stations:** 2-4 contracts per station, refreshed on visit and world ticks
- **Contract board UI:** Listed in station menu alongside trade
- **Generated from economy needs:** Contracts appear for goods the destination node actually needs (ties into the economy simulation naturally)
- **Scaling:** Early contracts are short-distance, low-quantity. Larger/further contracts appear as player reputation grows
- **One active contract at a time** initially (expandable later with reputation)

---

## Phase 6: Ship Cargo & Fuel Rework

**Goal:** Make ship choice a meaningful trade decision.

### 6A. Fuel Rework

- Fuel is no longer "lives" -- running out doesn't end the game
- Fuel consumed per system jump (not per planet landing -- simplify)
- Jump cost based on distance between systems on the star map
- **Refuel options:** fuel stations, buying Fuel trade good and converting, harvesting hydrogen from gas giants
- **Stranded:** if out of fuel with no in-system options, distress beacon costs credits (and time) for NPC rescue

### 6B. Ship Progression (Future Phase)

- Starter ship: 50 cargo, basic weapons, low fuel tank
- Ship purchases at shipyards: trade capacity vs speed vs combat ability
  - **Freighter:** 200 cargo, slow, light weapons
  - **Courier:** 30 cargo, fast, medium weapons (high-value cargo runs)
  - **Armed Trader:** 80 cargo, medium speed, good weapons (warzone routes)
- Ships cost credits, available at core world shipyards
- This is a **future phase** -- for now, cargo capacity is just a number on the starter ship that can be upgraded at stations

---

## Implementation Order & Dependencies

```
Phase 0 (Reframe)
    ├── 0A: Death/Respawn          ← Can do immediately
    ├── 0B: Remove linear levels   ← Requires 1A to exist first
    ├── 0C: Remove run resets      ← Pairs with 0A
    ├── 0D: Title/Save rework      ← Pairs with 0A/0C
    └── 0E: Doc updates            ← Can do immediately

Phase 1 (Star Map)               ← Core dependency for everything
    ├── 1A: World data structure
    ├── 1B: Starter sector design
    ├── 1C: Star map UI
    ├── 1D: System travel
    └── 1E: System generation

Phase 2 (Economy)                ← Needs Phase 1 nodes to exist
    ├── 2A: Goods definition
    ├── 2B: Industry recipes
    ├── 2C: Node inventory
    ├── 2D: Price algorithm
    ├── 2E: Tick simulation
    └── 2F: NPC trade flows

Phase 3 (Trading)                ← Needs Phase 2 prices
    ├── 3A: Cargo hold
    ├── 3B: Trading UI
    └── 3C: Price memory

Phase 4 (Events)                 ← Needs Phase 2 economy running
Phase 5 (Contracts)              ← Needs Phase 2+3
Phase 6 (Ships & Fuel)           ← Can happen anytime after Phase 1
```

### Suggested Build Sequence

1. **Phase 0A + 0C + 0D** -- Remove permadeath and run resets first. Game becomes "you respawn at last station." This is the minimum viable persistence change.
2. **Phase 1A + 1B** -- Define the world graph data. Hand-craft the starter sector. No UI yet, just data.
3. **Phase 1D + 1E** -- Wire up system travel (replace warp gates with direct jumps from a list). Use existing exploration mode for each system.
4. **Phase 2A-2D** -- Implement goods, node inventories, and pricing. No UI yet, just the simulation layer.
5. **Phase 3A + 3B** -- Cargo hold and trading UI at stations. **This is the first playable trading milestone.**
6. **Phase 2E + 2F** -- Turn on the economy simulation (production, consumption, NPC flows). Prices start moving.
7. **Phase 1C** -- Star map UI (can be simple at first -- list of systems with jump buttons).
8. **Phase 4** -- Events system. Economy becomes dynamic.
9. **Phase 3C** -- Price memory and intel. Trading becomes strategic.
10. **Phase 5** -- Contracts. New players get guided income.
11. **Phase 0B + 0E** -- Final cleanup of old level/wave references and doc updates (ongoing throughout).
12. **Phase 6** -- Ship variety and fuel rework (can be deferred).

---

## Existing Systems to Preserve

These systems work well and should be kept largely as-is:

- **Exploration mode** with zoomed-out NPC traffic -- becomes the default in-system gameplay
- **Combat zones** -- triggered by hostile encounters in-system, unchanged mechanically
- **Faction system** (federation, merchants, pirates, independent) -- maps directly onto economy factions
- **Station docking UI** -- extended with trading panel, otherwise same
- **Weapon/equipment system** -- unchanged, these are combat progression not economy
- **Planet harvesting** -- unchanged, provides supplementary resources
- **Ship disabled/harvesting mechanic** -- unchanged

## Existing Systems to Remove or Heavily Modify

| System | Current | New |
|--------|---------|-----|
| Game Over | Permadeath, "Play Again" | Respawn at station, penalty |
| Levels | Linear 1→2→3 via gates | Free-roam star map |
| Warp Gates | Choose between 2 random configs | Direct travel to known systems |
| Score | Points accumulate per run | Removed entirely |
| Meta Resources | Alloys/Plasma/DataCores/DarkMatter persist across runs | Removed; credits and trade goods are the only currencies |
| Research Lab | Spend meta resources on permanent unlocks | Removed; upgrades purchased in-world at stations |
| Level Config | Wave count, threat, enemy multiplier | System danger rating from world data |
| `resetGame()` | Full state wipe | Minimal respawn reset |
| Fuel = Game Over | 0 fuel = dead | 0 fuel = stranded, can recover |

---

## Data That Must Be Saved (Persistence Schema)

```javascript
const SAVE_SCHEMA = {
    version: 2,
    world: {
        seed: Number,
        systems: { /* per system: discovered, visited */ },
        nodes: { /* per node: inventory stocks, industry state */ },
        currentSystem: String,
        lastDockedNode: String,
        lastTick: Number,
        activeEvents: Array,
        eventHistory: Array
    },
    player: {
        credits: Number,
        cargo: { capacity: Number, contents: Object },
        fleet: Array,           // Ships with hardpoints/equipment
        health: Number,
        fuel: Number,
        maxFuel: Number,
        reputation: Object,     // Per-faction reputation
        priceMemory: Object,    // Last known prices per node
        activeContracts: Array,
        stats: Object           // Lifetime stats
    }
};
```

Saved to `localStorage` (same as current), with the key `spacerun_persistent_save`.

---

## Anti-Exploit Considerations

1. **Bulk sell damping**: selling large quantities in one transaction applies diminishing prices per chunk, preventing "buy 500 cheap, sell 500 at spike price"
2. **NPC trade flow rebalancing**: NPCs slowly equalize extreme price differences, so the player can't create permanent monopolies without ongoing effort
3. **Production caps**: industries have max output per tick regardless of how empty the market is
4. **Price floor/ceiling**: 30-300% of base price, hard-clamped
5. **Cargo capacity**: limits how much the player can move per trip
6. **Jump-based ticks**: economy advances only on system jumps, keeping the player in control; no real-time simulation to exploit via save-scumming

---

## Design Decisions (Resolved)

1. **Existing resources (Iron, Copper, Silicon, etc.)**: **Integrate** -- planet-harvesting resources map onto the new trade goods. The 12 trade goods replace the old resource types.

2. **Arena mode**: **Remove entirely.** Strip all arena/wave-based code.

3. **Research Lab / meta-tech**: **Convert to existing resource system** -- upgrades purchasable at stations using credits. Remove meta-resources (Alloys/Plasma/DataCores/DarkMatter) entirely.

4. **World tick rate**: **Jump-based, not real-time.** Economy advances N ticks each time the player jumps between systems. No background real-time simulation. This keeps the player in control and avoids save-scumming concerns.

5. **Starting credits**: **100 credits.** Tight start -- enough for a small trade run or fuel, not both.
