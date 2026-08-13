/**
 * Класс Game — состояние забега и главный цикл.
 *
 * Остальные методы дописывают соседние файлы через Object.assign(Game.prototype),
 * поэтому этот файл должен подключаться раньше них. Разбивка по зонам —
 * core/, arena/, fx/, render/ и bindings-файлы виджетов.
 */

class Game {
  constructor() {
    this.save = loadSave();
    this.highScore = this.save.highScore || 0;
    this.highWaveLevel = this.save.highWaveLevel || 0;
    this.bankCoins = this.save.bankCoins || 0;
    this.metaPerks = Object.assign({
      tank: 0, speed: 0, crit: 0, life: 0, wallet: 0, magnet: 0, reach: 0, dash: 0, thick: 0,
    }, this.save.metaPerks || {});
    this.weaponLevels = Object.assign({}, this.save.weaponLevels || {});
    this.abilityLevels = Object.assign({ dash: 0, tea: 0, charge: 0 }, this.save.abilityLevels || {});
    this.killLog = Object.assign({}, this.save.killLog || {});
    this.hubTab = 'prep';
    this.hubScreen = 'prep'; // prep | book (режим «Смена» убран)
    this.gameMode = 'sale';
    this.selectedArena = this.save.selectedArena || 'sport';
    this.selectedChallenge = 'none';
    const saleArenas = Array.isArray(this.save.saleUnlockedArenas) ? this.save.saleUnlockedArenas : [];
    this.saleUnlockedArenas = Array.from(new Set(['sport', ...saleArenas.filter((id) => ARENA_THEMES && ARENA_THEMES[id])]));
    if (!this.saleUnlockedArenas.includes(this.selectedArena)) this.selectedArena = 'sport';
    const saleWeps = Array.isArray(this.save.saleUnlockedWeapons) ? this.save.saleUnlockedWeapons : [];
    const migratedSale = saleWeps.map((id) => {
      if (id === 'hammer' || id === 'tags' || id === 'scanner') return 'receipt';
      if (typeof SALE_WEAPON_MIGRATE !== 'undefined' && SALE_WEAPON_MIGRATE[id]) return SALE_WEAPON_MIGRATE[id];
      return id;
    }).filter((id) => typeof SALE_WEAPONS === 'undefined' || SALE_WEAPONS[id]);
    this.saleUnlockedWeapons = Array.from(new Set(['receipt', ...migratedSale]));
    this.saleStartPassives = Object.assign({}, this.save.saleStartPassives || {});
    this.selectedHeroId = this.save.selectedHeroId || 'igor';
    const saleHeroes = Array.isArray(this.save.saleUnlockedHeroes) ? this.save.saleUnlockedHeroes : [];
    this.saleUnlockedHeroes = Array.from(new Set(['igor', ...saleHeroes.filter((id) => SALE_HEROES && SALE_HEROES[id])]));
    if (!this.saleUnlockedHeroes.includes(this.selectedHeroId)) this.selectedHeroId = 'igor';
    this.selectedFloorId = this.save.selectedFloorId || 'grocery';
    this.selectedContractId = this.save.selectedContractId || 'none';
    this.gearVersion = this.save.gearVersion || 0;
    this.kpiBalance = this.save.kpiBalance || 0;
    this.gearBossKillsTotal = this.save.gearBossKillsTotal || 0;
    this.gearByHero = this.save.gearByHero || {};
    this.gearMaterials = Object.assign({ badge_shard: 0, card_film: 0, radio_cell: 0, kpi_token: 0 }, this.save.gearMaterials || {});
    this.equipOwned = Array.isArray(this.save.equipOwned) ? this.save.equipOwned.slice() : [];
    this.equipLoadouts = this.save.equipLoadouts || {};
    if (this.migrateGearSave) this.migrateGearSave();
    if (this.ensureGearState) this.ensureGearState();
    this.challengeFailed = false;
    this.tookDamage = false;
    this.playerProjectiles = [];
    this.lightsOut = 0;
    this.fireAlarm = 0;
    this.eventCooldown = 0;
    this._eventBanner = null;
    this.inHub = false;
    this.inMainMenu = false;
    const owned = this.save.ownedWeapons || ['hammer'];
    const validIds = new Set(WEAPONS.map(w => w.id));
    this.ownedWeapons = Array.from(new Set(['hammer', ...owned.filter(id => validIds.has(id))]));
    // migrate old hammer ids
    const mapOld = { standard: 'hammer', fast: 'glove', heavy: 'bat', taser: 'crowbar' };
    this.weaponId = mapOld[this.save.weaponId] || mapOld[this.save.hammerId] || this.save.weaponId || 'hammer';
    if (!this.ownedWeapons.includes(this.weaponId)) this.weaponId = 'hammer';
    this.hammerId = this.weaponId; // compat
    sfx.enabled = this.save.sound !== false;
    music.enabled = this.save.music !== false;
    this.vibro = this.save.vibro !== false;
    this.showDmgNumbers = this.save.dmgNumbers !== false;
    this.coins = 0;
    this.coinMult = 1;
    this.shopping = false;
    this.shopBuysLeft = 2;
    this.shopBoughtRun = new Set();
    this.shopWaveStock = {};

    this.player = null;
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
    this.pickups = [];
    this.boomFx = [];
    this.bossLines = [];
    this.fuseBombs = [];
    this.obstacles = [];
    this.storefronts = [];
    this.zones = [];

    this.score = 0; this.wave = 1;
    this.waveKills = 0;
    this.waveSpawned = 0;
    this.wavePhase = 'mobs'; // mobs | boss | clear
    this.killsPerWave = KILLS_PER_WAVE;
    this.screenShake = 0;
    this.MODE_DURATION = 8; this.modeTimer = 0; this.isChaseMode = true; this.modeFlash = 0;

    this.combo = 0; this.maxCombo = 0; this.comboTimer = 0; this.comboShield = 0;
    this.pendingUpgrades = 0;
    this.upgradeChoices = [];
    this.upgradeRerollsLeft = 3;
    this.choosingUpgrade = false;
    this.paused = false;
    this.gameOver = false;
    this.won = false;
    this.killedBy = '';
    this.directorSpawned = false;
    this.dayDone = false;
    this.fuseBombs = [];

    this.moveDir = { x: 0, y: 0 };
    this.keys = {};
    this.joystickActive = false; this.joystickId = null;
    this.joystickBase = { x: 0, y: 0 }; this.joystickPos = { x: 0, y: 0 };
    this.attackTouchId = null; this.attackHeld = false;

    this.worldW = 1800; this.worldH = 1200;
    this.camera = { x: 0, y: 0 };
    this.viewZoom = 1;
    this.lastTime = performance.now();

    this.cacheHud();
    this.bindUI();
    this.resize();
    this.setupInput();
    this.prepareIdleWorld();
    this.openMainMenu();
    window.game = this;
    this.loop(this.lastTime);
  }

  loop(time) {
    try {
      const dt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      this.update(dt);
      this.render();
      this.updateHUD();
    } catch (e) {
      console.error('Game loop error:', e);
      showCrashOverlay(e, 'Сбой игрового цикла');
      this.paused = true;
    }
    requestAnimationFrame(t => this.loop(t));
  }
}
