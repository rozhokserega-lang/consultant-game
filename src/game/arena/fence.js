/** Ограждение арены и проём входа. */

Object.assign(Game.prototype, {
  _drawFenceBar(x, y, w, h, stripe) {
    ctx.fillStyle = '#8a9098';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6d737a';
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = '#a8adb4';
    ctx.fillRect(x, y + h - 4, w, 4);
    const stripeH = Math.min(14, Math.max(8, h * 0.26));
    const sy = y + h * 0.44 - stripeH / 2;
    ctx.fillStyle = stripe;
    ctx.fillRect(x + 2, sy, Math.max(0, w - 4), stripeH);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 2, sy, Math.max(0, w - 4), 3);
  },

  _drawArenaDoor(x, y, w, h) {
    ctx.fillStyle = '#6d737a';
    ctx.fillRect(x - 8, y, w + 16, h);
    const panelW = (w - 14) / 2;
    ctx.fillStyle = 'rgba(160,210,235,0.5)';
    ctx.fillRect(x + 5, y + 10, panelW, h - 18);
    ctx.fillRect(x + 9 + panelW, y + 10, panelW, h - 18);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y + 10, panelW, h - 18);
    ctx.strokeRect(x + 9 + panelW, y + 10, panelW, h - 18);
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(x + w / 2 - 2, y + 8, 4, h - 14);
    drawWallDecor(ctx, 'wall_exit', x + w / 2, y + 4, { scale: 0.55, anchorY: 1 }) ||
      drawSprite(ctx, 'sign_exit', x + w / 2, y + 2, { scale: 0.72, anchorY: 1 });
    drawArenaProp(ctx, 'plant', x - 16, y + h, { scale: 0.55, anchorY: 1 }) ||
      drawSprite(ctx, 'plant', x - 16, y + h, { scale: 0.52, anchorY: 1 });
    drawArenaProp(ctx, 'plant', x + w + 16, y + h, { scale: 0.55, anchorY: 1 }) ||
      drawSprite(ctx, 'plant', x + w + 16, y + h, { scale: 0.52, anchorY: 1 });
  },

  drawArenaFence(WW, WH) {
    const f = ARENA_FENCE;
    const th = this.getArenaTheme();
    const stripe = th.fenceStripe || '#c0392b';
    const topH = f.topShop;
    const sideW = f.side;
    const botH = f.bottom;
    const doorW = f.doorW;
    const doorX0 = WW / 2 - doorW / 2;
    const playTop = topH;
    const playBot = WH - botH;
    const wallH = Math.max(0, playBot - playTop);

    this._drawFenceBar(0, 0, WW, topH, stripe);
    ctx.fillStyle = '#5c5348';
    ctx.fillRect(0, topH - 5, WW, 5);

    this._drawFenceBar(0, playTop, sideW, wallH, stripe);
    this._drawFenceBar(WW - sideW, playTop, sideW, wallH, stripe);

    const botLeftW = Math.max(0, doorX0 - sideW);
    const botRightX = doorX0 + doorW;
    const botRightW = Math.max(0, WW - sideW - botRightX);
    if (botLeftW > 0) this._drawFenceBar(sideW, playBot, botLeftW, botH, stripe);
    if (botRightW > 0) this._drawFenceBar(botRightX, playBot, botRightW, botH, stripe);

    this._drawArenaDoor(doorX0, playBot, doorW, botH);

    ctx.fillStyle = '#727880';
    ctx.fillRect(0, playTop - 4, sideW + 2, 6);
    ctx.fillRect(WW - sideW - 2, playTop - 4, sideW + 2, 6);
    ctx.fillRect(0, playBot + botH - 2, sideW + 2, 4);
    ctx.fillRect(WW - sideW - 2, playBot + botH - 2, sideW + 2, 4);

    drawWallDecor(ctx, 'wall_exit', sideW * 0.52, WH * 0.42, { scale: 0.62, anchorY: 0.5 }) ||
      drawSprite(ctx, 'sign_exit', sideW * 0.52, WH * 0.5, { scale: 0.82, anchorY: 0.5 });
    drawWallDecor(ctx, 'wall_exit', WW - sideW * 0.52, WH * 0.42, { scale: 0.62, anchorY: 0.5, flip: true }) ||
      drawSprite(ctx, 'sign_exit', WW - sideW * 0.52, WH * 0.5, { scale: 0.82, anchorY: 0.5, flip: true });
  },
});
