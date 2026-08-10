/** Россыпь частиц. */

Object.assign(Game.prototype, {
  spawnParticles(x, y, count, color, spread = 200, life = 0.6) {
    const room = MAX_PARTICLES - this.particles.length;
    if (room <= 0) return;
    const n = Math.min(count, room, LOW_GFX ? Math.ceil(count * 0.45) : count);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(spread * 0.3, spread);
      this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, rand(life * 0.5, life), rand(2, 6)));
    }
  },
});
