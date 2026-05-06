import { createNeighborhoodMap, tileBlocksMovement, wrapTile } from "./map";
import { dogName, groupName, humanName } from "./names";
import { Random } from "./random";
import type { Entity, GameMap, HumanGroup, Species, TilePos, WorldState } from "./types";

interface InitialWorldOptions {
  humans: number;
  dogs: number;
  zombies: number;
  armedPercent: number;
  seed: number;
}

const groupColors = ["#e95d4f", "#62b6cb", "#f2cc8f", "#81b29a", "#c77dff", "#f28482"];

export function createInitialWorld(options: InitialWorldOptions): WorldState {
  const random = new Random(options.seed);
  const map = createNeighborhoodMap();
  const entities: Entity[] = [];
  const groups: HumanGroup[] = [{
    id: "group-1",
    name: groupName(random),
    color: groupColors[0],
    memberIds: []
  }];

  for (let index = 0; index < options.humans; index += 1) {
    const human = createEntity({
      id: `human-${index + 1}`,
      name: humanName(index),
      affiliation: groups[0].name,
      species: "human",
      tile: randomOpenTile(map, random),
      armed: random.next() * 100 < options.armedPercent,
      groupId: groups[0].id
    });
    groups[0].memberIds.push(human.id);
    entities.push(human);
  }

  for (let index = 0; index < options.dogs; index += 1) {
    const owner = entities[index % Math.max(1, entities.length)];
    entities.push(createEntity({
      id: `dog-${index + 1}`,
      name: dogName(index),
      affiliation: owner?.name ?? "No One",
      species: "dog",
      tile: owner ? nearbyOpenTile(map, owner.tile, random) : randomOpenTile(map, random),
      ownerId: owner?.id
    }));
  }

  for (let index = 0; index < options.zombies; index += 1) {
    const former = humanName(options.humans + index);
    entities.push(createEntity({
      id: `zombie-${index + 1}`,
      name: `Undead ${former}`,
      affiliation: "The Horde",
      species: "zombieHuman",
      tile: randomOpenTile(map, random)
    }));
  }

  const firstArmed = entities.find((entity) => entity.species === "human" && entity.armed);
  groups[0].leaderId = firstArmed?.id ?? groups[0].memberIds[0];

  return { entities, groups };
}

function createEntity(input: {
  id: string;
  name: string;
  affiliation: string;
  species: Species;
  tile: TilePos;
  armed?: boolean;
  groupId?: string;
  ownerId?: string;
}): Entity {
  const dog = input.species === "dog" || input.species === "zombieDog";
  const zombie = input.species === "zombieHuman" || input.species === "zombieDog";
  const maxHp = dog ? 60 : zombie ? 120 : 100;
  return {
    id: input.id,
    name: input.name,
    affiliation: input.affiliation,
    species: input.species,
    state: zombie ? "investigating" : "calm",
    tile: input.tile,
    homeTile: input.tile,
    facing: 0,
    speed: dog ? 1.25 : zombie ? 0.7 : 1,
    hp: maxHp,
    maxHp,
    armed: input.armed ?? false,
    shotCooldownSeconds: 0,
    infected: zombie,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: dog ? 60 : 100,
    originalMeat: dog ? 60 : 100,
    infectionDamageRemainder: 0,
    feedingRemainder: 0,
    ownerId: input.ownerId,
    groupId: input.groupId,
    controlled: false,
    alive: !zombie,
    skeleton: false,
    seenZombie: zombie,
    seesStimulus: false,
    hearsStimulus: false,
    stimulusMemorySeconds: 0,
    meatEatenByBody: {},
    totalMeatEaten: 0,
    humansAlerted: 0,
    zombieDamageDealt: 0,
    zombieKills: 0,
    lifetimeSeconds: 0
  };
}

function randomOpenTile(map: GameMap, random: Random): TilePos {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const tile = { x: random.int(map.width), y: random.int(map.height) };
    if (!tileBlocksMovement(map, tile)) return tile;
  }
  return { x: 1, y: 1 };
}

function nearbyOpenTile(map: GameMap, center: TilePos, random: Random): TilePos {
  const options: TilePos[] = [];
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      if (Math.hypot(dx, dy) > 2) continue;
      const tile = wrapTile(map, { x: center.x + dx, y: center.y + dy });
      if (!tileBlocksMovement(map, tile)) options.push(tile);
    }
  }
  return options.length > 0 ? random.pick(options) : randomOpenTile(map, random);
}
