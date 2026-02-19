Here’s a “boiled essence” economy design for an Escape Velocity–style single-player space game: **minimal surface complexity, maximal emergent deal-finding.** I’ll describe the *actors*, *goods*, *production/consumption*, *price formation*, *frictions*, and the *fun loops* it creates.

## Design goal

Players should reliably experience:

* **Readable opportunities** (I can *see* why this is a good deal)
* **Actionable plans** (I can exploit it with a route / loadout / relationship choice)
* **Self-made opportunities** (I can *cause* a shortage, not just stumble into one)
* **Progression through logistics** (bigger ship and better intel = better edge)

To get that, you want a **small number of goods** (8–14), a **clear node graph** (planets/stations), and a **stock-and-flow** price system with a couple “event injectors.”

---

## World economy structure

### Nodes (places)

Each system has 1–3 planet/station nodes, each node has:

* **Population tier** (outpost, colony, core world)
* **Industry slots** (0–3)
* **Security level** (affects piracy + insurance costs)
* **Faction + legality** (tariffs, contraband)

Keep the number of node “types” low but distinct:

1. **Extractor** (mines, gas harvesters)
2. **Agri** (food)
3. **Industrial** (refining + manufacturing)
4. **Core** (high population consumer sink)
5. **Frontier** (volatile, needs everything, produces little)
6. **Military base** (munitions sink, high demand spikes)

Match these to the types of planets and stations shown.

---

## Goods: small set, high personality

Aim for ~12 goods. Each should have:

* **Mass/volume**
* **Legality**
* **Spoilage / risk**
* **Value density** (credits per cargo unit)
* **Who buys/sells** (node affinity)

### Suggested goods (12)

**Tier 0 (raw)**

1. **Ore** (heavy, cheap)
2. **Hydrocarbons** (fuel feedstock, medium)
3. **Biomass** (food feedstock, perishable-ish)

**Tier 1 (processed)**
4. **Metals** (from Ore)
5. **Polymers** (from Hydrocarbons)
6. **Rations** (from Biomass)

**Tier 2 (manufactured)**
7. **Consumer Goods** (Metals+Polymers)
8. **Industrial Parts** (Metals+Polymers; “everything needs this”)
9. **Electronics** (Metals+Polymers; higher value density)

**Strategic / special**
10. **Fuel** (from Hydrocarbons; universal sink)
11. **Medical Supplies** (from Rations+Electronics; rare-ish)
12. **Munitions** (from Metals+Chemicals/Fuel; military sink; illegal-ish in some regions)

**Contraband “spice”**

* **Narcotics** (high value, high risk, small markets)

This set is small enough to learn, but rich enough for routes.

---

## Producers, consumers, and chains

### Industry buildings (simple recipes)

Each building consumes input goods and produces output goods each “tick” (e.g., daily).

* **Mine**: produces Ore
* **Gas Harvester**: produces Hydrocarbons
* **Biofarm**: produces Biomass
* **Refinery**: Ore → Metals
* **Chem Plant**: Hydrocarbons → Polymers + (small) Fuel
* **Food Plant**: Biomass → Rations
* **Factory**: Metals + Polymers → Industrial Parts
* **Consumer Plant**: Metals + Polymers → Consumer Goods
* **Electronics Plant**: Metals + Polymers → Electronics
* **Pharma Lab**: Rations + Electronics → Medical
* **Ordnance Works**: Metals + Fuel → Munitions

### Consumption (the sinks)

* **Population** consumes: Rations, Consumer Goods, Medical (baseline)
* **Industry** consumes: Industrial Parts, Fuel (baseline)
* **Military** consumes: Munitions, Fuel, Medical (baseline + spikes during war)
* **Shipyards** consume: Metals, Industrial Parts, Electronics (spikes when building/rebuilding fleets)

You now have:

* **Staples loop** (food/consumer)
* **Industrial loop** (parts/electronics)
* **Strategic loop** (fuel/munitions/medical)
  All interlinked, so disruptions cascade in fun ways.

---

## Price formation: “stock-and-flow” with soft caps

You want something that feels alive but is easy to reason about.

Each node has, per good:

* **Stock** (inventory)
* **Desired stock** (target based on node type + population + industry)
* **Flow** (production/consumption per day)

Price is a function of *how far stock is from desired*:

* If stock > desired → price falls
* If stock < desired → price rises

A very usable formula:

* `scarcity = clamp((desired - stock) / desired, -1, +1)`
* `price = base_price * (1 + a * scarcity) * (1 + b * volatility_event)`

Where:

* `a` around 1.0–2.5 makes shortages meaningful
* `b` is event multiplier (0–1 range)

**Key:** put **floors/ceilings** so it doesn’t blow up, and include **diminishing returns** so dumping 500 units doesn’t instantly crash it to zero.  Also can have limits to how much can be bought/sold at once.

### The “deal” feeling requires two things

1. Prices change noticeably over travel time (so the player’s movement matters).
2. A single run can visibly improve a shortage (so the player feels impactful).

---

## Frictions: where fun is born

Without friction, the economy equalizes and trading becomes rote. Use **few, strong frictions**:

### 1) Travel time + fuel

* Hyperspace jumps consume Fuel
* This creates **value density gameplay**: ore is profitable only on short routes / bulk ships; electronics for long routes.

### 2) Cargo constraints

* Different ships have different **mass vs volume** holds.
* Some goods are “bulky” (Rations), some “dense” (Medical/Narcotics).
* This makes ship choice a trading build.

### 3) Risk (piracy, interdiction, warzones)

* Each lane has a **risk rating** that increases expected loss.

### 4) Market access

* Factions/systems apply **tariffs**, inspections, and blockades.
* Contraband becomes a *route-planning puzzle*.
* Avoiding tariffs in a system can be a fun puzzle, e.g., pull a pirate onto your tail and then have them engage with a tariff enforcer while you enter the system. Or hide in the radio shadow of an asteroid or comet to get through 

### 5) Information fog

* Prices are **stale intel** unless refreshed.
* Players can buy:

  * “Trade bulletin” (recent prices)
  * “Live feed” subscription for a faction region

Information asymmetry is a core ingredient of “I found a deal.”

---

## Event injectors: controlled chaos

Emergence doesn’t require huge simulation—just a few event types that perturb stock/flow.

1. **Pirate activity spike** on a lane
   → reduces imports → shortages at dependent nodes.

2. **Industrial accident** at a refinery/chem plant
   → Metals/Polymers shortage ripple.

3. **War front shifts**
   → Military base demand for Fuel/Munitions/Medical surges.

4. **Population boom / immigration wave** at a frontier
   → Rations/Consumer spike.

5. **Blockade / embargo** between factions
   → price divergence across borders becomes juicy.

Make events legible:

* News ticker: “Refinery fire on Kantos: Metals shipments disrupted (7 days)”
* Map overlay: affected nodes glow; predicted goods affected show icons

Make events have actual impact:
* Drive underlying growth factors for worlds
* Industrial accident means that there will be less munitions going to the military base, which will trigger a munitions surge and provide value for getting munitions from further/alternate places
* Events self-correct after a while. For example, if the base doesn't get supplies for a long time they might find another supplier, leading to more ships bringing goods from there
* So each planet should have intelligence and agency, with a limited number of trading partners etc.

---

## Player agency: let them *make* the deal

This is the difference between “trade minigame” and “merchant fantasy.”

Give players 4 levers, unlockable over time:

1. **Contract hauling**

* “Deliver 80 Fuel within 6 days” (paid premium)
* Acts like a guided tutorial and stabilizes income early

2. **Speculation**

* Buy futures-ish “warehouse receipts” at a node (reserve stock at today’s price)
* Encourages intel and timing

3. **Market shaping**

* **Escort** relief convoy (resolve shortage)
* **Raid** convoy (cause shortage) — higher risk and faction consequences

4. **Infrastructure**

* Buy a “Trade Post” that:

  * stores goods
  * improves local price discovery
  * gives small passive arbitrage with NPC traders
* Late game: build one industry building and feed it

This preserves simplicity: you’re not turning it into a full 4X, but you can still graduate from runner → operator.

---

## NPC simulation: “thin but believable”

You don’t need every ship to be real. You need:

* A background flow that prevents the world from freezing
* Visible convoys *sometimes* (so players can interact)

Implementation-friendly approach:

* For each region per day: spawn abstract “trade flow” between node pairs based on price gradient.
* Occasionally materialize a convoy entity that represents that flow (for escort/raid flavor).

---

## The core fun loops this economy produces

### Early game: “route craft”

* Find a 2–3 hop triangle:

  * Frontier sells Ore cheap → Industrial buys Ore
  * Industrial sells Parts → Frontier buys Parts
  * Core buys Consumer Goods → Industrial sells them
* Player learns: *distance, fuel, cargo, and risk*.

### Mid game: “intel + differentiation”

* Upgrade sensors/subscriptions → act on events first.
* Shift ships by role:

  * bulk freighter for staples
  * fast runner for dense/high-risk cargo
  * armed trader for war zones

### Late game: “market power”

* Place Trade Posts at choke points.
* Feed an Ordnance Works during war for absurd margins.
* Or stabilize regions for reputation perks and exclusive markets.

---

## “Simple but deep” balancing knobs

If you build this, you’ll tune mostly these:

* **Base production/consumption per node**
* **Desired stock size** (how quickly shortages form)
* **Price elasticity (a)** (how rewarding deals are)
* **Event frequency + duration**
* **Risk cost curve** (how dangerous profitable routes feel)
* **Fuel cost vs value density** (forces meaningful cargo choices)

---

## A concrete example economy snapshot (what the player sees)

News: “Pirates hit the Gannet Lane. Food shipments down to Frontier: Lysa.”

Effects:

* Lysa (Frontier): Rations stock falls → price rises 2×
* Nearby Agri world: Rations cheap, surplus
* Route crosses risky lane → player chooses:

  1. Fast smuggler + stealth (profit, high tension)
  2. Armed hauler + escorts (lower margin, safer)
  3. Take longer route (time tradeoff)

Player delivers 120 Rations:

* Lysa price visibly drops a bit (player impact)
* Reputation rises with Lysa faction
* Pirate risk persists → repeatable loop until event ends

That’s the “I made the deal” feeling.

---

Ensure at a minimum you are creating:

* a **minimal data schema** (tables/JSON) for nodes, goods, industries, events
* a **pricing algorithm spec** with anti-exploit damping
* a **starter sector map** (10–15 nodes) designed to generate good early routes and mid-game disruptions.
