/**
 * Распродажа: покадровая лужа кофе (спрайт 5 кадров).
 */
'use strict';

const COFFEE_PUDDLE_SRC = 'assets/fx/coffee-puddle.png';
const COFFEE_PUDDLE_FRAMES = 5;
const COFFEE_PUDDLE_FPS = 8;
const COFFEE_PUDDLE_FW = 263;
const COFFEE_PUDDLE_FH = 139;

const coffeePuddleImg = new Image();
let coffeePuddleReady = false;
coffeePuddleImg.onload = () => { coffeePuddleReady = true; };
coffeePuddleImg.src = COFFEE_PUDDLE_SRC;

function isCoffeePuddleReady() {
  return coffeePuddleReady;
}

/** Рисует лужу кофе. r — радиус хитбокса, спрайт чуть шире эллипса. */
function drawCoffeePuddle(ctx, x, y, r, opts) {
  opts = opts || {};
  if (!coffeePuddleReady) return false;
  const time = opts.time != null ? opts.time : (performance.now() / 1000);
  const idx = Math.floor(time * COFFEE_PUDDLE_FPS) % COFFEE_PUDDLE_FRAMES;
  const dw = Math.max(24, r * 2.7);
  const dh = dw * (COFFEE_PUDDLE_FH / COFFEE_PUDDLE_FW);
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.filter) ctx.filter = opts.filter;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    coffeePuddleImg,
    idx * COFFEE_PUDDLE_FW, 0, COFFEE_PUDDLE_FW, COFFEE_PUDDLE_FH,
    x - dw / 2, y - dh * 0.55, dw, dh,
  );
  ctx.restore();
  return true;
}
