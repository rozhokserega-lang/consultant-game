/**
 * Распродажа: Главный тик режима: порядок обновления систем за кадр.
 */
'use strict';

Game.prototype.updateSale = function (dt) {
  if (this.isBoostersOpen() || this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) return;
  if (this.__saleDevOpen) return;
  const scale = this.__saleTimeScale || 1;
  const realDt = Math.min(dt, 0.1) * scale;
  music.setIntensity(this.saleTime > SALE_DURATION * 0.75 ? 'boss' : 'rush');

  this.saleTime += realDt;
  if (this.tickSaleBalanceLog) this.tickSaleBalanceLog(realDt);
  if (this._saleLsCd > 0) this._saleLsCd -= realDt;
  if (this.saleTime >= SALE_DURATION) {
    this.endSaleGame(true);
    return;
  }

  // минутные события ТЦ
  this.tickSaleEvents(realDt);

  // timers inherited from shift events
  if (this.lightsOut > 0) this.lightsOut -= realDt;
  if (this.fireAlarm > 0) this.fireAlarm -= realDt;
  if (this._eventBanner) {
    this._eventBanner.t -= realDt;
    if (this._eventBanner.t <= 0) this._eventBanner = null;
  }
  if (this.modeFlash > 0) this.modeFlash -= realDt;

  // regen
  const regenLv = this.salePassives.medkit || this.salePassives.regen || 0;
  if (regenLv > 0) {
    this.saleRegenTimer += realDt;
    const every = Math.max(4, 12 - regenLv * 2.5);
    if (this.saleRegenTimer >= every) {
      this.saleRegenTimer = 0;
      if (this.player.hp < this.player.maxHp) this.player.hp++;
    }
  }

  if (this._saleAura) { this._saleAura.t -= realDt; if (this._saleAura.t <= 0) this._saleAura = null; }
  if (this._saleNova) { this._saleNova.t -= realDt; if (this._saleNova.t <= 0) this._saleNova = null; }

  const zone = this.zoneAt(this.player.x, this.player.y);
  let slip = zone && zone.type === 'slippery' ? 1.35 : 1;
  const speedMul = this.player._saleSpeedMul || 1;

  const dir = this.getInputDir();
  if (this.player.dashTime <= 0) {
    this.player.x += dir.x * this.player.speed * slip * speedMul * realDt;
    this.player.y += dir.y * this.player.speed * slip * speedMul * realDt;
  }
  if (dir.x || dir.y) this.player.angle = Math.atan2(dir.y, dir.x);

  // look at nearest for facing even when idle
  let nearest = null; let best = 280;
  for (const e of this.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(this.player.x, this.player.y, e.x, e.y);
    if (d < best) { best = d; nearest = e; }
  }
  if (nearest && !(dir.x || dir.y)) {
    this.player.angle = angleTo(this.player.x, this.player.y, nearest.x, nearest.y);
  }

  this.player.update(realDt, this.worldW, this.worldH, this);
  this.player.tickAnim(realDt, !!(dir.x || dir.y));
  this.pushOutOfObstacles(this.player, this.player.r);

  const lead = 40;
  const targetCX = this.player.x - this.viewW() / 2 + Math.cos(this.player.angle) * lead * 0.25;
  const targetCY = this.player.y - this.viewH() / 2 + Math.sin(this.player.angle) * lead * 0.25;
  this.camera.x += (targetCX - this.camera.x) * Math.min(1, realDt * 5);
  this.camera.y += (targetCY - this.camera.y) * Math.min(1, realDt * 5);

  // spawn — трикл fodder; при живом боссе урезаем burst, чтобы босс читался
  this.saleSpawnAcc += realDt;
  const interval = saleSpawnInterval(this.saleTime) * (this.saleSpawnMul || 1);
  const bossAlive = this.saleBossAlive();
  while (this.saleSpawnAcc >= interval) {
    this.saleSpawnAcc -= interval;
    let burst = saleSpawnBurst(this.saleTime);
    if (bossAlive) burst = Math.max(1, Math.floor(burst * 0.55));
    for (let i = 0; i < burst; i++) this.spawnSaleEnemy();
  }

  // LN-директор: пакетные волны + элиты; боссы one-at-a-time
  this.tickSaleDirector(realDt);
  this.tickSaleBossSchedule();

  // enemies always chase in sale
  for (const enemy of this.enemies) {
    if (this.saleEvacMode === 'flee') {
      const toL = enemy.x;
      const toR = this.worldW - enemy.x;
      const toT = enemy.y;
      const toB = this.worldH - enemy.y;
      let ax = 0; let ay = 0;
      const m = Math.min(toL, toR, toT, toB);
      if (m === toL) ax = -1;
      else if (m === toR) ax = 1;
      else if (m === toT) ay = -1;
      else ay = 1;
      const spd = enemy.speed * 1.5 * realDt;
      enemy.x += ax * spd;
      enemy.y += ay * spd;
      enemy.angle = Math.atan2(ay, ax);
      clampEntityToArena(enemy, this.worldW, this.worldH, this);
    } else {
      // во время телеграфа рывка босс стоит — иначе пунктир не читается
      if (!(enemy.saleBossId && enemy._saleChargeT > 0)) {
        enemy.update(realDt, this.player, this.worldW, this.worldH, true, this);
      }
      if (enemy.saleBossId) this.tickSaleBossAI(enemy, realDt);
    }
    this.pushOutOfObstacles(enemy, enemy.r);

    const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
    const hitR = this.player.r + enemy.r - 2;
    if (d < hitR) {
      if (enemy.noDamage || enemy.type === 'child') {
        const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
        this.player.knockback.x += Math.cos(a) * 140;
        this.player.knockback.y += Math.sin(a) * 140;
      } else if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
        // турникет: краткий блок контакта
        if ((this._saleShieldT || 0) > 0 && Math.random() < 0.65) {
          this.spawnAnimFx('afx_ring', this.player.x, this.player.y, { life: 0.2, scale: 0.4, scaleEnd: 0.9, tint: '#94a3b8' });
          const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
          enemy.knockback = enemy.knockback || { x: 0, y: 0 };
          enemy.knockback.x -= Math.cos(a) * 180;
          enemy.knockback.y -= Math.sin(a) * 180;
        } else if (this.player.takeDamage(enemy.x, enemy.y)) {
          this.endSaleGame(false, enemy.nameTag || 'Покупатель');
          return;
        } else {
          this.tookDamage = true;
          sfx.hurt();
          this.vibrate(40);
          if (this.applySaleFragileExtra()) return;
        }
      }
    }
  }

  if (this.tickSaleBossHazards(realDt)) return;

  // книги жалоб / снаряды боссов
  for (const pr of this.projectiles) {
    pr.update(realDt);
    if (!pr.dead && dist(pr.x, pr.y, this.player.x, this.player.y) < this.player.r + pr.r) {
      pr.dead = true;
      if (pr._saleBossShot) {
        if (this.saleBossHurtPlayer(pr.x, pr.y, pr._saleBossKill || 'Босс')) return;
        this.spawnParticles(this.player.x, this.player.y, 12, '#e74c3c', 140, 0.4);
      } else {
        // Раньше applyComplaint() от рядовых/потолка — постоянный slow бесил.
        // Теперь без slow: только лёгкий FX (книги события «книга жалоб»).
        this.spawnParticles(this.player.x, this.player.y, 8, '#8e44ad', 100, 0.3);
        sfx.pickup();
      }
    }
  }
  this.projectiles = this.projectiles.filter((pr) => !pr.dead);

  // auto weapons (орбиты, снаряды, лучи…)
  this.updateSaleWeapons(realDt);
  this.updateSaleOrbits(realDt);
  this.updateSaleSwords(realDt);
  this.updateSaleRings(realDt);
  this.updateSaleBoomerangs(realDt);
  this.updateSaleProjectiles(realDt);
  this.updateSaleCharges(realDt);
  this.updateSaleSeekers(realDt);
  this.updateSaleBeams(realDt);
  if (this.updateSalePuddles(realDt)) return;

  // fuse bombs
  for (const bomb of this.fuseBombs) {
    bomb.life -= realDt;
    if (bomb.life <= 0 && !bomb.exploded) {
      bomb.exploded = true;
      if (this.explodeAt(bomb.x, bomb.y)) return;
    }
  }
  this.fuseBombs = this.fuseBombs.filter((b) => !b.exploded);

  this.enemies = this.enemies.filter((e) => e.hp > 0);

  // пауэрапы (посылка / магнит / хлопушка)
  this.updateSalePowerups(realDt);

  // цифры урона
  if (this.saleDmgNums && this.saleDmgNums.length) {
    for (const dn of this.saleDmgNums) {
      dn.life -= realDt;
      dn.y += dn.vy * realDt;
    }
    this.saleDmgNums = this.saleDmgNums.filter((dn) => dn.life > 0);
  }

  // XP gems
  if (this.saleVacuumT > 0) this.saleVacuumT -= realDt;
  const vacuum = this.saleVacuumT > 0;
  const mag = vacuum ? 1e9 : this.saleMagnetRange();
  for (const g of this.xpGems) {
    g.life -= realDt;
    g.x += (g.vx || 0) * realDt;
    g.y += (g.vy || 0) * realDt;
    g.vx *= 0.92; g.vy *= 0.92;
    const d = dist(this.player.x, this.player.y, g.x, g.y);
    if (d < mag) {
      const pull = vacuum
        ? 1200 * realDt
        : Math.min(1, (mag - d) / mag) * 420 * realDt;
      const a = angleTo(g.x, g.y, this.player.x, this.player.y);
      g.x += Math.cos(a) * Math.min(d, pull);
      g.y += Math.sin(a) * Math.min(d, pull);
    }
    if (d < this.player.r + g.r) {
      g.dead = true;
      this.gainSaleXp(g.value || 1);
      sfx.pickup();
    }
  }
  this.xpGems = this.xpGems.filter((g) => !g.dead && g.life > 0);

  // coin pickups (reuse)
  for (const pk of this.pickups) {
    pk.update(realDt, this.player);
    if (!pk.dead && dist(this.player.x, this.player.y, pk.x, pk.y) < this.player.r + pk.r + 8) {
      if (pk.type === 'coin' || pk.type === 'coins') {
        const wallet = 1 + (this.salePassives.wallet || 0) * 0.15
          + (this.salePassives.ribbon || 0) * 0.10;
        const warmCoins = saleCoinWarmMul(this.saleTime || 0);
        const gain = Math.ceil((pk.value || 1) * wallet * (this.coinMult || 1) * warmCoins);
        this.coins += gain;
        if (this.recordSaleBalanceGold) this.recordSaleBalanceGold(gain);
        pk.life = 0;
        sfx.pickup();
      } else if (pk.type === 'heal' && this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        pk.life = 0;
        sfx.pickup();
      } else if (pk.type === 'lunch') {
        this.player.applyLunch();
        pk.life = 0;
        sfx.pickup();
      }
    }
  }
  this.pickups = this.pickups.filter((p) => !p.dead);

  if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt);
  for (const p of this.particles) p.update(realDt);
  this.particles = this.particles.filter((p) => !p.dead);
  for (const b of this.boomFx) b.life -= realDt;
  this.boomFx = this.boomFx.filter((b) => b.life > 0);
  this.tickSpriteFx(realDt);

  // линейные удары босса (телеграф → удар → исчезновение)
  if (this.updateBossLineAttacks(realDt)) return;
  // баннер/FX второй жизни (в «Смене» это было в core/update, тут update подменён)
  if (this.flushReviveFx) this.flushReviveFx();
};
