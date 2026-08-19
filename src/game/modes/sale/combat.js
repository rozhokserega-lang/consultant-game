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
    if (this.saleV2) markMul += this.saleV2Stat('mark');
    else if (this.salePassives.sticker) markMul += this.salePassives.sticker * 0.10;
    markMul += this.saleTreeBonus('mark') || 0;
    if (this.saleSynergyOn('markAura') && opts.fromAura) markMul += 0.25;
    dmg = Math.max(1, Math.round(dmg * markMul));
  }
  const floor = this.getSaleFloor();
  if (knock) {
    if (this.saleV2) knock *= 1 + this.saleV2Stat('knock');
    else if (this.salePassives.guard_pass) knock *= 1 + this.salePassives.guard_pass * 0.12;
    if (floor && floor.knockMul) knock *= floor.knockMul;
  }
  // цифры и лог = реально снятое HP (не «бумажный» урон и не оверкилл)
  const hpBefore = Math.max(0, e.hp || 0);
  this._saleLastCrit = false;
  if (this.saleV2 && !opts.echo) {
    const crit = this.saleV2Stat('crit');
    if (crit > 0 && Math.random() < crit) {
      dmg = Math.max(1, Math.round(dmg * 2));
      this._saleLastCrit = true;
    }
  }
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
      this.saleApplyHeal(saleHp(1));
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
      this.salePuddles.push({ x: e.x, y: e.y, r: 55, life: 2.5, dmg: this.saleFlatDmg(1), tick: 0, color: '#8e0000' });
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

Game.prototype.saleHurtKindFromEnemy = function (enemy) {
  if (!enemy) return 'trash';
  if (enemy.saleBossId || enemy.type === 'boss' || enemy.type === 'director') return 'boss';
  if (enemy._saleElite || enemy.type === 'miniboss') return 'elite';
  if (enemy.type === 'fatty' || enemy.type === 'tank' || enemy.explodes) return 'fatty';
  return 'trash';
};

Game.prototype.saleIncomingDmg = function (kind) {
  if (!this.saleV2) return typeof SALE_HIT_DMG === 'number' ? SALE_HIT_DMG : 1;
  let base = SALE_HIT_TRASH;
  if (kind === 'boss') base = SALE_HIT_BOSS;
  else if (kind === 'elite') base = SALE_HIT_ELITE;
  else if (kind === 'fatty' || kind === 'tank') base = SALE_HIT_FATTY;
  const m = (this.saleTime || 0) / 60;
  const timeMul = typeof saleTimeHitMul === 'function' ? saleTimeHitMul(m) : (1 + 0.10 * m);
  return Math.max(1, Math.round(base * timeMul));
};

Game.prototype.saleArmorMitigate = function (amount) {
  const dmg = Math.max(0, Math.round(amount || 0));
  if (!this.saleV2) return dmg;
  const armor = this.saleV2Stat('armor') || 0;
  return Math.max(0, dmg - armor);
};

/**
 * Урон игроку в Распродаже. true = умер (забег уже завершён).
 * После брони 0 — без iframe и звука.
 */
Game.prototype.saleHurtPlayer = function (fromX, fromY, kind, killName) {
  const p = this.player;
  if (!p || this.__god) return false;
  if (p.invincible > 0 || p.lunchTimer > 0) return false;
  const amount = this.saleIncomingDmg(kind || 'trash');
  if (this.saleArmorMitigate(amount) <= 0) return false;
  if (p.takeDamage(fromX, fromY, amount)) {
    this.endSaleGame(false, killName || 'Покупатель');
    return true;
  }
  this.tookDamage = true;
  if (typeof sfx !== 'undefined' && sfx.hurt) sfx.hurt();
  if (this.vibrate) this.vibrate(40);
  return this.applySaleFragileExtra ? this.applySaleFragileExtra() : false;
};

Game.prototype.applySaleFragileExtra = function () {
  if (!this.saleFragile || !this.player || this.player.hp <= 0) return false;
  // смертельный удар уже потратил вторую жизнь в takeDamage — не добиваем тем же хитом
  if (this.player._justRevived) return false;
  const extra = saleHp(1);
  this.player.hp -= extra;
  this.pushSalePlayerHpNum(-extra);
  if (this.recordSaleBalanceHurt) this.recordSaleBalanceHurt(extra);
  if (this.player.hp <= 0) {
    if ((this.player.extraLives || 0) > 0) {
      this.player.extraLives -= 1;
      this.player.hp = Math.max(1, Math.ceil(this.player.maxHp * 0.5));
      this.player.invincible = 2.2;
      this.player._justRevived = true;
      if (this.recordSaleBalanceRevive) this.recordSaleBalanceRevive();
      return false;
    }
    this.endSaleGame(false, 'Распродажа оружия (хрупкость)');
    return true;
  }
  return false;
};
