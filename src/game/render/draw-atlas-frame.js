/** Примитив отрисовки: один кадр из произвольного атласа. */

function drawAtlasFrame(ctx, img, ready, frames, name, x, y, opts = {}) {
  if (!ready) return false;
  const f = frames[name];
  if (!f) return false;
  const dw = opts.w ?? f.w * (opts.scale ?? 1);
  const dh = opts.h ?? f.h * (opts.scale ?? 1);
  const ax = opts.anchorX ?? 0.5;
  const ay = opts.anchorY ?? 1.0;
  ctx.save();
  ctx.translate(x, y);
  if (opts.flip) ctx.scale(-1, 1);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, -dw * ax, -dh * ay, dw, dh);
  ctx.restore();
  return true;
}
