/** Частица: короткоживущий кружок для эффектов. */

class Particle {
  constructor(x, y, vx, vy, color, life, size = 3) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.life = life; this.maxLife = life; this.size = size;
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vx *= 0.96; this.vy *= 0.96; this.life -= dt;
  }
  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get dead() { return this.life <= 0; }
  draw(c) {
    c.globalAlpha = this.alpha;
    c.fillStyle = this.color;
    c.beginPath(); c.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }
}
