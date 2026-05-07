import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

describe("generated sprite assets", () => {
  it("keeps unarmed human animation shard frames head-to-toe inside their frame", () => {
    const directions = ["down", "left", "right", "up"];
    const animations = ["idle", "walk", "run"];

    for (const direction of directions) {
      for (const animation of animations) {
        const image = readPng(`public/assets/sprites/generated/human-${direction}-${animation}.png`);
        for (let column = 0; column < 4; column += 1) {
          expect(frameBounds(image, 0, column)?.bottom).toBeGreaterThanOrEqual(75);
        }
      }
    }
  });

  it("keeps derived zombie human live rows head-to-toe after regeneration", () => {
    const image = readPng("public/assets/sprites/generated/zombie-human-v2-right.png");
    for (const row of [0, 1, 2]) {
      for (let column = 0; column < 4; column += 1) {
        expect(frameBounds(image, row, column)?.bottom).toBeGreaterThanOrEqual(75);
      }
    }
  });
});

function frameBounds(image, row, column) {
  const startX = column * 96;
  const startY = row * 96;
  let maxY = -1;
  for (let y = 0; y < 96; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      if (image.pixels[((startY + y) * image.width + startX + x) * 4 + 3] > 0) {
        maxY = Math.max(maxY, y);
      }
    }
  }
  return maxY === -1 ? undefined : { bottom: maxY };
}

function readPng(path) {
  const buffer = readFileSync(path);
  let pos = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    }
    if (type === "IDAT") idat.push(data);
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let rawPos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawPos];
    rawPos += 1;
    for (let x = 0; x < stride; x += 1) {
      const index = y * stride + x;
      const left = x >= 4 ? pixels[index - 4] : 0;
      const up = y > 0 ? pixels[index - stride] : 0;
      const upLeft = y > 0 && x >= 4 ? pixels[index - stride - 4] : 0;
      let value = raw[rawPos];
      rawPos += 1;
      if (filter === 1) value = (value + left) & 255;
      if (filter === 2) value = (value + up) & 255;
      if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      if (filter === 4) value = (value + paeth(left, up, upLeft)) & 255;
      pixels[index] = value;
    }
  }
  return { width, height, pixels };
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}
