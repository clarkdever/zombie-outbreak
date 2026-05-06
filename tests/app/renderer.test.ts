import { describe, expect, it } from "vitest";
import { entityPickBounds, visionSectorPathPoints } from "../../src/app/Renderer";

describe("renderer helpers", () => {
  it("builds vision sector points along an outward arc", () => {
    const points = visionSectorPathPoints({ x: 0, y: 0 }, 0, Math.PI / 2, 10, 5);

    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points).toHaveLength(7);
    expect(points[1].x).toBeCloseTo(Math.cos(-Math.PI / 4) * 10);
    expect(points.at(-1)?.x).toBeCloseTo(Math.cos(Math.PI / 4) * 10);
    expect(points.slice(1).every((point) => Math.hypot(point.x, point.y) > 9.9)).toBe(true);
  });

  it("uses the full humanoid sprite body for picking instead of the old foot circle", () => {
    const bounds = entityPickBounds("human", { x: 100, y: 100 });

    expect(bounds.left).toBeLessThanOrEqual(70);
    expect(bounds.right).toBeGreaterThanOrEqual(130);
    expect(bounds.top).toBeLessThanOrEqual(36);
    expect(bounds.bottom).toBeGreaterThanOrEqual(99);
  });
});
