# Economy Design - Active Implementation Plan

> **Status**: PLANNING - Awaiting approval before implementation
> **Based on**: `economy_design_starter.md`
> **Last updated**: 2026-02-19

---

## 1. Reality Check: What the Game Actually Is

Before mapping the design doc to code, we need to confront the structural differences between a persistent open-world Escape Velocity-style game and what Space Run actually is today:

| Design Doc Assumes | Space Run Reality |
|---|---|
| Persistent open world with ~15 nodes | Level-based progression (level 1, 2, 3...) |
| Player revisits systems freely | Each level is a one-way trip to the goal sun → warp gate |
| Economy simulates continuously across all nodes | Each level generates a fresh solar system |
| NPC traders flow between fixed nodes | NPC traffic spawns procedurally per level |
| 12 new trade goods | 6 existing resources (Metal, Hydrogen, Organics, Crystals, Exotic, Plasma) |
| Dedicated trade UI | Station UI exists but has limited trade functionality |
| Cargo capacity system | No cargo system yet |
| Credits are central | Credits exist but are underutilized |

**The core tension**: The design doc describes a *sandbox economy*. The game is a *roguelike run*. We need to bridge these.

---

## 2. Adaptation Strategy: "Roguelike Trade Route"

The key insight: **each run through multiple levels IS a trade route**. The player carries goods forward through levels, buying low and selling high as station types and system conditions change. This preserves the design doc's core fun loops while fitting the game's structure.

### The adapted model:

```
Level 1 (Frontier system)     Level 2 (Industrial system)     Level 3 (Core system)
  ┌─────────────┐               ┌─────────────┐                ┌─────────────┐
  │ Fuel Depot   │──warp gate──▶│ Trade Hub    │──warp gate───▶│ Armory       │
  │ Ore: CHEAP   │               │ Ore: NORMAL  │                │ Munitions:$$$│
  │ Rations: $$$│               │ Parts: CHEAP │                │ Parts: $$$   │
  └─────────────┘               └─────────────┘                └─────────────┘
       Buy ore here ──────────▶ Sell ore, buy parts ──────────▶ Sell parts here
```

**What the player experiences**: "I bought cheap ore at the frontier, refined my route through an industrial hub, and sold munitions to the military base for 4x profit. But I had to survive two pirate zones carrying valuable cargo."

### Why this works:

1. **Readable opportunities** - Warp gate previews already show station types; we add price hints
2. **Actionable plans** - Player chooses warp gates partly for trade advantage
3. **Risk/reward** - Carrying valuable cargo through combat means risking loss
4. **Progression** - Bigger cargo hold = bigger trades = more credits for upgrades

---

## 3. Goods System Design

### 3a. Unifying existing resources with trade goods

Rather than replacing the 6 resources or adding 12 new ones, we create a **two-tier system**:

**Tier 0: Raw Resources (already exist)**
These remain the crafting/upgrade currency. Harvested from planets, looted from ships.

| Resource | Role | Maps to Design Doc |
|---|---|---|
| Metal | Crafting staple | Ore / Metals |
| Hydrogen | Fuel feedstock | Hydrocarbons |
| Organics | Bio feedstock | Biomass |
| Crystals | Tech component | (unique to game) |
| Exotic | Rare material | (unique to game) |
| Plasma | Energy resource | (unique to game) |

**Tier 1: Trade Goods (NEW)**
These are the economy layer. Bought and sold at stations for credits. Cannot be harvested from planets - only purchased or looted from disabled ships/convoys.

| Trade Good | Base Price | Mass | Produced By | Consumed By | Notes |
|---|---|---|---|---|---|
| **Fuel Cells** | 15 | 2 | Fuel Depot, Extractor | Everyone (universal) | Staple, low margin |
| **Rations** | 20 | 3 | Agri stations, Trade Hub | Core worlds, Frontier | Perishable-ish, bulky |
| **Refined Metals** | 25 | 4 | Industrial, Extractor | Armory, Shipyard | Heavy, cheap per unit |
| **Polymers** | 30 | 2 | Industrial | Trade Hub, Core | Medium value |
| **Industrial Parts** | 50 | 3 | Industrial | Armory, Frontier, Shipyard | "Everything needs this" |
| **Consumer Goods** | 45 | 2 | Trade Hub, Industrial | Core, Frontier | Population sink |
| **Electronics** | 80 | 1 | Trade Hub | Armory, Shipyard | High value density |
| **Medical Supplies** | 100 | 1 | Trade Hub (rare) | Military, Frontier | Rare, very profitable |
| **Munitions** | 90 | 3 | Armory | Military bases | Illegal in some regions |
| **Contraband** | 150 | 1 | Pirates, Black Market | Shady stations | High risk, high reward |

**10 trade goods** - small enough to learn, large enough for meaningful routes.

### 3b. Why separate tiers?

- Raw resources stay simple: harvest planets, spend on upgrades. No price fluctuation, no market complexity. This is the game's existing loop and it works.
- Trade goods are the new economy layer: bought/sold for credits at variable prices. This is where the "deal finding" happens.
- No production chains needed (too complex for roguelike pacing). Instead, station types naturally produce/consume different goods.

### 3c. Data schema

```javascript
const TRADE_GOODS = {
    fuelCells:      { name: 'Fuel Cells',      basePrice: 15,  mass: 2, category: 'staple',    icon: '⛽', color: '#88ccff' },
    rations:        { name: 'Rations',          basePrice: 20,  mass: 3, category: 'staple',    icon: '🍱', color: '#88ff88' },
    refinedMetals:  { name: 'Refined Metals',   basePrice: 25,  mass: 4, category: 'industrial',icon: '🔩', color: '#aaaacc' },
    polymers:       { name: 'Polymers',         basePrice: 30,  mass: 2, category: 'industrial',icon: '🧪', color: '#44dddd' },
    industrialParts:{ name: 'Industrial Parts',  basePrice: 50,  mass: 3, category: 'industrial',icon: '⚙️', color: '#ccaa44' },
    consumerGoods:  { name: 'Consumer Goods',   basePrice: 45,  mass: 2, category: 'consumer',  icon: '📦', color: '#ffaa88' },
    electronics:    { name: 'Electronics',      basePrice: 80,  mass: 1, category: 'tech',      icon: '💻', color: '#44ffff' },
    medicalSupplies:{ name: 'Medical Supplies', basePrice: 100, mass: 1, category: 'strategic', icon: '💊', color: '#ff88ff' },
    munitions:      { name: 'Munitions',        basePrice: 90,  mass: 3, category: 'strategic', icon: '🔫', color: '#ff6644' },
    contraband:     { name: 'Contraband',       basePrice: 150, mass: 1, category: 'illegal',   icon: '💀', color: '#aa44ff' }
};
```

---

## 4. Station Economy Profiles

### 4a. Mapping existing station types to economy roles

The game already has station types: `Trade`, `Armory`, `Repair`, `Fuel`. We need to give each a distinct economic personality. We also add new types where the design calls for them.

```javascript
const STATION_ECONOMY_PROFILES = {
    Trade: {
        role: 'Core / Trade Hub',
        produces: ['consumerGoods', 'electronics', 'polymers'],      // sells cheap
        consumes: ['refinedMetals', 'industrialParts', 'rations'],   // buys at premium
        stockMultiplier: 1.5,    // large inventories
        priceVolatility: 0.1,    // stable prices
        illegalGoods: false       // no contraband
    },
    Armory: {
        role: 'Military Base',
        produces: ['munitions', 'industrialParts'],
        consumes: ['refinedMetals', 'electronics', 'medicalSupplies', 'fuelCells'],
        stockMultiplier: 1.0,
        priceVolatility: 0.3,    // war demand spikes
        illegalGoods: false
    },
    Repair: {
        role: 'Industrial / Shipyard',
        produces: ['refinedMetals', 'industrialParts', 'polymers'],
        consumes: ['electronics', 'consumerGoods', 'rations'],
        stockMultiplier: 1.2,
        priceVolatility: 0.15,
        illegalGoods: false
    },
    Fuel: {
        role: 'Extractor / Frontier',
        produces: ['fuelCells', 'refinedMetals'],
        consumes: ['rations', 'consumerGoods', 'medicalSupplies', 'industrialParts'],
        stockMultiplier: 0.7,    // small inventories (frontier)
        priceVolatility: 0.4,    // volatile (frontier)
        illegalGoods: true        // less policed
    }
};
```

### 4b. How station inventory is generated

When the player docks at a station, the station generates its trade inventory:

```
For each trade good:
  1. Determine base stock = f(stationType, gameLevel)
  2. Apply random variance (+/- 30%)
  3. If good is "produced" by this station type: stock is HIGH, price is LOW
  4. If good is "consumed" by this station type: stock is LOW, price is HIGH
  5. If neither: moderate stock, base price
  6. Apply level scaling (higher levels = higher base prices, bigger stocks)
  7. Apply event modifiers (if any active events affect this good)
```

### 4c. Pricing algorithm

Adapted from the design doc's stock-and-flow model, simplified for per-station generation:

```javascript
function calculateTradePrice(good, stationType, level, eventModifier) {
    const profile = STATION_ECONOMY_PROFILES[stationType];
    const base = TRADE_GOODS[good].basePrice;

    // Level scaling: prices increase ~15% per level
    const levelScale = 1 + (level - 1) * 0.15;

    // Supply/demand based on station type
    let supplyDemand = 0; // -1 to +1
    if (profile.produces.includes(good)) {
        supplyDemand = -0.3 - Math.random() * 0.4; // surplus → cheaper (30-70% discount)
    } else if (profile.consumes.includes(good)) {
        supplyDemand = 0.3 + Math.random() * 0.4;  // shortage → pricier (30-70% markup)
    } else {
        supplyDemand = (Math.random() - 0.5) * 0.3; // slight random variance
    }

    // Event modifier: -1 to +1 (from active events)
    const eventScale = 1 + (eventModifier || 0) * 0.5;

    // Final price with floor/ceiling
    const elasticity = 1.5;
    let price = base * levelScale * (1 + elasticity * supplyDemand) * eventScale;

    // Floor at 30% of base, ceiling at 300% of base (scaled)
    const floor = base * levelScale * 0.3;
    const ceiling = base * levelScale * 3.0;
    price = Math.max(floor, Math.min(ceiling, price));

    return Math.round(price);
}
```

### 4d. Anti-exploit: Diminishing returns on bulk sales

To prevent "buy 500 units cheap, dump all at one station":

```javascript
function getSellPrice(good, station, quantity) {
    const basePrice = station.buyPrices[good];
    // First 10 units: full price
    // Next 10: 80% price
    // Next 10: 60% price
    // Beyond 30: 40% price (floor)
    // This creates natural incentive to spread sales across stations
    let total = 0;
    for (let i = 0; i < quantity; i++) {
        const bracket = Math.floor(i / 10);
        const multiplier = Math.max(0.4, 1.0 - bracket * 0.2);
        total += Math.round(basePrice * multiplier);
    }
    return total;
}
```

---

## 5. Cargo System

### 5a. Player cargo hold

New addition to gameState:

```javascript
// In gameState:
cargo: {},           // { fuelCells: 5, electronics: 2, ... }
maxCargo: 20,        // total mass capacity (sum of good.mass * quantity)
cargoUsed: 0,        // current mass used (computed)
```

### 5b. Cargo capacity upgrade

Add to existing `SHIP_UPGRADES`:

```javascript
cargo: {
    name: 'Cargo Bay Expansion',
    description: 'Increases cargo capacity',
    maxLevel: 5,
    effectPerLevel: 10,  // +10 mass capacity per level (20 → 30 → 40 → 50 → 60 → 70)
    baseCost: { Metal: 8, Hydrogen: 4 },
    costMultiplier: 1.5
}
```

### 5c. Cargo risk

When the player takes hull damage in combat, there's a chance to lose cargo:

```
On damage event:
  if (player has cargo AND damage > 15):
    10% chance per hit to lose 1 random cargo unit
    Show floating text: "-1 Electronics lost!"
    Optionally spawn as lootable debris in the combat zone
```

This creates the **risk/reward tension** the design doc calls for: carrying valuable cargo through pirate territory is dangerous.

### 5d. Cargo mass calculation

```javascript
function getCargoMass() {
    let mass = 0;
    for (const [goodId, qty] of Object.entries(gameState.cargo)) {
        mass += TRADE_GOODS[goodId].mass * qty;
    }
    return mass;
}

function canAddCargo(goodId, quantity) {
    const additionalMass = TRADE_GOODS[goodId].mass * quantity;
    return getCargoMass() + additionalMass <= gameState.maxCargo;
}
```

---

## 6. Station Trading UI

### 6a. New "Market" tab in station docking screen

Replace or augment the existing station sections. The docking screen currently has: Bar, Shop, Shipyard, Missions, Outfitter, Docking.

**Change "Outfitter" to "Market"** (Outfitter is currently a placeholder with no functionality).

The Market tab shows:

```
┌─────────────────────────────────────────────────────┐
│  MARKET - Trade Hub Alpha                           │
│  Cargo: 12/30 mass                Credits: 1,250    │
├─────────────────────────────────────────────────────┤
│  Good            Stock  Buy    Sell   Yours  Action │
│  ─────────────────────────────────────────────────  │
│  ⛽ Fuel Cells      45   12cr   8cr     3   [+][-] │
│  🍱 Rations          8   38cr  28cr     0   [+][-] │
│  🔩 Refined Metals  22   18cr  13cr     5   [+][-] │
│  🧪 Polymers        15   22cr  16cr     0   [+][-] │
│  ⚙️ Ind. Parts       3   72cr  54cr     2   [+][-] │
│  📦 Consumer Goods  30   28cr  20cr     0   [+][-] │
│  💻 Electronics      5   95cr  71cr     0   [+][-] │
│  💊 Medical Sup.     1  180cr 135cr     0   [+][-] │
│  🔫 Munitions       12   65cr  48cr     0   [+][-] │
│  💀 Contraband       0    -     -       2   [+][-] │
├─────────────────────────────────────────────────────┤
│  💡 TIP: Fuel depots pay top credit for Rations     │
│  📰 NEWS: Pirate raids disrupting medical supply    │
│  lines - Military bases paying 2x for Medical       │
└─────────────────────────────────────────────────────┘
```

**Key UX details**:
- Color-code prices: GREEN if this station sells below average, RED if above
- "Yours" column shows cargo the player is carrying
- [+] buys one unit (if affordable and cargo space available)
- [-] sells one unit from player cargo
- Hold shift+click for bulk (5 at a time)
- Station stock decreases as player buys (limited supply)
- Sell price is ~75% of buy price (spread) with diminishing returns
- Trade tips at bottom hint at profitable routes

### 6b. Cargo display in HUD

During exploration/combat, show a small cargo indicator:

```
📦 12/30  |  💰 1,250cr
```

This is always visible so the player remembers what they're carrying and what's at stake.

---

## 7. Warp Gate Trade Intel

### 7a. Price hints on gate selection

The warp gate UI already shows station types and threat levels. We add trade intel:

```
┌─────────────────────────┐
│ Gate A: Industrial Zone  │
│ ⭐⭐⭐ Threat            │
│ Stations: [R] [T]       │
│ 📈 Parts CHEAP          │
│ 📉 Electronics WANTED   │
│ Good for: selling       │
│   electronics, buying   │
│   industrial parts      │
└─────────────────────────┘
```

This makes gate selection a **trade decision** as well as a combat/resource decision.

### 7b. Implementation

When generating gate choices, also generate economy previews:

```javascript
function generateGateTradePreview(levelConfig) {
    const stationTypes = levelConfig.stations;
    const hints = [];
    for (const st of stationTypes) {
        const profile = STATION_ECONOMY_PROFILES[st];
        // Pick 1-2 notable goods this station produces/consumes
        const cheapGood = randomPick(profile.produces);
        const wantedGood = randomPick(profile.consumes);
        hints.push({ cheap: cheapGood, wanted: wantedGood });
    }
    return hints;
}
```

---

## 8. Events System

### 8a. Event types (adapted for level-based structure)

Events are generated per-level and affect the stations in that level. They're announced via a news ticker when entering a new level.

```javascript
const TRADE_EVENTS = [
    {
        id: 'pirate_raids',
        headline: 'Pirate raids disrupting supply lines',
        effects: { rations: +0.5, medicalSupplies: +0.6, fuelCells: +0.3 },
        // positive = price increase (shortage), negative = price decrease (surplus)
        duration: 'level',
        frequency: 0.25  // 25% chance per level
    },
    {
        id: 'industrial_accident',
        headline: 'Refinery explosion in {system}',
        effects: { refinedMetals: +0.7, industrialParts: +0.4, polymers: +0.3 },
        duration: 'level',
        frequency: 0.15
    },
    {
        id: 'war_escalation',
        headline: 'Border conflict intensifies',
        effects: { munitions: +0.8, fuelCells: +0.4, medicalSupplies: +0.5 },
        duration: 'level',
        frequency: 0.15
    },
    {
        id: 'population_boom',
        headline: 'Immigration wave hits frontier colonies',
        effects: { rations: +0.6, consumerGoods: +0.5, medicalSupplies: +0.3 },
        duration: 'level',
        frequency: 0.15
    },
    {
        id: 'trade_surplus',
        headline: 'Bumper harvest reported across sector',
        effects: { rations: -0.4, consumerGoods: -0.3 },
        duration: 'level',
        frequency: 0.10
    },
    {
        id: 'tech_breakthrough',
        headline: 'New fabrication methods reduce electronics costs',
        effects: { electronics: -0.5, polymers: -0.2 },
        duration: 'level',
        frequency: 0.10
    },
    {
        id: 'contraband_crackdown',
        headline: 'Federation increases patrols - contraband seizures up',
        effects: { contraband: +1.0 },  // sky-high prices but extreme risk
        duration: 'level',
        frequency: 0.10
    }
];
```

### 8b. News ticker UI

On entering a new level (after warp gate), show a brief news overlay:

```
━━━ SECTOR NEWS ━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 Pirate raids disrupting medical supply lines
   → Medical Supplies prices UP at military stations
   → Rations scarce at frontier outposts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This fades after 5 seconds or on click. The information persists in the Market UI as a tip line.

### 8c. Event-driven NPC behavior

When a "pirate_raids" event is active:
- Spawn extra pirate traffic ships in the exploration view
- NPC convoys might appear (escorted traders) that the player can help or raid

When "war_escalation" is active:
- Federation warships are more common
- Military convoys carrying munitions appear

This connects events to visible world changes, not just price numbers.

---

## 9. NPC Trade Convoys (Visible Economy)

### 9a. Convoy ships

Extend the existing traffic system. Some NPC ships are now explicitly **trade convoys**:

```javascript
// New traffic type additions
const CONVOY_TYPES = {
    merchant_convoy: {
        role: 'merchant_convoy',
        model: 'Bob',        // tanker model
        color: 'Green',
        speed: 0.0015,       // slow
        scale: 1.8,
        faction: 'merchants',
        strength: 0,         // unarmed, relies on escorts
        warship: false,
        cargo: ['rations', 'consumerGoods', 'polymers'],  // visible cargo type
        escortCount: 1       // 1 warship escort
    },
    military_supply: {
        role: 'military_supply',
        model: 'Insurgent',
        color: 'Blue',
        speed: 0.002,
        scale: 1.5,
        faction: 'federation',
        strength: 2,
        warship: false,
        cargo: ['munitions', 'fuelCells', 'medicalSupplies'],
        escortCount: 2
    }
};
```

### 9b. Player interaction with convoys

When the player encounters a convoy (enters detection radius):

1. **Escort option**: Help defend convoy through pirate zone → credits + faction reputation
2. **Raid option**: Attack convoy → loot cargo goods + massive faction reputation hit
3. **Ignore**: Just fly past

Raiding creates combat encounter with convoy escorts. Successfully raiding drops trade goods as lootable cargo crates.

### 9c. Implementation approach

Convoys use the existing traffic/skirmish system. They're just traffic ships with a `cargo` property and escort ships that travel alongside them. The existing `checkEncounterDetection()` system handles player proximity detection.

---

## 10. Contracts System (Simple Hauling)

### 10a. Contract board at stations

The station "Missions" section (currently bounties only) gets a "Contracts" subsection:

```
┌──────────────────────────────────────────────┐
│  CONTRACTS                                    │
├──────────────────────────────────────────────┤
│  📋 Deliver 5 Rations to next Fuel Depot     │
│     Reward: 200cr + 5 rep (Merchants)        │
│     Deadline: 2 levels                        │
│     [ACCEPT]                                  │
│                                               │
│  📋 Deliver 3 Electronics to any Armory      │
│     Reward: 450cr + 5 rep (Federation)       │
│     Deadline: 3 levels                        │
│     [ACCEPT]                                  │
│                                               │
│  📋 Smuggle 2 Contraband to Frontier station │
│     Reward: 600cr - 10 rep (Federation)      │
│     Risk: Inspection at Federation stations   │
│     [ACCEPT]                                  │
└──────────────────────────────────────────────┘
```

### 10b. Contract data

```javascript
// Generated per station visit
function generateContracts(stationType, level) {
    const contracts = [];
    const profile = STATION_ECONOMY_PROFILES[stationType];

    // 2-3 contracts per station
    // Contracts ask you to deliver goods this station CONSUMES
    // to a station type that PRODUCES them (or vice versa)
    // Reward = base good value * quantity * 1.5 (guaranteed profit margin)

    return contracts;
}
```

### 10c. Contract tracking

```javascript
// In gameState:
activeContracts: [],  // { id, good, quantity, targetStationType, reward, repReward, faction, deadlineLevel }
```

Contracts appear as a small tracker in the HUD:
```
📋 Deliver 5 Rations → Fuel Depot (2 levels left)
```

---

## 11. Faction-Specific Trade Perks

### 11a. Reputation unlocks

Tie the existing faction reputation system to trade advantages:

| Reputation | Perk |
|---|---|
| 25+ (Neutral) | Can dock and trade normally |
| 50+ (Friendly) | 10% discount on purchases at faction stations |
| 75+ (Allied) | Access to exclusive goods, 20% discount, priority contracts |
| 90+ (Honored) | Free trade intel (see all prices in faction space), 30% discount |

| Reputation | Penalty |
|---|---|
| < 25 (Distrusted) | 20% markup on purchases |
| < 10 (Hostile) | Denied docking at faction stations |
| 0 (Enemy) | Faction ships attack on sight |

### 11b. Contraband and faction law

- Federation/Merchant stations: contraband is **illegal**. If detected, confiscated + fine + reputation hit.
- Pirate/Independent stations: contraband trades freely.
- Detection chance: 30% at Federation, 15% at Merchant, 0% at Pirate/Independent.
- Detection happens on docking. Player gets a warning and choice to jettison before inspection.

---

## 12. Implementation Phases

### Phase 1: Foundation (Core Data + Cargo)
**Priority: CRITICAL - enables all other phases**

1. Define `TRADE_GOODS` constant (10 goods with properties)
2. Define `STATION_ECONOMY_PROFILES` (4 station types with produce/consume lists)
3. Add `cargo`, `maxCargo` to `gameState`
4. Add `cargoUsed` computed property / helper function
5. Add `cargo` upgrade to `SHIP_UPGRADES`
6. Implement `calculateTradePrice()` function
7. Implement `generateStationMarket()` - creates inventory + prices on dock

### Phase 2: Trading UI
**Priority: CRITICAL - the player-facing interface**

1. Replace "Outfitter" tab with "Market" tab in docking screen
2. Build market grid UI (good name, stock, buy/sell price, player qty, +/- buttons)
3. Implement buy/sell transactions (credits, cargo, stock changes)
4. Add diminishing returns on bulk sales
5. Add cargo indicator to exploration/combat HUD
6. Color-code prices (green = good deal, red = expensive)
7. Add trade tips at bottom of market UI

### Phase 3: Warp Gate Trade Intel
**Priority: HIGH - connects trading to level progression**

1. Generate economy preview data for each gate choice
2. Add price hint text to gate selection UI
3. Show station type → trade opportunity mapping

### Phase 4: Events System
**Priority: HIGH - creates dynamic opportunities**

1. Define `TRADE_EVENTS` array
2. Roll for events on level generation (1-2 events per level)
3. Apply event modifiers to price calculation
4. Display news ticker on level entry
5. Show event context in market UI tips

### Phase 5: Cargo Risk
**Priority: MEDIUM - adds tension to combat**

1. On player damage: chance to lose cargo
2. Floating text notification for lost cargo
3. Optionally spawn lost cargo as lootable debris in combat zone
4. Disabled ship boarding can now yield trade goods (not just resources)

### Phase 6: Contracts
**Priority: MEDIUM - guided trading for new players**

1. Generate contracts at stations based on type and level
2. Contract acceptance UI in Missions tab
3. Contract tracking in HUD
4. Contract completion detection on docking at target station type
5. Rewards: credits + faction reputation

### Phase 7: NPC Convoys
**Priority: LOW - enriches the world**

1. Add convoy traffic types to exploration traffic system
2. Convoy ships carry visible cargo type (label/icon)
3. Escort ships travel alongside convoys
4. Player interaction: escort for reward or raid for cargo
5. Raiding drops trade goods as lootable crates

### Phase 8: Faction Trade Perks
**Priority: LOW - rewards long-term play**

1. Reputation-based price discounts
2. Contraband detection on docking at lawful stations
3. Jettison option before inspection
4. Exclusive goods at high reputation

---

## 13. Starter Sector Map (Level Sequence Design)

The design doc calls for a starter sector map. In our level-based system, this translates to a **recommended level progression** that creates good early trade routes:

```
Level 1: "Frontier Outpost"
  Stations: [Fuel]
  Character: Resource-rich but goods-poor. Fuel cells and raw metals cheap.
  Trade opportunity: Stock up on fuel cells and refined metals.

Level 2: "Trade Crossroads"
  Stations: [Trade, Repair]
  Character: Balanced hub. Good prices on consumer goods and polymers.
  Trade opportunity: Sell metals from L1, buy electronics/consumer goods.

Level 3: "Contested Border"
  Stations: [Armory]
  Character: Military zone. Munitions produced, everything else scarce.
  Trade opportunity: Sell electronics/medical at premium. Buy munitions.
  Event likely: war_escalation (price spikes on strategic goods)

Level 4: "Deep Frontier"
  Stations: [Fuel, Trade]
  Character: Remote, volatile prices. Rations and consumer goods expensive.
  Trade opportunity: Sell consumer goods from L2, sell munitions from L3.

Level 5+: Procedural with increasing threat and trade complexity.
```

This ensures the first 4 levels teach the player:
1. "Stations have different prices" (L1→L2)
2. "Buy low, sell high across levels" (L2→L3)
3. "Events create opportunities" (L3 war event)
4. "Risk/reward: carrying goods through combat" (L3→L4 through combat)

---

## 14. Balance Knobs (Tuning Parameters)

All in one place for easy iteration:

```javascript
const ECONOMY_CONFIG = {
    // Price formation
    priceElasticity: 1.5,           // how much supply/demand affects price
    levelPriceScale: 0.15,          // price increase per level (15%)
    priceFloor: 0.3,                // minimum price as fraction of base
    priceCeiling: 3.0,              // maximum price as fraction of base
    sellSpread: 0.75,               // sell price = buy price * this

    // Bulk trading
    bulkBracketSize: 10,            // units per price bracket
    bulkDecay: 0.2,                 // price decay per bracket
    bulkFloor: 0.4,                 // minimum bracket multiplier

    // Cargo
    startingCargo: 20,              // initial cargo capacity (mass units)
    cargoUpgradeAmount: 10,         // mass per upgrade level
    cargoDamageThreshold: 15,       // minimum hit damage to risk cargo loss
    cargoDamageChance: 0.10,        // chance per qualifying hit

    // Events
    eventChancePerLevel: 0.40,      // chance of at least one event per level
    maxEventsPerLevel: 2,           // cap on simultaneous events

    // Contracts
    contractsPerStation: 2,         // number of available contracts
    contractProfitMargin: 1.5,      // reward = goods value * this
    contractDeadlineLevels: 3,      // levels to complete delivery

    // Faction
    discountPerRepTier: 0.10,       // 10% discount per reputation tier
    contrabandDetectionBase: 0.30,  // base detection chance at Federation

    // Station stock
    baseStockMultiplier: 15,        // base units of each good per station
    producedStockBonus: 2.0,        // 2x stock for produced goods
    consumedStockPenalty: 0.3,      // 0.3x stock for consumed goods
};
```

---

## 15. What We're NOT Implementing (Conscious Cuts)

From the design doc, these features are **deferred or cut** to keep scope manageable:

| Feature | Reason for Cut |
|---|---|
| Production chains (Ore → Metals → Parts) | Too complex for roguelike pacing. Station types implicitly handle this. |
| Player-owned Trade Posts | Requires persistence between runs. Defer to late-game expansion. |
| Player-owned Industry buildings | Same as above. |
| Warehouse receipts / futures | Too abstract for the game's action-oriented feel. |
| Information fog / stale prices | Level-based structure means you see prices on dock. Not enough distance for staleness to matter. |
| Live feed subscriptions | Deferred. Could add as upgrade that shows prices on warp gate preview. |
| NPC trade simulation (background flows) | The existing traffic system + convoy events covers this visually. Full simulation is unnecessary overhead. |
| Mass vs Volume cargo distinction | One dimension (mass) is enough. Volume adds complexity without proportional fun. |
| Tariffs per faction | Covered simpler via reputation discounts/markups. |

---

## 16. Success Metrics

How we know the economy is working:

1. **Players choose warp gates partly for trade reasons** (not just threat level)
2. **Players voluntarily carry cargo through combat** (risk/reward is compelling)
3. **Events create "I should go there" moments** (news ticker drives decisions)
4. **Credits feel meaningful** (not just for weapons - also for trade capital)
5. **Trade is optional but rewarding** (combat-only players aren't punished, traders get an edge)

---

## Implementation Log

*(Will be updated as phases are completed)*

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Foundation | NOT STARTED | |
| Phase 2: Trading UI | NOT STARTED | |
| Phase 3: Gate Intel | NOT STARTED | |
| Phase 4: Events | NOT STARTED | |
| Phase 5: Cargo Risk | NOT STARTED | |
| Phase 6: Contracts | NOT STARTED | |
| Phase 7: Convoys | NOT STARTED | |
| Phase 8: Faction Perks | NOT STARTED | |
