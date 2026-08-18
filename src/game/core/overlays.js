/** Закрытие всех модальных экранов разом. */

Object.assign(Game.prototype, {
  hideOverlays() {
    ['upgrade-overlay','sale-tree-overlay','game-menu-overlay','settings-overlay','end-overlay','main-menu-overlay','boosters-overlay','extract-shop-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
    const gameMenuRoot = document.getElementById('game-menu-root');
    if (gameMenuRoot && typeof GameMenu !== 'undefined') GameMenu.showView(gameMenuRoot, 'main');
    this.choosingUpgrade = false;
    this.shopping = false;
    if (typeof this.closeSettingsResetConfirm === 'function') this.closeSettingsResetConfirm();
    if (typeof this.updateUpgradeRerollBtn === 'function') this.updateUpgradeRerollBtn();
  },
});
