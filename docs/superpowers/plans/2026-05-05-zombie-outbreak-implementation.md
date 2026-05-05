# Zombie Outbreak MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable graybox web simulation of a small-town zombie outbreak with perception, noise, infection, feeding, grouping, dogs, possession, time controls, and end-run stats.

**Architecture:** Use a dependency-light TypeScript app with Canvas 2D rendering. Keep simulation logic pure and testable in `src/sim/*`, while `src/app/*` handles input, rendering, UI, and the game loop. Build the MVP in vertical increments that always leave a runnable browser app.

**Tech Stack:** TypeScript, Vite, Vitest, Canvas 2D, DOM UI, no gameplay libraries for the MVP.

---

## File Structure

- `package.json`: scripts for dev, build, test, and preview.
- `tsconfig.json`: TypeScript compiler settings.
- `index.html`: app mount point.
- `src/main.ts`: app bootstrap.
- `src/app/App.ts`: owns lifecycle, simulation instance, renderer, UI, input, and game loop.
- `src/app/InputController.ts`: keyboard, mouse, selection, edge-scroll, and possession input.
- `src/app/Renderer.ts`: Canvas 2D isometric graybox rendering and overlays.
- `src/app/ui.ts`: start modal, HUD, debug toggles, time controls, and end modal.
- `src/sim/types.ts`: shared enums, interfaces, constants, and stat types.
- `src/sim/random.ts`: deterministic seeded random helper.
- `src/sim/map.ts`: handcrafted 30x30 map, tile metadata, wrapping, collision, line-of-sight blockers, and path helpers.
- `src/sim/names.ts`: curated character names and group-name templates.
- `src/sim/entities.ts`: entity creation, derived labels, species defaults, and state helpers.
- `src/sim/perception.ts`: hearing radius, vision cone, line of sight, stimulus memory, and noise matching.
- `src/sim/groups.ts`: human group creation, warning, loose flocking, armed leadership, and dog affiliation helpers.
- `src/sim/combat.ts`: gunfire, bites, HP, infection decline, feeding hunger caps, meat depletion, turning, skeletonization.
- `src/sim/ai.ts`: autonomous behavior state transitions and movement intent.
- `src/sim/stats.ts`: counters and end-modal fact tracking.
- `src/sim/Simulation.ts`: main tick orchestration and public simulation API.
- `tests/sim/*.test.ts`: deterministic unit tests for core rules.

## Milestone 1: Project Shell

### Task 1: Scaffold The TypeScript Web App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/app/App.ts`
- Create: `src/app/ui.ts`
- Create: `src/app/Renderer.ts`
- Create: `src/app/InputController.ts`

- [ ] **Step 1: Add package metadata and scripts**

Create `package.json`:

```json
{
  "name": "zombie-outbreak",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Add TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Add the HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zombie Outbreak</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: Add the minimal app bootstrap**

Create `src/main.ts`:

```ts
import { App } from "./app/App";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root element");
}

const app = new App(root);
app.start();
```

- [ ] **Step 5: Add minimal app shell classes**

Create `src/app/App.ts`:

```ts
import { createHud } from "./ui";
import { Renderer } from "./Renderer";
import { InputController } from "./InputController";

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly input: InputController;
  private readonly hud: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.className = "game-canvas";
    this.hud = createHud();
    this.root.append(this.canvas, this.hud);
    this.renderer = new Renderer(this.canvas);
    this.input = new InputController(this.canvas);
  }

  start(): void {
    this.resize();
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame(() => this.frame());
  }

  private frame(): void {
    this.input.update();
    this.renderer.renderPlaceholder();
    requestAnimationFrame(() => this.frame());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}
```

Create `src/app/ui.ts`:

```ts
export function createHud(): HTMLElement {
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="title-block">
      <strong>Zombie Outbreak</strong>
      <span>Graybox simulation shell</span>
    </div>
  `;
  return hud;
}
```

Create `src/app/Renderer.ts`:

```ts
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }
    this.ctx = ctx;
  }

  renderPlaceholder(): void {
    this.ctx.fillStyle = "#151815";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#e8e2bc";
    this.ctx.font = "20px system-ui";
    this.ctx.fillText("Zombie Outbreak MVP", 24, 42);
  }
}
```

Create `src/app/InputController.ts`:

```ts
export class InputController {
  private readonly keys = new Set<string>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => this.keys.add(event.key.toLowerCase()));
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
  }

  update(): void {
    this.canvas.dataset.input = [...this.keys].sort().join(",");
  }
}
```

- [ ] **Step 6: Add base styles**

Create `src/styles.css`:

```css
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #151815;
  color: #f1f4ea;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.game-canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}

.hud {
  position: fixed;
  inset: 16px auto auto 16px;
  pointer-events: none;
}

.title-block {
  display: grid;
  gap: 4px;
  min-width: 220px;
  padding: 12px 14px;
  border: 1px solid rgba(241, 244, 234, 0.22);
  border-radius: 8px;
  background: rgba(18, 22, 18, 0.82);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
}

.title-block span {
  color: #b9c0b0;
  font-size: 13px;
}
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created. If network is blocked, request network permission and rerun exactly once.

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 9: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json index.html src
git commit -m "feat: scaffold zombie outbreak web app"
```

## Milestone 2: Pure Simulation Foundation

### Task 2: Add Core Types, Randomness, Map, And Wrapping

**Files:**
- Create: `src/sim/types.ts`
- Create: `src/sim/random.ts`
- Create: `src/sim/map.ts`
- Test: `tests/sim/map.test.ts`

- [ ] **Step 1: Write map tests**

Create `tests/sim/map.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createNeighborhoodMap, tileBlocksSight, tileBlocksMovement, wrapTile } from "../../src/sim/map";

describe("map wrapping and tile metadata", () => {
  it("wraps coordinates across all four edges", () => {
    const map = createNeighborhoodMap();
    expect(wrapTile(map, { x: -1, y: 10 })).toEqual({ x: 29, y: 10 });
    expect(wrapTile(map, { x: 30, y: 10 })).toEqual({ x: 0, y: 10 });
    expect(wrapTile(map, { x: 7, y: -1 })).toEqual({ x: 7, y: 29 });
    expect(wrapTile(map, { x: 7, y: 30 })).toEqual({ x: 7, y: 0 });
  });

  it("marks houses as blocking movement and sight", () => {
    const map = createNeighborhoodMap();
    expect(tileBlocksMovement(map, { x: 4, y: 4 })).toBe(true);
    expect(tileBlocksSight(map, { x: 4, y: 4 })).toBe(true);
  });

  it("marks roads as faster non-blocking tiles", () => {
    const map = createNeighborhoodMap();
    const road = map.tiles[15][4];
    expect(road.kind).toBe("road");
    expect(road.moveCost).toBeLessThan(1);
    expect(tileBlocksMovement(map, { x: 4, y: 15 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/sim/map.test.ts`

Expected: FAIL because `src/sim/map.ts` does not exist.

- [ ] **Step 3: Add shared simulation types**

Create `src/sim/types.ts`:

```ts
export type Species = "human" | "dog" | "zombieHuman" | "zombieDog";
export type TileKind = "grass" | "road" | "sidewalk" | "house" | "fence" | "tree" | "car" | "yard";
export type EntityState =
  | "calm"
  | "alerted"
  | "investigating"
  | "fleeing"
  | "attacking"
  | "infected"
  | "downed"
  | "turning"
  | "feeding"
  | "stuck";

export interface TilePos {
  x: number;
  y: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Tile {
  kind: TileKind;
  moveCost: number;
  blocksMovement: boolean;
  blocksSight: boolean;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Tile[][];
}
```

Create `src/sim/random.ts`:

```ts
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
}
```

- [ ] **Step 4: Add handcrafted map helpers**

Create `src/sim/map.ts`:

```ts
import type { GameMap, Tile, TileKind, TilePos } from "./types";

const SIZE = 30;

const tileDefaults: Record<TileKind, Tile> = {
  grass: { kind: "grass", moveCost: 1, blocksMovement: false, blocksSight: false },
  road: { kind: "road", moveCost: 0.75, blocksMovement: false, blocksSight: false },
  sidewalk: { kind: "sidewalk", moveCost: 0.9, blocksMovement: false, blocksSight: false },
  house: { kind: "house", moveCost: Infinity, blocksMovement: true, blocksSight: true },
  fence: { kind: "fence", moveCost: Infinity, blocksMovement: true, blocksSight: true },
  tree: { kind: "tree", moveCost: 1.4, blocksMovement: false, blocksSight: true },
  car: { kind: "car", moveCost: Infinity, blocksMovement: true, blocksSight: true },
  yard: { kind: "yard", moveCost: 1.1, blocksMovement: false, blocksSight: false }
};

export function createNeighborhoodMap(): GameMap {
  const tiles = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ ...tileDefaults.grass }))
  );

  paintRect(tiles, "road", 0, 14, SIZE, 4);
  paintRect(tiles, "road", 13, 0, 4, SIZE);
  paintRect(tiles, "sidewalk", 0, 13, SIZE, 1);
  paintRect(tiles, "sidewalk", 0, 18, SIZE, 1);
  paintRect(tiles, "sidewalk", 12, 0, 1, SIZE);
  paintRect(tiles, "sidewalk", 17, 0, 1, SIZE);

  paintHouseLot(tiles, 3, 3);
  paintHouseLot(tiles, 20, 3);
  paintHouseLot(tiles, 3, 21);
  paintHouseLot(tiles, 21, 21);

  paintRect(tiles, "car", 10, 15, 2, 1);
  paintRect(tiles, "car", 19, 16, 2, 1);
  paintRect(tiles, "tree", 8, 7, 1, 1);
  paintRect(tiles, "tree", 24, 10, 1, 1);
  paintRect(tiles, "tree", 7, 24, 1, 1);

  return { width: SIZE, height: SIZE, tiles };
}

function paintHouseLot(tiles: Tile[][], x: number, y: number): void {
  paintRect(tiles, "yard", x - 1, y - 1, 8, 8);
  paintRect(tiles, "fence", x - 1, y - 1, 8, 1);
  paintRect(tiles, "fence", x - 1, y + 6, 8, 1);
  paintRect(tiles, "fence", x - 1, y - 1, 1, 8);
  paintRect(tiles, "fence", x + 6, y - 1, 1, 8);
  paintRect(tiles, "yard", x + 2, y + 6, 2, 1);
  paintRect(tiles, "house", x + 1, y + 1, 4, 3);
}

function paintRect(tiles: Tile[][], kind: TileKind, x: number, y: number, width: number, height: number): void {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
        tiles[row][col] = { ...tileDefaults[kind] };
      }
    }
  }
}

export function wrapTile(map: GameMap, pos: TilePos): TilePos {
  return {
    x: ((pos.x % map.width) + map.width) % map.width,
    y: ((pos.y % map.height) + map.height) % map.height
  };
}

export function getTile(map: GameMap, pos: TilePos): Tile {
  const wrapped = wrapTile(map, pos);
  return map.tiles[wrapped.y][wrapped.x];
}

export function tileBlocksMovement(map: GameMap, pos: TilePos): boolean {
  return getTile(map, pos).blocksMovement;
}

export function tileBlocksSight(map: GameMap, pos: TilePos): boolean {
  return getTile(map, pos).blocksSight;
}
```

- [ ] **Step 5: Run the test**

Run: `npm test -- tests/sim/map.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/sim tests/sim
git commit -m "feat: add neighborhood map foundation"
```

### Task 3: Add Entities, Names, And Start Presets

**Files:**
- Create: `src/sim/names.ts`
- Create: `src/sim/entities.ts`
- Modify: `src/sim/types.ts`
- Test: `tests/sim/entities.test.ts`

- [ ] **Step 1: Write entity tests**

Create `tests/sim/entities.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialWorld } from "../../src/sim/entities";
import { Random } from "../../src/sim/random";

describe("entity creation", () => {
  it("creates named humans, dogs, and zombies from counts", () => {
    const world = createInitialWorld({
      humans: 6,
      dogs: 2,
      zombies: 3,
      armedPercent: 50,
      seed: 7
    });

    expect(world.entities.filter((entity) => entity.species === "human")).toHaveLength(6);
    expect(world.entities.filter((entity) => entity.species === "dog")).toHaveLength(2);
    expect(world.entities.filter((entity) => entity.species === "zombieHuman")).toHaveLength(3);
    expect(world.entities.every((entity) => entity.name.length > 0)).toBe(true);
  });

  it("uses owner names as dog affiliation labels", () => {
    const world = createInitialWorld({
      humans: 2,
      dogs: 1,
      zombies: 0,
      armedPercent: 0,
      seed: 12
    });
    const dog = world.entities.find((entity) => entity.species === "dog");
    const owner = world.entities.find((entity) => entity.id === dog?.ownerId);

    expect(dog?.affiliation).toBe(owner?.name);
  });

  it("generates deterministic group names", () => {
    const a = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 0, seed: 99 });
    const b = createInitialWorld({ humans: 2, dogs: 0, zombies: 0, armedPercent: 0, seed: 99 });
    expect(a.groups[0].name).toBe(b.groups[0].name);
    expect(new Random(1).pick(["x"])).toBe("x");
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/sim/entities.test.ts`

Expected: FAIL because entity helpers do not exist.

- [ ] **Step 3: Extend shared types**

Modify `src/sim/types.ts` to add:

```ts
export interface Entity {
  id: string;
  name: string;
  affiliation: string;
  species: Species;
  state: EntityState;
  tile: TilePos;
  facing: number;
  speed: number;
  hp: number;
  maxHp: number;
  armed: boolean;
  infected: boolean;
  infectionSeconds: number;
  turnSeconds: number;
  meat: number;
  originalMeat: number;
  ownerId?: string;
  groupId?: string;
  controlled: boolean;
  alive: boolean;
  skeleton: boolean;
  seenZombie: boolean;
  stimulusMemorySeconds: number;
  targetTile?: TilePos;
  meatEatenByBody: Record<string, number>;
  totalMeatEaten: number;
  humansAlerted: number;
  zombieDamageDealt: number;
  zombieKills: number;
  lifetimeSeconds: number;
}

export interface HumanGroup {
  id: string;
  name: string;
  color: string;
  leaderId?: string;
  memberIds: string[];
}

export interface WorldState {
  entities: Entity[];
  groups: HumanGroup[];
}
```

- [ ] **Step 4: Add deterministic names**

Create `src/sim/names.ts`:

```ts
import { Random } from "./random";

const humanNames = ["Mara", "Luis", "Tasha", "Glen", "Nina", "Owen", "Iris", "Cal", "June", "Vic"];
const dogNames = ["Biscuit", "Radar", "Pickles", "Tank", "Mabel", "Ruckus"];
const adjectives = ["Last", "Nervous", "Canned", "Brave", "Suspicious", "Lucky"];
const nouns = ["Porchlights", "Cul-de-sac Saints", "Bean Brigade", "Lawnchair Guild", "Mailbox Watch"];
const streets = ["Maple", "Juniper", "Ash", "Clover", "Sycamore"];

export function humanName(index: number): string {
  return humanNames[index % humanNames.length] + (index >= humanNames.length ? ` ${Math.floor(index / humanNames.length) + 1}` : "");
}

export function dogName(index: number): string {
  return dogNames[index % dogNames.length] + (index >= dogNames.length ? ` ${Math.floor(index / dogNames.length) + 1}` : "");
}

export function groupName(random: Random): string {
  const style = random.int(3);
  if (style === 0) return `The ${random.pick(adjectives)} ${random.pick(nouns)}`;
  if (style === 1) return `${random.pick(streets)} Watch`;
  return `The Last ${random.pick(nouns)}`;
}
```

- [ ] **Step 5: Add entity factory**

Create `src/sim/entities.ts`:

```ts
import { createNeighborhoodMap, tileBlocksMovement } from "./map";
import { dogName, groupName, humanName } from "./names";
import { Random } from "./random";
import type { Entity, HumanGroup, Species, TilePos, WorldState } from "./types";

interface InitialWorldOptions {
  humans: number;
  dogs: number;
  zombies: number;
  armedPercent: number;
  seed: number;
}

const groupColors = ["#e95d4f", "#62b6cb", "#f2cc8f", "#81b29a", "#c77dff", "#f28482"];

export function createInitialWorld(options: InitialWorldOptions): WorldState {
  const random = new Random(options.seed);
  const map = createNeighborhoodMap();
  const entities: Entity[] = [];
  const groups: HumanGroup[] = [{
    id: "group-1",
    name: groupName(random),
    color: groupColors[0],
    memberIds: []
  }];

  for (let index = 0; index < options.humans; index += 1) {
    const human = createEntity({
      id: `human-${index + 1}`,
      name: humanName(index),
      affiliation: groups[0].name,
      species: "human",
      tile: randomOpenTile(map, random),
      armed: random.next() * 100 < options.armedPercent,
      groupId: groups[0].id
    });
    groups[0].memberIds.push(human.id);
    entities.push(human);
  }

  for (let index = 0; index < options.dogs; index += 1) {
    const owner = entities[index % Math.max(1, entities.length)];
    entities.push(createEntity({
      id: `dog-${index + 1}`,
      name: dogName(index),
      affiliation: owner?.name ?? "No One",
      species: "dog",
      tile: randomOpenTile(map, random),
      ownerId: owner?.id
    }));
  }

  for (let index = 0; index < options.zombies; index += 1) {
    const former = humanName(options.humans + index);
    entities.push(createEntity({
      id: `zombie-${index + 1}`,
      name: `Undead ${former}`,
      affiliation: "The Horde",
      species: "zombieHuman",
      tile: randomOpenTile(map, random)
    }));
  }

  const firstArmed = entities.find((entity) => entity.species === "human" && entity.armed);
  groups[0].leaderId = firstArmed?.id ?? groups[0].memberIds[0];

  return { entities, groups };
}

function createEntity(input: {
  id: string;
  name: string;
  affiliation: string;
  species: Species;
  tile: TilePos;
  armed?: boolean;
  groupId?: string;
  ownerId?: string;
}): Entity {
  const dog = input.species === "dog" || input.species === "zombieDog";
  const zombie = input.species === "zombieHuman" || input.species === "zombieDog";
  const maxHp = dog ? 60 : zombie ? 120 : 100;
  return {
    id: input.id,
    name: input.name,
    affiliation: input.affiliation,
    species: input.species,
    state: zombie ? "investigating" : "calm",
    tile: input.tile,
    facing: 0,
    speed: dog ? 1.25 : zombie ? 0.7 : 1,
    hp: maxHp,
    maxHp,
    armed: input.armed ?? false,
    infected: zombie,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: dog ? 60 : 100,
    originalMeat: dog ? 60 : 100,
    ownerId: input.ownerId,
    groupId: input.groupId,
    controlled: false,
    alive: !zombie,
    skeleton: false,
    seenZombie: zombie,
    stimulusMemorySeconds: 0,
    meatEatenByBody: {},
    totalMeatEaten: 0,
    humansAlerted: 0,
    zombieDamageDealt: 0,
    zombieKills: 0,
    lifetimeSeconds: 0
  };
}

function randomOpenTile(map: ReturnType<typeof createNeighborhoodMap>, random: Random): TilePos {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const tile = { x: random.int(map.width), y: random.int(map.height) };
    if (!tileBlocksMovement(map, tile)) return tile;
  }
  return { x: 1, y: 1 };
}
```

- [ ] **Step 6: Run the entity test**

Run: `npm test -- tests/sim/entities.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/sim tests/sim/entities.test.ts
git commit -m "feat: create initial outbreak entities"
```

## Milestone 3: Perception And Noise

### Task 4: Add Vision Cones, Hearing Circles, And Noise Events

**Files:**
- Create: `src/sim/perception.ts`
- Modify: `src/sim/types.ts`
- Test: `tests/sim/perception.test.ts`

- [ ] **Step 1: Write perception tests**

Create `tests/sim/perception.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createNeighborhoodMap } from "../../src/sim/map";
import { canHear, canSee, createNoise } from "../../src/sim/perception";
import type { Entity } from "../../src/sim/types";

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: "e",
    name: "Entity",
    affiliation: "Test",
    species: "human",
    state: "calm",
    tile: { x: 10, y: 10 },
    facing: 0,
    speed: 1,
    hp: 100,
    maxHp: 100,
    armed: false,
    infected: false,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: 100,
    originalMeat: 100,
    controlled: false,
    alive: true,
    skeleton: false,
    seenZombie: false,
    stimulusMemorySeconds: 0,
    meatEatenByBody: {},
    totalMeatEaten: 0,
    humansAlerted: 0,
    zombieDamageDealt: 0,
    zombieKills: 0,
    lifetimeSeconds: 0,
    ...overrides
  };
}

describe("perception", () => {
  it("uses circular hearing radius", () => {
    const listener = entity({ tile: { x: 10, y: 10 }, species: "human" });
    expect(canHear(listener, createNoise("bark", { x: 15, y: 10 }, 6))).toBe(true);
    expect(canHear(listener, createNoise("growl", { x: 17, y: 10 }, 4))).toBe(false);
  });

  it("gives dogs wider hearing than humans", () => {
    const dog = entity({ species: "dog", tile: { x: 10, y: 10 } });
    const human = entity({ species: "human", tile: { x: 10, y: 10 } });
    const noise = createNoise("growl", { x: 16, y: 10 }, 4);
    expect(canHear(dog, noise)).toBe(true);
    expect(canHear(human, noise)).toBe(false);
  });

  it("uses directional vision cones and blockers", () => {
    const map = createNeighborhoodMap();
    const viewer = entity({ tile: { x: 1, y: 4 }, facing: 0 });
    expect(canSee(map, viewer, { x: 3, y: 4 })).toBe(true);
    expect(canSee(map, viewer, { x: 1, y: 8 })).toBe(false);
    expect(canSee(map, viewer, { x: 5, y: 4 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing perception test**

Run: `npm test -- tests/sim/perception.test.ts`

Expected: FAIL because perception helpers do not exist.

- [ ] **Step 3: Add perception types**

Modify `src/sim/types.ts` to add:

```ts
export type NoiseKind = "gunshot" | "scream" | "bark" | "speech" | "growl" | "feeding" | "struggle";

export interface NoiseEvent {
  id: string;
  kind: NoiseKind;
  tile: TilePos;
  radius: number;
  ageSeconds: number;
}
```

- [ ] **Step 4: Add perception helpers**

Create `src/sim/perception.ts`:

```ts
import { tileBlocksSight } from "./map";
import type { Entity, GameMap, NoiseEvent, NoiseKind, TilePos } from "./types";

let noiseId = 0;

const senses = {
  human: { hearing: 1, visionRange: 8, visionRadians: Math.PI / 2.7 },
  dog: { hearing: 1.6, visionRange: 7, visionRadians: Math.PI / 1.8 },
  zombieHuman: { hearing: 0.7, visionRange: 5, visionRadians: Math.PI / 3.2 },
  zombieDog: { hearing: 1.1, visionRange: 5.5, visionRadians: Math.PI / 2.4 }
} as const;

export function createNoise(kind: NoiseKind, tile: TilePos, radius: number): NoiseEvent {
  noiseId += 1;
  return { id: `noise-${noiseId}`, kind, tile, radius, ageSeconds: 0 };
}

export function canHear(listener: Entity, noise: NoiseEvent, multiplier = 1): boolean {
  const dx = listener.tile.x - noise.tile.x;
  const dy = listener.tile.y - noise.tile.y;
  const range = noise.radius * senses[listener.species].hearing * multiplier;
  return Math.hypot(dx, dy) <= range;
}

export function canSee(map: GameMap, viewer: Entity, target: TilePos): boolean {
  const dx = target.x - viewer.tile.x;
  const dy = target.y - viewer.tile.y;
  const distance = Math.hypot(dx, dy);
  const config = senses[viewer.species];
  if (distance > config.visionRange) return false;

  const angleToTarget = Math.atan2(dy, dx);
  const delta = Math.atan2(Math.sin(angleToTarget - viewer.facing), Math.cos(angleToTarget - viewer.facing));
  if (Math.abs(delta) > config.visionRadians / 2) return false;

  return hasLineOfSight(map, viewer.tile, target);
}

function hasLineOfSight(map: GameMap, from: TilePos, to: TilePos): boolean {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  if (steps <= 1) return true;
  for (let step = 1; step < steps; step += 1) {
    const x = Math.round(from.x + ((to.x - from.x) * step) / steps);
    const y = Math.round(from.y + ((to.y - from.y) * step) / steps);
    if (tileBlocksSight(map, { x, y })) return false;
  }
  return true;
}
```

- [ ] **Step 5: Run perception tests**

Run: `npm test -- tests/sim/perception.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/sim tests/sim/perception.test.ts
git commit -m "feat: add perception and noise rules"
```

## Milestone 4: Combat, Infection, Feeding, And Stats

### Task 5: Add Bite, Infection, Turning, Skeleton, And Feeding Rules

**Files:**
- Create: `src/sim/combat.ts`
- Create: `src/sim/stats.ts`
- Modify: `src/sim/types.ts`
- Test: `tests/sim/combat.test.ts`

- [ ] **Step 1: Write combat tests**

Create `tests/sim/combat.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyBite, feedOnBody, tickInfectionAndBodies } from "../../src/sim/combat";
import { createStats } from "../../src/sim/stats";
import type { Entity } from "../../src/sim/types";

function baseEntity(overrides: Partial<Entity>): Entity {
  return {
    id: "entity",
    name: "Pat",
    affiliation: "Test",
    species: "human",
    state: "calm",
    tile: { x: 1, y: 1 },
    facing: 0,
    speed: 1,
    hp: 100,
    maxHp: 100,
    armed: false,
    infected: false,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: 100,
    originalMeat: 100,
    controlled: false,
    alive: true,
    skeleton: false,
    seenZombie: false,
    stimulusMemorySeconds: 0,
    meatEatenByBody: {},
    totalMeatEaten: 0,
    humansAlerted: 0,
    zombieDamageDealt: 0,
    zombieKills: 0,
    lifetimeSeconds: 0,
    ...overrides
  };
}

describe("combat and bodies", () => {
  it("bites damage and guarantee infection", () => {
    const zombie = baseEntity({ id: "z", species: "zombieHuman", name: "Undead Pat", alive: false });
    const human = baseEntity({ id: "h", name: "Mara" });
    applyBite(zombie, human, 15);
    expect(human.hp).toBe(85);
    expect(human.infected).toBe(true);
  });

  it("infection downs humans and starts turning", () => {
    const stats = createStats();
    const human = baseEntity({ id: "h", name: "Mara", infected: true, infectionSeconds: 4, hp: 1 });
    tickInfectionAndBodies([human], 1, { infectionDamagePerSecond: 2, turningDelaySeconds: 8 }, stats);
    expect(human.alive).toBe(false);
    expect(human.state).toBe("turning");
    expect(human.turnSeconds).toBe(8);
    expect(stats.humansTurnedPending).toBe(1);
  });

  it("feeding caps each zombie at 20 percent of original body meat", () => {
    const zombie = baseEntity({ id: "z", species: "zombieHuman", name: "Undead Glen", alive: false });
    const body = baseEntity({ id: "body", name: "Glen", alive: false, meat: 100, originalMeat: 100, state: "turning" });
    feedOnBody(zombie, body, 30);
    expect(body.meat).toBe(80);
    expect(zombie.totalMeatEaten).toBe(20);
    expect(zombie.meatEatenByBody.body).toBe(20);
  });

  it("body becomes skeleton if meat reaches zero before turning", () => {
    const stats = createStats();
    const body = baseEntity({ id: "body", alive: false, meat: 0, originalMeat: 100, state: "turning", turnSeconds: 5 });
    tickInfectionAndBodies([body], 1, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, stats);
    expect(body.skeleton).toBe(true);
    expect(body.state).toBe("downed");
    expect(stats.skeletonsCreated).toBe(1);
  });
});
```

- [ ] **Step 2: Run the failing combat tests**

Run: `npm test -- tests/sim/combat.test.ts`

Expected: FAIL because combat helpers do not exist.

- [ ] **Step 3: Add stats types and factory**

Modify `src/sim/types.ts` to add:

```ts
export interface SimStats {
  elapsedSeconds: number;
  zombiesKilled: number;
  humansTurned: number;
  humansTurnedPending: number;
  dogsTurned: number;
  skeletonsCreated: number;
  firstInfectedName?: string;
  zombiePopulationSamples: number[];
}
```

Create `src/sim/stats.ts`:

```ts
import type { SimStats } from "./types";

export function createStats(): SimStats {
  return {
    elapsedSeconds: 0,
    zombiesKilled: 0,
    humansTurned: 0,
    humansTurnedPending: 0,
    dogsTurned: 0,
    skeletonsCreated: 0,
    zombiePopulationSamples: []
  };
}
```

- [ ] **Step 4: Add combat rules**

Create `src/sim/combat.ts`:

```ts
import type { Entity, SimStats } from "./types";

export interface BodyTickConfig {
  infectionDamagePerSecond: number;
  turningDelaySeconds: number;
}

export function applyBite(attacker: Entity, target: Entity, damage: number): void {
  if (!target.alive || target.skeleton) return;
  target.hp = Math.max(0, target.hp - damage);
  target.infected = true;
  target.state = target.hp <= 0 ? "turning" : "infected";
  if (target.hp <= 0) {
    target.alive = false;
  }
  attacker.zombieDamageDealt += damage;
}

export function feedOnBody(zombie: Entity, body: Entity, biteDamagePerSecond: number): number {
  if (body.alive || body.skeleton || body.meat <= 0) return 0;
  const cap = body.originalMeat * 0.2;
  const alreadyEaten = zombie.meatEatenByBody[body.id] ?? 0;
  const remainingForZombie = Math.max(0, cap - alreadyEaten);
  const amount = Math.min(biteDamagePerSecond, remainingForZombie, body.meat);
  if (amount <= 0) return 0;
  body.meat -= amount;
  zombie.meatEatenByBody[body.id] = alreadyEaten + amount;
  zombie.totalMeatEaten += amount;
  zombie.state = "feeding";
  return amount;
}

export function tickInfectionAndBodies(
  entities: Entity[],
  dt: number,
  config: BodyTickConfig,
  stats: SimStats
): void {
  for (const entity of entities) {
    entity.lifetimeSeconds += dt;

    if (entity.alive && entity.infected && !isZombie(entity)) {
      entity.infectionSeconds += dt;
      entity.hp = Math.max(0, entity.hp - config.infectionDamagePerSecond * dt);
      if (entity.hp <= 0) {
        entity.alive = false;
        entity.state = "turning";
        entity.turnSeconds = config.turningDelaySeconds;
        if (entity.species === "human") stats.humansTurnedPending += 1;
      }
    }

    if (!entity.alive && entity.state === "turning" && !entity.skeleton) {
      if (entity.meat <= 0) {
        entity.skeleton = true;
        entity.state = "downed";
        stats.skeletonsCreated += 1;
      } else {
        entity.turnSeconds = Math.max(0, entity.turnSeconds - dt);
        if (entity.turnSeconds === 0) {
          reanimate(entity, stats);
        }
      }
    }
  }
}

function reanimate(entity: Entity, stats: SimStats): void {
  if (entity.species === "dog") {
    entity.species = "zombieDog";
    entity.name = `Undead ${entity.name}`;
    entity.affiliation = "The Horde";
    stats.dogsTurned += 1;
  } else if (entity.species === "human") {
    entity.species = "zombieHuman";
    entity.name = `Undead ${entity.name}`;
    entity.affiliation = "The Horde";
    stats.humansTurned += 1;
  }
  entity.state = "investigating";
  entity.infected = true;
  entity.hp = entity.maxHp;
  entity.alive = false;
}

function isZombie(entity: Entity): boolean {
  return entity.species === "zombieHuman" || entity.species === "zombieDog";
}
```

- [ ] **Step 5: Run combat tests**

Run: `npm test -- tests/sim/combat.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/sim tests/sim/combat.test.ts
git commit -m "feat: add infection feeding and body rules"
```

## Milestone 5: Groups, Dogs, AI, And Simulation Orchestration

### Task 6: Add Human Groups And Dog Ownership Rules

**Files:**
- Create: `src/sim/groups.ts`
- Test: `tests/sim/groups.test.ts`

- [ ] **Step 1: Write group tests**

Create `tests/sim/groups.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialWorld } from "../../src/sim/entities";
import { mergeGroups, warnNearbyHumans, handleOwnerDeath } from "../../src/sim/groups";

describe("groups and dogs", () => {
  it("lets warned humans share zombie knowledge", () => {
    const world = createInitialWorld({ humans: 3, dogs: 0, zombies: 0, armedPercent: 0, seed: 1 });
    world.entities[0].seenZombie = true;
    world.entities[0].tile = { x: 5, y: 5 };
    world.entities[1].tile = { x: 6, y: 5 };
    const alerted = warnNearbyHumans(world.entities[0], world.entities, 2);
    expect(alerted).toBe(1);
    expect(world.entities[1].seenZombie).toBe(true);
    expect(world.entities[0].humansAlerted).toBe(1);
  });

  it("uses larger armed group leader when groups merge", () => {
    const world = createInitialWorld({ humans: 5, dogs: 0, zombies: 0, armedPercent: 100, seed: 2 });
    world.groups.push({ id: "group-2", name: "Maple Watch", color: "#fff", memberIds: [world.entities[4].id], leaderId: world.entities[4].id });
    world.entities[4].groupId = "group-2";
    world.groups[0].memberIds = world.entities.slice(0, 4).map((entity) => entity.id);
    world.groups[0].leaderId = world.entities[0].id;
    const merged = mergeGroups(world.groups[0], world.groups[1], world.entities);
    expect(merged.leaderId).toBe(world.entities[0].id);
    expect(merged.memberIds).toHaveLength(5);
  });

  it("reattaches dog to next living human after owner death", () => {
    const world = createInitialWorld({ humans: 2, dogs: 1, zombies: 0, armedPercent: 0, seed: 3 });
    const dog = world.entities.find((entity) => entity.species === "dog");
    const oldOwner = world.entities.find((entity) => entity.id === dog?.ownerId);
    if (oldOwner) oldOwner.alive = false;
    handleOwnerDeath(dog!, world.entities);
    expect(dog?.ownerId).not.toBe(oldOwner?.id);
  });
});
```

- [ ] **Step 2: Run failing group tests**

Run: `npm test -- tests/sim/groups.test.ts`

Expected: FAIL because group helpers do not exist.

- [ ] **Step 3: Add group helpers**

Create `src/sim/groups.ts`:

```ts
import type { Entity, HumanGroup } from "./types";

export function warnNearbyHumans(source: Entity, entities: Entity[], radius: number): number {
  if (!source.seenZombie) return 0;
  let alerted = 0;
  for (const target of entities) {
    if (target.id === source.id || target.species !== "human" || !target.alive) continue;
    const distance = Math.hypot(target.tile.x - source.tile.x, target.tile.y - source.tile.y);
    if (distance <= radius && !target.seenZombie) {
      target.seenZombie = true;
      target.state = "alerted";
      source.humansAlerted += 1;
      alerted += 1;
    }
  }
  return alerted;
}

export function mergeGroups(a: HumanGroup, b: HumanGroup, entities: Entity[]): HumanGroup {
  const memberIds = [...new Set([...a.memberIds, ...b.memberIds])];
  const armedA = leaderIsArmed(a, entities);
  const armedB = leaderIsArmed(b, entities);
  let leaderId = a.leaderId ?? b.leaderId;
  if (armedA && armedB) {
    leaderId = a.memberIds.length >= b.memberIds.length ? a.leaderId : b.leaderId;
  } else if (!armedA && armedB) {
    leaderId = b.leaderId;
  }
  for (const entity of entities) {
    if (memberIds.includes(entity.id)) {
      entity.groupId = a.id;
      entity.affiliation = a.name;
    }
  }
  return { ...a, memberIds, leaderId };
}

export function handleOwnerDeath(dog: Entity, entities: Entity[]): void {
  if (dog.species !== "dog") return;
  const owner = entities.find((entity) => entity.id === dog.ownerId);
  if (owner?.alive) return;
  const nextOwner = entities.find((entity) => entity.species === "human" && entity.alive);
  if (nextOwner) {
    dog.ownerId = nextOwner.id;
    dog.affiliation = nextOwner.name;
    dog.state = "calm";
  } else {
    dog.state = "alerted";
  }
}

function leaderIsArmed(group: HumanGroup, entities: Entity[]): boolean {
  return entities.some((entity) => entity.id === group.leaderId && entity.armed);
}
```

- [ ] **Step 4: Run group tests**

Run: `npm test -- tests/sim/groups.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/sim/groups.ts tests/sim/groups.test.ts
git commit -m "feat: add human groups and dog ownership"
```

### Task 7: Add Main Simulation Tick And Basic AI

**Files:**
- Create: `src/sim/ai.ts`
- Create: `src/sim/Simulation.ts`
- Test: `tests/sim/simulation.test.ts`

- [ ] **Step 1: Write simulation tests**

Create `tests/sim/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Simulation } from "../../src/sim/Simulation";

describe("Simulation", () => {
  it("ends when no living uninfected humans remain", () => {
    const sim = new Simulation({ humans: 1, dogs: 1, zombies: 0, armedPercent: 0, seed: 1 });
    const human = sim.entities.find((entity) => entity.species === "human")!;
    human.alive = false;
    human.infected = true;
    sim.tick(1);
    expect(sim.endState?.winner).toBe("zombies");
  });

  it("does not end while one living uninfected human remains", () => {
    const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 1 });
    sim.tick(1);
    expect(sim.endState).toBeUndefined();
  });

  it("records zombie population samples over time", () => {
    const sim = new Simulation({ humans: 2, dogs: 0, zombies: 2, armedPercent: 0, seed: 1 });
    sim.tick(1);
    sim.tick(1);
    expect(sim.stats.zombiePopulationSamples.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run failing simulation tests**

Run: `npm test -- tests/sim/simulation.test.ts`

Expected: FAIL because `Simulation` does not exist.

- [ ] **Step 3: Add simple AI**

Create `src/sim/ai.ts`:

```ts
import { createNoise } from "./perception";
import type { Entity, NoiseEvent } from "./types";

export function tickSimpleAi(entity: Entity, entities: Entity[], noises: NoiseEvent[]): NoiseEvent[] {
  if (entity.controlled || entity.skeleton) return [];
  if (entity.species === "zombieHuman" || entity.species === "zombieDog") {
    return tickZombie(entity, entities);
  }
  if (entity.species === "dog") {
    return tickDog(entity, entities);
  }
  return tickHuman(entity, noises);
}

function tickZombie(entity: Entity, entities: Entity[]): NoiseEvent[] {
  const livingTarget = entities.find((target) => target.alive && (target.species === "human" || target.species === "dog"));
  if (livingTarget) {
    entity.state = "attacking";
    entity.targetTile = livingTarget.tile;
    entity.facing = Math.atan2(livingTarget.tile.y - entity.tile.y, livingTarget.tile.x - entity.tile.x);
  } else {
    entity.state = "investigating";
    entity.tile = { x: entity.tile.x + (Math.random() > 0.5 ? 1 : -1), y: entity.tile.y };
  }
  return Math.random() < 0.02 ? [createNoise("growl", entity.tile, 3)] : [];
}

function tickDog(entity: Entity, entities: Entity[]): NoiseEvent[] {
  const zombie = entities.find((target) => target.species === "zombieHuman" || target.species === "zombieDog");
  if (zombie) {
    entity.state = "alerted";
    return [createNoise("bark", entity.tile, 8)];
  }
  return [];
}

function tickHuman(entity: Entity, noises: NoiseEvent[]): NoiseEvent[] {
  if (entity.infected) entity.state = "infected";
  if (noises.some((noise) => noise.kind === "gunshot" || noise.kind === "scream" || noise.kind === "bark")) {
    entity.state = "alerted";
  }
  return [];
}
```

- [ ] **Step 4: Add Simulation orchestration**

Create `src/sim/Simulation.ts`:

```ts
import { tickSimpleAi } from "./ai";
import { tickInfectionAndBodies } from "./combat";
import { createInitialWorld } from "./entities";
import { createNeighborhoodMap } from "./map";
import { createStats } from "./stats";
import type { Entity, GameMap, HumanGroup, NoiseEvent, SimStats } from "./types";

interface SimulationOptions {
  humans: number;
  dogs: number;
  zombies: number;
  armedPercent: number;
  seed: number;
}

export interface EndState {
  winner: "humans" | "zombies";
  reason: string;
}

export class Simulation {
  readonly map: GameMap;
  readonly entities: Entity[];
  readonly groups: HumanGroup[];
  readonly stats: SimStats;
  noises: NoiseEvent[] = [];
  endState?: EndState;

  constructor(options: SimulationOptions) {
    this.map = createNeighborhoodMap();
    const world = createInitialWorld(options);
    this.entities = world.entities;
    this.groups = world.groups;
    this.stats = createStats();
  }

  tick(dt: number): void {
    if (this.endState) return;
    this.stats.elapsedSeconds += dt;
    const newNoises: NoiseEvent[] = [];
    for (const entity of this.entities) {
      newNoises.push(...tickSimpleAi(entity, this.entities, this.noises));
    }
    this.noises = [...this.noises, ...newNoises]
      .map((noise) => ({ ...noise, ageSeconds: noise.ageSeconds + dt }))
      .filter((noise) => noise.ageSeconds < 3);
    tickInfectionAndBodies(this.entities, dt, { infectionDamagePerSecond: 1, turningDelaySeconds: 8 }, this.stats);
    if (Math.floor(this.stats.elapsedSeconds) !== Math.floor(this.stats.elapsedSeconds - dt)) {
      this.stats.zombiePopulationSamples.push(this.entities.filter((entity) => entity.species === "zombieHuman" || entity.species === "zombieDog").length);
    }
    this.endState = this.computeEndState();
  }

  private computeEndState(): EndState | undefined {
    const zombies = this.entities.filter((entity) => entity.species === "zombieHuman" || entity.species === "zombieDog");
    if (zombies.length === 0) {
      return { winner: "humans", reason: "All zombies were killed." };
    }
    const livingUninfectedHumans = this.entities.some((entity) => entity.species === "human" && entity.alive && !entity.infected);
    if (!livingUninfectedHumans) {
      return { winner: "zombies", reason: "No living uninfected humans remain." };
    }
    return undefined;
  }
}
```

- [ ] **Step 5: Run simulation tests**

Run: `npm test -- tests/sim/simulation.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/sim/ai.ts src/sim/Simulation.ts tests/sim/simulation.test.ts
git commit -m "feat: add simulation tick and basic ai"
```

## Milestone 6: Rendering, UI, Controls, And Verification

### Task 8: Render The Isometric Neighborhood And Entities

**Files:**
- Modify: `src/app/App.ts`
- Modify: `src/app/Renderer.ts`
- Modify: `src/app/InputController.ts`
- Modify: `src/app/ui.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Replace the initial title render with map and entities**

Modify `src/app/Renderer.ts`:

```ts
import type { Entity, GameMap } from "../sim/types";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const TILE_W = 48;
const TILE_H = 24;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is unavailable");
    this.ctx = ctx;
  }

  render(map: GameMap, entities: Entity[], camera: Camera, selectedId?: string, debug = false): void {
    this.ctx.fillStyle = "#151815";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        this.drawTile(x, y, map.tiles[y][x].kind, camera);
      }
    }
    for (const entity of entities) {
      this.drawEntity(entity, camera, entity.id === selectedId, debug);
    }
  }

  private drawTile(x: number, y: number, kind: string, camera: Camera): void {
    const p = isoToScreen(x, y, camera, this.canvas);
    const colors: Record<string, string> = {
      grass: "#4c7a45",
      road: "#3b3d3c",
      sidewalk: "#85877e",
      house: "#9d5c45",
      fence: "#b58b53",
      tree: "#2f6636",
      car: "#476aa8",
      yard: "#5d8d4d"
    };
    this.ctx.fillStyle = colors[kind] ?? "#4c7a45";
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - TILE_H / 2);
    this.ctx.lineTo(p.x + TILE_W / 2, p.y);
    this.ctx.lineTo(p.x, p.y + TILE_H / 2);
    this.ctx.lineTo(p.x - TILE_W / 2, p.y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(0,0,0,0.22)";
    this.ctx.stroke();
  }

  private drawEntity(entity: Entity, camera: Camera, selected: boolean, debug: boolean): void {
    const p = isoToScreen(entity.tile.x, entity.tile.y, camera, this.canvas);
    const color = entity.skeleton ? "#e8e2bc" : entity.species.includes("zombie") ? "#8ccf6d" : entity.species === "dog" ? "#d0a15f" : entity.armed ? "#f2cc8f" : "#f1f4ea";
    if (selected || debug) {
      this.ctx.strokeStyle = selected ? "#ffffff" : "#62b6cb";
      this.ctx.lineWidth = selected ? 3 : 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 14, 13, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y - 14, entity.species === "dog" ? 6 : 8, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

export function isoToScreen(x: number, y: number, camera: Camera, canvas: HTMLCanvasElement): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_W / 2) * camera.zoom + canvas.width / 2 - camera.x,
    y: (x + y) * (TILE_H / 2) * camera.zoom + 80 - camera.y
  };
}
```

- [ ] **Step 2: Wire simulation into App**

Modify `src/app/App.ts`:

```ts
import { createHud, updateHud } from "./ui";
import { Renderer, type Camera } from "./Renderer";
import { InputController } from "./InputController";
import { Simulation } from "../sim/Simulation";

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly input: InputController;
  private readonly hud: HTMLElement;
  private readonly sim = new Simulation({ humans: 10, dogs: 2, zombies: 3, armedPercent: 25, seed: 42 });
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
      onSpeed: (speed) => (this.speed = speed)
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
```

- [ ] **Step 3: Add edge-scroll input**

Modify `src/app/InputController.ts`:

```ts
export interface InputState {
  keys: Set<string>;
  edgeX: number;
  edgeY: number;
}

export class InputController {
  private readonly keys = new Set<string>();
  private pointer = { x: 0, y: 0 };

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => this.keys.add(event.key.toLowerCase()));
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener("mousemove", (event) => {
      this.pointer = { x: event.clientX, y: event.clientY };
    });
  }

  update(): InputState {
    const margin = 24;
    const edgeX = this.pointer.x < margin ? -1 : this.pointer.x > this.canvas.width - margin ? 1 : 0;
    const edgeY = this.pointer.y < margin ? -1 : this.pointer.y > this.canvas.height - margin ? 1 : 0;
    return { keys: new Set(this.keys), edgeX, edgeY };
  }
}
```

- [ ] **Step 4: Add HUD controls**

Modify `src/app/ui.ts`:

```ts
import type { Simulation } from "../sim/Simulation";

interface HudOptions {
  onDebug: (enabled: boolean) => void;
  onSpeed: (speed: number) => void;
}

export function createHud(options: HudOptions): HTMLElement {
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
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
  return hud;
}

export function updateHud(hud: HTMLElement, sim: Simulation, selectedId?: string): void {
  const selected = sim.entities.find((entity) => entity.id === selectedId);
  hud.querySelector("[data-name]")!.textContent = selected?.name ?? "No selection";
  hud.querySelector("[data-affiliation]")!.textContent = selected?.affiliation ?? "";
  hud.querySelector("[data-state]")!.textContent = selected ? `${selected.species} / ${selected.state}` : "";
  const end = hud.querySelector<HTMLElement>("[data-end]")!;
  if (sim.endState) {
    end.hidden = false;
    end.innerHTML = `<strong>${sim.endState.winner.toUpperCase()} WIN</strong><p>${sim.endState.reason}</p>`;
  }
}
```

- [ ] **Step 5: Extend styles for controls**

Modify `src/styles.css` by appending:

```css
.control-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
  pointer-events: auto;
}

.control-row button,
.control-row label {
  border: 1px solid rgba(241, 244, 234, 0.2);
  border-radius: 6px;
  padding: 7px 9px;
  background: rgba(18, 22, 18, 0.86);
  color: #f1f4ea;
  font: inherit;
}

.end-modal {
  position: fixed;
  inset: 50%;
  width: min(520px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
  padding: 24px;
  border: 1px solid rgba(241, 244, 234, 0.24);
  border-radius: 8px;
  background: rgba(18, 22, 18, 0.95);
  pointer-events: auto;
}
```

- [ ] **Step 6: Build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Start dev server**

Run: `npm run dev`

Expected: local URL is printed, usually `http://127.0.0.1:5173/`.

- [ ] **Step 8: Manual browser verification**

Open the local URL. Verify:

- The isometric 30x30 neighborhood renders.
- Entities render as graybox dots.
- Moving the mouse to screen edges scrolls the camera.
- Time buttons change the visible simulation speed.
- Debug toggle outlines entities.
- End modal appears when an end state is reached.

- [ ] **Step 9: Commit**

Run:

```bash
git add src
git commit -m "feat: render playable graybox simulation"
```

### Task 9: Add Start Modal Presets And End Modal Facts

**Files:**
- Modify: `src/app/App.ts`
- Modify: `src/app/ui.ts`
- Modify: `src/sim/stats.ts`
- Modify: `src/sim/Simulation.ts`
- Test: `tests/sim/simulation.test.ts`

- [ ] **Step 1: Add end fact assertions**

Append to `tests/sim/simulation.test.ts`:

```ts
it("returns name-based end facts", () => {
  const sim = new Simulation({ humans: 2, dogs: 1, zombies: 1, armedPercent: 100, seed: 5 });
  const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
  zombie.totalMeatEaten = 33;
  const dog = sim.entities.find((entity) => entity.species === "dog")!;
  dog.humansAlerted = 2;
  const facts = sim.getEndFacts();
  expect(facts.some((fact) => fact.label === "Hungriest zombie" && fact.value.includes(zombie.name))).toBe(true);
  expect(facts.some((fact) => fact.label === "Bestest doggo" && fact.value.includes(dog.name))).toBe(true);
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/sim/simulation.test.ts`

Expected: FAIL because `getEndFacts` does not exist.

- [ ] **Step 3: Add fact type**

Modify `src/sim/types.ts` to add:

```ts
export interface EndFact {
  label: string;
  value: string;
}
```

- [ ] **Step 4: Add end fact generation**

Modify `src/sim/Simulation.ts` to import `EndFact` and add this method inside the class:

```ts
  getEndFacts(): EndFact[] {
    const humans = this.entities.filter((entity) => entity.species === "human");
    const dogs = this.entities.filter((entity) => entity.species === "dog");
    const zombies = this.entities.filter((entity) => entity.species === "zombieHuman" || entity.species === "zombieDog");
    const hungriest = [...zombies].sort((a, b) => b.totalMeatEaten - a.totalMeatEaten)[0];
    const bestDog = [...dogs].sort((a, b) => (b.humansAlerted + b.zombieDamageDealt) - (a.humansAlerted + a.zombieDamageDealt))[0];
    const bestShot = [...humans].sort((a, b) => b.zombieKills - a.zombieKills)[0];
    return [
      { label: "Human survivors", value: String(humans.filter((entity) => entity.alive && !entity.infected).length) },
      { label: "Dog survivors", value: String(dogs.filter((entity) => entity.alive && !entity.infected).length) },
      { label: "Zombies killed", value: String(this.stats.zombiesKilled) },
      { label: "Humans turned", value: String(this.stats.humansTurned) },
      { label: "Dogs turned", value: String(this.stats.dogsTurned) },
      { label: "Skeletons created", value: String(this.stats.skeletonsCreated) },
      { label: "First infected", value: this.stats.firstInfectedName ?? "No one" },
      { label: "Hungriest zombie", value: hungriest ? `${hungriest.name} ate ${Math.round(hungriest.totalMeatEaten)} meat` : "No zombies fed" },
      { label: "Bestest doggo", value: bestDog ? `${bestDog.name} alerted ${bestDog.humansAlerted} humans` : "No dogs joined the story" },
      { label: "Best shot", value: bestShot && bestShot.zombieKills > 0 ? `${bestShot.name} killed ${bestShot.zombieKills} zombies` : "No confirmed zombie kills" }
    ];
  }
```

- [ ] **Step 5: Add start modal UI**

Modify `src/app/ui.ts` so `createHud` adds this markup before `.title-block`:

```html
    <div class="start-modal" data-start>
      <h1>Zombie Outbreak</h1>
      <select data-preset>
        <option value="dawn">Dawn of the Dead</option>
        <option value="texas">Don't Mess with Texas</option>
        <option value="tenderloin">The Tenderloin</option>
      </select>
      <button data-start-button>Start</button>
    </div>
```

Also extend `HudOptions`:

```ts
  onStart: (preset: string) => void;
```

Then wire the button:

```ts
  hud.querySelector<HTMLButtonElement>("[data-start-button]")?.addEventListener("click", () => {
    const preset = hud.querySelector<HTMLSelectElement>("[data-preset]")?.value ?? "dawn";
    hud.querySelector<HTMLElement>("[data-start]")!.hidden = true;
    options.onStart(preset);
  });
```

- [ ] **Step 6: Update App to recreate simulation from preset**

Modify `src/app/App.ts`:

```ts
  private sim = new Simulation({ humans: 10, dogs: 2, zombies: 3, armedPercent: 25, seed: 42 });
```

and add the `onStart` option:

```ts
      onStart: (preset) => {
        const presets = {
          dawn: { humans: 12, dogs: 2, zombies: 2, armedPercent: 20, seed: Date.now() },
          texas: { humans: 14, dogs: 3, zombies: 3, armedPercent: 65, seed: Date.now() },
          tenderloin: { humans: 16, dogs: 2, zombies: 8, armedPercent: 15, seed: Date.now() }
        } as const;
        this.sim = new Simulation(presets[preset as keyof typeof presets] ?? presets.dawn);
      },
```

- [ ] **Step 7: Render end facts and histogram**

Modify the end block in `updateHud`:

```ts
    const facts = sim.getEndFacts().map((fact) => `<li><strong>${fact.label}</strong><span>${fact.value}</span></li>`).join("");
    const max = Math.max(1, ...sim.stats.zombiePopulationSamples);
    const bars = sim.stats.zombiePopulationSamples.map((sample) => `<i style="height:${Math.max(4, (sample / max) * 80)}px"></i>`).join("");
    end.innerHTML = `<strong>${sim.endState.winner.toUpperCase()} WIN</strong><p>${sim.endState.reason}</p><ul>${facts}</ul><div class="histogram">${bars}</div>`;
```

- [ ] **Step 8: Add modal styles**

Append to `src/styles.css`:

```css
.start-modal {
  position: fixed;
  inset: 50%;
  display: grid;
  gap: 14px;
  width: min(420px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
  padding: 24px;
  border: 1px solid rgba(241, 244, 234, 0.24);
  border-radius: 8px;
  background: rgba(18, 22, 18, 0.96);
  pointer-events: auto;
}

.start-modal select,
.start-modal button {
  min-height: 42px;
  border: 1px solid rgba(241, 244, 234, 0.2);
  border-radius: 6px;
  background: #202620;
  color: #f1f4ea;
  font: inherit;
}

.end-modal ul {
  display: grid;
  gap: 6px;
  padding: 0;
  list-style: none;
}

.end-modal li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.histogram {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 86px;
  margin-top: 14px;
}

.histogram i {
  width: 8px;
  background: #8ccf6d;
}
```

- [ ] **Step 9: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: PASS for both.

- [ ] **Step 10: Commit**

Run:

```bash
git add src tests
git commit -m "feat: add presets and end run facts"
```

### Task 10: Add Possession, Advanced Controls, Overlays, And Combat Integration

**Files:**
- Modify: `src/app/App.ts`
- Modify: `src/app/InputController.ts`
- Modify: `src/app/Renderer.ts`
- Modify: `src/app/ui.ts`
- Modify: `src/sim/Simulation.ts`
- Modify: `src/sim/ai.ts`
- Modify: `src/sim/combat.ts`
- Test: `tests/sim/simulation.test.ts`

- [ ] **Step 1: Add possession and combat behavior tests**

Append to `tests/sim/simulation.test.ts`:

```ts
it("possessed entities accept movement intent without autonomous ai", () => {
  const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 11 });
  const human = sim.entities.find((entity) => entity.species === "human")!;
  const start = { ...human.tile };
  sim.possess(human.id);
  sim.movePossessed({ x: 1, y: 0 });
  sim.tick(1);
  expect(human.controlled).toBe(true);
  expect(human.tile.x).toBe(start.x + 1);
});

it("nearby zombies bite living humans and can start feeding after a down", () => {
  const sim = new Simulation({ humans: 1, dogs: 0, zombies: 1, armedPercent: 0, seed: 12 });
  const human = sim.entities.find((entity) => entity.species === "human")!;
  const zombie = sim.entities.find((entity) => entity.species === "zombieHuman")!;
  human.tile = { x: 5, y: 5 };
  zombie.tile = { x: 6, y: 5 };
  human.hp = 5;
  sim.tick(1);
  expect(human.infected).toBe(true);
  expect(human.alive).toBe(false);
  sim.tick(1);
  expect(zombie.state).toBe("feeding");
});
```

- [ ] **Step 2: Run the failing tests**

Run: `npm test -- tests/sim/simulation.test.ts`

Expected: FAIL because possession and bite integration are not implemented.

- [ ] **Step 3: Add possession API and close-range combat to Simulation**

Modify `src/sim/Simulation.ts` to import combat helpers:

```ts
import { applyBite, feedOnBody, tickInfectionAndBodies } from "./combat";
```

Add these methods inside the class:

```ts
  possess(entityId: string): void {
    for (const entity of this.entities) {
      entity.controlled = entity.id === entityId;
    }
  }

  movePossessed(delta: { x: number; y: number }): void {
    const controlled = this.entities.find((entity) => entity.controlled);
    if (!controlled || !controlled.alive || controlled.skeleton) return;
    controlled.tile = {
      x: controlled.tile.x + Math.sign(delta.x),
      y: controlled.tile.y + Math.sign(delta.y)
    };
  }
```

Add this helper inside the class and call it before `tickInfectionAndBodies(...)`:

```ts
  private resolveCloseInteractions(): void {
    const zombies = this.entities.filter((entity) => entity.species === "zombieHuman" || entity.species === "zombieDog");
    const bodies = this.entities.filter((entity) => !entity.alive && !entity.skeleton && entity.meat > 0);
    for (const zombie of zombies) {
      const livingTarget = this.entities.find((entity) =>
        entity.alive &&
        (entity.species === "human" || entity.species === "dog") &&
        Math.hypot(entity.tile.x - zombie.tile.x, entity.tile.y - zombie.tile.y) <= 1
      );
      if (livingTarget) {
        applyBite(zombie, livingTarget, 12);
        if (!livingTarget.alive) livingTarget.turnSeconds = 8;
        continue;
      }
      const body = bodies.find((candidate) => Math.hypot(candidate.tile.x - zombie.tile.x, candidate.tile.y - zombie.tile.y) <= 1);
      if (body) {
        feedOnBody(zombie, body, 1);
      }
    }
  }
```

- [ ] **Step 4: Add click selection and WASD possession input**

Modify `src/app/InputController.ts`:

```ts
export interface InputState {
  keys: Set<string>;
  edgeX: number;
  edgeY: number;
  clicked?: { x: number; y: number };
  move: { x: number; y: number };
}
```

Add a click field and listener:

```ts
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
```

Replace `update()` return logic:

```ts
    const clicked = this.clicked;
    this.clicked = undefined;
    const move = {
      x: (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0),
      y: (this.keys.has("s") ? 1 : 0) - (this.keys.has("w") ? 1 : 0)
    };
    return { keys: new Set(this.keys), edgeX, edgeY, clicked, move };
```

- [ ] **Step 5: Add hit-testing and movement handling in App**

Modify the frame method in `src/app/App.ts` after `const input = this.input.update();`:

```ts
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
```

- [ ] **Step 6: Add entity picking and selected sensory overlays**

Modify `src/app/Renderer.ts` to add:

```ts
  pickEntity(entities: Entity[], camera: Camera, point: { x: number; y: number }): Entity | undefined {
    return [...entities].reverse().find((entity) => {
      const p = isoToScreen(entity.tile.x, entity.tile.y, camera, this.canvas);
      return Math.hypot(point.x - p.x, point.y - (p.y - 14)) < 16;
    });
  }
```

Inside `drawEntity`, before drawing the entity dot, add:

```ts
    if (selected || debug) {
      this.ctx.strokeStyle = selected ? "rgba(255,255,255,0.34)" : "rgba(98,182,203,0.18)";
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - 14, entity.species === "dog" ? 72 : 48, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y - 14);
      this.ctx.lineTo(p.x + Math.cos(entity.facing - 0.45) * 90, p.y - 14 + Math.sin(entity.facing - 0.45) * 90);
      this.ctx.lineTo(p.x + Math.cos(entity.facing + 0.45) * 90, p.y - 14 + Math.sin(entity.facing + 0.45) * 90);
      this.ctx.closePath();
      this.ctx.stroke();
    }
```

- [ ] **Step 7: Add advanced controls to start modal**

Modify the start modal markup in `src/app/ui.ts` to include numeric inputs:

```html
      <details>
        <summary>Advanced</summary>
        <label>Humans <input data-advanced="humans" type="number" min="1" max="30" value="12" /></label>
        <label>Dogs <input data-advanced="dogs" type="number" min="0" max="10" value="2" /></label>
        <label>Zombies <input data-advanced="zombies" type="number" min="0" max="30" value="3" /></label>
        <label>Armed % <input data-advanced="armedPercent" type="number" min="0" max="100" value="25" /></label>
      </details>
```

Change `HudOptions.onStart`:

```ts
  onStart: (preset: string, overrides: { humans: number; dogs: number; zombies: number; armedPercent: number }) => void;
```

Change the start button handler:

```ts
    const overrides = Object.fromEntries(
      [...hud.querySelectorAll<HTMLInputElement>("[data-advanced]")].map((input) => [input.dataset.advanced!, Number(input.value)])
    ) as { humans: number; dogs: number; zombies: number; armedPercent: number };
    options.onStart(preset, overrides);
```

- [ ] **Step 8: Update App preset handler to respect overrides**

Modify `onStart` in `src/app/App.ts`:

```ts
      onStart: (preset, overrides) => {
        const presets = {
          dawn: { humans: 12, dogs: 2, zombies: 2, armedPercent: 20, seed: Date.now() },
          texas: { humans: 14, dogs: 3, zombies: 3, armedPercent: 65, seed: Date.now() },
          tenderloin: { humans: 16, dogs: 2, zombies: 8, armedPercent: 15, seed: Date.now() }
        } as const;
        this.sim = new Simulation({ ...(presets[preset as keyof typeof presets] ?? presets.dawn), ...overrides, seed: Date.now() });
      },
```

- [ ] **Step 9: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: PASS for both.

- [ ] **Step 10: Manual verification**

Run `npm run dev`, open the app, and verify:

- Clicking an entity selects and possesses it.
- WASD moves the possessed entity.
- Selected entity shows hearing circle and vision cone.
- Debug mode shows overlays for all entities.
- Advanced start values affect entity counts.
- Zombies bite nearby humans and feed on downed bodies.

- [ ] **Step 11: Commit**

Run:

```bash
git add src tests
git commit -m "feat: add possession overlays and combat integration"
```

## Final Verification

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`

Expected: Vite prints a local URL.

- [ ] **Step 3: Browser smoke test**

Open the local URL and verify:

- Start modal appears with three presets.
- Starting a preset displays the isometric graybox neighborhood.
- Camera edge-scroll works.
- Time controls work.
- Entities move/change states over time.
- Debug toggle shows entity outlines.
- End modal can appear and includes name-based facts plus zombie population bars.

- [ ] **Step 4: Commit final verification notes if docs changed**

Only commit if verification caused changes to the implementation plan or README-style notes:

```bash
git status --short
git add docs/superpowers/plans/2026-05-05-zombie-outbreak-implementation.md README.md
git commit -m "docs: record zombie outbreak verification"
```

## Implementation Notes

- Keep MVP behavior intentionally blunt. Prefer constants and simple counters over deep systems.
- Do not start GPT-image-2 asset work until graybox simulation is playable.
- Do not add map generation, interiors, ammo, seamless wrapping, or partially eaten zombie movement until the MVP loop is verified.
- If dependency installation is blocked by network restrictions, request network permission before running `npm install`.
