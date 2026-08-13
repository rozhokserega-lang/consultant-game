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
    ['Распродажа', 'Вылазка', 'Подготовка', 'Гардероб', 'Выход'].forEach((label, i) => {
      const actions = [
        () => this.openSaleStartFlow(),
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
    if (titleEl) titleEl.textContent = title;
    if (hintEl) hintEl.textContent = hint;
    grid.innerHTML = '';
    back.innerHTML = '';
    back.appendChild(UiButton.create({
      text: '← Назад',
      variant: 'menu',
      size: 'md',
      full: true,
      onClick: onBack,
    }));
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
      if (typeof this.isSaleHeroUnlocked === 'function' && !this.isSaleHeroUnlocked(id)) continue;
      const hero = SALE_HEROES[id];
      if (!hero) continue;
      grid.appendChild(this.createSaleStartCard({
        title: `${hero.ico} ${hero.name}`,
        desc: hero.desc,
        meta: this.selectedHeroId === hero.id ? 'Выбран' : 'Выбрать',
        selected: this.selectedHeroId === hero.id,
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
      grid.appendChild(this.createSaleStartCard({
        title: `${th.ico} ${name}`,
        desc: 'Арена распродажи',
        meta: this.selectedArena === th.id ? 'Выбрана' : 'Выбрать',
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

  createSaleStartCard({ title, desc, meta, selected, onClick }) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hub-card' + (selected ? ' sel' : '');
    el.innerHTML = `<div class="ttl">${title}</div>`
      + (desc ? `<div class="desc">${desc}</div>` : '')
      + (meta ? `<div class="meta">${meta}</div>` : '');
    el.onclick = onClick;
    return el;
  },
});
