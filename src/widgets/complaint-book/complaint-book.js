/** Портрет покупателя на канвасе для строки книги жалоб. */

function paintComplaintPortrait(canvas, entry) {
  if (!canvas || !enemyMobReady) return false;
  const pack = ENEMY_MOB_ANIMS[entry.skin];
  const frameKey = pack && pack.idle && pack.idle[0];
  const f = frameKey && ENEMY_MOB_FRAMES[frameKey];
  if (!f) return false;
  const boss = !!entry.boss;
  const box = boss ? 64 : 52;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(box * dpr);
  canvas.height = Math.round(box * dpr);
  canvas.style.width = box + 'px';
  canvas.style.height = box + 'px';
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvas.width, canvas.height);
  const fit = (entry.scale || (boss ? 1.08 : 1)) * (box * 0.92) / Math.max(f.w, f.h);
  const dw = f.w * fit * dpr;
  const dh = f.h * fit * dpr;
  c.drawImage(enemyMobImg, f.x, f.y, f.w, f.h, (canvas.width - dw) / 2, canvas.height - dh, dw, dh);
  return true;
}
