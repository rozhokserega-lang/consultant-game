/**
 * Хаб между забегами: усилители (пассивки и оружие), гардероб и книга жалоб.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/boosters-hub/boosters-hub.css">
 *   <link rel="stylesheet" href="src/widgets/equip-hub/equip-hub.css">
 *   <script src="src/widgets/boosters-hub/boosters-hub.js"></script>
 *   <div id="boosters-overlay"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="boosters-shell">
      <header class="hub-header">
        <div class="hub-header__row">
          <div class="hub-bank">
            <span class="hub-bank__coin" aria-hidden="true"></span>
            <b id="boosters-bank">0</b>
          </div>
          <h2 class="hub-header__title" id="hub-header-title">УСИЛИТЕЛИ</h2>
          <span class="hub-header__meta">
            <span id="hub-version" class="hub-version" title="Дев-панель">v?</span>
          </span>
        </div>
        <button type="button" class="hub-back-btn" id="hub-back-main">← НАЗАД</button>
      </header>

      <div class="hub-body hub-scroll">
        <div class="hub-pane on" id="hub-pane-prep">
          <div class="hub-shop-tabs">
            <button type="button" class="hub-shop-tab on" id="hub-tab-passives">ПАССИВКИ</button>
            <button type="button" class="hub-shop-tab" id="hub-tab-weapons">ОРУЖИЕ</button>
          </div>
          <div class="hub-shop-scroll">
            <div class="hub-shop-list on" id="hub-prep-passives"></div>
            <div class="hub-shop-list" id="hub-sale-weapons"></div>
          </div>
        </div>

        <div class="hub-pane" id="hub-pane-gear">
          <p id="hub-equip-hero" class="hub-hint hub-hint--accent"></p>
          <div id="hub-gear-mats" class="gear-mats-bar"></div>
          <div class="hub-grid" id="hub-equip-heroes"></div>
          <div class="gear-paperdoll-wrap">
            <div class="equip-doll" id="hub-equip-doll"></div>
            <div class="gear-detail-panel" id="hub-gear-detail"></div>
          </div>
          <p class="hub-hint">Материалы — с элит и боссов. KPI (+3 за босса) — для высоких тиров.</p>
        </div>

        <div class="hub-pane" id="hub-pane-book">
          <p class="book-total" id="book-total">Всего выписано жалоб: 0</p>
          <div class="book-list" id="hub-book"></div>
        </div>
      </div>

      <p class="hub-record" id="boosters-record-wrap">Рекорд: <b id="boosters-record">0</b></p>
    </div>`;

  global.BoostersHub = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
