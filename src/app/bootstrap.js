/** Точка входа: дев-режим, перехват падений, service worker и запуск игры. */

if (typeof isDevEnvironment === 'function' && isDevEnvironment()) {
  document.body.classList.add('dev-env');
}

// Локальная отладка: ?nosw=1 сбрасывает залипший service worker / cache
if (typeof location !== 'undefined' && /(?:\?|&)nosw=1(?:&|$)/.test(location.search) && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
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
if ('serviceWorker' in navigator && !/(?:\?|&)nosw=1(?:&|$)/.test(location.search)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
new Game();
