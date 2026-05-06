import { tileBlocksSight } from "./map";
import type { Entity, GameMap, NoiseEvent, NoiseKind, TilePos } from "./types";

let noiseId = 0;

const senses = {
  human: { hearing: 1, visionRange: 8, visionRadians: degreesToRadians(190) },
  dog: { hearing: 1.6, visionRange: 7, visionRadians: degreesToRadians(250) },
  zombieHuman: { hearing: 0.7, visionRange: 5, visionRadians: degreesToRadians(140) },
  zombieDog: { hearing: 1.1, visionRange: 5.5, visionRadians: degreesToRadians(190) }
} as const;

export function createNoise(kind: NoiseKind, tile: TilePos, radius: number): NoiseEvent {
  noiseId += 1;
  return { id: `noise-${noiseId}`, kind, tile, radius, ageSeconds: 0 };
}

export function canHear(listener: Entity, noise: NoiseEvent, multiplier = 1): boolean {
  const dx = listener.tile.x - noise.tile.x;
  const dy = listener.tile.y - noise.tile.y;
  const range = noise.radius * senses[listener.species].hearing * multiplier;
  return Math.hypot(dx, dy) <= range;
}

export function canSee(map: GameMap, viewer: Entity, target: TilePos): boolean {
  const dx = target.x - viewer.tile.x;
  const dy = target.y - viewer.tile.y;
  const distance = Math.hypot(dx, dy);
  const config = senses[viewer.species];
  if (distance > config.visionRange) return false;

  const angleToTarget = Math.atan2(dy, dx);
  const delta = Math.atan2(Math.sin(angleToTarget - viewer.facing), Math.cos(angleToTarget - viewer.facing));
  if (Math.abs(delta) > config.visionRadians / 2) return false;

  return hasLineOfSight(map, viewer.tile, target);
}

export function visionRadiansFor(entity: Entity): number {
  return senses[entity.species].visionRadians;
}

function hasLineOfSight(map: GameMap, from: TilePos, to: TilePos): boolean {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  if (steps <= 1) return true;
  for (let step = 1; step < steps; step += 1) {
    const x = Math.round(from.x + ((to.x - from.x) * step) / steps);
    const y = Math.round(from.y + ((to.y - from.y) * step) / steps);
    if (tileBlocksSight(map, { x, y })) return false;
  }
  return true;
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
