/** Точка входа: дев-режим, перехват падений, service worker и запуск игры. */

if (typeof isDevEnvironment === 'function' && isDevEnvironment()) {
  document.body.classList.add('dev-env');
}
window.addEventListener('error', (ev) => {
  if (typeof showCrashOverlay === 'function') {
    showCrashOverlay(ev.error || ev.message, 'Необработанная ошибка');
  }
});
window.addEventListener('unhandledrejection', (ev) => {
  if (typeof showCrashOverlay === 'function') {
    showCrashOverlay(ev.reason, 'Необработанное отклонение');
  }
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
new Game();
