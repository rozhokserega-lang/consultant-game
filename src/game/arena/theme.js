/** Тема арены и её игровые границы. */

Object.assign(Game.prototype, {
  getArenaTheme() {
    return ARENA_THEMES[this.selectedArena] || ARENA_THEMES.food;
  },

  getArenaBounds() {
    const WW = this.worldW;
    const WH = this.worldH;
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
