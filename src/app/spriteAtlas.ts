import { SPRITE_SHEETS, type SpriteAnimation, type SpriteDirection, type SpriteSheetKey } from "./spriteManifest";

export interface LoadedSpriteSheet {
  image: CanvasImageSource;
  direction?: SpriteDirection;
  animation?: SpriteAnimation;
}

export interface SpriteAtlas {
  get(sheetId: SpriteSheetKey, direction: SpriteDirection, animation: SpriteAnimation): LoadedSpriteSheet | undefined;
}

interface GeneratedSpriteManifest {
  sheets: Array<{
    id: SpriteSheetKey;
    direction?: SpriteDirection;
    animation?: SpriteAnimation;
    src: string;
  }>;
}

export class BrowserSpriteAtlas implements SpriteAtlas {
  private readonly sheets = new Map<string, LoadedSpriteSheet>();

  get(sheetId: SpriteSheetKey, direction: SpriteDirection, animation: SpriteAnimation): LoadedSpriteSheet | undefined {
    return (
      this.sheets.get(spriteAtlasKey(sheetId, direction, animation)) ??
      this.sheets.get(spriteAtlasKey(sheetId, undefined, animation)) ??
      this.sheets.get(spriteAtlasKey(sheetId, direction)) ??
      this.sheets.get(spriteAtlasKey(sheetId))
    );
  }

  async load(manifestUrl = "/assets/sprites/generated/manifest.json"): Promise<void> {
    const manifest = await fetchGeneratedManifest(manifestUrl);
    if (!manifest) return;
    await Promise.all(
      manifest.sheets.map((sheet) => this.loadSheet(sheet.id, sheet.src, sheet.direction, sheet.animation).catch(() => undefined))
    );
  }

  private async loadSheet(sheetId: SpriteSheetKey, src: string, direction?: SpriteDirection, animation?: SpriteAnimation): Promise<void> {
    if (!SPRITE_SHEETS[sheetId]) return;
    const image = await loadImage(src);
    this.sheets.set(spriteAtlasKey(sheetId, direction, animation), { image, direction, animation });
  }
}

export function spriteAtlasKey(sheetId: SpriteSheetKey, direction?: SpriteDirection, animation?: SpriteAnimation): string {
  return [sheetId, direction, animation].filter(Boolean).join(":");
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
