import { tickSimpleAi } from "./ai";
import { applyBite, feedOnBody, tickInfectionAndBodies } from "./combat";
import { createInitialWorld } from "./entities";
import { warnNearbyHumans } from "./groups";
import { createNeighborhoodMap, tileBlocksMovement, tileBlocksSight, wrapTile } from "./map";
import { canSee } from "./perception";
import { Random } from "./random";
import { createStats } from "./stats";
import { SKELETON_VARIANT_COUNT, type BulletTrace, type EndFact, type Entity, type GameMap, type HumanGroup, type NoiseEvent, type SimStats, type Vec2 } from "./types";

export interface SimulationOptions {
  humans: number;
  dogs: number;
  zombies: number;
  armedPercent: number;
  seed: number;
  grappleEscapePercent?: number;
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
  bullets: BulletTrace[] = [];
  endState?: EndState;
  private actionAccumulatorSeconds = 0;
  private bulletId = 0;
  private grappledIds = new Set<string>();
  private readonly random: Random;
  private readonly grappleEscapeChance: number;

  constructor(options: SimulationOptions) {
    this.map = createNeighborhoodMap();
    const world = createInitialWorld(options);
    this.entities = world.entities;
    this.groups = world.groups;
    this.stats = createStats();
    this.random = new Random((Math.imul(options.seed, 101) + 17) >>> 0);
    this.grappleEscapeChance = (options.grappleEscapePercent ?? 60) / 100;
  }

  tick(dt: number): void {
    if (this.endState) return;
    const previousElapsedSeconds = this.stats.elapsedSeconds;
    this.stats.elapsedSeconds += dt;
    let remainingSeconds = dt;
    while (remainingSeconds > 0 && !this.endState) {
      const secondsUntilAction = 1 - this.actionAccumulatorSeconds;
      const elapsedSeconds = Math.min(remainingSeconds, secondsUntilAction);
      this.recoverShotCooldowns(elapsedSeconds);
      this.actionAccumulatorSeconds += elapsedSeconds;
      remainingSeconds -= elapsedSeconds;
      if (this.actionAccumulatorSeconds >= 1) {
        this.actionAccumulatorSeconds = 0;
        this.stepActions();
      }
    }
    this.bullets = this.bullets
      .map((bullet) => ({ ...bullet, ageSeconds: bullet.ageSeconds + dt }))
      .filter((bullet) => bullet.ageSeconds < 0.22);
    tickInfectionAndBodies(this.entities, dt, { infectionDamagePerSecond: 1, turningDelaySeconds: 10 }, this.stats);
    this.assignSkeletonVariants();
    if (Math.floor(this.stats.elapsedSeconds) !== Math.floor(previousElapsedSeconds)) {
      this.stats.zombiePopulationSamples.push(this.zombies.length);
    }
    this.endState = this.computeEndState();
  }

  private stepActions(): void {
    this.updateStimulusFlags();
    this.warnHumansFromWitnesses();
    this.alertHumansByContact();
    this.resolveHumanAttacks();
    const immobilizedIds = this.resolveCloseInteractions();
    const newNoises: NoiseEvent[] = [];
    for (const entity of this.entities) {
      newNoises.push(
        ...tickSimpleAi(
          entity,
          this.map,
          this.entities,
          this.noises,
          immobilizedIds,
          () => this.random.pick(["sit", "sleep"]),
          () => this.random.pick(["stand", "sit", "kneel"])
        )
      );
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
    if (this.isGrappled(controlled)) return;
    const worldDelta = localMoveToWorldDelta(delta, controlled.facing);
    const candidate = wrapTile(this.map, {
      x: controlled.tile.x + worldDelta.x,
      y: controlled.tile.y + worldDelta.y
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

  shootPossessed(): boolean {
    const controlled = this.entities.find((entity) => entity.controlled);
    if (!controlled || controlled.species !== "human" || !controlled.alive || !controlled.armed) return false;
    if (controlled.shotCooldownSeconds > 0) return false;
    if (controlled.ammo <= 0) return false;
    this.fireBullet(controlled);
    return true;
  }

  getEndFacts(): EndFact[] {
    const humans = this.entities.filter((entity) => entity.species === "human");
    const dogs = this.entities.filter((entity) => entity.species === "dog");
    const hungriest = this.entities
      .filter((entity) => isZombie(entity) || entity.totalMeatEaten > 0)
      .sort((a, b) => b.totalMeatEaten - a.totalMeatEaten)[0];
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
      { label: "Hungriest zombie", value: hungriest ? `${hungriest.name} ate ${Math.round(hungriest.totalMeatEaten)} bites` : "No zombies fed" },
      { label: "Bestest doggo", value: bestDog ? `${bestDog.name} alerted ${bestDog.humansAlerted} humans` : "No dogs joined the story" },
      { label: "Best shot", value: bestShot && bestShot.zombieKills > 0 ? `${bestShot.name} killed ${bestShot.zombieKills} zombies` : "No confirmed zombie kills" }
    ];
  }

  private get zombies(): Entity[] {
    return this.entities.filter((entity) => isZombie(entity) && !entity.skeleton);
  }

  private assignSkeletonVariants(): void {
    for (const entity of this.entities) {
      if (entity.skeleton && entity.skeletonVariant === undefined) {
        entity.skeletonVariant = this.random.int(SKELETON_VARIANT_COUNT);
      }
    }
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
      if (entity.seesStimulus && (entity.species === "human" || entity.species === "dog")) {
        entity.seenZombie = true;
      }
    }
  }

  private warnHumansFromWitnesses(): void {
    for (const entity of this.entities) {
      if (entity.species === "dog") warnNearbyHumans(entity, this.entities, 8);
      if (entity.species === "human") warnNearbyHumans(entity, this.entities, 2);
    }
  }

  private resolveHumanAttacks(): void {
    for (const human of this.entities) {
      if (human.species !== "human" || !human.alive || !human.armed || human.controlled) continue;
      if (human.ammo <= 0) continue;
      if (human.shotCooldownSeconds > 0) continue;
      const target = this.nearestVisibleThreat(human, 8);
      if (!target) {
        human.targetTile = undefined;
        continue;
      }
      const aimAngle = Math.atan2(target.tile.y - human.tile.y, target.tile.x - human.tile.x);
      const delta = angleDelta(aimAngle, human.facing);
      human.facing = normalizeRadians(human.facing + clamp(delta, -Math.PI / 4, Math.PI / 4));
      human.state = "alerted";
      human.targetTile = target.tile;
      if (Math.abs(delta) > Math.PI / 18) continue;
      this.fireBullet(human);
    }
  }

  private nearestVisibleThreat(human: Entity, range: number): Entity | undefined {
    return this.zombies
      .map((zombie) => ({ zombie, distance: Math.hypot(zombie.tile.x - human.tile.x, zombie.tile.y - human.tile.y) }))
      .filter(({ zombie, distance }) => distance <= range && canSee(this.map, human, zombie.tile) && hasClearShot(this.map, human.tile, zombie.tile))
      .sort((a, b) => a.distance - b.distance)[0]?.zombie;
  }

  private fireBullet(shooter: Entity): void {
    const from = { x: shooter.tile.x, y: shooter.tile.y };
    const range = 8;
    const intendedTo = {
      x: shooter.tile.x + Math.cos(shooter.facing) * range,
      y: shooter.tile.y + Math.sin(shooter.facing) * range
    };
    const hit = this.findBulletHit(shooter, from, intendedTo);
    const to = hit ? { x: hit.tile.x, y: hit.tile.y } : intendedTo;
    shooter.state = "shooting";
    shooter.shotCooldownSeconds = 1;
    shooter.ammo = Math.max(0, shooter.ammo - 1);
    this.noises.push({
      id: `gunshot-${this.bulletId + 1}`,
      kind: "gunshot",
      tile: shooter.tile,
      radius: 10,
      ageSeconds: 0
    });
    this.bullets.push({
      id: `bullet-${this.bulletId + 1}`,
      from,
      to,
      shooterId: shooter.id,
      hitEntityId: hit?.id,
      ageSeconds: 0
    });
    this.bulletId += 1;
    if (hit) this.applyBulletDamage(shooter, hit, 35);
  }

  private recoverShotCooldowns(dt: number): void {
    for (const entity of this.entities) {
      const previousCooldown = entity.shotCooldownSeconds;
      entity.shotCooldownSeconds = Math.max(0, entity.shotCooldownSeconds - dt);
      if (entity.state === "shooting" && previousCooldown > 0 && entity.shotCooldownSeconds === 0) {
        entity.state = entity.infected ? "infected" : entity.controlled || entity.seenZombie || entity.targetTile ? "alerted" : "calm";
      }
    }
  }

  private findBulletHit(shooter: Entity, from: Vec2, to: Vec2): Entity | undefined {
    return this.entities
      .filter((entity) => entity.id !== shooter.id && !entity.skeleton && (entity.alive || isZombie(entity)))
      .map((entity) => ({ entity, distanceAlongRay: distanceAlongRay(from, to, entity.tile), missDistance: pointToSegmentDistance(from, to, entity.tile) }))
      .filter((candidate) => candidate.distanceAlongRay >= 0 && candidate.distanceAlongRay <= 1 && candidate.missDistance <= 0.55)
      .sort((a, b) => a.distanceAlongRay - b.distanceAlongRay)[0]?.entity;
  }

  private applyBulletDamage(shooter: Entity, target: Entity, damage: number): void {
    const integerDamage = Math.max(0, Math.round(damage));
    target.hp = Math.max(0, target.hp - integerDamage);
    if (isZombie(target) && target.hp <= 0) {
      target.skeleton = true;
      target.state = "downed";
      shooter.zombieKills += 1;
      this.stats.zombiesKilled += 1;
    } else if ((target.species === "human" || target.species === "dog") && target.hp <= 0) {
      target.alive = false;
      target.state = target.infected ? "turning" : "downed";
    }
  }

  private resolveCloseInteractions(): Set<string> {
    const immobilizedIds = new Set<string>();
    for (const entity of this.entities) {
      entity.grappleTargetId = undefined;
      entity.grappledById = undefined;
      entity.grappleVictimSpecies = undefined;
    }
    const bodies = this.entities.filter((entity) => !entity.alive && !entity.skeleton && entity.meat > 0 && !this.zombies.includes(entity));
    for (const zombie of this.zombies) {
      let fedThisTick = false;
      const livingTarget = this.entities.find((entity) =>
        entity.alive &&
        (entity.species === "human" || entity.species === "dog") &&
        Math.hypot(entity.tile.x - zombie.tile.x, entity.tile.y - zombie.tile.y) <= 1
      );
      if (livingTarget) {
        if (this.random.next() < this.grappleEscapeChance) {
          livingTarget.state = "fleeing";
          continue;
        }
        immobilizedIds.add(zombie.id);
        immobilizedIds.add(livingTarget.id);
        zombie.grappleTargetId = livingTarget.id;
        zombie.grappleVictimSpecies = livingTarget.species === "dog" ? "dog" : "human";
        livingTarget.grappledById = zombie.id;
        if (livingTarget.species === "dog" || livingTarget.species === "human") {
          livingTarget.seenZombie = true;
          warnNearbyHumans(livingTarget, this.entities, livingTarget.species === "dog" ? 8 : 6);
        }
        applyBite(zombie, livingTarget, 12, this.stats);
        if (!livingTarget.alive) {
          livingTarget.turnSeconds = 10;
          feedOnBody(zombie, livingTarget, 3);
          fedThisTick = true;
        }
        if (fedThisTick) continue;
      }
      const body = bodies.find((candidate) => Math.hypot(candidate.tile.x - zombie.tile.x, candidate.tile.y - zombie.tile.y) <= 1);
      if (body) {
        feedOnBody(zombie, body, 3);
        fedThisTick = true;
      }
      if (!fedThisTick && zombie.state === "feeding") {
        zombie.state = "investigating";
      }
    }
    this.grappledIds = immobilizedIds;
    return immobilizedIds;
  }

  private isGrappled(entity: Entity): boolean {
    if (this.grappledIds.has(entity.id)) return true;
    return this.zombies.some((zombie) =>
      zombie.id !== entity.id &&
      !zombie.skeleton &&
      entity.alive &&
      (entity.species === "human" || entity.species === "dog") &&
      Math.hypot(entity.tile.x - zombie.tile.x, entity.tile.y - zombie.tile.y) <= 1
    );
  }

  private alertHumansByContact(): void {
    const alertedHumans = this.entities.filter((entity) => entity.species === "human" && entity.alive && entity.state === "alerted");
    for (const human of this.entities) {
      if (human.species !== "human" || !human.alive || human.state !== "calm") continue;
      const contacted = alertedHumans.some((alerted) => Math.hypot(alerted.tile.x - human.tile.x, alerted.tile.y - human.tile.y) <= 1.5);
      if (contacted) human.state = "alerted";
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

export function localMoveToWorldDelta(delta: { x: number; y: number }, facing: number): { x: number; y: number } {
  const forward = -Math.sign(delta.y);
  const strafeRight = Math.sign(delta.x);
  const x = Math.cos(facing) * forward + Math.sin(facing) * strafeRight;
  const y = Math.sin(facing) * forward - Math.cos(facing) * strafeRight;
  return {
    x: Math.sign(Math.round(x)),
    y: Math.sign(Math.round(y))
  };
}

function angleDelta(target: number, current: number): number {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasClearShot(map: GameMap, from: Vec2, to: Vec2): boolean {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  if (steps <= 1) return true;
  for (let step = 1; step < steps; step += 1) {
    const x = Math.round(from.x + ((to.x - from.x) * step) / steps);
    const y = Math.round(from.y + ((to.y - from.y) * step) / steps);
    if (tileBlocksSight(map, { x, y })) return false;
  }
  return true;
}

function distanceAlongRay(from: Vec2, to: Vec2, point: Vec2): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return 0;
  return ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared;
}

function pointToSegmentDistance(from: Vec2, to: Vec2, point: Vec2): number {
  const t = Math.max(0, Math.min(1, distanceAlongRay(from, to, point)));
  const closest = {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}
