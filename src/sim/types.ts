export type Species = "human" | "dog" | "zombieHuman" | "zombieDog";
export type TileKind = "grass" | "road" | "sidewalk" | "house" | "fence" | "tree" | "car" | "yard";
export type EntityState =
  | "calm"
  | "alerted"
  | "investigating"
  | "fleeing"
  | "attacking"
  | "shooting"
  | "infected"
  | "downed"
  | "turning"
  | "feeding"
  | "stuck";

export interface TilePos {
  x: number;
  y: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Tile {
  kind: TileKind;
  moveCost: number;
  blocksMovement: boolean;
  blocksSight: boolean;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Tile[][];
}

export interface Entity {
  id: string;
  name: string;
  affiliation: string;
  species: Species;
  state: EntityState;
  tile: TilePos;
  homeTile?: TilePos;
  facing: number;
  speed: number;
  hp: number;
  maxHp: number;
  armed: boolean;
  ammo: number;
  shotCooldownSeconds: number;
  infected: boolean;
  infectionSeconds: number;
  turnSeconds: number;
  meat: number;
  originalMeat: number;
  infectionDamageRemainder?: number;
  feedingRemainder?: number;
  ownerId?: string;
  groupId?: string;
  controlled: boolean;
  alive: boolean;
  skeleton: boolean;
  seenZombie: boolean;
  seesStimulus?: boolean;
  hearsStimulus?: boolean;
  stimulusMemorySeconds: number;
  targetTile?: TilePos;
  meatEatenByBody: Record<string, number>;
  totalMeatEaten: number;
  humansAlerted: number;
  zombieDamageDealt: number;
  zombieKills: number;
  lifetimeSeconds: number;
}

export interface HumanGroup {
  id: string;
  name: string;
  color: string;
  leaderId?: string;
  memberIds: string[];
}

export interface WorldState {
  entities: Entity[];
  groups: HumanGroup[];
}

export type NoiseKind = "gunshot" | "scream" | "bark" | "speech" | "growl" | "feeding" | "struggle";

export interface NoiseEvent {
  id: string;
  kind: NoiseKind;
  tile: TilePos;
  radius: number;
  ageSeconds: number;
}

export interface BulletTrace {
  id: string;
  from: Vec2;
  to: Vec2;
  shooterId: string;
  hitEntityId?: string;
  ageSeconds: number;
}

export interface SimStats {
  elapsedSeconds: number;
  zombiesKilled: number;
  humansTurned: number;
  humansTurnedPending: number;
  dogsTurned: number;
  skeletonsCreated: number;
  firstInfectedName?: string;
  zombiePopulationSamples: number[];
}

export interface EndFact {
  label: string;
  value: string;
}
