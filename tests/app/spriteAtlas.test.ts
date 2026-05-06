import { describe, expect, it } from "vitest";
import { spriteAtlasKey } from "../../src/app/spriteAtlas";

describe("sprite atlas keys", () => {
  it("separates generated sheets by entity and direction", () => {
    expect(spriteAtlasKey("armedHuman", "left")).toBe("armedHuman:left");
    expect(spriteAtlasKey("armedHuman", "right")).toBe("armedHuman:right");
    expect(spriteAtlasKey("armedHuman")).toBe("armedHuman");
  });
});
