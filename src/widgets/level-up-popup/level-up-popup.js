/**
 * Level-up popup widget — выбор способностей при повышении уровня.
 *
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/level-up-popup/level-up-popup.css">
 *   <script src="src/widgets/level-up-popup/level-up-popup.js"></script>
 */
(function (global) {
  'use strict';

  /** @type {HTMLElement|null} */
  let overlayEl = null;
  /** @type {HTMLElement|null} */
  let cardsEl = null;
  /** @type {HTMLElement|null} */
  let titleEl = null;
  /** @type {Record<string, Function>} */
  let handlers = {};
  /** @type {HTMLButtonElement|null} */
  let rerollBtn = null;
  /** @type {HTMLElement|null} */
  let rerollCountEl = null;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /** @type {Record<string, string>} */
  const REROLL_ICON = '<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>';

  /**
   * @returns {SVGSVGElement}
   */
  function createRerollSvg() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'level-up-popup__svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = REROLL_ICON;
    return svg;
  }

  /**
   * @param {{ id: string, ariaLabel: string, onClick: () => void }} options
   * @returns {{ btn: HTMLButtonElement, countEl: HTMLSpanElement }}
   */
  function createActionButton(options) {
    const btn = UiButton.create({
      id: options.id,
      variant: 'ghost',
      size: 'sm',
      className: 'button--icon-only level-up-popup__action-btn',
      ariaLabel: options.ariaLabel,
      onClick: options.onClick,
    });

    const iconWrap = document.createElement('span');
    iconWrap.className = 'level-up-popup__action-icon';
    iconWrap.appendChild(createRerollSvg());

    const countEl = document.createElement('span');
    countEl.className = 'level-up-popup__action-count';
    countEl.textContent = '0';

    btn.appendChild(iconWrap);
    btn.appendChild(countEl);

    return { btn, countEl };
  }

  /**
   * @param {HTMLElement|null} el
   * @param {number} value
   * @param {boolean} active
   */
  function setActionCount(el, value, active) {
    if (!el) return;
    el.textContent = String(Math.max(0, value | 0));
    el.classList.toggle('level-up-popup__action-count--empty', value <= 0);
    el.classList.toggle('level-up-popup__action-count--active', !!active);
  }

  /**
   * @param {unknown} up
   * @returns {{ title: string, level: number|null, description: string, icon: string, isUpgrade: boolean }}
   */
  function formatChoice(up) {
    const choice = up || {};
    let title = String(choice.ttl || choice.title || '');
    let level = choice.level != null ? choice.level : null;
    let description = String(choice.desc || choice.description || '');
    let icon = String(choice.ico || choice.icon || '?');
    let isUpgrade = Boolean(choice.isUpgrade);

    const kind = choice.kind;

    if (kind === 'weapon_new') {
      isUpgrade = false;
      if (level == null) level = 1;
      title = title.replace(/\s*ур\.\d+.*/i, '').trim();
    } else if (kind === 'weapon_up' || kind === 'passive') {
      const match = title.match(/ур\.(\d+)/i);
      if (match) {
        level = Number(match[1]);
        title = title.replace(/\s*ур\.\d+.*/i, '').trim();
      }
      isUpgrade = level != null && level > 1;
    } else if (kind === 'overflow') {
      isUpgrade = true;
      const match = title.match(/·\s*(\d+)/);
      if (match) {
        level = Number(match[1]);
        title = title.replace(/\s*·\s*\d+.*/, '').trim();
      }
    } else if (kind === 'weapon_over') {
      isUpgrade = true;
      const match = title.match(/\+(\d+)/);
      if (match) level = Number(match[1]);
      title = title.replace(/\s*\+\d+.*/, '').trim();
    } else if (kind === 'evolve') {
      isUpgrade = true;
      title = title.replace(/^✨\s*/, '').trim();
    } else if (kind === 'heal') {
      isUpgrade = false;
      level = null;
    }

    if (!title) title = '?';

    return { title, level, description, icon, isUpgrade, evoReady: Boolean(choice.evoReady) };
  }

  /**
   * @param {{ title: string, level?: number|null, description?: string, icon?: string, isUpgrade?: boolean }} card
   * @param {number} index
   * @param {(index: number) => void} onClick
   * @returns {HTMLButtonElement}
   */
  function createCard(card, index, onClick) {
    const btn = document.createElement('button');
    btn.className = 'level-up-card' + (card.evoReady ? ' level-up-card--evo' : '');
    btn.type = 'button';
    btn.dataset.index = String(index);
    if (card.evoReady) {
      btn.title = card.evoName ? `Эволюция: ${card.evoName}` : 'Эволюция';
    }

    const iconWrap = document.createElement('span');
    iconWrap.className = 'level-up-card__icon';
    const iconInner = document.createElement('span');
    iconInner.className = 'level-up-card__icon-inner';
    iconInner.textContent = card.icon || '?';
    iconWrap.appendChild(iconInner);

    const body = document.createElement('span');
    body.className = 'level-up-card__body';

    const title = document.createElement('span');
    title.className = 'level-up-card__title';
    title.textContent = card.title;

    body.appendChild(title);

    if (card.level != null) {
      const level = document.createElement('span');
      level.className = 'level-up-card__level';
      level.textContent = `Ур. ${card.level}`;
      body.appendChild(level);
    }

    if (card.description) {
      const desc = document.createElement('span');
      desc.className = 'level-up-card__desc';
      desc.textContent = card.description;
      body.appendChild(desc);
    }

    const badge = document.createElement('span');
    badge.className = 'level-up-card__badge' + (card.isUpgrade || card.evoReady ? '' : ' level-up-card__badge--hidden');

    const arrow = document.createElement('span');
    arrow.className = 'level-up-card__badge-arrow';
    arrow.setAttribute('aria-hidden', 'true');

    const badgeText = document.createElement('span');
    badgeText.className = 'level-up-card__badge-text';
    badgeText.textContent = card.evoReady ? 'ЭВО' : 'UPGRADE';

    badge.appendChild(arrow);
    badge.appendChild(badgeText);

    btn.appendChild(iconWrap);
    btn.appendChild(body);
    btn.appendChild(badge);
    btn.addEventListener('click', () => onClick(index));

    return btn;
  }

  /**
   * @param {HTMLElement} root
   * @param {Record<string, Function>} h
   */
  function mount(root, h) {
    if (!root || typeof UiButton === 'undefined') return;

    handlers = h || {};
    root.innerHTML = '';
    root.className = 'level-up-popup';

    titleEl = document.createElement('div');
    titleEl.className = 'level-up-popup__header';

    const arrowLeft = document.createElement('span');
    arrowLeft.className = 'level-up-popup__header-arrow level-up-popup__header-arrow--left';
    arrowLeft.setAttribute('aria-hidden', 'true');

    const titleText = document.createElement('span');
    titleText.className = 'level-up-popup__header-title';
    titleText.id = 'level-up-title';

    const arrowRight = document.createElement('span');
    arrowRight.className = 'level-up-popup__header-arrow level-up-popup__header-arrow--right';
    arrowRight.setAttribute('aria-hidden', 'true');

    titleEl.appendChild(arrowLeft);
    titleEl.appendChild(titleText);
    titleEl.appendChild(arrowRight);

    cardsEl = document.createElement('div');
    cardsEl.className = 'level-up-popup__cards';
    cardsEl.id = 'upgrade-cards';

    const footer = document.createElement('div');
    footer.className = 'level-up-popup__footer';

    const reroll = createActionButton({
      id: 'btn-upgrade-reroll',
      ariaLabel: 'Другие варианты',
      onClick: () => handlers.onReroll?.(),
    });
    rerollBtn = reroll.btn;
    rerollCountEl = reroll.countEl;

    footer.appendChild(rerollBtn);

    root.appendChild(titleEl);
    root.appendChild(cardsEl);
    root.appendChild(footer);
  }

  /**
   * @param {HTMLElement} overlay
   * @param {Record<string, Function>} h
   */
  function init(overlay, h) {
    if (!overlay) return;
    overlayEl = overlay;
    overlayEl.classList.add('overlay', 'level-up-overlay');
    const root = document.createElement('div');
    root.id = 'level-up-root';
    overlayEl.innerHTML = '';
    overlayEl.appendChild(root);
    mount(root, h);
  }

  /**
   * @param {{ title?: string, cards?: unknown[], banishMode?: boolean, onPick?: (index: number) => void }} options
   */
  function open(options = {}) {
    if (!overlayEl || !cardsEl || !titleEl) return;

    const titleText = titleEl.querySelector('.level-up-popup__header-title');
    if (titleText) titleText.textContent = options.title || 'Уровень';

    cardsEl.innerHTML = '';
    cardsEl.classList.toggle('level-up-popup__cards--banish', !!options.banishMode);

    const onPick = typeof options.onPick === 'function'
      ? options.onPick
      : (index) => handlers.onPick?.(index);

    (options.cards || []).forEach((raw, index) => {
      const card = raw && raw.title ? raw : formatChoice(raw);
      cardsEl.appendChild(createCard(card, index, onPick));
    });

    overlayEl.classList.add('show');
  }

  function close() {
    overlayEl?.classList.remove('show');
  }

  /**
   * @param {{ rerollsLeft?: number, choosingUpgrade?: boolean }} state
   */
  function updateFooter(state = {}) {
    const {
      rerollsLeft = 0,
      choosingUpgrade = false,
    } = state;

    if (rerollBtn) {
      rerollBtn.disabled = rerollsLeft <= 0 || !choosingUpgrade;
      rerollBtn.style.display = choosingUpgrade ? '' : 'none';
      setActionCount(rerollCountEl, rerollsLeft, false);
      rerollBtn.title = rerollsLeft > 0
        ? `Другие варианты (${rerollsLeft})`
        : 'Рероллы закончились';
    }
  }

  /** @deprecated используйте updateFooter */
  function updateActions(state) {
    updateFooter(state);
  }

  const LevelUpPopup = {
    mount,
    init,
    open,
    close,
    updateFooter,
    updateActions,
    formatChoice,
  };

  global.LevelUpPopup = LevelUpPopup;
})(typeof window !== 'undefined' ? window : globalThis);
