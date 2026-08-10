/** Витрины вдоль стены и настенные вывески. */

Object.assign(Game.prototype, {
  generateStorefronts() {
    this.storefronts = [];
    const th = this.getArenaTheme();
    const primary = th.store || 'store_food';
    const y = 6;
    const top = [0.12, 0.32, 0.52, 0.72];
    top.forEach((fx, i) => {
      this.storefronts.push({
        x: this.worldW * fx, y,
        w: 118, h: 92,
        sprite: i % 2 === 0 ? primary : STORE_SPRITES[i % STORE_SPRITES.length],
      });
    });
  },

  generateWallDecor() {
    this.wallDecor = [];
    const th = this.getArenaTheme();
    const signs = th.wallSigns || ['wall_sale', 'wall_dir', 'wall_exit', 'wall_nosmoke'];
    const f = ARENA_FENCE;
    const WW = this.worldW;
    const WH = this.worldH;
    // верхняя стена между витринами
    const topYs = f.topShop - 8;
    const topXs = [0.22, 0.42, 0.62, 0.82];
    topXs.forEach((fx, i) => {
      this.wallDecor.push({
        sprite: signs[i % signs.length],
        x: WW * fx,
        y: topYs,
        scale: 0.48,
        wall: 'top',
      });
    });
    // боковые стены
    const sideY = [0.28, 0.48, 0.68];
    sideY.forEach((fy, i) => {
      this.wallDecor.push({
        sprite: signs[(i + 1) % signs.length],
        x: f.side * 0.55,
        y: WH * fy,
        scale: 0.42,
        wall: 'left',
      });
      this.wallDecor.push({
        sprite: signs[(i + 2) % signs.length],
        x: WW - f.side * 0.55,
        y: WH * fy,
        scale: 0.42,
        wall: 'right',
        flip: true,
      });
    });
  },

  drawWallDecorations() {
    for (const d of this.wallDecor || []) {
      if (!drawWallDecor(ctx, d.sprite, d.x, d.y, {
        scale: d.scale || 0.45,
        flip: !!d.flip,
        anchorY: d.wall === 'top' ? 1 : 0.5,
      })) {
        // fallback old atlas names
        const legacy = {
          wall_sale: 'sign_sale',
          wall_burger: 'sign_burger',
          wall_exit: 'sign_exit',
          wall_dir: 'sign_dir',
          wall_nosmoke: 'sign_nosmoke',
        };
        drawSprite(ctx, legacy[d.sprite] || d.sprite, d.x, d.y, {
          scale: (d.scale || 0.45) * 1.2,
          flip: !!d.flip,
          anchorY: d.wall === 'top' ? 1 : 0.5,
        });
      }
    }
  },
});
