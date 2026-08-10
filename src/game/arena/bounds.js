/** Удержание сущностей внутри игровых границ арены. */

function clampEntityToArena(ent, worldW, worldH, game) {
  const m = ent.r + 5;
  if (game && typeof game.getArenaBounds === 'function') {
    const b = game.getArenaBounds();
    ent.x = Math.max(b.x0 + m, Math.min(b.x1 - m, ent.x));
    ent.y = Math.max(b.y0 + m, Math.min(b.y1 - m, ent.y));
  } else {
    ent.x = Math.max(m, Math.min(worldW - m, ent.x));
    ent.y = Math.max(m, Math.min(worldH - m, ent.y));
  }
}
