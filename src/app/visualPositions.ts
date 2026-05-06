import type { TilePos } from "../sim/types";

type TileEntity = {
  id: string;
  tile: TilePos;
};

export type VisualEntity<T extends TileEntity> = T & {
  renderTile: TilePos;
};

const SNAP_DISTANCE = 0.01;
const MAX_INTERPOLATED_TILE_DISTANCE = 1.5;

export function interpolateTilePosition(from: TilePos, to: TilePos, progress: number): TilePos {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return {
    x: from.x + (to.x - from.x) * clampedProgress,
    y: from.y + (to.y - from.y) * clampedProgress
  };
}

export class VisualPositionStore {
  private readonly positions = new Map<string, TilePos>();

  constructor(private readonly tilesPerSecond = 8) {}

  update<T extends TileEntity>(entities: readonly T[], dtSeconds: number): Array<VisualEntity<T>> {
    const seenIds = new Set<string>();
    const progress = this.tilesPerSecond * Math.max(0, dtSeconds);

    const visualEntities = entities.map((entity) => {
      seenIds.add(entity.id);
      const previous = this.positions.get(entity.id) ?? entity.tile;
      const next = interpolateTilePosition(previous, entity.tile, progress);
      const renderTile =
        distance(previous, entity.tile) > MAX_INTERPOLATED_TILE_DISTANCE || distance(next, entity.tile) <= SNAP_DISTANCE
          ? { ...entity.tile }
          : next;

      this.positions.set(entity.id, renderTile);

      return {
        ...entity,
        renderTile
      };
    });

    for (const id of this.positions.keys()) {
      if (!seenIds.has(id)) this.positions.delete(id);
    }

    return visualEntities;
  }
}

function distance(a: TilePos, b: TilePos): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
