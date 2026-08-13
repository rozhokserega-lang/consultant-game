/** Спрайтовые и покадровые эффекты поверх сцены. */

Object.assign(Game.prototype, {
  /**
   * Бюджет FX [0..1]: на поздних минутах и при переполненном буфере
   * автоматически режет частоту мелких эффектов от урона.
   */
  _fxBudget() {
    const sec = this.saleTime || 0;
    const min = sec / 60;
    // плавно режем с 12-й по 17-ю минуту: 1.0 → 0.35
    const timeMul = min <= 12 ? 1.0 : min >= 17 ? 0.35 : 1.0 - (min - 12) / 5 * 0.65;
    // дополнительный штраф если буфер animFx больше половины
    const fxLoad = (this.animFx && this.animFx.length > 20) ? 0.6 : 1.0;
    let b = timeMul * fxLoad;
    if (typeof LITE_GFX !== 'undefined' && LITE_GFX) b *= 0.22;
    return b;
  },

  /** Короткий спрайт-эффект из vfx_atlas (кровь, слэш, level up…). */
  spawnSpriteFx(name, x, y, opts = {}) {
    if (typeof LITE_GFX !== 'undefined' && LITE_GFX) return;
    if (!this.spriteFx) this.spriteFx = [];
    if (this.spriteFx.length > 48) this.spriteFx.shift();
    this.spriteFx.push({
      name,
      x,
      y,
      life: opts.life ?? 0.35,
      max: opts.life ?? 0.35,
      scale: opts.scale ?? 1,
      scaleEnd: opts.scaleEnd ?? ((opts.scale ?? 1) * 1.35),
      rot: opts.rot ?? 0,
      vy: opts.vy ?? -20,
      anchorY: opts.anchorY ?? 0.5,
    });
  },

  tickSpriteFx(dt) {
    if (this.animFx && this.animFx.length) {
      for (const fx of this.animFx) {
        fx.life -= dt;
        fx.y += (fx.vy || 0) * dt;
      }
      this.animFx = this.animFx.filter((fx) => fx.life > 0);
    }
    if (!this.spriteFx || !this.spriteFx.length) return;
    for (const fx of this.spriteFx) {
      fx.life -= dt;
      fx.y += (fx.vy || 0) * dt;
    }
    this.spriteFx = this.spriteFx.filter((fx) => fx.life > 0);
  },

  /** Анимированный эффект из anim_fx_atlas (one-shot или loop на время жизни). */
  spawnAnimFx(id, x, y, opts = {}) {
    if (typeof LITE_GFX !== 'undefined' && LITE_GFX && id !== 'afx_levelup') return;
    if (!this.animFx) this.animFx = [];
    if (this.animFx.length > 40) this.animFx.shift();
    this.animFx.push({
      id, x, y,
      life: opts.life ?? 0.5,
      max: opts.life ?? 0.5,
      scale: opts.scale ?? 1,
      scaleEnd: opts.scaleEnd,
      rot: opts.rot ?? 0,
      vy: opts.vy ?? 0,
      alpha: opts.alpha ?? 1,
      tint: opts.tint,
      fade: opts.fade !== false,
      anchorX: opts.anchorX,
      anchorY: opts.anchorY,
    });
  },

  renderAnimFx(ctx) {
    if (!this.animFx || !this.animFx.length) return;
    for (const fx of this.animFx) {
      const t = Math.max(0, Math.min(1, 1 - fx.life / fx.max));
      const sc = fx.scaleEnd != null ? fx.scale + (fx.scaleEnd - fx.scale) * t : fx.scale;
      const alpha = fx.fade ? fx.alpha * Math.min(1, fx.life / (fx.max * 0.3)) : fx.alpha;
      drawAnimFxFrame(ctx, fx.id, fx.x, fx.y, {
        t,
        time: fx.max - fx.life,
        scale: sc,
        rot: fx.rot,
        alpha,
        tint: fx.tint,
        anchorX: fx.anchorX,
        anchorY: fx.anchorY,
      });
    }
  },

  drawSpriteFx(ctx) {
    if (!this.spriteFx) return;
    for (const fx of this.spriteFx) {
      const t = Math.max(0, fx.life / fx.max);
      const sc = fx.scale + (fx.scaleEnd - fx.scale) * (1 - t);
      const alpha = Math.min(1, t * 1.15);
      const opts = { scale: sc, anchorY: fx.anchorY, alpha };
      ctx.save();
      if (fx.rot) {
        ctx.translate(fx.x, fx.y);
        ctx.rotate(fx.rot);
        if (!(typeof drawSpell === 'function' && drawSpell(ctx, fx.name, 0, 0, opts))) {
          drawVfx(ctx, fx.name, 0, 0, opts);
        }
      } else if (!(typeof drawSpell === 'function' && drawSpell(ctx, fx.name, fx.x, fx.y, opts))) {
        drawVfx(ctx, fx.name, fx.x, fx.y, opts);
      }
      ctx.restore();
    }
  },
});
