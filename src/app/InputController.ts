export interface InputState {
  keys: Set<string>;
  edgeX: number;
  edgeY: number;
  clicked?: { x: number; y: number };
  move: { x: number; y: number };
}

export class InputController {
  private readonly keys = new Set<string>();
  private pointer = { x: 0, y: 0 };
  private clicked: { x: number; y: number } | undefined;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => this.keys.add(event.key.toLowerCase()));
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("mousemove", (event) => {
      this.pointer = { x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener("click", (event) => {
      this.clicked = { x: event.clientX, y: event.clientY };
    });
  }

  update(): InputState {
    const margin = 24;
    const edgeX = this.pointer.x < margin ? -1 : this.pointer.x > this.canvas.width - margin ? 1 : 0;
    const edgeY = this.pointer.y < margin ? -1 : this.pointer.y > this.canvas.height - margin ? 1 : 0;
    const clicked = this.clicked;
    this.clicked = undefined;
    const move = {
      x: (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0),
      y: (this.keys.has("s") ? 1 : 0) - (this.keys.has("w") ? 1 : 0)
    };
    return { keys: new Set(this.keys), edgeX, edgeY, clicked, move };
  }
}
