import { describe, expect, it } from "vitest";
import { compareRenderableEntities, entityPickBounds, renderSceneDrawOrder, terrainTileDrawOrder, visionSectorPathPoints } from "../../src/app/Renderer";
import type { Entity, GameMap } from "../../src/sim/types";

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: "entity",
    name: "Pat",
    affiliation: "Test",
    species: "human",
    state: "calm",
    tile: { x: 1, y: 1 },
    facing: 0,
    speed: 1,
    hp: 100,
    maxHp: 100,
    armed: false,
    ammo: 0,
    shotCooldownSeconds: 0,
    infected: false,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: 100,
    originalMeat: 100,
    controlled: false,
    alive: true,
    skeleton: false,
    seenZombie: false,
    stimulusMemorySeconds: 0,
    meatEatenByBody: {},
    totalMeatEaten: 0,
    humansAlerted: 0,
    zombieDamageDealt: 0,
    zombieKills: 0,
    lifetimeSeconds: 0,
    ...overrides
  };
}

describe("renderer helpers", () => {
  it("builds vision sector points along an outward arc", () => {
    const points = visionSectorPathPoints({ x: 0, y: 0 }, 0, Math.PI / 2, 10, 5);

    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points).toHaveLength(7);
    expect(points[1].x).toBeCloseTo(Math.cos(-Math.PI / 4) * 10);
    expect(points.at(-1)?.x).toBeCloseTo(Math.cos(Math.PI / 4) * 10);
    expect(points.slice(1).every((point) => Math.hypot(point.x, point.y) > 9.9)).toBe(true);
  });

  it("uses the full humanoid sprite body for picking instead of the old foot circle", () => {
    const bounds = entityPickBounds("human", { x: 100, y: 100 });

    expect(bounds.left).toBeLessThanOrEqual(70);
    expect(bounds.right).toBeGreaterThanOrEqual(130);
    expect(bounds.top).toBeLessThanOrEqual(36);
    expect(bounds.bottom).toBeGreaterThanOrEqual(99);
  });

  it("draws skeletons below living characters at the same depth", () => {
    const skeleton = entity({ id: "bones", alive: false, skeleton: true, tile: { x: 5, y: 5 } });
    const living = entity({ id: "living", alive: true, skeleton: false, tile: { x: 5, y: 5 } });

    expect([living, skeleton].sort(compareRenderableEntities)).toEqual([skeleton, living]);
  });

  it("draws terrain from back to front so tall tiles are not buried by floor tiles", () => {
    const map: GameMap = {
      width: 3,
      height: 3,
      tiles: Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => ({ kind: "grass", moveCost: 1, blocksMovement: false, blocksSight: false }))
      )
    };

    const order = terrainTileDrawOrder(map);

    expect(order.map((tile) => tile.x + tile.y)).toEqual([...order].map((tile) => tile.x + tile.y).sort((a, b) => a - b));
    expect(order.at(0)).toEqual({ x: 0, y: 0 });
    expect(order.at(-1)).toEqual({ x: 2, y: 2 });
  });

  it("depth-sorts environmental props with entities after the ground pass", () => {
    const map: GameMap = {
      width: 2,
      height: 2,
      tiles: [
        [
          { kind: "grass", moveCost: 1, blocksMovement: false, blocksSight: false },
          { kind: "tree", moveCost: 1, blocksMovement: false, blocksSight: true }
        ],
        [
          { kind: "grass", moveCost: 1, blocksMovement: false, blocksSight: false },
          { kind: "grass", moveCost: 1, blocksMovement: false, blocksSight: false }
        ]
      ]
    };
    const human = entity({ tile: { x: 1, y: 1 } });

    const order = renderSceneDrawOrder(map, [human]);

    expect(order[0]).toMatchObject({ kind: "terrainProp", x: 1, y: 0, tileKind: "tree" });
    expect(order.at(-1)).toMatchObject({ kind: "entity", entity: human });
  });
});
