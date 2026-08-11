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
      <h2>⚡ Усилители</h2>
      <p>Банк: <b id="boosters-bank">0</b> 🪙 · Рекорд: <b id="boosters-record">0</b> · <span id="hub-version" title="Дев-панель">v?</span></p>
      <div class="hub-scroll">
        <div class="hub-pane on" id="hub-pane-prep">
          <div class="hub-tabs">
            <button type="button" class="hub-tab on" data-hub-tab="prep" id="hub-tab-prep">Подготовка · Распродажа</button>
            <button type="button" class="hub-tab" data-hub-tab="gear" id="hub-tab-gear">👕 Гардероб</button>
            <button type="button" class="hub-tab" data-hub-tab="book" id="hub-tab-book">📖 Книга жалоб</button>
          </div>

          <div class="hub-sec">Мета-перки</div>
          <p style="font-size:11px;color:#aaa;margin:0 0 6px;">Постоянные бонусы между сменами.</p>
          <div class="hub-grid" id="boosters-meta"></div>
          <div class="hub-grid" id="boosters-abilities" style="display:none"></div>
          <!-- способности (дэш / обед / сильный удар) скрыты — в Распродаже не используются -->

          <div id="hub-sale-loadout">
            <div class="hub-sec">Консультант</div>
            <p style="font-size:11px;color:#aaa;text-align:left;margin:0 0 6px;">Выбери героя — у каждого свой старт.</p>
            <div class="hub-grid" id="hub-sale-heroes"></div>
            <div class="hub-sec">Этаж ТЦ</div>
            <p style="font-size:11px;color:#aaa;text-align:left;margin:0 0 6px;">Ранний пул оружия и бонус этажа. Полный каталог откроется позже в забеге.</p>
            <div class="hub-grid" id="hub-sale-floors"></div>
            <div class="hub-sec">Контракт смены</div>
            <p style="font-size:11px;color:#aaa;text-align:left;margin:0 0 6px;">Ограничения забега за множитель монет в банк.</p>
            <div class="hub-grid" id="hub-sale-contracts"></div>
            <div class="hub-sec">Ассортимент оружия</div>
            <p style="font-size:11px;color:#aaa;text-align:left;margin:0 0 6px;">Покупка открывает оружие в пуле левел-апа (не кладёт в руки). В забеге макс. 4 оружия (контракт может снизить). Старт — оружие героя. Подсветка — откроет ветку эво при ключе.</p>
            <div class="hub-grid" id="hub-sale-weapons"></div>
            <div class="hub-sec">Стартовые пассивки</div>
            <p style="font-size:11px;color:#aaa;text-align:left;margin:0 0 6px;">Постоянные бонусы к началу забега (за монеты банка).</p>
            <div class="perk-row" id="hub-sale-passives"></div>
            <div class="hub-sec">Зона ТЦ (арена)</div>
            <div class="hub-grid" id="hub-sale-arenas"></div>
          </div>
        </div>

        <div class="hub-pane" id="hub-pane-gear">
          <div class="hub-sec">Гардероб консультанта</div>
          <p style="font-size:11px;color:#aaa;margin:0 0 6px;">Бейдж, карта, рация — мета между забегами. Только экономика: XP, стартовые монеты, магнит. Без урона и КД.</p>
          <p id="hub-equip-hero" style="font-size:12px;color:#f1c40f;margin:0 0 4px;"></p>
          <div id="hub-gear-mats" class="gear-mats-bar"></div>
          <div class="hub-grid" id="hub-equip-heroes" style="margin-bottom:8px;"></div>
          <div class="gear-paperdoll-wrap">
            <div class="equip-doll" id="hub-equip-doll"></div>
            <div class="gear-detail-panel" id="hub-gear-detail"></div>
          </div>
          <p style="font-size:11px;color:#aaa;margin:8px 0 0;">Материалы — с элит и боссов. KPI (+3 за босса) — для высоких тиров.</p>
        </div>

        <div class="hub-pane" id="hub-pane-book">
          <button type="button" class="hub-back" id="hub-back-modes-book">← К подготовке</button>
          <div class="hub-sec">📖 Книга жалоб</div>
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
