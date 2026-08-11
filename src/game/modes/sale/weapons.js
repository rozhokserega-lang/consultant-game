/**
 * Распродажа: Логика всех типов оружия и их снарядов.
 */
'use strict';

Game.prototype.updateSaleWeapons = function (dt) {
  const p = this.player;
  const area = this.saleAreaMul();
  const dmgM = this.saleDmgMul();
  const cdM = this.saleCdMul();
  const projBonus = this.saleProjectileBonus();
  if (this._saleShieldT > 0) this._saleShieldT -= dt;
  if (this.saleRoleBan) {
    this.saleRoleBan.t -= dt;
    if (this.saleRoleBan.t <= 0) {
      this.showEventBanner('🔓 Бан роли снят', 1.2);
      this.saleRoleBan = null;
    }
  }
  for (const e of this.enemies) {
    if ((e._saleMarked || 0) > 0) e._saleMarked -= dt;
  }

  for (const [id, lv] of Object.entries(this.saleWeapons)) {
    const def = SALE_WEAPONS[id];
    if (!def) continue;
    if (this.saleRoleBan && def.type === this.saleRoleBan.type) continue;
    const banTypes = (this.saleContract && this.saleContract.banTypes) || [];
    if (banTypes.includes(def.type)) continue;
    const level = Math.min(def.max, Math.max(1, lv)) - 1;
    this.saleWeaponCd[id] = (this.saleWeaponCd[id] || 0) - dt;
    if (this.saleWeaponCd[id] > 0) continue;

    const overW = (this.saleWeaponOver && this.saleWeaponOver[id]) || 0;
    let dmg = Math.max(1, Math.round((def.dmg[level] || def.dmg[0] || 1) * dmgM * (1 + overW * 0.07)));
    if (def.type === 'aura') dmg = Math.max(1, Math.round(dmg * this.saleAuraDmgMul()));

    if (def.type === 'orbit') {
      const printLv = this.saleOrbitBonus();
      const need = (def.count[level] || def.count[0] || 1) + printLv;
      const radius = (def.radius[level] || def.radius[0] || 60) * area * (1 + printLv * 0.08);
      const spin = def.spin || 3;
      let list = this.saleOrbits.filter((o) => o.weaponId === id);
      while (list.length < need) {
        const o = {
          weaponId: id, ico: def.ico, visual: def.visual || id, angle: (Math.PI * 2 * list.length) / need,
          radius, dmg, spin, size: def.size || 1, trail: !!def.trail, explodeHit: !!def.explodeHit,
          hitAt: new Map(),
        };
        this.saleOrbits.push(o);
        list.push(o);
      }
      while (list.length > need) {
        const drop = list.pop();
        this.saleOrbits = this.saleOrbits.filter((o) => o !== drop);
      }
      for (const o of this.saleOrbits) {
        if (o.weaponId !== id) continue;
        o.radius = radius; o.dmg = dmg; o.spin = spin; o.ico = def.ico; o.size = def.size || 1;
        o.visual = def.visual || id; o.explodeHit = !!def.explodeHit;
      }
      this.saleWeaponCd[id] = 0.15;
      continue;
    }

    this.saleWeaponCd[id] = def.baseCd * cdM;

    if (def.type === 'beam') {
      const len = (def.length[level] || def.length[0] || 120) * area;
      this.saleBeams = this.saleBeams.filter((b) => b.weaponId !== id);
      this.saleBeams.push({
        weaponId: id,
        angle: this._saleBeamAng || p.angle || 0,
        length: len,
        width: (def.width || 28) * area,
        dmg,
        spin: def.spin || 0,
        aimNearest: !!def.aimNearest,
        turn: def.turn || 8,
        cone: def.cone || 0,
        summonBats: !!def.summonBats,
        burn: !!this.saleSynergyOn('beamBurn'),
        tick: 0,
      });
      continue;
    }

    if (def.type === 'sword') {
      // LN sword: авто-сик рядом — тик каждый кадр
      this.saleWeaponCd[id] = 0;
      const sprayLv = this.salePassives.spray || 0;
      const need = def.count[level] || def.count[0] || 1;
      const range = (def.range[level] || def.range[0] || 150) * area;
      const speed = def.speed || 175;
      const swordDmg = Math.max(1, Math.round(dmg * (1 + sprayLv * 0.12)));
      const trail = !!def.trail || sprayLv > 0;
      this.saleSwords = this.saleSwords || [];
      let list = this.saleSwords.filter((s) => s.weaponId === id);
      while (list.length < need) {
        const s = {
          weaponId: id, x: p.x, y: p.y, ang: 0, cd: 0,
          ico: def.ico, visual: def.visual || id, size: def.size || 1,
          trail, floorSlow: !!def.floorSlow, dmg: swordDmg, range, speed,
          hitR: 16 + (def.size || 1) * 4,
        };
        this.saleSwords.push(s);
        list.push(s);
      }
      while (list.length > need) {
        const drop = list.pop();
        this.saleSwords = this.saleSwords.filter((s) => s !== drop);
      }
      for (const s of list) {
        s.dmg = swordDmg; s.range = range; s.speed = speed; s.ico = def.ico;
        s.visual = def.visual || id; s.trail = trail; s.size = def.size || 1;
        s.floorSlow = !!def.floorSlow;
      }
      if (def.floorSlow && p) {
        this.salePuddles = this.salePuddles || [];
        // одна «мокрая» зона под игроком
        let floor = this.salePuddles.find((u) => u._wetFloor);
        if (!floor) {
          floor = {
            x: p.x, y: p.y, r: 48, life: 0.4, dmg: 0, tick: 0, color: '#38bdf8',
            slow: 0.45, _wetFloor: true, hurtPlayer: false,
          };
          this.salePuddles.push(floor);
        }
        floor.x = p.x; floor.y = p.y; floor.life = 0.45;
      }
      continue;
    }

    if (def.type === 'nova') {
      const maxR = (def.radius[level] || def.radius[0] || 120) * area;
      this.saleRings = this.saleRings || [];
      this.saleRings.push({
        x: p.x, y: p.y, r: 18, maxR, dmg, hit: new Set(),
        knock: def.knock || 200, ico: def.ico, visual: def.visual || id, weaponId: id,
      });
      this._saleNova = { r: maxR, t: 0.38 };
      this.spawnAnimFx('afx_ring', p.x, p.y, {
        life: 0.45, scale: 0.6, scaleEnd: Math.max(1.2, maxR / 70), tint: '#f59e0b', alpha: 0.85,
      });
      if (def.impact) {
        this.spawnSpriteFx(def.impact, p.x, p.y, { scale: Math.min(0.55, maxR / 240), life: 0.28, vy: 0 });
      }
      if (def.iFrames && p) {
        p.invincible = Math.max(p.invincible || 0, def.iFrames);
      }
      continue;
    }

    if (def.type === 'aura') {
      const radius = (def.radius[level] || def.radius[0] || 80) * area;
      const isPromo = !!def.promo || def.visual === 'speaker';
      const isUltra = def.visual === 'ultrasound' || id === 'ultrasound';
      const pulseT = isPromo || isUltra ? 0.4 : 0.22;
      this._saleAura = {
        r: radius, t: pulseT, max: pulseT,
        ico: isPromo || isUltra ? null : def.ico,
        visual: def.visual,
        blood: false,
        promo: isPromo,
        ultra: isUltra,
      };
      if (isPromo) this._salePromoAuraR = radius;
      if (isUltra) this._saleUltraAuraR = radius;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (dist(p.x, p.y, e.x, e.y) < radius + e.r) {
          this.saleHitEnemy(e, dmg, p.x, p.y, def.knock || 70, {
            lifesteal: def.lifesteal, impact: def.impact, explodeOnKill: def.explodeOnKill,
            color: isUltra ? '#38bdf8' : '#9b59b6', fromAura: true, weapon: id,
          });
        }
      }
      if (def.impact) {
        this.spawnSpriteFx(def.impact, p.x, p.y, { scale: Math.min(0.4, radius / 220), life: 0.18, vy: 0 });
      }
      continue;
    }

    if (def.type === 'shield') {
      const range = (def.range[level] || def.range[0] || 100) * area;
      const ang = p.angle;
      const half = def.arc || 0.85;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > range + e.r) continue;
        let diff = angleTo(p.x, p.y, e.x, e.y) - ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < half) {
          this.saleHitEnemy(e, dmg, p.x, p.y, def.knock || 220, { color: '#64748b', impact: 'sp_quake1', weapon: id });
        }
      }
      this._saleShieldT = Math.max(this._saleShieldT || 0, 0.55);
      this.spawnAnimFx('afx_ring', p.x + Math.cos(ang) * 36, p.y + Math.sin(ang) * 36, {
        life: 0.3, scale: 0.5, scaleEnd: 1.2, tint: '#94a3b8',
      });
      continue;
    }

    if (def.type === 'radio') {
      let maxR = (def.radius[level] || def.radius[0] || 160) * area;
      if (this.salePassives.broadcast) maxR *= 1 + this.salePassives.broadcast * 0.1;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (dist(p.x, p.y, e.x, e.y) > maxR + e.r) continue;
        this.saleHitEnemy(e, dmg, p.x, p.y, 40, {
          color: '#38bdf8', impact: def.impact, stun: def.stun || 0, weapon: id,
        });
        e.slowTimer = Math.max(e.slowTimer || 0, 1.1);
        e._saleRadioSlow = def.slow || 0.55;
      }
      this.spawnAnimFx('afx_ring', p.x, p.y, {
        life: 0.5, scale: 0.7, scaleEnd: Math.max(1.4, maxR / 90), tint: '#7dd3fc',
      });
      continue;
    }

    if (def.type === 'mark') {
      let count = (def.count?.[level] || def.count?.[0] || 1) + projBonus;
      const targets = this.enemies.filter((e) => e.hp > 0)
        .map((e) => ({ e, d: dist(p.x, p.y, e.x, e.y) }))
        .sort((a, b) => a.d - b.d);
      for (let i = 0; i < count; i++) {
        let ang = p.angle;
        if (targets[i]) ang = angleTo(p.x, p.y, targets[i].e.x, targets[i].e.y);
        else if (targets[0]) ang = angleTo(p.x, p.y, targets[0].e.x, targets[0].e.y) + (i - 1) * 0.25;
        this.saleProjectiles.push({
          x: p.x, y: p.y, angle: ang, speed: def.speed || 460, life: 1.6, r: 11,
          dmg, ico: def.ico, visual: def.visual || id, bounces: 0, puddle: false,
          mark: def.markSec || 4, impact: def.impact, hit: new Set(), weaponId: id,
        });
      }
      continue;
    }

    if (def.type === 'spray') {
      const range = (def.range[level] || 100) * area;
      const ang = p.angle;
      const half = def.arc || 0.65;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > range + e.r) continue;
        let diff = angleTo(p.x, p.y, e.x, e.y) - ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < half) {
          this.saleHitEnemy(e, dmg, p.x, p.y, 160, { impact: def.impact || 'sp_fwave1', color: '#e67e22', weapon: id });
        }
      }
      this.spawnSpriteFx(def.impact || 'sp_fwave2', p.x + Math.cos(ang) * 40, p.y + Math.sin(ang) * 40, {
        scale: 0.4 * Math.min(1.2, area), life: 0.22, rot: ang, vy: 0,
      });
      continue;
    }

    if (def.type === 'charge') {
      const ang = p.angle;
      const nearest = this.nearestSaleEnemy(p.x, p.y, 400);
      const a = nearest ? angleTo(p.x, p.y, nearest.x, nearest.y) : ang;
      this.saleCharges.push({
        x: p.x, y: p.y, angle: a, speed: def.speed || 320,
        life: ((def.range && def.range[level]) || def.range?.[0] || 260) / (def.speed || 320),
        dmg, ico: def.ico, visual: def.visual || id, size: def.size || 1.2, pull: def.pull || 0, hit: new Set(), impact: def.impact,
        weaponId: id,
      });
      continue;
    }

    if (def.type === 'boomerang') {
      const range = (def.range?.[level] || def.range?.[0] || 200) * area;
      const nearest = this.nearestSaleEnemy(p.x, p.y, 500);
      const a = nearest ? angleTo(p.x, p.y, nearest.x, nearest.y) : p.angle;
      this.saleBoomerangs.push({
        x: p.x, y: p.y, angle: a, speed: def.speed || 340,
        range, traveled: 0, returning: false, dmg, ico: def.ico, visual: def.visual || id,
        hit: new Set(), size: def.size || 1.1, weaponId: id,
      });
      continue;
    }

    if (def.type === 'seek') {
      const count = (def.count[level] || 2) + projBonus;
      for (let i = 0; i < count; i++) {
        const ang = rand(0, Math.PI * 2);
        this.saleSeekers.push({
          x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20,
          vx: Math.cos(ang) * 80, vy: Math.sin(ang) * 80,
          speed: def.speed || 260, life: 3.5, dmg, ico: '🦇', visual: 'bats', target: null, hit: new Set(),
          weaponId: id,
        });
      }
      this.spawnSpriteFx('sp_bat1', p.x, p.y - 10, { scale: 0.8, life: 0.25, vy: -20 });
      continue;
    }

    if (def.type === 'puddle' || def.type === 'projectile' || def.type === 'ricochet') {
      let count = (def.count?.[level] || def.count?.[0] || 1) + projBonus;
      if (def.id === 'caffeine') count = 3;
      const targets = this.enemies.filter((e) => e.hp > 0)
        .map((e) => ({ e, d: dist(p.x, p.y, e.x, e.y) }))
        .sort((a, b) => a.d - b.d);
      for (let i = 0; i < count; i++) {
        let ang = p.angle + (count > 1 ? (i - (count - 1) / 2) * 0.35 : 0);
        if (targets[i]) ang = angleTo(p.x, p.y, targets[i].e.x, targets[i].e.y);
        else if (targets[0]) ang = angleTo(p.x, p.y, targets[0].e.x, targets[0].e.y) + (i - 1) * 0.4;
        this.saleProjectiles.push({
          x: p.x, y: p.y, angle: ang,
          speed: def.speed || 340,
          life: def.type === 'ricochet' ? 2.2 : 1.5,
          r: 12, dmg, ico: def.ico, visual: def.visual || id,
          bounces: def.type === 'ricochet' ? (def.bounces?.[level] || 3) : 0,
          puddle: def.type === 'puddle',
          puddleSlow: def.puddleSlow,
          puddleColor: def.puddleColor,
          confuse: def.confuse || 0,
          lifesteal: def.lifesteal || 0,
          explodeOnKill: !!def.explodeOnKill,
          impact: def.impact,
          hit: new Set(),
          born: performance.now(),
          weaponId: id,
        });
      }
    }
  }
};

Game.prototype.updateSaleOrbits = function (dt) {
  const p = this.player;
  if (!p) return;
  const now = performance.now();
  this._saleOrbitVolleyCd = this._saleOrbitVolleyCd || {};
  // LN orbT: один общий КД удара орбитой на врага (не «каждый чек бьёт отдельно»)
  for (const e of this.enemies) {
    if ((e._saleOrbT || 0) > 0) e._saleOrbT -= dt;
  }
  // залп «Возврат чека»
  for (const [wid, lv] of Object.entries(this.saleWeapons || {})) {
    if (!lv) continue;
    const def = SALE_WEAPONS[wid];
    if (!def || !def.volleyOut) continue;
    this._saleOrbitVolleyCd[wid] = (this._saleOrbitVolleyCd[wid] || 0) - dt;
    if (this._saleOrbitVolleyCd[wid] > 0) continue;
    this._saleOrbitVolleyCd[wid] = def.volleyCd || 1.4;
    const dmg = Math.max(1, Math.round((def.dmg[0] || 2) * this.saleDmgMul()));
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 + now * 0.001;
      this.saleProjectiles.push({
        x: p.x, y: p.y, angle: a, speed: 340, life: 1.1, r: 10,
        dmg, ico: def.ico, visual: def.visual || wid, bounces: 0, puddle: false, hit: new Set(),
        weaponId: wid,
      });
    }
  }
  const orbCd = SALE_DIFFICULTY.orbHitCd * this.saleCdMul();
  for (const o of this.saleOrbits) {
    o.angle += dt * (o.spin || 3);
    o.x = p.x + Math.cos(o.angle) * o.radius;
    o.y = p.y + Math.sin(o.angle) * o.radius;
    if (o.trail && Math.random() < 0.2) {
      this.salePuddles.push({ x: o.x, y: o.y, r: 22, life: 1.2, dmg: this.saleFlatDmg(1), tick: 0, color: '#27ae60', poison: true });
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if ((e._saleOrbT || 0) > 0) continue;
      if (dist(o.x, o.y, e.x, e.y) < e.r + 20 * (o.size || 1)) {
        e._saleOrbT = orbCd;
        this.saleHitEnemy(e, o.dmg, p.x, p.y, 130, { color: '#f39c12', spark: 'fx_slash', weapon: o.weaponId });
        if (o.explodeHit) {
          this.spawnAnimFx('afx_ring', e.x, e.y, { life: 0.28, scale: 0.4, scaleEnd: 1.1 });
          this.salePuddles.push({
            x: e.x, y: e.y, r: 26, life: 0.95, dmg: this.saleFlatDmg(1), tick: 0, color: '#f59e0b',
          });
        }
      }
    }
  }
  this.saleOrbits = this.saleOrbits.filter((o) => this.saleWeapons[o.weaponId]);
};

Game.prototype.updateSaleBoomerangs = function (dt) {
  const p = this.player;
  for (const b of this.saleBoomerangs) {
    if (!b.returning) {
      b.x += Math.cos(b.angle) * b.speed * dt;
      b.y += Math.sin(b.angle) * b.speed * dt;
      b.traveled += b.speed * dt;
      if (b.traveled >= b.range) b.returning = true;
    } else {
      const a = angleTo(b.x, b.y, p.x, p.y);
      b.angle = a;
      b.x += Math.cos(a) * b.speed * 1.2 * dt;
      b.y += Math.sin(a) * b.speed * 1.2 * dt;
      if (dist(b.x, b.y, p.x, p.y) < 22) b.dead = true;
    }
    if (this.gameMode === 'extract' && typeof this.hitsExtractWall === 'function'
      && this.hitsExtractWall(b.x, b.y, 10)) {
      b.returning = true;
      if (typeof this.spawnParticles === 'function') {
        this.spawnParticles(b.x, b.y, 4, '#94a3b8', 80, 0.2);
      }
    }
    const hitR = 14 * (b.size || 1.1);
    for (const e of this.enemies) {
      if (e.hp <= 0 || b.hit.has(e)) continue;
      if (dist(b.x, b.y, e.x, e.y) < e.r + hitR) {
        b.hit.add(e);
        this.saleHitEnemy(e, b.dmg, b.x, b.y, 200, { color: '#1abc9c', weapon: b.weaponId });
      }
    }
  }
  this.saleBoomerangs = this.saleBoomerangs.filter((b) => !b.dead);
};

Game.prototype.updateSaleProjectiles = function (dt) {
  for (const pr of this.saleProjectiles) {
    pr.x += Math.cos(pr.angle) * pr.speed * dt;
    pr.y += Math.sin(pr.angle) * pr.speed * dt;
    pr.life -= dt;
    if (this.gameMode === 'extract' && typeof this.hitsExtractWall === 'function'
      && this.hitsExtractWall(pr.x, pr.y, pr.r || 8)) {
      if (pr.impact && typeof this.spawnSpriteFx === 'function') {
        this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.3, life: 0.15, vy: 0 });
      } else if (typeof this.spawnParticles === 'function') {
        this.spawnParticles(pr.x, pr.y, 5, '#94a3b8', 90, 0.2);
      }
      pr.life = 0;
      continue;
    }
    for (const e of this.enemies) {
      if (e.hp <= 0 || pr.hit.has(e)) continue;
      if (dist(pr.x, pr.y, e.x, e.y) < e.r + pr.r) {
        pr.hit.add(e);
        this.saleHitEnemy(e, pr.dmg, pr.x, pr.y, 160, {
          confuse: pr.confuse, lifesteal: pr.lifesteal, impact: pr.impact,
          explodeOnKill: pr.explodeOnKill, color: '#f1c40f', mark: pr.mark || 0,
          weapon: pr.weaponId,
        });
        if (pr.impact) this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.45, life: 0.2, vy: 0 });
        if (pr.puddle) {
          this.salePuddles.push({
            x: e.x, y: e.y, r: 40, life: 2.8, dmg: this.saleFlatDmg(1), tick: 0,
            color: pr.puddleColor || '#d35400',
            slow: pr.puddleSlow != null ? pr.puddleSlow : 0.55,
            poison: !!pr.poison || !!this.saleSynergyOn('poisonPuddle'),
          });
          pr.life = 0;
        } else if (pr.bounces > 0) {
          pr.bounces--;
          const next = this.nearestSaleEnemy(pr.x, pr.y, 280);
          if (next && next !== e) pr.angle = angleTo(pr.x, pr.y, next.x, next.y);
          else pr.life = 0;
          if (pr.impact) this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.4, life: 0.18, vy: 0 });
        } else {
          pr.life = 0;
        }
        break;
      }
    }
    if (pr.x < -40 || pr.y < -40 || pr.x > this.worldW + 40 || pr.y > this.worldH + 40) pr.life = 0;
  }
  this.saleProjectiles = this.saleProjectiles.filter((pr) => pr.life > 0);
};

Game.prototype.updateSaleCharges = function (dt) {
  for (const c of this.saleCharges) {
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    c.life -= dt;
    if (this.gameMode === 'extract' && typeof this.hitsExtractWall === 'function'
      && this.hitsExtractWall(c.x, c.y, 14)) {
      c.life = 0;
      if (typeof this.spawnParticles === 'function') {
        this.spawnParticles(c.x, c.y, 6, '#94a3b8', 100, 0.22);
      }
      continue;
    }
    if (c.pull) {
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const d = dist(c.x, c.y, e.x, e.y);
        if (d < c.pull && d > 1) {
          const a = angleTo(e.x, e.y, c.x, c.y);
          e.x += Math.cos(a) * 120 * dt;
          e.y += Math.sin(a) * 120 * dt;
        }
      }
    }
    for (const e of this.enemies) {
      if (e.hp <= 0 || c.hit.has(e)) continue;
      if (dist(c.x, c.y, e.x, e.y) < e.r + 18 * (c.size || 1)) {
        c.hit.add(e);
        this.saleHitEnemy(e, c.dmg, c.x, c.y, 260, { impact: c.impact, color: '#16a085', weapon: c.weaponId });
      }
    }
  }
  this.saleCharges = this.saleCharges.filter((c) => c.life > 0);
};

Game.prototype.updateSaleSeekers = function (dt) {
  for (const s of this.saleSeekers) {
    if (!s.target || s.target.hp <= 0) s.target = this.nearestSaleEnemy(s.x, s.y, 420);
    if (s.target) {
      const a = angleTo(s.x, s.y, s.target.x, s.target.y);
      s.vx += Math.cos(a) * 420 * dt;
      s.vy += Math.sin(a) * 420 * dt;
    }
    const sp = Math.hypot(s.vx, s.vy) || 1;
    const maxSp = s.speed;
    if (sp > maxSp) { s.vx = s.vx / sp * maxSp; s.vy = s.vy / sp * maxSp; }
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.life -= dt;
    s.angle = Math.atan2(s.vy, s.vx);
    if (this.gameMode === 'extract' && typeof this.hitsExtractWall === 'function'
      && this.hitsExtractWall(s.x, s.y, 10)) {
      s.life = 0;
      continue;
    }
    for (const e of this.enemies) {
      if (e.hp <= 0 || s.hit.has(e)) continue;
      if (dist(s.x, s.y, e.x, e.y) < e.r + 12) {
        s.hit.add(e);
        this.saleHitEnemy(e, s.dmg, s.x, s.y, 100, { impact: 'sp_bat2', color: '#2c3e50', weapon: s.weaponId });
        s.life -= 0.8;
      }
    }
  }
  this.saleSeekers = this.saleSeekers.filter((s) => s.life > 0);
};

Game.prototype.updateSaleBeams = function (dt) {
  this._saleBeamAng = (this._saleBeamAng || 0);
  const p = this.player;
  for (const b of this.saleBeams) {
    if (!this.saleWeapons[b.weaponId]) { b.dead = true; continue; }
    if (b.aimNearest) {
      const n = this.nearestSaleEnemy(p.x, p.y, b.length * 1.15);
      if (n) {
        const targetA = angleTo(p.x, p.y, n.x, n.y);
        let da = targetA - b.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const maxTurn = (b.turn || 8) * dt;
        b.angle += Math.abs(da) <= maxTurn ? da : Math.sign(da) * maxTurn;
      }
    } else if (b.spin) {
      b.angle += dt * b.spin;
    }
    this._saleBeamAng = b.angle;
    b.tick += dt;
    const x2 = p.x + Math.cos(b.angle) * b.length;
    const y2 = p.y + Math.sin(b.angle) * b.length;
    b.x2 = x2; b.y2 = y2;
    if (b.tick < 0.1) continue;
    b.tick = 0;
    const halfCone = b.cone || 0;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > b.length + e.r) continue;
      if (halfCone > 0) {
        let da = angleTo(p.x, p.y, e.x, e.y) - b.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) > halfCone) continue;
        this.saleHitEnemy(e, b.dmg, e.x, e.y, 50, { color: '#f1c40f', spark: 'sp_fire1', weapon: b.weaponId });
      } else {
        const ax = p.x, ay = p.y;
        const bx = x2 - ax, by = y2 - ay;
        const t = Math.max(0, Math.min(1, ((e.x - ax) * bx + (e.y - ay) * by) / (bx * bx + by * by || 1)));
        const px = ax + bx * t, py = ay + by * t;
        if (dist(px, py, e.x, e.y) < e.r + b.width * 0.35) {
          this.saleHitEnemy(e, b.dmg, px, py, 60, { color: '#f1c40f', spark: 'sp_fire1', weapon: b.weaponId });
          if (b.burn && Math.random() < 0.35) {
            this.salePuddles.push({
              x: e.x, y: e.y, r: 22, life: 1.6, dmg: this.saleFlatDmg(1), tick: 0, color: '#ea580c',
            });
          }
          if (b.summonBats && Math.random() < 0.1) {
            this.saleSeekers.push({
              x: p.x, y: p.y, vx: 0, vy: 0,
              speed: 280, life: 2.0, dmg: b.dmg, ico: '🦇', visual: 'bats', target: e, hit: new Set(),
            });
          }
        }
      }
    }
  }
  this.saleBeams = this.saleBeams.filter((b) => !b.dead && this.saleWeapons[b.weaponId]);
};

/** LN sword: швабры догоняют цель в радиусе, иначе орбита ожидания. */
Game.prototype.updateSaleSwords = function (dt) {
  const p = this.player;
  if (!p) return;
  this.saleSwords = this.saleSwords || [];
  for (const sw of this.saleSwords) {
    if (!this.saleWeapons[sw.weaponId]) { sw.dead = true; continue; }
    if (sw.cd > 0) sw.cd -= dt;
    const R = sw.range || 160;
    let tgt = null; let bd = R * R;
    for (const e of this.enemies) {
      if (e.hp <= 0 || (e._saleSwordIframe || 0) > 0) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; tgt = e; }
    }
    if (tgt) {
      const dx = tgt.x - sw.x, dy = tgt.y - sw.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const step = (sw.speed || 175) * dt;
      sw.x += (dx / d) * step;
      sw.y += (dy / d) * step;
      sw.ang = Math.atan2(dy, dx);
      if (d < (sw.hitR || 18) + tgt.r && sw.cd <= 0) {
        this.saleHitEnemy(tgt, sw.dmg, sw.x, sw.y, 80, { color: '#27ae60', spark: 'fx_slash', weapon: sw.weaponId });
        tgt._saleSwordIframe = 0.4;
        sw.cd = 0.22;
        if (sw.trail) {
          this.salePuddles.push({
            x: sw.x, y: sw.y, r: 20, life: 1.1, dmg: this.saleFlatDmg(1), tick: 0, color: '#27ae60', poison: true,
          });
        }
      }
    } else {
      const oa = performance.now() * 0.002 + (sw.weaponId.length || 0);
      const ox = p.x + Math.cos(oa) * (R * 0.55);
      const oy = p.y + Math.sin(oa) * (R * 0.55);
      const dx = ox - sw.x, dy = oy - sw.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const step = Math.min(d, (sw.speed || 175) * dt);
      sw.x += (dx / d) * step;
      sw.y += (dy / d) * step;
      if (d > 2) sw.ang = Math.atan2(dy, dx);
    }
  }
  for (const e of this.enemies) {
    if (e._saleSwordIframe > 0) e._saleSwordIframe -= dt;
  }
  this.saleSwords = this.saleSwords.filter((s) => !s.dead && this.saleWeapons[s.weaponId]);
};

/** LN bell: расширяющееся кольцо урона. */
Game.prototype.updateSaleRings = function (dt) {
  this.saleRings = this.saleRings || [];
  for (const ring of this.saleRings) {
    ring.r += Math.max(140, ring.maxR) * dt * 1.35;
    for (const e of this.enemies) {
      if (e.hp <= 0 || ring.hit.has(e)) continue;
      const d = dist(ring.x, ring.y, e.x, e.y);
      if (Math.abs(d - ring.r) < e.r + 14) {
        ring.hit.add(e);
        this.saleHitEnemy(e, ring.dmg, ring.x, ring.y, ring.knock || 200, {
          color: '#f39c12', impact: 'sp_fwave1', weapon: ring.weaponId || 'nova',
        });
      }
    }
  }
  this.saleRings = this.saleRings.filter((r) => r.r < r.maxR);
};

Game.prototype.updateSalePuddles = function (dt) {
  for (const u of this.salePuddles) {
    u.life -= dt;
    u.tick += dt;
    if (u.tick >= 0.35) {
      u.tick = 0;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (dist(u.x, u.y, e.x, e.y) < u.r + e.r) {
          this.saleHitEnemy(e, u.dmg, u.x, u.y, 40, { color: u.color, raw: true, source: u.weaponId || 'puddle' });
          if (u.slow) e.slowTimer = Math.max(e.slowTimer || 0, 0.6);
        }
      }
      if (u.hurtPlayer && this.player && this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
        if (dist(u.x, u.y, this.player.x, this.player.y) < u.r + this.player.r) {
          if (this.player.takeDamage(u.x, u.y)) {
            this.endSaleGame(false, u.killName || 'Пожар в отделе');
            return true;
          }
          this.tookDamage = true;
          sfx.hurt();
          if (this.applySaleFragileExtra()) return true;
        }
      }
    }
  }
  this.salePuddles = this.salePuddles.filter((u) => u.life > 0);
  return false;
};
