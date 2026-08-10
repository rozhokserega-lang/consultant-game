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
      <p class="main-menu-sub">Выживи смену в торговом центре</p>
      <div class="actions-stack" id="main-menu-actions"></div>
    </div>`;

  global.MainMenu = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
