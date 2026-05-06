import type { Entity, HumanGroup } from "./types";

export function warnNearbyHumans(source: Entity, entities: Entity[], radius: number): number {
  if (!source.seenZombie) return 0;
  let alerted = 0;
  for (const target of entities) {
    if (target.id === source.id || target.species !== "human" || !target.alive) continue;
    const distance = Math.hypot(target.tile.x - source.tile.x, target.tile.y - source.tile.y);
    if (distance <= radius && !target.seenZombie) {
      target.seenZombie = true;
      target.state = "alerted";
      source.humansAlerted += 1;
      alerted += 1;
    }
  }
  return alerted;
}

export function mergeGroups(a: HumanGroup, b: HumanGroup, entities: Entity[]): HumanGroup {
  const memberIds = [...new Set([...a.memberIds, ...b.memberIds])];
  const armedA = leaderIsArmed(a, entities);
  const armedB = leaderIsArmed(b, entities);
  let leaderId = a.leaderId ?? b.leaderId;
  if (armedA && armedB) {
    leaderId = a.memberIds.length >= b.memberIds.length ? a.leaderId : b.leaderId;
  } else if (!armedA && armedB) {
    leaderId = b.leaderId;
  }
  for (const entity of entities) {
    if (memberIds.includes(entity.id)) {
      entity.groupId = a.id;
      entity.affiliation = a.name;
    }
  }
  return { ...a, memberIds, leaderId };
}

export function handleOwnerDeath(dog: Entity, entities: Entity[]): void {
  if (dog.species !== "dog") return;
  const owner = entities.find((entity) => entity.id === dog.ownerId);
  if (owner?.alive) return;
  const nextOwner = entities.find((entity) => entity.species === "human" && entity.alive);
  if (nextOwner) {
    dog.ownerId = nextOwner.id;
    dog.affiliation = nextOwner.name;
    dog.state = "calm";
  } else {
    dog.state = "alerted";
  }
}

function leaderIsArmed(group: HumanGroup, entities: Entity[]): boolean {
  return entities.some((entity) => entity.id === group.leaderId && entity.armed);
}
