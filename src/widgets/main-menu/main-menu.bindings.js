/** Стартовый экран. */

const MAIN_MENU_HOME_SUB = 'Выживи смену в торговом центре';

const SALE_ARENA_MENU_NAMES = {
  sport: 'Спорттовары',
  food: 'Продукты',
  clothes: 'Одежда',
  tech: 'Техника',
};

Object.assign(Game.prototype, {
  buildMainMenuButtons() {
    const box = document.getElementById('main-menu-actions');
    if (!box || typeof UiButton === 'undefined') return;
    box.innerHTML = '';
    ['Распродажа', 'Вылазка', 'Подготовка', 'Гардероб', 'Настройки', 'Выход'].forEach((label, i) => {
      const actions = [
        () => this.openSaleStartFlow(),
        () => this.startExtractHub(),
        () => this.openBoosters(),
        () => this.openWardrobe(),
        () => this.openSettings(),
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
    this.showMainMenuHome();
    document.getElementById('main-menu-overlay').classList.add('show');
    this.refreshMusicState();
  },

  showMainMenuHome() {
    const sub = document.getElementById('main-menu-sub');
    if (sub) sub.textContent = MAIN_MENU_HOME_SUB;
    this.closeSaleStartDialog();
  },

  closeSaleStartDialog() {
    const dialog = document.getElementById('main-menu-setup');
    if (!dialog) return;
    dialog.classList.remove('show');
    dialog.setAttribute('aria-hidden', 'true');
    const grid = document.getElementById('main-menu-setup-grid');
    if (grid) grid.innerHTML = '';
    const back = document.getElementById('main-menu-setup-back');
    if (back) back.innerHTML = '';
  },

  openSaleStartDialog(title, hint, onBack) {
    const dialog = document.getElementById('main-menu-setup');
    const titleEl = document.getElementById('main-menu-setup-title');
    const hintEl = document.getElementById('main-menu-setup-hint');
    const grid = document.getElementById('main-menu-setup-grid');
    const back = document.getElementById('main-menu-setup-back');
    if (!dialog || !grid || !back) return null;
    if (titleEl) titleEl.textContent = title.toUpperCase();
    if (hintEl) hintEl.textContent = hint;
    grid.innerHTML = '';
    back.innerHTML = '';
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'sale-pick-back';
    backBtn.textContent = '← Назад';
    backBtn.onclick = onBack;
    back.appendChild(backBtn);
    dialog.classList.add('show');
    dialog.setAttribute('aria-hidden', 'false');
    return grid;
  },

  openSaleStartFlow() {
    if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
    this.openSaleHeroPick();
  },

  openSaleHeroPick() {
    if (typeof this.ensureSaleHeroUnlocks === 'function') this.ensureSaleHeroUnlocks();
    const grid = this.openSaleStartDialog(
      'Распродажа',
      'За кого играть? Герой задаёт старт и статы смены.',
      () => this.showMainMenuHome(),
    );
    if (!grid || typeof SALE_HEROES === 'undefined') return;

    const order = (typeof SALE_HERO_UNLOCK_ORDER !== 'undefined')
      ? SALE_HERO_UNLOCK_ORDER
      : Object.keys(SALE_HEROES);
    for (const id of order) {
      const hero = SALE_HEROES[id];
      if (!hero) continue;
      const unlocked = typeof this.isSaleHeroUnlocked !== 'function' || this.isSaleHeroUnlocked(id);
      grid.appendChild(this.createSaleStartCard({
        ico: hero.ico,
        title: hero.name,
        desc: hero.desc,
        action: !unlocked
          ? (hero.unlockHint || 'Закрыт')
          : (this.selectedHeroId === hero.id ? 'Выбран' : 'Выбрать'),
        selected: unlocked && this.selectedHeroId === hero.id,
        locked: !unlocked,
        onClick: () => this.pickSaleStartHero(hero.id),
      }));
    }
  },

  pickSaleStartHero(id) {
    this.selectedHeroId = id;
    this.persist();
    if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
    this.openSaleArenaPick();
  },

  openSaleArenaPick() {
    if (typeof this.ensureSaleArenaUnlocks === 'function') this.ensureSaleArenaUnlocks();
    const grid = this.openSaleStartDialog(
      'Распродажа',
      'Где смена? Карта зала распродажи.',
      () => this.openSaleHeroPick(),
    );
    if (!grid || typeof ARENA_THEMES === 'undefined') return;

    const order = (typeof SALE_ARENA_UNLOCK_ORDER !== 'undefined')
      ? SALE_ARENA_UNLOCK_ORDER
      : Object.keys(ARENA_THEMES);
    for (const id of order) {
      if (typeof this.isSaleArenaUnlocked === 'function' && !this.isSaleArenaUnlocked(id)) continue;
      const th = ARENA_THEMES[id];
      if (!th) continue;
      const name = SALE_ARENA_MENU_NAMES[th.id] || th.name;
      const run = (typeof SALE_ARENA_RUN !== 'undefined' && SALE_ARENA_RUN[th.id]) || null;
      const slots = run && run.weaponSlots
        ? run.weaponSlots
        : (typeof SALE_MAX_WEAPONS !== 'undefined' ? SALE_MAX_WEAPONS : 4);
      const slotWord = (slots >= 2 && slots <= 4) ? 'слота' : 'слотов';
      const desc = run && run.hpMul > 1
        ? `Сложнее · ${slots} ${slotWord} оружия`
        : `Арена распродажи · ${slots} ${slotWord} оружия`;
      grid.appendChild(this.createSaleStartCard({
        ico: th.ico,
        title: name,
        desc,
        action: this.selectedArena === th.id ? 'Выбрана' : 'Выбрать',
        selected: this.selectedArena === th.id,
        onClick: () => this.pickSaleStartArena(th.id),
      }));
    }
  },

  pickSaleStartArena(id) {
    this.selectedArena = id;
    this.persist();
    if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
    this.startGame();
  },

  createSaleStartCard({ ico, title, desc, action, selected, locked, onClick }) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'sale-pick-card' + (selected ? ' sel' : '') + (locked ? ' locked' : '');
    el.innerHTML = `<div class="sale-pick-card__body">`
      + `<div class="sale-pick-card__icon"><span class="sale-pick-card__icon-inner">${ico || '◆'}</span></div>`
      + `<div class="sale-pick-card__content">`
      + `<div class="sale-pick-card__name">${title || ''}</div>`
      + (desc ? `<div class="sale-pick-card__desc">${desc}</div>` : '')
      + `<div class="sale-pick-card__footer">`
      + `<span class="sale-pick-card__action">${action || ''}</span>`
      + `</div></div></div>`;
    if (locked) el.disabled = true;
    else el.onclick = onClick;
    return el;
  },
});
