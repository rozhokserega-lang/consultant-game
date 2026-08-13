/** Окно настроек. */

Object.assign(Game.prototype, {
  openSettings() {
    this.closeSettingsResetConfirm();
    this.refreshSettingsUI();
    document.getElementById('settings-overlay').classList.add('show');
    if (!this.gameOver && !this.won) this.paused = true;
    document.getElementById('game-menu-overlay')?.classList.remove('show');
    this.refreshPauseUI();
    this.refreshMusicState();
  },

  closeSettings() {
    this.closeSettingsResetConfirm();
    document.getElementById('settings-overlay').classList.remove('show');
    if (this.inMainMenu) {
      this.paused = true;
      document.getElementById('main-menu-overlay').classList.add('show');
      this.refreshPauseUI();
      this.refreshMusicState();
      return;
    }
    if (this.isBoostersOpen()) {
      this.paused = true;
      this.refreshPauseUI();
      this.refreshMusicState();
      return;
    }
    if (!this.gameOver && !this.won) {
      this.paused = false;
    }
    this.refreshPauseUI();
    this.refreshMusicState();
  },

  refreshSettingsUI() {
    const setLabel = (id, text) => UiButton.setText(document.getElementById(id), text);
    setLabel('tog-sound', sfx.enabled ? '🔊 Звук: ВКЛ' : '🔇 Звук: ВЫКЛ');
    setLabel('tog-music', music.enabled ? '🎵 Музыка: ВКЛ' : '🔕 Музыка: ВЫКЛ');
    setLabel('tog-vibro', this.vibro ? '📳 Вибрация: ВКЛ' : '📳 Вибрация: ВЫКЛ');
    setLabel('tog-dmgnum', this.showDmgNumbers ? '🔢 Цифры урона: ВКЛ' : '🔢 Цифры урона: ВЫКЛ');
    setLabel('tog-lite', this.liteGfx ? '🌡 Облегчённый режим: ВКЛ' : '🌡 Облегчённый режим: ВЫКЛ');
    document.getElementById('set-record').textContent = this.highScore;
    const bankEl = document.getElementById('set-bank');
    if (bankEl) bankEl.textContent = this.bankCoins;
  },

  closeSettingsResetConfirm() {
    const el = document.getElementById('settings-reset-confirm');
    if (el) el.hidden = true;
  },

  openSettingsResetConfirm() {
    const el = document.getElementById('settings-reset-confirm');
    if (!el) return;
    el.hidden = false;
    sfx.click();
  },

  confirmSettingsReset() {
    this.closeSettingsResetConfirm();
    if (typeof this.resetAllProgression === 'function') this.resetAllProgression();
    this.refreshSettingsUI();
    if (typeof sfx !== 'undefined' && sfx.hurt) sfx.hurt();
  },

  bindSettingsResetConfirm() {
    const actions = document.getElementById('settings-reset-confirm-actions');
    if (!actions || actions._bound) return;
    actions._bound = true;
    if (typeof UiButton === 'undefined') return;
    actions.appendChild(UiButton.create({
      text: 'Сбросить всё',
      variant: 'danger',
      size: 'md',
      full: true,
      onClick: () => this.confirmSettingsReset(),
    }));
    actions.appendChild(UiButton.create({
      text: 'Отмена',
      variant: 'menu',
      size: 'md',
      full: true,
      onClick: () => this.closeSettingsResetConfirm(),
    }));
  },
});
