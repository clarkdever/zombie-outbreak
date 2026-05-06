import { describe, expect, it } from "vitest";
import { spriteAnimationFor, spriteFrameFor } from "../../src/app/sprites";
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

describe("sprite animation state", () => {
  it("maps entity states to animation clips", () => {
    expect(spriteAnimationFor(entity({ state: "calm" }))).toBe("idle");
    expect(spriteAnimationFor(entity({ species: "dog", state: "calm" }))).toBe("idle");
    expect(spriteAnimationFor(entity({ state: "fleeing" }))).toBe("run");
    expect(spriteAnimationFor(entity({ species: "dog", state: "alerted", seesStimulus: true }))).toBe("bark");
    expect(spriteAnimationFor(entity({ state: "shooting", armed: true }))).toBe("shoot");
    expect(spriteAnimationFor(entity({ species: "zombieHuman", state: "attacking", grappleVictimSpecies: "human" }))).toBe("attackHuman");
    expect(spriteAnimationFor(entity({ species: "zombieHuman", state: "attacking", grappleVictimSpecies: "dog" }))).toBe("attackDog");
    expect(spriteAnimationFor(entity({ species: "zombieHuman", state: "feeding", alive: false }))).toBe("feed");
    expect(spriteAnimationFor(entity({ species: "zombieHuman", state: "feeding", grappleVictimSpecies: "human" }))).toBe("feedHuman");
    expect(spriteAnimationFor(entity({ species: "zombieHuman", state: "feeding", grappleVictimSpecies: "dog" }))).toBe("feedDog");
    expect(spriteAnimationFor(entity({ alive: false, state: "turning" }))).toBe("downed");
    expect(spriteAnimationFor(entity({ skeleton: true, alive: false }))).toBe("skeleton");
  });

  it("advances animated frame indices over time", () => {
    const walker = entity({ state: "alerted" });

    expect(spriteFrameFor(walker, 0).frame).toBe(0);
    expect(spriteFrameFor(walker, 0.3).frame).toBeGreaterThan(0);
    expect(spriteFrameFor(entity({ facing: Math.PI / 2 }), 0).flipX).toBe(true);
  });

  it("keeps dog idle poses within their assigned sitting or sleeping frames", () => {
    expect(spriteFrameFor(entity({ species: "dog", state: "calm", dogIdlePose: "sit" }), 0).frame).toBe(0);
    expect(spriteFrameFor(entity({ species: "dog", state: "calm", dogIdlePose: "sit" }), 0.6).frame).toBe(1);
    expect(spriteFrameFor(entity({ species: "dog", state: "calm", dogIdlePose: "sleep" }), 0).frame).toBe(2);
    expect(spriteFrameFor(entity({ species: "dog", state: "calm", dogIdlePose: "sleep" }), 0.6).frame).toBe(3);
  });
});
