import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "public/assets/sprites/generated");
const directions = ["down", "left", "up", "right"];
const variantCount = 4;

mkdirSync(outDir, { recursive: true });

for (let variant = 0; variant < variantCount; variant += 1) {
  for (const direction of directions) {
    const unarmed = zombifySheet(readPng(join(outDir, `human-${direction}.png`)), variant, false);
    const armed = zombifySheet(armedHumanBaseSheet(direction), variant, true);
    writeFileSync(join(outDir, `zombie-human-v${variant}-${direction}.png`), encodePng(unarmed));
    writeFileSync(join(outDir, `zombie-armed-human-v${variant}-${direction}.png`), encodePng(armed));
  }
}

updateManifest();

function armedHumanBaseSheet(direction) {
  const canvas = createCanvas(384, 768);
  const rowSources = [
    ["idle", 0],
    ["walk", 0],
    ["run", 0],
    ["walk", 0],
    ["shoot", 0],
    ["walk", 0],
    ["idle", 0],
    ["idle", 0]
  ];

  for (let row = 0; row < rowSources.length; row += 1) {
    const [animation, sourceRow] = rowSources[row];
    const sheet = readPng(join(outDir, `armed-human-${direction}-${animation}.png`));
    copyRect(sheet, canvas, 0, sourceRow * 96, 384, 96, 0, row * 96);
  }

  return canvas;
}

function zombifySheet(source, variant, armed) {
  const target = cloneCanvas(source);
  const palette = zombiePalette(variant);

  for (let index = 0; index < target.pixels.length; index += 4) {
    const alpha = target.pixels[index + 3];
    if (alpha === 0) continue;
    const r = target.pixels[index];
    const g = target.pixels[index + 1];
    const b = target.pixels[index + 2];

    if (isSkinPixel(r, g, b)) {
      const shade = Math.max(0.65, Math.min(1.35, (r + g + b) / 480));
      target.pixels[index] = clamp(palette.skin[0] * shade);
      target.pixels[index + 1] = clamp(palette.skin[1] * shade);
      target.pixels[index + 2] = clamp(palette.skin[2] * shade);
    } else if (isBlueUniformPixel(r, g, b)) {
      const shade = Math.max(0.72, Math.min(1.12, (r + g + b) / 350));
      target.pixels[index] = clamp(palette.uniform[0] * shade);
      target.pixels[index + 1] = clamp(palette.uniform[1] * shade);
      target.pixels[index + 2] = clamp(palette.uniform[2] * shade);
    } else if (isGreenShirtPixel(r, g, b)) {
      const shade = Math.max(0.72, Math.min(1.18, (r + g + b) / 360));
      target.pixels[index] = clamp(palette.shirt[0] * shade);
      target.pixels[index + 1] = clamp(palette.shirt[1] * shade);
      target.pixels[index + 2] = clamp(palette.shirt[2] * shade);
    } else if (r > 20 || g > 20 || b > 20) {
      target.pixels[index] = clamp(r * 0.88);
      target.pixels[index + 1] = clamp(g * 0.9);
      target.pixels[index + 2] = clamp(b * 0.82);
    }
  }

  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      addZombieDamage(target, variant, row, column, armed);
    }
  }

  return target;
}

function addZombieDamage(canvas, variant, row, column, armed) {
  const bounds = frameBounds(canvas, row, column);
  if (!bounds) return;
  const originX = column * 96;
  const originY = row * 96;
  const cx = Math.round((bounds.minX + bounds.maxX) / 2);
  const top = bounds.minY;
  const height = bounds.maxY - bounds.minY + 1;
  const wounds = damageLayout(variant, row, armed);

  for (const wound of wounds) {
    const x = originX + cx + Math.round(wound.x * (bounds.maxX - bounds.minX + 1));
    const y = originY + top + Math.round(wound.y * height);
    drawTear(canvas, x, y, wound.w, wound.h, variant);
  }

  if (row !== 6 && row !== 7) {
    drawRect(canvas, originX + cx - 2 + (variant % 2), originY + top + 12, 2, 2, "#d7e8a4", true);
    drawRect(canvas, originX + cx + 3 - (variant % 2), originY + top + 12, 2, 2, "#d7e8a4", true);
  }
}

function damageLayout(variant, row, armed) {
  const attackBias = row === 3 || row === 5 ? 0.07 : 0;
  const layouts = [
    [{ x: -0.2, y: 0.42, w: 7, h: 4 }, { x: 0.08, y: 0.18, w: 4, h: 3 }, { x: 0.2, y: 0.68, w: 4, h: 7 }],
    [{ x: 0.16, y: 0.36, w: 8, h: 5 }, { x: -0.16, y: 0.62, w: 5, h: 4 }, { x: -0.03, y: 0.22, w: 4, h: 3 }],
    [{ x: -0.05, y: 0.48, w: 9, h: 5 }, { x: 0.22, y: 0.3, w: 4, h: 8 }, { x: -0.22, y: 0.72, w: 5, h: 4 }],
    [{ x: -0.24, y: 0.34, w: 5, h: 9 }, { x: 0.1, y: 0.46, w: 7, h: 4 }, { x: 0.18, y: 0.2, w: 6, h: 3 }]
  ];
  return layouts[variant].map((wound) => ({
    ...wound,
    y: Math.min(0.84, wound.y + attackBias),
    w: armed ? Math.max(3, wound.w - 1) : wound.w
  }));
}

function drawTear(canvas, x, y, width, height, variant) {
  const dark = ["#2b1818", "#3b1d20", "#251515", "#441e1a"][variant];
  const gore = ["#7d191f", "#9a2a2e", "#6e1620", "#b03a32"][variant];
  drawRect(canvas, x, y, width, height, dark, true);
  drawRect(canvas, x + 1, y, Math.max(1, width - 2), 2, gore, true);
  drawRect(canvas, x + Math.max(1, Math.floor(width / 2)), y + height, 2, 3, gore, true);
}

function updateManifest() {
  const manifestPath = join(outDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const entries = [];

  for (const family of [
    { id: "zombieHuman", filePrefix: "zombie-human" },
    { id: "zombieArmedHuman", filePrefix: "zombie-armed-human" }
  ]) {
    for (let variant = 0; variant < variantCount; variant += 1) {
      for (const direction of directions) {
        entries.push({
          id: family.id,
          variant,
          direction,
          src: `/assets/sprites/generated/${family.filePrefix}-v${variant}-${direction}.png`
        });
      }
    }
  }

  const srcs = new Set(entries.map((entry) => entry.src));
  manifest.sheets = [
    ...manifest.sheets.filter((entry) => !srcs.has(entry.src)),
    ...entries
  ];
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function zombiePalette(variant) {
  return {
    skin: [
      [126, 157, 100],
      [149, 165, 105],
      [109, 149, 107],
      [156, 179, 130]
    ][variant],
    shirt: [
      [70, 107, 56],
      [84, 101, 54],
      [63, 116, 77],
      [92, 111, 62]
    ][variant],
    uniform: [
      [35, 68, 96],
      [43, 70, 82],
      [48, 82, 104],
      [31, 58, 75]
    ][variant]
  };
}

function isSkinPixel(r, g, b) {
  return r > 130 && g > 70 && b > 45 && r > g + 18 && g > b * 0.78;
}

function isBlueUniformPixel(r, g, b) {
  return b > 65 && b > r + 18 && g > r * 0.8;
}

function isGreenShirtPixel(r, g, b) {
  return g > 65 && g >= r * 0.88 && g > b * 0.9 && r < 145 && b < 120;
}

function frameBounds(canvas, row, column) {
  const startX = column * 96;
  const startY = row * 96;
  let minX = 96;
  let minY = 96;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < 96; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      if (alphaAt(canvas, startX + x, startY + y) > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return maxX === -1 ? undefined : { minX, minY, maxX, maxY };
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

function cloneCanvas(canvas) {
  return { width: canvas.width, height: canvas.height, pixels: new Uint8Array(canvas.pixels) };
}

function copyRect(source, target, sx, sy, width, height, dx, dy) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = ((sy + y) * source.width + sx + x) * 4;
      const targetIndex = ((dy + y) * target.width + dx + x) * 4;
      target.pixels[targetIndex] = source.pixels[sourceIndex];
      target.pixels[targetIndex + 1] = source.pixels[sourceIndex + 1];
      target.pixels[targetIndex + 2] = source.pixels[sourceIndex + 2];
      target.pixels[targetIndex + 3] = source.pixels[sourceIndex + 3];
    }
  }
}

function drawRect(canvas, x, y, width, height, color, onlyOnExistingPixels = false) {
  const rgba = hexToRgba(color);
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(canvas.width, Math.round(x + width));
  const bottom = Math.min(canvas.height, Math.round(y + height));
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      if (onlyOnExistingPixels && alphaAt(canvas, px, py) === 0) continue;
      const index = (py * canvas.width + px) * 4;
      canvas.pixels[index] = rgba[0];
      canvas.pixels[index + 1] = rgba[1];
      canvas.pixels[index + 2] = rgba[2];
      canvas.pixels[index + 3] = rgba[3];
    }
  }
}

function alphaAt(canvas, x, y) {
  return canvas.pixels[(y * canvas.width + x) * 4 + 3];
}

function hexToRgba(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
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
