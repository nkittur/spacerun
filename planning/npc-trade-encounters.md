# NPC Ship Trade Encounters — Design

## Rationale
Exploration mode has NPC traffic ships traveling through the system, but they're non-interactive scenery. Adding occasional trade opportunities to these ships creates emergent gameplay moments: a merchant dumping cargo cheap, a ship desperate for fuel, or a trader with insider market info. These encounters reward attentive players who explore rather than just beelining for the gate.

## Design

### Encounter Types
3 encounter types, each with a distinct icon on the ship:

1. **Cargo Dump** (💰) — Merchant selling a random trade good at 50% off. Player gets 5-15 units at half the current station price. Requires cargo space.
2. **Fuel Buyer** (⛽) — Ship offering to buy fuel from the player at 2x credits per unit. Player chooses how much to sell (5-20 units). Good when flush with fuel.
3. **Trade Intel** (📡) — Trader selling inside info for 50-100 CR. Applies a temporary demandSpike (+0.6 or -0.4) to a random good at the current system's nodes for the remainder of this visit. Can create a quick buy-low-sell-high opportunity.

### Ship Selection
- On `generateExplorationTraffic()`, mark 1-2 civilian (non-pirate) ships as interactable
- Set `ship.tradeEncounter = { type, ... }` with encounter-specific data
- Only merchant/federation civilian ships (not pirates, not warships)

### Visual Indicators
- Ships with trade encounters get a **pulsing highlight ring** (like detection zones but green/gold)
- When the player is within interaction range (~4 units), show **targeting corners** around the ship (reuse the planet targeting overlay approach)
- Ship's encounter icon (💰/⛽/📡) drawn above it

### Interaction Flow
1. Player flies within `interactRadius` (3.0 units) of an encounter ship
2. Harvest bar appears (reuse existing `harvestBar` with 1.0s fill time)
3. On completion, pause game and show encounter dialog
4. Dialog shows the offer with Accept/Decline buttons
5. On accept: apply trade, mark ship as `encountered = true`, hide indicators
6. On decline: mark ship so bar doesn't restart (cooldown like station)
7. Ship continues traveling normally afterwards

### Encounter Dialog
Reuse the mystery event dialog pattern but simpler:
```html
<div id="tradeEncounterDialog">
    <div class="encounter-title">Merchant Hail</div>
    <div class="encounter-text">"We need to offload 10 units of Metals fast.
    Half price — 275 CR total. Interested?"</div>
    <div class="encounter-actions">
        <button onclick="acceptTradeEncounter()">Accept</button>
        <button onclick="declineTradeEncounter()">Decline</button>
    </div>
</div>
```

### State
- `ship.tradeEncounter`: `{ type, goodId, quantity, price, ... }` — encounter data
- `ship.encountered`: boolean — set true after interaction, hides indicators
- `gameState.activeTradeEncounter`: reference to current encounter ship (while dialog open)
- `gameState.tradeEncounterCooldown`: reference to ship player just declined (prevent re-trigger)

### Files Modified
- `index.html`:
  - New `TRADE_ENCOUNTER_TYPES` constant
  - Modify `generateExplorationTraffic()`: mark 1-2 ships as encounter ships
  - New `generateTradeEncounter(ship)`: creates encounter data for a ship
  - Modify `updateExplorationTraffic()` or docking check area: add proximity detection for encounter ships
  - New encounter dialog HTML + CSS
  - New `openTradeEncounterDialog()`, `acceptTradeEncounter()`, `declineTradeEncounter()`
  - Draw encounter indicators (icon above ship, highlight ring)
  - Encounter ships need `interactRadius` and visual indicator meshes

### Edge Cases
- Player has no cargo space for cargo dump: show but disable Accept
- Player has no fuel to sell: show but disable Accept
- Ship gets destroyed before interaction: encounter lost
- Ship scrolls off screen: encounter lost (ships are transient)
- Player already encountered this ship: skip proximity check
- Multiple encounter ships nearby: only dock with closest
