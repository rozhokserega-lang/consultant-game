/** Тема арены и её игровые границы. */

Object.assign(Game.prototype, {
  getArenaTheme() {
    return ARENA_THEMES[this.selectedArena] || ARENA_THEMES.food;
  },

  /** Тема с готовой текстурой (стены и декор уже на арте). */
  getPaintedArenaWalk() {
    if (this.gameMode === 'extract') return null;
    const th = this.getArenaTheme();
    return (th && th.walk && th.paintedSrc) ? th.walk : null;
  },

  paintedWalkXAt(ny) {
    const w = this.getPaintedArenaWalk();
    if (!w) return null;
    const t = Math.max(0, Math.min(1, (ny - w.y0) / (w.y1 - w.y0)));
    return {
      x0: (w.topX0 + (w.botX0 - w.topX0) * t) * this.worldW,
      x1: (w.topX1 + (w.botX1 - w.topX1) * t) * this.worldW,
    };
  },

  clampPointToPaintedWalk(x, y, pad) {
    const w = this.getPaintedArenaWalk();
    if (!w) return null;
    const m = pad || 0;
    const y0 = w.y0 * this.worldH + m;
    const y1 = w.y1 * this.worldH - m;
    const cy = Math.max(y0, Math.min(y1, y));
    const xs = this.paintedWalkXAt(cy / this.worldH);
    return {
      x: Math.max(xs.x0 + m, Math.min(xs.x1 - m, x)),
      y: cy,
    };
  },

  getArenaBounds() {
    const WW = this.worldW;
    const WH = this.worldH;
    const walk = this.getPaintedArenaWalk();
    if (walk) {
      return {
        x0: Math.min(walk.topX0, walk.botX0) * WW,
        y0: walk.y0 * WH,
        x1: Math.max(walk.topX1, walk.botX1) * WW,
        y1: walk.y1 * WH,
        doorCx: WW / 2,
        doorW: ARENA_FENCE.doorW,
      };
    }
    const f = ARENA_FENCE;
    return {
      x0: f.side,
      y0: f.topShop,
      x1: WW - f.side,
      y1: WH - f.bottom,
      doorCx: WW / 2,
      doorW: f.doorW,
    };
  },
});
