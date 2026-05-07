import { InputController } from "./InputController";
import { Renderer, type Camera } from "./Renderer";
import { createHud, setHudOsdHidden, updateHud } from "./ui";
import { resolveScenarioOptions } from "./presets";
import { VisualPositionStore } from "./visualPositions";
import { Simulation } from "../sim/Simulation";

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly input: InputController;
  private readonly hud: HTMLElement;
  private sim = new Simulation({ humans: 10, dogs: 2, zombies: 3, armedPercent: 25, seed: 42 });
  private readonly camera: Camera = { x: 0, y: 0, zoom: 1 };
  private visualPositions = new VisualPositionStore();
  private selectedId: string | undefined;
  private debug = false;
  private speed = 1;
  private lastNonZeroSpeed = 1;
  private osdHidden = false;
  private lastTime = performance.now();
  private controlledMoveAccumulator = 0.18;

  constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.className = "game-canvas";
    this.hud = createHud({
      onDebug: (enabled) => (this.debug = enabled),
      onSpeed: (speed) => {
        this.speed = speed;
        if (speed > 0) this.lastNonZeroSpeed = speed;
      },
      onPlayToggle: () => {
        this.speed = this.speed === 0 ? this.lastNonZeroSpeed : 0;
        return this.speed;
      },
      onStart: (preset, overrides) => {
        this.startSimulation(preset, overrides);
      }
    });
    this.root.append(this.canvas, this.hud);
    this.renderer = new Renderer(this.canvas);
    this.input = new InputController(this.canvas);
  }

  start(): void {
    this.resize();
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame((time) => this.frame(time));
  }

  private frame(time: number): void {
    const realDt = Math.min(0.1, (time - this.lastTime) / 1000);
    const simDt = realDt * this.speed;
    this.lastTime = time;
    const input = this.input.update();
    if (input.toggleOsd) {
      this.osdHidden = !this.osdHidden;
      setHudOsdHidden(this.hud, this.osdHidden);
    }
    if (input.turn !== 0) {
      this.sim.turnPossessed(input.turn * 2.5 * realDt);
    }
    if (input.shoot) {
      this.sim.shootPossessed();
    }
    if (input.move.x !== 0 || input.move.y !== 0) {
      this.controlledMoveAccumulator += realDt;
    } else {
      this.controlledMoveAccumulator = 0.18;
    }
    if ((input.move.x !== 0 || input.move.y !== 0) && this.controlledMoveAccumulator >= 0.18) {
      this.sim.movePossessed(input.move);
      this.controlledMoveAccumulator = 0;
    }
    this.camera.x += input.edgeX * 320 * realDt;
    this.camera.y += input.edgeY * 320 * realDt;
    if (!this.sim.endState) this.sim.tick(simDt);
    const visualEntities = this.visualPositions.update(this.sim.entities, realDt);
    if (input.clicked) {
      const hit = this.renderer.pickEntity(visualEntities, this.camera, input.clicked);
      if (hit) {
        this.selectedId = hit.id;
        this.sim.possess(hit.id);
        this.hud.classList.add("hud--possessing");
      }
    }
    this.selectedId ??= this.sim.entities[0]?.id;
    this.renderer.render(this.sim.map, visualEntities, this.sim.bullets, this.camera, this.selectedId, this.debug, time / 1000);
    updateHud(this.hud, this.sim, this.speed, this.selectedId, () => this.resetToSetup());
    requestAnimationFrame((nextTime) => this.frame(nextTime));
  }

  private startSimulation(preset: string, overrides: Parameters<typeof resolveScenarioOptions>[1]): void {
    this.sim = new Simulation(resolveScenarioOptions(preset, overrides, Date.now()));
    this.visualPositions = new VisualPositionStore();
    this.selectedId = this.sim.entities[0]?.id;
    this.speed = this.lastNonZeroSpeed;
  }

  private resetToSetup(): void {
    this.sim = new Simulation({ humans: 10, dogs: 2, zombies: 3, armedPercent: 25, seed: Date.now() });
    this.visualPositions = new VisualPositionStore();
    this.selectedId = undefined;
    this.speed = 0;
    this.controlledMoveAccumulator = 0.18;
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}
