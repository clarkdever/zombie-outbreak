import { describe, expect, it } from "vitest";
import { spriteAtlasKey } from "../../src/app/spriteAtlas";
import type { SpriteAnimation, SpriteDirection, SpriteSheetKey } from "../../src/app/spriteManifest";
import generatedManifest from "../../public/assets/sprites/generated/manifest.json";

describe("sprite atlas keys", () => {
  it("separates generated sheets by entity, direction, and animation", () => {
    expect(spriteAtlasKey("armedHuman", "left")).toBe("armedHuman:left");
    expect(spriteAtlasKey("armedHuman", "right", "shoot")).toBe("armedHuman:right:shoot");
    expect(spriteAtlasKey("armedHuman")).toBe("armedHuman");
  });

  it("publishes generated strips for common armed-human screen-facing states", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );

    expect(keys).toContain("armedHuman:down:walk");
    expect(keys).toContain("armedHuman:down:run");
    expect(keys).toContain("armedHuman:left:walk");
    expect(keys).toContain("armedHuman:right:walk");
    expect(keys).toContain("armedHuman:left:run");
    expect(keys).toContain("armedHuman:right:run");
    expect(keys).toContain("armedHuman:left:shoot");
    expect(keys).toContain("armedHuman:right:shoot");
  });
});
