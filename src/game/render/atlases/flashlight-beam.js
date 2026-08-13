/**
 * Распродажа: спрайт луча фонарика.
 * В файле широкий яркий край слева (у персонажа), остриё справа (к цели).
 */
'use strict';

const FLASHLIGHT_BEAM_SRC = 'assets/fx/flashlight-beam.png';
const FLASHLIGHT_BEAM_W = 1024;
const FLASHLIGHT_BEAM_H = 105;

const flashlightBeamImg = new Image();
let flashlightBeamReady = false;
flashlightBeamImg.onload = () => { flashlightBeamReady = true; };
flashlightBeamImg.src = FLASHLIGHT_BEAM_SRC;

function isFlashlightBeamReady() {
  return flashlightBeamReady;
}

/**
 * Луч из (x, y) вдоль angle на length.
 * Старт чуть выше ступней — спрайт игрока якорится ногами в player.y.
 */
function drawFlashlightBeam(ctx, x, y, angle, length, width, opts) {
  opts = opts || {};
  if (!flashlightBeamReady) return false;
  const len = Math.max(24, length || 120);
  const dw = len * 1.06;
  const dh = Math.max(36, (width || 30) * (opts.hunter ? 3.1 : 2.45));
  const nose = opts.nose != null ? opts.nose : 8;
  ctx.save();
  ctx.translate(x, y - 16);
  ctx.rotate(angle);
  ctx.translate(nose, 0);
  ctx.globalCompositeOperation = 'lighter';
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.filter) ctx.filter = opts.filter;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    flashlightBeamImg,
    0, 0, FLASHLIGHT_BEAM_W, FLASHLIGHT_BEAM_H,
    0, -dh / 2, dw, dh,
  );
  ctx.restore();
  return true;
}
