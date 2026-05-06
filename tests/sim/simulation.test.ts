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

  it("possessed entities accept movement intent without autonomous ai", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 11 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const start = { ...human.tile };
    sim.possess(human.id);
    sim.movePossessed({ x: 1, y: 0 });
    sim.tick(1);
    expect(human.controlled).toBe(true);
    expect(human.tile.x).toBe(start.x + 1);
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
    sim.possess(zombie.id);
    sim.movePossessed({ x: 1, y: 0 });
    expect(zombie.tile).toEqual({ x: 6, y: 10 });
  });

  it("possessed entities wrap at edges and cannot move through blockers", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 0, armedPercent: 0, seed: 11 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    sim.possess(human.id);
    human.tile = { x: 29, y: 10 };
    sim.movePossessed({ x: 1, y: 0 });
    expect(human.tile).toEqual({ x: 0, y: 10 });

    human.tile = { x: 3, y: 4 };
    sim.movePossessed({ x: 1, y: 0 });
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
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 12 });
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

  it("lets controlled zombies infect humans by contact", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 16 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
    human.tile = { x: 6, y: 10 };
    zombie.tile = { x: 5, y: 10 };
    sim.possess(zombie.id);
    sim.movePossessed({ x: 1, y: 0 });
    sim.tick(1);
    expect(human.infected).toBe(true);
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
});
