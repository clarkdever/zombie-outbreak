import { describe, expect, it } from "vitest";
import { endModalRenderKey, renderHudMarkup, setHudOsdHidden } from "../../src/app/ui";
import type { Simulation } from "../../src/sim/Simulation";

describe("hud helpers", () => {
  it("keeps the end modal render key stable while the same finished simulation is displayed", () => {
    const sim = {
      endState: { winner: "humans", reason: "All zombies were killed." },
      stats: { zombiePopulationSamples: [1, 2, 1] }
    } as Simulation;

    expect(endModalRenderKey(sim)).toBe(endModalRenderKey(sim));
  });

  it("does not render the old entity color key", () => {
    expect(renderHudMarkup()).not.toContain("legend");
    expect(renderHudMarkup()).not.toContain("Entity key");
  });

  it("renders a keyboard hint for hiding and showing the OSD", () => {
    expect(renderHudMarkup()).toContain("H hide/show OSD");
  });

  it("toggles the OSD hidden class", () => {
    const classes = new Set<string>();
    const hud = {
      classList: {
        toggle: (className: string, enabled: boolean) => enabled ? classes.add(className) : classes.delete(className)
      }
    } as HTMLElement;

    setHudOsdHidden(hud, true);

    expect(classes.has("hud--osd-hidden")).toBe(true);

    setHudOsdHidden(hud, false);

    expect(classes.has("hud--osd-hidden")).toBe(false);
  });
});
