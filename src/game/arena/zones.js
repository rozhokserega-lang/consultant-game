/** Зоны с особым поведением пола. */

Object.assign(Game.prototype, {
  generateZones() {
    if (this.getPaintedArenaWalk && this.getPaintedArenaWalk()) {
      this.zones = [];
      return;
    }
    const th = this.getArenaTheme();
    const b = this.getArenaBounds();
    this.zones = (th.zones || []).map(z => {
      // лёгкий джиттер позиции зоны каждый забег
      const jx = rand(-0.06, 0.06);
      const jy = rand(-0.06, 0.06);
      let x = this.worldW * Math.max(0.05, Math.min(0.85, z.x + jx));
      let y = this.worldH * Math.max(0.12, Math.min(0.82, z.y + jy));
      x = Math.max(b.x0 + 8, Math.min(b.x1 - z.w - 8, x));
      y = Math.max(b.y0 + 8, Math.min(b.y1 - z.h - 8, y));
      return { type: z.type, x, y, w: z.w, h: z.h };
    });
  },

  zoneAt(x, y) {
    for (const z of this.zones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  },
});
