import { describe, expect, it } from "vitest";
import { VisualPositionStore, interpolateTilePosition, visibleEntitiesForRendering } from "../../src/app/visualPositions";

describe("visual positions", () => {
  it("interpolates between two tile positions", () => {
    expect(interpolateTilePosition({ x: 0, y: 0 }, { x: 2, y: 0 }, 0.25)).toEqual({ x: 0.5, y: 0 });
  });

  it("moves visual position toward changed entity tile without jumping", () => {
    const store = new VisualPositionStore(4);
    const entity = { id: "e", tile: { x: 0, y: 0 } };

    expect(store.update([entity], 0.1)[0].renderTile).toEqual({ x: 0, y: 0 });
    entity.tile = { x: 1, y: 0 };
    const next = store.update([entity], 0.1)[0].renderTile;

    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(1);
  });

  it("snaps tiny remaining distances to the target", () => {
    const store = new VisualPositionStore(100);
    const entity = { id: "e", tile: { x: 0, y: 0 } };

    store.update([entity], 0.1);
    entity.tile = { x: 1, y: 0 };

    expect(store.update([entity], 0.1)[0].renderTile).toEqual({ x: 1, y: 0 });
  });

  it("snaps large apparent jumps instead of sliding across the map", () => {
    const store = new VisualPositionStore(4);
    const entity = { id: "e", tile: { x: 0, y: 0 } };

    store.update([entity], 0.1);
    entity.tile = { x: 29, y: 0 };

    expect(store.update([entity], 0.1)[0].renderTile).toEqual({ x: 29, y: 0 });
  });

  it("hides victims while a zombie owns the grapple tableau", () => {
    const zombie = { id: "z", tile: { x: 5, y: 5 } };
    const victim = { id: "h", tile: { x: 5, y: 5 }, grappledById: "z" };

    expect(visibleEntitiesForRendering([zombie, victim])).toEqual([zombie]);
  });
});
