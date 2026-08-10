/** Окно выбора апгрейда: сборка, реролл, применение. */

Object.assign(Game.prototype, {
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
  },

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
  },

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
  },

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
  },

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
  },
});
