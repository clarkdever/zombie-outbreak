import type { GameMap, TileKind } from "../sim/types";

export const TERRAIN_ATLAS_SRC = "/assets/sprites/generated/terrain-atlas.png";
export const TERRAIN_PROP_ATLAS_SRC = "/assets/sprites/generated/terrain-props.png";
export const TERRAIN_FRAME_WIDTH = 96;
export const TERRAIN_FRAME_HEIGHT = 64;
export const TERRAIN_PROP_FRAME_WIDTH = 128;
export const TERRAIN_PROP_FRAME_HEIGHT = 96;
export const TERRAIN_ROAD_DETAIL_ATLAS_SRC = "/assets/sprites/generated/road-details.png";
export const TERRAIN_ROAD_DETAIL_FRAME_WIDTH = 96;
export const TERRAIN_ROAD_DETAIL_FRAME_HEIGHT = 64;
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
  atlas: "ground" | "prop";
}

export type TerrainSpriteOrientation = "none" | "northSouth" | "eastWest" | "cornerNorth" | "cornerSouth";

export interface TerrainRoadDetailFrame {
  column: number;
  row: number;
}

export interface TerrainSpriteDrawSpec {
  layer: "ground" | "prop";
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

const defaultGroundSpec: TerrainSpriteDrawSpec = {
  layer: "ground",
  width: TERRAIN_FRAME_WIDTH,
  height: TERRAIN_FRAME_HEIGHT,
  anchorX: TERRAIN_FRAME_WIDTH / 2,
  anchorY: TERRAIN_FRAME_HEIGHT / 2 + 10
};

const terrainDrawSpecs: Partial<Record<TileKind, TerrainSpriteDrawSpec>> = {
  tree: {
    layer: "prop",
    width: 116,
    height: 116,
    anchorX: 58,
    anchorY: 104
  },
  fence: {
    layer: "prop",
    width: 128,
    height: 96,
    anchorX: 64,
    anchorY: 78
  },
  houseWall: {
    layer: "prop",
    width: 128,
    height: 96,
    anchorX: 64,
    anchorY: 82
  },
  house: {
    layer: "prop",
    width: 128,
    height: 96,
    anchorX: 64,
    anchorY: 82
  },
  furniture: {
    layer: "prop",
    width: 96,
    height: 72,
    anchorX: 48,
    anchorY: 60
  },
  car: {
    layer: "prop",
    width: 104,
    height: 72,
    anchorX: 52,
    anchorY: 58
  }
};

const propRows: Partial<Record<TileKind, Partial<Record<TerrainSpriteOrientation, number>>>> = {
  fence: {
    northSouth: 0,
    eastWest: 1,
    cornerNorth: 2,
    cornerSouth: 3,
    none: 0
  },
  houseWall: {
    northSouth: 4,
    eastWest: 5,
    cornerNorth: 6,
    cornerSouth: 7,
    none: 4
  },
  house: {
    northSouth: 4,
    eastWest: 5,
    cornerNorth: 6,
    cornerSouth: 7,
    none: 4
  },
  furniture: {
    none: 8
  },
  tree: {
    none: 9
  },
  car: {
    none: 10
  }
};

export function terrainFrameFor(kind: TileKind, x: number, y: number, map?: GameMap): TerrainFrame {
  const spec = terrainSpriteDrawSpecFor(kind);
  if (spec.layer === "prop") {
    const orientation = terrainSpriteOrientationFor(map, kind, x, y);
    const row = propRows[kind]?.[orientation] ?? propRows[kind]?.none ?? 0;
    return {
      atlas: "prop",
      column: hashVariant(x, y, `${kind}-${orientation}`) % TERRAIN_COLUMNS,
      row
    };
  }
  const rows = terrainRows[kind] ?? terrainRows.grass;
  return {
    atlas: "ground",
    column: hashVariant(x, y, kind) % TERRAIN_COLUMNS,
    row: rows[hashVariant(y, x, kind) % rows.length]
  };
}

export function terrainSpriteDrawSpecFor(kind: TileKind): TerrainSpriteDrawSpec {
  return terrainDrawSpecs[kind] ?? defaultGroundSpec;
}

export function terrainUsesGroundTexture(kind: TileKind): boolean {
  return kind !== "road" && kind !== "crosswalk";
}

export function terrainRoadDetailFrameFor(kind: TileKind, x: number, y: number, map?: GameMap): TerrainRoadDetailFrame | undefined {
  if (kind === "crosswalk") {
    const orientation = roadMarkingOrientationFor(map, x, y);
    return {
      column: hashVariant(x, y, `crosswalk-${orientation}`) % TERRAIN_COLUMNS,
      row: orientation === "northSouth" ? 2 : orientation === "eastWest" ? 1 : 3
    };
  }
  if (kind !== "road") return undefined;
  if (hashVariant(x, y, "road-detail") % 5 !== 0) return undefined;
  return {
    column: hashVariant(x, y, "road-detail") % TERRAIN_COLUMNS,
    row: 0
  };
}

export function terrainSpriteOrientationFor(map: GameMap | undefined, kind: TileKind, x: number, y: number): TerrainSpriteOrientation {
  if (!map || (kind !== "fence" && kind !== "houseWall" && kind !== "house")) return "none";
  const north = sameTerrainFamily(map, kind, x, y - 1);
  const south = sameTerrainFamily(map, kind, x, y + 1);
  const west = sameTerrainFamily(map, kind, x - 1, y);
  const east = sameTerrainFamily(map, kind, x + 1, y);
  if ((north || south) && !(east || west)) return "northSouth";
  if ((east || west) && !(north || south)) return "eastWest";
  if ((north || east) || (west || north)) return "cornerNorth";
  if ((south || east) || (west || south)) return "cornerSouth";
  return "none";
}

function sameTerrainFamily(map: GameMap, kind: TileKind, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  const other = map.tiles[y][x].kind;
  if (kind === "fence") return other === "fence";
  return other === "houseWall" || other === "house";
}

function roadMarkingOrientationFor(map: GameMap | undefined, x: number, y: number): "northSouth" | "eastWest" | "intersection" {
  if (!map) return "eastWest";
  const north = tileKindAt(map, x, y - 1) === "crosswalk";
  const south = tileKindAt(map, x, y + 1) === "crosswalk";
  const west = tileKindAt(map, x - 1, y) === "crosswalk";
  const east = tileKindAt(map, x + 1, y) === "crosswalk";
  if ((north || south) && (east || west)) return "intersection";
  if (north || south) return "northSouth";
  return "eastWest";
}

function tileKindAt(map: GameMap, x: number, y: number): TileKind | undefined {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return undefined;
  return map.tiles[y][x].kind;
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
