/** Распродажа: нарисованные фоны арен. */
'use strict';

const saleArenaBgImgs = {};

(function loadSaleArenaBgs() {
  if (typeof ARENA_THEMES === 'undefined') return;
  for (const id of Object.keys(ARENA_THEMES)) {
    const src = ARENA_THEMES[id].paintedSrc;
    if (!src) continue;
    const img = new Image();
    img.onload = () => { img._ready = true; };
    img.src = src;
    saleArenaBgImgs[id] = img;
  }
})();

function isSaleArenaBgReady(id) {
  const img = saleArenaBgImgs[id];
  return !!(img && img._ready);
}

function drawSaleArenaBg(ctx, id, w, h) {
  const img = saleArenaBgImgs[id];
  if (!img || !img._ready) return false;
  ctx.drawImage(img, 0, 0, w, h);
  return true;
}
