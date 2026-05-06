import { describe, expect, it } from "vitest";
import { GLOCK_19_WITH_SPARE_MAG_AMMO, createInitialWorld } from "../../src/sim/entities";
import { Random } from "../../src/sim/random";

describe("entity creation", () => {
  it("creates named humans, dogs, and zombies from counts", () => {
    const world = createInitialWorld({
      humans: 6,
      dogs: 2,
      zombies: 3,
      armedPercent: 50,
      seed: 7
    });

    expect(world.entities.filter((entity) => entity.species === "human")).toHaveLength(6);
    expect(world.entities.filter((entity) => entity.species === "dog")).toHaveLength(2);
    expect(world.entities.filter((entity) => entity.species === "zombieHuman")).toHaveLength(3);
    expect(world.entities.every((entity) => entity.name.length > 0)).toBe(true);
  });

  it("uses owner names as dog affiliation labels", () => {
    const world = createInitialWorld({
      humans: 2,
      dogs: 1,
      zombies: 0,
      armedPercent: 0,
      seed: 12
    });
    const dog = world.entities.find((entity) => entity.species === "dog");
    const owner = world.entities.find((entity) => entity.id === dog?.ownerId);

    expect(dog?.affiliation).toBe(owner?.name);
  });

  it("gives armed humans a Glock 19 plus one spare magazine worth of ammunition", () => {
    const world = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 12 });

    expect(world.entities.filter((entity) => entity.species === "human").every((entity) => entity.ammo === GLOCK_19_WITH_SPARE_MAG_AMMO)).toBe(true);
  });

  it("records human home tiles and spawns dogs near their owners", () => {
    const world = createInitialWorld({
      humans: 3,
      dogs: 3,
      zombies: 0,
      armedPercent: 0,
      seed: 20
    });

    for (const human of world.entities.filter((entity) => entity.species === "human")) {
      expect(human.homeTile).toEqual(human.tile);
    }

    for (const dog of world.entities.filter((entity) => entity.species === "dog")) {
      const owner = world.entities.find((entity) => entity.id === dog.ownerId)!;
      expect(wrappedDistance(dog.tile, owner.tile)).toBeLessThanOrEqual(2);
    }
  });

  it("keeps dog spawn tiles inside map bounds", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const world = createInitialWorld({ humans: 4, dogs: 4, zombies: 0, armedPercent: 0, seed });
      for (const dog of world.entities.filter((entity) => entity.species === "dog")) {
        expect(dog.tile.x).toBeGreaterThanOrEqual(0);
        expect(dog.tile.y).toBeGreaterThanOrEqual(0);
        expect(dog.tile.x).toBeLessThan(30);
        expect(dog.tile.y).toBeLessThan(30);
      }
    }
  });

  it("generates deterministic group names", () => {
    const a = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 0, seed: 99 });
    const b = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 0, seed: 99 });
    expect(a.groups[0].name).toBe(b.groups[0].name);
    expect(new Random(1).pick(["x"])).toBe("x");
  });
});

function wrappedDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = Math.min(Math.abs(a.x - b.x), 30 - Math.abs(a.x - b.x));
  const dy = Math.min(Math.abs(a.y - b.y), 30 - Math.abs(a.y - b.y));
  return Math.hypot(dx, dy);
}
