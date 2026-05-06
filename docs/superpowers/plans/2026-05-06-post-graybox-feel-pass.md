# Post-Graybox Feel Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the playable graybox build's readability and feel by adding selected-entity inspection, centralized visual state mapping, shot cooldown feedback, and smooth visual interpolation.

**Architecture:** Keep simulation rules deterministic and testable in `src/sim/*`. Keep render-only polish in `src/app/*`, with pure app helpers tested separately from Canvas drawing. Avoid sprite work in this pass; this is still graybox polish.

**Tech Stack:** TypeScript, Vite, Vitest, Canvas 2D, DOM HUD.

---

## File Structure

- `src/app/entityPresentation.ts`: Pure entity color, label, status, and HUD row helpers shared by HUD and renderer.
- `src/app/visualPositions.ts`: Pure render-position interpolation store for smooth movement between tile updates.
- `src/app/ui.ts`: HUD markup and selected-entity inspect panel rendering.
- `src/app/Renderer.ts`: Use presentation helpers and render interpolated entity positions.
- `src/app/App.ts`: Own `VisualPositionStore`, pass smoothed render entities to renderer, and keep HUD updated.
- `src/sim/types.ts`: Add shot cooldown fields if needed.
- `src/sim/entities.ts`: Initialize shot cooldown fields if needed.
- `src/sim/Simulation.ts`: Enforce controlled and AI shot cooldown.
- `tests/app/entityPresentation.test.ts`: Unit tests for selected-entity summary and state presentation.
- `tests/app/visualPositions.test.ts`: Unit tests for interpolation behavior.
- `tests/sim/simulation.test.ts`: Shot cooldown regression tests.

## Task 1: Selected Entity Inspect Panel And Presentation Helper

**Files:**
- Create: `src/app/entityPresentation.ts`
- Modify: `src/app/ui.ts`
- Modify: `src/app/Renderer.ts`
- Modify: `src/styles.css`
- Test: `tests/app/entityPresentation.test.ts`

- [ ] **Step 1: Write failing presentation tests**

Create `tests/app/entityPresentation.test.ts` with tests for:

```ts
import { describe, expect, it } from "vitest";
import { entityColor, entityRingColor, getEntityInspectRows, stateLabel } from "../../src/app/entityPresentation";
import type { Entity } from "../../src/sim/types";

function entity(overrides: Partial<Entity>): Entity {
  return {
    id: "e",
    name: "Mara",
    affiliation: "Maple Watch",
    species: "human",
    state: "calm",
    tile: { x: 1, y: 1 },
    facing: 0,
    speed: 1,
    hp: 75,
    maxHp: 100,
    armed: false,
    infected: false,
    infectionSeconds: 0,
    turnSeconds: 0,
    meat: 90,
    originalMeat: 100,
    controlled: false,
    alive: true,
    skeleton: false,
    seenZombie: false,
    seesStimulus: false,
    hearsStimulus: false,
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

describe("entity presentation", () => {
  it("matches entity colors used by the legend", () => {
    expect(entityColor(entity({ species: "human", armed: false }))).toBe("#2fbf71");
    expect(entityColor(entity({ species: "human", armed: true }))).toBe("#3a86ff");
    expect(entityColor(entity({ species: "zombieHuman", alive: false }))).toBe("#e63946");
    expect(entityColor(entity({ skeleton: true }))).toBe("#ffffff");
  });

  it("labels important states and ring colors", () => {
    expect(stateLabel(entity({ state: "shooting" }))).toBe("shooting");
    expect(entityRingColor(entity({ state: "infected" }), false)).toBe("#ef476f");
  });

  it("builds selected inspect rows with health and combat stats", () => {
    const rows = getEntityInspectRows(entity({ armed: true, controlled: true, zombieKills: 2 }));
    expect(rows).toContainEqual({ label: "HP", value: "75 / 100" });
    expect(rows).toContainEqual({ label: "Weapon", value: "armed" });
    expect(rows).toContainEqual({ label: "Control", value: "possessed" });
    expect(rows).toContainEqual({ label: "Zombie kills", value: "2" });
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/app/entityPresentation.test.ts`

Expected: FAIL because `src/app/entityPresentation.ts` does not exist.

- [ ] **Step 3: Implement presentation helper and HUD inspect panel**

Create `src/app/entityPresentation.ts` exporting `entityColor`, `entityRingColor`, `stateLabel`, and `getEntityInspectRows`.

Modify `src/app/ui.ts` to add an `.inspect-panel` element under the title block and render rows from `getEntityInspectRows(selected)`.

Modify `src/app/Renderer.ts` to import `entityColor` and `entityRingColor` instead of local duplicate helpers.

Modify `src/styles.css` to style `.inspect-panel`, `.inspect-row`, and compact values.

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/app/entityPresentation.test.ts`

Expected: PASS.

- [ ] **Step 5: Run full checks**

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app/entityPresentation.ts src/app/ui.ts src/app/Renderer.ts src/styles.css tests/app/entityPresentation.test.ts
git commit -m "feat: add selected entity inspect panel"
```

## Task 2: Combat Shot Cooldown

**Files:**
- Modify: `src/sim/types.ts`
- Modify: `src/sim/entities.ts`
- Modify: `src/sim/Simulation.ts`
- Test: `tests/sim/simulation.test.ts`

- [ ] **Step 1: Write failing cooldown tests**

Append tests to `tests/sim/simulation.test.ts`:

```ts
it("prevents controlled armed humans from firing while shot cooldown is active", () => {
  const sim = new Simulation({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 21 });
  const shooter = sim.entities[0];
  const target = sim.entities[1];
  shooter.tile = { x: 5, y: 10 };
  shooter.facing = 0;
  target.tile = { x: 8, y: 10 };
  sim.possess(shooter.id);

  expect(sim.shootPossessed()).toBe(true);
  expect(sim.shootPossessed()).toBe(false);
  expect(sim.bullets).toHaveLength(1);

  sim.tick(1);
  expect(sim.shootPossessed()).toBe(true);
});

it("ages bullet traces out while shot cooldown recovers", () => {
  const sim = new Simulation({ humans: 2, dogs: 0, zombies: 0, armedPercent: 100, seed: 22 });
  const shooter = sim.entities[0];
  const target = sim.entities[1];
  shooter.tile = { x: 5, y: 10 };
  shooter.facing = 0;
  target.tile = { x: 8, y: 10 };
  sim.possess(shooter.id);

  sim.shootPossessed();
  expect(sim.bullets).toHaveLength(1);
  sim.tick(0.25);
  expect(sim.bullets).toHaveLength(0);
  expect(shooter.shotCooldownSeconds).toBeLessThan(1);
});
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- tests/sim/simulation.test.ts`

Expected: FAIL because shooting has no cooldown.

- [ ] **Step 3: Implement cooldown**

Add `shotCooldownSeconds: number` to `Entity` in `src/sim/types.ts`, initialize it to `0` in `src/sim/entities.ts`, decrement it in `Simulation.tick(dt)`, and set it to `1` after `fireBullet`.

Update `shootPossessed()` and AI firing to refuse shots while cooldown is above zero.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/sim/simulation.test.ts
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/sim/types.ts src/sim/entities.ts src/sim/Simulation.ts tests/sim/simulation.test.ts
git commit -m "feat: add shot cooldown"
```

## Task 3: Smooth Visual Tile Interpolation

**Files:**
- Create: `src/app/visualPositions.ts`
- Modify: `src/app/App.ts`
- Modify: `src/app/Renderer.ts`
- Test: `tests/app/visualPositions.test.ts`

- [ ] **Step 1: Write failing interpolation tests**

Create `tests/app/visualPositions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { VisualPositionStore, interpolateTilePosition } from "../../src/app/visualPositions";

describe("visual positions", () => {
  it("interpolates between two tile positions", () => {
    expect(interpolateTilePosition({ x: 0, y: 0 }, { x: 2, y: 0 }, 0.25)).toEqual({ x: 0.5, y: 0 });
  });

  it("moves visual position toward changed entity tile without jumping", () => {
    const store = new VisualPositionStore(4);
    const entity = { id: "e", tile: { x: 0, y: 0 } };
    expect(store.update([entity], 0.1)[0].renderTile).toEqual({ x: 0, y: 0 });
    entity.tile = { x: 1, y: 0 };
    const next = store.update([entity], 0.1)[0].renderTile;
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(1);
  });

  it("snaps tiny remaining distances to the target", () => {
    const store = new VisualPositionStore(100);
    const entity = { id: "e", tile: { x: 0, y: 0 } };
    store.update([entity], 0.1);
    entity.tile = { x: 1, y: 0 };
    expect(store.update([entity], 0.1)[0].renderTile).toEqual({ x: 1, y: 0 });
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- tests/app/visualPositions.test.ts`

Expected: FAIL because `src/app/visualPositions.ts` does not exist.

- [ ] **Step 3: Implement interpolation store**

Create `src/app/visualPositions.ts` with `VisualPositionStore`, `interpolateTilePosition`, and `VisualEntity<T>` types.

Modify `src/app/App.ts` to own a `VisualPositionStore` and pass smoothed entities to the renderer.

Modify `src/app/Renderer.ts` so entity drawing and picking use `renderTile` while still reading state/species from the original entity.

- [ ] **Step 4: Run checks**

Run:

```bash
npm test -- tests/app/visualPositions.test.ts
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app/visualPositions.ts src/app/App.ts src/app/Renderer.ts tests/app/visualPositions.test.ts
git commit -m "feat: smooth entity movement"
```

## Final Verification

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 2: Manual browser smoke test**

Run `npm run dev`, open `http://127.0.0.1:5173/`, start a scenario, and verify:

- Selected entity inspect panel updates as selection changes.
- Shooting cannot be spammed every frame.
- Bullet traces still appear and expire.
- Humans/zombies move with smoother visual interpolation between tile steps.
- Debug overlays remain aligned with the visual entity position.

- [ ] **Step 3: Commit only if verification changes docs**

Only commit docs if final verification changes the plan or README.
