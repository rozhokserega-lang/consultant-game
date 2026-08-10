/** Размер холста, видимая область и перевод экранных координат в мировые. */

Object.assign(Game.prototype, {
  resize() {
    const container = document.getElementById('game-container');
    const cs = getComputedStyle(container);
    const padH = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const padW = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const cw = container.clientWidth - padW;
    const ch = container.clientHeight - padH;
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = cw; canvas.height = ch;
    this.W = cw; this.H = ch;
    // мобильный / тач: камера дальше (−15%), чтобы влезало больше поля
    const mobileView = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches
      || ('ontouchstart' in window && Math.min(cw, ch) < 900);
    this.viewZoom = mobileView ? 0.85 : 1;
    this.worldW = Math.max(1200, Math.floor(this.viewW() * 1.5));
    this.worldH = Math.max(800, Math.floor(this.viewH() * 1.5));
  },

  /** Ширина/высота видимой области мира (с учётом зума камеры). */
  viewW() { return this.W / (this.viewZoom || 1); },
  viewH() { return this.H / (this.viewZoom || 1); },

  screenToWorld(sx, sy) {
    const z = this.viewZoom || 1;
    return { x: sx / z + this.camera.x, y: sy / z + this.camera.y };
  },

  /** Камера для отрисовки: привязка к пикселям экрана (убирает рябь тайлов при зуме). */
  renderCamera() {
    const z = this.viewZoom || 1;
    return {
      x: Math.round(this.camera.x * z) / z,
      y: Math.round(this.camera.y * z) / z,
      z,
    };
  },
});
