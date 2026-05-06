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

When at least one sheet is ready, add `manifest.json` next to the images:

```json
{
  "sheets": [
    { "id": "armedHuman", "src": "/assets/sprites/generated/armed-human.png" }
  ]
}
```

The renderer loads this manifest at runtime. Missing sheets fall back to the code-native pixel sprites.
