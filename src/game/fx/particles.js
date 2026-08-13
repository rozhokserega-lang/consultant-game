/** Россыпь частиц. */

Object.assign(Game.prototype, {
  spawnParticles(x, y, count, color, spread = 200, life = 0.6) {
    const cap = (typeof LITE_GFX !== 'undefined' && LITE_GFX)
      ? Math.min(28, MAX_PARTICLES)
      : MAX_PARTICLES;
    const room = cap - this.particles.length;
    if (room <= 0) return;
    let want = count;
    if (typeof LITE_GFX !== 'undefined' && LITE_GFX) want = Math.ceil(count * 0.12);
    else if (LOW_GFX) want = Math.ceil(count * 0.45);
    const n = Math.min(count, room, want);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(spread * 0.3, spread);
      this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, rand(life * 0.5, life), rand(2, 6)));
    }
  },
});
