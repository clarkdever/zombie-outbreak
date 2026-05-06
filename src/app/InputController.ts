export interface InputState {
  keys: Set<string>;
  edgeX: number;
  edgeY: number;
  clicked?: { x: number; y: number };
  move: { x: number; y: number };
  turn: number;
  shoot: boolean;
}

export class InputController {
  private readonly keys = new Set<string>();
  private shootQueued = false;
  private clicked: { x: number; y: number } | undefined;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
      if (event.key.startsWith("Arrow")) event.preventDefault();
    });
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") this.shootQueued = true;
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    canvas.addEventListener("click", (event) => {
      this.clicked = { x: event.clientX, y: event.clientY };
    });
  }

  update(): InputState {
    const camera = keyboardCameraVector(this.keys);
    const clicked = this.clicked;
    this.clicked = undefined;
    const move = {
      x: (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0),
      y: (this.keys.has("s") ? 1 : 0) - (this.keys.has("w") ? 1 : 0)
    };
    const turn = (this.keys.has("e") ? 1 : 0) - (this.keys.has("q") ? 1 : 0);
    const shoot = this.shootQueued;
    this.shootQueued = false;
    return { keys: new Set(this.keys), edgeX: camera.x, edgeY: camera.y, clicked, move, turn, shoot };
  }
}

export function keyboardCameraVector(keys: ReadonlySet<string>): { x: number; y: number } {
  return {
    x: (keys.has("arrowright") ? 1 : 0) - (keys.has("arrowleft") ? 1 : 0),
    y: (keys.has("arrowdown") ? 1 : 0) - (keys.has("arrowup") ? 1 : 0)
  };
}
