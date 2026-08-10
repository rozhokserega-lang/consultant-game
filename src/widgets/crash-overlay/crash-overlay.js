/** Показ экрана необработанной ошибки. */

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
