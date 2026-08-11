/** Вылазка: привязка кнопки взаимодействия HUD (сенсор + клик). */

Object.assign(Game.prototype, {
  bindExtractHud() {
    const btn = document.getElementById('extract-interact-btn');
    if (!btn || btn._extractBound) return;
    btn._extractBound = true;

    const fire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof this.tryExtractInteract === 'function') this.tryExtractInteract();
    };

    btn.addEventListener('click', fire);
    // touchstart — чтобы джойстик на весь экран не перехватывал жест
    btn.addEventListener('touchstart', fire, { passive: false });
  },
});
