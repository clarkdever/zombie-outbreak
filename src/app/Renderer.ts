import { entityRingColor } from "./entityPresentation";
import { createBrowserSpriteAtlas, type SpriteAtlas } from "./spriteAtlas";
import { drawEntitySprite } from "./sprites";
import type { VisualEntity } from "./visualPositions";
import { visionRadiansFor, visionRangeFor } from "../sim/perception";
import type { Entity, GameMap, TilePos, Vec2 } from "../sim/types";
import type { BulletTrace } from "../sim/types";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const TILE_W = 48;
const TILE_H = 24;
type RenderableEntity = Entity | VisualEntity<Entity>;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly spriteAtlas: SpriteAtlas;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }
    this.ctx = ctx;
    this.spriteAtlas = createBrowserSpriteAtlas();
  }

  render(
    map: GameMap,
    entities: RenderableEntity[],
    bullets: BulletTrace[],
    camera: Camera,
    selectedId?: string,
    debug = false,
    timeSeconds = 0
  ): void {
    this.ctx.fillStyle = "#151815";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        this.drawTile(x, y, map.tiles[y][x].kind, camera);
      }
    }
    for (const entity of [...entities].sort(compareRenderableEntities)) {
      this.drawEntity(entity, camera, entity.id === selectedId, debug, timeSeconds);
    }
    for (const bullet of bullets) {
      this.drawBullet(bullet, camera);
    }
  }

  pickEntity(entities: RenderableEntity[], camera: Camera, point: { x: number; y: number }): Entity | undefined {
    return [...entities].reverse().find((entity) => {
      const tile = renderTileFor(entity);
      const p = isoToScreen(tile.x, tile.y, camera, this.canvas);
      const bounds = entityPickBounds(entity.species, p);
      return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
    });
  }

  private drawTile(x: number, y: number, kind: string, camera: Camera): void {
    const p = isoToScreen(x, y, camera, this.canvas);
    const colors: Record<string, string> = {
      grass: "#4c7a45",
      road: "#3b3d3c",
      sidewalk: "#85877e",
      house: "#9d5c45",
      fence: "#b58b53",
      tree: "#2f6636",
      car: "#476aa8",
      yard: "#5d8d4d"
    };
    this.ctx.fillStyle = colors[kind] ?? "#4c7a45";
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - TILE_H / 2);
    this.ctx.lineTo(p.x + TILE_W / 2, p.y);
    this.ctx.lineTo(p.x, p.y + TILE_H / 2);
    this.ctx.lineTo(p.x - TILE_W / 2, p.y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(0,0,0,0.22)";
    this.ctx.stroke();
  }

  private drawEntity(entity: RenderableEntity, camera: Camera, selected: boolean, debug: boolean, timeSeconds: number): void {
    const tile = renderTileFor(entity);
    const p = isoToScreen(tile.x, tile.y, camera, this.canvas);
    if (selected || debug) {
      this.ctx.strokeStyle = senseStrokeColor(entity, "hearing");
      this.ctx.lineWidth = debug ? 2 : 1.5;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 14, entity.species === "dog" ? 72 : 48, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.strokeStyle = senseStrokeColor(entity, "vision");
      const sector = visionSectorPathPoints(tile, entity.facing, visionRadiansFor(entity), visionRangeFor(entity), 16);
      this.ctx.beginPath();
      for (const [index, point] of sector.entries()) {
        const screen = isoToScreen(point.x, point.y, camera, this.canvas);
        if (index === 0) this.ctx.moveTo(screen.x, screen.y - 14);
        else this.ctx.lineTo(screen.x, screen.y - 14);
      }
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.strokeStyle = entityRingColor(entity, selected);
      this.ctx.lineWidth = selected ? 3 : debug ? 2 : 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 14, 13, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    drawEntitySprite(this.ctx, entity, p, timeSeconds, this.spriteAtlas);
  }

  private drawBullet(bullet: BulletTrace, camera: Camera): void {
    const from = isoToScreen(bullet.from.x, bullet.from.y, camera, this.canvas);
    const to = isoToScreen(bullet.to.x, bullet.to.y, camera, this.canvas);
    const alpha = Math.max(0, 1 - bullet.ageSeconds / 0.22);
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = bullet.hitEntityId ? "#ffef9f" : "#f8f7f2";
    this.ctx.lineWidth = bullet.hitEntityId ? 3 : 2;
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y - 14);
    this.ctx.lineTo(to.x, to.y - 14);
    this.ctx.stroke();
    this.ctx.restore();
  }
}

export function isoToScreen(x: number, y: number, camera: Camera, canvas: HTMLCanvasElement): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_W / 2) * camera.zoom + canvas.width / 2 - camera.x,
    y: (x + y) * (TILE_H / 2) * camera.zoom + 80 - camera.y
  };
}

export function entityPickBounds(species: Entity["species"], screen: { x: number; y: number }): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const dog = species === "dog" || species === "zombieDog";
  const halfWidth = dog ? 28 : 34;
  const topOffset = dog ? 44 : 64;
  const bottomOffset = dog ? 8 : 6;
  return {
    left: screen.x - halfWidth,
    right: screen.x + halfWidth,
    top: screen.y - topOffset,
    bottom: screen.y + bottomOffset
  };
}

export function compareRenderableEntities(a: RenderableEntity, b: RenderableEntity): number {
  const aTile = renderTileFor(a);
  const bTile = renderTileFor(b);
  const floorOrder = renderFloorPriority(a) - renderFloorPriority(b);
  if (floorOrder !== 0) return floorOrder;
  return aTile.x + aTile.y - (bTile.x + bTile.y);
}

function renderFloorPriority(entity: RenderableEntity): number {
  if (entity.skeleton) return 0;
  if (!entity.alive && !entity.species.includes("zombie")) return 1;
  return 2;
}

function senseStrokeColor(entity: Entity, sense: "hearing" | "vision"): string {
  if (sense === "hearing" && entity.hearsStimulus) return "rgba(244, 211, 94, 0.9)";
  if (sense === "vision" && entity.seesStimulus) return "rgba(239, 71, 111, 0.9)";
  return sense === "hearing" ? "rgba(98, 182, 203, 0.34)" : "rgba(255, 255, 255, 0.28)";
}

function renderTileFor(entity: RenderableEntity): TilePos {
  return "renderTile" in entity ? entity.renderTile : entity.tile;
}

export function visionSectorPathPoints(origin: Vec2, facing: number, radians: number, range: number, arcSegments: number): Vec2[] {
  const halfVision = radians / 2;
  const segmentCount = Math.max(1, Math.floor(arcSegments));
  const points: Vec2[] = [{ x: origin.x, y: origin.y }];
  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const angle = facing - halfVision + radians * progress;
    points.push({
      x: origin.x + Math.cos(angle) * range,
      y: origin.y + Math.sin(angle) * range
    });
  }
  return points;
}
