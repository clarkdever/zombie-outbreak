import { describe, expect, it } from "vitest";
import { spriteAtlasKey } from "../../src/app/spriteAtlas";
import type { SpriteAnimation, SpriteDirection, SpriteSheetKey } from "../../src/app/spriteManifest";
import generatedManifest from "../../public/assets/sprites/generated/manifest.json";

describe("sprite atlas keys", () => {
  it("separates generated sheets by entity, direction, and animation", () => {
    expect(spriteAtlasKey("armedHuman", "left")).toBe("armedHuman:left");
    expect(spriteAtlasKey("armedHuman", "right", "shoot")).toBe("armedHuman:right:shoot");
    expect(spriteAtlasKey("zombieArmedHuman", "right", undefined, 2)).toBe("zombieArmedHuman:v2:right");
    expect(spriteAtlasKey("skeletonHuman", undefined, "skeleton")).toBe("skeletonHuman:skeleton");
    expect(spriteAtlasKey("armedHuman")).toBe("armedHuman");
  });

  it("publishes a complete armed-human v1 alive animation set", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );
    const directions = ["down", "left", "up", "right"] as const;
    const animations = ["idle", "walk", "run", "shoot"] as const;

    for (const direction of directions) {
      for (const animation of animations) {
        expect(keys).toContain(spriteAtlasKey("armedHuman", direction, animation));
      }
    }
  });

  it("publishes generated unarmed-human direction sheets", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );

    expect(keys).toContain(spriteAtlasKey("human", "down"));
    expect(keys).toContain(spriteAtlasKey("human", "left"));
    expect(keys).toContain(spriteAtlasKey("human", "up"));
    expect(keys).toContain(spriteAtlasKey("human", "right"));
  });

  it("supports animation shard sheets for unarmed humans", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );
    const directions = ["down", "left", "up", "right"] as const;
    const animations = ["idle", "walk", "run"] as const;

    for (const direction of directions) {
      for (const animation of animations) {
        expect(keys).toContain(spriteAtlasKey("human", direction, animation));
      }
    }
  });

  it("publishes a complete zombie-human v1 animation set", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );
    const directions = ["down", "left", "up", "right"] as const;
    const animations = ["idle", "walk", "run", "attack", "feed", "attackUnarmedHuman", "feedUnarmedHuman", "attackArmedHuman", "feedArmedHuman", "attackDog", "feedDog"] as const;

    for (const direction of directions) {
      for (const animation of animations) {
        expect(keys).toContain(spriteAtlasKey("zombieHuman", direction, animation));
      }
    }
  });

  it("publishes grapple animation sheets for zombie human damage variants", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(
          sheet.id as SpriteSheetKey,
          sheet.direction as SpriteDirection | undefined,
          sheet.animation as SpriteAnimation | undefined,
          sheet.variant
        )
      )
    );
    const directions = ["down", "left", "up", "right"] as const;
    const animations = ["attackUnarmedHuman", "attackArmedHuman", "attackDog", "feedUnarmedHuman", "feedArmedHuman", "feedDog"] as const;

    for (let variant = 0; variant < 4; variant += 1) {
      for (const direction of directions) {
        for (const animation of animations) {
          expect(keys).toContain(spriteAtlasKey("zombieHuman", direction, animation, variant));
        }
      }
    }
  });

  it("publishes zombie human damage variants for armed and unarmed bodies", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(
          sheet.id as SpriteSheetKey,
          sheet.direction as SpriteDirection | undefined,
          sheet.animation as SpriteAnimation | undefined,
          sheet.variant
        )
      )
    );
    const directions = ["down", "left", "up", "right"] as const;

    for (let variant = 0; variant < 4; variant += 1) {
      for (const direction of directions) {
        expect(keys).toContain(spriteAtlasKey("zombieHuman", direction, undefined, variant));
        expect(keys).toContain(spriteAtlasKey("zombieArmedHuman", direction, undefined, variant));
      }
    }
  });

  it("publishes human and dog skeleton variant sheets", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );

    expect(keys).toContain(spriteAtlasKey("skeletonHuman", undefined, "skeleton"));
    expect(keys).toContain(spriteAtlasKey("skeletonDog", undefined, "skeleton"));
  });

  it("publishes generated dog direction sheets", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );

    expect(keys).toContain(spriteAtlasKey("dog", "down"));
    expect(keys).toContain(spriteAtlasKey("dog", "left"));
    expect(keys).toContain(spriteAtlasKey("dog", "up"));
    expect(keys).toContain(spriteAtlasKey("dog", "right"));
  });

  it("publishes generated zombie-dog direction sheets", () => {
    const keys = new Set(
      generatedManifest.sheets.map((sheet) =>
        spriteAtlasKey(sheet.id as SpriteSheetKey, sheet.direction as SpriteDirection | undefined, sheet.animation as SpriteAnimation | undefined)
      )
    );

    expect(keys).toContain(spriteAtlasKey("zombieDog", "down"));
    expect(keys).toContain(spriteAtlasKey("zombieDog", "left"));
    expect(keys).toContain(spriteAtlasKey("zombieDog", "up"));
    expect(keys).toContain(spriteAtlasKey("zombieDog", "right"));
  });
});
