# Zombie Outbreak

An isometric small-town zombie outbreak simulation where the interesting stories come from simple rules colliding: hearing circles, vision cones, panic, dogs barking at exactly the wrong time, humans forming shaky survivor groups, and zombies drifting into hordes because every loud mistake is dinner bell-shaped.

This repo now has a **playable graybox MVP** focused on simulation feel before final sprite art.

## The Pitch

You start with a quiet neighborhood: streets, fenced yards, trees, cars, houses, humans, dogs, and a few zombies.

Then the rules take over.

- Humans wander, see zombies, panic, warn each other, group up, flee, or shoot if armed.
- Dogs follow their owners, bark at threats, and sometimes save people by making everything worse.
- Zombies hear noise, see living targets, bite, feed, wander when unstimulated, and naturally cluster into hordes.
- Downed infected bodies race between reanimation and being eaten down to skeletons.
- The player can click any human, dog, or zombie and directly possess it with WASD.

The vibe target is **retro 16-bit isometric arcade horror**, with a Metal Slug-like influence planned for later sprite sheets.

## Current Features

The first build is intentionally graybox and includes:

- 30x30 handcrafted isometric neighborhood
- Tile-based simulation with Canvas 2D isometric rendering
- Humans, dogs, human zombies, dog zombies, bodies, and skeletons
- Circular hearing and cone-based sight
- Species-specific senses
- Noise and stimulus feedback through hearing circles and vision cones
- HP, guaranteed bite infection, infection decline, turning delay, meat meters
- Zombie feeding capped per body
- Human groups, armed leaders, and basic armed-human attacks
- Dog ownership and barking behavior
- Possession, keyboard camera controls, Q/E turning, Space-to-shoot controls, and time controls
- Visible bullet traces with collision damage for zombies, humans, and dogs
- Debug overlays for selected or all entities
- End modal with name-based facts and a zombie-over-time histogram

Entity colors:

- Armed humans: blue
- Unarmed humans: green
- Zombies: red
- Dogs: tan
- Skeletons: white

## Development Docs

The project is being built from written specs so the simulation stays coherent as it grows:

- [MVP design spec](docs/superpowers/specs/2026-05-05-zombie-outbreak-design.md)
- [Implementation plan](docs/superpowers/plans/2026-05-05-zombie-outbreak-implementation.md)

## Stack

- TypeScript
- Vite
- Vitest
- Canvas 2D
- No gameplay framework for the MVP

The simulation code should stay pure and testable under `src/sim/*`. Browser input, rendering, and UI live under `src/app/*`.

## Build And Run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL Vite prints, usually:

```text
http://127.0.0.1:5173/
```

Production build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## How To Play

1. Choose a scenario preset.
2. Optionally open Advanced and adjust human, dog, zombie, and armed-human counts.
3. Press Start.
4. Watch the outbreak unfold on the isometric map.
5. Use the arrow keys to pan the camera.
6. Click a human, dog, or zombie to possess it.
7. Use WASD to move the possessed entity.
8. Use Q/E to turn and look around.
9. If possessing an armed human, press Space to shoot.
10. Use Play/Pause and 1x/2x/4x to control time.
11. Toggle Debug to show all hearing circles, vision cones, and state rings.

## Project Status

- Design spec: complete
- Implementation plan: complete
- Graybox MVP: playable
- Sprite generation: deferred until the simulation feels good

## Later Fun

The backlog is full of good trouble:

- GPT-image-2 sprite sheets and palette swaps
- Carcassonne-style procedural neighborhood macro-tiles
- Seamless edge wrapping
- Individual bravery, panic, accuracy, hearing, speed, and dog temperament
- Partially eaten zombie sprites and movement penalties
- Barricading, sheltering, ammo, alarms, car horns, day/night, and extraction goals

First, we make the neighborhood breathe.
