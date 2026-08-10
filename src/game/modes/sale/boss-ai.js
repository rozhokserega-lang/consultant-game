/**
 * Распродажа: Поведение боссов: рывки, призывы, хазарды, фазы.
 */
'use strict';

/** LN-стиль: телеграф рывка → рывок. */
Game.prototype.saleBossTickCharge = function (enemy, dt, opts) {
  opts = opts || {};
  const p = this.player;
  if (enemy._saleChargeT > 0) {
    enemy._saleChargeT -= dt;
    if (enemy._saleChargeT <= 0) {
      const spd = opts.spd || 380;
      const slide = opts.slide != null ? opts.slide : 0.2;
      enemy.x += Math.cos(enemy._saleChargeAng) * spd * slide;
      enemy.y += Math.sin(enemy._saleChargeAng) * spd * slide;
      enemy.knockback.x = Math.cos(enemy._saleChargeAng) * spd * (opts.kb || 0.5);
      enemy.knockback.y = Math.sin(enemy._saleChargeAng) * spd * (opts.kb || 0.5);
      enemy.mobPose = 'attack';
      this.spawnAnimFx('afx_slash', enemy.x + Math.cos(enemy._saleChargeAng) * 40, enemy.y + Math.sin(enemy._saleChargeAng) * 40, {
        life: 0.32, scale: opts.fxScale || 1.2, rot: enemy._saleChargeAng + Math.PI / 2,
      });
      this.screenShake = Math.max(this.screenShake || 0, 0.2);
      return 'struck';
    }
    if (!opts.lockAim) {
      enemy._saleChargeAng = angleTo(enemy.x, enemy.y, p.x, p.y);
      enemy.angle = enemy._saleChargeAng;
    }
    return 'telegraph';
  }
  return null;
};

Game.prototype.saleBossStartCharge = function (enemy, warn, opts) {
  opts = opts || {};
  const p = this.player;
  enemy._saleChargeT = warn != null ? warn : 0.75;
  enemy._saleChargeAng = angleTo(enemy.x, enemy.y, p.x, p.y);
  enemy.angle = enemy._saleChargeAng;
  enemy._saleChargeOpts = opts;
};

/** Залп «жалоб» / ценников снарядами. */
Game.prototype.saleBossVolley = function (enemy, n, opts) {
  opts = opts || {};
  const p = this.player;
  const base = angleTo(enemy.x, enemy.y, p.x, p.y);
  const spread = opts.spread != null ? opts.spread : 0.55;
  const fullRing = spread >= Math.PI * 1.8;
  this.projectiles = this.projectiles || [];
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? base
      : fullRing ? base + (Math.PI * 2 * i) / n
      : base + (i - (n - 1) / 2) * (spread / Math.max(1, n - 1));
    const pr = new Projectile(enemy.x, enemy.y, a, opts.speed || 260, null);
    pr.r = opts.r || 9;
    pr._saleBossShot = true;
    pr._saleBossKill = opts.killName || enemy.nameTag || 'Босс';
    this.projectiles.push(pr);
  }
  this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.28, scale: 0.5, scaleEnd: 1.4 });
};

function saleHexRgba(hex, a) {
  let h = String(hex || '#f59e0b').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(245,158,11,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Кольцо телеграфов под игроком → взрыв (могилы LN). Цвет — от босса, не «кровавый» красный. */
Game.prototype.saleBossGraveRing = function (cx, cy, count, opts) {
  opts = opts || {};
  this.saleBossHazards = this.saleBossHazards || [];
  // не заваливать экран телеграфами в конце забега
  const pending = this.saleBossHazards.filter((h) => h.kind === 'grave' && !h.boom).length;
  const room = Math.max(0, 5 - pending);
  count = Math.min(count, room);
  if (count <= 0) return;
  const col = opts.color || '#f59e0b';
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + (opts.spin || 0);
    const rr = opts.radius != null ? opts.radius : (i === 0 && opts.underPlayer ? 0 : 90);
    const off = opts.underPlayer && i === 0 ? 0 : rr + rand(-12, 18);
    this.saleBossHazards.push({
      kind: 'grave',
      x: cx + Math.cos(a) * off,
      y: cy + Math.sin(a) * off,
      r: opts.r || 48,
      life: opts.warn || 1.15,
      warnMax: opts.warn || 1.15,
      boom: false,
      killName: opts.killName || 'Взрыв',
      color: col,
    });
  }
};

Game.prototype.saleBossLineOpts = function (enemy, extra) {
  const def = enemy && SALE_BOSS_DEFS[enemy.saleBossId];
  return Object.assign({
    color: (def && def.color) || '#f59e0b',
    soft: true,
  }, extra || {});
};

Game.prototype.saleBossHurtPlayer = function (fromX, fromY, killName) {
  const p = this.player;
  if (!p || p.invincible > 0 || p.dashTime > 0 || this.__god) return false;
  if (p.takeDamage(fromX, fromY)) {
    this.endSaleGame(false, killName || 'Босс');
    return true;
  }
  // Slow только от боссов ТЦ — не от рядовых жалобщиков
  p.slowTimer = Math.max(p.slowTimer || 0, 1.5);
  this.tookDamage = true;
  if (typeof sfx !== 'undefined' && sfx.hurt) sfx.hurt();
  this.vibrate && this.vibrate(40);
  return this.applySaleFragileExtra();
};

Game.prototype.tickSaleBossAI = function (enemy, dt) {
  if (!enemy || enemy.hp <= 0 || !enemy.saleBossId) return;
  const id = enemy.saleBossId;
  const p = this.player;
  if (!p) return;
  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  const prevPhase = enemy.bossPhase || 1;
  enemy.bossPhase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;
  const ph = enemy.bossPhase;
  enemy._saleBossCd = (enemy._saleBossCd || 0) - dt;
  enemy._saleBossCd2 = (enemy._saleBossCd2 || 0) - dt;
  enemy._saleBossCd3 = (enemy._saleBossCd3 || 0) - dt;

  // общий тик рывка (если активен)
  if (enemy._saleChargeT > 0) {
    this.saleBossTickCharge(enemy, dt, enemy._saleChargeOpts || {});
  }

  // смена фазы — разовый «spike» как в LN
  if (ph > prevPhase) {
    enemy._salePhaseSpike = true;
    this.spawnAnimFx('afx_darkburst', enemy.x, enemy.y, { life: 0.55, scale: 1.2, scaleEnd: 2.0 });
    this.screenShake = Math.max(this.screenShake || 0, 0.35);
    // фаза 3: бан одной роли оружия игрока на ~20с
    if (ph === 3) {
      const types = [];
      for (const wid of Object.keys(this.saleWeapons || {})) {
        if (!(this.saleWeapons[wid] > 0)) continue;
        const t = SALE_WEAPONS[wid] && SALE_WEAPONS[wid].type;
        if (t && !types.includes(t)) types.push(t);
      }
      if (types.length) {
        const ban = types[randi(0, types.length - 1)];
        this.saleRoleBan = { type: ban, t: SALE_ROLE_BAN_SEC };
        this.showEventBanner(`🚫 Босс банит роль: ${SALE_ROLE_LABEL[ban] || ban} (${SALE_ROLE_BAN_SEC}с)`, 2.2);
      }
    }
  }

  if (id === 'floor_manager') {
    // танк: рывок · линия-«выписка» · призыв · залп жалоб
    if (enemy._saleChargeT <= 0 && enemy._saleBossCd <= 0) {
      enemy._saleBossCd = Math.max(2.6, 4.8 - ph * 0.45);
      this.saleBossStartCharge(enemy, 0.7, { spd: 300 + ph * 35, slide: 0.16, kb: 0.5 });
      if (typeof SpeechBubble === 'function') {
        enemy.bubble = new SpeechBubble(enemy, pick(['Кто на смене?!', 'Отчёт на стол!', 'Опоздание!']));
      }
    }
    if (enemy._saleBossCd2 <= 0) {
      enemy._saleBossCd2 = Math.max(5, 7.5 - ph);
      const n = 1 + (ph > 1 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + rand(0, 1);
        this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 70, enemy.y + Math.sin(a) * 70, 'manager', {
          nameTag: 'Подсмена', hpMul: 0.9, overCap: 4,
        });
      }
    }
    if (enemy._saleBossCd3 <= 0) {
      enemy._saleBossCd3 = Math.max(3.2, 5.5 - ph * 0.5);
      if (ph >= 2 && typeof this.spawnBossLineAttack === 'function') {
        this.spawnBossLineAttack(enemy, p, this.saleBossLineOpts(enemy, {
          lines: ph >= 3 ? 2 : 1, warn: 0.9, length: 420, halfW: 32,
        }));
      } else {
        this.saleBossVolley(enemy, 1 + ph, { speed: 240, spread: 0.7, killName: 'Жалоба' });
      }
    }
    if (enemy._salePhaseSpike && ph === 3) {
      enemy._salePhaseSpike = false;
      this.saleBossVolley(enemy, 8, { speed: 200, spread: Math.PI * 2, killName: 'Приказ' });
    }
  } else if (id === 'cart_horde') {
    // чардж · орда · кольцо-стампид телеграфов · тройной рывок в ярости
    if (enemy._saleChargeT <= 0 && enemy._saleBossCd <= 0) {
      enemy._saleBossCd = Math.max(2.2, 4.0 - ph * 0.4);
      this.saleBossStartCharge(enemy, 0.72, { spd: 400 + ph * 40, slide: 0.2, kb: 0.55, fxScale: 1.3 });
      if (typeof SpeechBubble === 'function') {
        enemy.bubble = new SpeechBubble(enemy, pick(['Тележки в проход!', 'Разгон!', 'Не стой!']));
      }
    }
    if (enemy._saleBossCd2 <= 0) {
      enemy._saleBossCd2 = Math.max(3.8, 6.2 - ph * 0.55);
      const n = 3 + ph;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 85, enemy.y + Math.sin(a) * 85, i % 2 ? 'fast' : 'queue', {
          nameTag: 'Тележка', hpMul: 0.8, overCap: 8,
        });
      }
    }
    if (enemy._saleBossCd3 <= 0) {
      enemy._saleBossCd3 = Math.max(5.5, 8 - ph);
      // стампид: телеграфы вокруг игрока → взрывы «колёс»
      this.saleBossGraveRing(p.x, p.y, 1 + ph, {
        underPlayer: true, radius: 70, warn: 1.0, r: 42, killName: 'Тележка',
        color: SALE_BOSS_DEFS.cart_horde.color,
      });
    }
    if (enemy._salePhaseSpike && ph === 3) {
      enemy._salePhaseSpike = false;
      // тройной рывок-очередь
      enemy._saleMultiCharge = 3;
    }
    if (enemy._saleMultiCharge > 0 && enemy._saleChargeT <= 0) {
      enemy._saleMultiCharge--;
      this.saleBossStartCharge(enemy, 0.45, { spd: 480, slide: 0.22, kb: 0.6, lockAim: false });
    }
  } else if (id === 'discount_king') {
    // ценники · охотники · дождь ценников под игроком · веер снарядов
    if (enemy._saleBossCd <= 0) {
      enemy._saleBossCd = Math.max(1.3, 3.0 - ph * 0.4);
      this.saleBossHazards = this.saleBossHazards || [];
      for (let i = 0; i < 1 + ph; i++) {
        const a = rand(0, Math.PI * 2);
        const d = rand(40, 140);
        this.saleBossHazards.push({
          kind: 'pricetag', x: enemy.x + Math.cos(a) * d, y: enemy.y + Math.sin(a) * d,
          r: 22, life: 4.5, dmgCd: 0,
        });
      }
      if (typeof SpeechBubble === 'function') {
        enemy.bubble = new SpeechBubble(enemy, pick(['МИНУС СЕМЬДЕСЯТ!', 'Ценник не обманешь!', 'Только сегодня!']));
      }
    }
    if (enemy._saleBossCd2 <= 0) {
      enemy._saleBossCd2 = Math.max(3.8, 6.5 - ph);
      for (let i = 0; i < ph; i++) {
        const a = (Math.PI * 2 * i) / ph;
        this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 70, enemy.y + Math.sin(a) * 70, 'fast', {
          nameTag: 'Охотник за скидкой', hpMul: 0.85, overCap: 6,
        });
      }
    }
    if (enemy._saleBossCd3 <= 0) {
      enemy._saleBossCd3 = Math.max(3.5, 5.8 - ph * 0.5);
      if (ph >= 2) {
        this.saleBossGraveRing(p.x, p.y, ph, {
          underPlayer: true, radius: 55, warn: 1.05, r: 40, killName: 'Ценник',
          color: SALE_BOSS_DEFS.discount_king.color,
        });
      } else {
        this.saleBossVolley(enemy, 3, { speed: 280, spread: 0.9, killName: 'Ценник' });
      }
    }
    if (enemy._salePhaseSpike && ph === 3) {
      enemy._salePhaseSpike = false;
      this.saleBossVolley(enemy, 10, { speed: 220, spread: Math.PI * 2, killName: 'Распродажа' });
      this.saleBossGraveRing(p.x, p.y, 4, {
        radius: 100, warn: 1.05, r: 34, killName: '−90%',
        color: SALE_BOSS_DEFS.discount_king.color,
      });
    }
  } else if (id === 'security_chief') {
    // рывок · стены · крест линий · свисток-нова
    if (enemy._saleChargeT <= 0 && enemy._saleBossCd <= 0) {
      enemy._saleBossCd = Math.max(2.0, 4.2 - ph * 0.45);
      this.saleBossStartCharge(enemy, 0.85, { spd: 440 + ph * 40, slide: 0.22, kb: 0.55, fxScale: 1.35 });
      if (typeof SpeechBubble === 'function') {
        enemy.bubble = new SpeechBubble(enemy, pick(['СТОЯТЬ!', 'Охрана!', 'Проход закрыт!']));
      }
    }
    if (enemy._saleBossCd2 <= 0) {
      enemy._saleBossCd2 = Math.max(4.5, 7.5 - ph);
      const wallW = 110, wallH = 22;
      const a = angleTo(enemy.x, enemy.y, p.x, p.y) + Math.PI / 2;
      const mx = (enemy.x + p.x) / 2, my = (enemy.y + p.y) / 2;
      this.obstacles = this.obstacles || [];
      this.saleTempWalls = this.saleTempWalls || [];
      const mk = (x, y, w, h) => {
        const o = { x, y, w, h, _saleTemp: true, _saleBossWall: true, life: 6 };
        this.obstacles.push(o); this.saleTempWalls.push(o);
      };
      mk(mx - wallW / 2, my - wallH / 2, wallW, wallH);
      mk(mx - wallH / 2 + Math.cos(a) * 8, my - wallW / 2 + Math.sin(a) * 8, wallH, wallW);
    }
    if (enemy._saleBossCd3 <= 0) {
      enemy._saleBossCd3 = Math.max(4.0, 6.5 - ph * 0.5);
      if (typeof this.spawnBossLineAttack === 'function') {
        this.spawnBossLineAttack(enemy, p, this.saleBossLineOpts(enemy, {
          lines: ph >= 3 ? 2 : 2, warn: 1.0, length: 500, halfW: 34,
        }));
      }
    }
    if (enemy._salePhaseSpike && ph >= 2) {
      enemy._salePhaseSpike = false;
      // свисток: кольцо отталкивания
      this.saleRings = this.saleRings || [];
      this.saleRings.push({
        x: enemy.x, y: enemy.y, r: 20, maxR: 200 + ph * 40, dmg: 1, hit: new Set(),
        knock: 280, ico: '🚨', visual: 'siren',
      });
      this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.5, scale: 0.8, scaleEnd: 2.8, tint: '#38bdf8' });
    }
  } else if (id === 'promo_witch') {
    // лужи · проклятие · болты · телепорт · кольцо яда на фазе 3
    if (enemy._saleBossCd <= 0) {
      enemy._saleBossCd = Math.max(1.5, 3.2 - ph * 0.35);
      this.salePuddles = this.salePuddles || [];
      for (let i = 0; i < 1 + ph; i++) {
        const a = rand(0, Math.PI * 2);
        const d = rand(50, 160);
        this.salePuddles.push({
          x: enemy.x + Math.cos(a) * d, y: enemy.y + Math.sin(a) * d,
          r: 28 + ph * 4, life: 5.5, dmg: 1, tick: 0, color: '#c026d3', slow: 0.5, poison: true,
        });
      }
      if (typeof SpeechBubble === 'function') {
        enemy.bubble = new SpeechBubble(enemy, pick(['АКЦИЯ НАВСЕГДА!', 'Промо-проклятие!', 'Ценник живой!']));
      }
    }
    if (enemy._saleBossCd2 <= 0) {
      enemy._saleBossCd2 = Math.max(4.2, 6.8 - ph);
      this.salePuddles = this.salePuddles || [];
      this.salePuddles.push({
        x: p.x, y: p.y, r: 36, life: 3.2, dmg: 1, tick: 0, color: '#a21caf', slow: 0.45, poison: true,
      });
      this.spawnAnimFx('afx_darkburst', p.x, p.y, { life: 0.45, scale: 0.9, scaleEnd: 1.4 });
      const n = 2 + (ph > 2 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 80, enemy.y + Math.sin(a) * 80, 'fast', {
          nameTag: 'Промо-фан', hpMul: 0.85, overCap: 6,
        });
      }
    }
    if (enemy._saleBossCd3 <= 0) {
      enemy._saleBossCd3 = Math.max(3.5, 5.5 - ph * 0.4);
      this.saleBossVolley(enemy, 2 + ph, { speed: 230, spread: 1.1, killName: 'Проклятие' });
      // короткий телепорт как у LN maiden
      if (ph >= 2) {
        const a = rand(0, Math.PI * 2);
        const rr = 100 + rand(0, 80);
        this.spawnAnimFx('afx_darkburst', enemy.x, enemy.y, { life: 0.35, scale: 0.8, scaleEnd: 1.3 });
        enemy.x = Math.max(60, Math.min(this.worldW - 60, p.x + Math.cos(a) * rr));
        enemy.y = Math.max(60, Math.min(this.worldH - 60, p.y + Math.sin(a) * rr));
        this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.35, scale: 0.6, scaleEnd: 1.6, tint: '#e879f9' });
      }
    }
    if (enemy._salePhaseSpike && ph === 3) {
      enemy._salePhaseSpike = false;
      this.saleBossGraveRing(enemy.x, enemy.y, 5, {
        radius: 110, warn: 1.15, r: 36, killName: 'АКЦИЯ',
        color: SALE_BOSS_DEFS.promo_witch.color,
      });
    }
  } else if (id === 'mall_closing') {
    // сжатие · тьма · орда · линии директора · пожары · врата
    this.saleArenaShrink = Math.min(0.55, 0.12 + (1 - hpRatio) * 0.4);
    if (enemy._saleBossCd <= 0) {
      enemy._saleBossCd = Math.max(2.2, 4.6 - ph * 0.5);
      this.lightsOut = Math.max(this.lightsOut || 0, 2.4);
      if (typeof SpeechBubble === 'function') {
        enemy.bubble = new SpeechBubble(enemy, pick(['ТЦ ЗАКРЫВАЕТСЯ!', 'На выход!', 'Последний звонок!']));
      }
    }
    if (enemy._saleBossCd2 <= 0) {
      enemy._saleBossCd2 = Math.max(3.2, 6.0 - ph * 0.6);
      const n = 3 + ph;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + rand(-0.2, 0.2);
        this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 90, enemy.y + Math.sin(a) * 90, i % 2 ? 'returner' : 'queue', {
          overCap: 10,
        });
      }
    }
    if (enemy._saleBossCd3 <= 0) {
      enemy._saleBossCd3 = Math.max(3.8, 5.8 - ph * 0.4);
      if (typeof this.spawnBossLineAttack === 'function') {
        this.spawnBossLineAttack(enemy, p, this.saleBossLineOpts(enemy, {
          lines: ph >= 3 ? 2 : 1, warn: 1.1, length: 520, halfW: 36,
        }));
      }
      // пожары реже в фазе 3 — иначе экран весь в красном
      if (ph >= 2 && typeof this._saleSeedFirePuddles === 'function' && enemy._saleBossCd3 > 2.5) {
        this._saleSeedFirePuddles(ph >= 3 ? 1 : 2);
      }
    }
    if (!enemy._saleRingAcc) enemy._saleRingAcc = 0;
    enemy._saleRingAcc += dt;
    if (enemy._saleRingAcc >= 0.35) {
      enemy._saleRingAcc = 0;
      const shrink = this.saleArenaShrink || 0;
      const maxR = Math.min(this.worldW, this.worldH) * (0.48 - shrink * 0.25);
      const dx = p.x - this.worldW / 2;
      const dy = p.y - this.worldH / 2;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > maxR) {
        if (this.saleBossHurtPlayer(p.x + dx, p.y + dy, 'Закрытие ТЦ')) return;
      }
    }
    if (enemy._salePhaseSpike && ph === 3) {
      enemy._salePhaseSpike = false;
      this.saleBossGraveRing(p.x, p.y, 4, {
        radius: 120, warn: 1.25, r: 40, killName: 'CLOSED',
        color: SALE_BOSS_DEFS.mall_closing.color,
      });
      this.lightsOut = Math.max(this.lightsOut || 0, 3.2);
    }
  }
};

Game.prototype.tickSaleBossHazards = function (dt) {
  if (this.saleTempWalls && this.saleTempWalls.length) {
    for (const w of this.saleTempWalls) {
      if (w._saleBossWall && w.life != null) w.life -= dt;
    }
    const dead = this.saleTempWalls.filter((w) => w._saleBossWall && w.life != null && w.life <= 0);
    if (dead.length) {
      const kill = new Set(dead);
      this.saleTempWalls = this.saleTempWalls.filter((w) => !kill.has(w));
      this.obstacles = (this.obstacles || []).filter((o) => !kill.has(o));
    }
  }

  this.saleBossHazards = this.saleBossHazards || [];
  const p = this.player;
  for (const h of this.saleBossHazards) {
    if (h.kind === 'grave') {
      h.life -= dt;
      if (!h.boom && h.life <= 0) {
        h.boom = true;
        h.life = 0.28;
        const col = h.color || '#f59e0b';
        this.spawnAnimFx('afx_ring', h.x, h.y, {
          life: 0.35, scale: 0.55, scaleEnd: 1.35, tint: col, alpha: 0.75,
        });
        this.spawnParticles(h.x, h.y, 12, col, 140, 0.35);
        this.screenShake = Math.max(this.screenShake || 0, 0.18);
        if (p && dist(p.x, p.y, h.x, h.y) < p.r + h.r) {
          if (this.saleBossHurtPlayer(h.x, h.y, h.killName || 'Взрыв')) return true;
        }
      }
      continue;
    }

    h.life -= dt;
    if (h.dmgCd > 0) h.dmgCd -= dt;
    if (!p || h.life <= 0 || h.kind !== 'pricetag') continue;
    if (h.dmgCd > 0) continue;
    if (dist(p.x, p.y, h.x, h.y) < p.r + h.r - 4) {
      h.dmgCd = 0.7;
      if (this.saleBossHurtPlayer(h.x, h.y, 'Ценник')) return true;
    }
  }
  this.saleBossHazards = this.saleBossHazards.filter((h) => h.life > 0);
  return false;
};
