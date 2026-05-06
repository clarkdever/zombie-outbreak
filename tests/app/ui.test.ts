import { describe, expect, it } from "vitest";
import { endModalRenderKey } from "../../src/app/ui";
import type { Simulation } from "../../src/sim/Simulation";

describe("hud helpers", () => {
  it("keeps the end modal render key stable while the same finished simulation is displayed", () => {
    const sim = {
      endState: { winner: "humans", reason: "All zombies were killed." },
      stats: { zombiePopulationSamples: [1, 2, 1] }
    } as Simulation;

    expect(endModalRenderKey(sim)).toBe(endModalRenderKey(sim));
  });
});
