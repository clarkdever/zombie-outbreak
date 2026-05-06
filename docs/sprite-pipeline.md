# Sprite Pipeline

The current in-game sprites are a bridge implementation: they prove animation timing, facing, anchors, and state mapping before final art lands. Generate and test one entity sheet at a time before expanding the full set.

## Runtime Contract

Sprite sheets live in `public/assets/sprites/generated/` and are discovered through `manifest.json`. The first test sheet is `armed-human.png`, because weapon stance, muzzle flash, and scale are easy to judge in-game.

Direction is part of the contract. A complete character set needs front/down, back/up, and side views. Side views may be mirrored for left/right, but front and back need authored frames so entities do not appear to aim or walk in the wrong screen direction. Until a sheet supports all four directions, the renderer should only use it for the supported directions and fall back to the code-native sprite for the rest.

Generated manifests may provide one sheet per direction, or one sheet per direction and animation. Use `direction: "down"`, `"up"`, `"left"`, or `"right"` on each manifest entry. Add `animation` when a sheet contains only that animation row. Left and right can point at the same side-view PNG only when the sheet is not already authored for a specific direction.

The preferred image-generation workflow is several smaller prompt sets per character:

- Locomotion: `idle`, `walk`, and `run`
- Combat: `attack` and `shoot`
- Reactions: `panic/warn`, `downed`, `infected/turning/death`

Generate those groups per direction rather than asking for the whole character state machine in one prompt. Smaller sheets reduce frame bleed, extra characters, and direction drift.

Current proof strips: side-facing `walk`, `run`, and `shoot` strips plus a front/down `walk` strip for `armedHuman`. They override only those exact animation/direction combinations while the older generated side sheet or code-native sprites cover the rest.

Each sheet uses a higher-detail source size so the art can look SNES-or-better while still rendering at board scale:

- Frame size: `96x96`
- Sheet size: `384x768`
- Columns: `4`
- Rows: `8`
- Anchor: `48,76`
- Camera: isometric three-quarter view
- Background: transparent
- Output format: PNG

Rows are fixed across sheets:

| Row | Animation |
| --- | --- |
| 0 | idle |
| 1 | walk |
| 2 | run |
| 3 | attack |
| 4 | shoot |
| 5 | feed |
| 6 | downed |
| 7 | skeleton |

Humans, armed humans, zombies, corpses, and skeletons use the full row contract. Dogs and zombie dogs reuse the same row meanings, with row 4 reserved for feed instead of shoot.

## Native Generation Prompt

Use the native image generation tool for each sheet. Keep the prompt direct:

> Create a transparent PNG sprite sheet for a retro 16-bit isometric arcade horror game. Sheet size is 384x768. Each frame is 96x96 pixels, arranged 4 columns by 8 rows. Keep the character centered on the same anchor point at pixel 48,76 in every frame. Camera angle is isometric three-quarter top-down, matching a 48x24 isometric tile grid. Use SNES-or-better pixel-art detail, chunky dark outlines, readable silhouettes, limited palette, crisp pixel-art edges, no text, no labels, no background.

Then append the entity-specific line:

- Human: calm civilian survivor, green clothing accents, unarmed.
- Armed human: civilian survivor with a small handgun, blue clothing accents, include clear aim and muzzle-flash poses on the shoot row.
- Dog: medium-sized loyal dog, tan coat, readable trot and run cycles.
- Zombie human: infected human, red identifying accents, bite/lunge/feed poses.
- Zombie dog: infected dog, red identifying accents, chase/lunge/feed poses.
- Corpse: downed body states and bitten/hurt variants, still readable from isometric view.
- Skeleton: white skeleton remains, idle/downed rows can hold static readable poses.

## Renderer Behavior

The renderer tries to load `/assets/sprites/generated/manifest.json`. If a sheet is listed and loads, that sheet is used. If the manifest or a sheet is missing, the renderer keeps using the code-native pixel sprite fallback.
