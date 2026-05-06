import { describe, expect, it } from "vitest";
import { spriteDrawPlanFor, spriteFrameRect, spriteSheetKeyFor } from "../../src/app/spriteManifest";
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

describe("sprite manifest contract", () => {
  it("chooses stable sheet keys for entity variants and terminal states", () => {
    expect(spriteSheetKeyFor(entity({ species: "human", armed: false }))).toBe("human");
    expect(spriteSheetKeyFor(entity({ species: "human", armed: true }))).toBe("armedHuman");
    expect(spriteSheetKeyFor(entity({ species: "dog" }))).toBe("dog");
    expect(spriteSheetKeyFor(entity({ species: "zombieHuman" }))).toBe("zombieHuman");
    expect(spriteSheetKeyFor(entity({ species: "zombieDog" }))).toBe("zombieDog");
    expect(spriteSheetKeyFor(entity({ alive: false, skeleton: false }))).toBe("corpse");
    expect(spriteSheetKeyFor(entity({ alive: false, skeleton: true }))).toBe("skeleton");
  });

  it("calculates source rectangles by animation row and frame column", () => {
    expect(spriteFrameRect({ frameWidth: 64, frameHeight: 64, columns: 4, row: 3 }, 2)).toEqual({
      x: 128,
      y: 192,
      width: 64,
      height: 64
    });
  });

  it("builds a draw plan with sheet source, anchor, frame, and destination dimensions", () => {
    const plan = spriteDrawPlanFor(entity({ species: "human", armed: true, state: "shooting" }), 0.1);

    expect(plan.sheet.id).toBe("armedHuman");
    expect(plan.clip.animation).toBe("shoot");
    expect(plan.sourceRect.width).toBe(64);
    expect(plan.sourceRect.height).toBe(64);
    expect(plan.destination.width).toBeGreaterThan(20);
    expect(plan.destination.height).toBeGreaterThan(20);
    expect(plan.anchor).toEqual({ x: 32, y: 48 });
  });
});
