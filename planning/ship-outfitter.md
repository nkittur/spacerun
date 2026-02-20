# Ship Outfitter UI — Design

## Rationale
The current outfitter is a plain text list — hardpoints, inventory, shop. It's functional but doesn't give the player a sense of their ship. A visual outfitter with the 3D ship model as a backdrop, hardpoint indicators overlaid on the ship, and a unified equipment panel creates a much more immersive and intuitive experience. Players can see where their weapons go and what their ship looks like at a glance.

## Design

### Layout (Outfitter Section)
```
┌─────────────────────────────────────────────┐
│ OUTFITTER                                    │
│ ┌──────────────────┬──────────────────────── │
│ │                  │  HARDPOINTS              │
│ │   [3D Ship       │  [1] Medium: Pulse Mk2  │
│ │    Model         │  [2] Light: Empty        │
│ │    Rotating]     │                          │
│ │                  │  SYSTEMS                 │
│ │   HP●  ○HP       │  Engine Boost: Lv2       │
│ │                  │  Jump Drive: Lv1         │
│ │                  │  Hull: Lv3               │
│ │                  │  FTL Booster: ✓          │
│ ├──────────────────┤                          │
│ │ INVENTORY        ├──────────────────────── │
│ │ Scatter Gun Lv2  │  SHOP                    │
│ │ Beam Rifle Lv1   │  Railgun Mk1    200CR   │
│ │                  │  Mortar Tube    350CR    │
│ └──────────────────┴──────────────────────── │
└─────────────────────────────────────────────┘
```

### Implementation Approach

#### 3D Ship Preview
- Create a **second Babylon.js canvas** (`outfitterCanvas`) inside the outfitter section
- Create a separate Babylon engine+scene for the preview (lightweight, no game objects)
- Load the player's current ship model into this scene
- Use an ArcRotateCamera so the player can rotate/zoom their ship
- Slowly auto-rotate when not interacting
- Camera target at origin, ship at origin facing up

#### Hardpoint Panel (right side)
- Iterate `gameState.fleet[0].hardpoints` — show each slot with size badge and equipped weapon
- Click a hardpoint → shows compatible weapons from inventory below, click to equip
- "Remove" button to unequip back to inventory

#### Systems Panel (right side, below hardpoints)
- Read from `gameState.shipUpgrades` and `gameState.equipment`
- Display current level for each upgrade
- No upgrade buttons here (upgrades happen in Shipyard, equipment in this same panel)

#### Inventory Panel (bottom-left)
- Weapons in `gameState.ownedWeapons` not currently equipped
- Click weapon → shows compatible hardpoints to mount to
- Sell button for each weapon

#### Shop Panel (bottom-right)
- Station-generated weapons available for purchase (existing functionality)
- Buy → goes to inventory

### State Changes
- No new gameState fields needed — uses existing fleet, ownedWeapons, shipUpgrades, equipment
- New: `outfitterScene`, `outfitterEngine` (local vars, created/disposed on open/close)

### Files Modified
- `index.html`:
  - Outfitter section HTML: replace current `weaponsList` div with new layout
  - New CSS for outfitter panels, ship preview canvas
  - New `initOutfitterPreview()`, `disposeOutfitterPreview()` functions
  - Refactored `updateWeaponsList()` → works with new layout
  - `updateSystemsList()` — new function for systems/equipment panel

### Edge Cases
- Player has no ship in fleet (shouldn't happen, but guard with defaults)
- Model loading fails: show a fallback silhouette or skip the preview
- Mobile: preview canvas should be smaller or hidden, panels stack vertically
- Performance: dispose the outfitter scene when leaving the section

### Incremental Approach
Phase 1 (this implementation):
- New layout with panels (hardpoints, systems, inventory, shop)
- Ship preview canvas with rotating model
- All existing functionality preserved in new layout

Phase 2 (future):
- Click-on-ship-model to select hardpoints
- Drag-and-drop weapons onto hardpoints
- Visual weapon mount points on the 3D model
