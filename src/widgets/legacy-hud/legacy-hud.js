/**
 * Старый HUD режима «Смена»: HP, XP, счёт, волна и кнопки скорости.
 * Живёт только ради выключенного режима — новый бой рисует battle-bar.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/legacy-hud/legacy-hud.css">
 *   <script src="src/widgets/legacy-hud/legacy-hud.js"></script>
 *   <header id="hud" aria-hidden="true"></header>
 */
(function (global) {
  'use strict';

  const TEMPLATE = `
  <div class="hud-main">
    <div>
      <span style="font-size:15px;">⭐<b id="hud-level">1</b></span>
      <div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:11px;">❤️</span>
          <div class="hud-hp-bar"><div class="hud-hp-fill" id="hud-hp-fill" style="width:100%"></div></div>
          <span class="hud-value" id="hud-hp-text">5/5</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
          <span class="hud-label">XP</span>
          <div class="hud-xp-bar"><div class="hud-xp-fill" id="hud-xp-fill" style="width:0%"></div></div>
          <span class="hud-label" id="hud-xp-text">0/10</span>
        </div>
      </div>
    </div>

    <div class="hud-mid">
      <div class="hud-mid-top">
        <span id="hud-score">🔨 0</span>
        <span class="coin-pill" id="hud-coins">🪙 0</span>
        <span class="hud-combo-slot" id="hud-combo">🔥 x0</span>
      </div>
      <span class="hud-mode chase" id="hud-mode">🔴 ПИК 8.0с</span>
      <div class="hud-meters">
        <span>☕ <span class="meter skill"><i id="hud-skill-fill"></i></span></span>
        <span>⚡ <span class="meter charge"><i id="hud-charge-fill"></i></span></span>
      </div>
    </div>

    <div style="justify-content:flex-end;">
      <button class="hud-btn" id="btn-speed" type="button" title="Скорость игры">▶ ×1</button>
      <button class="hud-btn" id="btn-pause" type="button" title="Пауза">⏸</button>
      <button class="hud-btn" id="btn-settings" type="button" title="Настройки">⚙️</button>
    </div>
  </div>
  <div class="hud-sub">
    <div class="hud-sub-left">
      <span class="hud-wave-line" id="hud-wave">🌊 Волна 1/10</span>
      <span class="hud-enemies-line" id="hud-enemies">Убито: 0/30</span>
    </div>
  </div>`;

  global.LegacyHud = {
    /** @param {HTMLElement} root */
    mount(root) {
      root.innerHTML = TEMPLATE;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
