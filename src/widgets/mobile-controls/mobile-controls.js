/**
 * Экранные джойстик, кнопки атаки/дэша/навыка и подсказка для клавиатуры.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/mobile-controls/mobile-controls.css">
 *   <script src="src/widgets/mobile-controls/mobile-controls.js"></script>
 *   <div id="mobile-controls-root"></div>   внутри #game-container
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
  <div id="joystick-zone" class="mobile-only">
    <div id="joystick-base"><div id="joystick-thumb"></div></div>
  </div>
  <div id="attack-zone" class="mobile-only">
    <div id="attack-btn">⚔</div>
    <div id="dash-btn">💨</div>
    <div id="skill-btn">☕</div>
  </div>
  <div id="desktop-hint">WASD — ход · ЛКМ/Пробел удерж. — заряд · Shift — дэш · F — обед · P — пауза</div>`;

  global.MobileControls = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
