/**
 * Распродажа: Расписание забега: боссы, волны, элиты.
 */
'use strict';

Game.prototype.spawnSaleBoss = function (bossId, opts) {
  opts = opts || {};
  const def = SALE_BOSS_DEFS[bossId];
  if (!def) return null;
  const p = this.player;
  const ang = rand(0, Math.PI * 2);
  const distSpawn = opts.near ? 180 : 320;
  let x = (p ? p.x : this.worldW / 2) + Math.cos(ang) * distSpawn;
  let y = (p ? p.y : this.worldH / 2) + Math.sin(ang) * distSpawn;
  x = Math.max(60, Math.min(this.worldW - 60, x));
  y = Math.max(60, Math.min(this.worldH - 60, y));
  const m = (this.saleTime || 0) / 60;
  const run = this.getSaleArenaRun();
  const bossHp = Math.max(1, Math.round(
    Math.max(def.hp, Math.round(
      def.hp * SALE_DIFFICULTY.bossHp(m) * SALE_DIFFICULTY.mul * SALE_DIFFICULTY.warm(m)
        * (run.hpMul || 1)
    )) * (SALE_STAT_SCALE || 1)
  ));
  const e = this.spawnSaleEnemyNear(x, y, 'boss', {
    overCap: 4,
    nameTag: def.name,
    hp: bossHp,
    xpReward: def.xpReward,
    skipDiff: true,
  });
  if (!e) return null;
  e.saleBossId = def.id;
  e.speed = def.speed * saleEnemySpdScale(this.saleTime || 0) * (run.spdMul || 1);
  e.r = def.r;
  if (def.trainer) e._trainer = true;
  e.coinDrop = def.coinDrop;
  e.slashTimer = 9999; // отключаем дефолтный slash админа
  e.bossPhase = 1;
  e._saleBossCd = 1.2;
  e._saleBossCd2 = 2.8;
  e._saleBossCd3 = 3.6;
  e._saleChargeT = 0;
  e._saleChargeAng = 0;
  e.hueRotate = def.id === 'discount_king' ? 35
    : def.id === 'security_chief' ? 200
    : def.id === 'promo_witch' ? 280
    : def.id === 'cart_horde' ? 260
    : def.id === 'mall_closing' ? 0
    : def.id === 'floor_manager' ? 0
    : 15;
  e._saleFinalBoss = !!def.final;
  e._saleBossSpawnAt = this.saleTime || 0;
  this.saleBossSpawned = this.saleBossSpawned || {};
  this.saleBossSpawned[def.id] = true;
  const n = Math.min(SALE_BOSS_ORDER.length, (this.saleBossIdx || 0) + 1);
  this._eventBanner = {
    t: 4.2,
    text: (def.final ? '⚠ ФИНАЛ: ' : '⚠ ') + def.name.toUpperCase() + '!',
    sub: def.tag + ' · босс ' + n + '/' + SALE_BOSS_ORDER.length,
  };
  this.spawnAnimFx('afx_darkburst', e.x, e.y, { life: 0.75, scale: 1.6, scaleEnd: 2.2 });
  this.spawnAnimFx('afx_ring', e.x, e.y, { life: 0.5, scale: 1.0, scaleEnd: 3.0 });
  if (typeof sfx !== 'undefined' && sfx.alarm) sfx.alarm();
  return e;
};

Game.prototype.saleBossAlive = function () {
  return (this.enemies || []).some((e) => e.hp > 0 && e.saleBossId);
};

/** LN-директор боссов: один за раз, интервал 180с, после килла — gap. */
Game.prototype.tickSaleBossSchedule = function () {
  if (this.saleBossIdx == null) this.saleBossIdx = 0;
  if (this.saleBossT == null) this.saleBossT = SALE_BOSS_INTERVAL;
  if (this.saleBossIdx >= SALE_BOSS_ORDER.length) return;
  if (this.saleBossAlive()) return;
  if ((this.saleTime || 0) < this.saleBossT) return;
  const id = SALE_BOSS_ORDER[this.saleBossIdx];
  const b = this.spawnSaleBoss(id);
  if (!b) return;
  this.saleBossIdx++;
  this.saleBossT = (this.saleTime || 0) + SALE_BOSS_INTERVAL;
};

Game.prototype.applySaleBossDrop = function (bossId, x, y) {
  const drop = SALE_BOSS_DROP[bossId];
  if (!drop) return;
  const p = this.player;
  if (drop.kind === 'overflow') {
    this.saleOverflow = this.saleOverflow || {};
    this.saleOverflow[drop.id] = (this.saleOverflow[drop.id] || 0) + 1;
  } else if (drop.kind === 'powerup') {
    this.spawnSalePowerup(x, y - 28, drop.id);
  } else if (drop.kind === 'weapon_unlock') {
    this.saleRunUnlocks = this.saleRunUnlocks || [];
    if (!this.saleRunUnlocks.includes(drop.id)) this.saleRunUnlocks.push(drop.id);
  } else if (drop.kind === 'buff' && drop.id === 'walls') {
    this.obstacles = this.obstacles || [];
    this.saleTempWalls = this.saleTempWalls || [];
    if (p) {
      for (let i = 0; i < 2; i++) {
        const a = (p.angle || 0) + (i === 0 ? Math.PI / 2 : -Math.PI / 2);
        const o = {
          x: p.x + Math.cos(a) * 70 - 40, y: p.y + Math.sin(a) * 70 - 12,
          w: 80, h: 24, _saleTemp: true, _saleBossWall: true, life: 8,
        };
        this.obstacles.push(o); this.saleTempWalls.push(o);
      }
    }
  } else if (drop.kind === 'buff' && drop.id === 'puddles' && p) {
    this.salePuddles = this.salePuddles || [];
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 * i) / 4;
      this.salePuddles.push({
        x: p.x + Math.cos(a) * 70, y: p.y + Math.sin(a) * 70,
        r: 32, life: 5, dmg: this.saleFlatDmg(1), tick: 0, color: '#c026d3', slow: 0.5, poison: true,
      });
    }
  } else if (drop.kind === 'heal_max' && p) {
    p.maxHp += 1;
    p.hp = Math.min(p.maxHp, p.hp + 1);
  }
  this.showEventBanner('🎁 Босс: ' + drop.label, 2.0);
};

Game.prototype.onSaleBossKilled = function (enemy) {
  if (this.recordSaleBalanceBossKill) this.recordSaleBalanceBossKill(enemy);
  if (this.grantBossKpi) this.grantBossKpi();
  if (enemy && enemy.saleBossId) {
    this._saleBossKilled = this._saleBossKilled || {};
    this._saleBossKilled[enemy.saleBossId] = true;
  }
  if (typeof this.tryUnlockSaleCashier === 'function') this.tryUnlockSaleCashier();
  // LN kill-kit: хил + магнит + хлопушка (+ посылка уже в dropSalePowerup)
  if (this.player && this.player.hp < this.player.maxHp) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
  }
  this.spawnSalePowerup(enemy.x, enemy.y - 18, 'bomb');
  if (enemy.saleBossId) this.applySaleBossDrop(enemy.saleBossId, enemy.x, enemy.y);
  // не стакать следующего босса сразу после долгого боя
  const now = this.saleTime || 0;
  this.saleBossT = Math.max(this.saleBossT || 0, now + SALE_BOSS_GAP_AFTER_KILL);
  if (enemy._saleFinalBoss || enemy.saleBossId === 'mall_closing') {
    this.saleArenaShrink = 0;
    // финал ночи ТЦ — победа сразу после килла (не ждать таймер 20:00)
    this.showEventBanner('🏆 Тренер сдал смену!', 2.5);
    setTimeout(() => {
      if (!this.gameOver && !this.won && this.gameMode === 'sale') this.endSaleGame(true);
    }, 900);
  }
};

/** LN-пакеты: конечная угроза, не вечный тип. */
Game.prototype.doSaleWave = function (t) {
  const p = this.player;
  if (!p) return;
  const opts = ['crowd'];
  if (t > 120) opts.push('ring_fast');
  if (t > 150) opts.push('queue');
  if (t > 180) opts.push('fatty');
  if (t > 210) opts.push('managers');
  if (t > 240) opts.push('tanks');
  if (t > 280) opts.push('directors');
  if (t > 320) opts.push('mixed_horde');
  // не повторять ту же волну подряд
  let kind = opts[randi(0, opts.length - 1)];
  if (opts.length > 1 && kind === this.saleLastWaveKind) {
    kind = opts[randi(0, opts.length - 1)];
  }
  this.saleLastWaveKind = kind;

  const ring = (type, n, extra) => {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      const R = 220 + (i % 3) * 18;
      this.spawnSaleEnemyNear(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, type, Object.assign({ overCap: 16 }, extra || {}));
    }
  };
  const labels = {
    crowd: 'ТОЛПА',
    ring_fast: 'КОЛЬЦО БЫСТРЫХ',
    queue: 'ОЧЕРЕДЬ',
    fatty: 'ЖИРНЫЕ ПАКЕТЫ',
    managers: 'МЕНЕДЖЕРЫ',
    tanks: 'ОХРАНА ЗАЛА',
    directors: 'ДИРЕКТОРА',
    mixed_horde: 'ЧЁРНАЯ ПЯТНИЦА',
  };

  switch (kind) {
    case 'crowd':
      for (let i = 0; i < (t < 180 ? randi(4, 7) : randi(9, 14)); i++) this.spawnSaleEnemy('normal');
      break;
    case 'ring_fast':
      ring('fast', t < 300 ? 8 : 16, { nameTag: 'Спринтер' });
      break;
    case 'queue':
      for (let i = 0; i < (t < 300 ? randi(4, 7) : randi(7, 11)); i++) this.spawnSaleEnemy('queue');
      break;
    case 'fatty':
      for (let i = 0; i < randi(5, 8); i++) this.spawnSaleEnemy('fatty');
      break;
    case 'managers':
      for (let i = 0; i < randi(4, 6); i++) this.spawnSaleEnemy('manager');
      break;
    case 'tanks':
      for (let i = 0; i < randi(3, 5); i++) this.spawnSaleEnemy('tank');
      break;
    case 'directors':
      for (let i = 0; i < randi(1, 2); i++) {
        const e = this.spawnSaleEnemy('director');
        if (e) {
          e.maxHp = Math.max(1, Math.round(e.maxHp * 0.85));
          e.hp = e.maxHp;
          e.xpReward = Math.max(e.xpReward || 0, 10);
        }
      }
      break;
    case 'mixed_horde':
      for (let i = 0; i < 8; i++) this.spawnSaleEnemy(pick(['fast', 'queue', 'returner', 'normal']));
      for (let i = 0; i < 3; i++) this.spawnSaleEnemy(pick(['fatty', 'tank', 'manager']));
      break;
    default:
      for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
  }

  this.showEventBanner('🌊 ВОЛНА: ' + (labels[kind] || kind), 2.0);
  this.spawnAnimFx('afx_ring', p.x, p.y, { life: 0.45, scale: 1.2, scaleEnd: 3.5 });
};

Game.prototype.tickSaleElites = function (dt) {
  const t = this.saleTime || 0;
  if (t < SALE_ELITE_START) return;
  if (this.saleEliteT == null) this.saleEliteT = SALE_ELITE_START;
  this.saleEliteT -= dt;
  if (this.saleEliteT > 0) return;
  const eliteMul = (this.saleContract && this.saleContract.eliteMul) || 1;
  this.saleEliteT = SALE_ELITE_INTERVAL / Math.max(1, eliteMul);
  const n = (1 + Math.floor(t / 420)) * Math.max(1, Math.round(eliteMul));
  const pool = ['miniboss'];
  if (t > 200) pool.push('director');
  if (t > 300) pool.push('boss');
  for (let i = 0; i < n; i++) {
    const type = pool[randi(0, pool.length - 1)];
    const e = this.spawnSaleEnemy(type);
    if (!e) continue;
    e._saleElite = true;
    e.nameTag = (e.nameTag || 'Элита') + ' ★';
    e.maxHp = Math.max(1, Math.round(e.maxHp * 1.15));
    e.hp = e.maxHp;
    e.speed = (e.speed || 60) * 1.1;
    e.xpReward = Math.max(e.xpReward || 0, 12);
  }
  this.showEventBanner('⭐ Элита со склада…', 1.6);
};

/** LN-директор волн/элит (боссы — отдельно в tickSaleBossSchedule). */
Game.prototype.tickSaleDirector = function (dt) {
  if (this.saleWaveT == null) this.saleWaveT = SALE_WAVE_FIRST;
  this.saleWaveT -= dt;
  if (this.saleWaveT <= 0) {
    this.saleWaveT = SALE_WAVE_INTERVAL;
    this.doSaleWave(this.saleTime || 0);
  }
  this.tickSaleElites(dt);
};
