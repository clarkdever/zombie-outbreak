import { tickSimpleAi } from "./ai";
import { applyBite, feedOnBody, tickInfectionAndBodies } from "./combat";
import { createInitialWorld } from "./entities";
import { createNeighborhoodMap, tileBlocksMovement, wrapTile } from "./map";
import { canSee } from "./perception";
import { createStats } from "./stats";
import type { EndFact, Entity, GameMap, HumanGroup, NoiseEvent, SimStats } from "./types";

export interface SimulationOptions {
  humans: number;
  dogs: number;
  zombies: number;
  armedPercent: number;
  seed: number;
}

export interface EndState {
  winner: "humans" | "zombies";
  reason: string;
}

export class Simulation {
  readonly map: GameMap;
  readonly entities: Entity[];
  readonly groups: HumanGroup[];
  readonly stats: SimStats;
  noises: NoiseEvent[] = [];
  endState?: EndState;
  private actionAccumulatorSeconds = 0;

  constructor(options: SimulationOptions) {
    this.map = createNeighborhoodMap();
    const world = createInitialWorld(options);
    this.entities = world.entities;
    this.groups = world.groups;
    this.stats = createStats();
  }

  tick(dt: number): void {
    if (this.endState) return;
    const previousElapsedSeconds = this.stats.elapsedSeconds;
    this.stats.elapsedSeconds += dt;
    this.actionAccumulatorSeconds += dt;
    while (this.actionAccumulatorSeconds >= 1 && !this.endState) {
      this.stepActions();
      this.actionAccumulatorSeconds -= 1;
    }
    tickInfectionAndBodies(this.entities, dt, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, this.stats);
    if (Math.floor(this.stats.elapsedSeconds) !== Math.floor(previousElapsedSeconds)) {
      this.stats.zombiePopulationSamples.push(this.zombies.length);
    }
    this.endState = this.computeEndState();
  }

  private stepActions(): void {
    this.updateStimulusFlags();
    this.resolveHumanAttacks();
    this.resolveCloseInteractions();
    const newNoises: NoiseEvent[] = [];
    for (const entity of this.entities) {
      newNoises.push(...tickSimpleAi(entity, this.map, this.entities, this.noises));
    }
    this.noises = [...this.noises, ...newNoises]
      .map((noise) => ({ ...noise, ageSeconds: noise.ageSeconds + 1 }))
      .filter((noise) => noise.ageSeconds < 3);
  }

  possess(entityId: string): void {
    for (const entity of this.entities) {
      entity.controlled = entity.id === entityId;
    }
  }

  movePossessed(delta: { x: number; y: number }): void {
    const controlled = this.entities.find((entity) => entity.controlled);
    if (!controlled || controlled.skeleton || (!controlled.alive && !isZombie(controlled))) return;
    const candidate = wrapTile(this.map, {
      x: controlled.tile.x + Math.sign(delta.x),
      y: controlled.tile.y + Math.sign(delta.y)
    });
    if (!tileBlocksMovement(this.map, candidate)) {
      controlled.tile = candidate;
    }
  }

  turnPossessed(deltaRadians: number): void {
    const controlled = this.entities.find((entity) => entity.controlled);
    if (!controlled || controlled.skeleton || (!controlled.alive && !isZombie(controlled))) return;
    controlled.facing = normalizeRadians(controlled.facing + deltaRadians);
  }

  getEndFacts(): EndFact[] {
    const humans = this.entities.filter((entity) => entity.species === "human");
    const dogs = this.entities.filter((entity) => entity.species === "dog");
    const hungriest = [...this.zombies].sort((a, b) => b.totalMeatEaten - a.totalMeatEaten)[0];
    const bestDog = [...dogs].sort((a, b) => (b.humansAlerted + b.zombieDamageDealt) - (a.humansAlerted + a.zombieDamageDealt))[0];
    const bestShot = [...humans].sort((a, b) => b.zombieKills - a.zombieKills)[0];
    return [
      { label: "Human survivors", value: String(humans.filter((entity) => entity.alive && !entity.infected).length) },
      { label: "Dog survivors", value: String(dogs.filter((entity) => entity.alive && !entity.infected).length) },
      { label: "Zombies killed", value: String(this.stats.zombiesKilled) },
      { label: "Humans turned", value: String(this.stats.humansTurned) },
      { label: "Dogs turned", value: String(this.stats.dogsTurned) },
      { label: "Skeletons created", value: String(this.stats.skeletonsCreated) },
      { label: "First infected", value: this.stats.firstInfectedName ?? "No one" },
      { label: "Hungriest zombie", value: hungriest ? `${hungriest.name} ate ${Math.round(hungriest.totalMeatEaten)} meat` : "No zombies fed" },
      { label: "Bestest doggo", value: bestDog ? `${bestDog.name} alerted ${bestDog.humansAlerted} humans` : "No dogs joined the story" },
      { label: "Best shot", value: bestShot && bestShot.zombieKills > 0 ? `${bestShot.name} killed ${bestShot.zombieKills} zombies` : "No confirmed zombie kills" }
    ];
  }

  private get zombies(): Entity[] {
    return this.entities.filter((entity) => isZombie(entity) && !entity.skeleton);
  }

  private updateStimulusFlags(): void {
    for (const entity of this.entities) {
      entity.seesStimulus = false;
      entity.hearsStimulus = false;
      if (entity.skeleton) continue;
      for (const target of this.entities) {
        if (target.id === entity.id || target.skeleton) continue;
        const interesting =
          isZombie(entity) ? target.alive && (target.species === "human" || target.species === "dog") : isZombie(target);
        if (!interesting) continue;
        const distance = Math.hypot(target.tile.x - entity.tile.x, target.tile.y - entity.tile.y);
        entity.hearsStimulus ||= distance <= hearingRange(entity);
        entity.seesStimulus ||= canSee(this.map, entity, target.tile);
      }
      if (entity.seesStimulus && entity.species === "human") {
        entity.seenZombie = true;
      }
    }
  }

  private resolveHumanAttacks(): void {
    for (const human of this.entities) {
      if (human.species !== "human" || !human.alive || !human.armed) continue;
      const target = this.zombies.find((zombie) => Math.hypot(zombie.tile.x - human.tile.x, zombie.tile.y - human.tile.y) <= 3);
      if (!target) continue;
      target.hp = 0;
      target.skeleton = true;
      target.state = "downed";
      human.zombieKills += 1;
      this.stats.zombiesKilled += 1;
    }
  }

  private resolveCloseInteractions(): void {
    const bodies = this.entities.filter((entity) => !entity.alive && !entity.skeleton && entity.meat > 0 && !this.zombies.includes(entity));
    for (const zombie of this.zombies) {
      let fedThisTick = false;
      const livingTarget = this.entities.find((entity) =>
        entity.alive &&
        (entity.species === "human" || entity.species === "dog") &&
        Math.hypot(entity.tile.x - zombie.tile.x, entity.tile.y - zombie.tile.y) <= 1
      );
      if (livingTarget) {
        applyBite(zombie, livingTarget, 12);
        if (!livingTarget.alive) {
          livingTarget.turnSeconds = 8;
          feedOnBody(zombie, livingTarget, 1);
          fedThisTick = true;
        }
        if (fedThisTick) continue;
      }
      const body = bodies.find((candidate) => Math.hypot(candidate.tile.x - zombie.tile.x, candidate.tile.y - zombie.tile.y) <= 1);
      if (body) {
        feedOnBody(zombie, body, 1);
        fedThisTick = true;
      }
      if (!fedThisTick && zombie.state === "feeding") {
        zombie.state = "investigating";
      }
    }
  }

  private computeEndState(): EndState | undefined {
    const livingUninfectedHumans = this.entities.some((entity) => entity.species === "human" && entity.alive && !entity.infected);
    if (!livingUninfectedHumans) {
      return { winner: "zombies", reason: "No living uninfected humans remain." };
    }
    if (this.zombies.length === 0) {
      return { winner: "humans", reason: "All zombies were killed." };
    }
    return undefined;
  }
}

function isZombie(entity: Entity): boolean {
  return entity.species === "zombieHuman" || entity.species === "zombieDog";
}

function hearingRange(entity: Entity): number {
  if (entity.species === "dog") return 8;
  if (entity.species === "zombieDog") return 6;
  if (entity.species === "zombieHuman") return 4;
  return 6;
}

function normalizeRadians(value: number): number {
  return Math.atan2(Math.sin(value), Math.cos(value));
}
