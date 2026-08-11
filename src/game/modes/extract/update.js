/**
 * Вылазка: главный тик режима.
 */
'use strict';

Game.prototype.updateExtract = function (dt) {
  if (this.isBoostersOpen && this.isBoostersOpen()) return;
  if (this.paused || this.shopping || this.gameOver || this.won || this.inMainMenu) return;

  const realDt = Math.min(dt, 0.1);
  if (this._extractBanner) {
    this._extractBanner.t -= realDt;
    if (this._extractBanner.t <= 0) this._extractBanner = null;
  }

  const dir = this.getInputDir();
  if (this.player.dashTime <= 0) {
    const speedMul = (this.player._saleSpeedMul || 1);
    this.player.x += dir.x * this.player.speed * speedMul * realDt;
    this.player.y += dir.y * this.player.speed * speedMul * realDt;
  }
  if (dir.x || dir.y) this.player.angle = Math.atan2(dir.y, dir.x);

  // Лицом к ближайшему врагу в рейде
  if (this.extractPhase === 'raid' && !(dir.x || dir.y)) {
    let nearest = null;
    let best = 280;
    for (const e of this.enemies || []) {
      if (e.hp <= 0) continue;
      const d = dist(this.player.x, this.player.y, e.x, e.y);
      if (d < best) { best = d; nearest = e; }
    }
    if (nearest) this.player.angle = angleTo(this.player.x, this.player.y, nearest.x, nearest.y);
  }

  this.player.update(realDt, this.worldW, this.worldH, this);
  this.player.tickAnim(realDt, !!(dir.x || dir.y));
  this.pushOutOfObstacles(this.player, this.player.r);

  const b = this.getArenaBounds();
  const m = this.player.r + 4;
  this.player.x = Math.max(b.x0 + m, Math.min(b.x1 - m, this.player.x));
  this.player.y = Math.max(b.y0 + m, Math.min(b.y1 - m, this.player.y));

  const lead = 36;
  const targetCX = this.player.x - this.viewW() / 2 + Math.cos(this.player.angle) * lead * 0.2;
  const targetCY = this.player.y - this.viewH() / 2 + Math.sin(this.player.angle) * lead * 0.2;
  this.camera.x += (targetCX - this.camera.x) * Math.min(1, realDt * 5);
  this.camera.y += (targetCY - this.camera.y) * Math.min(1, realDt * 5);

  if (this.extractPhase === 'raid') {
    if (this.tickExtractCombat(realDt)) return;
  }

  this.tickExtractInteract(realDt);
};
