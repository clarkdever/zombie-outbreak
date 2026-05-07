import { describe, expect, it } from "vitest";
import {
  TERRAIN_COLUMNS,
  terrainFrameFor,
  terrainRoadDetailFrameFor,
  terrainSpriteDrawSpecFor,
  terrainSpriteOrientationFor,
  terrainUsesGroundTexture
} from "../../src/app/terrainSprites";
import type { GameMap, TileKind } from "../../src/sim/types";

describe("terrain sprite atlas contract", () => {
  it("uses deterministic variants for repeated terrain kinds", () => {
    expect(terrainFrameFor("grass", 3, 4)).toEqual(terrainFrameFor("grass", 3, 4));
    expect(terrainFrameFor("grass", 3, 4).column).toBeLessThan(TERRAIN_COLUMNS);
  });

  it("maps semantic terrain kinds to dedicated atlas rows", () => {
    expect(terrainFrameFor("crosswalk", 14, 14).row).toBe(7);
    expect(terrainFrameFor("houseWall", 4, 4).atlas).toBe("prop");
    expect(terrainFrameFor("houseWall", 4, 4).row).toBeGreaterThanOrEqual(4);
    expect(terrainFrameFor("carpet", 5, 5).row).toBeGreaterThanOrEqual(12);
    expect(terrainFrameFor("furniture", 7, 5).atlas).toBe("prop");
    expect(terrainFrameFor("furniture", 7, 5).row).toBe(8);
  });

  it("lets tall environmental sprites extend beyond one tile with bottom anchors", () => {
    expect(terrainSpriteDrawSpecFor("tree")).toMatchObject({
      layer: "prop",
      width: 116,
      height: 116,
      anchorY: 104
    });
    expect(terrainSpriteDrawSpecFor("fence")).toMatchObject({
      layer: "prop",
      width: 128,
      height: 96
    });
  });

  it("keeps ground sprites tile-bound below environmental props", () => {
    expect(terrainSpriteDrawSpecFor("grass")).toMatchObject({
      layer: "ground",
      width: 96,
      height: 64
    });
  });

  it("uses seamless base fill for road tiles instead of checkerboard terrain frames", () => {
    expect(terrainUsesGroundTexture("road")).toBe(false);
    expect(terrainUsesGroundTexture("crosswalk")).toBe(false);
    expect(terrainUsesGroundTexture("grass")).toBe(true);
  });

  it("overlays oriented crosswalk detail sprites", () => {
    const vertical = mapFromKinds([
      ["road", "crosswalk", "road"],
      ["road", "crosswalk", "road"],
      ["road", "crosswalk", "road"]
    ]);
    const horizontal = mapFromKinds([
      ["road", "road", "road"],
      ["crosswalk", "crosswalk", "crosswalk"],
      ["road", "road", "road"]
    ]);

    expect(terrainRoadDetailFrameFor("crosswalk", 1, 1, vertical)).toMatchObject({ row: 2 });
    expect(terrainRoadDetailFrameFor("crosswalk", 1, 1, horizontal)).toMatchObject({ row: 1 });
  });

  it("uses sparse road detail decals for ordinary asphalt", () => {
    const map = mapFromKinds([
      ["road", "road", "road"],
      ["road", "road", "road"],
      ["road", "road", "road"]
    ]);

    expect(terrainRoadDetailFrameFor("road", 1, 1, map)?.row).toBe(0);
  });

  it("chooses fence sprite orientation from neighboring fence tiles", () => {
    const map = mapFromKinds([
      ["grass", "fence", "grass"],
      ["grass", "fence", "grass"],
      ["grass", "fence", "grass"]
    ]);

    expect(terrainSpriteOrientationFor(map, "fence", 1, 1)).toBe("northSouth");
    expect(terrainFrameFor("fence", 1, 1, map).row).toBe(0);
  });

  it("chooses wall sprite orientation from neighboring wall tiles", () => {
    const map = mapFromKinds([
      ["grass", "grass", "grass"],
      ["houseWall", "houseWall", "houseWall"],
      ["grass", "grass", "grass"]
    ]);

    expect(terrainSpriteOrientationFor(map, "houseWall", 1, 1)).toBe("eastWest");
    expect(terrainFrameFor("houseWall", 1, 1, map).row).toBe(5);
  });
});

function mapFromKinds(kinds: TileKind[][]): GameMap {
  return {
    width: kinds[0].length,
    height: kinds.length,
    tiles: kinds.map((row) =>
      row.map((kind) => ({
        kind,
        moveCost: 1,
        blocksMovement: false,
        blocksSight: false
      }))
    )
  };
}
