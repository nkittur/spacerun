# World Events Affecting Economy — Design

## Rationale
The economy runs but nothing disrupts it — industries produce, populations consume, and NPC traders smooth out imbalances in a steady state. Without events, there's no reason for players to adapt their trade routes. World events create dynamic trading opportunities: a pirate blockade cuts supply to a system, spiking prices; a factory accident halts production, creating scarcity downstream; a military mobilization creates sudden demand for munitions. These events are visible in the bar (news/rumors), on the galactic map (event markers), and in prices.

## Pre-existing Bug Fix
`npcTradeFlow()` iterates `sys.nodes` but world systems only have `nodeIds` (array of IDs). Nodes live in `world.nodes[nodeId]`. Fix: iterate `sys.nodeIds` and look up nodes from `world.nodes`.

## Design

### Event Types
5 event types, each with economic effects, duration, and news template:

1. **Pirate Blockade** (common) — Reduces NPC trade flow along a connection by 80%. Demand spikes for rations and medical at affected systems. Duration: 4-6 ticks. Icon: ☠
2. **Industrial Accident** (uncommon) — Disables one industry at a node for the duration. Downstream goods become scarce. Duration: 5-8 ticks. Icon: 🔥
3. **Military Mobilization** (rare) — Spikes demand for munitions, fuel, medical at a military or federation node. Duration: 3-5 ticks. Icon: ⚔
4. **Famine** (uncommon) — Spikes demand for rations and biomass at a populated node. Duration: 4-7 ticks. Icon: 🍂
5. **Trade Boom** (common) — Increases NPC trade flow along a connection by 50%. Reduces prices slightly. Duration: 3-5 ticks. Icon: 📈

### Event Data Structure
```javascript
{
    id: 'evt_12345',
    type: 'pirateBlockade',      // EVENT_TYPES key
    targetSystem: 'forge',        // System ID
    targetNode: 'forge_refinery', // Node ID (for node-specific events)
    targetLane: ['forge','dust'], // Connection pair (for lane events)
    ticksRemaining: 5,
    totalDuration: 5,
    newsText: 'Pirate raids intensify along the Forge-Dust corridor'
}
```

### Economy Effects (applied each tick in tickWorldEvents)
- **demandSpike**: Set `node.inventory[goodId].demandSpike` to event magnitude (0.5-1.0). This already feeds into `calculateTradePrice()` at 80% markup per unit.
- **reduceNpcFlow**: Store affected lane in event data. In `npcTradeFlow()`, check active events and multiply flowRate accordingly.
- **disableIndustry**: Store disabled industry ID. In `worldEconomyTick()` industry loop, skip if industry is disabled by an active event.
- **tradeBoom**: Increase flowRate for the affected lane.

### Spawning Rules
- Each tick: 15% chance to spawn a new event (if < 3 active events)
- Pick a random event type weighted by frequency (common=3, uncommon=2, rare=1)
- Pick a valid target (system/node/lane) for that event type
- Don't duplicate: skip if same type already active on same target

### Expiry
- Each tick: decrement `ticksRemaining`
- When 0: remove event, clear any demandSpike values it set
- Toast notification on start and end

### Visibility

#### Bar Rumors (dynamic)
- When at a station, active world events generate dynamic rumors
- Prepend event-based rumors before static rumors
- Format: source is contextual ("Worried Trader", "Military Officer"), text is the `newsText`

#### Trade Overlay (galactic map)
- When trade overlay is active, draw event icon next to affected system
- Use event type's icon emoji
- Pulse or highlight the affected system node

#### Info Panel
- When clicking a system with active events (trade overlay on), show event name and effect in the details text

### Files Modified
- `index.html`:
  - New `EVENT_TYPES` constant
  - Rewrite `tickWorldEvents()` — spawn, apply effects, expire
  - Modify `worldEconomyTick()` — skip disabled industries
  - Fix + modify `npcTradeFlow()` — check event flow modifiers, fix nodeIds bug
  - Modify bar rumors — prepend active event news
  - Modify `renderTradeOverlay()` — draw event markers
  - Modify star map click handler — show event info
  - `getSaveableState()` / `applySavedState()` — persist activeEvents

### Edge Cases
- Event targets a system that hasn't been discovered: still affects economy, but not visible on map until discovered
- Event targets a node with no inventory: skip gracefully
- Multiple events on same system: effects stack
- Save/load: events must persist (store in world.activeEvents)
