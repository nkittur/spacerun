# Exploration Mode Strategy

## Why We Moved Away From Wave-Based Combat

The old design spawned scripted enemy waves at level start. This felt static and
arcade-like — the player had no agency over when or where combat happened, and
the world felt empty between waves. The new exploration-first design replaces
that with a living world the player flies through, discovering combat organically.

## Core Design Principle

**All combat emerges from NPC behavior, not from scripted wave spawns.**

The player explores a zoomed-out (4x) star system filled with NPC traffic —
merchant convoys, military escorts, independent haulers, and pirates. Pirates
attack nearby non-hostile ships, creating skirmishes the player can observe or
fly into. The player chooses engagement, not the game.

## Game Flow

```
Exploration (4x zoom) → NPC Skirmish Detected → Player Approaches →
Combat Encounter (1x zoom) → Victory/Escape → Back to Exploration (4x zoom) →
... repeat ... → Reach Goal Sun → Level End Rewards → Warp Gate → Next Level
```

### Exploration Phase
- Camera is zoomed out 4x, showing a wide view of the star system
- NPC traffic ships (merchants, military, pirates, independents) travel across
  the map on generated routes toward the goal sun
- Pirates are the only hostile faction — they attack nearby non-hostiles
- Warships of the defender's faction may join the fight as allies
- The player flies toward the goal sun at the far end of the level

### Combat Phase
- When the player flies near an active skirmish or a pirate's detection zone,
  combat begins
- Camera zooms to 1x, traffic is paused, enemies spawn from the NPC ships
  involved in the conflict
- Player uses "Weapons Hot/Safe" toggle to control whether they fire
- After the encounter resolves, camera zooms back to 4x and exploration resumes

### Level Completion
- Reaching the goal sun triggers `generateLevelEndContent()` — a reward zone
  with loot and warp gates to the next level

## Key Rules (Do Not Break These)

1. **`spawnWave()` is ONLY for arena mode.** Never call it during normal
   gameplay. Mystery events that spawn enemies (pirate ambush, traps) are the
   only non-arena exception.

2. **`enterExplorationMode()` is the universal entry point.** Every game-state
   transition that starts gameplay must call it: `startGame`, `startNewLevel`,
   `resetGame`, station departures, event outcomes. Never start a level with
   wave spawning.

3. **Combat comes from NPC conflicts.** Pirates attack merchants/military →
   skirmishes form → player flies into them. The player discovers combat in the
   world; combat does not come to the player on a timer.

4. **Zoom is the mode indicator.** 4x = exploration, 1x = combat. Smooth lerp
   transitions between them. All viewport math must account for
   `gameState.zoomLevel`.

5. **Weapons Hot toggle matters.** In exploration mode the toggle controls
   whether the player fires. It must reset to `false` on level transitions,
   game resets, and exploration entry. The button is only visible at zoom >= 2.

6. **Faction enemies are not wave enemies.** Enemies with a `faction` property
   must not count toward `escapedEnemies` or wave-completion checks. Filter
   them: `enemies.filter(e => !e.faction)`.

## NPC Traffic System Summary

| Component | Purpose |
|---|---|
| `FACTIONS` | Defines 4 factions (federation, merchants, pirates, independent) with colors and hostility |
| `TRAFFIC_TYPES` | 15 ship types with faction, strength, speed, warship flag |
| `generateExplorationTraffic()` | Spawns initial convoy batch (6-8 civilians + 1-2 pirates) |
| `generateTrafficShip()` | Creates one ship with route, stats, and behavior |
| `updateExplorationTraffic()` | Per-frame movement, respawning, behavior state machine |
| `checkSkirmishStarts()` | Pirates attack nearby targets — the combat generator |
| `checkAlliedJoins()` | Same-faction warships join existing fights |
| `updateSkirmishes()` | Animates orbital combat, damage, beam effects |
| `resolveSkirmish()` | Determines winner, cleans up, may create player encounter |
| `checkEncounterDetection()` | Detects player entering pirate zone or active skirmish |
| `cleanupExploration()` | Full teardown of traffic, skirmishes, goal on level change |

## Why This Is Better

- **Player agency**: You choose which fights to engage
- **Living world**: NPC ships have independent behavior and create emergent stories
- **Pacing variety**: Exploration stretches between combat let the player breathe
- **Difficulty scaling**: Combat difficulty comes from NPC strength and numbers, not
  wave scripts — it scales naturally with level config
- **Replayability**: Random traffic generation means no two runs play the same
