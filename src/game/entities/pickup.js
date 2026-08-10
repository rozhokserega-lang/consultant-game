/** Подбираемые предметы на полу. */

class Pickup {
  constructor(x, y, type = 'heal', value = 1) {
    this.x = x; this.y = y; this.type = type; this.value = value;
    this.life = type === 'coin' ? 12 : 10; this.r = type === 'coin' ? 12 : 14;
    this.vx = rand(-40, 40); this.vy = rand(-60, -10);
  }
  update(dt, player) {
    this.life -= dt;
    if (this.type === 'coin' && player) {
      const range = player.coinMagnet || 90;
      const d = dist(this.x, this.y, player.x, player.y);
      if (d < range) {
        const pull = (range - d) * (4.5 + (player.coinMagnetBonus || 0));
        const a = angleTo(this.x, this.y, player.x, player.y);
        this.vx += Math.cos(a) * pull * dt;
        this.vy += Math.sin(a) * pull * dt;
      }
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vx *= 0.92; this.vy *= 0.92;
  }
  get dead() { return this.life <= 0; }
  get alpha() { return this.life < 1.5 ? this.life / 1.5 : 1; }
  draw(c) {
    const a = this.alpha; if (a < 0.02) return;
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.12;
    c.save(); c.globalAlpha = a;
    let name = 'pickup_heart';
    if (this.type === 'heal') name = 'pickup_medkit';
    else if (this.type === 'lunch') name = 'pickup_bolt';
    else if (this.type === 'coin') name = 'pickup_coin';
    else if (this.type === 'temp_mop') name = 'pickup_shoe';
    else if (this.type === 'temp_stapler') name = 'pickup_key';
    else if (this.type === 'temp_extinguisher') name = 'pickup_glove';
    const sc = (this.type === 'coin' ? 1.35 : 1.45) * pulse;
    const drew = drawPickupFx(c, name, this.x, this.y, { scale: sc, anchorY: 0.5 })
      || drawSprite(c, name === 'pickup_medkit' ? 'pickup_heart' : name, this.x, this.y, {
        scale: (this.type === 'coin' ? 0.95 : 1.1) * pulse, anchorY: 0.5,
      });
    if (!drew) {
      const colors = { lunch: '#f39c12', coin: '#f1c40f', temp_mop: '#2980b9', temp_stapler: '#7f8c8d', temp_extinguisher: '#c0392b' };
      c.fillStyle = colors[this.type] || '#e74c3c';
      c.beginPath(); c.arc(this.x, this.y, this.r * pulse, 0, Math.PI*2); c.fill();
    }
    if (this.type.startsWith('temp_')) {
      const tw = TEMP_WEAPONS[this.type.replace('temp_', '')];
      if (tw) {
        c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center';
        c.fillText(tw.ico, this.x, this.y + 4);
      }
    }
    if (this.type === 'coin' && this.value > 1) {
      c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center';
      c.fillText('×' + this.value, this.x, this.y - 14);
    }
    c.restore();
  }
}
