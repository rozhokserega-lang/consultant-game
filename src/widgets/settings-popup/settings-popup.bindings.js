/** Окно настроек. */

Object.assign(Game.prototype, {
  openSettings() {
    this.refreshSettingsUI();
    document.getElementById('settings-overlay').classList.add('show');
    if (!this.gameOver && !this.won) this.paused = true;
    document.getElementById('game-menu-overlay')?.classList.remove('show');
    this.refreshMusicState();
  },

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
  },

  refreshSettingsUI() {
    const setLabel = (id, text) => UiButton.setText(document.getElementById(id), text);
    setLabel('tog-sound', sfx.enabled ? '🔊 Звук: ВКЛ' : '🔇 Звук: ВЫКЛ');
    setLabel('tog-music', music.enabled ? '🎵 Музыка: ВКЛ' : '🔕 Музыка: ВЫКЛ');
    setLabel('tog-vibro', this.vibro ? '📳 Вибрация: ВКЛ' : '📳 Вибрация: ВЫКЛ');
    setLabel('tog-dmgnum', this.showDmgNumbers ? '🔢 Цифры урона: ВКЛ' : '🔢 Цифры урона: ВЫКЛ');
    document.getElementById('set-record').textContent = this.highScore;
    const bankEl = document.getElementById('set-bank');
    if (bankEl) bankEl.textContent = this.bankCoins;
  },
});
