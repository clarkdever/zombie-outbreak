import type { ScenarioOverrides } from "./presets";
import type { Simulation } from "../sim/Simulation";

interface HudOptions {
  onDebug: (enabled: boolean) => void;
  onSpeed: (speed: number) => void;
  onStart: (preset: string, overrides: ScenarioOverrides) => void;
}

export function createHud(options: HudOptions): HTMLElement {
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="start-modal" data-start>
      <h1>Zombie Outbreak</h1>
      <select data-preset>
        <option value="dawn">Dawn of the Dead</option>
        <option value="texas">Don't Mess with Texas</option>
        <option value="tenderloin">The Tenderloin</option>
      </select>
      <details>
        <summary>Advanced</summary>
        <label>Humans <input data-advanced="humans" type="number" min="1" max="30" value="12" /></label>
        <label>Dogs <input data-advanced="dogs" type="number" min="0" max="10" value="2" /></label>
        <label>Zombies <input data-advanced="zombies" type="number" min="0" max="30" value="3" /></label>
        <label>Armed % <input data-advanced="armedPercent" type="number" min="0" max="100" value="25" /></label>
      </details>
      <button data-start-button>Start</button>
    </div>
    <div class="title-block">
      <strong data-name>Zombie Outbreak</strong>
      <span data-affiliation>Preparing simulation</span>
      <span data-state></span>
    </div>
    <div class="control-row">
      <button data-speed="0">Pause</button>
      <button data-speed="1">1x</button>
      <button data-speed="2">2x</button>
      <button data-speed="4">4x</button>
      <label><input type="checkbox" data-debug /> Debug</label>
    </div>
    <div class="end-modal" data-end hidden></div>
  `;
  hud.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((button) => {
    button.addEventListener("click", () => options.onSpeed(Number(button.dataset.speed)));
  });
  hud.querySelector<HTMLInputElement>("[data-debug]")?.addEventListener("change", (event) => {
    options.onDebug((event.target as HTMLInputElement).checked);
  });
  const changedAdvanced = new Set<string>();
  hud.querySelectorAll<HTMLInputElement>("[data-advanced]").forEach((input) => {
    input.addEventListener("change", () => {
      changedAdvanced.add(input.dataset.advanced!);
    });
  });
  hud.querySelector<HTMLButtonElement>("[data-start-button]")?.addEventListener("click", () => {
    const preset = hud.querySelector<HTMLSelectElement>("[data-preset]")?.value ?? "dawn";
    const overrides = Object.fromEntries(
      [...hud.querySelectorAll<HTMLInputElement>("[data-advanced]")]
        .filter((input) => changedAdvanced.has(input.dataset.advanced!))
        .map((input) => [input.dataset.advanced!, Number(input.value)])
    ) as ScenarioOverrides;
    hud.querySelector<HTMLElement>("[data-start]")!.hidden = true;
    options.onStart(preset, overrides);
  });
  return hud;
}

export function updateHud(hud: HTMLElement, sim: Simulation, selectedId?: string): void {
  const selected = sim.entities.find((entity) => entity.id === selectedId);
  hud.querySelector("[data-name]")!.textContent = selected?.name ?? "No selection";
  hud.querySelector("[data-affiliation]")!.textContent = selected?.affiliation ?? "";
  hud.querySelector("[data-state]")!.textContent = selected ? `${selected.species} / ${selected.state}` : "";
  const end = hud.querySelector<HTMLElement>("[data-end]")!;
  if (sim.endState) {
    const max = Math.max(1, ...sim.stats.zombiePopulationSamples);
    end.hidden = false;
    end.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = `${sim.endState.winner.toUpperCase()} WIN`;
    const reason = document.createElement("p");
    reason.textContent = sim.endState.reason;
    const list = document.createElement("ul");
    for (const fact of sim.getEndFacts()) {
      const item = document.createElement("li");
      const label = document.createElement("strong");
      const value = document.createElement("span");
      label.textContent = fact.label;
      value.textContent = fact.value;
      item.append(label, value);
      list.append(item);
    }
    const histogram = document.createElement("div");
    histogram.className = "histogram";
    for (const sample of sim.stats.zombiePopulationSamples) {
      const bar = document.createElement("i");
      bar.style.height = `${Math.max(4, (sample / max) * 80)}px`;
      histogram.append(bar);
    }
    end.append(title, reason, list, histogram);
  }
}
