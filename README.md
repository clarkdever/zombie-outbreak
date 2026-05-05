# Zombie Outbreak

An isometric small-town zombie outbreak simulation where the interesting stories come from simple rules colliding: hearing circles, vision cones, panic, dogs barking at exactly the wrong time, humans forming shaky survivor groups, and zombies drifting into hordes because every loud mistake is dinner bell-shaped.

This repo is currently in **design and implementation-planning stage**. The first playable target is a graybox MVP focused on simulation feel before final sprite art.

## The Pitch

You start with a quiet neighborhood: streets, fenced yards, trees, cars, houses, humans, dogs, and a few zombies.

Then the rules take over.

- Humans see zombies, panic, warn each other, group up, flee, or shoot.
- Dogs follow their owners, bark at threats, and sometimes save people by making everything worse.
- Zombies hear noise, see living targets, bite, feed, wander when unstimulated, and naturally cluster into hordes.
- Downed infected bodies race between reanimation and being eaten down to skeletons.
- The player can click any human, dog, or zombie and directly possess it with WASD.

The vibe target is **retro 16-bit isometric arcade horror**, with a Metal Slug-like influence planned for later sprite sheets.

## MVP Priorities

The first build is intentionally graybox:

- 30x30 handcrafted isometric neighborhood
- Tile-based simulation with smooth visual movement
- Humans, dogs, human zombies, dog zombies, bodies, and skeletons
- Circular hearing and cone-based sight
- Species-specific senses
- Noise events for guns, screams, barking, growling, feeding, speech, and struggle
- HP, guaranteed bite infection, infection decline, turning delay, meat meters
- Zombie feeding capped per body
- Human warning, loose groups, armed leadership, and group outlines
- Dog ownership, owner-name affiliation, and post-owner-death behavior
- Possession, edge-scroll camera, follow-selected mode, time controls
- End modal with name-based facts and a zombie-over-time histogram

## Development Docs

The project is being built from written specs so the simulation stays coherent as it grows:

- [MVP design spec](docs/superpowers/specs/2026-05-05-zombie-outbreak-design.md)
- [Implementation plan](docs/superpowers/plans/2026-05-05-zombie-outbreak-implementation.md)

## Planned Stack

- TypeScript
- Vite
- Vitest
- Canvas 2D
- No gameplay framework for the MVP

The simulation code should stay pure and testable under `src/sim/*`. Browser input, rendering, and UI live under `src/app/*`.

## Local Development

Once implementation starts:

```bash
npm install
npm run dev
```

Expected checks:

```bash
npm test
npm run build
```

## Current Status

- Design spec: complete
- Implementation plan: complete
- App scaffold: not started
- Sprite generation: deferred until graybox simulation is playable

## Later Fun

The backlog is full of good trouble:

- GPT-image-2 sprite sheets and palette swaps
- Carcassonne-style procedural neighborhood macro-tiles
- Seamless edge wrapping
- Individual bravery, panic, accuracy, hearing, speed, and dog temperament
- Partially eaten zombie sprites and movement penalties
- Barricading, sheltering, ammo, alarms, car horns, day/night, and extraction goals

First, we make the neighborhood breathe.
