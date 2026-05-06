import { describe, expect, it } from "vitest";
import { createNeighborhoodMap, tileBlocksMovement, tileBlocksSight, wrapTile } from "../../src/sim/map";

describe("map wrapping and tile metadata", () => {
  it("wraps coordinates across all four edges", () => {
    const map = createNeighborhoodMap();
    expect(wrapTile(map, { x: -1, y: 10 })).toEqual({ x: 29, y: 10 });
    expect(wrapTile(map, { x: 30, y: 10 })).toEqual({ x: 0, y: 10 });
    expect(wrapTile(map, { x: 7, y: -1 })).toEqual({ x: 7, y: 29 });
    expect(wrapTile(map, { x: 7, y: 30 })).toEqual({ x: 7, y: 0 });
  });

  it("marks houses as blocking movement and sight", () => {
    const map = createNeighborhoodMap();
    expect(tileBlocksMovement(map, { x: 4, y: 4 })).toBe(true);
    expect(tileBlocksSight(map, { x: 4, y: 4 })).toBe(true);
  });

  it("marks roads as faster non-blocking tiles", () => {
    const map = createNeighborhoodMap();
    const road = map.tiles[15][4];
    expect(road.kind).toBe("road");
    expect(road.moveCost).toBeLessThan(1);
    expect(tileBlocksMovement(map, { x: 4, y: 15 })).toBe(false);
  });
});
