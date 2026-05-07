import { tileBlocksMovement, wrapTile } from "./map";
import { movementSpeedFor } from "./movement";
import { canHear, canSee, createNoise } from "./perception";
import type { DogIdlePose, Entity, GameMap, HumanIdlePose, NoiseEvent, TilePos } from "./types";

export type CanOccupyTile = (entity: Entity, tile: TilePos) => boolean;

export function tickSimpleAi(
  entity: Entity,
  map: GameMap,
  entities: Entity[],
  noises: NoiseEvent[],
  immobilizedIds = new Set<string>(),
  chooseDogIdlePose: () => DogIdlePose = () => "sit",
  chooseHumanIdlePose: () => HumanIdlePose = () => "stand",
  canOccupyTile: CanOccupyTile = (_entity, tile) => !tileBlocksMovement(map, tile)
): NoiseEvent[] {
  entity.speed = movementSpeedFor(entity);
  if (entity.controlled || entity.skeleton || immobilizedIds.has(entity.id)) return [];
  if (!entity.alive && entity.species !== "zombieHuman" && entity.species !== "zombieDog") return [];
  if (entity.species === "zombieHuman" || entity.species === "zombieDog") {
    return tickZombie(entity, map, entities, canOccupyTile);
  }
  if (entity.species === "dog") {
    return tickDog(entity, map, entities, chooseDogIdlePose, canOccupyTile);
  }
  return tickHuman(entity, map, noises, chooseHumanIdlePose, canOccupyTile);
}

function tickZombie(entity: Entity, map: GameMap, entities: Entity[], canOccupyTile: CanOccupyTile): NoiseEvent[] {
  if (entity.state === "feeding") return [];
  const livingTarget = entities.find((target) => target.alive && (target.species === "human" || target.species === "dog"));
  if (livingTarget) {
    entity.state = "attacking";
    entity.targetTile = livingTarget.tile;
    entity.facing = Math.atan2(livingTarget.tile.y - entity.tile.y, livingTarget.tile.x - entity.tile.x);
    stepToward(entity, map, livingTarget.tile, canOccupyTile);
  } else {
    entity.state = "investigating";
    const candidate = wrapTile(map, { x: entity.tile.x + (entity.id.length % 2 === 0 ? 1 : -1), y: entity.tile.y });
    if (canOccupyTile(entity, candidate)) entity.tile = candidate;
  }
  return [];
}

function tickDog(
  entity: Entity,
  map: GameMap,
  entities: Entity[],
  chooseDogIdlePose: () => DogIdlePose,
  canOccupyTile: CanOccupyTile
): NoiseEvent[] {
  const zombie = entities.find((target) =>
    (target.species === "zombieHuman" || target.species === "zombieDog") && canSee(map, entity, target.tile)
  );
  if (zombie) {
    entity.state = "alerted";
    return [createNoise("bark", entity.tile, 8)];
  }
  const owner = entities.find((target) => target.id === entity.ownerId && target.alive && target.species === "human");
  if (owner) {
    const distanceToOwner = Math.hypot(shortestDelta(entity.tile.x, owner.tile.x, map.width), shortestDelta(entity.tile.y, owner.tile.y, map.height));
    if (distanceToOwner > 2) {
      entity.state = owner.state === "alerted" ? "alerted" : "investigating";
      stepToward(entity, map, owner.tile, canOccupyTile);
    } else {
      const wasIdle = entity.state === "calm";
      entity.state = owner.state === "alerted" ? "alerted" : "calm";
      if (entity.state === "calm" && !wasIdle) entity.dogIdlePose = chooseDogIdlePose();
    }
  }
  return [];
}

function tickHuman(
  entity: Entity,
  map: GameMap,
  noises: NoiseEvent[],
  chooseHumanIdlePose: () => HumanIdlePose,
  canOccupyTile: CanOccupyTile
): NoiseEvent[] {
  const wasIdle = entity.state === "calm";
  if (entity.armed && (entity.state === "shooting" || entity.targetTile)) return [];
  if (entity.infected) entity.state = "infected";
  if (entity.seesStimulus || entity.hearsStimulus) {
    entity.state = "alerted";
  }
  if (noises.some((noise) => (noise.kind === "gunshot" || noise.kind === "scream" || noise.kind === "bark") && canHear(entity, noise))) {
    entity.state = "alerted";
  }
  if (entity.state === "calm") {
    if (!wasIdle) entity.humanIdlePose = chooseHumanIdlePose();
  } else if (entity.state === "alerted") {
    stepWander(entity, map, canOccupyTile);
  }
  return [];
}

function stepWander(entity: Entity, map: GameMap, canOccupyTile: CanOccupyTile): void {
  const direction = entity.id.length % 2 === 0 ? 1 : -1;
  const options = [
    { x: direction, y: 0 },
    { x: 0, y: direction },
    { x: -direction, y: 0 },
    { x: 0, y: -direction }
  ];
  for (const delta of options) {
    const candidate = wrapTile(map, { x: entity.tile.x + delta.x, y: entity.tile.y + delta.y });
    if (canOccupyTile(entity, candidate)) {
      entity.tile = candidate;
      entity.facing = Math.atan2(delta.y, delta.x);
      return;
    }
  }
}

function stepToward(entity: Entity, map: GameMap, target: TilePos, canOccupyTile: CanOccupyTile): void {
  const dx = shortestDelta(entity.tile.x, target.x, map.width);
  const dy = shortestDelta(entity.tile.y, target.y, map.height);
  const primary = Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
  const secondary = primary.x === 0 ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
  for (const delta of [primary, secondary]) {
    if (delta.x === 0 && delta.y === 0) continue;
    const candidate = wrapTile(map, { x: entity.tile.x + delta.x, y: entity.tile.y + delta.y });
    if (canOccupyTile(entity, candidate)) {
      entity.tile = candidate;
      return;
    }
  }
}

function shortestDelta(from: number, to: number, size: number): number {
  const direct = to - from;
  const wrapped = direct > 0 ? direct - size : direct + size;
  return Math.abs(direct) <= Math.abs(wrapped) ? direct : wrapped;
}
