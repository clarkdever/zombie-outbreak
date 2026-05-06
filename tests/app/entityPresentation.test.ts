import { describe, expect, it } from "vitest";
import { entityColor, entityRingColor, getEntityInspectRows, stateLabel } from "../../src/app/entityPresentation";
import type { Entity } from "../../src/sim/types";

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: "e",
    name: "Mara",
    affiliation: "Maple Watch",
    species: "human",
    state: "calm",
    tile: { x: 1, y: 1 },
    facing: 0,
    speed: 1,
    hp: 75,
    maxHp: 100,
    armed: false,
    ammo: 0,
    shotCooldownSeconds: 0,
    infected: false,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: 90,
    originalMeat: 100,
    controlled: false,
    alive: true,
    skeleton: false,
    seenZombie: false,
    seesStimulus: false,
    hearsStimulus: false,
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

describe("entity presentation", () => {
  it("matches entity colors used by the legend", () => {
    expect(entityColor(entity({ species: "human", armed: false }))).toBe("#2fbf71");
    expect(entityColor(entity({ species: "human", armed: true }))).toBe("#3a86ff");
    expect(entityColor(entity({ species: "zombieHuman", alive: false }))).toBe("#e63946");
    expect(entityColor(entity({ skeleton: true }))).toBe("#ffffff");
  });

  it("labels important states and ring colors", () => {
    expect(stateLabel(entity({ state: "shooting" }))).toBe("shooting");
    expect(entityRingColor(entity({ state: "infected" }), false)).toBe("#ef476f");
  });

  it("builds selected inspect rows with health and combat stats", () => {
    const rows = getEntityInspectRows(entity({ armed: true, ammo: 31, controlled: true, zombieKills: 2 }));

    expect(rows).toContainEqual({ label: "HP", value: "75 / 100" });
    expect(rows).toContainEqual({ label: "Weapon", value: "armed" });
    expect(rows).toContainEqual({ label: "Ammo", value: "31" });
    expect(rows).toContainEqual({ label: "Control", value: "possessed" });
    expect(rows).toContainEqual({ label: "Zombie kills", value: "2" });
  });
});
