import { ZOMBIE_HUMAN_VARIANT_COUNT, type Entity, type SimStats } from "./types";

export interface BodyTickConfig {
  infectionDamagePerSecond: number;
  turningDelaySeconds: number;
}

export function applyBite(attacker: Entity, target: Entity, damage: number, stats?: SimStats): void {
  if (!target.alive || target.skeleton) return;
  const integerDamage = Math.max(0, Math.round(damage));
  const newlyInfected = !target.infected;
  target.hp = Math.max(0, target.hp - integerDamage);
  target.infected = true;
  if (newlyInfected && stats && !stats.firstInfectedName && (target.species === "human" || target.species === "dog")) {
    stats.firstInfectedName = target.name;
  }
  target.state = target.hp <= 0 ? "turning" : "infected";
  if (target.hp <= 0) {
    target.alive = false;
  }
  attacker.zombieDamageDealt += integerDamage;
}

export function feedOnBody(zombie: Entity, body: Entity, biteDamagePerSecond: number): number {
  if (body.alive || body.skeleton || body.meat <= 0) return 0;
  const cap = body.originalMeat * 0.25;
  const alreadyEaten = zombie.meatEatenByBody[body.id] ?? 0;
  const remainingForZombie = Math.max(0, cap - alreadyEaten);
  const available = (zombie.feedingRemainder ?? 0) + biteDamagePerSecond;
  const amount = Math.min(Math.floor(available), remainingForZombie, body.meat);
  zombie.feedingRemainder = available - Math.floor(available);
  if (amount <= 0) return 0;
  body.meat -= amount;
  zombie.meatEatenByBody[body.id] = alreadyEaten + amount;
  zombie.totalMeatEaten += amount;
  zombie.state = "feeding";
  return amount;
}

export function tickInfectionAndBodies(
  entities: Entity[],
  dt: number,
  config: BodyTickConfig,
  stats: SimStats
): void {
  for (const entity of entities) {
    entity.lifetimeSeconds += dt;

    if (entity.alive && entity.infected && !isZombie(entity)) {
      entity.infectionSeconds += dt;
      const availableDamage = (entity.infectionDamageRemainder ?? 0) + config.infectionDamagePerSecond * dt;
      const integerDamage = Math.floor(availableDamage);
      entity.infectionDamageRemainder = availableDamage - integerDamage;
      entity.hp = Math.max(0, entity.hp - integerDamage);
      if (entity.hp <= 0) {
        entity.alive = false;
        entity.state = "turning";
        entity.turnSeconds = config.turningDelaySeconds;
        if (entity.species === "human") stats.humansTurnedPending += 1;
        continue;
      }
    }

    if (!entity.alive && entity.state === "turning" && !entity.skeleton) {
      if (entity.meat <= 0) {
        entity.skeleton = true;
        entity.state = "downed";
        stats.skeletonsCreated += 1;
      } else {
        entity.turnSeconds = Math.max(0, entity.turnSeconds - dt);
        if (entity.turnSeconds === 0) {
          reanimate(entity, stats);
        }
      }
    }
  }
}

function reanimate(entity: Entity, stats: SimStats): void {
  if (entity.species === "dog") {
    entity.species = "zombieDog";
    entity.name = `Undead ${entity.name}`;
    entity.affiliation = "The Horde";
    stats.dogsTurned += 1;
  } else if (entity.species === "human") {
    entity.species = "zombieHuman";
    entity.name = `Undead ${entity.name}`;
    entity.affiliation = "The Horde";
    entity.zombieHumanVariant = stableVariant(entity.id, ZOMBIE_HUMAN_VARIANT_COUNT);
    stats.humansTurned += 1;
  }
  entity.state = "investigating";
  entity.infected = true;
  entity.hp = entity.maxHp;
  entity.alive = false;
}

function stableVariant(id: string, count: number): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}

function isZombie(entity: Entity): boolean {
  return entity.species === "zombieHuman" || entity.species === "zombieDog";
}
