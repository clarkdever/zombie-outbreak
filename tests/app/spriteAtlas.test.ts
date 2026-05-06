import { describe, expect, it } from "vitest";
import { spriteAtlasKey } from "../../src/app/spriteAtlas";

describe("sprite atlas keys", () => {
  it("separates generated sheets by entity, direction, and animation", () => {
    expect(spriteAtlasKey("armedHuman", "left")).toBe("armedHuman:left");
    expect(spriteAtlasKey("armedHuman", "right", "shoot")).toBe("armedHuman:right:shoot");
    expect(spriteAtlasKey("armedHuman")).toBe("armedHuman");
  });
});
