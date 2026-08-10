/** Игровое меню паузы: сборка, открытие, обновление. */

Object.assign(Game.prototype, {
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
  },

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
  },

  closeGameMenu() {
    document.getElementById('game-menu-overlay').classList.remove('show');
    const root = document.getElementById('game-menu-root');
    if (root && typeof GameMenu !== 'undefined') GameMenu.showView(root, 'main');
    if (!this.gameOver && !this.won) this.paused = false;
    this.refreshMusicState();
    sfx.click();
  },

  refreshGameMenuUI() {
    const root = document.getElementById('game-menu-root');
    if (!root || typeof GameMenu === 'undefined') return;
    GameMenu.refreshToggles(root, {
      sound: sfx.enabled,
      music: music.enabled,
      vibro: this.vibro,
    });
  },

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
  },
});
