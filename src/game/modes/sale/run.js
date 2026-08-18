/**
 * Распродажа: Старт забега: сброс состояния, герой, этаж, контракт, множители.
 */
'use strict';

// ─── Sale mode implementation ──────────────────────────────────

Game.prototype.resetSaleGame = function () {
  this.hideOverlays();
  // на случай если class ещё не применился — гарантируем layout
  document.body.classList.add('sale-mode');
  this.resize();
  this.worldW = Math.max(2800, Math.floor(this.viewW() * SALE_WORLD_MUL));
  this.worldH = Math.max(2000, Math.floor(this.viewH() * SALE_WORLD_MUL));

  if (this.selectedChallenge === 'hammer_only') {
    this.weaponId = 'hammer';
    this.hammerId = 'hammer';
  }
  const weapon = this.getWeapon();
  this.player = new Player(this.worldW / 2, this.worldH / 2, weapon);
  this.player.equippedWeaponId = this.weaponId;
  this.enemies = [];
  this.particles = [];
  this.projectiles = [];
  this.pickups = [];
  this.boomFx = [];
  this.bossLines = [];
  this.fuseBombs = [];
  this.playerProjectiles = [];
  this.saleOrbits = [];
  this.saleBoomerangs = [];
  this.xpGems = [];
  this.spriteFx = [];
  this.animFx = [];

  this.score = 0;
  const gearEq = this.getGearBonuses ? this.getGearBonuses() : { coinStart: 0 };
  this.coins = 5 + (this.metaPerks.wallet || 0) * 4 + (gearEq.coinStart || 0);
  this.coinMult = this.selectedChallenge === 'x2' ? 2 : 1;
  this.screenShake = 0;
  this.modeTimer = 0;
  this.isChaseMode = true;
  this.modeFlash = 0;
  this.wavePhase = 'sale';
  this.wave = 1;
  this.waveKills = 0;
  this.waveSpawned = 0;
  this.combo = 0;
  this.maxCombo = 0;
  this.comboTimer = 0;
  this.comboShield = 0;
  this.pendingUpgrades = 0;
  this.upgradeChoices = [];
  this._saleKeyPity = {};
  this._saleRecipeReadyAt = {};
  this._saleChestEvoPick = false;
  this._saleV2WepPick = false;
  this._saleV2WepPending = 0;
  this.choosingUpgrade = false;
  this._saleLevelFxT = 0;
  this.shopping = false;
  this.paused = false;
  this.gameOver = false;
  this.won = false;
  this.killedBy = '';
  this.directorSpawned = false;
  this.lightsOut = 0;
  this.fireAlarm = 0;
  this.eventCooldown = 9999;
  this._eventBanner = null;
  this.challengeFailed = false;
  this.tookDamage = false;

  // минутные события
  this.saleEventMinute = 0;
  this.saleLastEventId = null;
  this.saleActiveEvent = null;
  this.saleMobSpeedMul = 1;
  this.saleSpawnMul = 1;
  this.saleXpEventMul = 1;
  this.saleWeaponDmgMul = 1;
  this.saleFragile = false;
  this.saleForceTypes = null;
  this.saleInvulnExcept = null;
  this.saleEvacMode = null;
  this.saleEventAcc = 0;
  this.saleTempWalls = [];
  this.saleVipRef = null;
  this.saleBossSpawned = {};
  this._saleBossKilled = {};
  this.saleBossIdx = 0;
  this._gearRunMatGain = 0;
  this._gearRunKpiGain = 0;
  this.saleBossT = SALE_BOSS_INTERVAL;
  this.saleWaveT = SALE_WAVE_FIRST;
  this.saleEliteT = SALE_ELITE_START;
  this.saleLastWaveKind = null;
  this.saleBossHazards = [];
  this.saleArenaShrink = 0;
  this.salePowerups = [];
  this.saleDmgNums = [];
  this.saleVacuumT = 0;
  this._saleBloodAuraR = 0;
  this._saleAura = null;
  this.saleBanned = {};
  this.saleBanishesLeft = SALE_BANISH_LIMIT;
  this._saleBanishMode = false;
  this.saleOverflow = {};
  this.saleWeaponOver = {};
  this.saleRoleBan = null;
  this.saleRunUnlocks = [];
  this._saleSynSeen = {};
  this.saleFloorId = this.selectedFloorId || 'grocery';
  this.saleContract = (typeof SALE_CONTRACTS !== 'undefined' && SALE_CONTRACTS.find((c) => c.id === 'none'))
    || { id: 'none', banTypes: [], coinMul: 1 };
  this._saleShieldT = 0;
  this._saleOrbitVolleyCd = {};
  // баннер контракта/этажа — после старта кадра (см. ниже)

  // Sale state
  this.saleTime = 0;
  this.saleSpawnAcc = 0;
  this.saleLevel = 1;
  this.saleXp = 0;
  this.saleXpNext = saleXpToNext(1);
  if (this.saleV2 && typeof SALE_V2_XP_MUL === 'number') {
    this.saleXpNext = Math.floor(this.saleXpNext * SALE_V2_XP_MUL);
  }
  this.salePassives = {};
  this._saleV2WepT = typeof SALE_V2_WEAPON_TICK === 'number' ? SALE_V2_WEAPON_TICK : 30;
  this._saleV2Picked = {};
  this._saleV2PendingEvos = [];
  this._saleV2FreeShot = false;
  this._saleV2FreeCdT = 0;
  this._saleV2AuraStunT = 0;
  this._saleV2YankT = 0;
  this._saleV2TillCd = 0;
  this._saleV2Side = 'atk';
  // Дерево хаба — только классика. 2.0 качает пассивки в забеге.
  if (this.saleV2) {
    this.saleTreeActive = [];
  } else {
    this.saleTreeActive = (this.saleTreeSelected || []).filter((id) => (this.saleTreeUnlocked || []).includes(id));
    this.saleTreeActive = clampSaleTreeSelected(this.saleTreeActive, this.saleTreeUnlocked);
  }
  this.upgradeRerollsLeft = 3 + (this.saleTreeBonus('reroll') || 0);
  // LN-style: в руки только стартер героя. Купленное в хабе — ассортимент пула, не инвентарь.
  const heroStart = getSaleHero(this.selectedHeroId);
  let starter = heroStart.starterWeapon || 'coffee';
  if (!SALE_WEAPONS[starter] || SALE_WEAPONS[starter].evolved) starter = 'coffee';
  // Контракт может банить тип стартера (Игорь + «Без луж» = кофе глушится) — фолбэк.
  this._saleStarterFallback = null;
  const contractBan = (this.saleContract && this.saleContract.banTypes) || [];
  const starterDef0 = SALE_WEAPONS[starter];
  if (starterDef0 && contractBan.includes(starterDef0.type)) {
    const pickSafe = () => {
      for (const id of ['coffee', 'receipt', 'card', 'speaker', 'phone', 'mop']) {
        const d = SALE_WEAPONS[id];
        if (!d || d.evolved || contractBan.includes(d.type)) continue;
        if (typeof this.isSaleWeaponHeroUnlocked === 'function' && !this.isSaleWeaponHeroUnlocked(id)) continue;
        return id;
      }
      for (const id of Object.keys(SALE_WEAPONS)) {
        const d = SALE_WEAPONS[id];
        if (!d || d.evolved || contractBan.includes(d.type)) continue;
        if (typeof this.isSaleWeaponHeroUnlocked === 'function' && !this.isSaleWeaponHeroUnlocked(id)) continue;
        return id;
      }
      return 'receipt';
    };
    const safe = pickSafe();
    this._saleStarterFallback = { from: starter, to: safe };
    starter = safe;
  }
  this.saleWeapons = { [starter]: 1 };
  // миграция старых id на всякий случай (если дев-панель подсунула)
  if (this.saleWeapons.hammer) { delete this.saleWeapons.hammer; this.saleWeapons.receipt = this.saleWeapons.receipt || 1; }
  if (this.saleWeapons.tags) { this.saleWeapons.receipt = Math.max(this.saleWeapons.receipt || 0, this.saleWeapons.tags); delete this.saleWeapons.tags; }
  if (this.saleWeapons.scanner) { this.saleWeapons.phone = Math.max(this.saleWeapons.phone || 0, this.saleWeapons.scanner); delete this.saleWeapons.scanner; }

  this.saleWeaponCd = {};
  this.saleRegenTimer = 0;
  this.saleOrbits = [];
  this.saleProjectiles = [];
  this.saleBeams = [];
  this.salePuddles = [];
  this.saleCharges = [];
  this.saleSeekers = [];
  this.saleSwords = [];
  this.saleRings = [];
  this._saleSiren = null;
  this._salePromoAuraR = 0;
  this._saleUltraAuraR = 0;
  Object.keys(SALE_WEAPONS).forEach((id) => { this.saleWeaponCd[id] = 0.25; });

  this.initSaleBalanceLog();
  this.hookSaleBalancePlayerHurt();
  if (typeof this.hookSaleV2PlayerDefense === 'function') this.hookSaleV2PlayerDefense();

  this.applyMetaToPlayer();
  this.applySalePassivesToPlayer();
  this.applySaleHeroToPlayer();
  const treeHp = this.saleTreeBonus('hp');
  if (treeHp) {
    this.player.maxHp += treeHp;
    this.player.hp = this.player.maxHp;
  }
  // HP героя после vitality
  const hero = getSaleHero(this.selectedHeroId);
  if (hero.maxHpBonus) {
    this.player.maxHp += hero.maxHpBonus;
    this.player.hp = this.player.maxHp;
  }
  this.generateObstacles();
  this.generateStorefronts();
  this.generateWallDecor();
  this.generateZones();
  this.camera.x = this.player.x - this.viewW() / 2;
  this.camera.y = this.player.y - this.viewH() / 2;

  // стартовый наплыв — редко и далеко, как VS (не 28 в лицо)
  for (let i = 0; i < 8; i++) this.spawnSaleEnemy();
  this._saleLsCd = 0;

  const c = this.saleContract;
  const bits = [];
  if (c && c.id !== 'none') bits.push(c.ico + ' ' + c.name);
  if (this._saleStarterFallback) {
    const to = SALE_WEAPONS[this._saleStarterFallback.to];
    bits.push((to && to.ico ? to.ico + ' ' : '') + 'Старт: ' + ((to && to.name) || this._saleStarterFallback.to));
  }
  if (bits.length) this.showEventBanner(bits.join(' · '), 2.2);

  this.refreshMusicState();
  sfx.click();
};

Game.prototype.applySalePassivesToPlayer = function () {
  const p = this.player;
  if (!p) return;
  const spd = this.saleV2
    ? this.saleV2Stat('speed')
    : (this.salePassives.key || 0) * 0.06;
  const caffDef = this.saleWeapons.caffeine && SALE_WEAPONS.caffeine;
  const caff = caffDef ? ((caffDef.buffSpeed || 1.25) - 1) : 0;
  const hero = getSaleHero(this.selectedHeroId);
  p._saleSpeedMul = (1 + spd + caff) * (hero.speedMul || 1);
};

Game.prototype.saleTreeBonus = function (key) {
  let total = 0;
  for (const id of this.saleTreeActive || this.saleTreeSelected || []) {
    const perk = getSaleTreePerk(id);
    if (perk && perk.bonus && perk.bonus[key] != null) total += perk.bonus[key];
  }
  return total;
};

Game.prototype.applySaleHeroToPlayer = function () {
  const p = this.player;
  if (!p) return;
  const hero = getSaleHero(this.selectedHeroId);
  this.saleHeroId = hero.id;
  p._saleHeroId = hero.id;
  p._saleHeroHue = hero.hue || 0;
  p._saleHeroName = hero.name;
};

Game.prototype.getSaleFloor = function () {
  return null;
};

Game.prototype.saleSynergyOn = function (key) {
  for (const s of SALE_SYNERGIES) {
    if (saleHasFamily(this.saleWeapons, s.a) && saleHasFamily(this.saleWeapons, s.b) && s[key]) return s[key];
  }
  return null;
};

Game.prototype.getActiveSaleSynergies = function () {
  const out = [];
  for (const s of SALE_SYNERGIES) {
    if (saleHasFamily(this.saleWeapons, s.a) && saleHasFamily(this.saleWeapons, s.b)) out.push(s);
  }
  return out;
};

/** Баннер при первой активации синергии в забеге */
Game.prototype.tickSaleSynergyAnnounce = function () {
  this._saleSynSeen = this._saleSynSeen || {};
  for (const s of this.getActiveSaleSynergies()) {
    const key = s.a + '+' + s.b;
    if (this._saleSynSeen[key]) continue;
    this._saleSynSeen[key] = true;
    this.showEventBanner('🔗 Синергия: ' + s.label, 2.0);
    break;
  }
};

Game.prototype.getSaleArenaRun = function () {
  const id = this.selectedArena || 'sport';
  const extra = (typeof SALE_ARENA_RUN !== 'undefined' && SALE_ARENA_RUN[id]) || {};
  const base = (typeof SALE_ARENA_RUN_DEFAULT !== 'undefined')
    ? SALE_ARENA_RUN_DEFAULT
    : { weaponSlots: SALE_MAX_WEAPONS, hpMul: 1, spdMul: 1, spawnMul: 1, capMul: 1, burstAdd: 0 };
  return {
    weaponSlots: extra.weaponSlots != null ? extra.weaponSlots : base.weaponSlots,
    hpMul: extra.hpMul != null ? extra.hpMul : base.hpMul,
    spdMul: extra.spdMul != null ? extra.spdMul : base.spdMul,
    spawnMul: extra.spawnMul != null ? extra.spawnMul : base.spawnMul,
    capMul: extra.capMul != null ? extra.capMul : base.capMul,
    burstAdd: extra.burstAdd != null ? extra.burstAdd : base.burstAdd,
  };
};

Game.prototype.saleMaxWeaponSlots = function () {
  const c = this.saleContract;
  if (c && c.maxWeapons) return c.maxWeapons;
  return this.getSaleArenaRun().weaponSlots + this.saleTreeBonus('weaponSlots');
};

Game.prototype.saleDmgMul = function () {
  const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
  const over = (this.saleOverflow && this.saleOverflow.power) || 0;
  const p = this.salePassives;
  const keyDmg = this.saleV2 ? this.saleV2Stat('damage') : (p.discount || 0) * 0.08;
  return (1 + keyDmg
    + this.saleTreeBonus('damage') + over * 0.08)
    * (this.saleWeaponDmgMul || 1)
    * (hero.dmgMul || 1)
    * SALE_DIFFICULTY.weaponDmg
    * (SALE_STAT_SCALE || 1);
};

/** Фиксированный DoT/бомба в масштабе SALE_STAT_SCALE (лужи dmg:1 → 10). */
Game.prototype.saleFlatDmg = function (n) {
  return Math.max(1, Math.round((n == null ? 1 : n) * (SALE_STAT_SCALE || 1)));
};
Game.prototype.saleCdMul = function () {
  const haste = this.saleV2
    ? this.saleV2Stat('cooldown')
    : (this.salePassives.charger || 0) + (this.salePassives.energy || 0);
  const over = (this.saleOverflow && this.saleOverflow.tempo) || 0;
  const floor = this.getSaleFloor();
  const floorCd = floor && floor.cdMul ? floor.cdMul : 1;
  const hasteMul = this.saleV2 ? haste : haste * 0.06;
  return Math.max(0.35, (1 - hasteMul + this.saleTreeBonus('cooldown') - over * 0.06) * floorCd);
};
Game.prototype.saleAreaMul = function () {
  const over = (this.saleOverflow && this.saleOverflow.space) || 0;
  const p = this.salePassives;
  let m = 1 + this.saleTreeBonus('area') + over * 0.08;
  if (this.saleV2) m += this.saleV2Stat('area');
  else {
    m += (p.gloves || 0) * 0.08 + (p.map || 0) * 0.08 + (p.printer || 0) * 0.06;
  }
  const orb = this.saleSynergyOn('orbitBonus');
  if (orb) m += orb;
  return m;
};
Game.prototype.saleMagnetRange = function () {
  const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
  const floor = this.getSaleFloor();
  const eq = this.getEquipBonuses ? this.getEquipBonuses() : { magnet: 0 };
  const mag = this.saleV2
    ? this.saleV2Stat('magnet')
    : ((this.salePassives.headlamp || 0) + (this.salePassives.magnet_pass || 0)) * 25;
  let bonus = 70 + mag
    + (this.metaPerks.magnet || 0) * 20 + (hero.magnetBonus || 0)
    + (floor && floor.magnetBonus ? floor.magnetBonus : 0)
    + (eq.magnet || 0) + this.saleTreeBonus('magnet');
  if (this.saleWeapons && this.saleWeapons.vip) bonus += 50;
  if (this.saleV2) bonus *= 1 + this.saleV2Stat('magnetPct');
  return bonus;
};

Game.prototype.saleRangeMul = function () {
  return 1 + (this.saleV2 ? this.saleV2Stat('range') : 0);
};

/** Бонус орбит от чекового аппарата / ленты (кап 2 — иначе AFK-чек) */
Game.prototype.saleOrbitBonus = function () {
  const n = this.saleV2 ? this.saleV2Stat('orbit') : (this.salePassives.ribbon || 0);
  return Math.min(2, n);
};
Game.prototype.saleXpMul = function () {
  const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
  const eq = this.getEquipBonuses ? this.getEquipBonuses() : { xpMul: 1 };
  const xp = this.saleV2 ? this.saleV2Stat('xp') : (this.salePassives.badge || 0) * 0.08;
  return (1 + xp + this.saleTreeBonus('xp')) * (hero.xpMul || 1) * (eq.xpMul || 1);
};
Game.prototype.saleAuraDmgMul = function () {
  return 1 + (this.saleV2 ? this.saleV2Stat('aura') : (this.salePassives.headphones || 0) * 0.12);
};
Game.prototype.saleProjectileBonus = function () {
  const n = this.saleV2 ? this.saleV2Stat('projectile') : (this.salePassives.pouch || 0);
  return Math.min(2, n);
};
