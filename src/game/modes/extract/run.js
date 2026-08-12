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
    this._extractEvacT = -1;
    this._extractEvacFired = false;
    this._extractLootBuff = null;
    if (!opts.keepInsurance) this.extractRunInsurance = null;
    document.body.classList.remove('hub-mode', 'main-menu-mode', 'sale-mode');
    document.body.classList.add('extract-mode');
    this.ensureExtractMeta();
    this.syncExtractBackpackSize();
    if (opts.resetPack) {
      this.extractBackpack = new Array(this.extractMeta.backpackSlots).fill(null);
      this.extractRunInsurance = null;
      this.persistExtract();
    }
    this.saleWeapons = null;
    this.extractLoot = [];
    this.resize();
    this.buildExtractHubWorld();
    this.refreshExtractHud();
    requestAnimationFrame(() => this.resize());
    this.refreshMusicState();
    sfx.click();
    const meta = this.extractMeta;
    const tot = meta.totalExtractedValue | 0;
    this.showExtractBanner(
      `Парковка · вынос ${tot}🪙 · жетоны в рейде · крупный лут = 2 слота`,
      3.0,
    );
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
    this._extractEvacT = -1;
    this._extractEvacFired = false;
    if (!continueRun) {
      this._extractLootBuff = null;
    }
    if (typeof this.resetExtractRaidPressure === 'function') {
      this.resetExtractRaidPressure(continueRun);
    }
    this.closeExtractShop();
    this.buildExtractRaidWorld();

    if (snap && this.player) {
      this.player.maxHp = snap.maxHp;
      this.player.hp = Math.max(1, Math.min(snap.hp, snap.maxHp));
      if (snap.saleWeapons) this.saleWeapons = snap.saleWeapons;
      if (snap.saleWeaponCd) this.saleWeaponCd = snap.saleWeaponCd;
    }
    if (continueRun && typeof this.reapplyExtractRaidMods === 'function') {
      this.reapplyExtractRaidMods({ skipHp: true });
    }

    this.refreshExtractHud();
    const floorDef = this.getExtractFloorDef(floor);
    let tip = continueRun
      ? `${floorDef.label} · мобы сильнее, лут дороже · давление растёт`
      : `${floorDef.label} · жетоны с элит · выход за боссом лифта`;
    if (floor === 2) tip += ' · ищи 🪪 для VIP';
    if (this._extractModSetOn) tip += ' · сет модов ×';
    if (opts.vipUsed) tip = '🪪 VIP-карта использована · ' + tip;
    this.showExtractBanner(tip);
    sfx.mode();
  },

  /** Совместимость со старым именем. */
  startExtractRaidStub() {
    this.startExtractRaid({ floor: 1 });
  },

  ascendExtractFloor() {
    const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
    const from = this.extractFloor || 1;
    const next = from + 1;
    if (next > maxFloor) {
      this.succeedExtractRaid();
      return;
    }
    if (typeof this.canAscendExtractFloor === 'function' && !this.canAscendExtractFloor(next)) {
      const hint = (typeof this.extractFloorLockHint === 'function')
        ? this.extractFloorLockHint(next)
        : `${next} этаж закрыт`;
      this.showExtractBanner(hint);
      sfx.hurt();
      return;
    }
    let vipUsed = false;
    if (from === 2 && next === 3 && typeof this.consumeExtractVipCard === 'function') {
      vipUsed = this.consumeExtractVipCard();
    }
    this.startExtractRaid({ floor: next, continueRun: true, vipUsed });
  },

  returnExtractToHub() {
    this.succeedExtractRaid();
  },

  endExtractToMenu() {
    this.closeExtractShop();
    this.persistExtract();
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
