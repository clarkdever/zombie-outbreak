# Generated Sprite Sheets

Drop final generated sprite sheets here with this naming:

- `human.png`
- `armed-human.png`
- `dog.png`
- `zombie-human.png`
- `zombie-dog.png`
- `corpse.png`
- `skeleton.png`

When at least one sheet is ready, add `manifest.json` next to the images:

```json
{
  "sheets": [
    { "id": "human", "src": "/assets/sprites/generated/human.png" }
  ]
}
```

The renderer loads this manifest at runtime. Missing sheets fall back to the code-native pixel sprites.
