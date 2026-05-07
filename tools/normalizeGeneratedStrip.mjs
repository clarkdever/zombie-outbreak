import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  throw new Error("Usage: node tools/normalizeGeneratedStrip.mjs <input.png> <output.png>");
}

const source = readPng(readFileSync(inputPath));
const output = createCanvas(384, 96);
const slotWidth = Math.floor(source.width / 4);

for (let frame = 0; frame < 4; frame += 1) {
  const bounds = contentBounds(source, frame * slotWidth, 0, slotWidth, source.height);
  if (!bounds) continue;
  const scale = Math.min(80 / (bounds.maxX - bounds.minX + 1), 88 / (bounds.maxY - bounds.minY + 1));
  const scaledWidth = Math.max(1, Math.round((bounds.maxX - bounds.minX + 1) * scale));
  const scaledHeight = Math.max(1, Math.round((bounds.maxY - bounds.minY + 1) * scale));
  const dx = frame * 96 + Math.round((96 - scaledWidth) / 2);
  const dy = 92 - scaledHeight;
  blitScaled(source, output, bounds, dx, dy, scaledWidth, scaledHeight);
}

writeFileSync(outputPath, encodePng(output));

function isKeyPixel(r, g, b, a) {
  return a > 0 && r > 190 && b > 190 && g < 80;
}

function contentBounds(image, sx, sy, width, height) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = sy; y < sy + height; y += 1) {
    for (let x = sx; x < sx + width; x += 1) {
      const index = (y * image.width + x) * 4;
      const a = image.pixels[index + 3];
      const r = image.pixels[index];
      const g = image.pixels[index + 1];
      const b = image.pixels[index + 2];
      if (a === 0 || isKeyPixel(r, g, b, a)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX === -1 ? undefined : { minX, minY, maxX, maxY };
}

function blitScaled(source, target, bounds, dx, dy, width, height) {
  const sourceWidth = bounds.maxX - bounds.minX + 1;
  const sourceHeight = bounds.maxY - bounds.minY + 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = bounds.minX + Math.min(sourceWidth - 1, Math.floor((x / width) * sourceWidth));
      const sy = bounds.minY + Math.min(sourceHeight - 1, Math.floor((y / height) * sourceHeight));
      const sourceIndex = (sy * source.width + sx) * 4;
      const a = source.pixels[sourceIndex + 3];
      const r = source.pixels[sourceIndex];
      const g = source.pixels[sourceIndex + 1];
      const b = source.pixels[sourceIndex + 2];
      if (a === 0 || isKeyPixel(r, g, b, a)) continue;
      const targetX = dx + x;
      const targetY = dy + y;
      if (targetX < 0 || targetX >= target.width || targetY < 0 || targetY >= target.height) continue;
      const targetIndex = (targetY * target.width + targetX) * 4;
      target.pixels[targetIndex] = r;
      target.pixels[targetIndex + 1] = g;
      target.pixels[targetIndex + 2] = b;
      target.pixels[targetIndex + 3] = a;
    }
  }
}

function readPng(buffer) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    }
    if (type === "IDAT") idat.push(data);
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const sourceChannels = colorType === 2 ? 3 : 4;
  const stride = width * sourceChannels;
  const pixels = new Uint8Array(width * height * 4);
  let rawPos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawPos];
    rawPos += 1;
    for (let x = 0; x < stride; x += 1) {
      const index = y * stride + x;
      const left = x >= sourceChannels ? rawValue(pixels, index - sourceChannels, sourceChannels) : 0;
      const up = y > 0 ? rawValue(pixels, index - stride, sourceChannels) : 0;
      const upLeft = y > 0 && x >= sourceChannels ? rawValue(pixels, index - stride - sourceChannels, sourceChannels) : 0;
      let value = raw[rawPos];
      rawPos += 1;
      if (filter === 1) value = (value + left) & 255;
      if (filter === 2) value = (value + up) & 255;
      if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      if (filter === 4) value = (value + paeth(left, up, upLeft)) & 255;
      pixels[index] = value;
    }
  }
  if (sourceChannels === 4) return { width, height, pixels };
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rgbIndex = (y * width + x) * 3;
      const rgbaIndex = (y * width + x) * 4;
      rgba[rgbaIndex] = pixels[rgbIndex];
      rgba[rgbaIndex + 1] = pixels[rgbIndex + 1];
      rgba[rgbaIndex + 2] = pixels[rgbIndex + 2];
      rgba[rgbaIndex + 3] = 255;
    }
  }
  return { width, height, pixels: rgba };
}

function rawValue(pixels, index, channels) {
  return pixels[index];
}

function encodePng(canvas) {
  const scanlines = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * (canvas.width * 4 + 1);
    scanlines[rowStart] = 0;
    Buffer.from(canvas.pixels.subarray(y * canvas.width * 4, (y + 1) * canvas.width * 4)).copy(scanlines, rowStart + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", Buffer.concat([uint32(canvas.width), uint32(canvas.height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function createCanvas(width, height) {
  return { width, height, pixels: new Uint8Array(width * height * 4) };
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

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc32(Buffer.concat([typeBuffer, data])))]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
