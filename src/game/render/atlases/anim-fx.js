/** Покадровые анимированные эффекты с перекраской под цвет. */

// ── Анимированные эффекты (CC0: CodeManu Pixel Effects + Kenney Particles) ──
const animFxImg = new Image();
let animFxReady = false;
animFxImg.onload = () => { animFxReady = true; };
animFxImg.src = 'assets/atlases/anim_fx_atlas.png';
const ANIM_FX_TINT_CACHE = new Map();

function tintedAnimFxCanvas(id, idx, color) {
  const key = id + '|' + idx + '|' + color;
  let c = ANIM_FX_TINT_CACHE.get(key);
  if (c) return c;
  const f = (window.ANIM_FX_FRAMES?.[id] || [])[idx];
  if (!f) return null;
  c = document.createElement('canvas');
  c.width = f.w; c.height = f.h;
  const cc = c.getContext('2d');
  cc.drawImage(animFxImg, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  cc.globalCompositeOperation = 'source-in';
  cc.fillStyle = color;
  cc.fillRect(0, 0, f.w, f.h);
  ANIM_FX_TINT_CACHE.set(key, c);
  return c;
}

/**
 * Кадр анимированного эффекта.
 * one-shot: opts.t — прогресс 0..1; loop: opts.time — секунды.
 * opts.tint — цвет для белых (kenney) спрайтов.
 */
function drawAnimFxFrame(ctx, id, x, y, opts = {}) {
  if (!animFxReady) return false;
  const def = window.ANIM_FX_DEFS?.[id];
  const frames = window.ANIM_FX_FRAMES?.[id];
  if (!def || !frames || !frames.length) return false;
  let idx;
  if (def.loop) {
    const time = opts.time ?? (performance.now() / 1000);
    idx = Math.floor(time * def.fps) % frames.length;
  } else {
    const t = Math.max(0, Math.min(0.999, opts.t ?? 0));
    idx = Math.floor(t * frames.length);
  }
  const f = frames[idx];
  const target = opts.targetSize ?? 64;
  const scale = opts.scale != null ? opts.scale : target / 100;
  const dw = f.w * scale, dh = f.h * scale;
  ctx.save();
  ctx.translate(x, y);
  if (opts.rot) ctx.rotate(opts.rot);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.tint && def.tint) {
    const tc = tintedAnimFxCanvas(id, idx, opts.tint);
    if (!tc) { ctx.restore(); return false; }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tc, -dw * 0.5, -dh * 0.5, dw, dh);
  } else {
    ctx.imageSmoothingEnabled = !!def.tint;
    ctx.drawImage(animFxImg, f.x, f.y, f.w, f.h, -dw * 0.5, -dh * 0.5, dw, dh);
  }
  ctx.restore();
  return true;
}
