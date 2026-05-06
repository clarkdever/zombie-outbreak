import { describe, expect, it } from "vitest";
import { resolveScenarioOptions } from "../../src/app/presets";

describe("scenario presets", () => {
  it("keeps selected preset values when advanced controls are unchanged", () => {
    expect(resolveScenarioOptions("tenderloin", {}, 1)).toMatchObject({
      humans: 16,
      dogs: 2,
      zombies: 8,
      armedPercent: 15
    });
  });

  it("applies only changed advanced overrides", () => {
    expect(resolveScenarioOptions("texas", { zombies: 9 }, 1)).toMatchObject({
      humans: 14,
      dogs: 3,
      zombies: 9,
      armedPercent: 65
    });
  });
});
