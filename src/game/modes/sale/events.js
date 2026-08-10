/**
 * Распродажа: Минутные события ТЦ: запуск, модификаторы, тик.
 */
'use strict';

Game.prototype.clearSaleEventModifiers = function () {
  this.saleMobSpeedMul = 1;
  this.saleSpawnMul = 1;
  this.saleXpEventMul = 1;
  this.saleWeaponDmgMul = 1;
  this.saleFragile = false;
  this.saleForceTypes = null;
  this.saleInvulnExcept = null;
  this.saleEvacMode = null;
  this.saleEventAcc = 0;
  this.saleVipRef = null;
  if (this.saleTempWalls && this.saleTempWalls.length) {
    const temps = new Set(this.saleTempWalls);
    this.obstacles = (this.obstacles || []).filter((o) => !temps.has(o) && !o._saleTemp);
    this.saleTempWalls = [];
  }
  for (const e of this.enemies || []) {
    e._saleInvuln = false;
  }
};

Game.prototype.endSaleEvent = function () {
  this.clearSaleEventModifiers();
  this.saleActiveEvent = null;
};

Game.prototype.startSaleEvent = function (id) {
  this.endSaleEvent();
  const p = this.player;
  const banners = {
    queue_rush: '👥 НАПЛЫВ ОЧЕРЕДИ!',
    triple_boss: '👔 ТРОЙКА АДМИНОВ!',
    black_friday: '🏷 ЧЁРНАЯ ПЯТНИЦА! Все ускорились',
    lights_out: '💡 СВЕТ ВЫКЛЮЧИЛИ!',
    fire_dept: '🔥 ПОЖАР В ОТДЕЛЕ!',
    inventory: '📋 ИНВЕНТАРИЗАЦИЯ! Бей только отмеченных',
    vip_day: '👑 VIP-ДЕНЬ! Пока жив VIP — толпа быстрее',
    xp_discount: '💸 СКИДКА −50% НА XP',
    xp_double: '✨ ДВОЙНОЙ XP!',
    evacuation: '🚨 ЭВАКУАЦИЯ! Сначала бегут, потом навалятся',
    complaint_book: '📕 КНИГА ЖАЛОБ С ПОТОЛКА!',
    security_walls: '🚧 ОХРАНА ЗАКРЫЛА ПРОХОДЫ!',
    happy_hour: '💎 СЧАСТЛИВЫЙ ЧАС! Гемы в центре',
    checkout_hall: '🧾 КАССОВЫЙ ЗАЛ! Только очереди',
    director_call: '📞 ДИРЕКТОР НА СВЯЗИ! Линии с краёв',
    weapon_sale: '⚔ РАСПРОДАЖА ОРУЖИЯ! ×2 урон, ×2 входящий',
    mall_closing: '🔒 ЗАКРЫТИЕ ТЦ! Всё сразу',
  };
  const durations = {
    queue_rush: 10, triple_boss: 12, black_friday: 30, lights_out: 22,
    fire_dept: 28, inventory: 16, vip_day: 40, xp_discount: 25, xp_double: 25,
    evacuation: 18, complaint_book: 22, security_walls: 24, happy_hour: 14,
    checkout_hall: 28, director_call: 26, weapon_sale: 20, mall_closing: 55,
  };
  const dur = durations[id] || 20;
  this.saleActiveEvent = { id, t: dur, max: dur };
  this.saleLastEventId = id;
  this.modeFlash = Math.max(this.modeFlash || 0, 0.7);
  if (typeof this.showEventBanner === 'function') {
    this.showEventBanner(banners[id] || ('Событие: ' + id), Math.min(3.2, dur * 0.2));
  }
  sfx.mode();

  if (id === 'queue_rush') {
    const n = 14 + randi(0, 6);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      const r = 140 + rand(0, 50);
      this.spawnSaleEnemyNear(
        p.x + Math.cos(a) * r,
        p.y + Math.sin(a) * r,
        Math.random() < 0.55 ? 'queue' : 'normal',
        { nameTag: 'Очередь', overCap: 12 }
      );
    }
  } else if (id === 'triple_boss') {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.9;
      const e = this.spawnSaleEnemyNear(
        p.x + Math.cos(a) * 220,
        p.y + Math.sin(a) * 220,
        i === 1 ? 'boss' : 'miniboss',
        { nameTag: i === 1 ? 'Админ' : 'Зам. админа', hpMul: 0.42, xpReward: 10, overCap: 8 }
      );
      if (e) e.speed *= 0.85;
    }
  } else if (id === 'black_friday') {
    this.saleMobSpeedMul = 1.5;
    this.saleSpawnMul = 0.55;
    this.fireAlarm = Math.max(this.fireAlarm, dur);
    for (let i = 0; i < 8; i++) this.spawnSaleEnemy();
  } else if (id === 'lights_out') {
    this.lightsOut = Math.max(this.lightsOut, dur);
  } else if (id === 'fire_dept') {
    this.fireAlarm = Math.max(this.fireAlarm, dur * 0.6);
    this.saleSpawnMul = 0.75;
    for (let i = 0; i < 5; i++) {
      const e = this.spawnSaleEnemy('fatty');
      if (e) e.nameTag = 'Горючее';
    }
    this._saleSeedFirePuddles(6);
  } else if (id === 'inventory') {
    const types = {};
    for (const e of this.enemies) {
      if (e.hp > 0) types[e.type] = (types[e.type] || 0) + 1;
    }
    const keys = Object.keys(types);
    const except = keys.length ? keys[randi(0, keys.length - 1)] : 'normal';
    this.saleInvulnExcept = except;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e._saleInvuln = e.type !== except;
    }
    const labels = {
      normal: 'обычных', fast: 'быстрых', tank: 'танков', fatty: 'жирных',
      queue: 'очередь', returner: 'жалобщиков', manager: 'менеджеров',
      boss: 'боссов', miniboss: 'минибоссов', director: 'директора',
    };
    if (typeof this.showEventBanner === 'function') {
      this.showEventBanner(`📋 Уязвимы: ${labels[except] || except}`, 3.5);
    }
  } else if (id === 'vip_day') {
    const vip = this.spawnSaleEnemyNear(p.x + 200, p.y - 160, 'boss', {
      nameTag: 'VIP-клиент', hpMul: 1.8, xpReward: 18, vip: true, overCap: 4,
    });
    this.saleVipRef = vip;
    this.saleMobSpeedMul = 1.35;
  } else if (id === 'xp_discount') {
    this.saleXpEventMul = 0.5;
  } else if (id === 'xp_double') {
    this.saleXpEventMul = 2;
  } else if (id === 'evacuation') {
    this.saleEvacMode = 'flee';
    this.saleActiveEvent.fleeT = 8;
  } else if (id === 'complaint_book') {
    this.saleEventAcc = 0;
  } else if (id === 'security_walls') {
    this._saleSpawnTempWalls();
  } else if (id === 'happy_hour') {
    const cx = this.worldW * 0.5;
    const cy = this.worldH * 0.5;
    for (let i = 0; i < 18; i++) {
      this.xpGems.push({
        x: cx + rand(-90, 90), y: cy + rand(-70, 70),
        value: 2 + randi(0, 2), r: 10, life: 30, vx: rand(-20, 20), vy: rand(-20, 20),
      });
    }
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      this.spawnSaleEnemyNear(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160, 'fast', {
        nameTag: 'Охотник за скидкой', overCap: 14,
      });
    }
  } else if (id === 'checkout_hall') {
    this.saleForceTypes = ['queue', 'normal', 'normal'];
    this.saleSpawnMul = 0.5;
    for (let i = 0; i < 12; i++) this.spawnSaleEnemy();
  } else if (id === 'director_call') {
    this.saleEventAcc = 0.5;
  } else if (id === 'weapon_sale') {
    this.saleWeaponDmgMul = 2;
    this.saleFragile = true;
  } else if (id === 'mall_closing') {
    this.saleMobSpeedMul = 1.45;
    this.saleSpawnMul = 0.45;
    this.fireAlarm = Math.max(this.fireAlarm, 40);
    this.lightsOut = Math.max(this.lightsOut, 12);
    this.saleWeaponDmgMul = 1.5;
    this.saleFragile = true;
    this._saleSeedFirePuddles(8);
    for (let i = 0; i < 2; i++) {
      this.spawnSaleEnemyNear(p.x + (i ? 240 : -240), p.y - 180, 'boss', {
        nameTag: 'Охрана закрытия', hpMul: 0.55, xpReward: 12, overCap: 6,
      });
    }
    for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
    this.saleEventAcc = 0;
  }
};

Game.prototype._saleSeedFirePuddles = function (n) {
  const p = this.player;
  for (let i = 0; i < n; i++) {
    this.salePuddles.push({
      x: p.x + rand(-320, 320),
      y: p.y + rand(-240, 240),
      r: 38 + rand(0, 28),
      life: 8 + rand(0, 6),
      dmg: 1,
      tick: rand(0, 0.3),
      color: '#e67e22',
      hurtPlayer: true,
      killName: 'Пожар в отделе',
    });
  }
};

Game.prototype._saleSpawnTempWalls = function () {
  this.saleTempWalls = this.saleTempWalls || [];
  const p = this.player;
  const specs = [
    { dx: -110, dy: -40, w: 28, h: 140 },
    { dx: 110, dy: -40, w: 28, h: 140 },
    { dx: -80, dy: -130, w: 160, h: 26 },
    { dx: -80, dy: 90, w: 70, h: 26 },
    { dx: 20, dy: 90, w: 70, h: 26 },
  ];
  for (const s of specs) {
    const ob = {
      x: p.x + s.dx, y: p.y + s.dy, w: s.w, h: s.h,
      dw: s.w + 8, dh: s.h + 10, sprite: 'box_stack', type: 'prop', _saleTemp: true,
    };
    this.obstacles.push(ob);
    this.saleTempWalls.push(ob);
  }
};

Game.prototype.tickSaleEvents = function (dt) {
  const minute = Math.floor(this.saleTime / 60);
  if (minute >= 1 && minute > this.saleEventMinute && minute <= 19) {
    this.saleEventMinute = minute;
    const id = pickSaleEventId(minute, this.saleLastEventId);
    this.startSaleEvent(id);
  }

  const ev = this.saleActiveEvent;
  if (!ev) return false;

  ev.t -= dt;
  this.saleEventAcc = (this.saleEventAcc || 0) + dt;

  if (ev.id === 'vip_day') {
    const vip = this.saleVipRef;
    if (!vip || vip.hp <= 0) {
      this.saleMobSpeedMul = 1;
      this.saleVipRef = null;
    } else {
      this.saleMobSpeedMul = 1.4;
      // аура визуально через speed
    }
  }

  if (ev.id === 'evacuation') {
    if (ev.fleeT > 0) {
      ev.fleeT -= dt;
      this.saleEvacMode = 'flee';
      if (ev.fleeT <= 0) {
        this.saleEvacMode = 'rush';
        this.saleMobSpeedMul = 1.6;
        this.showEventBanner('😱 ТОЛПА ВЕРНУЛАСЬ!', 2.2);
        for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
      }
    }
  }

  if (ev.id === 'complaint_book' || ev.id === 'mall_closing') {
    const every = ev.id === 'mall_closing' ? 1.6 : 2.0;
    if (this.saleEventAcc >= every) {
      this.saleEventAcc = 0;
      this._saleFireComplaintBurst();
    }
  }

  if (ev.id === 'director_call' || ev.id === 'mall_closing') {
    const every = ev.id === 'mall_closing' ? 3.2 : 3.8;
    // отдельный аккумулятор через t modulo — используем max-t
    const elapsed = ev.max - ev.t;
    if (!ev._lastLineAt) ev._lastLineAt = -99;
    if (elapsed - ev._lastLineAt >= every) {
      ev._lastLineAt = elapsed;
      this._saleDirectorEdgeSlash();
    }
  }

  if (ev.id === 'fire_dept' || ev.id === 'mall_closing') {
    if (!ev._lastFireAt) ev._lastFireAt = 0;
    const elapsed = ev.max - ev.t;
    if (elapsed - ev._lastFireAt >= 4.5) {
      ev._lastFireAt = elapsed;
      this._saleSeedFirePuddles(ev.id === 'mall_closing' ? 3 : 2);
    }
  }

  if (ev.id === 'inventory') {
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e._saleInvuln = e.type !== this.saleInvulnExcept;
    }
  }

  if (ev.t <= 0) {
    this.endSaleEvent();
    if (typeof this.showEventBanner === 'function') {
      this.showEventBanner('✅ Событие закончилось', 1.4);
    }
  }
  return false;
};

Game.prototype._saleFireComplaintBurst = function () {
  const p = this.player;
  const n = 5;
  for (let i = 0; i < n; i++) {
    const side = randi(0, 3);
    let x, y;
    if (side === 0) { x = rand(40, this.worldW - 40); y = 20; }
    else if (side === 1) { x = this.worldW - 20; y = rand(40, this.worldH - 40); }
    else if (side === 2) { x = rand(40, this.worldW - 40); y = this.worldH - 20; }
    else { x = 20; y = rand(40, this.worldH - 40); }
    const a = angleTo(x, y, p.x + rand(-40, 40), p.y + rand(-40, 40));
    this.projectiles.push(new Projectile(x, y, a, 240 + rand(0, 60), null));
  }
};

Game.prototype._saleDirectorEdgeSlash = function () {
  const p = this.player;
  const side = randi(0, 3);
  let x, y;
  if (side === 0) { x = p.x; y = Math.max(40, p.y - 280); }
  else if (side === 1) { x = Math.min(this.worldW - 40, p.x + 280); y = p.y; }
  else if (side === 2) { x = p.x; y = Math.min(this.worldH - 40, p.y + 280); }
  else { x = Math.max(40, p.x - 280); y = p.y; }
  const fake = { x, y, type: 'director', bossPhase: 2, nameTag: 'Директор (по рации)' };
  this.spawnBossLineAttack(fake, p, { lines: Math.random() < 0.35 ? 2 : 1, warn: 0.95, length: 520 });
};
