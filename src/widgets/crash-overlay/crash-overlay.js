/**
 * Экран необработанной ошибки — последнее, что видит игрок при падении.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/crash-overlay/crash-overlay.css">
 *   <script src="src/widgets/crash-overlay/crash-overlay.js"></script>
 *   <div id="crash-overlay" aria-hidden="true"></div>
 */

const CRASH_OVERLAY_TEMPLATE = `
  <div class="crash-box">
    <h3 id="crash-overlay-msg">Ошибка</h3>
    <pre id="crash-overlay-sub"></pre>
    <button type="button" class="button button--sm" id="crash-reload-btn">
      <span class="button__label">Перезагрузить</span>
    </button>
  </div>`;

const CrashOverlay = {
  /** @param {HTMLElement} root */
  mount(root) {
    root.innerHTML = CRASH_OVERLAY_TEMPLATE;
    root.querySelector('#crash-reload-btn').addEventListener('click', () => location.reload());
  },
};

function showCrashOverlay(err, title) {
  const el = document.getElementById('crash-overlay');
  if (!el) return;
  const msg = document.getElementById('crash-overlay-msg');
  const sub = document.getElementById('crash-overlay-sub');
  if (msg) msg.textContent = title || 'Ошибка игры';
  if (sub) {
    const text = err && (err.stack || err.message) ? String(err.stack || err.message) : String(err || '');
    sub.textContent = text.slice(0, 800);
  }
  el.classList.add('show');
  el.setAttribute('aria-hidden', 'false');
}
