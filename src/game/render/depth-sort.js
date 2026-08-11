/** Порядок отрисовки по «ногам», чтобы не лезть сквозь полки. */

Object.assign(Game.prototype, {
  /** Пропы + персонажи по «ногам» — иначе лезем сквозь верх полок */
  drawDepthSorted(vx0, vy0, vx1, vy1) {
    const items = [];
    for (const ob of this.obstacles) {
      items.push({ y: ob.y + ob.h, z: 0, draw: () => this.drawObstacle(ob) });
    }
    for (const enemy of this.enemies) {
      if (enemy.x < vx0 || enemy.x > vx1 || enemy.y < vy0 || enemy.y > vy1) continue;
      items.push({ y: enemy.y, z: 1, draw: () => enemy.draw(ctx, this.isChaseMode) });
    }
    if (this.gameMode === 'extract' && this.extractNpcs) {
      for (const npc of this.extractNpcs) {
        items.push({
          y: npc.y,
          z: 1,
          draw: () => this.drawExtractNpc(npc),
        });
      }
    }
    items.push({ y: this.player.y, z: 2, draw: () => this.player.draw(ctx) });
    items.sort((a, b) => (a.y - b.y) || (a.z - b.z));
    for (const it of items) it.draw();
  },
});
