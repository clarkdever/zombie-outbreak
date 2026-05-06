import { describe, expect, it } from "vitest";
import { Simulation } from "../../src/sim/Simulation";

describe("Simulation", () => {
  it("ends when no living uninfected humans remain", () => {
    const sim = new Simulation({ humans: 1, dogs: 1, zombies: 0, armedPercent: 0, seed: 1 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    human.alive = false;
    human.infected = true;
    sim.tick(1);
    expect(sim.endState?.winner).toBe("zombies");
  });

  it("does not end while one living uninfected human remains", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 1 });
    sim.tick(1);
    expect(sim.endState).toBeUndefined();
  });

  it("records zombie population samples over time", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 2, armedPercent: 0, seed: 1 });
    sim.tick(1);
    sim.tick(1);
    expect(sim.stats.zombiePopulationSamples.length).toBeGreaterThan(0);
  });

  it("returns name-based end facts", () => {
    const sim = new Simulation({ humans: 2, dogs: 1, zombies: 1, armedPercent: 100, seed: 5 });
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    zombie.totalMeatEaten = 33;
    const dog = sim.entities.find((entity) => entity.species === "dog")!;
    dog.humansAlerted = 2;
    const facts = sim.getEndFacts();
    expect(facts.some((fact) => fact.label === "Hungriest zombie" && fact.value.includes(zombie.name))).toBe(true);
    expect(facts.some((fact) => fact.label === "Bestest doggo" && fact.value.includes(dog.name))).toBe(true);
  });

  it("moves possessed entities forward relative to their facing", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 11 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    zombie.tile = { x: 25, y: 25 };
    const start = { ...human.tile };
    human.facing = Math.PI / 2;
    sim.possess(human.id);
    sim.movePossessed({ x: 0, y: -1 });
    sim.tick(1);
    expect(human.controlled).toBe(true);
    expect(human.tile).toEqual({ x: start.x, y: start.y + 1 });
  });

  it("strafes possessed entities relative to their facing", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 0, armedPercent: 0, seed: 11 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    human.tile = { x: 10, y: 10 };
    human.facing = 0;
    sim.possess(human.id);
    sim.movePossessed({ x: 1, y: 0 });
    expect(human.tile).toEqual({ x: 10, y: 9 });
  });

  it("turns possessed entities without moving them", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 0, armedPercent: 0, seed: 11 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const start = { ...human.tile };
    sim.possess(human.id);
    sim.turnPossessed(1);
    expect(human.facing).toBe(1);
    expect(human.tile).toEqual(start);
  });

  it("keeps autonomous creatures moving while another entity is possessed", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    zombie.tile = { x: 5, y: 10 };
    sim.possess(human.id);
    sim.tick(1);
    expect(zombie.tile.x).toBe(6);
  });

  it("possessed zombies can be moved by the player", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 11 });
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    zombie.tile = { x: 5, y: 10 };
    zombie.facing = 0;
    sim.possess(zombie.id);
    sim.movePossessed({ x: 0, y: -1 });
    expect(zombie.tile).toEqual({ x: 6, y: 10 });
  });

  it("possessed entities wrap at edges and cannot move through blockers", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 0, armedPercent: 0, seed: 11 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    sim.possess(human.id);
    human.tile = { x: 29, y: 10 };
    human.facing = 0;
    sim.movePossessed({ x: 0, y: -1 });
    expect(human.tile).toEqual({ x: 0, y: 10 });

    human.tile = { x: 3, y: 4 };
    human.facing = 0;
    sim.movePossessed({ x: 0, y: -1 });
    expect(human.tile).toEqual({ x: 3, y: 4 });
  });

  it("moves zombies toward distant living targets", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    zombie.tile = { x: 5, y: 10 };
    sim.tick(1);
    expect(zombie.tile.x).toBe(6);
  });

  it("moves calm humans instead of leaving them static", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 0, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    human.tile = { x: 10, y: 10 };
    sim.tick(1);
    expect(human.tile).not.toEqual({ x: 10, y: 10 });
  });

  it("keeps calm humans wandering near their spawn area", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    human.homeTile = { x: 10, y: 10 };
    human.facing = Math.PI;
    zombie.tile = { x: 25, y: 25 };

    for (let tick = 0; tick < 12; tick += 1) sim.tick(1);

    expect(Math.hypot(human.tile.x - human.homeTile.x, human.tile.y - human.homeTile.y)).toBeLessThanOrEqual(3);
  });

  it("lets dogs follow their living owners", () => {
    const sim = new Simulation({ humans: 1, dogs: 1, zombies: 1, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const dog = sim.entities.find((entity) => entity.species === "dog")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    dog.tile = { x: 6, y: 10 };
    dog.facing = 0;
    zombie.tile = { x: 25, y: 25 };

    sim.tick(1);

    expect(dog.tile.x).toBeGreaterThan(6);
  });

  it("credits dogs when they alert nearby humans after spotting zombies", () => {
    const sim = new Simulation({ humans: 1, dogs: 1, zombies: 1, armedPercent: 0, seed: 33 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const dog = sim.entities.find((entity) => entity.species === "dog")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    for (const row of sim.map.tiles) {
      for (const tile of row) tile.kind = "grass";
    }
    dog.tile = { x: 10, y: 10 };
    dog.facing = 0;
    zombie.tile = { x: 11, y: 10 };
    human.tile = { x: 10, y: 18 };
    human.facing = Math.PI;

    sim.tick(1);

    expect(dog.seenZombie).toBe(true);
    expect(dog.humansAlerted).toBe(1);
    expect(human.state).toBe("alerted");
  });

  it("marks visible and audible stimuli for overlay feedback", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 4, y: 15 };
    human.facing = 0;
    zombie.tile = { x: 6, y: 15 };
    sim.tick(1);
    expect(human.seesStimulus).toBe(true);
    expect(human.hearsStimulus).toBe(true);
  });

  it("does not move zombies faster when ticks are split into small frames", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 13 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    zombie.tile = { x: 5, y: 10 };
    sim.tick(0.5);
    expect(zombie.tile.x).toBe(5);
    sim.tick(0.5);
    expect(zombie.tile.x).toBe(6);
  });

  it("lets armed humans kill nearby zombies and end the outbreak", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 100, seed: 15 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 5, y: 15 };
    zombie.tile = { x: 7, y: 15 };
    zombie.hp = 35;
    sim.tick(1);
    expect(zombie.skeleton).toBe(true);
    expect(human.zombieKills).toBe(1);
    expect(sim.stats.zombiesKilled).toBe(1);
    expect(sim.endState?.winner).toBe("humans");
  });

  it("turns armed humans toward zombies before firing", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 100, seed: 15 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 5, y: 15 };
    human.facing = Math.PI / 2;
    zombie.tile = { x: 8, y: 15 };
    zombie.hp = 200;

    sim.tick(1);
    expect(sim.bullets).toHaveLength(0);
    expect(Math.abs(human.facing)).toBeLessThan(Math.PI / 2);

    sim.tick(1);
    sim.tick(1);
    expect(zombie.hp).toBeLessThan(200);
  });

  it("does not let armed humans target zombies outside their vision cone", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 100, seed: 25 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    human.facing = 0;
    zombie.tile = { x: 6, y: 10 };
    zombie.hp = 200;

    sim.tick(1);

    expect(zombie.hp).toBe(200);
    expect(human.targetTile).toBeUndefined();
  });

  it("clears stale armed-human targets so normal AI can resume", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 100, seed: 26 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    human.homeTile = { x: 10, y: 10 };
    human.targetTile = { x: 12, y: 10 };
    human.facing = 0;
    zombie.tile = { x: 24, y: 24 };

    sim.tick(1);

    expect(human.targetTile).toBeUndefined();
  });

  it("lets zombies resume chasing when no adjacent body remains to feed on", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 14 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 10, y: 10 };
    zombie.tile = { x: 5, y: 10 };
    zombie.state = "feeding";
    sim.tick(1);
    expect(zombie.state).toBe("attacking");
    expect(zombie.tile.x).toBe(6);
  });

  it("nearby zombies bite living humans and can start feeding after a down", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 12, grappleEscapePercent: 0 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 5, y: 5 };
    zombie.tile = { x: 6, y: 5 };
    human.hp = 5;
    sim.tick(1);
    expect(human.infected).toBe(true);
    expect(human.alive).toBe(false);
    sim.tick(1);
    expect(zombie.state).toBe("feeding");
  });

  it("keeps zombies and bite targets still while grappling", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 12, grappleEscapePercent: 0 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 5, y: 5 };
    zombie.tile = { x: 6, y: 5 };
    human.hp = 100;

    sim.tick(1);

    expect(human.tile).toEqual({ x: 5, y: 5 });
    expect(zombie.tile).toEqual({ x: 6, y: 5 });
    expect(human.infected).toBe(true);
  });

  it("marks grapple pairs so the renderer can show one combined zombie-victim sprite", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 12, grappleEscapePercent: 0 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 5, y: 5 };
    zombie.tile = { x: 6, y: 5 };

    sim.tick(1);

    expect(zombie.grappleTargetId).toBe(human.id);
    expect(zombie.grappleVictimSpecies).toBe("human");
    expect(human.grappledById).toBe(zombie.id);
  });

  it("clears grapple pair marks when the victim escapes", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 12, grappleEscapePercent: 100 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.grappledById = zombie.id;
    zombie.grappleTargetId = human.id;
    zombie.grappleVictimSpecies = "human";
    human.tile = { x: 5, y: 5 };
    zombie.tile = { x: 6, y: 5 };

    sim.tick(1);

    expect(zombie.grappleTargetId).toBeUndefined();
    expect(zombie.grappleVictimSpecies).toBeUndefined();
    expect(human.grappledById).toBeUndefined();
  });

  it("blocks possessed movement out of an active grapple", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 27, grappleEscapePercent: 0 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 5, y: 5 };
    zombie.tile = { x: 6, y: 5 };
    sim.tick(1);
    sim.possess(human.id);

    sim.movePossessed({ x: -1, y: 0 });

    expect(human.tile).toEqual({ x: 5, y: 5 });
  });

  it("lets grappled victims escape most of the time", () => {
    let escapes = 0;
    for (let seed = 1; seed <= 100; seed += 1) {
      const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed, grappleEscapePercent: 60 });
      const human = sim.entities.find((entity) => entity.species === "human")!;
      const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
      human.tile = { x: 5, y: 5 };
      zombie.tile = { x: 6, y: 5 };

      sim.tick(1);
      if (!human.infected) escapes += 1;
    }

    expect(escapes).toBeGreaterThanOrEqual(50);
    expect(escapes).toBeLessThanOrEqual(70);
  });

  it("lets three zombies leave enough meat for reanimation but four can skeletonize a downed body", () => {
    const three = new Simulation({ humans: 2, dogs: 0, zombies: 3, armedPercent: 0, seed: 28, grappleEscapePercent: 0 });
    const threeBody = three.entities.find((entity) => entity.species === "human")!;
    const threeSurvivor = three.entities.find((entity) => entity.species === "human" && entity.id !== threeBody.id)!;
    threeBody.alive = false;
    threeBody.infected = true;
    threeBody.state = "turning";
    threeBody.turnSeconds = 10;
    threeBody.tile = { x: 10, y: 10 };
    threeSurvivor.tile = { x: 25, y: 25 };
    three.possess(threeSurvivor.id);
    three.entities.filter((entity) => entity.species === "zombieHuman").forEach((zombie, index) => {
      zombie.tile = [{ x: 9, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 9 }][index];
    });

    for (let tick = 0; tick < 11; tick += 1) three.tick(1);
    expect(threeBody.skeleton).toBe(false);
    expect(threeBody.species).toBe("zombieHuman");

    const four = new Simulation({ humans: 2, dogs: 0, zombies: 4, armedPercent: 0, seed: 29, grappleEscapePercent: 0 });
    const fourBody = four.entities.find((entity) => entity.species === "human")!;
    const fourSurvivor = four.entities.find((entity) => entity.species === "human" && entity.id !== fourBody.id)!;
    fourBody.alive = false;
    fourBody.infected = true;
    fourBody.state = "turning";
    fourBody.turnSeconds = 10;
    fourBody.tile = { x: 10, y: 10 };
    fourSurvivor.tile = { x: 25, y: 25 };
    four.possess(fourSurvivor.id);
    four.entities.filter((entity) => entity.species === "zombieHuman").forEach((zombie, index) => {
      zombie.tile = [{ x: 9, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 9 }, { x: 10, y: 11 }][index];
    });

    for (let tick = 0; tick < 10; tick += 1) four.tick(1);
    expect(fourBody.skeleton).toBe(true);
  });

  it("lets controlled zombies infect humans by contact", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 16, grappleEscapePercent: 0 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 6, y: 10 };
    zombie.tile = { x: 5, y: 10 };
    zombie.facing = 0;
    sim.possess(zombie.id);
    sim.movePossessed({ x: 0, y: -1 });
    sim.tick(1);
    expect(human.infected).toBe(true);
    expect(sim.stats.firstInfectedName).toBe(human.name);
    expect(human.hp).toBeLessThan(100);
  });

  it("lets controlled armed humans fire visible bullets that damage the first living target", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 17 });
    const shooter = sim.entities[0];
    const bystander = sim.entities[1];
    shooter.tile = { x: 5, y: 10 };
    shooter.facing = 0;
    bystander.tile = { x: 8, y: 10 };
    sim.possess(shooter.id);

    expect(sim.shootPossessed()).toBe(true);
    expect(sim.bullets).toHaveLength(1);
    expect(sim.bullets[0].hitEntityId).toBe(bystander.id);
    expect(bystander.hp).toBeLessThan(100);
    expect(shooter.state).toBe("shooting");
  });

  it("prevents controlled armed humans from firing while shot cooldown is active", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 21 });
    const shooter = sim.entities[0];
    const target = sim.entities[1];
    shooter.tile = { x: 5, y: 10 };
    shooter.facing = 0;
    target.tile = { x: 8, y: 12 };
    sim.possess(shooter.id);

    expect(sim.shootPossessed()).toBe(true);
    expect(sim.shootPossessed()).toBe(false);
    expect(sim.bullets).toHaveLength(1);

    sim.tick(1);
    expect(sim.shootPossessed()).toBe(true);
  });

  it("depletes armed human ammunition and prevents shooting when empty", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 0, armedPercent: 100, seed: 31 });
    const shooter = sim.entities[0];
    shooter.ammo = 1;

    sim.possess(shooter.id);

    expect(sim.shootPossessed()).toBe(true);
    expect(shooter.ammo).toBe(0);
    shooter.shotCooldownSeconds = 0;
    expect(sim.shootPossessed()).toBe(false);
    expect(sim.bullets).toHaveLength(1);
  });

  it("ages bullet traces out while shot cooldown recovers", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 22 });
    const shooter = sim.entities[0];
    const target = sim.entities[1];
    shooter.tile = { x: 5, y: 10 };
    shooter.facing = 0;
    target.tile = { x: 8, y: 10 };
    sim.possess(shooter.id);

    sim.shootPossessed();
    expect(sim.bullets).toHaveLength(1);
    sim.tick(0.25);
    expect(sim.bullets).toHaveLength(0);
    expect(shooter.shotCooldownSeconds).toBeLessThan(1);
  });

  it("returns controlled armed humans from shooting to an active state after cooldown", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 32 });
    const shooter = sim.entities[0];
    const target = sim.entities[1];
    shooter.tile = { x: 5, y: 10 };
    shooter.facing = 0;
    target.tile = { x: 8, y: 10 };
    sim.possess(shooter.id);

    sim.shootPossessed();
    expect(shooter.state).toBe("shooting");
    sim.tick(1);

    expect(shooter.shotCooldownSeconds).toBe(0);
    expect(shooter.state).toBe("alerted");
  });

  it("keeps autonomous shot cooldown consistent for large ticks", () => {
    const once = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 100, seed: 23 });
    const onceHuman = once.entities.find((entity) => entity.species === "human")!;
    const onceZombie = once.entities.find((entity) => entity.species === "zombieHuman")!;
    onceHuman.tile = { x: 5, y: 15 };
    onceHuman.facing = 0;
    onceZombie.tile = { x: 8, y: 15 };
    onceZombie.hp = 200;

    const split = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 100, seed: 23 });
    const splitHuman = split.entities.find((entity) => entity.species === "human")!;
    const splitZombie = split.entities.find((entity) => entity.species === "zombieHuman")!;
    splitHuman.tile = { x: 5, y: 15 };
    splitHuman.facing = 0;
    splitZombie.tile = { x: 8, y: 15 };
    splitZombie.hp = 200;

    once.tick(3);
    split.tick(1);
    split.tick(1);
    split.tick(1);

    expect(onceZombie.hp).toBe(splitZombie.hp);
    expect(once.stats.zombiesKilled).toBe(split.stats.zombiesKilled);
    expect(once.bullets.length).toBe(split.bullets.length);
  });

  it("recovers shot cooldown only by elapsed sub-second time", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 1, armedPercent: 100, seed: 24 });
    const shooter = sim.entities[0];
    const target = sim.entities[1];
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    shooter.tile = { x: 5, y: 10 };
    shooter.facing = 0;
    target.tile = { x: 5, y: 13 };
    zombie.tile = { x: 20, y: 20 };
    zombie.hp = 200;
    sim.possess(shooter.id);

    sim.shootPossessed();
    sim.tick(0.25);
    sim.tick(0.25);
    expect(shooter.shotCooldownSeconds).toBeCloseTo(0.5);
    sim.tick(0);
    expect(shooter.shotCooldownSeconds).toBeCloseTo(0.5);
  });
});
