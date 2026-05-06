import type { TileKind } from "../sim/types";

export const TERRAIN_ATLAS_SRC = "/assets/sprites/generated/terrain-atlas.png";
export const TERRAIN_FRAME_WIDTH = 96;
export const TERRAIN_FRAME_HEIGHT = 64;
export const TERRAIN_COLUMNS = 4;

const terrainRows: Record<TileKind, number[]> = {
  grass: [0, 1, 2],
  yard: [0, 1, 2],
  sidewalk: [3, 4],
  road: [5, 6],
  crosswalk: [7],
  car: [8, 9],
  houseFloor: [10, 11],
  carpet: [12, 13],
  furniture: [14, 15],
  houseWall: [16, 17],
  house: [16, 17],
  fence: [18],
  tree: [19]
};

export interface TerrainFrame {
  column: number;
  row: number;
}

export function terrainFrameFor(kind: TileKind, x: number, y: number): TerrainFrame {
  const rows = terrainRows[kind] ?? terrainRows.grass;
  return {
    column: hashVariant(x, y, kind) % TERRAIN_COLUMNS,
    row: rows[hashVariant(y, x, kind) % rows.length]
  };
}

function hashVariant(x: number, y: number, kind: string): number {
  let hash = 2166136261;
  for (let index = 0; index < kind.length; index += 1) {
    hash ^= kind.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= Math.imul(x + 31, 73856093);
  hash ^= Math.imul(y + 17, 19349663);
  return hash >>> 0;
}
