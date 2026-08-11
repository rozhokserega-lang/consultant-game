/** Инициализация Telegram Mini App: разворот на весь экран, цвета обрамления. */

(function () {
  var tries = 0;

  function initTg() {
    var tg = window.Telegram && Telegram.WebApp;
    if (!tg) return false;
    try {
      document.documentElement.classList.add('tg-miniapp');
      if (document.body) document.body.classList.add('tg-miniapp');
      else {
        document.addEventListener('DOMContentLoaded', function () {
          document.body.classList.add('tg-miniapp');
        });
      }
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
    return true;
  }

  // Скрипт Telegram грузится async — не блокируем игру, если CDN недоступен.
  if (initTg()) return;
  var timer = setInterval(function () {
    tries += 1;
    if (initTg() || tries > 50) clearInterval(timer);
  }, 100);
  window.addEventListener('load', function () {
    initTg();
  });
})();
