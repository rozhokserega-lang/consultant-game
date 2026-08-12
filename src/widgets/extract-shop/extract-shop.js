/**
 * Вылазка: общий оверлей панелей NPC (Игорь / Маша / Семён).
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/extract-shop/extract-shop.css">
 *   <script src="src/widgets/extract-shop/extract-shop.js"></script>
 *   <div id="extract-shop-overlay"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="panel extract-shop-panel" id="extract-shop-panel">
      <h2 id="extract-shop-title">Панель</h2>
      <p class="extract-shop-meta" id="extract-shop-meta"></p>
      <div id="extract-shop-list" class="extract-shop-list"></div>
      <div id="extract-shop-extra" class="extract-shop-extra"></div>
      <div id="extract-shop-close-wrap" class="extract-shop-close-wrap"></div>
    </div>
    <div id="extract-confirm" class="extract-confirm" hidden>
      <div class="extract-confirm-card panel">
        <p id="extract-confirm-text" class="extract-confirm-text">Подтвердить?</p>
        <div class="extract-confirm-actions" id="extract-confirm-actions"></div>
      </div>
    </div>
  `;

  global.ExtractShop = {
    mount(root) {
      root.className = 'overlay extract-shop-overlay';
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
