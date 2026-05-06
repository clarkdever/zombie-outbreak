import { entityColor } from "./entityPresentation";
import { spriteDrawPlanFor, spriteFrameFor, spriteFrameRect, spriteSheetSupportsFacing, type SpriteFrame } from "./spriteManifest";
import type { SpriteAtlas } from "./spriteAtlas";
import type { Entity } from "../sim/types";

export { spriteAnimationFor, spriteFrameFor, type SpriteAnimation, type SpriteFrame } from "./spriteManifest";

export function drawEntitySprite(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  screen: { x: number; y: number },
  timeSeconds: number,
  atlas?: SpriteAtlas
): void {
  const spriteTime = entity.lifetimeSeconds || timeSeconds;
  const plan = spriteDrawPlanFor(entity, spriteTime);
  const sheet = atlas?.get(plan.sheet.id, plan.direction, plan.clip.animation, plan.variant);
  if (sheet && spriteSheetSupportsFacing(plan.sheet.id, plan.direction)) {
    drawSheetSprite(ctx, sheet.image, screen, sheet, plan);
    return;
  }
  const sprite = spriteFrameFor(entity, spriteTime);
  const scale = entity.species === "dog" || entity.species === "zombieDog" ? 2 : 2.35;
  const x = Math.round(screen.x);
  const y = Math.round(screen.y - 14);
  ctx.save();
  ctx.translate(x, y);
  if (sprite.flipX) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  if (entity.species === "dog" || entity.species === "zombieDog") {
    drawDog(ctx, entity, sprite, scale);
  } else if (entity.skeleton) {
    drawSkeleton(ctx, scale);
  } else if (!entity.alive) {
    drawDowned(ctx, entity, scale);
  } else {
    drawHumanoid(ctx, entity, sprite, scale);
  }
  ctx.restore();
}

function drawSheetSprite(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  screen: { x: number; y: number },
  sheet: NonNullable<ReturnType<SpriteAtlas["get"]>>,
  plan: ReturnType<typeof spriteDrawPlanFor>
): void {
  const x = Math.round(screen.x);
  const y = Math.round(screen.y - 14);
  const scaleX = plan.destination.width / plan.sheet.frameWidth;
  const scaleY = plan.destination.height / plan.sheet.frameHeight;
  const sourceRect = sheet.animation
    ? spriteFrameRect({ frameWidth: plan.sheet.frameWidth, frameHeight: plan.sheet.frameHeight, columns: plan.sheet.columns, row: 0 }, plan.frame)
    : plan.sourceRect;
  ctx.save();
  ctx.translate(x, y);
  if (!sheet.direction && plan.flipX) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    Math.round(-plan.anchor.x * scaleX),
    Math.round(-plan.anchor.y * scaleY),
    plan.destination.width,
    plan.destination.height
  );
  ctx.restore();
}

function drawHumanoid(ctx: CanvasRenderingContext2D, entity: Entity, sprite: SpriteFrame, scale: number): void {
  const base = entityColor(entity);
  const zombie = entity.species === "zombieHuman";
  if (!zombie && sprite.animation === "idle" && entity.humanIdlePose === "sit") {
    drawSittingHuman(ctx, entity, scale);
    return;
  }
  if (!zombie && sprite.animation === "idle" && entity.humanIdlePose === "kneel") {
    drawKneelingHuman(ctx, entity, scale);
    return;
  }
  const skin = zombie ? "#9ab17f" : "#f2c59b";
  const outline = "#101410";
  const shade = zombie ? "#6d8a5d" : "#1d2b24";
  const legOffset = sprite.animation === "walk" || sprite.animation === "run" ? (sprite.frame % 2 === 0 ? -1 : 1) : 0;
  const bob = sprite.animation === "run" ? (sprite.frame % 2 === 0 ? -1 : 0) : 0;
  const lunge = sprite.animation === "attack" || sprite.animation === "feed" ? sprite.frame - 1 : 0;

  rect(ctx, -4, -11 + bob, 8, 11, outline, scale);
  rect(ctx, -3, -10 + bob, 6, 9, base, scale);
  rect(ctx, -2, -15 + bob, 4, 4, outline, scale);
  rect(ctx, -1, -14 + bob, 3, 3, skin, scale);
  rect(ctx, -3, -6 + bob, 2, 5 + legOffset, shade, scale);
  rect(ctx, 1, -6 + bob, 2, 5 - legOffset, shade, scale);
  rect(ctx, -6 - lunge, -9 + bob, 2, 6, outline, scale);
  rect(ctx, 4 + lunge, -9 + bob, 2, 6, outline, scale);
  if (entity.armed && !zombie) {
    rect(ctx, 5, -8 + bob, 5, 2, "#202020", scale);
    if (sprite.animation === "shoot" && sprite.frame === 0) {
      rect(ctx, 10, -9 + bob, 2, 3, "#ffef9f", scale);
    }
  }
  if (zombie) {
    rect(ctx, -5 - lunge, -8 + bob, 3, 2, "#d94f45", scale);
    rect(ctx, 3 + lunge, -8 + bob, 3, 2, "#d94f45", scale);
  }
}

function drawSittingHuman(ctx: CanvasRenderingContext2D, entity: Entity, scale: number): void {
  const base = entityColor(entity);
  const skin = "#f2c59b";
  const outline = "#101410";
  rect(ctx, -6, -8, 12, 8, outline, scale);
  rect(ctx, -5, -7, 10, 6, base, scale);
  rect(ctx, -3, -13, 6, 5, outline, scale);
  rect(ctx, -2, -12, 4, 4, skin, scale);
  rect(ctx, -7, -2, 5, 3, outline, scale);
  rect(ctx, 2, -2, 5, 3, outline, scale);
  if (entity.armed) rect(ctx, 5, -7, 5, 2, "#202020", scale);
}

function drawKneelingHuman(ctx: CanvasRenderingContext2D, entity: Entity, scale: number): void {
  const base = entityColor(entity);
  const skin = "#f2c59b";
  const outline = "#101410";
  rect(ctx, -4, -12, 8, 10, outline, scale);
  rect(ctx, -3, -11, 6, 8, base, scale);
  rect(ctx, -2, -16, 5, 5, outline, scale);
  rect(ctx, -1, -15, 3, 4, skin, scale);
  rect(ctx, -5, -3, 4, 5, outline, scale);
  rect(ctx, 1, -2, 7, 3, outline, scale);
  if (entity.armed) rect(ctx, 5, -9, 5, 2, "#202020", scale);
}

function drawDog(ctx: CanvasRenderingContext2D, entity: Entity, sprite: SpriteFrame, scale: number): void {
  const zombie = entity.species === "zombieDog";
  const body = zombie ? "#9ab17f" : "#d0a15f";
  const outline = "#101410";
  const legOffset = sprite.animation === "run" || sprite.animation === "walk" ? (sprite.frame % 2 === 0 ? -1 : 1) : 0;
  rect(ctx, -7, -8, 12, 6, outline, scale);
  rect(ctx, -6, -7, 10, 4, body, scale);
  rect(ctx, 4, -10, 4, 4, outline, scale);
  rect(ctx, 5, -9, 3, 3, body, scale);
  rect(ctx, -6, -3, 2, 4 + legOffset, outline, scale);
  rect(ctx, 1, -3, 2, 4 - legOffset, outline, scale);
  rect(ctx, -9, -8, 3, 2, zombie ? "#d94f45" : body, scale);
}

function drawDowned(ctx: CanvasRenderingContext2D, entity: Entity, scale: number): void {
  rect(ctx, -8, -4, 16, 5, "#101410", scale);
  rect(ctx, -7, -3, 14, 3, entityColor(entity), scale);
  rect(ctx, 5, -6, 4, 4, "#f2c59b", scale);
}

function drawSkeleton(ctx: CanvasRenderingContext2D, scale: number): void {
  rect(ctx, -8, -3, 16, 2, "#ffffff", scale);
  rect(ctx, -2, -7, 4, 4, "#ffffff", scale);
  rect(ctx, -6, -1, 4, 2, "#ffffff", scale);
  rect(ctx, 3, -1, 5, 2, "#ffffff", scale);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, scale: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(width * scale), Math.round(height * scale));
}
