# Sprite Pipeline

The current in-game sprites are a bridge implementation: they prove animation timing, facing, anchors, and state mapping before final art lands.

## Runtime Contract

Sprite sheets live in `public/assets/sprites/generated/` and are discovered through `manifest.json`.

Each sheet uses:

- Frame size: `64x64`
- Columns: `4`
- Anchor: `32,48`
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

> Create a transparent PNG sprite sheet for a retro 16-bit isometric arcade horror game. Sheet size is 256x512. Each frame is 64x64 pixels, arranged 4 columns by 8 rows. Keep the character centered on the same anchor point at pixel 32,48 in every frame. Camera angle is isometric three-quarter top-down, matching a 48x24 isometric tile grid. Use chunky dark outlines, readable silhouettes, limited palette, crisp pixel-art edges, no text, no labels, no background.

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
