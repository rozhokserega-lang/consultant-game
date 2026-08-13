/**
 * Главное меню: заголовок и стек кнопок (кнопки собирает main-menu.bindings.js).
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/main-menu/main-menu.css">
 *   <script src="src/widgets/main-menu/main-menu.js"></script>
 *   <div id="main-menu-overlay"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="main-menu-panel">
      <h1 class="main-menu-title">🛒 Распродажа</h1>
      <p class="main-menu-sub" id="main-menu-sub">Выживи смену в торговом центре</p>
      <div class="actions-stack" id="main-menu-actions"></div>
    </div>
    <div class="main-menu-dialog" id="main-menu-setup" aria-hidden="true">
      <div class="sale-pick-shell">
        <header class="sale-pick-header">
          <h2 class="sale-pick-title" id="main-menu-setup-title">Распродажа</h2>
        </header>
        <div class="sale-pick-toolbar">
          <div id="main-menu-setup-back"></div>
          <p class="sale-pick-hint" id="main-menu-setup-hint">За кого играть?</p>
        </div>
        <div class="sale-pick-scroll">
          <div class="sale-pick-list" id="main-menu-setup-grid"></div>
        </div>
      </div>
    </div>`;

  global.MainMenu = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
