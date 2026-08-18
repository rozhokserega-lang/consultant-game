/**
 * Распродажа: Дроп: XP, пауэрапы, сердца, ключи эволюций, цифры урона.
 */
'use strict';

Game.prototype.dropSaleXp = function (enemy) {
  let amount = enemy.xpReward || 1;
  if (enemy.saleBossId) amount = Math.max(amount, 20);
  if (this.saleV2 && this.saleV2HasEffect && this.saleV2HasEffect('after_dark')
    && (this.saleTime || 0) >= (typeof SALE_V2_UBER_AFTER_DARK_SEC === 'number' ? SALE_V2_UBER_AFTER_DARK_SEC : 900)) {
    amount = Math.ceil(amount * 1.4);
  }
  if (enemy.type === 'boss' || enemy.type === 'director') amount = Math.max(amount, 8);
  if (enemy.type === 'fatty') amount = Math.max(amount, 4);
  const n = amount <= 2 ? 1 : amount <= 5 ? 2 : 3;
  const per = Math.ceil(amount / n);
  for (let i = 0; i < n; i++) {
    this.xpGems.push({
      x: enemy.x + rand(-18, 18),
      y: enemy.y + rand(-18, 18),
      value: per,
      r: 7 + Math.min(6, per),
      life: 25,
      vx: rand(-40, 40),
      vy: rand(-40, 40),
    });
  }
};

Game.prototype.spawnSalePowerup = function (x, y, kind, extra) {
  const def = SALE_POWERUPS[kind];
  if (!def) return;
  extra = extra || {};
  this.salePowerups = this.salePowerups || [];
  this.salePowerups.push({
    kind,
    x: Math.max(40, Math.min(this.worldW - 40, x)),
    y: Math.max(40, Math.min(this.worldH - 40, y)),
    r: extra.r || 16,
    life: extra.life != null ? extra.life : 25,
    vx: extra.vx != null ? extra.vx : rand(-50, 50),
    vy: extra.vy != null ? extra.vy : rand(-70, -20),
    fromBoss: !!extra.fromBoss,
    fromElite: !!extra.fromElite,
  });
};

Game.prototype.dropSalePowerup = function (enemy) {
  if (enemy.saleBossId) {
    // уникальный босс ТЦ — посылка + магнит (+ heal в onSaleBossKilled; bomb только в классике)
    this.spawnSalePowerup(enemy.x - 22, enemy.y, 'chest', { fromBoss: true });
    this.spawnSalePowerup(enemy.x + 22, enemy.y, 'magnet');
    this.spawnSalePowerup(enemy.x, enemy.y - 26, 'heart');
    return;
  }
  if (enemy._saleElite) {
    if (this.saleV2) {
      this.spawnSalePowerup(enemy.x, enemy.y, Math.random() < 0.5 ? 'magnet' : 'heart');
    } else {
      this.spawnSalePowerup(enemy.x, enemy.y, 'chest', { fromElite: true });
    }
    if (Math.random() < 0.55) this.spawnSalePowerup(enemy.x + rand(-16, 16), enemy.y - 18, 'heart');
    return;
  }
  const elite = enemy.type === 'boss' || enemy.type === 'director' || enemy.type === 'miniboss';
  if (!elite) return;
  if (Math.random() > 0.55) return;
  const r = Math.random();
  let kind;
  if (this.saleV2) {
    kind = r < 0.18 ? 'bomb' : r < 0.7 ? 'magnet' : 'heart';
  } else {
    kind = r < 0.45 ? 'bomb' : r < 0.8 ? 'magnet' : 'chest';
  }
  this.spawnSalePowerup(enemy.x, enemy.y, kind);
};

/** Сердца с мобов; чаще при низком HP. Кейстоун «Неотложка» добавляет шанс. */
Game.prototype.dropSaleHeart = function (enemy) {
  if (!enemy || enemy.saleBossId || enemy._saleElite) return; // уже в dropSalePowerup
  const p = this.player;
  if (!p) return;
  let chance = 0.03;
  if (p.hp < p.maxHp) chance = 0.08;
  if (p.hp <= Math.max(1, Math.ceil(p.maxHp * 0.4))) chance = 0.13;
  if (p.hp >= p.maxHp) chance *= 0.2; // почти не мусорим пол при фулл HP
  if (p.hp <= Math.max(1, Math.ceil(p.maxHp * 0.4))) {
    chance += this.saleTreeBonus('heartLow') || 0;
    if (this.saleV2) chance += this.saleV2Stat('heartLow');
  }
  if (enemy.type === 'fatty' || enemy.type === 'tank') chance += 0.04;
  if (enemy.type === 'miniboss' || enemy.type === 'director') chance += 0.12;
  if (Math.random() >= chance) return;
  this.spawnSalePowerup(enemy.x + rand(-12, 12), enemy.y + rand(-12, 12), 'heart');
};

Game.prototype.pickSaleEvoKeyDrop = function () {
  const opts = [];
  for (const ev of SALE_EVOLUTIONS) {
    const fromMax = SALE_WEAPONS[ev.from]?.max || 5;
    if ((this.saleWeapons[ev.from] || 0) < fromMax) continue;
    if (this.saleWeapons[ev.into]) continue;
    if (!ev.needPassive) continue;
    if ((this.salePassives[ev.needPassive] || 0) > 0) continue;
    if (!SALE_PASSIVES[ev.needPassive]) continue;
    opts.push(ev.needPassive);
  }
  if (!opts.length) return null;
  return opts[randi(0, opts.length - 1)];
};

Game.prototype.applySalePowerup = function (pu) {
  const p = this.player;
  if (pu.kind === 'wepcase') {
    this._saleV2WepPending = (this._saleV2WepPending || 0) + 1;
    this.showEventBanner('🧳 Чемодан с оружием: выбери одно из трёх', 1.6);
    this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.75, scale: 1.05, scaleEnd: 1.45, anchorY: 0.9 });
    sfx.level();
    this._saleLevelFxT = Math.max(this._saleLevelFxT || 0, 0.45);
  } else if (pu.kind === 'chest') {
    const t = this.saleTime || 0;
    const canEvo = !this.saleV2 && (!!pu.fromBoss || (!!pu.fromElite && t >= 360));
    if (canEvo && this.tryGrantSaleChestEvolution()) return;
    if (this.saleV2) {
      this.saleVacuumT = Math.max(this.saleVacuumT || 0, 1.4);
      this.dropCoins({ x: p.x, y: p.y, coinDrop: 8 });
      this.showEventBanner('📦 Посылка: монеты и магнит XP', 1.5);
      this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.6, scale: 1.0, scaleEnd: 1.35, anchorY: 0.9 });
      sfx.pickup();
      return;
    }
    this.pendingUpgrades = (this.pendingUpgrades || 0) + 1;
    this.showEventBanner('📦 Посылка со склада: бесплатное улучшение!', 1.8);
    this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.95, scale: 1.2, scaleEnd: 1.65, anchorY: 0.9 });
    sfx.level();
    this._saleLevelFxT = Math.max(this._saleLevelFxT || 0, 0.75);
  } else if (pu.kind === 'magnet') {
    this.saleVacuumT = 1.8;
    this.showEventBanner('🧲 Промо-магнит: весь XP летит к тебе!', 1.5);
    sfx.pickup();
  } else if (pu.kind === 'bomb') {
    const v2 = !!this.saleV2;
    const R = v2 ? 260 : 540;
    this.showEventBanner(v2 ? '🧨 Хлопушка: волна поредела' : '🧨 Хлопушка: зал зачищен!', 1.5);
    this.screenShake = Math.max(this.screenShake, 0.6);
    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x: p.x, y: p.y, life: 0.45, max: 0.45 });
    this.spawnAnimFx('afx_bigburst', p.x, p.y, { life: 0.6, scale: v2 ? 1.6 : 2.4, scaleEnd: v2 ? 2.4 : 3.6 });
    this.spawnAnimFx('afx_ring', p.x, p.y, { life: 0.5, scale: v2 ? 1.1 : 1.5, scaleEnd: v2 ? 3.2 : 5.5 });
    this.spawnParticles(p.x, p.y, v2 ? 28 : 60, '#ff6b00', v2 ? 280 : 480, 0.9);
    this.vibrate([50, 40, 70]);
    sfx.hurt();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (dist(p.x, p.y, e.x, e.y) > R) continue;
      const elite = e.type === 'boss' || e.type === 'director' || e.type === 'miniboss';
      let dmg;
      if (v2) {
        dmg = e.saleBossId || elite
          ? this.saleFlatDmg(8)
          : Math.max(1, Math.round(e.maxHp * 0.4));
      } else {
        dmg = this.saleFlatDmg(e.saleBossId ? 12 : elite ? 20 : 999);
      }
      this.saleHitEnemy(e, dmg, p.x, p.y, 300, { impact: 'sp_fwave2', color: '#ff6b00', raw: true, source: 'bomb' });
    }
  } else if (pu.kind === 'heart') {
    let heal = 1;
    if (this.saleV2 && this.saleV2HasEffect && this.saleV2HasEffect('heart_boost')) {
      heal = 2;
      if (p.slowTimer) p.slowTimer = 0;
      if (p.muteAttack) p.muteAttack = 0;
    }
    p.hp = Math.min(p.maxHp, p.hp + heal);
    if (this._saleBal) {
      this._saleBal.totals.hearts = (this._saleBal.totals.hearts || 0) + 1;
      if (this._saleBal._acc) this._saleBal._acc.hearts = (this._saleBal._acc.hearts || 0) + 1;
    }
    this.spawnAnimFx('afx_heal', p.x, p.y - 10, { life: 0.45, scale: 0.75, vy: -18 });
    this.spawnParticles(p.x, p.y, 10, '#e11d48', 100, 0.35);
    sfx.pickup();
  }
};

Game.prototype.updateSalePowerups = function (dt) {
  const p = this.player;
  this.salePowerups = this.salePowerups || [];
  for (const pu of this.salePowerups) {
    pu.life -= dt;
    pu.x += (pu.vx || 0) * dt;
    pu.y += (pu.vy || 0) * dt;
    pu.vx *= 0.9;
    pu.vy *= 0.9;
    if (!p) continue;
    const d = dist(p.x, p.y, pu.x, pu.y);
    // чемодан с оружием не притягивается — надо подойти
    if (d < 110 && pu.kind !== 'wepcase') {
      const a = angleTo(pu.x, pu.y, p.x, p.y);
      const pull = (110 - d) * 4 * dt;
      pu.x += Math.cos(a) * pull;
      pu.y += Math.sin(a) * pull;
    }
    if (d < p.r + pu.r) {
      pu.dead = true;
      this.applySalePowerup(pu);
    }
  }
  this.salePowerups = this.salePowerups.filter((pu) => !pu.dead && pu.life > 0);
};

Game.prototype.pushSaleDmgNum = function (x, y, dmg) {
  if (this.showDmgNumbers === false) return;
  this.saleDmgNums = this.saleDmgNums || [];
  if (this.saleDmgNums.length > 48) this.saleDmgNums.shift();
  this.saleDmgNums.push({
    x: x + rand(-6, 6),
    y,
    txt: String(dmg),
    big: dmg >= 25,
    life: 0.65,
    max: 0.65,
    vy: -52,
  });
};
