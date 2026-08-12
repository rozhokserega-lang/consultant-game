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
    if (typeof this.isExtractStarterUnlocked === 'function' && !this.isExtractStarterUnlocked(starter)) {
      starter = EXTRACT_DEFAULT_STARTER;
      meta.starterWeapon = starter;
    }
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
    if (typeof this.hookExtractBalancePlayerHurt === 'function') this.hookExtractBalancePlayerHurt();
  },

  /** Моды из рюкзака → salePassives на время рейда (при смерти слоты очищаются). */
  applyExtractBackpackGear() {
    this.salePassives = this.salePassives || {};
    let mug = 0;
    let gearCount = 0;
    for (const it of this.extractBackpack || []) {
      if (!it || it.kind === 'bulkPad') continue;
      if (it.kind !== 'gear' || !it.passiveId) continue;
      gearCount++;
      const id = it.passiveId;
      const add = Math.max(1, it.passiveLv | 0 || 1);
      const def = (typeof SALE_PASSIVES !== 'undefined') ? SALE_PASSIVES[id] : null;
      const max = def && def.max ? def.max : 5;
      this.salePassives[id] = Math.min(max, (this.salePassives[id] || 0) + add);
      if (id === 'mug' || id === 'vitality') mug += add;
    }
    const need = (typeof EXTRACT_MOD_SET_NEED !== 'undefined') ? EXTRACT_MOD_SET_NEED : 3;
    this._extractModSetOn = gearCount >= need;
    if (this._extractModSetOn) {
      const dmg = (typeof EXTRACT_MOD_SET_DMG !== 'undefined') ? EXTRACT_MOD_SET_DMG : 1.1;
      this.saleWeaponDmgMul = (this.saleWeaponDmgMul || 1) * dmg;
      if (this.player) {
        const spd = (typeof EXTRACT_MOD_SET_SPEED !== 'undefined') ? EXTRACT_MOD_SET_SPEED : 1.08;
        this.player._extractModSetSpeed = spd;
      }
    } else if (this.player) {
      this.player._extractModSetSpeed = 1;
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
    if (typeof this.recordExtractBalanceKill === 'function') this.recordExtractBalanceKill(enemy);
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
    if (enemy._extractIsQueueLeader && typeof this.onExtractQueueLeaderKilled === 'function') {
      this.onExtractQueueLeaderKilled(enemy);
    }
    if (enemy._extractExitBoss || (enemy._extractId && this.extractElevator && this.extractElevator.lockedBy === enemy._extractId)) {
      if (this.extractElevator) this.extractElevator.locked = false;
      this.extractExitBossAlive = false;
      this.beginExtractEvacWindow();
      const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
      const canGoUp = (this.extractFloor || 1) < maxFloor;
      const win = (typeof EXTRACT_EVAC_WINDOW !== 'undefined') ? EXTRACT_EVAC_WINDOW : 48;
      this.showExtractBanner(
        canGoUp
          ? `Лифт открыт · ${Math.round(win)}с до подкрепления — убежище или этаж выше`
          : `Лифт открыт · ${Math.round(win)}с до подкрепления — в убежище!`,
        3.4,
      );
    }
    // Мелкий дроп монет вылазки с элиты / босса выхода
    if (enemy._extractElite || enemy._extractExitBoss) {
      const meta = this.ensureExtractMeta();
      meta.coins = (meta.coins | 0) + (enemy._extractExitBoss ? 25 : 8);
      this.persistExtract();
      this.refreshExtractHud();
    }
    // Рабочие жетоны → мини-апгрейд забега
    if (typeof this.grantExtractRaidTokens === 'function') {
      if (enemy._extractExitBoss) {
        const n = (typeof EXTRACT_TOKEN_EXIT_BOSS !== 'undefined') ? EXTRACT_TOKEN_EXIT_BOSS : 2;
        this.grantExtractRaidTokens(n);
      } else if (enemy._extractElite) {
        const n = (typeof EXTRACT_TOKEN_ELITE !== 'undefined') ? EXTRACT_TOKEN_ELITE : 1;
        this.grantExtractRaidTokens(n);
      }
    }
    sfx.kill();
  },

  beginExtractEvacWindow() {
    let win = (typeof EXTRACT_EVAC_WINDOW !== 'undefined') ? EXTRACT_EVAC_WINDOW : 48;
    if ((this.extractFloor || 1) >= 3) win = Math.max(28, Math.round(win * 0.7));
    this._extractEvacT = win;
    this._extractEvacFired = false;
  },

  tickExtractEvacWindow(dt) {
    if (this.extractPhase !== 'raid') return;
    if (this._extractEvacT == null || this._extractEvacT < 0) return;
    if (this._extractEvacFired) return;
    this._extractEvacT -= dt;
    if (this._extractEvacT > 0) return;
    this._extractEvacT = 0;
    this._extractEvacFired = true;
    this.spawnExtractElevatorReinforce();
    this.showExtractBanner('Подкрепление у лифта! Прорывайся или дерись', 3.2);
    sfx.mode();
  },

  spawnExtractElevatorReinforce() {
    const el = this.extractElevator;
    if (!el || !this.player) return;
    let n = (typeof EXTRACT_EVAC_REINFORCE !== 'undefined') ? EXTRACT_EVAC_REINFORCE : 7;
    if ((this.extractFloor || 1) >= 3) n += 4;
    const cx = el.x + (el.w || 0) * 0.5;
    const cy = el.y + (el.h || 0) * 0.5;
    const types = ['fast', 'normal', 'queue', 'manager', 'tank', 'returner', 'blogger'];
    const floor = this.extractFloor || 1;
    const floorDef = this.getExtractFloorDef(floor);
    const globalHp = (typeof EXTRACT_MOB_HP_MUL !== 'undefined') ? EXTRACT_MOB_HP_MUL : 1;
    const globalSpd = (typeof EXTRACT_MOB_SPD_MUL !== 'undefined') ? EXTRACT_MOB_SPD_MUL : 1;
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + rand(-0.2, 0.2);
      const rad = 70 + (i % 3) * 28;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      const type = types[i % types.length];
      const e = new Enemy(x, y, type, 1);
      e._extractId = 'evac_wave_' + i;
      e._extractAggro = true;
      e._extractAggroR = 420;
      e.nameTag = 'Подкрепление';
      const hpMul = 1.35 * globalHp * (floorDef.hpMul || 1);
      e.maxHp = Math.max(1, Math.round(e.maxHp * hpMul));
      e.hp = e.maxHp;
      e.speed *= 1.12 * globalSpd * (floorDef.spdMul || 1);
      this.enemies.push(e);
    }
  },

  failExtractRaid(reason) {
    const floorDeath = this.extractFloor || 1;
    const survivedSec = this.extractRaidTime || 0;
    const backpackLost = typeof this.getExtractBackpackValue === 'function' ? this.getExtractBackpackValue() : 0;
    const heat = typeof this.getExtractHeatLevel === 'function' ? this.getExtractHeatLevel() : 0;
    const pressureWaves = this._extractPressureTicks || 0;
    const upgrades = this.extractRaidUpgrades || 0;
    const kills = (this._extractBal && this._extractBal.totals) ? this._extractBal.totals.kills : (this.score || 0);
    const floorMax = (this._extractBal && this._extractBal.floorMax) ? this._extractBal.floorMax : floorDeath;
    const insuredSrc = this.extractRunInsurance && this.extractRunInsurance.item
      ? this.extractRunInsurance.item
      : null;
    const insuredLabel = insuredSrc ? `${insuredSrc.ico || ''} ${insuredSrc.name}`.trim() : '';
    if (typeof this.finalizeExtractBalanceLog === 'function') {
      this.finalizeExtractBalanceLog(false, reason, {
        floorDeath,
        backpackLost,
        heat,
        pressureWaves,
        upgrades,
        insured: insuredLabel,
      });
    }

    const meta = this.ensureExtractMeta();
    const slots = Math.max(
      EXTRACT_BACKPACK_START_SLOTS,
      meta.backpackSlots | 0,
    );
    meta.backpackSlots = slots;
    const insured = insuredSrc ? Object.assign({}, insuredSrc) : null;
    this.extractRunInsurance = null;
    this._extractEvacT = -1;
    this._extractEvacFired = false;
    this._extractLootBuff = null;
    if (typeof this.resetExtractRaidPressure === 'function') this.resetExtractRaidPressure(false);
    this.extractBackpack = new Array(slots).fill(null);
    if (insured) {
      delete insured.insured;
      const need = extractItemSlotSize(insured) || 1;
      let at = this.findExtractPackSpace(need);
      if (at < 0 && need > 1) {
        insured.slots = 1;
        at = this.findExtractPackSpace(1);
      }
      if (at >= 0) this.placeExtractPackItem(at, insured);
    }
    this.salePassives = {};
    this.saleWeapons = null;
    this.extractFocus = null;
    this.choosingUpgrade = false;
    this.shopping = false;
    this.extractFloor = 1;
    this.extractPhase = 'hub';
    this.persistExtract();
    this.buildExtractHubWorld();
    this.refreshExtractHud();
    if (typeof this.showExtractEndOverlay === 'function') {
      this.showExtractEndOverlay(false, reason, {
        floorDeath,
        floorMax,
        survivedSec,
        backpackLost,
        heat,
        pressureWaves,
        upgrades,
        kills,
        insured: insuredLabel,
      });
    } else {
      let tip = `Смерть! Лут сгорел (${backpackLost}🪙).`;
      if (insured) tip = `Смерть! Страховка вернула ${insured.ico || ''} ${insured.name}.`;
      if (reason) tip += ' ' + reason;
      this.showExtractBanner(tip.trim(), 3.5);
      sfx.hurt();
      this.refreshMusicState();
    }
  },

  succeedExtractRaid() {
    const pack = this.extractBackpack || [];
    let n = 0;
    let value = 0;
    for (const it of pack) {
      if (!it || it.kind === 'bulkPad') continue;
      n++;
      value += it.value || 0;
    }
    const meta = this.ensureExtractMeta();
    meta.totalExtractedValue = (meta.totalExtractedValue | 0) + value;
    this.extractRunInsurance = null;
    this._extractEvacT = -1;
    this._extractEvacFired = false;
    this._extractLootBuff = null;
    if (typeof this.resetExtractRaidPressure === 'function') this.resetExtractRaidPressure(false);
    this.extractFloor = 1;
    this.extractPhase = 'hub';
    this.extractFocus = null;
    this.closeExtractShop();
    this.persistExtract();
    this.buildExtractHubWorld();
    this.refreshExtractHud();
    if (n > 0) {
      this.showExtractBanner(
        `Эвакуация! ${n} шт. (~${value}🪙) · вынос всего ${meta.totalExtractedValue|0}`,
        3.4,
      );
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

    if (typeof this.tickExtractTempWalls === 'function') this.tickExtractTempWalls(realDt);
    // Паттерны до chase — windup/dash актуальны в том же кадре
    if (typeof this.tickExtractMobPatterns === 'function') this.tickExtractMobPatterns(realDt);
    if (typeof this.tickExtractBossPatterns === 'function') this.tickExtractBossPatterns(realDt);

    // Мобы: агр по радиусу, потом chase (без глобального Enemy-агро 420)
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
      if (!enemy._extractAggro && !enemy._extractPassive && d < (enemy._extractAggroR || 160)) {
        enemy._extractAggro = true;
      }

      const skipUp = typeof this.extractEnemySkipUpdate === 'function' && this.extractEnemySkipUpdate(enemy);
      if (!enemy._extractAggro) {
        // Стоят на точке / слегка вертятся — не бегут через полкарты
        // (trainee/patrol двигает tickExtractMobPatterns)
        if (!skipUp) {
          enemy.wanderTimer = (enemy.wanderTimer || 1) - realDt;
          if (enemy.wanderTimer <= 0) {
            enemy.angle = rand(0, Math.PI * 2);
            enemy.wanderTimer = rand(1.5, 3);
          }
        }
        if (enemy.hitFlash > 0) enemy.hitFlash -= realDt;
        if (enemy.stunTimer > 0) enemy.stunTimer -= realDt;
      } else if (!skipUp) {
        if (!(enemy.saleBossId && enemy._saleChargeT > 0)) {
          enemy.update(realDt, this.player, this.worldW, this.worldH, true, this);
        }
        this.pushOutOfObstacles(enemy, enemy.r);
      } else {
        if (enemy.hitFlash > 0) enemy.hitFlash -= realDt;
        if (enemy.stunTimer > 0) enemy.stunTimer -= realDt;
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
        if (pr.owner && pr.owner.type === 'returner') {
          this.player.slowTimer = Math.max(this.player.slowTimer || 0, 1.5);
        }
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
