/** Разовая привязка обработчиков к элементам страницы. */

Object.assign(Game.prototype, {
  bindUI() {
    this.buildMainMenuButtons();
    this.buildGameMenu();
    this.buildLevelUpPopup();
    if (typeof this.bindExtractHud === 'function') this.bindExtractHud();
    if (typeof this.bindExtractShop === 'function') this.bindExtractShop();
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
        if (this.gameMode === 'extract' && typeof this.uploadExtractBalanceLog === 'function') {
          this.uploadExtractBalanceLog();
        } else if (typeof this.uploadSaleBalanceLog === 'function') {
          this.uploadSaleBalanceLog();
        }
      };
    }
    document.getElementById('hub-tab-passives')?.addEventListener('click', () => this.setHubPrepTab('passives'));
    document.getElementById('hub-tab-weapons')?.addEventListener('click', () => this.setHubPrepTab('weapons'));
    document.getElementById('hub-back-main')?.addEventListener('click', () => this.openMainMenu());
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
  },
});
