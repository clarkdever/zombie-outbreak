import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "public/assets/sprites/generated");
const directions = ["down", "left", "up", "right"];
const families = [
  { id: "zombieHuman", filePrefix: "zombie-human", armed: false },
  { id: "zombieArmedHuman", filePrefix: "zombie-armed-human", armed: true }
];

mkdirSync(outDir, { recursive: true });

for (const family of families) {
  for (let variant = 0; variant < 4; variant += 1) {
    for (const direction of directions) {
      const pngPath = join(outDir, `${family.filePrefix}-v${variant}-${direction}.png`);
      writeFileSync(pngPath, renderSheet(family.armed, variant, direction));
    }
  }
}

const manifestPath = join(outDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const generatedEntries = [];
for (const family of families) {
  for (let variant = 0; variant < 4; variant += 1) {
    for (const direction of directions) {
      generatedEntries.push({
        id: family.id,
        variant,
        direction,
        src: `/assets/sprites/generated/${family.filePrefix}-v${variant}-${direction}.png`
      });
    }
  }
}
const generatedSrcs = new Set(generatedEntries.map((entry) => entry.src));
manifest.sheets = [
  ...manifest.sheets.filter((entry) => !generatedSrcs.has(entry.src)),
  ...generatedEntries
];
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

function renderSheet(armed, variant, direction) {
  const canvas = createCanvas(384, 768);
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      drawFrame(canvas, armed, variant, direction, row, column, column * 96, row * 96);
    }
  }
  return encodePng(canvas);
}

function drawFrame(canvas, armed, variant, direction, row, column, ox, oy) {
  const palette = zombiePalette(armed, variant);
  const walkPhase = column % 2 === 0 ? -2 : 2;
  const runPhase = column % 2 === 0 ? -4 : 4;
  const attackReach = row === 3 ? 6 + column * 2 : row === 5 ? 3 + column : 0;
  const bob = row === 2 && column % 2 === 0 ? -2 : row === 1 && column % 2 === 0 ? -1 : 0;
  const legPhase = row === 2 ? runPhase : row === 1 ? walkPhase : 0;
  const downed = row === 6;
  const skeleton = row === 7;
  const centerX = direction === "left" ? 45 : direction === "right" ? 51 : 48;
  const yShift = direction === "up" ? -2 : 0;
  const flip = direction === "left" ? -1 : 1;
  const rect = (x, y, w, h, color) => drawRect(canvas, ox + centerX + x * flip - (flip < 0 ? w : 0), oy + y + yShift, w, h, color);

  if (skeleton) {
    rect(-12, 69, 24, 6, "#11140f");
    rect(-10, 67, 20, 5, "#e8ece4");
    rect(8, 64, 8, 8, "#ffffff");
    drawDamage(canvas, ox + centerX, oy + 66, variant);
    return;
  }

  if (downed) {
    rect(-14, 68, 28, 7, "#11140f");
    rect(-12, 66, 23, 6, palette.cloth);
    rect(8, 61, 10, 10, palette.skin);
    drawDamage(canvas, ox + centerX, oy + 64, variant);
    if (armed) rect(13, 70, 13, 4, "#1f2325");
    return;
  }

  const torsoY = 39 + bob;
  const headY = 27 + bob;
  const armY = 44 + bob;
  const legY = 57 + bob;
  const width = armed ? 15 : 19;

  rect(-width / 2 - 2, torsoY - 2, width + 4, 23, "#11140f");
  rect(-width / 2, torsoY, width, 20, palette.cloth);
  rect(-7, headY - 2, 14, 12, "#11140f");
  rect(-6, headY, 12, 9, palette.skin);
  rect(-4, headY + 9, 9, 3, palette.neck);
  rect(-7, headY - 4, 13, 4, palette.hair);
  rect(-8, legY, 5, 14 + legPhase, "#11140f");
  rect(3, legY, 5, 14 - legPhase, "#11140f");
  rect(-7, legY, 4, 12 + legPhase, palette.pants);
  rect(4, legY, 4, 12 - legPhase, palette.pants);
  rect(-11 - attackReach, armY, 5, 17, "#11140f");
  rect(6 + attackReach, armY, 5, 17, "#11140f");
  rect(-10 - attackReach, armY + 1, 3, 14, palette.skin);
  rect(7 + attackReach, armY + 1, 3, 14, palette.skin);

  if (armed) {
    rect(10 + attackReach, armY + 9, 13, 4, "#1f2325");
    rect(19 + attackReach, armY + 8, 4, 2, "#8b8f87");
    rect(-6, torsoY + 4, 12, 3, "#1e3d6d");
  }

  drawDamage(canvas, ox + centerX, oy + torsoY, variant);
}

function zombiePalette(armed, variant) {
  return {
    skin: ["#8fa773", "#a6ad7a", "#7d9b78", "#9cb989"][variant],
    neck: "#6f805d",
    hair: ["#3b2518", "#201612", "#5a3520", "#2b201a"][variant],
    cloth: armed ? ["#234f85", "#1b436f", "#2a5d8f", "#183955"][variant] : ["#3f8f62", "#4d7c48", "#6a7941", "#2f7b68"][variant],
    pants: armed ? ["#172334", "#111a27", "#1d2c3f", "#202728"][variant] : ["#223227", "#2b2d26", "#332b28", "#1d302d"][variant]
  };
}

function drawDamage(canvas, cx, cy, variant) {
  const wounds = [
    [[-8, 6, 5, 4], [4, -8, 4, 3], [6, 17, 3, 6]],
    [[5, 4, 6, 5], [-6, 14, 4, 4], [-2, -5, 3, 3]],
    [[-3, 10, 7, 5], [7, -1, 3, 8], [-8, 18, 4, 3]],
    [[-9, 2, 4, 8], [2, 8, 5, 4], [4, -7, 5, 3]]
  ][variant];
  const gore = ["#7d191f", "#9a2a2e", "#6e1620", "#b03a32"][variant];
  const wound = ["#2b1818", "#3b1d20", "#251515", "#441e1a"][variant];
  for (const [dx, dy, w, h] of wounds) {
    drawRect(canvas, cx + dx, cy + dy, w, h, wound);
    drawRect(canvas, cx + dx + 1, cy + dy, Math.max(1, w - 2), 2, gore);
  }
}

function createCanvas(width, height) {
  return { width, height, pixels: new Uint8Array(width * height * 4) };
}

function drawRect(canvas, x, y, width, height, color) {
  const rgba = hexToRgba(color);
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(canvas.width, Math.round(x + width));
  const bottom = Math.min(canvas.height, Math.round(y + height));
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const index = (py * canvas.width + px) * 4;
      canvas.pixels[index] = rgba[0];
      canvas.pixels[index + 1] = rgba[1];
      canvas.pixels[index + 2] = rgba[2];
      canvas.pixels[index + 3] = rgba[3];
    }
  }
}

function hexToRgba(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
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
