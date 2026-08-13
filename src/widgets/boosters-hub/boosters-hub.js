/**
 * Хаб между забегами: подготовка к смене, гардероб и книга жалоб.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/boosters-hub/boosters-hub.css">
 *   <link rel="stylesheet" href="src/widgets/equip-hub/equip-hub.css">
 *   <script src="src/widgets/boosters-hub/boosters-hub.js"></script>
 *   <div id="boosters-overlay"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="panel boosters-panel">
      <h2>Подготовка</h2>
      <p>Банк: <b id="boosters-bank">0</b> 🪙 · Рекорд: <b id="boosters-record">0</b> · <span id="hub-version" title="Дев-панель">v?</span></p>
      <div class="hub-scroll">
        <div class="hub-pane on" id="hub-pane-prep">
          <div class="hub-tabs">
            <button type="button" class="hub-tab on" data-hub-tab="prep" id="hub-tab-prep">Смена</button>
            <button type="button" class="hub-tab" data-hub-tab="gear" id="hub-tab-gear">Гардероб</button>
            <button type="button" class="hub-tab" data-hub-tab="book" id="hub-tab-book">Жалобы</button>
          </div>

          <div id="hub-sale-loadout">
            <div class="hub-sec">Консультант</div>
            <p class="hub-hint">Герой задаёт старт и статы смены.</p>
            <div class="hub-grid" id="hub-sale-heroes"></div>

            <div class="hub-sec">Арена</div>
            <p class="hub-hint">Карта зала распродажи.</p>
            <div class="hub-grid" id="hub-sale-arenas"></div>

            <div class="hub-sec">Ассортимент оружия</div>
            <p class="hub-hint">Покупка открывает оружие в пуле левел-апа (не кладёт в руки). Макс. 4 в забеге. Подсветка — ветка эво при ключе.</p>
            <div class="hub-grid" id="hub-sale-weapons"></div>

            <div class="hub-sec">Стартовые пассивки</div>
            <p class="hub-hint">Бонусы к началу смены за монеты банка. Часть — ключи эволюций.</p>
            <div class="perk-row" id="hub-sale-passives"></div>

            <div class="hub-sec">Мета-перки</div>
            <p class="hub-hint">Постоянные бонусы между сменами.</p>
            <div class="hub-grid" id="boosters-meta"></div>
            <div class="hub-grid" id="boosters-abilities" style="display:none"></div>
          </div>
        </div>

        <div class="hub-pane" id="hub-pane-gear">
          <div class="hub-sec">Гардероб консультанта</div>
          <p class="hub-hint">Бейдж, карта, рация — мета между забегами. Только экономика: XP, стартовые монеты, магнит.</p>
          <p id="hub-equip-hero" class="hub-hint hub-hint--accent"></p>
          <div id="hub-gear-mats" class="gear-mats-bar"></div>
          <div class="hub-grid" id="hub-equip-heroes" style="margin-bottom:8px;"></div>
          <div class="gear-paperdoll-wrap">
            <div class="equip-doll" id="hub-equip-doll"></div>
            <div class="gear-detail-panel" id="hub-gear-detail"></div>
          </div>
          <p class="hub-hint">Материалы — с элит и боссов. KPI (+3 за босса) — для высоких тиров.</p>
        </div>

        <div class="hub-pane" id="hub-pane-book">
          <button type="button" class="hub-back" id="hub-back-modes-book">← К смене</button>
          <div class="hub-sec">Книга жалоб</div>
          <p class="book-total" id="book-total">Всего выписано жалоб: 0</p>
          <div class="book-list" id="hub-book"></div>
        </div>
      </div>
      <div class="boosters-footer">
        <div class="actions-stack" id="boosters-back-wrap"></div>
      </div>
    </div>`;

  global.BoostersHub = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
