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

- `armed-human-right-shoot.png`
- `armed-human-left-shoot.png`
