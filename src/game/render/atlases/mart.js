/** Товары Pixel Mart: XP-дропы и пауэрапы. */

// ── Товары Pixel Mart (CC0) — XP-дропы и пауэрапы ──
const martImg = new Image();
let martReady = false;
martImg.onload = () => { martReady = true; };
martImg.src = 'assets/atlases/mart_atlas.png';

function drawMartIcon(ctx, name, x, y, opts = {}) {
  if (!martReady) return false;
  const f = window.MART_FRAMES?.[name];
  if (!f) return false;
  const size = opts.targetSize ?? 20;
  ctx.save();
  ctx.translate(x, y);
  if (opts.rot) ctx.rotate(opts.rot);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(martImg, f.x, f.y, f.w, f.h, -size * 0.5, -size * 0.5, size, size);
  ctx.restore();
  return true;
}
