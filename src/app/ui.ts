import { getEntityInspectRows, stateLabel } from "./entityPresentation";
import type { ScenarioOverrides } from "./presets";
import type { Simulation } from "../sim/Simulation";

interface HudOptions {
  onDebug: (enabled: boolean) => void;
  onSpeed: (speed: number) => void;
  onPlayToggle: () => number;
  onStart: (preset: string, overrides: ScenarioOverrides) => void;
}

export function createHud(options: HudOptions): HTMLElement {
  const hud = document.createElement("div");
  hud.className = "hud hud--setup";
  hud.innerHTML = renderHudMarkup();
  hud.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((button) => {
    button.addEventListener("click", () => options.onSpeed(Number(button.dataset.speed)));
  });
  hud.querySelector<HTMLInputElement>("[data-debug]")?.addEventListener("change", (event) => {
    options.onDebug((event.target as HTMLInputElement).checked);
  });
  hud.querySelector<HTMLButtonElement>("[data-play-toggle]")?.addEventListener("click", () => {
    const speed = options.onPlayToggle();
    updatePlayToggleLabel(hud, speed);
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
    hud.classList.remove("hud--setup");
    hud.classList.add("hud--running");
    options.onStart(preset, overrides);
  });
  return hud;
}

export function renderHudMarkup(): string {
  return `
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
      <div class="inspect-panel" data-inspect-panel hidden></div>
    </div>
    <div class="control-row">
      <button data-play-toggle>Pause</button>
      <button data-speed="1">1x</button>
      <button data-speed="2">2x</button>
      <button data-speed="4">4x</button>
      <label><input type="checkbox" data-debug /> Debug</label>
    </div>
    <div class="control-hint" data-control-hint>
      <strong>Possessing</strong>
      <span>WASD move</span>
      <span>Q/E turn and look</span>
      <span>Space shoot if armed</span>
      <span>Click another entity to switch</span>
      <span>H hide/show OSD</span>
    </div>
    <div class="end-modal" data-end hidden></div>
  `;
}

export function setHudOsdHidden(hud: HTMLElement, hidden: boolean): void {
  hud.classList.toggle("hud--osd-hidden", hidden);
}

export function updateHud(hud: HTMLElement, sim: Simulation, speed: number, selectedId?: string, onRestart?: () => void): void {
  const selected = sim.entities.find((entity) => entity.id === selectedId);
  hud.querySelector("[data-name]")!.textContent = selected?.name ?? "No selection";
  hud.querySelector("[data-affiliation]")!.textContent = selected?.affiliation ?? "";
  hud.querySelector("[data-state]")!.textContent = selected ? `${selected.species} / ${stateLabel(selected)}` : "";
  updateInspectPanel(hud, selected);
  updatePlayToggleLabel(hud, speed);
  hud.classList.toggle("hud--possessing", Boolean(selected?.controlled));
  const end = hud.querySelector<HTMLElement>("[data-end]")!;
  if (sim.endState) {
    const key = endModalRenderKey(sim);
    if (end.dataset.renderKey === key) return;
    end.dataset.renderKey = key;
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
    const restart = document.createElement("button");
    restart.type = "button";
    restart.textContent = "Run another sim";
    restart.addEventListener("click", () => {
      end.hidden = true;
      end.replaceChildren();
      delete end.dataset.renderKey;
      hud.querySelector<HTMLElement>("[data-start]")!.hidden = false;
      hud.classList.add("hud--setup");
      hud.classList.remove("hud--running", "hud--possessing");
      onRestart?.();
    });
    end.append(title, reason, list, histogram, restart);
  } else {
    end.hidden = true;
    end.replaceChildren();
    delete end.dataset.renderKey;
  }
}

export function endModalRenderKey(sim: Simulation): string {
  if (!sim.endState) return "running";
  return [
    sim.endState.winner,
    sim.endState.reason,
    sim.stats.zombiePopulationSamples.length,
    sim.stats.zombiePopulationSamples.at(-1) ?? 0
  ].join("|");
}

function updateInspectPanel(hud: HTMLElement, selected: Simulation["entities"][number] | undefined): void {
  const panel = hud.querySelector<HTMLElement>("[data-inspect-panel]")!;
  panel.hidden = !selected;
  panel.replaceChildren();
  if (!selected) return;
  for (const row of getEntityInspectRows(selected)) {
    const element = document.createElement("div");
    element.className = "inspect-row";
    const label = document.createElement("span");
    label.textContent = row.label;
    const value = document.createElement("strong");
    value.textContent = row.value;
    element.append(label, value);
    panel.append(element);
  }
}

function updatePlayToggleLabel(hud: HTMLElement, speed: number): void {
  const button = hud.querySelector<HTMLButtonElement>("[data-play-toggle]");
  if (button) button.textContent = speed === 0 ? "Play" : "Pause";
}
