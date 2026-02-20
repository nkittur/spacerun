# Space Run - Stellar Astronomy System

This document describes the procedural star system generation used in Space Run.

## Star Classifications

Each level generates a star system with a central star and orbiting planets. Stars are classified based on astronomical properties.

| Star Type | Age | Temperature | Size | Life Chance | Ruins Chance | Gas Giant Chance | Icon |
|-----------|-----|-------------|------|-------------|--------------|------------------|------|
| **Blue Giant** | Young (<100My) | Hot (10,000-30,000K) | Giant | 0% | 0% | 70% | 🔵 |
| **Yellow Dwarf** | Medium (1-10By) | Medium (5,000-6,000K) | Medium | 40% | 15% | 30% | 🟡 |
| **Red Giant** | Old (10+By) | Cool (3,000-4,000K) | Giant | 10% | 50% | 20% | 🔴 |
| **Orange Dwarf** | Young | Cool | Small | 20% | 0% | 40% | 🟠 |
| **Red Dwarf** | Ancient (10+By) | Cool | Small | 30% | 60% | 10% | 🔸 |
| **White Star** | Medium | Hot | Medium | 5% | 20% | 50% | ⚪ |

### Star Distribution Weights
- Blue Giant: 10%
- Yellow Dwarf: 35% (most common)
- Red Giant: 15%
- Orange Dwarf: 15%
- Red Dwarf: 15%
- White Star: 10%

## Planet Types by Star

### Blue Giant Systems
Young, hot systems with lots of gas giants forming:
- BlueGiant, GreenGiant, OrangeGiant, Rocky, Barren
- 3-6 planets typical

### Yellow Dwarf Systems (like our Sun)
Balanced systems good for life:
- Rocky, Cratered, Lush, Tropical, Ocean, Frozen, YellowGiant
- 2-5 planets typical

### Red Giant Systems
Old, dying stars with ancient civilizations:
- Magma, Cratered, Barren, Lunar, RedGiant, Arid
- 1-4 planets (some consumed by expanding star)

### Red Dwarf Systems
Ancient, stable systems with evolved civilizations:
- Cratered, Lunar, Frozen, Glacial, Dry
- 1-3 planets

## Special Planet Features

### Life (🌿)
- **Resource**: Biologics (30-60 units)
- **Found on**: Lush, Tropical, Ocean planets
- **Star affinity**: Yellow Dwarf (40% chance), Orange Dwarf (20%), Red Dwarf (30%)
- **Note**: Never appears in Blue Giant systems (too young)

### Ancient Ruins (🏛️)
- **Resource**: Artifacts (10-30 units)
- **Found on**: Rocky, Cratered, Barren, Lunar, Arid, Dry planets
- **Star affinity**: Red Giant (50%), Red Dwarf (60%), Yellow Dwarf (15%)
- **Note**: Only appears in old/ancient star systems

### Fuel Deposits (⛽)
- **Resource**: Hydrogen (40-80 units)
- **Found on**: Gas giants (BlueGiant, GreenGiant, OrangeGiant, RedGiant, YellowGiant)
- **Note**: Higher chance around stars with high gas giant probability

### Rich Mineral Deposits (💎)
- **Resource**: Gold (15-35), Titanium (20-40)
- **Found on**: Magma, Cratered, Rocky, Lunar
- **Star affinity**: Red Giant (40%), Red Dwarf (50%)

## Planet Hazards

Hazards cause damage during harvesting. Future equipment upgrades will provide protection.

### Heat (🔥)
- **Damage**: 2 per tick
- **Found on**: Magma, Arid, Dry planets
- **More common near**: Blue Giant, White Star systems

### High Gravity (⬇️)
- **Damage**: 3 per tick
- **Fuel cost**: +50% fuel to land
- **Found on**: Gas giants
- **More common near**: Red Giant, Blue Giant systems

### Toxic Atmosphere (☠️)
- **Damage**: 1 per tick
- **Found on**: GreenGiant, OrangeGiant, Magma
- **More common near**: Orange Dwarf, Red Dwarf systems

### Radiation (☢️)
- **Damage**: 2 per tick
- **Found on**: Barren, Cratered, Lunar, Rocky
- **More common near**: Blue Giant, White Star systems

## Fuel System

Landing on planets costs fuel based on planet type:

| Planet Category | Fuel Cost |
|-----------------|-----------|
| **Gas Giants** | 12-18 |
| **Rocky/Solid** | 3-8 |
| **Ice Worlds** | 5-6 |
| **Life Planets** | 6-7 |
| **Arid Planets** | 3-4 |

- High gravity planets cost 50% more fuel
- Running out of fuel = Stranded (must harvest hydrogen, call for help, or drift to station)
- Starting fuel: 100 units
- Refuel at Fuel stations or harvest hydrogen from gas giants

## Resource Types

| Resource | Symbol | Color | Source |
|----------|--------|-------|--------|
| Iron | Fe | Gray | Rocky, Cratered, Magma |
| Copper | Cu | Orange | Barren, Arid |
| Silicon | Si | Blue-gray | Rocky, Barren, Arid |
| Titanium | Ti | Silver | Cratered, Lunar, Mineral-rich |
| Hydrogen | H | Light blue | Gas giants, Fuel-rich |
| Helium | He | Tan | Gas giants |
| Water | H2O | Blue | Ice worlds, Ocean |
| Carbon | C | Dark gray | Life planets |
| Oxygen | O | Green | Life planets, Ice |
| Sulfur | S | Yellow | Magma |
| Nitrogen | N | Purple | Frozen, Glacial |
| Gold | Au | Gold | Magma, Mineral-rich |
| **Biologics** | Bio | Bright green | Life planets |
| **Artifacts** | Art | Magenta | Ancient ruins |

## Star Map

Players navigate between systems using the star map (M key). Each system has:
- **Faction**: Controls station services, tariffs, and NPC behavior
- **Security**: 0-5 scale, affects pirate density and NPC trade flow
- **Nodes**: 1-3 stations/planets with trade goods, industries, and services
- **Connections**: Links to adjacent systems for jump travel

## Design Philosophy

The system follows real astronomical principles:
1. **Young stars** (Blue Giant, Orange Dwarf): No ruins, active planet formation, abundant gas
2. **Middle-aged stars** (Yellow Dwarf, White): Best chance for life, some ancient ruins
3. **Old stars** (Red Giant, Red Dwarf): High ruins chance, concentrated minerals, less life

This creates meaningful choices when exploring the star map:
- Need artifacts? Seek old red stars
- Need biologics? Seek yellow sun-like stars
- Need fuel? Seek young gas-rich systems (but watch out for hazards!)
