/** Жизненный цикл забега: подготовка мира, старт, пауза, выход. */

Object.assign(Game.prototype, {
  prepareIdleWorld() {
    // хаб всегда на обычной карте (Распродажа увеличивает мир только в бою)
    this.worldW = Math.max(1200, Math.floor(this.viewW() * 1.5));
    this.worldH = Math.max(800, Math.floor(this.viewH() * 1.5));
    this.generateObstacles();
    this.generateStorefronts();
    this.generateWallDecor();
    this.generateZones();
    const weapon = this.getWeapon();
    this.player = new Player(this.worldW / 2, this.worldH / 2, weapon);
    this.refreshPlayerLoadoutWeapon();
    this.enemies = []; this.particles = []; this.projectiles = []; this.pickups = [];
    this.playerProjectiles = [];
    this.boomFx = []; this.fuseBombs = [];
    this.bossLines = [];
    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;
    this.paused = true;
    this.inHub = false;
    this.gameOver = false; this.won = false;
  },

  exitGame() {
    sfx.click();
    const tg = window.Telegram && Telegram.WebApp;
    if (tg && typeof tg.close === 'function') {
      tg.close();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    alert('Закройте вкладку, чтобы выйти из игры.');
  },

  startGame() {
    this.hideOverlays();
    this.inMainMenu = false;
    this.inHub = false;
    this.paused = false;
    this.shopping = false;
    this.choosingUpgrade = false;
    this.gameOver = false;
    this.won = false;
    this.gameMode = 'sale';
    document.body.classList.remove('hub-mode', 'main-menu-mode');
    document.body.classList.add('sale-mode');
    this.resize();
    this.resetSaleGame();
    requestAnimationFrame(() => this.resize());
    this.refreshMusicState();
    sfx.click();
  },

  applyMetaToPlayer() {
    const p = this.player;
    const tank = this.metaPerks.tank || 0;
    const spd = this.metaPerks.speed || 0;
    const crit = this.metaPerks.crit || 0;
    const life = this.metaPerks.life || 0;
    const magnet = this.metaPerks.magnet || 0;
    const metaDash = this.metaPerks.dash || 0;
    const thick = this.metaPerks.thick || 0;
    const aDash = this.abilityLevels.dash || 0;
    const aTea = this.abilityLevels.tea || 0;
    const aCharge = this.abilityLevels.charge || 0;
    // оружие + reach через общий refresh (с учётом уровней)
    this.refreshPlayerLoadoutWeapon();
    if (tank > 0) { p.maxHp += tank; p.hp = p.maxHp; }
    if (spd > 0) { p.bonusSpeed = (p.bonusSpeed || 0) + spd * 14; p.recalcStats(); }
    p.critChance = crit * 0.12;
    p.extraLives = life;
    p.coinMagnet = 90 + magnet * 55;
    p.coinMagnetBonus = magnet * 2.2;
    // дэш: мета + способность (1–4 −КД, 5 двойной)
    const cdCut = metaDash * 0.3 + Math.min(4, aDash) * 0.08;
    p.dashCdBase = Math.max(0.32, 1.05 - cdCut);
    p.dashChargesMax = aDash >= 5 ? 2 : 1;
    p.dashCharges = p.dashChargesMax;
    p.dashCd = 0;
    // обед
    p.teaDurationBonus = Math.min(4, aTea) * 0.7;
    p.teaDamageBonus = aTea >= 5 ? 1 : 0;
    // сильный удар (заряд)
    p.chargeCdMul = Math.max(0.65, 1 - Math.min(4, aCharge) * 0.07);
    p.chargeRadiusMul = aCharge >= 5 ? 1.22 : 1;
    p.complaintResist = thick * 0.3;
  },

  startShiftFromHub() {
    this.startGame();
  },

  resetGame() {
    this.hideOverlays();
    // обычная карта смены (Распродажа раздувает мир)
    this.worldW = Math.max(1200, Math.floor(this.viewW() * 1.5));
    this.worldH = Math.max(800, Math.floor(this.viewH() * 1.5));
    if (this.selectedChallenge === 'hammer_only') {
      this.weaponId = 'hammer';
      this.hammerId = 'hammer';
    }
    const weapon = this.getWeapon();
    this.player = new Player(this.worldW / 2, this.worldH / 2, weapon);
    this.player.equippedWeaponId = this.weaponId;
    this.enemies = []; this.particles = []; this.projectiles = []; this.pickups = [];
    this.boomFx = [];
    this.bossLines = [];
    this.score = 0; this.wave = 1;
    this.coins = 8 + (this.metaPerks.wallet || 0) * 6;
    this.coinMult = this.selectedChallenge === 'x2' ? 2 : 1;
    this.shopBuysLeft = SHOP_BUYS_PER_VISIT;
    this.shopBoughtRun = new Set(); // oncePerRun ids
    this.waveKills = 0;
    this.waveSpawned = 0;
    this.wavePhase = 'shop';
    this.killsPerWave = KILLS_PER_WAVE;
    this.screenShake = 0;
    this.modeTimer = 0; this.isChaseMode = true; this.modeFlash = 0;
    this.combo = 0; this.maxCombo = 0; this.comboTimer = 0; this.comboShield = 0;
    this.pendingUpgrades = 0; this.upgradeChoices = [];
    this.upgradeRerollsLeft = 3;
    this.choosingUpgrade = false; this.shopping = false; this.paused = false;
    this.gameOver = false; this.won = false; this.killedBy = '';
    this.directorSpawned = false; this.dayDone = false;
    this.fuseBombs = [];
    this.boomFx = [];
    this.bossLines = [];
    this.playerProjectiles = [];
    this.lightsOut = 0;
    this.fireAlarm = 0;
    this.eventCooldown = 8;
    this._eventBanner = null;
    this.challengeFailed = false;
    this.tookDamage = false;
    this.applyMetaToPlayer();
    this.generateObstacles();
    this.generateStorefronts();
    this.generateWallDecor();
    this.generateZones();
    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;
    this.wave = 1;
    this.wavePhase = 'sale';
    this.refreshMusicState();
    sfx.click();
  },

  togglePause(force) {
    if (this.isBoostersOpen() || this.inMainMenu || this.gameOver || this.won || this.choosingUpgrade || this.shopping) return;
    const gameMenuOpen = document.getElementById('game-menu-overlay')?.classList.contains('show');
    if (force === true) {
      if (!gameMenuOpen) this.openGameMenu();
      return;
    }
    if (force === false) {
      if (gameMenuOpen) this.closeGameMenu();
      return;
    }
    if (gameMenuOpen) this.closeGameMenu();
    else this.openGameMenu();
  },
});
