import { entityRingColor } from "./entityPresentation";
import { createBrowserSpriteAtlas, type SpriteAtlas } from "./spriteAtlas";
import { drawEntitySprite } from "./sprites";
import {
  TERRAIN_ATLAS_SRC,
  TERRAIN_FRAME_HEIGHT,
  TERRAIN_FRAME_WIDTH,
  TERRAIN_PROP_ATLAS_SRC,
  TERRAIN_PROP_FRAME_HEIGHT,
  TERRAIN_PROP_FRAME_WIDTH,
  TERRAIN_ROAD_DETAIL_ATLAS_SRC,
  TERRAIN_ROAD_DETAIL_FRAME_HEIGHT,
  TERRAIN_ROAD_DETAIL_FRAME_WIDTH,
  terrainFrameFor,
  terrainRoadDetailFrameFor,
  terrainSpriteDrawSpecFor,
  terrainUsesGroundTexture
} from "./terrainSprites";
import type { VisualEntity } from "./visualPositions";
import { visionRadiansFor, visionRangeFor } from "../sim/perception";
import type { Entity, GameMap, TilePos, Vec2 } from "../sim/types";
import type { BulletTrace, TileKind } from "../sim/types";

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
  private terrainAtlas?: HTMLImageElement;
  private terrainPropAtlas?: HTMLCanvasElement | HTMLImageElement;
  private roadDetailAtlas?: HTMLCanvasElement | HTMLImageElement;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }
    this.ctx = ctx;
    this.spriteAtlas = createBrowserSpriteAtlas();
    this.loadTerrainAtlas();
    this.loadTerrainPropAtlas();
    this.loadRoadDetailAtlas();
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
    for (const tile of terrainTileDrawOrder(map)) {
      this.drawGroundTile(tile.x, tile.y, map.tiles[tile.y][tile.x].kind, camera, map);
    }
    for (const item of renderSceneDrawOrder(map, entities)) {
      if (item.kind === "terrainProp") {
        this.drawTerrainSprite(item.x, item.y, item.tileKind, camera, map);
      } else {
        this.drawEntity(item.entity, camera, item.entity.id === selectedId, debug, timeSeconds);
      }
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

  private drawGroundTile(x: number, y: number, kind: TileKind, camera: Camera, map: GameMap): void {
    const p = isoToScreen(x, y, camera, this.canvas);
    const colors: Record<TileKind, string> = {
      grass: "#4c7a45",
      road: "#3b3d3c",
      crosswalk: "#6f746e",
      sidewalk: "#85877e",
      house: "#9d5c45",
      houseFloor: "#8f7355",
      carpet: "#7c4464",
      houseWall: "#9d5c45",
      furniture: "#70513a",
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
    if (terrainUsesGroundTexture(kind) && terrainSpriteDrawSpecFor(kind).layer === "ground") {
      this.drawTerrainSprite(x, y, kind, camera, map);
    }
    this.drawRoadDetailSprite(x, y, kind, camera, map);
  }

  private drawTerrainSprite(x: number, y: number, kind: TileKind, camera: Camera, map: GameMap): void {
    const p = isoToScreen(x, y, camera, this.canvas);
    const frame = terrainFrameFor(kind, x, y, map);
    const atlas = frame.atlas === "prop" ? this.terrainPropAtlas : this.terrainAtlas;
    const sourceWidth = frame.atlas === "prop" ? TERRAIN_PROP_FRAME_WIDTH : TERRAIN_FRAME_WIDTH;
    const sourceHeight = frame.atlas === "prop" ? TERRAIN_PROP_FRAME_HEIGHT : TERRAIN_FRAME_HEIGHT;
    if (atlas && isDrawableImage(atlas)) {
      const spec = terrainSpriteDrawSpecFor(kind);
      this.ctx.drawImage(
        atlas,
        frame.column * sourceWidth,
        frame.row * sourceHeight,
        sourceWidth,
        sourceHeight,
        Math.round(p.x - spec.anchorX),
        Math.round(p.y - spec.anchorY),
        spec.width,
        spec.height
      );
    }
  }

  private drawRoadDetailSprite(x: number, y: number, kind: TileKind, camera: Camera, map: GameMap): void {
    const frame = terrainRoadDetailFrameFor(kind, x, y, map);
    if (!frame || !this.roadDetailAtlas || !isDrawableImage(this.roadDetailAtlas)) return;
    const p = isoToScreen(x, y, camera, this.canvas);
    this.ctx.drawImage(
      this.roadDetailAtlas,
      frame.column * TERRAIN_ROAD_DETAIL_FRAME_WIDTH,
      frame.row * TERRAIN_ROAD_DETAIL_FRAME_HEIGHT,
      TERRAIN_ROAD_DETAIL_FRAME_WIDTH,
      TERRAIN_ROAD_DETAIL_FRAME_HEIGHT,
      Math.round(p.x - TERRAIN_ROAD_DETAIL_FRAME_WIDTH / 2),
      Math.round(p.y - TERRAIN_ROAD_DETAIL_FRAME_HEIGHT / 2 - 10),
      TERRAIN_ROAD_DETAIL_FRAME_WIDTH,
      TERRAIN_ROAD_DETAIL_FRAME_HEIGHT
    );
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

  private loadTerrainAtlas(): void {
    const image = new Image();
    image.onload = () => {
      this.terrainAtlas = image;
    };
    image.src = TERRAIN_ATLAS_SRC;
  }

  private loadTerrainPropAtlas(): void {
    const image = new Image();
    image.onload = () => {
      this.terrainPropAtlas = createChromaKeyedCanvas(image, [255, 0, 255]);
    };
    image.src = TERRAIN_PROP_ATLAS_SRC;
  }

  private loadRoadDetailAtlas(): void {
    const image = new Image();
    image.onload = () => {
      this.roadDetailAtlas = createChromaKeyedCanvas(image, [255, 0, 255]);
    };
    image.src = TERRAIN_ROAD_DETAIL_ATLAS_SRC;
  }
}

function isDrawableImage(image: HTMLCanvasElement | HTMLImageElement): boolean {
  return image instanceof HTMLCanvasElement || (image.complete && image.naturalWidth > 0);
}

export function createChromaKeyedCanvas(image: HTMLImageElement, key: [number, number, number]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const distance = Math.max(Math.abs(data[index] - key[0]), Math.abs(data[index + 1] - key[1]), Math.abs(data[index + 2] - key[2]));
    const dominance = Math.min(data[index], data[index + 2]) - data[index + 1];
    if (distance < 70 || dominance > 60) data[index + 3] = 0;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
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

type SceneDrawItem =
  | { kind: "terrainProp"; x: number; y: number; tileKind: TileKind }
  | { kind: "entity"; entity: RenderableEntity };

export function renderSceneDrawOrder(map: GameMap, entities: RenderableEntity[]): SceneDrawItem[] {
  const items: SceneDrawItem[] = [];
  for (const tile of terrainTileDrawOrder(map)) {
    const tileKind = map.tiles[tile.y][tile.x].kind;
    if (terrainSpriteDrawSpecFor(tileKind).layer === "prop") {
      items.push({ kind: "terrainProp", x: tile.x, y: tile.y, tileKind });
    }
  }
  for (const entity of entities) {
    items.push({ kind: "entity", entity });
  }
  return items.sort(compareSceneDrawItems);
}

function compareSceneDrawItems(a: SceneDrawItem, b: SceneDrawItem): number {
  const aTile = sceneItemTile(a);
  const bTile = sceneItemTile(b);
  const depth = aTile.x + aTile.y - (bTile.x + bTile.y);
  if (depth !== 0) return depth;
  const floor = sceneItemFloorPriority(a) - sceneItemFloorPriority(b);
  if (floor !== 0) return floor;
  return aTile.y - bTile.y || aTile.x - bTile.x;
}

function sceneItemTile(item: SceneDrawItem): TilePos {
  return item.kind === "terrainProp" ? { x: item.x, y: item.y } : renderTileFor(item.entity);
}

function sceneItemFloorPriority(item: SceneDrawItem): number {
  if (item.kind === "terrainProp") return 1;
  return renderFloorPriority(item.entity) + 2;
}

export function terrainTileDrawOrder(map: GameMap): TilePos[] {
  const tiles: TilePos[] = [];
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      tiles.push({ x, y });
    }
  }
  return tiles.sort((a, b) => {
    const depth = a.x + a.y - (b.x + b.y);
    if (depth !== 0) return depth;
    return a.y - b.y || a.x - b.x;
  });
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
