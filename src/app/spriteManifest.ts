import type { Entity } from "../sim/types";

export type SpriteAnimation =
  | "walk"
  | "run"
  | "attack"
  | "attackHuman"
  | "attackUnarmedHuman"
  | "attackArmedHuman"
  | "attackDog"
  | "bark"
  | "shoot"
  | "feed"
  | "feedHuman"
  | "feedUnarmedHuman"
  | "feedArmedHuman"
  | "feedDog"
  | "downed"
  | "skeleton"
  | "idle";
export type SpriteDirection = "down" | "left" | "up" | "right";
export type SpriteSheetKey =
  | "human"
  | "armedHuman"
  | "dog"
  | "zombieHuman"
  | "zombieArmedHuman"
  | "zombieDog"
  | "corpse"
  | "skeletonHuman"
  | "skeletonDog";

export interface SpriteFrame {
  animation: SpriteAnimation;
  frame: number;
  flipX: boolean;
  direction: SpriteDirection;
}

export interface SpriteClip {
  animation: SpriteAnimation;
  row: number;
  frames: number;
  fps: number;
}

export interface SpriteSheetDefinition {
  id: SpriteSheetKey;
  src: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  anchor: { x: number; y: number };
  scale: number;
  supportedDirections: SpriteDirection[];
  clips: Record<SpriteAnimation, SpriteClip>;
}

export interface SpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteDrawPlan {
  sheet: SpriteSheetDefinition;
  clip: SpriteClip;
  frame: number;
  variant?: number;
  flipX: boolean;
  direction: SpriteDirection;
  sourceRect: SpriteRect;
  anchor: { x: number; y: number };
  destination: { width: number; height: number };
}

export const SPRITE_FRAME_SIZE = 96;
export const SPRITE_SHEET_COLUMNS = 4;
export const SPRITE_ANIMATION_ROWS = 8;
export const SPRITE_ANCHOR = { x: 48, y: 76 } as const;

const HUMANOID_CLIPS = clips({
  idle: [0, 4, 2],
  walk: [1, 4, 4],
  run: [2, 4, 7],
  attack: [3, 3, 8],
  attackHuman: [3, 3, 8],
  attackUnarmedHuman: [3, 3, 8],
  attackArmedHuman: [3, 3, 8],
  attackDog: [3, 3, 8],
  bark: [3, 3, 8],
  shoot: [4, 2, 12],
  feed: [5, 3, 5],
  feedHuman: [5, 3, 5],
  feedUnarmedHuman: [5, 3, 5],
  feedArmedHuman: [5, 3, 5],
  feedDog: [5, 3, 5],
  downed: [6, 1, 1],
  skeleton: [7, 1, 1]
});

const DOG_CLIPS = clips({
  idle: [0, 4, 2],
  walk: [1, 4, 5],
  run: [2, 4, 8],
  attack: [3, 3, 8],
  attackHuman: [3, 3, 8],
  attackUnarmedHuman: [3, 3, 8],
  attackArmedHuman: [3, 3, 8],
  attackDog: [3, 3, 8],
  bark: [5, 3, 7],
  shoot: [0, 2, 2],
  feed: [4, 3, 5],
  feedHuman: [4, 3, 5],
  feedUnarmedHuman: [4, 3, 5],
  feedArmedHuman: [4, 3, 5],
  feedDog: [4, 3, 5],
  downed: [6, 1, 1],
  skeleton: [7, 1, 1]
});

export const SPRITE_SHEETS: Record<SpriteSheetKey, SpriteSheetDefinition> = {
  human: spriteSheet("human", "human.png", HUMANOID_CLIPS, 0.66, { x: 48, y: 78 }),
  armedHuman: spriteSheet("armedHuman", "armed-human.png", HUMANOID_CLIPS, 0.66),
  dog: spriteSheet("dog", "dog.png", DOG_CLIPS, 0.52),
  zombieHuman: spriteSheet("zombieHuman", "zombie-human.png", HUMANOID_CLIPS, 0.66),
  zombieArmedHuman: spriteSheet("zombieArmedHuman", "zombie-armed-human.png", HUMANOID_CLIPS, 0.66),
  zombieDog: spriteSheet("zombieDog", "zombie-dog.png", DOG_CLIPS, 0.52),
  corpse: spriteSheet("corpse", "corpse.png", HUMANOID_CLIPS, 0.66),
  skeletonHuman: spriteSheet("skeletonHuman", "skeleton-human.png", HUMANOID_CLIPS, 0.66),
  skeletonDog: spriteSheet("skeletonDog", "skeleton-dog.png", DOG_CLIPS, 0.52)
};

export function spriteAnimationFor(entity: Entity): SpriteAnimation {
  if (entity.skeleton) return "skeleton";
  if (!entity.alive && !entity.species.includes("zombie")) return "downed";
  if (entity.state === "shooting") return "shoot";
  if (entity.state === "feeding" && entity.grappleVictimSpecies === "human" && entity.grappleVictimArmed) return "feedArmedHuman";
  if (entity.state === "feeding" && entity.grappleVictimSpecies === "human") return "feedUnarmedHuman";
  if (entity.state === "feeding" && entity.grappleVictimSpecies === "dog") return "feedDog";
  if (entity.state === "feeding") return "feed";
  if (entity.state === "attacking" && entity.grappleVictimSpecies === "human" && entity.grappleVictimArmed) return "attackArmedHuman";
  if (entity.state === "attacking" && entity.grappleVictimSpecies === "human") return "attackUnarmedHuman";
  if (entity.state === "attacking" && entity.grappleVictimSpecies === "dog") return "attackDog";
  if (entity.state === "attacking") return "attack";
  if (entity.species === "dog" && entity.state === "alerted" && (entity.seesStimulus || entity.hearsStimulus)) return "bark";
  if ((entity.species === "human" || entity.species === "dog") && entity.state === "calm") return "idle";
  if (entity.state === "fleeing" || entity.state === "alerted") return "run";
  if (entity.state === "calm" || entity.state === "investigating") return "walk";
  return "idle";
}

export function spriteFrameFor(entity: Entity, timeSeconds: number): SpriteFrame {
  const animation = spriteAnimationFor(entity);
  const sheet = SPRITE_SHEETS[spriteSheetKeyFor(entity)];
  const clip = sheet.clips[animation];
  const frame =
    animation === "skeleton"
      ? Math.max(0, Math.min(sheet.columns - 1, entity.skeletonVariant ?? 0))
      : entity.species === "human" && !entity.armed && animation === "idle"
        ? (entity.humanIdlePose === "sit" || entity.humanIdlePose === "kneel" ? 2 : 0) + Math.floor(timeSeconds * clip.fps) % 2
        : entity.species === "human" && animation === "idle"
          ? Math.floor(timeSeconds * clip.fps) % 2
      : entity.species === "dog" && animation === "idle"
        ? (entity.dogIdlePose === "sleep" ? 2 : 0) + Math.floor(timeSeconds * clip.fps) % 2
        : clip.frames === 1
          ? 0
          : Math.floor(timeSeconds * clip.fps) % clip.frames;
  return {
    animation,
    frame,
    flipX: spriteDirectionFor(entity.facing) === "left",
    direction: spriteDirectionFor(entity.facing)
  };
}

export function spriteSheetKeyFor(entity: Entity): SpriteSheetKey {
  if (entity.skeleton) return entity.species === "dog" || entity.species === "zombieDog" ? "skeletonDog" : "skeletonHuman";
  if (!entity.alive && entity.species === "dog") return "dog";
  if (!entity.alive && !entity.species.includes("zombie")) return "corpse";
  if (entity.species === "human") return entity.armed ? "armedHuman" : "human";
  if (entity.species === "zombieHuman") return entity.armed ? "zombieArmedHuman" : "zombieHuman";
  return entity.species;
}

export function spriteDrawPlanFor(entity: Entity, timeSeconds: number): SpriteDrawPlan {
  const sheet = SPRITE_SHEETS[spriteSheetKeyFor(entity)];
  const frame = spriteFrameFor(entity, timeSeconds);
  const clip = sheet.clips[frame.animation] ?? sheet.clips.idle;
  const frameIndex = frame.animation === "skeleton" ? frame.frame : Math.min(frame.frame, clip.frames - 1);
  return {
    sheet,
    clip,
    frame: frameIndex,
    variant: entity.species === "zombieHuman" ? entity.zombieHumanVariant : undefined,
    flipX: frame.flipX,
    direction: frame.direction,
    sourceRect: spriteFrameRect({ ...sheet, row: clip.row }, frameIndex),
    anchor: sheet.anchor,
    destination: {
      width: Math.round(sheet.frameWidth * sheet.scale),
      height: Math.round(sheet.frameHeight * sheet.scale)
    }
  };
}

export function spriteDirectionFor(facing: number): SpriteDirection {
  const x = Math.cos(facing) - Math.sin(facing);
  const y = Math.cos(facing) + Math.sin(facing);
  const screenAngle = Math.atan2(y, x);
  if (screenAngle >= Math.PI / 4 && screenAngle < (3 * Math.PI) / 4) return "down";
  if (screenAngle >= (3 * Math.PI) / 4 || screenAngle < (-3 * Math.PI) / 4) return "left";
  if (screenAngle >= (-3 * Math.PI) / 4 && screenAngle < -Math.PI / 4) return "up";
  return "right";
}

export function spriteSheetSupportsFacing(sheetId: SpriteSheetKey, direction: SpriteDirection): boolean {
  return SPRITE_SHEETS[sheetId].supportedDirections.includes(direction);
}

export function spriteFrameRect(
  sheet: Pick<SpriteSheetDefinition, "frameWidth" | "frameHeight" | "columns"> & { row: number },
  frame: number
): SpriteRect {
  const column = frame % sheet.columns;
  return {
    x: column * sheet.frameWidth,
    y: sheet.row * sheet.frameHeight,
    width: sheet.frameWidth,
    height: sheet.frameHeight
  };
}

function spriteSheet(
  id: SpriteSheetKey,
  fileName: string,
  clipsByAnimation: Record<SpriteAnimation, SpriteClip>,
  scale: number,
  anchor: { x: number; y: number } = SPRITE_ANCHOR
): SpriteSheetDefinition {
  return {
    id,
    src: `/assets/sprites/generated/${fileName}`,
    frameWidth: SPRITE_FRAME_SIZE,
    frameHeight: SPRITE_FRAME_SIZE,
    columns: SPRITE_SHEET_COLUMNS,
    anchor: { ...anchor },
    scale,
    supportedDirections: ["down", "left", "up", "right"],
    clips: clipsByAnimation
  };
}

function clips(source: Record<SpriteAnimation, [row: number, frames: number, fps: number]>): Record<SpriteAnimation, SpriteClip> {
  return Object.fromEntries(
    Object.entries(source).map(([animation, [row, frames, fps]]) => [
      animation,
      { animation: animation as SpriteAnimation, row, frames, fps }
    ])
  ) as Record<SpriteAnimation, SpriteClip>;
}
