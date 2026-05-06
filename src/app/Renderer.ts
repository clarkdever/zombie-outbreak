import type { Entity, GameMap } from "../sim/types";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const TILE_W = 48;
const TILE_H = 24;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }
    this.ctx = ctx;
  }

  render(map: GameMap, entities: Entity[], camera: Camera, selectedId?: string, debug = false): void {
    this.ctx.fillStyle = "#151815";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        this.drawTile(x, y, map.tiles[y][x].kind, camera);
      }
    }
    for (const entity of entities) {
      this.drawEntity(entity, camera, entity.id === selectedId, debug);
    }
  }

  pickEntity(entities: Entity[], camera: Camera, point: { x: number; y: number }): Entity | undefined {
    return [...entities].reverse().find((entity) => {
      const p = isoToScreen(entity.tile.x, entity.tile.y, camera, this.canvas);
      return Math.hypot(point.x - p.x, point.y - (p.y - 14)) < 16;
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

  private drawEntity(entity: Entity, camera: Camera, selected: boolean, debug: boolean): void {
    const p = isoToScreen(entity.tile.x, entity.tile.y, camera, this.canvas);
    const color = entityColor(entity);
    if (selected || debug) {
      this.ctx.strokeStyle = senseStrokeColor(entity, "hearing");
      this.ctx.lineWidth = debug ? 2 : 1.5;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 14, entity.species === "dog" ? 72 : 48, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.strokeStyle = senseStrokeColor(entity, "vision");
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y - 14);
      this.ctx.lineTo(p.x + Math.cos(entity.facing - 0.45) * 90, p.y - 14 + Math.sin(entity.facing - 0.45) * 90);
      this.ctx.lineTo(p.x + Math.cos(entity.facing + 0.45) * 90, p.y - 14 + Math.sin(entity.facing + 0.45) * 90);
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.strokeStyle = stateStrokeColor(entity, selected);
      this.ctx.lineWidth = selected ? 3 : debug ? 2 : 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 14, 13, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y - 14, entity.species === "dog" ? 6 : 8, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

function entityColor(entity: Entity): string {
  if (entity.skeleton) return "#ffffff";
  if (entity.species.includes("zombie")) return "#e63946";
  if (entity.armed && entity.species === "human") return "#3a86ff";
  if (entity.species === "human") return "#2fbf71";
  if (entity.species === "dog") return "#d0a15f";
  return "#f1f4ea";
}

export function isoToScreen(x: number, y: number, camera: Camera, canvas: HTMLCanvasElement): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_W / 2) * camera.zoom + canvas.width / 2 - camera.x,
    y: (x + y) * (TILE_H / 2) * camera.zoom + 80 - camera.y
  };
}

function stateStrokeColor(entity: Entity, selected: boolean): string {
  if (entity.state === "fleeing" || entity.state === "alerted") return "#f4d35e";
  if (entity.state === "infected" || entity.state === "turning") return "#ef476f";
  if (entity.state === "attacking" || entity.state === "feeding") return "#ff7a59";
  if (selected) return "#ffffff";
  return "#62b6cb";
}

function senseStrokeColor(entity: Entity, sense: "hearing" | "vision"): string {
  if (sense === "hearing" && entity.hearsStimulus) return "rgba(244, 211, 94, 0.9)";
  if (sense === "vision" && entity.seesStimulus) return "rgba(239, 71, 111, 0.9)";
  return sense === "hearing" ? "rgba(98, 182, 203, 0.34)" : "rgba(255, 255, 255, 0.28)";
}
