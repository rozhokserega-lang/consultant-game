/** Запись прогресса в сохранение. */

Object.assign(Game.prototype, {
  persist() {
    saveSave({
      highScore: this.highScore,
      highWaveLevel: this.highWaveLevel || 0,
      sound: sfx.enabled,
      music: music.enabled,
      vibro: this.vibro,
      dmgNumbers: this.showDmgNumbers,
      liteGfx: !!this.liteGfx,
      weaponId: this.weaponId,
      hammerId: this.weaponId,
      ownedWeapons: this.ownedWeapons,
      weaponLevels: this.weaponLevels,
      abilityLevels: this.abilityLevels,
      bankCoins: this.bankCoins,
      metaPerks: this.metaPerks,
      selectedArena: this.selectedArena,
      saleUnlockedArenas: this.saleUnlockedArenas || ['sport'],
      gameMode: this.gameMode,
      saleUnlockedWeapons: this.saleUnlockedWeapons,
      saleStartPassives: this.saleStartPassives,
      selectedFloorId: this.selectedFloorId || 'grocery',
      selectedContractId: this.selectedContractId || 'none',
      selectedHeroId: this.selectedHeroId || 'igor',
      saleUnlockedHeroes: this.saleUnlockedHeroes || ['igor'],
      gearVersion: this.gearVersion || 0,
      kpiBalance: this.kpiBalance || 0,
      gearBossKillsTotal: this.gearBossKillsTotal || 0,
      gearByHero: this.gearByHero || {},
      gearMaterials: this.gearMaterials || {},
      killLog: this.killLog,
      // не затирать прогресс Вылазки, если meta ещё не поднимали в этой сессии
      extractMeta: this.extractMeta || (this.save && this.save.extractMeta) || null,
      extractBackpack: Array.isArray(this.extractBackpack)
        ? this.extractBackpack.map((it) => (it ? Object.assign({}, it) : null))
        : (this.save && Array.isArray(this.save.extractBackpack)
          ? this.save.extractBackpack
          : null),
    });
  },

  /** Обнуляет прогрессию, настройки звука/вибро не трогает. */
  resetAllProgression() {
    this.highScore = 0;
    this.highWaveLevel = 0;
    this.bankCoins = 0;
    this.metaPerks = {
      tank: 0, speed: 0, crit: 0, life: 0, wallet: 0, magnet: 0, reach: 0, dash: 0, thick: 0,
    };
    this.weaponLevels = {};
    this.abilityLevels = { dash: 0, tea: 0, charge: 0 };
    this.killLog = {};
    this.selectedChallenge = 'none';
    this.selectedArena = 'sport';
    this.saleUnlockedArenas = ['sport'];
    this.saleUnlockedWeapons = ['receipt'];
    this.saleStartPassives = {};
    this.selectedHeroId = 'igor';
    this.saleUnlockedHeroes = ['igor'];
    this.saleHeroId = 'igor';
    this.selectedFloorId = 'grocery';
    this.selectedContractId = 'none';
    this.kpiBalance = 0;
    this.gearBossKillsTotal = 0;
    this.gearByHero = {};
    this.gearMaterials = (typeof emptyGearMaterials === 'function')
      ? emptyGearMaterials()
      : { badge_shard: 0, card_film: 0, radio_cell: 0, kpi_token: 0 };
    this.equipOwned = [];
    this.equipLoadouts = {};
    if (typeof this.ensureGearState === 'function') this.ensureGearState();
    this.ownedWeapons = ['hammer'];
    this.weaponId = 'hammer';
    this.hammerId = 'hammer';
    this.extractRunInsurance = null;
    const startSlots = (typeof EXTRACT_BACKPACK_START_SLOTS !== 'undefined')
      ? EXTRACT_BACKPACK_START_SLOTS
      : 5;
    this.extractMeta = {
      backpackSlots: startSlots,
      coins: 80,
      starterWeapon: (typeof EXTRACT_DEFAULT_STARTER !== 'undefined') ? EXTRACT_DEFAULT_STARTER : 'receipt',
      totalExtractedValue: 0,
    };
    this.extractBackpack = new Array(startSlots).fill(null);
    if (typeof this.persist === 'function') this.persist();
    if (typeof loadSave === 'function') this.save = loadSave();
    if (typeof this.applySaleHeroToPlayer === 'function') this.applySaleHeroToPlayer();
    if (typeof this.prepareIdleWorld === 'function') this.prepareIdleWorld();
  },
});
