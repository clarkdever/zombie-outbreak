import { describe, expect, it } from "vitest";
import { createNeighborhoodMap } from "../../src/sim/map";
import { canHear, canSee, createNoise } from "../../src/sim/perception";
import type { Entity } from "../../src/sim/types";

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: "e",
    name: "Entity",
    affiliation: "Test",
    species: "human",
    state: "calm",
    tile: { x: 10, y: 10 },
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

describe("perception", () => {
  it("uses circular hearing radius", () => {
    const listener = entity({ tile: { x: 10, y: 10 }, species: "human" });
    expect(canHear(listener, createNoise("bark", { x: 15, y: 10 }, 6))).toBe(true);
    expect(canHear(listener, createNoise("growl", { x: 17, y: 10 }, 4))).toBe(false);
  });

  it("gives dogs wider hearing than humans", () => {
    const dog = entity({ species: "dog", tile: { x: 10, y: 10 } });
    const human = entity({ species: "human", tile: { x: 10, y: 10 } });
    const noise = createNoise("growl", { x: 16, y: 10 }, 4);
    expect(canHear(dog, noise)).toBe(true);
    expect(canHear(human, noise)).toBe(false);
  });

  it("uses directional vision cones and blockers", () => {
    const map = createNeighborhoodMap();
    const viewer = entity({ tile: { x: 1, y: 4 }, facing: 0 });
    expect(canSee(map, viewer, { x: 3, y: 4 })).toBe(true);
    expect(canSee(map, viewer, { x: 0, y: 4 })).toBe(false);
    expect(canSee(map, viewer, { x: 5, y: 4 })).toBe(false);
  });

  it("uses wider species-specific visual fields", () => {
    const map = createNeighborhoodMap();
    const human = entity({ species: "human", tile: { x: 10, y: 15 }, facing: 0 });
    const dog = entity({ species: "dog", tile: { x: 10, y: 15 }, facing: 0 });

    expect(canSee(map, human, { x: 9, y: 17 })).toBe(false);
    expect(canSee(map, dog, { x: 9, y: 17 })).toBe(true);
  });
});
