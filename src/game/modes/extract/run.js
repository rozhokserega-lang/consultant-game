/**
 * Вылазка: старт хаба / рейд / выход в меню.
 */
'use strict';

Object.assign(Game.prototype, {
  startExtractHub(opts) {
    opts = opts || {};
    this.hideOverlays();
    this.inMainMenu = false;
    this.inHub = false;
    this.paused = false;
    this.shopping = false;
    this.choosingUpgrade = false;
    this.gameOver = false;
    this.won = false;
    this.gameMode = 'extract';
    this.extractPhase = 'hub';
    this.extractFloor = 1;
    this.extractFocus = null;
    this._extractBanner = null;
    this._extractInteractCd = 0;
    document.body.classList.remove('hub-mode', 'main-menu-mode', 'sale-mode');
    document.body.classList.add('extract-mode');
    this.ensureExtractMeta();
    if (opts.resetPack || !this.extractBackpack) {
      this.extractBackpack = new Array(this.extractMeta.backpackSlots).fill(null);
    } else {
      while (this.extractBackpack.length < this.extractMeta.backpackSlots) {
        this.extractBackpack.push(null);
      }
    }
    this.saleWeapons = null;
    this.extractLoot = [];
    this.resize();
    this.buildExtractHubWorld();
    this.refreshExtractHud();
    requestAnimationFrame(() => this.resize());
    this.refreshMusicState();
    sfx.click();
    this.showExtractBanner('Парковка ТЦ · Игорь / Коля / Маша / Семён или лифт в ТЦ');
  },

  startExtractRaid(opts) {
    opts = opts || {};
    const floor = Math.max(1, (opts.floor | 0) || 1);
    const continueRun = !!opts.continueRun;
    let snap = null;
    if (continueRun && this.player) {
      snap = {
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        saleWeapons: this.saleWeapons ? Object.assign({}, this.saleWeapons) : null,
        saleWeaponCd: this.saleWeaponCd ? Object.assign({}, this.saleWeaponCd) : null,
      };
    }

    this.extractFloor = floor;
    this.extractPhase = 'raid';
    this.extractFocus = null;
    this.shopping = false;
    this.closeExtractShop();
    this.buildExtractRaidWorld();

    if (snap && this.player) {
      this.player.maxHp = snap.maxHp;
      this.player.hp = Math.max(1, Math.min(snap.hp, snap.maxHp));
      if (snap.saleWeapons) this.saleWeapons = snap.saleWeapons;
      if (snap.saleWeaponCd) this.saleWeaponCd = snap.saleWeaponCd;
    }

    this.refreshExtractHud();
    const floorDef = this.getExtractFloorDef(floor);
    const tip = continueRun
      ? `${floorDef.label} · мобы сильнее, лут дороже`
      : `${floorDef.label} · лут в комнатах, выход за боссом`;
    this.showExtractBanner(tip);
    sfx.mode();
  },

  /** Совместимость со старым именем. */
  startExtractRaidStub() {
    this.startExtractRaid({ floor: 1 });
  },

  ascendExtractFloor() {
    const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
    const next = (this.extractFloor || 1) + 1;
    if (next > maxFloor) {
      this.succeedExtractRaid();
      return;
    }
    this.startExtractRaid({ floor: next, continueRun: true });
  },

  returnExtractToHub() {
    this.succeedExtractRaid();
  },

  endExtractToMenu() {
    this.closeExtractShop();
    this.extractPhase = null;
    this.extractFocus = null;
    this.extractNpcs = null;
    this.extractElevator = null;
    this.extractLoot = [];
    this.saleWeapons = null;
    document.body.classList.remove('extract-mode');
    this.openMainMenu();
  },
});
