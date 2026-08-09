/**
 * Game menu widget — in-game pause popup.
 * Подключение:
 *   <link rel="stylesheet" href="widgets/game-menu/game-menu.css">
 *   <script src="widgets/game-menu/game-menu.js"></script>
 */
(function (global) {
  'use strict';

  const TOGGLES = [
    { id: 'sound', label: 'ЗВУК', iconClass: 'game-menu__icon-sound' },
    { id: 'music', label: 'МУЗЫКА', iconClass: 'game-menu__icon-music' },
    { id: 'vibro', label: 'ВИБРО', iconClass: 'game-menu__icon-vibro' },
  ];

  const ACTIONS = [
    { id: 'resume', text: 'Продолжить', variant: 'primary' },
    { id: 'restart', text: 'Начать сначала', variant: 'primary' },
    { id: 'abilities', text: 'Способности', variant: 'primary' },
    { id: 'exit', text: 'Выйти в меню', variant: 'primary' },
  ];

  /**
   * @param {HTMLElement} root
   * @param {Record<string, Function>} handlers
   */
  function mount(root, handlers) {
    if (!root || typeof UiButton === 'undefined') return;

    root.innerHTML = '';
    root.className = 'game-menu';

    const mainView = document.createElement('div');
    mainView.className = 'game-menu__view game-menu__view--active';
    mainView.dataset.view = 'main';

    const actions = document.createElement('div');
    actions.className = 'game-menu__actions';

    ACTIONS.forEach(({ id, text, variant }) => {
      actions.appendChild(UiButton.create({
        id: `game-menu-${id}`,
        text,
        variant,
        size: 'md',
        full: true,
        onClick: () => handlers[id]?.(),
      }));
    });

    const toggles = document.createElement('div');
    toggles.className = 'game-menu__toggles';

    TOGGLES.forEach(({ id, label, iconClass }) => {
      const wrap = document.createElement('div');
      wrap.className = 'game-menu__toggle';
      wrap.id = `game-menu-toggle-${id}`;

      const lbl = document.createElement('span');
      lbl.className = 'game-menu__toggle-label';
      lbl.textContent = label;

      const icon = document.createElement('span');
      icon.className = `game-menu__toggle-icon ${iconClass}`;
      icon.setAttribute('aria-hidden', 'true');

      const btn = UiButton.create({
        id: `game-menu-tog-${id}`,
        variant: 'ghost',
        size: 'sm',
        className: 'button--icon-only',
        ariaLabel: label,
        onClick: () => handlers[`toggle${id.charAt(0).toUpperCase()}${id.slice(1)}`]?.(),
      });
      btn.appendChild(icon);

      wrap.appendChild(lbl);
      wrap.appendChild(btn);
      toggles.appendChild(wrap);
    });

    mainView.appendChild(actions);
    mainView.appendChild(toggles);

    const abilitiesView = document.createElement('div');
    abilitiesView.className = 'game-menu__view';
    abilitiesView.dataset.view = 'abilities';

    const loadout = document.createElement('div');
    loadout.className = 'game-menu__loadout';
    loadout.id = 'game-menu-loadout';

    abilitiesView.appendChild(loadout);
    abilitiesView.appendChild(UiButton.create({
      id: 'game-menu-back',
      text: '← Назад',
      variant: 'ghost',
      size: 'md',
      full: true,
      onClick: () => showView(root, 'main'),
    }));

    root.appendChild(mainView);
    root.appendChild(abilitiesView);
  }

  /**
   * @param {HTMLElement} root
   * @param {'main'|'abilities'} view
   */
  function showView(root, view) {
    root.querySelectorAll('.game-menu__view').forEach((el) => {
      el.classList.toggle('game-menu__view--active', el.dataset.view === view);
    });
  }

  /**
   * @param {HTMLElement} root
   * @param {{ sound?: boolean, music?: boolean, vibro?: boolean }} state
   */
  function refreshToggles(root, state) {
    const map = {
      sound: state.sound !== false,
      music: state.music !== false,
      vibro: state.vibro !== false,
    };

    Object.entries(map).forEach(([id, on]) => {
      const wrap = root.querySelector(`#game-menu-toggle-${id}`);
      if (wrap) wrap.classList.toggle('game-menu__toggle--off', !on);
    });
  }

  const GameMenu = {
    mount,
    showView,
    refreshToggles,
  };

  global.GameMenu = GameMenu;
})(typeof window !== 'undefined' ? window : globalThis);
