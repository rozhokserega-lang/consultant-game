/** Отклик на настройки: музыка по контексту экрана и вибрация. */

Object.assign(Game.prototype, {
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
  },

  vibrate(ms = 30) {
    if (this.vibro && navigator.vibrate) navigator.vibrate(ms);
  },
});
