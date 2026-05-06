# Generated Sprite Sheets

Drop generated sprite sheets here with this naming:

- `human.png`
- `armed-human.png`
- `dog.png`
- `zombie-human.png`
- `zombie-dog.png`
- `corpse.png`
- `skeleton.png`

Each sheet should be `384x768`, with `96x96` frames arranged in 4 columns and 8 rows. Start with one sheet in the manifest so we can judge scale and art direction before generating the full set.

Complete sheets need front/down, back/up, and side views. Side views can be mirrored for left/right. The current `armed-human.png` test sheet is treated as side-view only until we generate proper front and back rows.

When at least one sheet is ready, add `manifest.json` next to the images:

```json
{
  "sheets": [
    { "id": "armedHuman", "src": "/assets/sprites/generated/armed-human.png" }
  ]
}
```

Prefer direction-specific entries once generated sheets exist:

```json
{
  "sheets": [
    { "id": "armedHuman", "direction": "down", "src": "/assets/sprites/generated/armed-human-down.png" },
    { "id": "armedHuman", "direction": "up", "src": "/assets/sprites/generated/armed-human-up.png" },
    { "id": "armedHuman", "direction": "left", "src": "/assets/sprites/generated/armed-human-side.png" },
    { "id": "armedHuman", "direction": "right", "src": "/assets/sprites/generated/armed-human-side.png" }
  ]
}
```

For smaller prompt sets, include both `direction` and `animation`. Animation-specific sheets should be one row tall with four frames:

```json
{
  "sheets": [
    { "id": "armedHuman", "direction": "down", "animation": "walk", "src": "/assets/sprites/generated/armed-human-down-walk.png" },
    { "id": "armedHuman", "direction": "down", "animation": "shoot", "src": "/assets/sprites/generated/armed-human-down-shoot.png" }
  ]
}
```

The renderer loads this manifest at runtime. Missing sheets fall back to the code-native pixel sprites.

Current proof of the shard workflow:

- `armed-human-down-walk.png`
- `armed-human-right-walk.png`
- `armed-human-left-walk.png`
- `armed-human-right-run.png`
- `armed-human-left-run.png`
- `armed-human-right-shoot.png`
- `armed-human-left-shoot.png`

## Terrain Atlas

The terrain sheet is `terrain-atlas.png`. It uses `96x64` isometric frames in 4 columns by 20 rows.

Terrain rows are assigned in `src/app/terrainSprites.ts`:

- rows 0-2: grass and yard variants
- rows 3-4: sidewalk variants
- rows 5-6: street variants
- row 7: crosswalk variants
- rows 8-9: car variants
- rows 10-11: house flooring variants
- rows 12-13: carpet variants
- rows 14-15: furniture variants
- rows 16-17: house half-wall variants
- row 18: fence variants
- row 19: tree variants

Tile variants are chosen deterministically from tile coordinates so the map has texture without flickering between renders.

## Zombie Human Variants

Zombie humans have separate sheet families for unarmed and armed former humans:

- `zombie-human-v{0-3}-{down,left,up,right}.png`
- `zombie-armed-human-v{0-3}-{down,left,up,right}.png`

Each sheet is `384x768`, with `96x96` frames arranged in 4 columns and 8 animation rows. The renderer chooses a stable `zombieHumanVariant` when a zombie spawns or when a human reanimates, so the damage pattern does not change between animations.
