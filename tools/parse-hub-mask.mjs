/**
 * Разбор цветной маски хаба (синий=стены, красный=машины, зелёный=лифт).
 * node tools/parse-hub-mask.mjs <path-to-mask.jpg>
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jpeg = require(path.join(os.tmpdir(), 'consultant-tools/node_modules/jpeg-js'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const maskPath = process.argv[2] || path.join(
  __dirname,
  '../assets/extract/hub-parking-mask.jpg',
);
const WW = 1200;
const WH = 820;

const data = fs.readFileSync(maskPath);
const { width, height, data: px } = jpeg.decode(data, { useTArray: true });

function isColor(i, r, g, b, t = 40) {
  return Math.abs(px[i] - r) <= t
    && Math.abs(px[i + 1] - g) <= t
    && Math.abs(px[i + 2] - b) <= t;
}

function findRects(r, g, b, label) {
  const grid = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (isColor(i, r, g, b)) grid[y * width + x] = 1;
    }
  }
  const rects = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y * width + x]) continue;
      let w = 1;
      while (x + w < width && grid[y * width + x + w]) w++;
      let h = 1;
      outer: while (y + h < height) {
        for (let dx = 0; dx < w; dx++) {
          if (!grid[(y + h) * width + x + dx]) break outer;
        }
        h++;
      }
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) grid[(y + dy) * width + x + dx] = 0;
      }
      const cx = (x + w / 2) / width;
      const cy = (y + h / 2) / height;
      const rw = Math.max(14, Math.round((w / width) * WW));
      const rh = Math.max(14, Math.round((h / height) * WH));
      rects.push({
        label,
        x: +cx.toFixed(4),
        y: +cy.toFixed(4),
        w: rw,
        h: rh,
        px: { x, y, w, h },
      });
    }
  }
  rects.sort((a, b) => a.y - b.y || a.x - b.x);
  return rects;
}

const red = findRects(255, 0, 0, 'car');
const green = findRects(0, 255, 0, 'elevator');
const blue = findRects(0, 0, 255, 'wall');

console.log(JSON.stringify({ width, height, WW, WH, cars: red, elevator: green[0], walls: blue }, null, 2));
