/**
 * Вылазка: боевой тик этажа — оружие Распродажи + статичные мобы.
 */
'use strict';

Object.assign(Game.prototype, {
  initExtractRaidCombat(spawnX, spawnY) {
    const weapon = this.getWeapon ? this.getWeapon() : null;
    this.player = new Player(spawnX, spawnY, weapon);
    if (typeof this.refreshPlayerLoadoutWeapon === 'function') this.refreshPlayerLoadoutWeapon();
    this.player.angle = -Math.PI / 2;

    // Минимальный боевой стейт Распродажи — без level-up / директора
    this.saleTime = 0;
    this.saleLevel = 1;
    this.saleXp = 0;
    this.saleXpNext = 99999;
    this.salePassives = {};
    this.saleOverflow = {};
    this.saleWeaponOver = {};
    this.saleBanned = {};
    this.saleFragile = false;
    this.saleForceTypes = null;
    this.saleInvulnExcept = null;
    this.saleEvacMode = null;
    this.saleMobSpeedMul = 1;
    this.saleWeaponDmgMul = 1;
    this.saleXpEventMul = 1;
    this.saleActiveEvent = null;
    this.saleContract = { id: 'none', banTypes: [] };
    this.saleFloorId = 'grocery';
    this.saleRunUnlocks = [];
    this._saleSynSeen = {};
    this._saleShieldT = 0;
    this._saleOrbitVolleyCd = {};
    this._saleLsCd = 0;
    this._salePromoAuraR = 0;
    this._saleUltraAuraR = 0;
    this._saleAura = null;
    this._saleNova = null;
    this._saleBloodAuraR = 0;
    this.pendingUpgrades = 0;
    this.choosingUpgrade = false;
    this.saleDmgNums = [];
    this.salePowerups = [];
    this.saleBossHazards = [];
    this.saleVacuumT = 0;
    this.xpGems = [];
    this.spriteFx = this.spriteFx || [];
    this.spriteFx.length = 0;

    const meta = this.ensureExtractMeta();
    let starter = meta.starterWeapon || EXTRACT_DEFAULT_STARTER;
    if (typeof SALE_WEAPONS !== 'undefined') {
      if (!SALE_WEAPONS[starter] || SALE_WEAPONS[starter].evolved) starter = EXTRACT_DEFAULT_STARTER;
    }
    this.saleWeapons = { [starter]: 1 };
    this.saleWeaponCd = {};
    this.saleOrbits = [];
    this.saleProjectiles = [];
    this.saleBeams = [];
    this.salePuddles = [];
    this.saleCharges = [];
    this.saleSeekers = [];
    this.saleSwords = [];
    this.saleRings = [];
    this.saleBoomerangs = [];
    if (typeof SALE_WEAPONS !== 'undefined') {
      Object.keys(SALE_WEAPONS).forEach((id) => { this.saleWeaponCd[id] = 0.35; });
    }

    if (typeof this.applyMetaToPlayer === 'function') this.applyMetaToPlayer();
    this.applyExtractBackpackGear();
    if (typeof this.applySalePassivesToPlayer === 'function') this.applySalePassivesToPlayer();
    if (typeof this.applySaleHeroToPlayer === 'function') this.applySaleHeroToPlayer();
  },

  /** Моды из рюкзака → salePassives на время рейда (при смерти слоты очищаются). */
  applyExtractBackpackGear() {
    this.salePassives = this.salePassives || {};
    let mug = 0;
    for (const it of this.extractBackpack || []) {
      if (!it || it.kind !== 'gear' || !it.passiveId) continue;
      const id = it.passiveId;
      const add = Math.max(1, it.passiveLv | 0 || 1);
      const def = (typeof SALE_PASSIVES !== 'undefined') ? SALE_PASSIVES[id] : null;
      const max = def && def.max ? def.max : 5;
      this.salePassives[id] = Math.min(max, (this.salePassives[id] || 0) + add);
      if (id === 'mug' || id === 'vitality') mug += add;
    }
    if (this.player && mug > 0) {
      this.player.maxHp += mug;
      this.player.hp = Math.min(this.player.maxHp, (this.player.hp | 0) + mug);
    }
  },

  /** Круг vs стены этажа ТЦ (extract_wall). */
  hitsExtractWall(x, y, r) {
    r = r == null ? 8 : r;
    for (const ob of this.obstacles || []) {
      if (ob.type !== 'extract_wall') continue;
      const cx = Math.max(ob.x, Math.min(x, ob.x + ob.w));
      const cy = Math.max(ob.y, Math.min(y, ob.y + ob.h));
      if (Math.hypot(x - cx, y - cy) < r) return true;
    }
    return false;
  },

  /** Укоротить жизнь/рикошеты свежих снарядов — карта 2400px, иначе улетают за камеру. */
  clampExtractProjectiles() {
    const lifeCap = (typeof EXTRACT_PROJ_LIFE_CAP !== 'undefined') ? EXTRACT_PROJ_LIFE_CAP : 0.75;
    const ricoCap = (typeof EXTRACT_RICOCHET_LIFE_CAP !== 'undefined') ? EXTRACT_RICOCHET_LIFE_CAP : 0.95;
    const bounceCap = (typeof EXTRACT_RICOCHET_BOUNCE_CAP !== 'undefined') ? EXTRACT_RICOCHET_BOUNCE_CAP : 2;
    const boomCap = (typeof EXTRACT_BOOMERANG_RANGE_CAP !== 'undefined') ? EXTRACT_BOOMERANG_RANGE_CAP : 220;
    const maxDist = (typeof EXTRACT_PROJ_MAX_DIST !== 'undefined') ? EXTRACT_PROJ_MAX_DIST : 360;
    const px = this.player ? this.player.x : 0;
    const py = this.player ? this.player.y : 0;

    for (const pr of this.saleProjectiles || []) {
      if (!pr._extractCapped) {
        pr._extractCapped = true;
        if (pr.bounces > 0) {
          pr.life = Math.min(pr.life, ricoCap);
          pr.bounces = Math.min(pr.bounces, bounceCap);
        } else {
          pr.life = Math.min(pr.life, lifeCap);
        }
      }
      if (dist(pr.x, pr.y, px, py) > maxDist) pr.life = 0;
    }
    for (const c of this.saleCharges || []) {
      if (!c._extractCapped) {
        c._extractCapped = true;
        c.life = Math.min(c.life, lifeCap + 0.15);
      }
      if (dist(c.x, c.y, px, py) > maxDist) c.life = 0;
    }
    for (const b of this.saleBoomerangs || []) {
      if (b.range > boomCap) b.range = boomCap;
      if (dist(b.x, b.y, px, py) > maxDist + 40) b.dead = true;
    }
    for (const s of this.saleSeekers || []) {
      if (!s._extractCapped) {
        s._extractCapped = true;
        s.life = Math.min(s.life, 1.2);
      }
      if (dist(s.x, s.y, px, py) > maxDist + 80) s.life = 0;
    }
  },

  onExtractEnemyKilled(enemy) {
    this.score = (this.score || 0) + 1;
    this.spawnParticles(enemy.x, enemy.y, 10, '#e74c3c', 140, 0.35);
    if (typeof this.spawnSpriteFx === 'function') {
      this.spawnSpriteFx(Math.random() < 0.55 ? 'fx_blood' : 'fx_hit_blood', enemy.x, enemy.y, {
        scale: enemy._extractElite ? 0.9 : 0.55,
        life: 0.3,
        vy: -12,
      });
    }
    if ((enemy.type === 'fatty' || enemy.explodes) && typeof this.armFattyFuse === 'function') {
      this.armFattyFuse(enemy);
    }
    if (enemy._extractLootId) {
      const loot = (this.extractLoot || []).find((L) => L.id === enemy._extractLootId);
      if (loot) {
        loot.locked = false;
        this.showExtractBanner(`${loot.def.ico} ${loot.def.name} можно забрать`);
      }
    }
    if (enemy._extractExitBoss || (enemy._extractId && this.extractElevator && this.extractElevator.lockedBy === enemy._extractId)) {
      if (this.extractElevator) this.extractElevator.locked = false;
      this.extractExitBossAlive = false;
      const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
      const canGoUp = (this.extractFloor || 1) < maxFloor;
      this.showExtractBanner(
        canGoUp
          ? 'Лифт разблокирован — выбери убежище или этаж выше'
          : 'Лифт разблокирован — можно в убежище',
        3.2,
      );
    }
    // Мелкий дроп монет вылазки с элиты / босса выхода
    if (enemy._extractElite || enemy._extractExitBoss) {
      const meta = this.ensureExtractMeta();
      meta.coins = (meta.coins | 0) + (enemy._extractExitBoss ? 25 : 8);
      this.refreshExtractHud();
    }
    sfx.kill();
  },

  failExtractRaid(reason) {
    const meta = this.ensureExtractMeta();
    // Смерть: лут, моды и купленные карманы сгорают — снова стартовый рюкзак
    const slots = EXTRACT_BACKPACK_START_SLOTS;
    meta.backpackSlots = slots;
    this.extractBackpack = new Array(slots).fill(null);
    this.salePassives = {};
    this.saleWeapons = null;
    this.extractFocus = null;
    this.choosingUpgrade = false;
    this.shopping = false;
    this.paused = false;
    this.gameOver = false;
    this.extractFloor = 1;
    this.extractPhase = 'hub';
    this.buildExtractHubWorld();
    this.refreshExtractHud();
    const tip = `Смерть! Рюкзак сброшен (${slots} слотов). ${reason || ''}`.trim();
    this.showExtractBanner(tip, 3.5);
    sfx.hurt();
    this.refreshMusicState();
  },

  succeedExtractRaid() {
    const pack = this.extractBackpack || [];
    let n = 0;
    let value = 0;
    for (const it of pack) {
      if (!it) continue;
      n++;
      value += it.value || 0;
    }
    this.extractFloor = 1;
    this.extractPhase = 'hub';
    this.extractFocus = null;
    this.closeExtractShop();
    this.buildExtractHubWorld();
    this.refreshExtractHud();
    if (n > 0) {
      this.showExtractBanner(`Эвакуация! В рюкзаке ${n} предметов (~${value}🪙)`, 3.2);
    } else {
      this.showExtractBanner('Эвакуация без лута. Можно вернуться.', 2.6);
    }
    sfx.win();
    this.refreshMusicState();
  },

  tickExtractCombat(realDt) {
    // Авто-оружие как в Распродаже
    if (typeof this.updateSaleWeapons === 'function') this.updateSaleWeapons(realDt);
    if (typeof this.updateSaleOrbits === 'function') this.updateSaleOrbits(realDt);
    if (typeof this.updateSaleSwords === 'function') this.updateSaleSwords(realDt);
    if (typeof this.updateSaleRings === 'function') this.updateSaleRings(realDt);
    if (typeof this.updateSaleBoomerangs === 'function') this.updateSaleBoomerangs(realDt);
    if (typeof this.updateSaleProjectiles === 'function') this.updateSaleProjectiles(realDt);
    if (typeof this.updateSaleCharges === 'function') this.updateSaleCharges(realDt);
    if (typeof this.updateSaleSeekers === 'function') this.updateSaleSeekers(realDt);
    if (typeof this.updateSaleBeams === 'function') this.updateSaleBeams(realDt);
    this.clampExtractProjectiles();
    if (typeof this.updateSalePuddles === 'function' && this.updateSalePuddles(realDt)) {
      // puddles могут убить игрока через sale-path — перехватим ниже через fail
    }

    // Фитили жирных
    for (const bomb of this.fuseBombs || []) {
      bomb.life -= realDt;
      if (bomb.life <= 0 && !bomb.exploded) {
        bomb.exploded = true;
        if (typeof this.explodeAt === 'function') {
          // explodeAt в sale-hooks только для sale; для extract — базовый/ручной урон
          this.extractExplodeAt(bomb.x, bomb.y);
        }
      }
    }
    this.fuseBombs = (this.fuseBombs || []).filter((b) => !b.exploded);

    // Линии боссов: без тика телеграфы залипают красными следами
    if (typeof this.updateBossLineAttacks === 'function') {
      if (this.updateBossLineAttacks(realDt)) return true;
    }

    // Мобы: агр по радиусу, потом chase (без глобального Enemy-агро 420)
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
      if (!enemy._extractAggro && d < (enemy._extractAggroR || 160)) {
        enemy._extractAggro = true;
      }

      if (!enemy._extractAggro) {
        // Стоят на точке / слегка вертятся — не бегут через полкарты
        enemy.wanderTimer = (enemy.wanderTimer || 1) - realDt;
        if (enemy.wanderTimer <= 0) {
          enemy.angle = rand(0, Math.PI * 2);
          enemy.wanderTimer = rand(1.5, 3);
        }
        if (enemy.hitFlash > 0) enemy.hitFlash -= realDt;
        if (enemy.stunTimer > 0) enemy.stunTimer -= realDt;
      } else {
        if (!(enemy.saleBossId && enemy._saleChargeT > 0)) {
          enemy.update(realDt, this.player, this.worldW, this.worldH, true, this);
        }
        this.pushOutOfObstacles(enemy, enemy.r);
      }

      const hitR = this.player.r + enemy.r - 2;
      if (d < hitR) {
        if (enemy.noDamage || enemy.type === 'child') {
          const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
          this.player.knockback.x += Math.cos(a) * 140;
          this.player.knockback.y += Math.sin(a) * 140;
        } else if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (this.player.takeDamage(enemy.x, enemy.y)) {
            this.failExtractRaid(enemy.nameTag || 'Охрана');
            return true;
          }
          sfx.hurt();
          this.vibrate(40);
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // снаряды боссов/книги (на всякий)
    for (const pr of this.projectiles || []) {
      pr.update(realDt);
      if (!pr.dead && dist(pr.x, pr.y, this.player.x, this.player.y) < this.player.r + pr.r) {
        pr.dead = true;
        if (this.player.invincible <= 0 && this.player.takeDamage(pr.x, pr.y)) {
          this.failExtractRaid(pr._saleBossKill || 'Снаряд');
          return true;
        }
      }
    }
    this.projectiles = (this.projectiles || []).filter((pr) => !pr.dead);

    if (this.saleDmgNums && this.saleDmgNums.length) {
      for (const dn of this.saleDmgNums) {
        dn.life -= realDt;
        dn.y += dn.vy * realDt;
      }
      this.saleDmgNums = this.saleDmgNums.filter((dn) => dn.life > 0);
    }

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt);
    for (const p of this.particles) p.update(realDt);
    this.particles = this.particles.filter((p) => !p.dead);
    for (const b of this.boomFx || []) b.life -= realDt;
    this.boomFx = (this.boomFx || []).filter((b) => b.life > 0);
    if (typeof this.tickSpriteFx === 'function') this.tickSpriteFx(realDt);
    if (typeof this.flushReviveFx === 'function') this.flushReviveFx();
    return false;
  },

  extractExplodeAt(x, y) {
    const R = typeof FATTY_EXPLODE_RADIUS !== 'undefined' ? FATTY_EXPLODE_RADIUS : 90;
    this.spawnParticles(x, y, 30, '#ff6b00', 360, 0.8);
    this.spawnParticles(x, y, 16, '#fff200', 220, 0.5);
    this.screenShake = Math.max(this.screenShake || 0, 0.3);
    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x, y, life: 0.4, max: 0.4 });
    sfx.hurt();
    if (this.player && this.player.invincible <= 0 && this.player.lunchTimer <= 0) {
      if (dist(x, y, this.player.x, this.player.y) < R + this.player.r) {
        if (this.player.takeDamage(x, y)) {
          this.failExtractRaid('Взрыв');
          return true;
        }
      }
    }
    for (const e of this.enemies || []) {
      if (e.hp <= 0) continue;
      if (dist(x, y, e.x, e.y) < R + e.r) {
        if (typeof this.saleHitEnemy === 'function') {
          this.saleHitEnemy(e, 2, x, y, 120, { source: 'explode' });
        } else {
          e.hit(2, x, y);
        }
      }
    }
    return false;
  },
});
