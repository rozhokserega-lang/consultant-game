/**
 * Попап настроек: звук, облегчённый режим, сброс прогресса.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/settings-popup/settings-popup.css">
 *   <script src="src/widgets/settings-popup/settings-popup.js"></script>
 *   <div class="overlay" id="settings-overlay"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="panel settings-popup">
      <h2>⚙️ Настройки</h2>
      <div class="settings-popup__actions">
        <button class="button button--ghost button--sm button--full" id="tog-sound" type="button">
          <span class="button__label">🔊 Звук: ВКЛ</span>
        </button>
        <button class="button button--ghost button--sm button--full" id="tog-music" type="button">
          <span class="button__label">🎵 Музыка: ВКЛ</span>
        </button>
        <button class="button button--ghost button--sm button--full" id="tog-vibro" type="button">
          <span class="button__label">📳 Вибрация: ВКЛ</span>
        </button>
        <button class="button button--ghost button--sm button--full" id="tog-dmgnum" type="button">
          <span class="button__label">🔢 Цифры урона: ВКЛ</span>
        </button>
        <button class="button button--ghost button--sm button--full" id="tog-lite" type="button">
          <span class="button__label">🌡 Облегчённый режим: ВЫКЛ</span>
        </button>
        <button class="button button--danger button--sm button--full" id="btn-settings-reset" type="button">
          <span class="button__label">Полный сброс прогресса</span>
        </button>
        <button class="button button--accent button--sm button--full" id="btn-settings-close" type="button">
          <span class="button__label">Закрыть</span>
        </button>
      </div>
      <p class="settings-popup__stats">Рекорд: <b id="set-record">0</b> · Банк: <b id="set-bank">0</b></p>
    </div>
    <div id="settings-reset-confirm" class="settings-reset-confirm" hidden>
      <div class="panel settings-reset-confirm-card">
        <p class="settings-reset-confirm-text">Сбросить всю прогрессию? Монеты, открытия, вылазка и гардероб обнулятся. Настройки звука и облегчённый режим останутся.</p>
        <div class="settings-reset-confirm-actions" id="settings-reset-confirm-actions"></div>
      </div>
    </div>`;

  global.SettingsPopup = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
