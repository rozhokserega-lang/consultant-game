/** Сборка кадра: фон, сущности, эффекты, оверлеи. */

Object.assign(Game.prototype, {
  render() {
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.W, this.H);
    let sx = 0, sy = 0;
    if (this.screenShake > 0) {
      // shake тоже к целым пикселям — иначе пол мерцает
      sx = Math.round((Math.random() - 0.5) * this.screenShake * 30);
      sy = Math.round((Math.random() - 0.5) * this.screenShake * 30);
    }
    const cam = this.renderCamera();
    this._renderCam = cam;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // setTransform: после зума камера и shake попадают в целые пиксели экрана
    ctx.setTransform(cam.z, 0, 0, cam.z, -Math.round(cam.x * cam.z) + sx, -Math.round(cam.y * cam.z) + sy);
    this.drawBackground();
    const viewPad = 80;
    const vx0 = cam.x - viewPad, vy0 = cam.y - viewPad;
    const vx1 = cam.x + this.viewW() + viewPad, vy1 = cam.y + this.viewH() + viewPad;
    for (const p of this.particles) {
      if (p.y < this.player.y - 30 && p.x >= vx0 && p.x <= vx1 && p.y >= vy0 && p.y <= vy1) p.draw(ctx);
    }
    this.drawDepthSorted(vx0, vy0, vx1, vy1);
    for (const p of this.particles) {
      if (p.y >= this.player.y - 30 && p.x >= vx0 && p.x <= vx1 && p.y >= vy0 && p.y <= vy1) p.draw(ctx);
    }
    for (const pk of this.pickups) pk.draw(ctx);
    for (const pr of this.projectiles) pr.draw(ctx);
    for (const pr of this.playerProjectiles) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(-8, -3, 16, 6);
      ctx.restore();
    }

    // Фитили жирных — мигает зона взрыва, успей убежать
    for (const bomb of this.fuseBombs) {
      const t = bomb.life / bomb.max;
      const pulse = 0.4 + Math.sin(performance.now() / 80) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.25 + pulse * 0.35;
      ctx.fillStyle = '#ff3b00';
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, FATTY_EXPLODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7 + pulse * 0.3;
      ctx.strokeStyle = '#ffdd00';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, FATTY_EXPLODE_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // тело «трупа» / бомбы
      if (bomb.hueRotate && !LOW_GFX) ctx.filter = `hue-rotate(${bomb.hueRotate}deg)`;
      drawSprite(ctx, bomb.sprite, bomb.x, bomb.y + 4, { scale: bomb.scale, anchorY: 1, alpha: 0.85 });
      if (bomb.hueRotate && !LOW_GFX) ctx.filter = 'none';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💣 ${bomb.life.toFixed(1)}`, bomb.x, bomb.y - bomb.r - 20);
      ctx.restore();
    }

    for (const b of this.boomFx) {
      const t = Math.max(0, Math.min(1, b.life / b.max));
      const progress = 1 - t;
      // новый анимированный взрыв (CC0-атлас), фолбэк — старые кадры
      const drewAnim = drawAnimFxFrame(ctx, 'afx_explosion', b.x, b.y, {
        t: progress,
        scale: 1.5 + progress * 1.1,
        alpha: Math.min(1, t * 1.4),
      });
      if (!drewAnim) {
        const boomName = VFX_BOOM_FRAMES[Math.min(VFX_BOOM_FRAMES.length - 1, Math.floor(progress * VFX_BOOM_FRAMES.length))];
        const sc = 0.85 + progress * 0.55;
        if (!drawVfx(ctx, boomName, b.x, b.y, { scale: sc, anchorY: 0.55, alpha: Math.min(1, t * 1.2) })) {
          const oldSc = 1.8 + progress * 2.4;
          if (!drawPickupFx(ctx, 'fx_boom', b.x, b.y, { scale: oldSc, anchorY: 0.5, alpha: t })) {
            drawSprite(ctx, 'fx_boom', b.x, b.y, { scale: 1.2 + progress * 1.8, anchorY: 0.5, alpha: t });
          }
        }
      }
      if (t > 0.35 && !drewAnim) {
        drawVfx(ctx, 'fx_hit_spark', b.x + 8, b.y - 10, { scale: 0.7 + progress, anchorY: 0.5, alpha: t * 0.75 });
        drawVfx(ctx, 'fx_smoke', b.x - 10, b.y + 8, { scale: 0.55 + progress * 0.35, anchorY: 0.5, alpha: t * 0.5 });
      }
      // кольцо взрыва
      ctx.save();
      ctx.globalAlpha = t * 0.5;
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, FATTY_EXPLODE_RADIUS * (1.1 - t * 0.3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.drawSpriteFx(ctx);
    this.renderAnimFx(ctx);
    if (this.gameMode === 'sale' && typeof this.renderSaleOverlays === 'function') {
      this.renderSaleOverlays();
    }
    this.drawBossLineAttacks();
    ctx.restore();

    // Лёгкая темень + свет над персонажем
    this.drawPlayerLight(sx, sy);

    // Sale: экранные оверлеи (стрелка на босса и т.п.)
    if (this.gameMode === 'sale' && typeof this.renderSaleScreenUI === 'function') {
      this.renderSaleScreenUI();
    }

    if (this.modeFlash > 0) {
      ctx.save();
      const flashAlpha = (this.modeFlash / 0.5) * 0.3;
      ctx.fillStyle = this.isChaseMode ? `rgba(255,60,30,${flashAlpha})` : `rgba(80,160,255,${flashAlpha})`;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, this.modeFlash * 2);
      ctx.fillText(this.isChaseMode ? '🔴 ЧАС ПИК!' : '🔵 ОБЫЧНАЯ СМЕНА', this.W / 2, this.H * 0.35);
      ctx.restore();
    }
    if (this._bfBanner > 0) {
      this._bfBanner -= 1 / 60;
      ctx.save();
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 4;
      ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('🖤 ЧЁРНАЯ ПЯТНИЦА!', this.W / 2, this.H * 0.35);
      ctx.fillText('🖤 ЧЁРНАЯ ПЯТНИЦА!', this.W / 2, this.H * 0.35);
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.strokeText('Больше покупателей · больше монет', this.W / 2, this.H * 0.35 + 28);
      ctx.fillText('Больше покупателей · больше монет', this.W / 2, this.H * 0.35 + 28);
      ctx.restore();
    }
    if (this._eventBanner && this._eventBanner.t > 0) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 4;
      ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const tx = this.W / 2;
      const ty = this.H * 0.28;
      ctx.strokeText(this._eventBanner.text, tx, ty);
      ctx.fillText(this._eventBanner.text, tx, ty);
      ctx.restore();
    }

    if (this.wavePhase === 'boss' && !this.won && !this.gameOver) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.directorSpawned ? '👔 ДИРЕКТОР НА СМЕНЕ' : '👔 БОСС ВОЛНЫ', this.W / 2, 28);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
});
