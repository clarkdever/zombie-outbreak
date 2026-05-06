import type { SimulationOptions } from "../sim/Simulation";

export type ScenarioPreset = "dawn" | "texas" | "tenderloin";
export type ScenarioOverrides = Partial<Pick<SimulationOptions, "humans" | "dogs" | "zombies" | "armedPercent">>;

const presets: Record<ScenarioPreset, SimulationOptions> = {
  dawn: { humans: 12, dogs: 2, zombies: 2, armedPercent: 20, seed: 1 },
  texas: { humans: 14, dogs: 3, zombies: 3, armedPercent: 65, seed: 1 },
  tenderloin: { humans: 16, dogs: 2, zombies: 8, armedPercent: 15, seed: 1 }
};

export function resolveScenarioOptions(preset: string, overrides: ScenarioOverrides, seed: number): SimulationOptions {
  const base = presets[preset as ScenarioPreset] ?? presets.dawn;
  return { ...base, ...overrides, seed };
}
