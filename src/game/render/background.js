/** Пол арены и препятствия. */

Object.assign(Game.prototype, {
  drawBackground() {
    const WW = this.worldW, WH = this.worldH;
    ctx.fillStyle = '#d9d2c5';
    ctx.fillRect(0, 0, WW, WH);

    // Тайлы пола из атласа
    const tileSize = 64;
    const cam = this._renderCam || this.camera;
    const vw = this.viewW();
    const vh = this.viewH();
    const vx1 = Math.floor(cam.x / tileSize) * tileSize;
    const vy1 = Math.floor(cam.y / tileSize) * tileSize;
    const vx2 = cam.x + vw + tileSize;
    const vy2 = cam.y + vh + tileSize;
    ctx.imageSmoothingEnabled = false;
    const themeTile = (this.getArenaTheme() && this.getArenaTheme().tile) || 'tile_beige';
    const zones = this.zones;
    const hasZones = zones && zones.length > 0;
    for (let x = vx1; x < vx2; x += tileSize) {
      for (let y = vy1; y < vy2; y += tileSize) {
        let name = themeTile;
        if (hasZones) {
          const cx = x + tileSize / 2, cy = y + tileSize / 2;
          for (const z of zones) {
            if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) {
              if (z.type === 'slippery') name = 'tile_gloss';
              else if (z.type === 'foodcourt') name = 'tile_wood';
              else if (z.type === 'checkout') name = 'tile_check';
              break;
            }
          }
        }
        // ровно tileSize — без +2, иначе при зуме швы рябят
        if (!drawSprite(ctx, name, x + tileSize / 2, y + tileSize, { w: tileSize, h: tileSize, anchorY: 1, anchorX: 0.5 })) {
          ctx.fillStyle = '#e8dcc8';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }

    // Мокрый пол — табличка
    for (const z of this.zones) {
      if (z.type === 'slippery') {
        if (!drawArenaProp(ctx, 'wet_floor', z.x + z.w / 2, z.y + z.h / 2 + 10, { scale: 0.95, anchorY: 0.5 })) {
          drawSprite(ctx, 'wet_floor', z.x + z.w / 2, z.y + z.h / 2 + 10, { scale: 1.1, anchorY: 0.5 });
        }
      } else if (z.type === 'foodcourt') {
        if (!drawWallDecor(ctx, 'wall_burger', z.x + 30, z.y + 20, { scale: 0.55, anchorY: 1 })) {
          drawSprite(ctx, 'sign_burger', z.x + 30, z.y + 20, { scale: 0.9, anchorY: 1 });
        }
      } else if (z.type === 'checkout') {
        if (!drawWallDecor(ctx, 'wall_sale', z.x + z.w - 20, z.y + 24, { scale: 0.5, anchorY: 1 })) {
          drawSprite(ctx, 'sign_sale', z.x + z.w - 20, z.y + 24, { scale: 0.85, anchorY: 1 });
        }
      }
    }

    this.drawArenaFence(WW, WH);
    this.drawWallDecorations();

    for (const sf of this.storefronts) {
      if (!drawStorefrontSprite(ctx, sf.sprite, sf.x + sf.w / 2, sf.y + sf.h, { w: sf.w, h: sf.h, anchorY: 1 })) {
        ctx.fillStyle = '#a8d8ea'; ctx.fillRect(sf.x, sf.y, sf.w, sf.h);
      }
    }
  },

  drawObstacle(ob) {
    const cx = ob.x + ob.w / 2;
    const by = ob.y + ob.h;
    const dw = ob.dw || (ob.w * 1.15);
    const dh = ob.dh || (ob.h * 1.35);
    if (drawArenaProp(ctx, ob.sprite, cx, by, { w: dw, h: dh, anchorY: 1 })) return;
    if (!drawSprite(ctx, ob.sprite, cx, by, { w: dw, h: dh, anchorY: 1 })) {
      ctx.fillStyle = '#c4b99a';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }
  },

  drawObstacles() {
    const sorted = [...this.obstacles].sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const ob of sorted) this.drawObstacle(ob);
  },
});
