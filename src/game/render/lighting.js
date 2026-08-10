/** Затемнение карты со световым пятном вокруг игрока. */

Object.assign(Game.prototype, {
  /** Затемнение карты со световым пятном вокруг игрока */
  drawPlayerLight(shakeX = 0, shakeY = 0) {
    if (!this.player) return;
    // На толпе мобов полный экранный градиент жрёт GPU Android — упрощаем / пропускаем
    const crowded = this.enemies.length >= 10;
    if (LOW_GFX && crowded && this.lightsOut <= 0 && !this.isChaseMode) return;

    const cam = this._renderCam || this.renderCamera();
    const px = (this.player.x - cam.x) * cam.z + shakeX;
    const py = (this.player.y - cam.y) * cam.z + shakeY;

    let radius = Math.min(this.W, this.H) * 0.28;
    radius = Math.max(140, Math.min(260, radius));
    if (this.player.lunchTimer > 0) radius *= 1.25;
    if (this.wavePhase === 'boss') radius *= 1.1;

    let darkness = this.isChaseMode ? 0.38 : 0.32;
    if (this.lightsOut > 0) {
      darkness = 0.72;
      radius *= 0.55;
      // фонарик / охотник в Распродаже расширяют круг видимости
      if (this.gameMode === 'sale' && this.saleWeapons) {
        if (this.saleWeapons.flashlight || this.saleWeapons.hunter) radius *= 1.55;
      }
    }

    ctx.save();
    const g = ctx.createRadialGradient(px, py, radius * 0.25, px, py, radius);
    g.addColorStop(0, 'rgba(8, 10, 20, 0)');
    g.addColorStop(0.7, `rgba(8, 10, 20, ${darkness * 0.7})`);
    g.addColorStop(1, `rgba(8, 10, 20, ${darkness})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
    // Второе свечение — только на десктопе / при lightsOut
    if (!LOW_GFX || this.lightsOut > 0) {
      const glow = ctx.createRadialGradient(px, py - 8, 4, px, py - 8, radius * 0.55);
      glow.addColorStop(0, 'rgba(255, 236, 180, 0.12)');
      glow.addColorStop(1, 'rgba(255, 220, 140, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.W, this.H);
    }
    ctx.restore();
  },
});
