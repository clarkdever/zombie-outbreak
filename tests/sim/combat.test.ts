import { describe, expect, it } from "vitest";
import { applyBite, feedOnBody, tickInfectionAndBodies } from "../../src/sim/combat";
import { createStats } from "../../src/sim/stats";
import type { Entity } from "../../src/sim/types";

function baseEntity(overrides: Partial<Entity>): Entity {
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

describe("combat and bodies", () => {
  it("bites damage and guarantee infection", () => {
    const zombie = baseEntity({ id: "z", species: "zombieHuman", name: "Undead Pat", alive: false });
    const human = baseEntity({ id: "h", name: "Mara" });
    applyBite(zombie, human, 15);
    expect(human.hp).toBe(85);
    expect(human.infected).toBe(true);
  });

  it("infection downs humans and starts turning", () => {
    const stats = createStats();
    const human = baseEntity({ id: "h", name: "Mara", infected: true, infectionSeconds: 4, hp: 1 });
    tickInfectionAndBodies([human], 1, { infectionDamagePerSecond: 2, turningDelaySeconds: 8 }, stats);
    expect(human.alive).toBe(false);
    expect(human.state).toBe("turning");
    expect(human.turnSeconds).toBe(8);
    expect(stats.humansTurnedPending).toBe(1);
  });

  it("keeps infection damage as clean integer HP", () => {
    const stats = createStats();
    const human = baseEntity({ id: "h", infected: true, hp: 100 });

    tickInfectionAndBodies([human], 0.333, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, stats);
    tickInfectionAndBodies([human], 0.333, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, stats);
    tickInfectionAndBodies([human], 0.334, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, stats);

    expect(human.hp).toBe(99);
  });

  it("keeps feeding meat as clean integers", () => {
    const zombie = baseEntity({ id: "z", species: "zombieHuman", name: "Undead Glen", alive: false });
    const body = baseEntity({ id: "body", name: "Glen", alive: false, meat: 100, originalMeat: 100, state: "turning" });

    feedOnBody(zombie, body, 0.333);
    feedOnBody(zombie, body, 0.333);
    feedOnBody(zombie, body, 0.334);

    expect(body.meat).toBe(99);
    expect(zombie.totalMeatEaten).toBe(1);
  });

  it("feeding caps each zombie at 25 percent of original body meat", () => {
    const zombie = baseEntity({ id: "z", species: "zombieHuman", name: "Undead Glen", alive: false });
    const body = baseEntity({ id: "body", name: "Glen", alive: false, meat: 100, originalMeat: 100, state: "turning" });
    feedOnBody(zombie, body, 30);
    expect(body.meat).toBe(75);
    expect(zombie.totalMeatEaten).toBe(25);
    expect(zombie.meatEatenByBody.body).toBe(25);
  });

  it("body becomes skeleton if meat reaches zero before turning", () => {
    const stats = createStats();
    const body = baseEntity({ id: "body", alive: false, meat: 0, originalMeat: 100, state: "turning", turnSeconds: 5 });
    tickInfectionAndBodies([body], 1, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, stats);
    expect(body.skeleton).toBe(true);
    expect(body.state).toBe("downed");
    expect(stats.skeletonsCreated).toBe(1);
  });
});
