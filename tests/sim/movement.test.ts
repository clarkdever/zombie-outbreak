import { describe, expect, it } from "vitest";
import { movementSpeedFor } from "../../src/sim/movement";
import type { Entity } from "../../src/sim/types";

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: "entity",
    name: "Pat",
    affiliation: "Test",
    species: "human",
    state: "calm",
    tile: { x: 1, y: 1 },
    homeTile: { x: 1, y: 1 },
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

describe("movement profiles", () => {
  it("keeps calm humans walking, alerted humans running, dogs faster, and zombies slower", () => {
    const calmHuman = movementSpeedFor(entity({ species: "human", state: "calm" }));
    const fleeingHuman = movementSpeedFor(entity({ species: "human", state: "fleeing" }));
    const dog = movementSpeedFor(entity({ species: "dog" }));
    const zombie = movementSpeedFor(entity({ species: "zombieHuman", alive: false, state: "attacking" }));

    expect(calmHuman).toBeGreaterThan(zombie);
    expect(fleeingHuman).toBeGreaterThan(calmHuman);
    expect(dog).toBeGreaterThan(calmHuman);
  });
});
