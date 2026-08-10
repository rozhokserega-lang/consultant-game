/**
 * Экран конца смены: итоги забега, выгрузка балансных логов, рестарт.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/end-popup/end-popup.css">
 *   <script src="src/widgets/end-popup/end-popup.js"></script>
 *   <div class="overlay end-overlay" id="end-overlay"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="end-popup" id="end-popup">
      <div class="end-popup__header">
        <span class="end-popup__header-arrow end-popup__header-arrow--left" aria-hidden="true"></span>
        <h2 class="end-popup__title" id="end-title">ВАС РАСТОПТАЛИ</h2>
        <span class="end-popup__header-arrow end-popup__header-arrow--right" aria-hidden="true"></span>
      </div>
      <div class="end-popup__art" id="end-art" aria-hidden="true">
        <svg class="end-popup__cart" viewBox="0 0 96 72" width="96" height="72" role="img" aria-label="">
          <rect x="8" y="52" width="80" height="6" fill="#5a6470" opacity="0.35"/>
          <rect x="14" y="18" width="52" height="34" fill="#8a94a4"/>
          <rect x="14" y="18" width="52" height="4" fill="#a8b0bc"/>
          <rect x="14" y="48" width="52" height="4" fill="#6a7484"/>
          <rect x="18" y="22" width="44" height="22" fill="#c8d4e0"/>
          <rect x="20" y="24" width="40" height="18" fill="#1a2430"/>
          <rect x="28" y="30" width="4" height="4" fill="#ffffff"/>
          <rect x="44" y="30" width="4" height="4" fill="#ffffff"/>
          <rect x="30" y="38" width="20" height="2" fill="#ffffff"/>
          <rect x="66" y="22" width="10" height="26" fill="#7a8494"/>
          <rect x="66" y="22" width="10" height="3" fill="#98a4b4"/>
          <rect x="20" y="52" width="4" height="10" fill="#4a5464"/>
          <rect x="56" y="52" width="4" height="10" fill="#4a5464"/>
          <rect x="18" y="60" width="8" height="4" fill="#3a4454"/>
          <rect x="54" y="60" width="8" height="4" fill="#3a4454"/>
        </svg>
      </div>
      <div class="end-popup__stats">
        <div class="end-popup__stat">ВРЕМЯ: <span id="end-time">00:00</span></div>
        <div class="end-popup__stat">ВОЛНА: <span id="end-wave">1</span> ур.</div>
        <div class="end-popup__stat">РЕКОРД ВОЛНЫ: <span id="end-wave-record">0</span> ур.</div>
        <div class="end-popup__stat">МОНЕТ В БАНК: <span id="end-bank">0</span></div>
      </div>
      <p id="end-sub" class="end-popup__legacy"></p>
      <div id="end-score" class="end-popup__legacy">0</div>
      <div id="end-combo" class="end-popup__legacy">0</div>
      <div id="end-record" class="end-popup__legacy">0</div>
      <span id="end-newrec" class="end-popup__legacy" style="display:none;">★ НОВЫЙ РЕКОРД!</span>
      <div id="end-challenge-line" class="end-popup__legacy"></div>
      <div id="end-balance-upload" class="end-popup__upload" style="display:none;">
        <button class="button button--success button--sm button--full" id="btn-upload-balance" type="button">
          <span class="button__label">☁ Выгрузить логи</span>
        </button>
        <div class="end-popup__upload-status" id="end-balance-status"></div>
      </div>
      <div class="end-popup__actions">
        <button class="button button--success button--full" id="btn-retry" type="button">
          <span class="button__label">Попробовать ещё раз</span>
        </button>
        <button class="button button--secondary button--full" id="btn-again" type="button">
          <span class="button__label">В меню</span>
        </button>
      </div>
    </div>`;

  global.EndPopup = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
