import { describe, expect, it } from "vitest";
import { visionSectorPathPoints } from "../../src/app/Renderer";

describe("renderer helpers", () => {
  it("builds vision sector points along an outward arc", () => {
    const points = visionSectorPathPoints({ x: 0, y: 0 }, 0, Math.PI / 2, 10, 5);

    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points).toHaveLength(7);
    expect(points[1].x).toBeCloseTo(Math.cos(-Math.PI / 4) * 10);
    expect(points.at(-1)?.x).toBeCloseTo(Math.cos(Math.PI / 4) * 10);
    expect(points.slice(1).every((point) => Math.hypot(point.x, point.y) > 9.9)).toBe(true);
  });
});
