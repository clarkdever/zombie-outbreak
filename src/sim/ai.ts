import { tileBlocksMovement, wrapTile } from "./map";
import { movementSpeedFor } from "./movement";
import { canHear, canSee, createNoise } from "./perception";
import type { Entity, GameMap, NoiseEvent, TilePos } from "./types";

const CALM_HOME_RADIUS = 3;

export function tickSimpleAi(
  entity: Entity,
  map: GameMap,
  entities: Entity[],
  noises: NoiseEvent[],
  immobilizedIds = new Set<string>()
): NoiseEvent[] {
  entity.speed = movementSpeedFor(entity);
  if (entity.controlled || entity.skeleton || immobilizedIds.has(entity.id)) return [];
  if (!entity.alive && entity.species !== "zombieHuman" && entity.species !== "zombieDog") return [];
  if (entity.species === "zombieHuman" || entity.species === "zombieDog") {
    return tickZombie(entity, map, entities);
  }
  if (entity.species === "dog") {
    return tickDog(entity, map, entities);
  }
  return tickHuman(entity, map, noises);
}

function tickZombie(entity: Entity, map: GameMap, entities: Entity[]): NoiseEvent[] {
  if (entity.state === "feeding") return [];
  const livingTarget = entities.find((target) => target.alive && (target.species === "human" || target.species === "dog"));
  if (livingTarget) {
    entity.state = "attacking";
    entity.targetTile = livingTarget.tile;
    entity.facing = Math.atan2(livingTarget.tile.y - entity.tile.y, livingTarget.tile.x - entity.tile.x);
    stepToward(entity, map, livingTarget.tile);
  } else {
    entity.state = "investigating";
    const candidate = wrapTile(map, { x: entity.tile.x + (entity.id.length % 2 === 0 ? 1 : -1), y: entity.tile.y });
    if (!tileBlocksMovement(map, candidate)) entity.tile = candidate;
  }
  return [];
}

function tickDog(entity: Entity, map: GameMap, entities: Entity[]): NoiseEvent[] {
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
      entity.state = owner.state === "alerted" ? "alerted" : "calm";
      stepToward(entity, map, owner.tile);
    } else {
      entity.state = owner.state === "alerted" ? "alerted" : "calm";
    }
  }
  return [];
}

function tickHuman(entity: Entity, map: GameMap, noises: NoiseEvent[]): NoiseEvent[] {
  if (entity.armed && (entity.state === "shooting" || entity.targetTile)) return [];
  if (entity.infected) entity.state = "infected";
  if (entity.seesStimulus || entity.hearsStimulus) {
    entity.state = "alerted";
  }
  if (noises.some((noise) => (noise.kind === "gunshot" || noise.kind === "scream" || noise.kind === "bark") && canHear(entity, noise))) {
    entity.state = "alerted";
  }
  if (entity.state === "calm") {
    stepWanderNearHome(entity, map);
  } else if (entity.state === "alerted") {
    stepWander(entity, map);
  }
  return [];
}

function stepWanderNearHome(entity: Entity, map: GameMap): void {
  const home = entity.homeTile ?? entity.tile;
  const distanceFromHome = Math.hypot(entity.tile.x - home.x, entity.tile.y - home.y);
  if (distanceFromHome >= CALM_HOME_RADIUS) {
    stepToward(entity, map, home);
    return;
  }

  const direction = entity.id.length % 2 === 0 ? 1 : -1;
  const options = [
    { x: direction, y: 0 },
    { x: 0, y: direction },
    { x: -direction, y: 0 },
    { x: 0, y: -direction }
  ];
  for (const delta of options) {
    const candidate = wrapTile(map, { x: entity.tile.x + delta.x, y: entity.tile.y + delta.y });
    if (tileBlocksMovement(map, candidate)) continue;
    if (Math.hypot(candidate.x - home.x, candidate.y - home.y) > CALM_HOME_RADIUS) continue;
    entity.tile = candidate;
    entity.facing = Math.atan2(delta.y, delta.x);
    return;
  }
}

function stepWander(entity: Entity, map: GameMap): void {
  const direction = entity.id.length % 2 === 0 ? 1 : -1;
  const options = [
    { x: direction, y: 0 },
    { x: 0, y: direction },
    { x: -direction, y: 0 },
    { x: 0, y: -direction }
  ];
  for (const delta of options) {
    const candidate = wrapTile(map, { x: entity.tile.x + delta.x, y: entity.tile.y + delta.y });
    if (!tileBlocksMovement(map, candidate)) {
      entity.tile = candidate;
      entity.facing = Math.atan2(delta.y, delta.x);
      return;
    }
  }
}

function stepToward(entity: Entity, map: GameMap, target: TilePos): void {
  const dx = shortestDelta(entity.tile.x, target.x, map.width);
  const dy = shortestDelta(entity.tile.y, target.y, map.height);
  const primary = Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
  const secondary = primary.x === 0 ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
  for (const delta of [primary, secondary]) {
    if (delta.x === 0 && delta.y === 0) continue;
    const candidate = wrapTile(map, { x: entity.tile.x + delta.x, y: entity.tile.y + delta.y });
    if (!tileBlocksMovement(map, candidate)) {
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
