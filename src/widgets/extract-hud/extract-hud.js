/**
 * Вылазка: HUD рюкзака и крупная кнопка «Взаимодействовать» для сенсора.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/extract-hud/extract-hud.css">
 *   <script src="src/widgets/extract-hud/extract-hud.js"></script>
 *   <div id="extract-hud"></div>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
    <div class="extract-hud-inner">
      <div class="extract-hud-top">
        <span id="extract-hud-phase">Парковка</span>
        <span id="extract-hud-hp" class="extract-hud-hp" style="display:none"></span>
        <span id="extract-hud-heat" class="extract-hud-heat" style="display:none"></span>
        <span id="extract-hud-upg" class="extract-hud-upg" style="display:none"></span>
        <span id="extract-hud-evac" class="extract-hud-evac" style="display:none"></span>
        <span class="extract-hud-coins">🪙 <b id="extract-hud-coins">0</b></span>
        <span class="extract-hud-total" title="Суммарный вынесенный лут">📦 <b id="extract-hud-total">0</b></span>
      </div>
      <div class="extract-hud-slots" id="extract-hud-slots"></div>
    </div>
    <button type="button" id="extract-interact-btn" class="extract-interact-btn" aria-label="Взаимодействовать">
      <span class="extract-interact-ico">👆</span>
      <span class="extract-interact-label">Взаимодействовать</span>
      <span class="extract-interact-hint" id="extract-interact-hint"></span>
    </button>
  `;

  global.ExtractHud = {
    mount(root) {
      root.innerHTML = TEMPLATE;
      root.classList.remove('show');
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
