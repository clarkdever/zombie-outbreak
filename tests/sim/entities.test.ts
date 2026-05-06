import { describe, expect, it } from "vitest";
import { createInitialWorld } from "../../src/sim/entities";
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

  it("generates deterministic group names", () => {
    const a = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 0, seed: 99 });
    const b = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 0, seed: 99 });
    expect(a.groups[0].name).toBe(b.groups[0].name);
    expect(new Random(1).pick(["x"])).toBe("x");
  });
});
