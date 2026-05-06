import { describe, expect, it } from "vitest";
import { keyboardCameraVector } from "../../src/app/InputController";

describe("keyboard camera input", () => {
  it("uses arrow keys for camera movement", () => {
    expect(keyboardCameraVector(new Set(["arrowright", "arrowup"]))).toEqual({ x: 1, y: -1 });
  });

  it("does not pan the camera from mouse position", () => {
    expect(keyboardCameraVector(new Set())).toEqual({ x: 0, y: 0 });
  });
});
