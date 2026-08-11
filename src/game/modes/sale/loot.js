/**
 * Распродажа: Дроп: XP, пауэрапы, сердца, ключи эволюций, цифры урона.
 */
'use strict';

Game.prototype.dropSaleXp = function (enemy) {
  let amount = enemy.xpReward || 1;
  if (enemy.saleBossId) amount = Math.max(amount, 20);
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

Game.prototype.spawnSalePowerup = function (x, y, kind) {
  const def = SALE_POWERUPS[kind];
  if (!def) return;
  this.salePowerups = this.salePowerups || [];
  this.salePowerups.push({
    kind,
    x: Math.max(40, Math.min(this.worldW - 40, x)),
    y: Math.max(40, Math.min(this.worldH - 40, y)),
    r: 16,
    life: 25,
    vx: rand(-50, 50),
    vy: rand(-70, -20),
  });
};

Game.prototype.dropSalePowerup = function (enemy) {
  if (enemy.saleBossId) {
    // уникальный босс ТЦ — гарантированная посылка + магнит (+ bomb/heal в onSaleBossKilled)
    this.spawnSalePowerup(enemy.x - 22, enemy.y, 'chest');
    this.spawnSalePowerup(enemy.x + 22, enemy.y, 'magnet');
    this.spawnSalePowerup(enemy.x, enemy.y - 26, 'heart');
    return;
  }
  if (enemy._saleElite) {
    this.spawnSalePowerup(enemy.x, enemy.y, 'chest');
    if (Math.random() < 0.55) this.spawnSalePowerup(enemy.x + rand(-16, 16), enemy.y - 18, 'heart');
    return;
  }
  const elite = enemy.type === 'boss' || enemy.type === 'director' || enemy.type === 'miniboss';
  if (!elite) return;
  if (Math.random() > 0.55) return;
  const r = Math.random();
  const kind = r < 0.45 ? 'bomb' : r < 0.8 ? 'magnet' : 'chest';
  this.spawnSalePowerup(enemy.x, enemy.y, kind);
};

/** LN-style: хил с мобов; чаще при низком HP / с аптечкой (у LN ~0.2%, у нас щедрее — HP мало). */
Game.prototype.dropSaleHeart = function (enemy) {
  if (!enemy || enemy.saleBossId || enemy._saleElite) return; // уже в dropSalePowerup
  const p = this.player;
  if (!p) return;
  let chance = 0.03;
  if (p.hp < p.maxHp) chance = 0.08;
  if (p.hp <= Math.max(1, Math.ceil(p.maxHp * 0.4))) chance = 0.13;
  if (p.hp >= p.maxHp) chance *= 0.2; // почти не мусорим пол при фулл HP
  const med = this.salePassives.medkit || this.salePassives.regen || 0;
  chance += med * 0.02;
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
  if (pu.kind === 'chest') {
    // редко: ключ эво вместо/вместе с апгрейдом
    if (Math.random() < 0.28) {
      const key = this.pickSaleEvoKeyDrop();
      if (key && SALE_PASSIVES[key]) {
        this.salePassives[key] = (this.salePassives[key] || 0) + 1;
        this.applySalePassivesToPlayer();
        this.showEventBanner(`📦 В посылке ключ: ${SALE_PASSIVES[key].name}!`, 2.0);
        this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.65, scale: 0.9, scaleEnd: 1.3 });
        sfx.level();
        return;
      }
    }
    this.pendingUpgrades = (this.pendingUpgrades || 0) + 1;
    this.showEventBanner('📦 Посылка со склада: бесплатное улучшение!', 1.8);
    this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.65, scale: 0.9, scaleEnd: 1.3 });
    sfx.level();
    this.openSaleUpgradeUI();
  } else if (pu.kind === 'magnet') {
    this.saleVacuumT = 1.8;
    this.showEventBanner('🧲 Промо-магнит: весь XP летит к тебе!', 1.5);
    sfx.pickup();
  } else if (pu.kind === 'bomb') {
    const R = 540;
    this.showEventBanner('🧨 Хлопушка: зал зачищен!', 1.5);
    this.screenShake = Math.max(this.screenShake, 0.6);
    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x: p.x, y: p.y, life: 0.45, max: 0.45 });
    this.spawnAnimFx('afx_bigburst', p.x, p.y, { life: 0.6, scale: 2.4, scaleEnd: 3.6 });
    this.spawnAnimFx('afx_ring', p.x, p.y, { life: 0.5, scale: 1.5, scaleEnd: 5.5 });
    this.spawnParticles(p.x, p.y, 60, '#ff6b00', 480, 0.9);
    this.vibrate([50, 40, 70]);
    sfx.hurt();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (dist(p.x, p.y, e.x, e.y) > R) continue;
      const dmg = this.saleFlatDmg(
        e.saleBossId ? 12 : (e.type === 'boss' || e.type === 'director' || e.type === 'miniboss') ? 20 : 999
      );
      this.saleHitEnemy(e, dmg, p.x, p.y, 300, { impact: 'sp_fwave2', color: '#ff6b00', raw: true, source: 'bomb' });
    }
  } else if (pu.kind === 'heart') {
    p.hp = Math.min(p.maxHp, p.hp + 1);
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
    // лёгкий магнит на пауэрапы
    if (d < 110) {
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
