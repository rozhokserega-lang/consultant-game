/** Класс Game: состояние забега и главный цикл. Методы дописывают соседние файлы. */

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
    this.selectedArena = this.save.selectedArena || 'food';
    this.selectedChallenge = 'none';
    const saleWeps = Array.isArray(this.save.saleUnlockedWeapons) ? this.save.saleUnlockedWeapons : [];
    const migratedSale = saleWeps.map((id) => {
      if (id === 'hammer' || id === 'tags' || id === 'scanner') return 'receipt';
      if (typeof SALE_WEAPON_MIGRATE !== 'undefined' && SALE_WEAPON_MIGRATE[id]) return SALE_WEAPON_MIGRATE[id];
      return id;
    }).filter((id) => typeof SALE_WEAPONS === 'undefined' || SALE_WEAPONS[id]);
    this.saleUnlockedWeapons = Array.from(new Set(['receipt', ...migratedSale]));
    this.saleStartPassives = Object.assign({}, this.save.saleStartPassives || {});
    this.selectedHeroId = this.save.selectedHeroId || 'lena';
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

  getWeaponLevel(id) {
    const lv = this.weaponLevels[id] || 0;
    return Math.max(0, Math.min(WEAPON_MAX_LEVEL, lv | 0));
  }

  getWeapon() {
    const base = WEAPONS.find(w => w.id === this.weaponId) || WEAPONS[0];
    return scaleWeaponStats(base, this.getWeaponLevel(base.id));
  }
  getHammer() { return this.getWeapon(); }

  unlockedWeapons() {
    return WEAPONS.filter(w => this.ownedWeapons.includes(w.id)).map(w => scaleWeaponStats(w, this.getWeaponLevel(w.id)));
  }
  unlockedHammers() { return this.unlockedWeapons(); }

  refreshPlayerLoadoutWeapon() {
    const p = this.player;
    if (!p) return;
    const w = this.getWeapon();
    p.equippedWeaponId = w.id;
    p._loadoutWeapon = w;
    p.applyWeapon(w);
    const reach = this.metaPerks.reach || 0;
    p._metaReachBonus = reach * 5;
    if (p._metaReachBonus) {
      p.stickLength += p._metaReachBonus;
      p.baseStickLength += p._metaReachBonus;
    }
  }

  cacheHud() {
    this.$hpFill = document.getElementById('hud-hp-fill');
    this.$hpText = document.getElementById('hud-hp-text');
    this.$xpFill = document.getElementById('hud-xp-fill');
    this.$xpText = document.getElementById('hud-xp-text');
    this.$level = document.getElementById('hud-level');
    this.$score = document.getElementById('hud-score');
    this.$coins = document.getElementById('hud-coins');
    this.$mode = document.getElementById('hud-mode');
    this.$wave = document.getElementById('hud-wave');
    this.$enemies = document.getElementById('hud-enemies');
    this.$combo = document.getElementById('hud-combo');
    this.$buffBar = document.getElementById('buff-bar');
    this.$battleCoins = document.getElementById('battle-coins');
    this.$battleTime = document.getElementById('battle-time');
    this.$battleXpFill = document.getElementById('battle-xp-fill');
    this.$battleXpLevel = document.getElementById('battle-xp-level');
  }

  formatBattleCoins(n) {
    return Math.floor(n || 0).toLocaleString('ru-RU');
  }

  formatBattleElapsed(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return m + ':' + s;
  }

  updateBattleBar() {
    if (this.$battleCoins) {
      this.$battleCoins.textContent = this.formatBattleCoins(this.coins);
    }
    if (this.$battleTime) {
      const elapsed = this.gameMode === 'sale' ? (this.saleTime || 0) : 0;
      this.$battleTime.textContent = this.formatBattleElapsed(elapsed);
    }
    if (this.gameMode === 'sale' && this.saleWeapons) {
      const xpRow = document.querySelector('.battle-bar__xp-row');
      if (xpRow) xpRow.setAttribute('aria-hidden', 'false');
      if (this.$battleXpFill) {
        const pct = Math.min(100, 100 * (this.saleXp || 0) / Math.max(1, this.saleXpNext || 1));
        this.$battleXpFill.style.width = pct + '%';
      }
      if (this.$battleXpLevel) {
        this.$battleXpLevel.textContent = '★' + (this.saleLevel || 1);
      }
    }
  }

  bindUI() {
    this.buildMainMenuButtons();
    this.buildGameMenu();
    this.buildLevelUpPopup();
    document.getElementById('btn-pause').onclick = () => this.togglePause();
    const battlePause = document.getElementById('btn-battle-pause');
    if (battlePause) battlePause.onclick = () => this.togglePause();
    const battleMenu = document.getElementById('btn-battle-menu');
    if (battleMenu) battleMenu.onclick = () => this.openGameMenu();
    document.getElementById('btn-retry').onclick = () => { this.hideOverlays(); this.resetGame(); };
    document.getElementById('btn-again').onclick = () => { this.hideOverlays(); this.openMainMenu(); };
    const uploadBal = document.getElementById('btn-upload-balance');
    if (uploadBal) {
      uploadBal.onclick = () => {
        if (typeof this.uploadSaleBalanceLog === 'function') this.uploadSaleBalanceLog();
      };
    }
    document.getElementById('hub-tab-prep').onclick = () => this.setHubTab('prep');
    const tabGear = document.getElementById('hub-tab-gear');
    if (tabGear) tabGear.onclick = () => this.setHubTab('gear');
    document.getElementById('hub-tab-book').onclick = () => this.setHubTab('book');
    const backBook = document.getElementById('hub-back-modes-book');
    if (backBook) backBook.onclick = () => this.setHubTab('prep');
    document.getElementById('btn-settings').onclick = () => this.openSettings();
    document.getElementById('btn-settings-close').onclick = () => this.closeSettings();
    document.getElementById('tog-sound').onclick = () => {
      sfx.enabled = !sfx.enabled;
      this.persist();
      this.refreshSettingsUI();
      this.refreshGameMenuUI();
      sfx.click();
    };
    document.getElementById('tog-music').onclick = () => {
      music.setEnabled(!music.enabled);
      this.persist();
      this.refreshSettingsUI();
      this.refreshGameMenuUI();
      sfx.click();
    };
    document.getElementById('tog-vibro').onclick = () => {
      this.vibro = !this.vibro;
      this.persist();
      this.refreshSettingsUI();
      this.refreshGameMenuUI();
    };
    const togDmg = document.getElementById('tog-dmgnum');
    if (togDmg) togDmg.onclick = () => {
      this.showDmgNumbers = !this.showDmgNumbers;
      this.persist();
      this.refreshSettingsUI();
      sfx.click();
    };
  }

  buildLevelUpPopup() {
    const overlay = document.getElementById('upgrade-overlay');
    if (!overlay || typeof LevelUpPopup === 'undefined') return;

    LevelUpPopup.init(overlay, {
      onReroll: () => this.rerollUpgradeChoices(),
      onBanish: () => {
        if (this.gameMode === 'sale' && typeof this.toggleSaleBanish === 'function') {
          this.toggleSaleBanish();
        }
      },
      onSkip: () => {
        if (this.gameMode === 'sale' && typeof this.skipSaleUpgrade === 'function') {
          this.skipSaleUpgrade();
        }
      },
    });
  }

  buildGameMenu() {
    const root = document.getElementById('game-menu-root');
    if (!root || typeof GameMenu === 'undefined') return;

    GameMenu.mount(root, {
      resume: () => this.closeGameMenu(),
      restart: () => {
        this.hideOverlays();
        this.startGame();
      },
      abilities: () => {
        this.renderPauseLoadout('game-menu-loadout');
        GameMenu.showView(root, 'abilities');
        sfx.click();
      },
      exit: () => {
        this.hideOverlays();
        this.openMainMenu();
      },
      toggleSound: () => {
        sfx.enabled = !sfx.enabled;
        this.persist();
        this.refreshGameMenuUI();
        this.refreshSettingsUI();
        sfx.click();
      },
      toggleMusic: () => {
        music.setEnabled(!music.enabled);
        this.persist();
        this.refreshGameMenuUI();
        this.refreshSettingsUI();
        sfx.click();
      },
      toggleVibro: () => {
        this.vibro = !this.vibro;
        this.persist();
        this.refreshGameMenuUI();
        this.refreshSettingsUI();
      },
    });
    this.refreshGameMenuUI();
  }

  persist() {
    saveSave({
      highScore: this.highScore,
      highWaveLevel: this.highWaveLevel || 0,
      sound: sfx.enabled,
      music: music.enabled,
      vibro: this.vibro,
      dmgNumbers: this.showDmgNumbers,
      weaponId: this.weaponId,
      hammerId: this.weaponId,
      ownedWeapons: this.ownedWeapons,
      weaponLevels: this.weaponLevels,
      abilityLevels: this.abilityLevels,
      bankCoins: this.bankCoins,
      metaPerks: this.metaPerks,
      selectedArena: this.selectedArena,
      gameMode: this.gameMode,
      saleUnlockedWeapons: this.saleUnlockedWeapons,
      saleStartPassives: this.saleStartPassives,
      selectedFloorId: this.selectedFloorId || 'grocery',
      selectedContractId: this.selectedContractId || 'none',
      selectedHeroId: this.selectedHeroId || 'lena',
      gearVersion: this.gearVersion || 0,
      kpiBalance: this.kpiBalance || 0,
      gearBossKillsTotal: this.gearBossKillsTotal || 0,
      gearByHero: this.gearByHero || {},
      gearMaterials: this.gearMaterials || {},
      killLog: this.killLog,
    });
  }

  isBoostersOpen() {
    return document.getElementById('boosters-overlay')?.classList.contains('show');
  }

  /** Музыка: меню/усилители — on; пауза/настройки/магазин/апгрейд/конец — mute */
  refreshMusicState() {
    const settingsOpen = document.getElementById('settings-overlay')?.classList.contains('show');
    const gameMenuOpen = document.getElementById('game-menu-overlay')?.classList.contains('show');
    const boostersOpen = this.isBoostersOpen();
    if (settingsOpen || gameMenuOpen || this.gameOver || this.won || this.choosingUpgrade || this.shopping) {
      music.setMuted(true);
      return;
    }
    if (this.inMainMenu || boostersOpen) {
      music.setIntensity('calm');
      music.setMuted(false);
      return;
    }
    if (this.paused) {
      music.setMuted(true);
      return;
    }
    music.setMuted(false);
  }

  hideOverlays() {
    ['upgrade-overlay','game-menu-overlay','settings-overlay','end-overlay','main-menu-overlay','boosters-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
    const gameMenuRoot = document.getElementById('game-menu-root');
    if (gameMenuRoot && typeof GameMenu !== 'undefined') GameMenu.showView(gameMenuRoot, 'main');
    this.choosingUpgrade = false;
    this.shopping = false;
    if (typeof this.updateUpgradeRerollBtn === 'function') this.updateUpgradeRerollBtn();
  }

  openSettings() {
    this.refreshSettingsUI();
    document.getElementById('settings-overlay').classList.add('show');
    if (!this.gameOver && !this.won) this.paused = true;
    document.getElementById('game-menu-overlay')?.classList.remove('show');
    this.refreshMusicState();
  }

  closeSettings() {
    document.getElementById('settings-overlay').classList.remove('show');
    if (this.inMainMenu) {
      this.paused = true;
      document.getElementById('main-menu-overlay').classList.add('show');
      this.refreshMusicState();
      return;
    }
    if (this.isBoostersOpen()) {
      this.paused = true;
      this.refreshMusicState();
      return;
    }
    if (!this.gameOver && !this.won && this.paused) {
      this.openGameMenu();
      return;
    }
    if (!this.gameOver && !this.won) {
      this.paused = false;
    }
    this.refreshMusicState();
  }

  openGameMenu() {
    if (this.isBoostersOpen() || this.inMainMenu || this.gameOver || this.won || this.choosingUpgrade || this.shopping) return;
    this.refreshGameMenuUI();
    const root = document.getElementById('game-menu-root');
    if (root && typeof GameMenu !== 'undefined') GameMenu.showView(root, 'main');
    document.getElementById('game-menu-overlay').classList.add('show');
    document.getElementById('settings-overlay')?.classList.remove('show');
    this.paused = true;
    this.refreshMusicState();
    sfx.click();
  }

  closeGameMenu() {
    document.getElementById('game-menu-overlay').classList.remove('show');
    const root = document.getElementById('game-menu-root');
    if (root && typeof GameMenu !== 'undefined') GameMenu.showView(root, 'main');
    if (!this.gameOver && !this.won) this.paused = false;
    this.refreshMusicState();
    sfx.click();
  }

  refreshGameMenuUI() {
    const root = document.getElementById('game-menu-root');
    if (!root || typeof GameMenu === 'undefined') return;
    GameMenu.refreshToggles(root, {
      sound: sfx.enabled,
      music: music.enabled,
      vibro: this.vibro,
    });
  }

  refreshSettingsUI() {
    const setLabel = (id, text) => UiButton.setText(document.getElementById(id), text);
    setLabel('tog-sound', sfx.enabled ? '🔊 Звук: ВКЛ' : '🔇 Звук: ВЫКЛ');
    setLabel('tog-music', music.enabled ? '🎵 Музыка: ВКЛ' : '🔕 Музыка: ВЫКЛ');
    setLabel('tog-vibro', this.vibro ? '📳 Вибрация: ВКЛ' : '📳 Вибрация: ВЫКЛ');
    setLabel('tog-dmgnum', this.showDmgNumbers ? '🔢 Цифры урона: ВКЛ' : '🔢 Цифры урона: ВЫКЛ');
    document.getElementById('set-record').textContent = this.highScore;
    const bankEl = document.getElementById('set-bank');
    if (bankEl) bankEl.textContent = this.bankCoins;
  }

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
  }

  renderPauseLoadout(containerId = 'game-menu-loadout') {
    const box = document.getElementById(containerId);
    if (!box) return;
    const weps = Object.entries(this.saleWeapons || {})
      .filter(([, lv]) => lv > 0)
      .map(([id, lv]) => {
        const def = (typeof SALE_WEAPONS !== 'undefined' && SALE_WEAPONS[id]) || { ico: '⚔', name: id, max: 5 };
        return `<span class="pause-chip"><span>${def.ico || '⚔'}</span><span class="nm">${def.name || id}</span><span class="lv">Lv${lv}${def.max ? '/' + def.max : ''}</span></span>`;
      });
    const pass = Object.entries(this.salePassives || {})
      .filter(([, lv]) => lv > 0)
      .map(([id, lv]) => {
        const def = (typeof SALE_PASSIVES !== 'undefined' && SALE_PASSIVES[id]) || { ico: '◆', name: id, max: 5 };
        return `<span class="pause-chip"><span>${def.ico || '◆'}</span><span class="nm">${def.name || id}</span><span class="lv">Lv${lv}</span></span>`;
      });
    box.innerHTML = `
      <div class="sec">Оружие · ${weps.length}/6</div>
      <div class="pause-chips">${weps.length ? weps.join('') : '<span class="pause-empty">Пока только кулаки…</span>'}</div>
      <div class="sec">Пассивки · ${pass.length}/6</div>
      <div class="pause-chips">${pass.length ? pass.join('') : '<span class="pause-empty">Пассивок ещё нет</span>'}</div>
    `;
  }

  updateUpgradeRerollBtn() {
    if (typeof LevelUpPopup === 'undefined') return;
    LevelUpPopup.updateFooter({
      rerollsLeft: this.upgradeRerollsLeft | 0,
      banishesLeft: this.saleBanishesLeft | 0,
      banishMode: !!this._saleBanishMode,
      choosingUpgrade: !!this.choosingUpgrade,
      showBan: this.gameMode === 'sale',
      showSkip: this.gameMode === 'sale',
    });
  }

  rerollUpgradeChoices() {
    if (!this.choosingUpgrade) return;
    if ((this.upgradeRerollsLeft | 0) <= 0) { sfx.hurt(); return; }
    this.upgradeRerollsLeft -= 1;
    sfx.click();
    if (this.gameMode === 'sale' && typeof this.openSaleUpgradeUI === 'function') {
      // не тратим pending — только пересобираем карточки
      this._saleRerolling = true;
      this.openSaleUpgradeUI();
      this._saleRerolling = false;
    } else {
      this._shiftRerolling = true;
      this.openUpgradeUI();
      this._shiftRerolling = false;
    }
    this.updateUpgradeRerollBtn();
  }

  vibrate(ms = 30) {
    if (this.vibro && navigator.vibrate) navigator.vibrate(ms);
  }

  resize() {
    const container = document.getElementById('game-container');
    const cs = getComputedStyle(container);
    const padH = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const padW = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const cw = container.clientWidth - padW;
    const ch = container.clientHeight - padH;
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = cw; canvas.height = ch;
    this.W = cw; this.H = ch;
    // мобильный / тач: камера дальше (−15%), чтобы влезало больше поля
    const mobileView = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches
      || ('ontouchstart' in window && Math.min(cw, ch) < 900);
    this.viewZoom = mobileView ? 0.85 : 1;
    this.worldW = Math.max(1200, Math.floor(this.viewW() * 1.5));
    this.worldH = Math.max(800, Math.floor(this.viewH() * 1.5));
  }

  /** Ширина/высота видимой области мира (с учётом зума камеры). */
  viewW() { return this.W / (this.viewZoom || 1); }
  viewH() { return this.H / (this.viewZoom || 1); }

  screenToWorld(sx, sy) {
    const z = this.viewZoom || 1;
    return { x: sx / z + this.camera.x, y: sy / z + this.camera.y };
  }

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
  }

  buildMainMenuButtons() {
    const box = document.getElementById('main-menu-actions');
    if (!box || typeof UiButton === 'undefined') return;
    box.innerHTML = '';
    ['Играть', 'Усилители', 'Гардероб', 'Выход'].forEach((label, i) => {
      const actions = [
        () => this.startGame(),
        () => this.openBoosters(),
        () => this.openWardrobe(),
        () => this.exitGame(),
      ];
      box.appendChild(UiButton.create({
        text: label,
        variant: 'menu',
        size: 'lg',
        full: true,
        onClick: actions[i],
      }));
    });

    const backWrap = document.getElementById('boosters-back-wrap');
    if (backWrap) {
      backWrap.innerHTML = '';
      backWrap.appendChild(UiButton.create({
        text: '← Назад',
        variant: 'menu',
        size: 'md',
        full: true,
        onClick: () => this.openMainMenu(),
      }));
    }
  }

  openMainMenu() {
    this.hideOverlays();
    this.inMainMenu = true;
    this.inHub = false;
    this.paused = true;
    this.shopping = false;
    this.choosingUpgrade = false;
    this.gameOver = false;
    this.won = false;
    this.gameMode = 'sale';
    document.body.classList.remove('sale-mode', 'hub-mode');
    document.body.classList.add('main-menu-mode');
    this.prepareIdleWorld();
    document.getElementById('main-menu-overlay').classList.add('show');
    this.refreshMusicState();
  }

  openBoosters(opts = {}) {
    this.hideOverlays();
    this.inMainMenu = false;
    this.inHub = false;
    this.paused = true;
    const tab = opts.tab === 'gear' || opts.tab === 'book' ? opts.tab : 'prep';
    this.hubScreen = tab;
    this.hubTab = tab;
    document.body.classList.remove('hub-mode', 'sale-mode');
    document.body.classList.add('main-menu-mode');
    document.getElementById('boosters-overlay').classList.add('show');
    try {
      this.renderBoosters();
    } catch (err) {
      console.error('renderBoosters failed:', err);
    }
    this.refreshMusicState();
    sfx.click();
  }

  openWardrobe() {
    this.openBoosters({ tab: 'gear' });
  }

  renderBoosters() {
    const bankEl = document.getElementById('boosters-bank');
    const recordEl = document.getElementById('boosters-record');
    if (bankEl) bankEl.textContent = this.bankCoins;
    if (recordEl) recordEl.textContent = this.highScore;

    const metaBox = document.getElementById('boosters-meta');
    if (metaBox) {
      metaBox.innerHTML = '';
      for (const def of META_PERKS) {
        const lv = this.metaPerks[def.id] || 0;
        const nextCost = lv >= def.max ? null : def.cost[lv];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (lv > 0 ? ' sel' : '') + (nextCost == null ? ' locked' : '');
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name} · ${lv}/${def.max}</div>
          <div class="desc">${def.desc}</div>
          <div class="meta">${nextCost == null ? 'Макс' : 'Купить 🪙 ' + nextCost}</div>`;
        if (nextCost != null) el.onclick = () => this.buyMetaPerk(def.id);
        metaBox.appendChild(el);
      }
    }

    const abBox = document.getElementById('boosters-abilities');
    if (abBox) {
      abBox.innerHTML = '';
      for (const def of ABILITY_DEFS) {
        const lv = this.abilityLevels[def.id] || 0;
        const nextCost = abilityUpgradeCost(lv);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (lv > 0 ? ' sel' : '') + (nextCost == null ? ' locked' : '');
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name} · ${lv}/${ABILITY_MAX_LEVEL}</div>
          <div class="desc">${def.desc}</div>
          <div class="meta">${nextCost == null ? 'Макс' : 'Купить 🪙 ' + nextCost}</div>`;
        if (nextCost != null) el.onclick = () => this.buyAbilityUpgrade(def.id);
        abBox.appendChild(el);
      }
    }

    this.renderHub();
  }

  buyMetaPerk(id) {
    const def = META_PERKS.find((p) => p.id === id);
    if (!def) return;
    const lv = this.metaPerks[id] || 0;
    if (lv >= def.max) return;
    const cost = def.cost[lv];
    if (this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.metaPerks[id] = lv + 1;
    this.persist();
    this.renderBoosters();
    sfx.shop();
  }

  buyAbilityUpgrade(id) {
    const lv = this.abilityLevels[id] || 0;
    if (lv >= ABILITY_MAX_LEVEL) return;
    const cost = abilityUpgradeCost(lv);
    if (cost == null || this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.abilityLevels[id] = lv + 1;
    this.persist();
    this.renderBoosters();
    sfx.shop();
  }

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
  }

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
  }

  setHubTab(tab) {
    if (tab === 'book') {
      this.hubTab = 'book';
      this.hubScreen = 'book';
    } else if (tab === 'gear') {
      this.hubTab = 'gear';
      this.hubScreen = 'gear';
    } else {
      this.hubTab = 'prep';
      this.hubScreen = 'prep';
    }
    this.renderHub();
    sfx.click();
  }



  recordKill(type) {
    if (!type) return;
    if (!this.killLog) this.killLog = {};
    this.killLog[type] = (this.killLog[type] || 0) + 1;
  }

  renderComplaintBook() {
    const list = document.getElementById('hub-book');
    if (!list) return;
    list.innerHTML = '';
    let total = 0;
    for (const entry of COMPLAINT_BOOK) {
      const n = (this.killLog && this.killLog[entry.id]) || 0;
      total += n;
      const el = document.createElement('div');
      el.className = 'book-row' + (n <= 0 ? ' zero' : '') + (entry.boss ? ' boss' : '');
      const ico = document.createElement('div');
      ico.className = 'ico';
      const cv = document.createElement('canvas');
      if (!paintComplaintPortrait(cv, entry)) {
        ico.textContent = entry.ico || '?';
        ico.style.fontSize = entry.boss ? '28px' : '22px';
      } else {
        ico.appendChild(cv);
      }
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = entry.name;
      const cnt = document.createElement('div');
      cnt.className = 'cnt';
      cnt.textContent = String(n);
      el.appendChild(ico);
      el.appendChild(nm);
      el.appendChild(cnt);
      list.appendChild(el);
    }
    const tot = document.getElementById('book-total');
    if (tot) tot.textContent = 'Всего выписано жалоб: ' + total;
  }



  renderHub() {
    const bankEl = document.getElementById('boosters-bank');
    const recordEl = document.getElementById('boosters-record');
    if (bankEl) bankEl.textContent = this.bankCoins;
    if (recordEl) recordEl.textContent = this.highScore;
    const verEl = document.getElementById('hub-version');
    if (verEl) verEl.textContent = typeof SALE_VERSION !== 'undefined' ? 'v' + SALE_VERSION : '';
    this.gameMode = 'sale';
    if (!this.hubScreen || this.hubScreen === 'modes') this.hubScreen = 'prep';
    if (!this.hubTab) this.hubTab = 'prep';

    const onPrep = this.hubScreen === 'prep';
    const onGear = this.hubScreen === 'gear';
    const onBook = this.hubScreen === 'book';

    document.getElementById('hub-pane-prep').classList.toggle('on', onPrep);
    const paneGear = document.getElementById('hub-pane-gear');
    if (paneGear) paneGear.classList.toggle('on', onGear);
    document.getElementById('hub-pane-book').classList.toggle('on', onBook);

    const tabPrep = document.getElementById('hub-tab-prep');
    const tabGear = document.getElementById('hub-tab-gear');
    const tabBook = document.getElementById('hub-tab-book');
    if (tabPrep) {
      tabPrep.classList.toggle('on', onPrep);
      tabPrep.textContent = 'Подготовка · Распродажа';
    }
    if (tabGear) tabGear.classList.toggle('on', onGear);
    if (tabBook) tabBook.classList.toggle('on', onBook);

    const saleBox = document.getElementById('hub-sale-loadout');
    if (saleBox) saleBox.style.display = '';

    if (onBook) this.renderComplaintBook();
    if (onGear && this.renderEquipHub) this.renderEquipHub();
    if (!onPrep) return;

    this.renderSaleHubLoadout();
  }



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
  }

  startShiftFromHub() {
    this.startGame();
  }

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
  }

  getArenaTheme() {
    return ARENA_THEMES[this.selectedArena] || ARENA_THEMES.food;
  }

  getArenaBounds() {
    const WW = this.worldW;
    const WH = this.worldH;
    const f = ARENA_FENCE;
    return {
      x0: f.side,
      y0: f.topShop,
      x1: WW - f.side,
      y1: WH - f.bottom,
      doorCx: WW / 2,
      doorW: f.doorW,
    };
  }

  _drawFenceBar(x, y, w, h, stripe) {
    ctx.fillStyle = '#8a9098';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6d737a';
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = '#a8adb4';
    ctx.fillRect(x, y + h - 4, w, 4);
    const stripeH = Math.min(14, Math.max(8, h * 0.26));
    const sy = y + h * 0.44 - stripeH / 2;
    ctx.fillStyle = stripe;
    ctx.fillRect(x + 2, sy, Math.max(0, w - 4), stripeH);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 2, sy, Math.max(0, w - 4), 3);
  }

  _drawArenaDoor(x, y, w, h) {
    ctx.fillStyle = '#6d737a';
    ctx.fillRect(x - 8, y, w + 16, h);
    const panelW = (w - 14) / 2;
    ctx.fillStyle = 'rgba(160,210,235,0.5)';
    ctx.fillRect(x + 5, y + 10, panelW, h - 18);
    ctx.fillRect(x + 9 + panelW, y + 10, panelW, h - 18);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y + 10, panelW, h - 18);
    ctx.strokeRect(x + 9 + panelW, y + 10, panelW, h - 18);
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(x + w / 2 - 2, y + 8, 4, h - 14);
    drawWallDecor(ctx, 'wall_exit', x + w / 2, y + 4, { scale: 0.55, anchorY: 1 }) ||
      drawSprite(ctx, 'sign_exit', x + w / 2, y + 2, { scale: 0.72, anchorY: 1 });
    drawArenaProp(ctx, 'plant', x - 16, y + h, { scale: 0.55, anchorY: 1 }) ||
      drawSprite(ctx, 'plant', x - 16, y + h, { scale: 0.52, anchorY: 1 });
    drawArenaProp(ctx, 'plant', x + w + 16, y + h, { scale: 0.55, anchorY: 1 }) ||
      drawSprite(ctx, 'plant', x + w + 16, y + h, { scale: 0.52, anchorY: 1 });
  }

  drawArenaFence(WW, WH) {
    const f = ARENA_FENCE;
    const th = this.getArenaTheme();
    const stripe = th.fenceStripe || '#c0392b';
    const topH = f.topShop;
    const sideW = f.side;
    const botH = f.bottom;
    const doorW = f.doorW;
    const doorX0 = WW / 2 - doorW / 2;
    const playTop = topH;
    const playBot = WH - botH;
    const wallH = Math.max(0, playBot - playTop);

    this._drawFenceBar(0, 0, WW, topH, stripe);
    ctx.fillStyle = '#5c5348';
    ctx.fillRect(0, topH - 5, WW, 5);

    this._drawFenceBar(0, playTop, sideW, wallH, stripe);
    this._drawFenceBar(WW - sideW, playTop, sideW, wallH, stripe);

    const botLeftW = Math.max(0, doorX0 - sideW);
    const botRightX = doorX0 + doorW;
    const botRightW = Math.max(0, WW - sideW - botRightX);
    if (botLeftW > 0) this._drawFenceBar(sideW, playBot, botLeftW, botH, stripe);
    if (botRightW > 0) this._drawFenceBar(botRightX, playBot, botRightW, botH, stripe);

    this._drawArenaDoor(doorX0, playBot, doorW, botH);

    ctx.fillStyle = '#727880';
    ctx.fillRect(0, playTop - 4, sideW + 2, 6);
    ctx.fillRect(WW - sideW - 2, playTop - 4, sideW + 2, 6);
    ctx.fillRect(0, playBot + botH - 2, sideW + 2, 4);
    ctx.fillRect(WW - sideW - 2, playBot + botH - 2, sideW + 2, 4);

    drawWallDecor(ctx, 'wall_exit', sideW * 0.52, WH * 0.42, { scale: 0.62, anchorY: 0.5 }) ||
      drawSprite(ctx, 'sign_exit', sideW * 0.52, WH * 0.5, { scale: 0.82, anchorY: 0.5 });
    drawWallDecor(ctx, 'wall_exit', WW - sideW * 0.52, WH * 0.42, { scale: 0.62, anchorY: 0.5, flip: true }) ||
      drawSprite(ctx, 'sign_exit', WW - sideW * 0.52, WH * 0.5, { scale: 0.82, anchorY: 0.5, flip: true });
  }

  generateZones() {
    const th = this.getArenaTheme();
    const b = this.getArenaBounds();
    this.zones = (th.zones || []).map(z => {
      // лёгкий джиттер позиции зоны каждый забег
      const jx = rand(-0.06, 0.06);
      const jy = rand(-0.06, 0.06);
      let x = this.worldW * Math.max(0.05, Math.min(0.85, z.x + jx));
      let y = this.worldH * Math.max(0.12, Math.min(0.82, z.y + jy));
      x = Math.max(b.x0 + 8, Math.min(b.x1 - z.w - 8, x));
      y = Math.max(b.y0 + 8, Math.min(b.y1 - z.h - 8, y));
      return { type: z.type, x, y, w: z.w, h: z.h };
    });
  }

  generateObstacles() {
    this.obstacles = [];
    const th = this.getArenaTheme();
    const defs = [...(th.obstacles || [
      { x: 0.18, y: 0.22, sprite: 'bench', cw: 70, ch: 28 },
      { x: 0.42, y: 0.18, sprite: 'fold_table', cw: 64, ch: 28 },
      { x: 0.70, y: 0.24, sprite: 'clothes_rack', cw: 90, ch: 30 },
      { x: 0.88, y: 0.40, sprite: 'vending', cw: 36, ch: 50 },
      { x: 0.12, y: 0.48, sprite: 'sale_pillar', cw: 36, ch: 55 },
      { x: 0.30, y: 0.58, sprite: 'cart', cw: 48, ch: 36 },
      { x: 0.55, y: 0.42, sprite: 'mannequin', cw: 28, ch: 50 },
      { x: 0.75, y: 0.55, sprite: 'trash', cw: 28, ch: 40 },
      { x: 0.38, y: 0.78, sprite: 'bench', cw: 70, ch: 28 },
      { x: 0.62, y: 0.80, sprite: 'plant', cw: 28, ch: 40 },
      { x: 0.85, y: 0.72, sprite: 'barrel_red', cw: 40, ch: 36 },
      { x: 0.22, y: 0.82, sprite: 'box_stack', cw: 48, ch: 28 },
      { x: 0.08, y: 0.30, sprite: 'plant_cone', cw: 24, ch: 40 },
      { x: 0.50, y: 0.68, sprite: 'mirror', cw: 28, ch: 48 },
      { x: 0.92, y: 0.85, sprite: 'atm', cw: 32, ch: 40 },
      { x: 0.48, y: 0.30, sprite: 'checkout', cw: 36, ch: 40 },
      { x: 0.15, y: 0.70, sprite: 'sign_dir', cw: 32, ch: 48 },
      { x: 0.80, y: 0.18, sprite: 'fire_box', cw: 28, ch: 40 },
    ])];
    // перемешиваем, чтобы состав/порядок не был статичным
    for (let i = defs.length - 1; i > 0; i--) {
      const j = randi(0, i);
      const t = defs[i]; defs[i] = defs[j]; defs[j] = t;
    }

    const b = this.getArenaBounds();
    const spawnX = this.worldW / 2;
    const spawnY = this.worldH / 2;
    const placed = [];
    const pad = 18;
    const gap = 36;

    const overlaps = (x, y, w, h) => {
      for (const p of placed) {
        if (x < p.x + p.w + gap && x + w + gap > p.x && y < p.y + p.h + gap && y + h + gap > p.y) return true;
      }
      // зона старта свободная
      const cx = x + w / 2, cy = y + h / 2;
      if (dist(cx, cy, spawnX, spawnY) < 120) return true;
      // не блокируем дверь снизу
      if (Math.abs(cx - b.doorCx) < b.doorW * 0.55 && y + h > b.y1 - 90) return true;
      return false;
    };

    for (const def of defs) {
      const dw = def.dw || Math.round(def.cw * 1.15);
      const dh = def.dh || Math.round(def.ch * 1.35);
      // Footprint ≈ нижняя треть спрайта (зелёная зона), не весь высокий спрайт
      const footW = Math.max(22, Math.round(dw * 0.78));
      const footH = Math.max(20, Math.round(dh * 0.42));

      let ox = this.worldW * def.x - footW / 2;
      let oy = this.worldH * def.y - footH / 2;
      let ok = false;
      for (let tryN = 0; tryN < 48; tryN++) {
        const cx = rand(b.x0 + pad + footW / 2, b.x1 - pad - footW / 2);
        const cy = rand(b.y0 + pad + footH / 2 + 10, b.y1 - pad - footH / 2);
        const tx = cx - footW / 2;
        const ty = cy - footH / 2;
        if (overlaps(tx, ty, footW, footH)) continue;
        ox = tx; oy = ty; ok = true;
        break;
      }
      if (!ok) {
        // fallback на шаблон темы, если рандом не нашёл место
        ox = Math.max(b.x0 + pad, Math.min(b.x1 - pad - footW, this.worldW * def.x - footW / 2));
        oy = Math.max(b.y0 + pad, Math.min(b.y1 - pad - footH, this.worldH * def.y - footH / 2));
      }
      const ob = {
        x: ox, y: oy, w: footW, h: footH,
        dw, dh, sprite: def.sprite, type: 'prop',
      };
      this.obstacles.push(ob);
      placed.push(ob);
    }
  }

  generateStorefronts() {
    this.storefronts = [];
    const th = this.getArenaTheme();
    const primary = th.store || 'store_food';
    const y = 6;
    const top = [0.12, 0.32, 0.52, 0.72];
    top.forEach((fx, i) => {
      this.storefronts.push({
        x: this.worldW * fx, y,
        w: 118, h: 92,
        sprite: i % 2 === 0 ? primary : STORE_SPRITES[i % STORE_SPRITES.length],
      });
    });
  }

  generateWallDecor() {
    this.wallDecor = [];
    const th = this.getArenaTheme();
    const signs = th.wallSigns || ['wall_sale', 'wall_dir', 'wall_exit', 'wall_nosmoke'];
    const f = ARENA_FENCE;
    const WW = this.worldW;
    const WH = this.worldH;
    // верхняя стена между витринами
    const topYs = f.topShop - 8;
    const topXs = [0.22, 0.42, 0.62, 0.82];
    topXs.forEach((fx, i) => {
      this.wallDecor.push({
        sprite: signs[i % signs.length],
        x: WW * fx,
        y: topYs,
        scale: 0.48,
        wall: 'top',
      });
    });
    // боковые стены
    const sideY = [0.28, 0.48, 0.68];
    sideY.forEach((fy, i) => {
      this.wallDecor.push({
        sprite: signs[(i + 1) % signs.length],
        x: f.side * 0.55,
        y: WH * fy,
        scale: 0.42,
        wall: 'left',
      });
      this.wallDecor.push({
        sprite: signs[(i + 2) % signs.length],
        x: WW - f.side * 0.55,
        y: WH * fy,
        scale: 0.42,
        wall: 'right',
        flip: true,
      });
    });
  }

  drawWallDecorations() {
    for (const d of this.wallDecor || []) {
      if (!drawWallDecor(ctx, d.sprite, d.x, d.y, {
        scale: d.scale || 0.45,
        flip: !!d.flip,
        anchorY: d.wall === 'top' ? 1 : 0.5,
      })) {
        // fallback old atlas names
        const legacy = {
          wall_sale: 'sign_sale',
          wall_burger: 'sign_burger',
          wall_exit: 'sign_exit',
          wall_dir: 'sign_dir',
          wall_nosmoke: 'sign_nosmoke',
        };
        drawSprite(ctx, legacy[d.sprite] || d.sprite, d.x, d.y, {
          scale: (d.scale || 0.45) * 1.2,
          flip: !!d.flip,
          anchorY: d.wall === 'top' ? 1 : 0.5,
        });
      }
    }
  }

  collidesWithObstacle(cx, cy, r) {
    for (const ob of this.obstacles) {
      const closestX = Math.max(ob.x, Math.min(cx, ob.x + ob.w));
      const closestY = Math.max(ob.y, Math.min(cy, ob.y + ob.h));
      if ((cx - closestX) ** 2 + (cy - closestY) ** 2 < r * r) return true;
    }
    return false;
  }

  pushOutOfObstacles(obj, r) {
    for (const ob of this.obstacles) {
      const closestX = Math.max(ob.x, Math.min(obj.x, ob.x + ob.w));
      const closestY = Math.max(ob.y, Math.min(obj.y, ob.y + ob.h));
      const dx = obj.x - closestX, dy = obj.y - closestY;
      const d = Math.hypot(dx, dy);
      if (d < r && d > 0.001) {
        obj.x += (dx / d) * (r - d);
        obj.y += (dy / d) * (r - d);
      } else if (d < 0.001) obj.y -= r;
    }
  }




  showEventBanner(text, dur = 2.2) {
    this._eventBanner = { text, t: dur };
  }








  dropCoins(enemy) {
    let amount = enemy.coinDrop || 1;
    amount = Math.max(1, Math.round(amount * (this.coinMult || 1) * (this.waveCoinBonus || 1)));
    if (this.combo >= 8) amount += 1;
    if (this.blackFriday) amount += 1;
    this.pickups.push(new Pickup(enemy.x + rand(-10, 10), enemy.y + rand(-10, 10), 'coin', amount));
  }


  onEnemyKilled(enemy) {
    // Shift-волны удалены; Sale перехватывает через onSaleEnemyKilled.
    if (enemy) this.recordKill(enemy.type);
  }

  spawnParticles(x, y, count, color, spread = 200, life = 0.6) {
    const room = MAX_PARTICLES - this.particles.length;
    if (room <= 0) return;
    const n = Math.min(count, room, LOW_GFX ? Math.ceil(count * 0.45) : count);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(spread * 0.3, spread);
      this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, rand(life * 0.5, life), rand(2, 6)));
    }
  }

  /** Короткий спрайт-эффект из vfx_atlas (кровь, слэш, level up…). */
  spawnSpriteFx(name, x, y, opts = {}) {
    if (!this.spriteFx) this.spriteFx = [];
    if (this.spriteFx.length > 48) this.spriteFx.shift();
    this.spriteFx.push({
      name,
      x,
      y,
      life: opts.life ?? 0.35,
      max: opts.life ?? 0.35,
      scale: opts.scale ?? 1,
      scaleEnd: opts.scaleEnd ?? ((opts.scale ?? 1) * 1.35),
      rot: opts.rot ?? 0,
      vy: opts.vy ?? -20,
      anchorY: opts.anchorY ?? 0.5,
    });
  }

  tickSpriteFx(dt) {
    if (this.animFx && this.animFx.length) {
      for (const fx of this.animFx) {
        fx.life -= dt;
        fx.y += (fx.vy || 0) * dt;
      }
      this.animFx = this.animFx.filter((fx) => fx.life > 0);
    }
    if (!this.spriteFx || !this.spriteFx.length) return;
    for (const fx of this.spriteFx) {
      fx.life -= dt;
      fx.y += (fx.vy || 0) * dt;
    }
    this.spriteFx = this.spriteFx.filter((fx) => fx.life > 0);
  }

  /** Анимированный эффект из anim_fx_atlas (one-shot или loop на время жизни). */
  spawnAnimFx(id, x, y, opts = {}) {
    if (!this.animFx) this.animFx = [];
    if (this.animFx.length > 40) this.animFx.shift();
    this.animFx.push({
      id, x, y,
      life: opts.life ?? 0.5,
      max: opts.life ?? 0.5,
      scale: opts.scale ?? 1,
      scaleEnd: opts.scaleEnd,
      rot: opts.rot ?? 0,
      vy: opts.vy ?? 0,
      alpha: opts.alpha ?? 1,
      tint: opts.tint,
      fade: opts.fade !== false,
    });
  }

  renderAnimFx(ctx) {
    if (!this.animFx || !this.animFx.length) return;
    for (const fx of this.animFx) {
      const t = Math.max(0, Math.min(1, 1 - fx.life / fx.max));
      const sc = fx.scaleEnd != null ? fx.scale + (fx.scaleEnd - fx.scale) * t : fx.scale;
      const alpha = fx.fade ? fx.alpha * Math.min(1, fx.life / (fx.max * 0.3)) : fx.alpha;
      drawAnimFxFrame(ctx, fx.id, fx.x, fx.y, {
        t,
        time: fx.max - fx.life,
        scale: sc,
        rot: fx.rot,
        alpha,
        tint: fx.tint,
      });
    }
  }

  drawSpriteFx(ctx) {
    if (!this.spriteFx) return;
    for (const fx of this.spriteFx) {
      const t = Math.max(0, fx.life / fx.max);
      const sc = fx.scale + (fx.scaleEnd - fx.scale) * (1 - t);
      const alpha = Math.min(1, t * 1.15);
      const opts = { scale: sc, anchorY: fx.anchorY, alpha };
      ctx.save();
      if (fx.rot) {
        ctx.translate(fx.x, fx.y);
        ctx.rotate(fx.rot);
        if (!(typeof drawSpell === 'function' && drawSpell(ctx, fx.name, 0, 0, opts))) {
          drawVfx(ctx, fx.name, 0, 0, opts);
        }
      } else if (!(typeof drawSpell === 'function' && drawSpell(ctx, fx.name, fx.x, fx.y, opts))) {
        drawVfx(ctx, fx.name, fx.x, fx.y, opts);
      }
      ctx.restore();
    }
  }

  /** Завод фитиля — взрыв через FATTY_FUSE_TIME */
  armFattyFuse(enemy) {
    this.fuseBombs = this.fuseBombs || [];
    this.fuseBombs.push({
      x: enemy.x,
      y: enemy.y,
      life: FATTY_FUSE_TIME,
      max: FATTY_FUSE_TIME,
      sprite: enemy.sprite || 'enemy_tank',
      scale: 0.78,
      hueRotate: enemy.hueRotate || 0,
      r: enemy.r,
    });
    sfx.mode();
  }

  /** Линейная атака босса: сначала телеграф, потом удар по линии. */
  spawnBossLineAttack(boss, player, opts = {}) {
    if (!boss || !player) return;
    this.bossLines = this.bossLines || [];
    const n = Math.max(1, opts.lines || 1);
    const warn = opts.warn || 1.05;
    const length = opts.length || (boss.type === 'director' ? 560 : 500);
    const halfW = opts.halfW || (boss.type === 'director' ? 42 : 36);
    // цвет телеграфа: у sale-боссов — свой акцент, иначе янтарный (не кровавый красный)
    let color = opts.color;
    if (!color && boss.saleBossId && typeof SALE_BOSS_DEFS !== 'undefined' && SALE_BOSS_DEFS[boss.saleBossId]) {
      color = SALE_BOSS_DEFS[boss.saleBossId].color;
    }
    if (!color) color = (opts.soft || this.gameMode === 'sale') ? '#f59e0b' : '#e74c3c';
    const soft = opts.soft != null ? !!opts.soft : this.gameMode === 'sale';
    // чуть вперёд от текущей позиции игрока (lead)
    const lead = 40 + (boss.bossPhase || 1) * 12;
    const aimX = player.x + Math.cos(player.angle || 0) * lead * 0.25;
    const aimY = player.y + Math.sin(player.angle || 0) * lead * 0.25;
    const aim = angleTo(boss.x, boss.y, aimX, aimY);
    for (let i = 0; i < n; i++) {
      let ang = aim;
      if (n === 2) ang = aim + (i === 0 ? -0.55 : 0.55);
      else if (n === 3) ang = aim + (i - 1) * 0.7;
      else if (n > 1) ang = aim + (i - (n - 1) / 2) * 0.5;
      // линия через босса в обе стороны — длинный коридор
      const x1 = boss.x - Math.cos(ang) * length * 0.25;
      const y1 = boss.y - Math.sin(ang) * length * 0.25;
      const x2 = boss.x + Math.cos(ang) * length * 0.75;
      const y2 = boss.y + Math.sin(ang) * length * 0.75;
      this.bossLines.push({
        x1, y1, x2, y2, ang,
        warn, warnMax: warn,
        strike: soft ? 0.18 : 0.22,
        halfW,
        owner: boss,
        color,
        soft,
        hit: false,
        dead: false,
      });
    }
    sfx.mode();
  }

  updateBossLineAttacks(dt) {
    if (!this.bossLines || !this.bossLines.length) return false;
    let killed = false;
    for (const line of this.bossLines) {
      if (line.dead) continue;
      if (line.warn > 0) {
        line.warn -= dt;
        continue;
      }
      if (!line.hit) {
        line.hit = true;
        // удар!
        const d = distToSegment(this.player.x, this.player.y, line.x1, line.y1, line.x2, line.y2);
        if (d < line.halfW + this.player.r) {
          if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
            this.tookDamage = true;
            if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;
            if (this.player.takeDamage(midX, midY)) {
              this.spawnParticles(this.player.x, this.player.y, 36, '#e74c3c', 320, 0.75);
              this.endGame(false, (line.owner && line.owner.nameTag) || 'Босс');
              killed = true;
            } else {
              sfx.hurt();
              this.vibrate(45);
              this.spawnParticles(this.player.x, this.player.y, 12, '#ff6b6b', 160, 0.4);
              this.screenShake = Math.max(this.screenShake, 0.22);
              if (this.gameMode === 'sale' && typeof this.applySaleFragileExtra === 'function') {
                if (this.applySaleFragileExtra()) killed = true;
              }
            }
          }
        } else {
          // промах — лёгкий FX на линии
          this.spawnParticles((line.x1 + line.x2) / 2, (line.y1 + line.y2) / 2, 10, '#f1c40f', 120, 0.3);
        }
        this.screenShake = Math.max(this.screenShake, 0.16);
        sfx.hit();
      }
      line.strike -= dt;
      if (line.strike <= 0) line.dead = true;
    }
    this.bossLines = this.bossLines.filter(l => !l.dead);
    return killed;
  }

  drawBossLineAttacks() {
    if (!this.bossLines || !this.bossLines.length) return;
    for (const line of this.bossLines) {
      const warning = line.warn > 0;
      const tWarn = warning ? (1 - line.warn / (line.warnMax || 1)) : 1;
      const soft = !!line.soft;
      const pulse = warning
        ? (soft ? (0.55 + 0.3 * Math.abs(Math.sin(performance.now() / 140))) : (0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 90))))
        : 1;
      const col = line.color || (soft ? '#f59e0b' : '#e74c3c');
      ctx.save();
      ctx.lineCap = 'round';
      if (warning) {
        ctx.globalAlpha = soft ? (0.22 + 0.28 * pulse) : (0.35 + 0.45 * pulse);
        ctx.strokeStyle = col;
        ctx.lineWidth = line.halfW * 2 * (soft ? (0.28 + 0.12 * tWarn) : (0.35 + 0.15 * tWarn));
        ctx.setLineDash(soft ? [10, 14] : [14, 12]);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        // тонкая ось
        ctx.globalAlpha = soft ? (0.4 * pulse) : (0.7 * pulse);
        ctx.lineWidth = soft ? 1.5 : 2;
        ctx.strokeStyle = soft ? '#fff7ed' : '#ffecec';
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      } else {
        const strikeMax = soft ? 0.18 : 0.22;
        ctx.globalAlpha = Math.max(0.12, line.strike / strikeMax) * (soft ? 0.75 : 1);
        ctx.strokeStyle = soft ? col : '#ff3b1f';
        ctx.lineWidth = line.halfW * (soft ? 0.95 : 1.15);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.globalAlpha = soft ? 0.55 : 0.85;
        ctx.strokeStyle = '#fff5e6';
        ctx.lineWidth = soft ? 2 : 3;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /** Взрыв по координатам: урон игроку и соседям */
  explodeAt(x, y) {
    const R = FATTY_EXPLODE_RADIUS;
    this.spawnParticles(x, y, 45, '#ff6b00', 420, 0.9);
    this.spawnParticles(x, y, 25, '#fff200', 280, 0.6);
    this.spawnParticles(x, y, 18, '#e74c3c', 200, 0.5);
    this.screenShake = Math.max(this.screenShake, 0.35);
    sfx.hurt();
    this.vibrate([40, 30, 60]);

    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x, y, life: 0.45, max: 0.45 });

    if (this.player.invincible <= 0 && this.player.lunchTimer <= 0) {
      if (dist(x, y, this.player.x, this.player.y) < R + this.player.r) {
        if (this.player.takeDamage(x, y)) {
          this.tookDamage = true;
          if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
          this.endGame(false, 'Взрыв жирного покупателя 💣');
          return true;
        }
      }
    }

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.type === 'boss' || e.type === 'director') continue;
      if (dist(x, y, e.x, e.y) < R + e.r) {
        const died = e.hit(2, x, y);
        this.spawnParticles(e.x, e.y, 8, '#ffaa00', 160, 0.35);
        if (died) {
          this.score += 1;
          this.player.gainXP(e.xpReward);
          this.dropCoins(e);
          // сразу кредитовать килл: _pendingFuse раньше терялся при filter в том же кадре
          if (e.type === 'fatty' || e.explodes) this.armFattyFuse(e);
          this.onEnemyKilled(e);
        }
      }
    }
    return false;
  }

  openUpgradeUI() {
    this.choosingUpgrade = true;
    this.paused = true;
    if (this.upgradeRerollsLeft == null) this.upgradeRerollsLeft = 3;
    const pool = [...UPGRADES];
    this.upgradeChoices = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = randi(0, pool.length - 1);
      this.upgradeChoices.push(pool.splice(idx, 1)[0]);
    }
    if (typeof LevelUpPopup !== 'undefined') {
      LevelUpPopup.open({
        title: `Уровень ${this.player?.level || 1}`,
        cards: this.upgradeChoices.map((up) => LevelUpPopup.formatChoice(up)),
        banishMode: false,
        onPick: (i) => this.pickUpgrade(i),
      });
    }
    this.updateUpgradeRerollBtn();
    this.refreshMusicState();
    if (!this._shiftRerolling) sfx.level();
  }

  pickUpgrade(i) {
    const up = this.upgradeChoices[i];
    if (!up) return;
    up.apply(this.player, this);
    sfx.click();
    if (typeof LevelUpPopup !== 'undefined') LevelUpPopup.close();
    this.choosingUpgrade = false;
    this.updateUpgradeRerollBtn();
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
    if (this.pendingUpgrades > 0) this.openUpgradeUI();
    else {
      this.paused = false;
      this.refreshMusicState();
    }
  }

  setEndOverlayState(won) {
    const popup = document.getElementById('end-popup');
    if (popup) popup.classList.toggle('end-popup--win', !!won);
  }

  endGame(won, killer = '') {
    this.gameOver = !won;
    this.won = won;
    this.killedBy = killer;
    this.paused = true;
    const isNew = this.score > this.highScore;
    if (isNew) {
      this.highScore = this.score;
    }
    const waveLevel = this.wave || 1;
    if (waveLevel > (this.highWaveLevel || 0)) this.highWaveLevel = waveLevel;
    const ch = CHALLENGES.find(c => c.id === this.selectedChallenge) || CHALLENGES[0];
    let challengeOk = won && ch.id !== 'none' && !this.challengeFailed;
    if (ch.id === 'no_damage' && this.tookDamage) challengeOk = false;
    let bankGain = Math.floor(this.coins * 0.35) + (won ? 15 : 0);
    let challengeBonus = 0;
    if (challengeOk) {
      challengeBonus = ch.bonus || 0;
      bankGain += challengeBonus;
    }
    this.bankCoins += bankGain;
    this.persist();
    this.setEndOverlayState(won);
    document.getElementById('end-title').textContent = won ? 'СМЕНА ЗАКРЫТА!' : 'ВАС УВОЛИЛИ';
    document.getElementById('end-sub').textContent = won
      ? `Все 10 волн пройдены. В банк: +${bankGain}🪙`
      : ((killer ? `Причина: ${killer}. ` : '') + `В банк: +${bankGain}🪙`);
    document.getElementById('end-time').textContent = '00:00';
    document.getElementById('end-wave').textContent = String(waveLevel);
    document.getElementById('end-wave-record').textContent = String(this.highWaveLevel || 0);
    document.getElementById('end-bank').textContent = String(bankGain);
    document.getElementById('end-score').textContent = this.score + ` · 🪙 ${this.coins}`;
    document.getElementById('end-combo').textContent = this.maxCombo;
    document.getElementById('end-record').textContent = this.highScore;
    document.getElementById('end-newrec').style.display = isNew ? 'inline' : 'none';
    const cl = document.getElementById('end-challenge-line');
    if (cl) {
      if (ch.id === 'none') cl.textContent = 'Испытание: не выбрано';
      else if (challengeOk) cl.textContent = `Испытание «${ch.name}» ✅ · бонус +${challengeBonus}🪙`;
      else cl.textContent = `Испытание «${ch.name}» ❌`;
    }
    document.getElementById('end-overlay').classList.add('show');
    this.refreshMusicState();
    if (won) sfx.win(); else sfx.lose();
    this.vibrate(won ? [40, 40, 80] : 80);
  }

  setupInput() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') this.togglePause();
      if (e.key === 'r' || e.key === 'R') {
        if (this.gameOver || this.won) { this.hideOverlays(); this.openMainMenu(); }
      }
      if (this.choosingUpgrade && ['1','2','3'].includes(e.key)) {
        this.pickUpgrade(Number(e.key) - 1);
      }
      if (this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) { sfx.ensure(); music.start(); return; }
      if (e.key === ' ' && !e.repeat && this.gameMode !== 'sale') this.player.startCharge();
      if (this.gameMode !== 'sale' && (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') && !e.repeat) {
        const dir = this.getInputDir();
        if (this.player.tryDash(dir.x, dir.y)) { sfx.mode(); this.vibrate(12); this.spawnParticles(this.player.x, this.player.y, 10, '#5dade2', 160, 0.3); }
      }
      if (this.gameMode !== 'sale' && (e.key === 'f' || e.key === 'F' || e.key === 'e' || e.key === 'E') && !e.repeat) {
        if (this.player.trySkill()) { sfx.level(); this.vibrate([20, 30, 20]); this.spawnParticles(this.player.x, this.player.y, 24, '#f1c40f', 220, 0.55); }
      }
      sfx.ensure(); music.start();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key] = false;
      if (e.key === ' ' && this.gameMode !== 'sale' && !(this.paused || this.choosingUpgrade || this.shopping || this.gameOver)) {
        if (this.player.releaseAttack()) { sfx.hit(); this.vibrate(15); }
      }
    });

    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      sfx.ensure(); music.start();
      if (this.gameOver || this.won) return;
      if (this.paused || this.choosingUpgrade || this.shopping) return;
      const rect = canvas.getBoundingClientRect();
      const wpt = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      this.player.angle = angleTo(this.player.x, this.player.y, wpt.x, wpt.y);
      if (this.gameMode === 'sale') return;
      this.mouseAttack = true;
      this.player.startCharge();
    });
    canvas.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      if (!this.mouseAttack) return;
      this.mouseAttack = false;
      if (this.gameMode === 'sale') return;
      if (this.paused || this.choosingUpgrade || this.shopping || this.gameOver) { this.player.charging = false; this.player.charge = 0; return; }
      if (this.player.releaseAttack()) { sfx.hit(); this.vibrate(15); }
    });
    canvas.addEventListener('mouseleave', () => {
      if (this.mouseAttack) {
        this.mouseAttack = false;
        if (this.gameMode !== 'sale' && this.player.releaseAttack()) sfx.hit();
      }
    });
    canvas.addEventListener('mousemove', e => {
      if (this.paused || this.choosingUpgrade || this.shopping || this.gameOver) return;
      const rect = canvas.getBoundingClientRect();
      if (!this.player.attacking) {
        const wpt = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        this.player.angle = angleTo(this.player.x, this.player.y, wpt.x, wpt.y);
      }
    });

    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');
    const attackZone = document.getElementById('attack-zone');
    const attackBtn = document.getElementById('attack-btn');

    joystickZone.addEventListener('touchstart', e => {
      e.preventDefault(); sfx.ensure(); music.start();
      if (this.gameOver || this.won) { this.hideOverlays(); this.resetGame(); return; }
      for (const t of e.changedTouches) {
        if (this.joystickId === null && this.attackTouchId !== t.identifier) {
          this.joystickId = t.identifier; this.joystickActive = true;
          this.joystickBase.x = t.clientX; this.joystickBase.y = t.clientY;
          joystickBase.classList.add('active');
          joystickBase.style.left = (t.clientX - joystickZone.getBoundingClientRect().left - 55) + 'px';
          joystickBase.style.bottom = 'auto';
          joystickBase.style.top = (t.clientY - joystickZone.getBoundingClientRect().top - 55) + 'px';
        }
      }
    }, { passive: false });

    joystickZone.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.joystickId) {
          const dx = t.clientX - this.joystickBase.x, dy = t.clientY - this.joystickBase.y;
          const maxR = 42, d = Math.hypot(dx, dy), clampD = Math.min(d, maxR);
          const nx = d > 0 ? (dx / d) * clampD : 0, ny = d > 0 ? (dy / d) * clampD : 0;
          this.moveDir.x = nx / maxR; this.moveDir.y = ny / maxR;
          joystickThumb.style.transform = `translate(${nx}px, ${ny}px)`;
        }
      }
    }, { passive: false });

    const endJoy = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joystickId) {
          this.joystickId = null; this.joystickActive = false;
          this.moveDir.x = 0; this.moveDir.y = 0;
          joystickThumb.style.transform = ''; joystickBase.classList.remove('active');
        }
      }
    };
    joystickZone.addEventListener('touchend', endJoy);
    joystickZone.addEventListener('touchcancel', endJoy);

    const dashBtn = document.getElementById('dash-btn');
    const skillBtn = document.getElementById('skill-btn');
    this.dashTouchId = null;
    this.skillTouchId = null;

    const touchPos = (t) => {
      const r = attackZone.getBoundingClientRect();
      return { x: t.clientX - r.left, y: t.clientY - r.top, w: r.width, h: r.height };
    };
    const hitBtn = (t, el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return Math.hypot(t.clientX - cx, t.clientY - cy) < Math.max(r.width, r.height) * 0.65;
    };

    attackZone.addEventListener('touchstart', e => {
      e.preventDefault(); sfx.ensure(); music.start();
      if (this.gameOver || this.won) { this.hideOverlays(); this.resetGame(); return; }
      if (this.paused || this.choosingUpgrade || this.shopping) return;
      // В Распродаже атак/дэша/обеда нет — только джойстик на весь экран
      if (this.gameMode === 'sale') return;
      for (const t of e.changedTouches) {
        if (this.joystickId === t.identifier) continue;

        if (this.dashTouchId === null && hitBtn(t, dashBtn)) {
          this.dashTouchId = t.identifier;
          dashBtn.classList.add('pressed');
          const dir = this.getInputDir();
          if (this.player.tryDash(dir.x, dir.y)) { sfx.mode(); this.vibrate(12); this.spawnParticles(this.player.x, this.player.y, 10, '#5dade2', 160, 0.3); }
          continue;
        }
        if (this.skillTouchId === null && hitBtn(t, skillBtn)) {
          this.skillTouchId = t.identifier;
          skillBtn.classList.add('pressed');
          if (this.player.trySkill()) { sfx.level(); this.vibrate([20,30,20]); this.spawnParticles(this.player.x, this.player.y, 24, '#f1c40f', 220, 0.55); }
          continue;
        }
        if (this.attackTouchId === null) {
          this.attackTouchId = t.identifier; this.attackHeld = true;
          attackBtn.classList.add('pressed');
          attackBtn.classList.add('charging');
          this.player.startCharge();
        }
      }
    }, { passive: false });
    const endAtk = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.attackTouchId) {
          this.attackTouchId = null; this.attackHeld = false;
          attackBtn.classList.remove('pressed');
          attackBtn.classList.remove('charging');
          if (this.gameMode !== 'sale' && !(this.paused || this.choosingUpgrade || this.shopping || this.gameOver)) {
            if (this.player.releaseAttack()) { sfx.hit(); this.vibrate(18); }
          } else {
            this.player.charging = false; this.player.charge = 0;
          }
        }
        if (t.identifier === this.dashTouchId) {
          this.dashTouchId = null; dashBtn.classList.remove('pressed');
        }
        if (t.identifier === this.skillTouchId) {
          this.skillTouchId = null; skillBtn.classList.remove('pressed');
        }
      }
    };
    attackZone.addEventListener('touchend', endAtk);
    attackZone.addEventListener('touchcancel', endAtk);
  }

  getInputDir() {
    let dx = this.moveDir.x, dy = this.moveDir.y;
    if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) dx += 1;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    return { x: dx, y: dy };
  }

  zoneAt(x, y) {
    for (const z of this.zones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  }

  updateHUD() {
    const p = this.player;
    this.$hpFill.style.width = (100 * p.hp / p.maxHp) + '%';
    this.$hpText.textContent = `${p.hp}/${p.maxHp}`;
    this.$xpFill.style.width = (100 * p.xp / p.xpToNext) + '%';
    this.$xpText.textContent = `${p.xp}/${p.xpToNext}`;
    this.$level.textContent = p.level;
    this.$score.textContent = '🔨 ' + this.score;
    if (this.$coins) this.$coins.textContent = '🪙 ' + this.coins;
    this.updateBattleBar();
    const sk = document.getElementById('hud-skill-fill');
    const ch = document.getElementById('hud-charge-fill');
    if (sk) sk.style.width = (100 * p.skill / p.skillMax) + '%';
    if (ch) ch.style.width = (100 * (p.charging ? p.charge : 0)) + '%';
    const dashBtn = document.getElementById('dash-btn');
    const skillBtn = document.getElementById('skill-btn');
    if (dashBtn) {
      const noDash = (p.dashChargesMax || 1) > 1
        ? (p.dashCharges || 0) <= 0
        : (p.dashCd > 0 || p.dashTime > 0);
      dashBtn.classList.toggle('cd', noDash || p.dashTime > 0);
    }
    if (skillBtn) {
      skillBtn.classList.toggle('ready', p.skill >= p.skillMax);
      skillBtn.classList.toggle('cd', p.skill < p.skillMax);
    }
    const bossAlive = this.enemies.find(e => e.hp > 0 && (e.type === 'boss' || e.type === 'miniboss' || e.type === 'director'));
    this.$wave.textContent = this.wavePhase === 'boss'
      ? `🌊 В${this.wave} · ${(bossAlive && bossAlive.nameTag) || 'БОСС'}`
      : (this.blackFriday ? `🖤 В${this.wave}/${SHIFT_WAVES}` : `🌊 Волна ${this.wave}/${SHIFT_WAVES}`);
    this.$enemies.textContent = this.wavePhase === 'boss'
      ? (bossAlive ? `❤ ${Math.max(0, Math.ceil(bossAlive.hp))}` : 'Босс!')
      : `Убито ${this.waveKills}/${this.killsPerWave}`;
    const rem = Math.max(0, this.MODE_DURATION - this.modeTimer).toFixed(1);
    if (this.isChaseMode) {
      // isChaseMode = час пик (rush)
      this.$mode.textContent = '🔴 ПИК ' + rem + 'с';
      this.$mode.className = 'hud-mode chase';
    } else {
      this.$mode.textContent = '🔵 СМЕНА ' + rem + 'с';
      this.$mode.className = 'hud-mode flee';
    }
    if (this.combo >= 2) {
      this.$combo.classList.add('on');
      this.$combo.textContent = `🔥 x${this.combo}`;
    } else {
      this.$combo.classList.remove('on');
      this.$combo.textContent = '🔥 x0';
    }

    const tags = [];
    if (p.lunchTimer > 0) {
      const teaNote = p.teaDamageBonus ? ' +урон' : '';
      tags.push(`<span class="buff-tag good">☕ Обед ${p.lunchTimer.toFixed(1)}с${teaNote}</span>`);
    }
    if (p.slowTimer > 0) tags.push(`<span class="buff-tag bad">📋 Жалоба ${p.slowTimer.toFixed(1)}с</span>`);
    if (p.muteAttack > 0) tags.push(`<span class="buff-tag bad">🤐 Без удара ${p.muteAttack.toFixed(1)}с</span>`);
    if (p.shameTimer > 0) tags.push(`<span class="buff-tag bad">📸 Стыд ${p.shameTimer.toFixed(1)}с</span>`);
    if (this.blackFriday) tags.push(`<span class="buff-tag good">🖤 Чёрная пятница ×2</span>`);
    if (this.comboShield > 0) tags.push(`<span class="buff-tag good">🔥 Комбо-щит ${this.comboShield.toFixed(0)}с</span>`);
    if (p.shieldCharges > 0) tags.push(`<span class="buff-tag good">🛡️ Блок ×${p.shieldCharges}</span>`);
    if ((p.extraLives || 0) > 0) tags.push(`<span class="buff-tag good">💖 Жизнь ×${p.extraLives}</span>`);
    if ((p.dashChargesMax || 1) > 1) tags.push(`<span class="buff-tag good">💨 Дэш ${p.dashCharges}/${p.dashChargesMax}</span>`);
    if ((this.coinMult || 1) > 1.01) tags.push(`<span class="buff-tag good">🎫 Монеты ×${this.coinMult.toFixed(2)}</span>`);
    const w = p.weapon; if (w) tags.push(`<span class="buff-tag good">${w.ico || '⚔'} ${w.name}${w.level ? ' ·' + w.level : ''}</span>`);
    if (p.tempWeapon && p.tempWeaponTimer > 0) {
      tags.push(`<span class="buff-tag good">${p.tempWeapon.ico} ${p.tempWeapon.name} ${p.tempWeaponTimer.toFixed(0)}с</span>`);
    }
    if (this.fireAlarm > 0) tags.push(`<span class="buff-tag bad">🚨 Тревога ${this.fireAlarm.toFixed(0)}с</span>`);
    if (this.lightsOut > 0) tags.push(`<span class="buff-tag bad">💡 Темнота ${this.lightsOut.toFixed(0)}с</span>`);
    const th = this.getArenaTheme();
    if (th) tags.push(`<span class="buff-tag good">${th.ico} ${th.name}</span>`);
    this.$buffBar.innerHTML = tags.join('');
  }

  update(dt) {
    if (this.isBoostersOpen() || this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) return;
    const realDt = Math.min(dt, 0.1);
    music.setIntensity(this.wavePhase === 'boss' ? 'boss' : (this.isChaseMode ? 'rush' : 'calm'));

    if (this.eventCooldown > 0) this.eventCooldown -= realDt;
    if (this.lightsOut > 0) this.lightsOut -= realDt;
    if (this.fireAlarm > 0) this.fireAlarm -= realDt;
    if (this._eventBanner) {
      this._eventBanner.t -= realDt;
      if (this._eventBanner.t <= 0) this._eventBanner = null;
    }

    // Скользкий пол
    const zone = this.zoneAt(this.player.x, this.player.y);
    let slip = zone && zone.type === 'slippery' ? 1.35 : 1;

    const dir = this.getInputDir();
    if (this.player.dashTime <= 0) {
      this.player.x += dir.x * this.player.speed * slip * realDt;
      this.player.y += dir.y * this.player.speed * slip * realDt;
    }
    if (dir.x || dir.y) this.player.angle = Math.atan2(dir.y, dir.x);
    this.player.update(realDt, this.worldW, this.worldH, this);
    this.player.tickAnim(realDt, !!(dir.x || dir.y));
    this.pushOutOfObstacles(this.player, this.player.r);

    // Камера с lead (видимая область с учётом зума)
    const lead = 60;
    const targetCX = this.player.x - this.viewW() / 2 + Math.cos(this.player.angle) * lead * 0.35;
    const targetCY = this.player.y - this.viewH() / 2 + Math.sin(this.player.angle) * lead * 0.35;
    this.camera.x = this.camera.x + (targetCX - this.camera.x) * Math.min(1, realDt * 6);
    this.camera.y = this.camera.y + (targetCY - this.camera.y) * Math.min(1, realDt * 6);

    // Режим охота/побег
    this.modeTimer += realDt;
    if (this.modeFlash > 0) this.modeFlash -= realDt;
    if (this.comboShield > 0) this.comboShield -= realDt;
    if (this.comboTimer > 0) {
      this.comboTimer -= realDt;
      if (this.comboTimer <= 0 && this.comboShield <= 0) this.combo = 0;
    }
    if (this.modeTimer >= this.MODE_DURATION) {
      this.modeTimer = 0;
      this.isChaseMode = !this.isChaseMode; // rush hour on/off — побега больше нет
      this.modeFlash = 0.5;
      sfx.mode();
    }

    // Считаем живые баблы один раз за кадр (не на каждом мобе)
    let liveBubbles = 0;
    for (const e of this.enemies) {
      if (e.bubble && !e.bubble.dead) liveBubbles++;
    }
    this._liveBubbles = liveBubbles;

    for (const enemy of this.enemies) {
      enemy.update(realDt, this.player, this.worldW, this.worldH, this.isChaseMode, this);
      this.pushOutOfObstacles(enemy, enemy.r);

      // Контакт
      const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
      const hitR = this.player.r + enemy.r - (enemy.type === 'tank' ? 0 : 2);
      if (d < hitR) {
        if (enemy.noDamage || enemy.type === 'child') {
          const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
          this.player.knockback.x += Math.cos(a) * 140;
          this.player.knockback.y += Math.sin(a) * 140;
          enemy.knockback.x -= Math.cos(a) * 80;
          enemy.knockback.y -= Math.sin(a) * 80;
        } else if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (enemy.type === 'tank' || enemy.type === 'miniboss' || enemy.type === 'director') {
            const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
            this.player.knockback.x += Math.cos(a) * 100;
            this.player.knockback.y += Math.sin(a) * 100;
          }
          const beforeHp = this.player.hp;
          if (this.player.takeDamage(enemy.x, enemy.y)) {
            this.tookDamage = true;
            if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
            this.spawnParticles(this.player.x, this.player.y, 40, '#e74c3c', 350, 0.8);
            this.endGame(false, enemy.nameTag || 'Покупатель');
            return;
          }
          if (this.player.hp < beforeHp) {
            this.tookDamage = true;
            if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
          }
          sfx.hurt(); this.vibrate(40);
          this.spawnParticles(this.player.x, this.player.y, 8, '#ff6b6b', 150, 0.4);
          const a = angleTo(this.player.x, this.player.y, enemy.x, enemy.y);
          enemy.knockback.x = Math.cos(a) * 200;
          enemy.knockback.y = Math.sin(a) * 200;
        }
      }
    }

    // ranged stapler shot once per swing
    if (this.player.attacking && this.player._justFiredRanged) {
      this.player._justFiredRanged = false;
      const a = this.player.angle;
      this.playerProjectiles.push({
        x: this.player.x, y: this.player.y, angle: a, speed: 420, life: 0.9, r: 7, dmg: this.player.damage,
      });
    }

    // Атака
    if (this.player.attacking) {
      for (const enemy of this.enemies) {
        if (this.player.isEnemyInHitZone(enemy)) {
          this.player.hitEnemies.add(enemy);
          let dmg = this.player.getAttackDamage();
          if (this.player.critChance && Math.random() < this.player.critChance) dmg += 1;
          const knock = (this.player.knockPower || 300) * (1 + (this.player.chargePower || 0) * 0.4)
            * (this.player._justAoe ? 1.35 : 1);
          const died = enemy.hit(dmg, this.player.x, this.player.y, knock, this.player.stunOnHit || 0);
          this.player.fillSkill(6 + (this.player.chargePower || 0) * 8);
          this.spawnParticles(enemy.x, enemy.y, 8, this.player.stunOnHit ? '#5dade2' : '#ffaa00', 180, 0.4);
          if (Math.random() < 0.35) {
            this.spawnSpriteFx('fx_hit_spark', enemy.x, enemy.y, { scale: 0.55, life: 0.18, vy: -5 });
          }
          sfx.hit();

          // Разрушение витрин рядом — через прилавки с hp
          for (const ob of this.obstacles) {
            if (ob.type === 'counter' && ob.hp > 0) {
              const cx = ob.x + ob.w / 2, cy = ob.y + ob.h / 2;
              if (dist(enemy.x, enemy.y, cx, cy) < 50) {
                // no-op visual elsewhere
              }
            }
          }

          if (died) {
            // Комбо сильнее в побеге
            this.combo++;
            this.comboTimer = 3.2;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.player.fillSkill(12 + Math.min(20, this.combo * 2));
            const mult = 1 + Math.floor(this.combo / 3);
            this.score += mult;
            const leveled = this.player.gainXP(enemy.xpReward);
            if (leveled) {
              this.pendingUpgrades += leveled;
              this.openUpgradeUI();
            }
            sfx.kill();
            const sizeMult = (enemy.type === 'boss' || enemy.type === 'director') ? 2.5
              : (enemy.type === 'fatty' ? 2.0 : 1);
            const deathColor = enemy.type === 'fatty' ? '#ff6b00'
              : (this.isChaseMode ? '#e74c3c' : '#f1c40f');
            this.spawnParticles(enemy.x, enemy.y, Math.floor(20 * sizeMult), deathColor, 280 * sizeMult, 0.7);
            this.spawnSpriteFx(Math.random() < 0.5 ? 'fx_blood' : 'fx_hit_blood', enemy.x, enemy.y, {
              scale: 0.55 * sizeMult, scaleEnd: 0.9 * sizeMult, life: 0.32, vy: -10,
            });
            if (enemy.type === 'fatty' || enemy.explodes) {
              this.spawnSpriteFx('fx_skull', enemy.x, enemy.y - 10, { scale: 0.7, life: 0.45, vy: -40 });
            }
            this.screenShake = Math.max(this.screenShake, 0.12 * sizeMult);

            const dropChance = enemy.type === 'boss' || enemy.type === 'director' ? 1 :
              enemy.type === 'fatty' ? 0.55 :
              enemy.type === 'influencer' ? 0.6 : 0.28;
            this.dropCoins(enemy);
            if (Math.random() < dropChance) {
              this.pickups.push(new Pickup(enemy.x, enemy.y, Math.random() < 0.25 ? 'lunch' : 'heal'));
            }
            if (this.selectedChallenge !== 'hammer_only' && Math.random() < 0.09) {
              const kinds = ['temp_mop', 'temp_stapler', 'temp_extinguisher'];
              this.pickups.push(new Pickup(enemy.x + rand(-8, 8), enemy.y + rand(-8, 8), pick(kinds)));
            }

            if (enemy.type === 'fatty' || enemy.explodes) {
              this.armFattyFuse(enemy);
            }

            if (enemy.type === 'director') {
              this.endGame(true);
              return;
            }
            this.onEnemyKilled(enemy);
          }
        }
      }
    }

    // Тикают бомбы — взрыв с задержкой
    for (const bomb of this.fuseBombs) {
      bomb.life -= realDt;
      if (bomb.life <= 0 && !bomb.exploded) {
        bomb.exploded = true;
        if (this.explodeAt(bomb.x, bomb.y)) return;
      }
    }
    this.fuseBombs = this.fuseBombs.filter(b => !b.exploded);

    // на случай старых _pendingFuse (до фикса explodeAt)
    for (const e of this.enemies) {
      if (e._pendingFuse && e.hp <= 0) {
        e._pendingFuse = false;
        this.armFattyFuse(e);
        this.onEnemyKilled(e);
      }
    }

    this.enemies = this.enemies.filter(e => e.hp > 0);
    if (this._clearMobsAfterKill) {
      this.enemies = this.enemies.filter(e => e.type === 'boss' || e.type === 'miniboss' || e.type === 'director');
      this._clearMobsAfterKill = false;
    }
    this.ensureWaveMobProgress();

    // Снаряды (книга жалоб)
    for (const pr of this.projectiles) {
      pr.update(realDt);
      if (!pr.dead && dist(pr.x, pr.y, this.player.x, this.player.y) < this.player.r + pr.r) {
        pr.dead = true;
        this.player.applyComplaint();
        this.spawnParticles(this.player.x, this.player.y, 10, '#8e44ad', 120, 0.4);
        sfx.hurt();
        this.vibrate(35);
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt);
    for (const p of this.particles) p.update(realDt);
    this.particles = this.particles.filter(p => !p.dead);
    this.tickSpriteFx(realDt);
    for (const b of this.boomFx) b.life -= realDt;
    this.boomFx = this.boomFx.filter(b => b.life > 0);

    if (this.updateBossLineAttacks(realDt)) return;

    for (const pk of this.pickups) {
      pk.update(realDt, this.player);
      if (!pk.dead && dist(this.player.x, this.player.y, pk.x, pk.y) < this.player.r + pk.r + 4) {
        if (pk.type === 'coin') {
          this.coins += pk.value || 1;
          pk.life = 0; sfx.coin();
          this.spawnParticles(pk.x, pk.y, 8, '#f1c40f', 100, 0.35);
        } else if (pk.type === 'heal' && this.player.hp < this.player.maxHp) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          pk.life = 0; sfx.pickup();
          this.spawnParticles(pk.x, pk.y, 12, '#ff6b6b', 120, 0.5);
        } else if (pk.type === 'lunch') {
          this.player.fillSkill(55);
          pk.life = 0; sfx.pickup();
          this.spawnParticles(pk.x, pk.y, 16, '#f39c12', 140, 0.5);
        } else if (pk.type.startsWith('temp_') && this.selectedChallenge !== 'hammer_only') {
          const id = pk.type.replace('temp_', '');
          const tw = TEMP_WEAPONS[id];
          if (tw) {
            this.player.applyTempWeapon(tw);
            pk.life = 0; sfx.pickup();
            this.spawnParticles(pk.x, pk.y, 14, '#5dade2', 130, 0.45);
          }
        }
      }
    }
    this.pickups = this.pickups.filter(p => !p.dead);

    // player projectiles (stapler)
    for (const pr of this.playerProjectiles) {
      pr.x += Math.cos(pr.angle) * pr.speed * realDt;
      pr.y += Math.sin(pr.angle) * pr.speed * realDt;
      pr.life -= realDt;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        if (dist(pr.x, pr.y, enemy.x, enemy.y) < enemy.r + pr.r) {
          let dmg = pr.dmg || 1;
          if (this.player.critChance && Math.random() < this.player.critChance) dmg += 1;
          const died = enemy.hit(dmg, this.player.x, this.player.y, 220, 0);
          this.player.fillSkill(5);
          this.spawnParticles(enemy.x, enemy.y, 6, '#bdc3c7', 140, 0.3);
          pr.life = 0;
          if (died) this.onEnemyKilled(enemy);
          break;
        }
      }
    }
    this.playerProjectiles = this.playerProjectiles.filter(pr => pr.life > 0);
    this.flushReviveFx();
  }

  flushReviveFx() {
    if (!this.player || !this.player._justRevived) return;
    this.player._justRevived = false;
    this.showEventBanner('💖 Вторая жизнь!', 2.2);
    this.spawnParticles(this.player.x, this.player.y, 28, '#ff6b9d', 220, 0.55);
    this.screenShake = Math.max(this.screenShake, 0.25);
    sfx.level();
    this.vibrate([20, 40, 20]);
  }


  /** Камера для отрисовки: привязка к пикселям экрана (убирает рябь тайлов при зуме). */
  renderCamera() {
    const z = this.viewZoom || 1;
    return {
      x: Math.round(this.camera.x * z) / z,
      y: Math.round(this.camera.y * z) / z,
      z,
    };
  }

  drawBackground() {
    const WW = this.worldW, WH = this.worldH;
    ctx.fillStyle = '#d9d2c5';
    ctx.fillRect(0, 0, WW, WH);

    // Тайлы пола из атласа
    const tileSize = 64;
    const cam = this._renderCam || this.camera;
    const vw = this.viewW();
    const vh = this.viewH();
    const vx1 = Math.floor(cam.x / tileSize) * tileSize;
    const vy1 = Math.floor(cam.y / tileSize) * tileSize;
    const vx2 = cam.x + vw + tileSize;
    const vy2 = cam.y + vh + tileSize;
    ctx.imageSmoothingEnabled = false;
    const themeTile = (this.getArenaTheme() && this.getArenaTheme().tile) || 'tile_beige';
    const zones = this.zones;
    const hasZones = zones && zones.length > 0;
    for (let x = vx1; x < vx2; x += tileSize) {
      for (let y = vy1; y < vy2; y += tileSize) {
        let name = themeTile;
        if (hasZones) {
          const cx = x + tileSize / 2, cy = y + tileSize / 2;
          for (const z of zones) {
            if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) {
              if (z.type === 'slippery') name = 'tile_gloss';
              else if (z.type === 'foodcourt') name = 'tile_wood';
              else if (z.type === 'checkout') name = 'tile_check';
              break;
            }
          }
        }
        // ровно tileSize — без +2, иначе при зуме швы рябят
        if (!drawSprite(ctx, name, x + tileSize / 2, y + tileSize, { w: tileSize, h: tileSize, anchorY: 1, anchorX: 0.5 })) {
          ctx.fillStyle = '#e8dcc8';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }

    // Мокрый пол — табличка
    for (const z of this.zones) {
      if (z.type === 'slippery') {
        if (!drawArenaProp(ctx, 'wet_floor', z.x + z.w / 2, z.y + z.h / 2 + 10, { scale: 0.95, anchorY: 0.5 })) {
          drawSprite(ctx, 'wet_floor', z.x + z.w / 2, z.y + z.h / 2 + 10, { scale: 1.1, anchorY: 0.5 });
        }
      } else if (z.type === 'foodcourt') {
        if (!drawWallDecor(ctx, 'wall_burger', z.x + 30, z.y + 20, { scale: 0.55, anchorY: 1 })) {
          drawSprite(ctx, 'sign_burger', z.x + 30, z.y + 20, { scale: 0.9, anchorY: 1 });
        }
      } else if (z.type === 'checkout') {
        if (!drawWallDecor(ctx, 'wall_sale', z.x + z.w - 20, z.y + 24, { scale: 0.5, anchorY: 1 })) {
          drawSprite(ctx, 'sign_sale', z.x + z.w - 20, z.y + 24, { scale: 0.85, anchorY: 1 });
        }
      }
    }

    this.drawArenaFence(WW, WH);
    this.drawWallDecorations();

    for (const sf of this.storefronts) {
      if (!drawStorefrontSprite(ctx, sf.sprite, sf.x + sf.w / 2, sf.y + sf.h, { w: sf.w, h: sf.h, anchorY: 1 })) {
        ctx.fillStyle = '#a8d8ea'; ctx.fillRect(sf.x, sf.y, sf.w, sf.h);
      }
    }
  }

  drawObstacle(ob) {
    const cx = ob.x + ob.w / 2;
    const by = ob.y + ob.h;
    const dw = ob.dw || (ob.w * 1.15);
    const dh = ob.dh || (ob.h * 1.35);
    if (drawArenaProp(ctx, ob.sprite, cx, by, { w: dw, h: dh, anchorY: 1 })) return;
    if (!drawSprite(ctx, ob.sprite, cx, by, { w: dw, h: dh, anchorY: 1 })) {
      ctx.fillStyle = '#c4b99a';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }
  }

  drawObstacles() {
    const sorted = [...this.obstacles].sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const ob of sorted) this.drawObstacle(ob);
  }

  /** Пропы + персонажи по «ногам» — иначе лезем сквозь верх полок */
  drawDepthSorted(vx0, vy0, vx1, vy1) {
    const items = [];
    for (const ob of this.obstacles) {
      items.push({ y: ob.y + ob.h, z: 0, draw: () => this.drawObstacle(ob) });
    }
    for (const enemy of this.enemies) {
      if (enemy.x < vx0 || enemy.x > vx1 || enemy.y < vy0 || enemy.y > vy1) continue;
      items.push({ y: enemy.y, z: 1, draw: () => enemy.draw(ctx, this.isChaseMode) });
    }
    items.push({ y: this.player.y, z: 2, draw: () => this.player.draw(ctx) });
    items.sort((a, b) => (a.y - b.y) || (a.z - b.z));
    for (const it of items) it.draw();
  }

  /** Затемнение карты со световым пятном вокруг игрока */
  drawPlayerLight(shakeX = 0, shakeY = 0) {
    if (!this.player) return;
    // На толпе мобов полный экранный градиент жрёт GPU Android — упрощаем / пропускаем
    const crowded = this.enemies.length >= 10;
    if (LOW_GFX && crowded && this.lightsOut <= 0 && !this.isChaseMode) return;

    const cam = this._renderCam || this.renderCamera();
    const px = (this.player.x - cam.x) * cam.z + shakeX;
    const py = (this.player.y - cam.y) * cam.z + shakeY;

    let radius = Math.min(this.W, this.H) * 0.28;
    radius = Math.max(140, Math.min(260, radius));
    if (this.player.lunchTimer > 0) radius *= 1.25;
    if (this.wavePhase === 'boss') radius *= 1.1;

    let darkness = this.isChaseMode ? 0.38 : 0.32;
    if (this.lightsOut > 0) {
      darkness = 0.72;
      radius *= 0.55;
      // фонарик / охотник в Распродаже расширяют круг видимости
      if (this.gameMode === 'sale' && this.saleWeapons) {
        if (this.saleWeapons.flashlight || this.saleWeapons.hunter) radius *= 1.55;
      }
    }

    ctx.save();
    const g = ctx.createRadialGradient(px, py, radius * 0.25, px, py, radius);
    g.addColorStop(0, 'rgba(8, 10, 20, 0)');
    g.addColorStop(0.7, `rgba(8, 10, 20, ${darkness * 0.7})`);
    g.addColorStop(1, `rgba(8, 10, 20, ${darkness})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
    // Второе свечение — только на десктопе / при lightsOut
    if (!LOW_GFX || this.lightsOut > 0) {
      const glow = ctx.createRadialGradient(px, py - 8, 4, px, py - 8, radius * 0.55);
      glow.addColorStop(0, 'rgba(255, 236, 180, 0.12)');
      glow.addColorStop(1, 'rgba(255, 220, 140, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.W, this.H);
    }
    ctx.restore();
  }

  render() {
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.W, this.H);
    let sx = 0, sy = 0;
    if (this.screenShake > 0) {
      // shake тоже к целым пикселям — иначе пол мерцает
      sx = Math.round((Math.random() - 0.5) * this.screenShake * 30);
      sy = Math.round((Math.random() - 0.5) * this.screenShake * 30);
    }
    const cam = this.renderCamera();
    this._renderCam = cam;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // setTransform: после зума камера и shake попадают в целые пиксели экрана
    ctx.setTransform(cam.z, 0, 0, cam.z, -Math.round(cam.x * cam.z) + sx, -Math.round(cam.y * cam.z) + sy);
    this.drawBackground();
    const viewPad = 80;
    const vx0 = cam.x - viewPad, vy0 = cam.y - viewPad;
    const vx1 = cam.x + this.viewW() + viewPad, vy1 = cam.y + this.viewH() + viewPad;
    for (const p of this.particles) {
      if (p.y < this.player.y - 30 && p.x >= vx0 && p.x <= vx1 && p.y >= vy0 && p.y <= vy1) p.draw(ctx);
    }
    this.drawDepthSorted(vx0, vy0, vx1, vy1);
    for (const p of this.particles) {
      if (p.y >= this.player.y - 30 && p.x >= vx0 && p.x <= vx1 && p.y >= vy0 && p.y <= vy1) p.draw(ctx);
    }
    for (const pk of this.pickups) pk.draw(ctx);
    for (const pr of this.projectiles) pr.draw(ctx);
    for (const pr of this.playerProjectiles) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(-8, -3, 16, 6);
      ctx.restore();
    }

    // Фитили жирных — мигает зона взрыва, успей убежать
    for (const bomb of this.fuseBombs) {
      const t = bomb.life / bomb.max;
      const pulse = 0.4 + Math.sin(performance.now() / 80) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.25 + pulse * 0.35;
      ctx.fillStyle = '#ff3b00';
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, FATTY_EXPLODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7 + pulse * 0.3;
      ctx.strokeStyle = '#ffdd00';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, FATTY_EXPLODE_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // тело «трупа» / бомбы
      if (bomb.hueRotate && !LOW_GFX) ctx.filter = `hue-rotate(${bomb.hueRotate}deg)`;
      drawSprite(ctx, bomb.sprite, bomb.x, bomb.y + 4, { scale: bomb.scale, anchorY: 1, alpha: 0.85 });
      if (bomb.hueRotate && !LOW_GFX) ctx.filter = 'none';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💣 ${bomb.life.toFixed(1)}`, bomb.x, bomb.y - bomb.r - 20);
      ctx.restore();
    }

    for (const b of this.boomFx) {
      const t = Math.max(0, Math.min(1, b.life / b.max));
      const progress = 1 - t;
      // новый анимированный взрыв (CC0-атлас), фолбэк — старые кадры
      const drewAnim = drawAnimFxFrame(ctx, 'afx_explosion', b.x, b.y, {
        t: progress,
        scale: 1.5 + progress * 1.1,
        alpha: Math.min(1, t * 1.4),
      });
      if (!drewAnim) {
        const boomName = VFX_BOOM_FRAMES[Math.min(VFX_BOOM_FRAMES.length - 1, Math.floor(progress * VFX_BOOM_FRAMES.length))];
        const sc = 0.85 + progress * 0.55;
        if (!drawVfx(ctx, boomName, b.x, b.y, { scale: sc, anchorY: 0.55, alpha: Math.min(1, t * 1.2) })) {
          const oldSc = 1.8 + progress * 2.4;
          if (!drawPickupFx(ctx, 'fx_boom', b.x, b.y, { scale: oldSc, anchorY: 0.5, alpha: t })) {
            drawSprite(ctx, 'fx_boom', b.x, b.y, { scale: 1.2 + progress * 1.8, anchorY: 0.5, alpha: t });
          }
        }
      }
      if (t > 0.35 && !drewAnim) {
        drawVfx(ctx, 'fx_hit_spark', b.x + 8, b.y - 10, { scale: 0.7 + progress, anchorY: 0.5, alpha: t * 0.75 });
        drawVfx(ctx, 'fx_smoke', b.x - 10, b.y + 8, { scale: 0.55 + progress * 0.35, anchorY: 0.5, alpha: t * 0.5 });
      }
      // кольцо взрыва
      ctx.save();
      ctx.globalAlpha = t * 0.5;
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, FATTY_EXPLODE_RADIUS * (1.1 - t * 0.3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.drawSpriteFx(ctx);
    this.renderAnimFx(ctx);
    if (this.gameMode === 'sale' && typeof this.renderSaleOverlays === 'function') {
      this.renderSaleOverlays();
    }
    this.drawBossLineAttacks();
    ctx.restore();

    // Лёгкая темень + свет над персонажем
    this.drawPlayerLight(sx, sy);

    // Sale: экранные оверлеи (стрелка на босса и т.п.)
    if (this.gameMode === 'sale' && typeof this.renderSaleScreenUI === 'function') {
      this.renderSaleScreenUI();
    }

    if (this.modeFlash > 0) {
      ctx.save();
      const flashAlpha = (this.modeFlash / 0.5) * 0.3;
      ctx.fillStyle = this.isChaseMode ? `rgba(255,60,30,${flashAlpha})` : `rgba(80,160,255,${flashAlpha})`;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, this.modeFlash * 2);
      ctx.fillText(this.isChaseMode ? '🔴 ЧАС ПИК!' : '🔵 ОБЫЧНАЯ СМЕНА', this.W / 2, this.H * 0.35);
      ctx.restore();
    }
    if (this._bfBanner > 0) {
      this._bfBanner -= 1 / 60;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, this.H * 0.28, this.W, 70);
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🖤 ЧЁРНАЯ ПЯТНИЦА!', this.W / 2, this.H * 0.35);
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('Больше покупателей · больше монет', this.W / 2, this.H * 0.35 + 28);
      ctx.restore();
    }
    if (this._eventBanner && this._eventBanner.t > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, this.H * 0.22, this.W, 64);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this._eventBanner.text, this.W / 2, this.H * 0.28);
      ctx.restore();
    }

    if (this.wavePhase === 'boss' && !this.won && !this.gameOver) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.directorSpawned ? '👔 ДИРЕКТОР НА СМЕНЕ' : '👔 БОСС ВОЛНЫ', this.W / 2, 28);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
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
