import { SPRITE_SHEETS, type SpriteSheetKey } from "./spriteManifest";

export interface LoadedSpriteSheet {
  image: CanvasImageSource;
}

export interface SpriteAtlas {
  get(sheetId: SpriteSheetKey): LoadedSpriteSheet | undefined;
}

interface GeneratedSpriteManifest {
  sheets: Array<{
    id: SpriteSheetKey;
    src: string;
  }>;
}

export class BrowserSpriteAtlas implements SpriteAtlas {
  private readonly sheets = new Map<SpriteSheetKey, LoadedSpriteSheet>();

  get(sheetId: SpriteSheetKey): LoadedSpriteSheet | undefined {
    return this.sheets.get(sheetId);
  }

  async load(manifestUrl = "/assets/sprites/generated/manifest.json"): Promise<void> {
    const manifest = await fetchGeneratedManifest(manifestUrl);
    if (!manifest) return;
    await Promise.all(manifest.sheets.map((sheet) => this.loadSheet(sheet.id, sheet.src).catch(() => undefined)));
  }

  private async loadSheet(sheetId: SpriteSheetKey, src: string): Promise<void> {
    if (!SPRITE_SHEETS[sheetId]) return;
    const image = await loadImage(src);
    this.sheets.set(sheetId, { image });
  }
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
