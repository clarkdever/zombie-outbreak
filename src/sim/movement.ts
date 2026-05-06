import type { Entity } from "./types";

export function movementSpeedFor(entity: Entity): number {
  if (entity.skeleton || (!entity.alive && entity.species !== "zombieHuman" && entity.species !== "zombieDog")) return 0;
  if (entity.species === "dog") return entity.state === "alerted" || entity.state === "fleeing" ? 2.4 : 1.6;
  if (entity.species === "zombieDog") return 1.1;
  if (entity.species === "zombieHuman") return entity.state === "attacking" ? 0.8 : 0.6;
  if (entity.state === "fleeing" || entity.state === "alerted") return 2;
  return 1;
}
