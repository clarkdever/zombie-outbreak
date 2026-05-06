import { describe, expect, it } from "vitest";
import { TERRAIN_COLUMNS, terrainFrameFor } from "../../src/app/terrainSprites";

describe("terrain sprite atlas contract", () => {
  it("uses deterministic variants for repeated terrain kinds", () => {
    expect(terrainFrameFor("grass", 3, 4)).toEqual(terrainFrameFor("grass", 3, 4));
    expect(terrainFrameFor("grass", 3, 4).column).toBeLessThan(TERRAIN_COLUMNS);
  });

  it("maps semantic terrain kinds to dedicated atlas rows", () => {
    expect(terrainFrameFor("crosswalk", 14, 14).row).toBe(7);
    expect(terrainFrameFor("houseWall", 4, 4).row).toBeGreaterThanOrEqual(16);
    expect(terrainFrameFor("carpet", 5, 5).row).toBeGreaterThanOrEqual(12);
    expect(terrainFrameFor("furniture", 7, 5).row).toBeGreaterThanOrEqual(14);
  });
});
