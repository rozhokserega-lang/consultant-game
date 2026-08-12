/** Стартовый экран. */

Object.assign(Game.prototype, {
  buildMainMenuButtons() {
    const box = document.getElementById('main-menu-actions');
    if (!box || typeof UiButton === 'undefined') return;
    box.innerHTML = '';
    ['Играть', 'Вылазка', 'Усилители', 'Гардероб', 'Выход'].forEach((label, i) => {
      const actions = [
        () => this.startGame(),
        () => this.startExtractHub(),
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
  },

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
    this.extractPhase = null;
    document.body.classList.remove('sale-mode', 'hub-mode', 'extract-mode');
    document.body.classList.add('main-menu-mode');
    const extractHud = document.getElementById('extract-hud');
    if (extractHud) extractHud.classList.remove('show');
    this.prepareIdleWorld();
    document.getElementById('main-menu-overlay').classList.add('show');
    this.refreshMusicState();
  },
});
