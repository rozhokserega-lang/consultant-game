/** Летящий снаряд. */

class Projectile {
  constructor(x, y, angle, speed = 260, owner = null) {
    this.x = x; this.y = y; this.angle = angle; this.speed = speed;
    this.life = 2.2; this.r = 8; this.owner = owner; this.dead = false;
  }
  update(dt) {
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(c) {
    c.save();
    if (!drawSprite(c, 'sign_nosmoke', this.x, this.y, { scale: 0.55, rotation: this.angle, anchorY: 0.5 })) {
      c.translate(this.x, this.y); c.rotate(this.angle);
      c.fillStyle = '#8e44ad'; c.fillRect(-10, -5, 20, 10);
    }
    c.restore();
  }
}
