import type { SimStats } from "./types";

export function createStats(): SimStats {
  return {
    elapsedSeconds: 0,
    zombiesKilled: 0,
    humansTurned: 0,
    humansTurnedPending: 0,
    dogsTurned: 0,
    skeletonsCreated: 0,
    zombiePopulationSamples: []
  };
}
