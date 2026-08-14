/**
 * Босс «Тренер»: 1 этаж вылазки и финал распродажи.
 */
'use strict';

const TRAINER_FRAMES = {
  idle: { x: 2, y: 2, w: 513, h: 625, ax: 0.537 },
  walk_0: { x: 517, y: 251, w: 278, h: 376, ax: 0.414 },
  walk_1: { x: 797, y: 251, w: 303, h: 376, ax: 0.424 },
  walk_2: { x: 1102, y: 251, w: 301, h: 376, ax: 0.437 },
  attack_0: { x: 1405, y: 382, w: 226, h: 245, ax: 0.436 },
  attack_1: { x: 1633, y: 382, w: 206, h: 245, ax: 0.444 },
  attack_2: { x: 1841, y: 382, w: 247, h: 245, ax: 0.366 },
  attack_3: { x: 2090, y: 382, w: 250, h: 245, ax: 0.356 },
};

const TRAINER_ANIMS = {
  idle: ['idle'],
  walk: ['walk_0', 'walk_1', 'walk_2', 'walk_1'],
  run: ['walk_0', 'walk_1', 'walk_2', 'walk_1'],
  attack: ['attack_0', 'attack_1', 'attack_2', 'attack_3'],
};

/** Экранная высота ≈ 4 обычных мобов (82 × 0.52 × 4). */
const TRAINER_ONSCREEN_H = 170;
const TRAINER_RADIUS = 32;

const trainerImg = new Image();
let trainerReady = false;
trainerImg.onload = () => { trainerReady = true; };
trainerImg.src = 'assets/bosses/trainer/atlas.png';

function trainerFrameKey(enemy) {
  const pose = enemy.mobPose || 'idle';
  const keys = TRAINER_ANIMS[pose] || TRAINER_ANIMS.idle;
  if (!keys.length) return 'idle';
  if (keys.length === 1) return keys[0];
  const fps = pose === 'attack' ? 10 : 7;
  const t = performance.now() / 1000;
  return keys[Math.floor(t * fps) % keys.length];
}

function drawTrainerMob(ctx, enemy, opts) {
  opts = opts || {};
  if (!trainerReady) return false;
  const key = trainerFrameKey(enemy);
  const f = TRAINER_FRAMES[key];
  if (!f) return false;
  const scale = TRAINER_ONSCREEN_H / f.h;
  const dw = f.w * scale;
  const dh = f.h * scale;
  const ax = f.ax != null ? f.ax : 0.5;
  const x = enemy.x;
  const y = enemy.y + 4;
  ctx.save();
  ctx.translate(x, y);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(trainerImg, f.x, f.y, f.w, f.h, -dw * ax, -dh, dw, dh);
  ctx.restore();
  return true;
}
