import { SPRITE_SHEETS, type SpriteDirection, type SpriteSheetKey } from "./spriteManifest";

export interface LoadedSpriteSheet {
  image: CanvasImageSource;
}

export interface SpriteAtlas {
  get(sheetId: SpriteSheetKey, direction: SpriteDirection): LoadedSpriteSheet | undefined;
}

interface GeneratedSpriteManifest {
  sheets: Array<{
    id: SpriteSheetKey;
    direction?: SpriteDirection;
    src: string;
  }>;
}

export class BrowserSpriteAtlas implements SpriteAtlas {
  private readonly sheets = new Map<string, LoadedSpriteSheet>();

  get(sheetId: SpriteSheetKey, direction: SpriteDirection): LoadedSpriteSheet | undefined {
    return this.sheets.get(spriteAtlasKey(sheetId, direction)) ?? this.sheets.get(spriteAtlasKey(sheetId));
  }

  async load(manifestUrl = "/assets/sprites/generated/manifest.json"): Promise<void> {
    const manifest = await fetchGeneratedManifest(manifestUrl);
    if (!manifest) return;
    await Promise.all(manifest.sheets.map((sheet) => this.loadSheet(sheet.id, sheet.src, sheet.direction).catch(() => undefined)));
  }

  private async loadSheet(sheetId: SpriteSheetKey, src: string, direction?: SpriteDirection): Promise<void> {
    if (!SPRITE_SHEETS[sheetId]) return;
    const image = await loadImage(src);
    this.sheets.set(spriteAtlasKey(sheetId, direction), { image });
  }
}

export function spriteAtlasKey(sheetId: SpriteSheetKey, direction?: SpriteDirection): string {
  return direction ? `${sheetId}:${direction}` : sheetId;
}

export function createBrowserSpriteAtlas(): SpriteAtlas {
  const atlas = new BrowserSpriteAtlas();
  void atlas.load();
  return atlas;
}

async function fetchGeneratedManifest(url: string): Promise<GeneratedSpriteManifest | undefined> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return undefined;
    return (await response.json()) as GeneratedSpriteManifest;
  } catch {
    return undefined;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load sprite sheet: ${src}`));
    image.src = src;
  });
}
