/** Расстановка препятствий и столкновения с ними. */

Object.assign(Game.prototype, {
  generateObstacles() {
    this.obstacles = [];
    if (this.getPaintedArenaWalk && this.getPaintedArenaWalk()) return;
    const th = this.getArenaTheme();
    const defs = [...(th.obstacles || [
      { x: 0.18, y: 0.22, sprite: 'bench', cw: 70, ch: 28 },
      { x: 0.42, y: 0.18, sprite: 'fold_table', cw: 64, ch: 28 },
      { x: 0.70, y: 0.24, sprite: 'clothes_rack', cw: 90, ch: 30 },
      { x: 0.88, y: 0.40, sprite: 'vending', cw: 36, ch: 50 },
      { x: 0.12, y: 0.48, sprite: 'sale_pillar', cw: 36, ch: 55 },
      { x: 0.30, y: 0.58, sprite: 'cart', cw: 48, ch: 36 },
      { x: 0.55, y: 0.42, sprite: 'mannequin', cw: 28, ch: 50 },
      { x: 0.75, y: 0.55, sprite: 'trash', cw: 28, ch: 40 },
      { x: 0.38, y: 0.78, sprite: 'bench', cw: 70, ch: 28 },
      { x: 0.62, y: 0.80, sprite: 'plant', cw: 28, ch: 40 },
      { x: 0.85, y: 0.72, sprite: 'barrel_red', cw: 40, ch: 36 },
      { x: 0.22, y: 0.82, sprite: 'box_stack', cw: 48, ch: 28 },
      { x: 0.08, y: 0.30, sprite: 'plant_cone', cw: 24, ch: 40 },
      { x: 0.50, y: 0.68, sprite: 'mirror', cw: 28, ch: 48 },
      { x: 0.92, y: 0.85, sprite: 'atm', cw: 32, ch: 40 },
      { x: 0.48, y: 0.30, sprite: 'checkout', cw: 36, ch: 40 },
      { x: 0.15, y: 0.70, sprite: 'sign_dir', cw: 32, ch: 48 },
      { x: 0.80, y: 0.18, sprite: 'fire_box', cw: 28, ch: 40 },
    ])];
    // перемешиваем, чтобы состав/порядок не был статичным
    for (let i = defs.length - 1; i > 0; i--) {
      const j = randi(0, i);
      const t = defs[i]; defs[i] = defs[j]; defs[j] = t;
    }

    const b = this.getArenaBounds();
    const spawnX = this.worldW / 2;
    const spawnY = this.worldH / 2;
    const placed = [];
    const pad = 18;
    const gap = 36;

    const overlaps = (x, y, w, h) => {
      for (const p of placed) {
        if (x < p.x + p.w + gap && x + w + gap > p.x && y < p.y + p.h + gap && y + h + gap > p.y) return true;
      }
      // зона старта свободная
      const cx = x + w / 2, cy = y + h / 2;
      if (dist(cx, cy, spawnX, spawnY) < 120) return true;
      // не блокируем дверь снизу
      if (Math.abs(cx - b.doorCx) < b.doorW * 0.55 && y + h > b.y1 - 90) return true;
      return false;
    };

    for (const def of defs) {
      const dw = def.dw || Math.round(def.cw * 1.15);
      const dh = def.dh || Math.round(def.ch * 1.35);
      // Footprint ≈ нижняя треть спрайта (зелёная зона), не весь высокий спрайт
      const footW = Math.max(22, Math.round(dw * 0.78));
      const footH = Math.max(20, Math.round(dh * 0.42));

      let ox = this.worldW * def.x - footW / 2;
      let oy = this.worldH * def.y - footH / 2;
      let ok = false;
      for (let tryN = 0; tryN < 48; tryN++) {
        const cx = rand(b.x0 + pad + footW / 2, b.x1 - pad - footW / 2);
        const cy = rand(b.y0 + pad + footH / 2 + 10, b.y1 - pad - footH / 2);
        const tx = cx - footW / 2;
        const ty = cy - footH / 2;
        if (overlaps(tx, ty, footW, footH)) continue;
        ox = tx; oy = ty; ok = true;
        break;
      }
      if (!ok) {
        // fallback на шаблон темы, если рандом не нашёл место
        ox = Math.max(b.x0 + pad, Math.min(b.x1 - pad - footW, this.worldW * def.x - footW / 2));
        oy = Math.max(b.y0 + pad, Math.min(b.y1 - pad - footH, this.worldH * def.y - footH / 2));
      }
      const ob = {
        x: ox, y: oy, w: footW, h: footH,
        dw, dh, sprite: def.sprite, type: 'prop',
      };
      this.obstacles.push(ob);
      placed.push(ob);
    }
  },

  collidesWithObstacle(cx, cy, r) {
    for (const ob of this.obstacles) {
      const closestX = Math.max(ob.x, Math.min(cx, ob.x + ob.w));
      const closestY = Math.max(ob.y, Math.min(cy, ob.y + ob.h));
      if ((cx - closestX) ** 2 + (cy - closestY) ** 2 < r * r) return true;
    }
    return false;
  },

  pushOutOfObstacles(obj, r) {
    for (const ob of this.obstacles) {
      const closestX = Math.max(ob.x, Math.min(obj.x, ob.x + ob.w));
      const closestY = Math.max(ob.y, Math.min(obj.y, ob.y + ob.h));
      const dx = obj.x - closestX, dy = obj.y - closestY;
      const d = Math.hypot(dx, dy);
      if (d < r && d > 0.001) {
        obj.x += (dx / d) * (r - d);
        obj.y += (dy / d) * (r - d);
      } else if (d < 0.001) obj.y -= r;
    }
  },
});
