import type { GameMap, Tile, TileKind, TilePos } from "./types";

const SIZE = 30;

const tileDefaults: Record<TileKind, Tile> = {
  grass: { kind: "grass", moveCost: 1, blocksMovement: false, blocksSight: false },
  road: { kind: "road", moveCost: 0.75, blocksMovement: false, blocksSight: false },
  crosswalk: { kind: "crosswalk", moveCost: 0.8, blocksMovement: false, blocksSight: false },
  sidewalk: { kind: "sidewalk", moveCost: 0.9, blocksMovement: false, blocksSight: false },
  house: { kind: "house", moveCost: Infinity, blocksMovement: true, blocksSight: true },
  houseFloor: { kind: "houseFloor", moveCost: 1, blocksMovement: false, blocksSight: false },
  carpet: { kind: "carpet", moveCost: 1.05, blocksMovement: false, blocksSight: false },
  houseWall: { kind: "houseWall", moveCost: Infinity, blocksMovement: true, blocksSight: false },
  furniture: { kind: "furniture", moveCost: Infinity, blocksMovement: true, blocksSight: false },
  fence: { kind: "fence", moveCost: Infinity, blocksMovement: true, blocksSight: true },
  tree: { kind: "tree", moveCost: 1.4, blocksMovement: false, blocksSight: true },
  car: { kind: "car", moveCost: Infinity, blocksMovement: true, blocksSight: true },
  yard: { kind: "yard", moveCost: 1.1, blocksMovement: false, blocksSight: false }
};

export function createNeighborhoodMap(): GameMap {
  const tiles = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ ...tileDefaults.grass }))
  );

  paintRect(tiles, "road", 0, 14, SIZE, 4);
  paintRect(tiles, "road", 13, 0, 4, SIZE);
  paintRect(tiles, "sidewalk", 0, 13, SIZE, 1);
  paintRect(tiles, "sidewalk", 0, 18, SIZE, 1);
  paintRect(tiles, "sidewalk", 12, 0, 1, SIZE);
  paintRect(tiles, "sidewalk", 17, 0, 1, SIZE);
  paintRect(tiles, "crosswalk", 13, 14, 4, 1);
  paintRect(tiles, "crosswalk", 13, 17, 4, 1);
  paintRect(tiles, "crosswalk", 13, 14, 1, 4);
  paintRect(tiles, "crosswalk", 16, 14, 1, 4);

  paintHouseLot(tiles, 3, 3);
  paintHouseLot(tiles, 20, 3);
  paintHouseLot(tiles, 3, 21);
  paintHouseLot(tiles, 21, 21);

  paintRect(tiles, "car", 10, 15, 2, 1);
  paintRect(tiles, "car", 19, 16, 2, 1);
  paintRect(tiles, "tree", 8, 7, 1, 1);
  paintRect(tiles, "tree", 24, 10, 1, 1);
  paintRect(tiles, "tree", 7, 24, 1, 1);

  return { width: SIZE, height: SIZE, tiles };
}

function paintHouseLot(tiles: Tile[][], x: number, y: number): void {
  paintRect(tiles, "yard", x - 1, y - 1, 8, 8);
  paintRect(tiles, "fence", x - 1, y - 1, 8, 1);
  paintRect(tiles, "fence", x - 1, y + 6, 8, 1);
  paintRect(tiles, "fence", x - 1, y - 1, 1, 8);
  paintRect(tiles, "fence", x + 6, y - 1, 1, 8);
  paintRect(tiles, "yard", x - 1, y + 1, 1, 1);
  paintRect(tiles, "yard", x + 2, y + 6, 2, 1);
  paintRect(tiles, "houseFloor", x + 1, y + 1, 4, 3);
  paintRect(tiles, "houseWall", x + 1, y + 1, 4, 1);
  paintRect(tiles, "houseWall", x + 1, y + 1, 1, 3);
  paintRect(tiles, "carpet", x + 2, y + 2, 2, 1);
  paintRect(tiles, "furniture", x + 4, y + 2, 1, 1);
}

function paintRect(tiles: Tile[][], kind: TileKind, x: number, y: number, width: number, height: number): void {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
        tiles[row][col] = { ...tileDefaults[kind] };
      }
    }
  }
}

export function wrapTile(map: GameMap, pos: TilePos): TilePos {
  return {
    x: ((pos.x % map.width) + map.width) % map.width,
    y: ((pos.y % map.height) + map.height) % map.height
  };
}

export function getTile(map: GameMap, pos: TilePos): Tile {
  const wrapped = wrapTile(map, pos);
  return map.tiles[wrapped.y][wrapped.x];
}

export function tileBlocksMovement(map: GameMap, pos: TilePos): boolean {
  return getTile(map, pos).blocksMovement;
}

export function tileBlocksSight(map: GameMap, pos: TilePos): boolean {
  return getTile(map, pos).blocksSight;
}
