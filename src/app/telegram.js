/** Инициализация Telegram Mini App: разворот на весь экран, цвета обрамления. */

(function () {
  var tg = window.Telegram && Telegram.WebApp;
  if (!tg) return;
  try {
    document.documentElement.classList.add('tg-miniapp');
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add('tg-miniapp');
    });
    tg.ready();
    tg.expand();
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    if (tg.setHeaderColor) tg.setHeaderColor('#1a1a2e');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#1a1a2e');
    if (tg.lockOrientation) {
      try { tg.lockOrientation(); } catch (e) {}
    }
    if (typeof tg.requestFullscreen === 'function') {
      try { tg.requestFullscreen(); } catch (e) {}
    }
  } catch (e) {}
})();
