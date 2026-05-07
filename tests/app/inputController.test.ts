import { describe, expect, it } from "vitest";
import { isOverlayToggleKey, keyboardCameraVector } from "../../src/app/InputController";

describe("keyboard camera input", () => {
  it("uses arrow keys for camera movement", () => {
    expect(keyboardCameraVector(new Set(["arrowright", "arrowup"]))).toEqual({ x: 1, y: -1 });
  });

  it("does not pan the camera from mouse position", () => {
    expect(keyboardCameraVector(new Set())).toEqual({ x: 0, y: 0 });
  });

  it("uses H as the overlay toggle key", () => {
    expect(isOverlayToggleKey("h")).toBe(true);
    expect(isOverlayToggleKey("H")).toBe(true);
    expect(isOverlayToggleKey("ArrowUp")).toBe(false);
  });
});
