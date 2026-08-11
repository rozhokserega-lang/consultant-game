/**
 * Распродажа: Нанесение урона врагам и поиск ближайшей цели.
 */
'use strict';

Game.prototype.saleHitEnemy = function (e, dmg, srcX, srcY, knock, opts) {
  opts = opts || {};
  if (e._saleInvuln && this.saleInvulnExcept && e.type !== this.saleInvulnExcept) {
    this.spawnSpriteFx('fx_shield', e.x, e.y - 6, { scale: 0.35, life: 0.12, vy: -6 });
    return false;
  }
  if (opts.mark) e._saleMarked = Math.max(e._saleMarked || 0, opts.mark);
  if ((e._saleMarked || 0) > 0) {
    let markMul = 1.3;
    if (this.salePassives.sticker) markMul += this.salePassives.sticker * 0.12;
    if (this.saleSynergyOn('markAura') && opts.fromAura) markMul += 0.25;
    dmg = Math.max(1, Math.round(dmg * markMul));
  }
  const floor = this.getSaleFloor();
  if (knock) {
    if (this.salePassives.guard_pass) knock *= 1 + this.salePassives.guard_pass * 0.10;
    if (floor && floor.knockMul) knock *= floor.knockMul;
  }
  // цифры и лог = реально снятое HP (не «бумажный» урон и не оверкилл)
  const hpBefore = Math.max(0, e.hp || 0);
  const died = e.hit(dmg, srcX, srcY, knock || 140, opts.stun || 0);
  const dealt = Math.max(0, hpBefore - Math.max(0, e.hp || 0));
  if (dealt > 0 && this.recordSaleBalanceDmg) {
    this.recordSaleBalanceDmg(dealt, opts.weapon || opts.source || 'other');
  }
  if (dealt > 0) this.pushSaleDmgNum(e.x, e.y - e.r - 6, dealt);
  if (opts.confuse && !died) {
    e._saleConfuse = Math.max(e._saleConfuse || 0, opts.confuse);
  }
  if (opts.lifesteal && died && this.player.hp < this.player.maxHp) {
    // вампиризм только с убийства + общий КД — нельзя AFK-хилиться с ауры
    if ((this._saleLsCd || 0) <= 0 && Math.random() < opts.lifesteal) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      this._saleLsCd = SALE_LIFESTEAL_CD;
      this.spawnAnimFx('afx_heal', this.player.x, this.player.y - 10, { life: 0.45, scale: 0.7, vy: -20 });
    }
  }
  if (died) {
    const budget = this._fxBudget();
    const pCount = Math.round(8 * budget);
    if (pCount > 0) this.spawnParticles(e.x, e.y, pCount, opts.color || '#e74c3c', 140, 0.35);
    if (opts.impact && budget >= 0.55) this.spawnSpriteFx(opts.impact, e.x, e.y, { scale: 0.35, life: 0.28, vy: -8 });
    this.onSaleEnemyKilled(e);
    if (opts.explodeOnKill || this.saleWeapons.black_friday) {
      this.salePuddles.push({ x: e.x, y: e.y, r: 55, life: 2.5, dmg: 1, tick: 0, color: '#8e0000' });
      if (budget >= 0.55) this.spawnSpriteFx('sp_bleed3', e.x, e.y, { scale: 0.4, life: 0.35, vy: 0 });
    }
  } else if (Math.random() < 0.35 * this._fxBudget()) {
    this.spawnAnimFx('afx_hit', e.x, e.y - 4, { life: 0.22, scale: 0.55, rot: rand(-0.4, 0.4) });
  }
  return died;
};

Game.prototype.nearestSaleEnemy = function (x, y, maxDist) {
  let best = null; let bd = maxDist || 1e9;
  for (const e of this.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(x, y, e.x, e.y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
};

Game.prototype.applySaleFragileExtra = function () {
  if (!this.saleFragile || !this.player || this.player.hp <= 0) return false;
  this.player.hp -= 1;
  if (this.recordSaleBalanceHurt) this.recordSaleBalanceHurt(1);
  if (this.player.hp <= 0) {
    if ((this.player.extraLives || 0) > 0) {
      this.player.extraLives -= 1;
      this.player.hp = Math.max(1, Math.ceil(this.player.maxHp * 0.5));
      this.player.invincible = 2.2;
      return false;
    }
    this.endSaleGame(false, 'Распродажа оружия (хрупкость)');
    return true;
  }
  return false;
};
