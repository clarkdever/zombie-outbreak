import { InputController } from "./InputController";
import { Renderer, type Camera } from "./Renderer";
import { createHud, updateHud } from "./ui";
import { resolveScenarioOptions } from "./presets";
import { Simulation } from "../sim/Simulation";

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly input: InputController;
  private readonly hud: HTMLElement;
  private sim = new Simulation({ humans: 10, dogs: 2, zombies: 3, armedPercent: 25, seed: 42 });
  private readonly camera: Camera = { x: 0, y: 0, zoom: 1 };
  private selectedId: string | undefined;
  private debug = false;
  private speed = 1;
  private lastTime = performance.now();

  constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.className = "game-canvas";
    this.hud = createHud({
      onDebug: (enabled) => (this.debug = enabled),
      onSpeed: (speed) => (this.speed = speed),
      onStart: (preset, overrides) => {
        this.sim = new Simulation(resolveScenarioOptions(preset, overrides, Date.now()));
        this.selectedId = this.sim.entities[0]?.id;
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
    const dt = Math.min(0.1, (time - this.lastTime) / 1000) * this.speed;
    this.lastTime = time;
    const input = this.input.update();
    if (input.clicked) {
      const hit = this.renderer.pickEntity(this.sim.entities, this.camera, input.clicked);
      if (hit) {
        this.selectedId = hit.id;
        this.sim.possess(hit.id);
      }
    }
    if (input.move.x !== 0 || input.move.y !== 0) {
      this.sim.movePossessed(input.move);
    }
    this.camera.x += input.edgeX * 320 * dt;
    this.camera.y += input.edgeY * 320 * dt;
    if (!this.sim.endState) this.sim.tick(dt);
    this.selectedId ??= this.sim.entities[0]?.id;
    this.renderer.render(this.sim.map, this.sim.entities, this.camera, this.selectedId, this.debug);
    updateHud(this.hud, this.sim, this.selectedId);
    requestAnimationFrame((nextTime) => this.frame(nextTime));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}
