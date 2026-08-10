/**
 * Боевая полоса: уровень, XP, монеты, таймер смены и кнопки паузы/меню.
 * Подключение:
 *   <link rel="stylesheet" href="src/shared/ui/battle-bar/battle-bar.css">
 *   <script src="src/shared/ui/battle-bar/battle-bar.js"></script>
 *   <header id="battle-bar" class="battle-bar" aria-label="Статус боя"></header>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
  <div class="battle-bar__xp-row" aria-hidden="true">
    <span class="battle-bar__xp-level" id="battle-xp-level">★1</span>
    <div class="battle-bar__xp-track" aria-hidden="true">
      <div class="battle-bar__xp-fill" id="battle-xp-fill"></div>
    </div>
  </div>
  <div class="battle-bar__inner">
    <div class="battle-bar__coins battle-bar__panel">
      <div class="battle-bar__coin-icon" aria-hidden="true"></div>
      <div class="battle-bar__coins-text">
        <span class="battle-bar__label">МОНЕТЫ:</span>
        <span class="battle-bar__value battle-bar__value--coins" id="battle-coins">0</span>
      </div>
    </div>
    <div class="battle-bar__timer battle-bar__panel">
      <span class="battle-bar__label">ВРЕМЯ ИГРЫ:</span>
      <span class="battle-bar__value battle-bar__value--time" id="battle-time">00:00</span>
    </div>
    <div class="battle-bar__actions">
      <button class="battle-bar__btn" id="btn-battle-pause" type="button" title="Пауза" aria-label="Пауза">
        <span class="battle-bar__pause-icon" aria-hidden="true"></span>
      </button>
      <button class="battle-bar__btn" id="btn-battle-menu" type="button" title="Меню" aria-label="Меню">
        <span class="battle-bar__gear-icon" aria-hidden="true"></span>
      </button>
    </div>
  </div>`;

  global.BattleBar = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
