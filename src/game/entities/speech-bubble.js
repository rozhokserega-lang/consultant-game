/** Облачко с репликой над покупателем. */

class SpeechBubble {
  constructor(owner, text) {
    this.owner = owner; this.text = text; this.life = 2.5; this.maxLife = 2.5; this.fadeIn = 0.2;
    this._laid = false;
    this._lines = null;
    this._bw = 0;
    this._bh = 0;
    this._lineH = 0;
    this._padY = 7;
  }
  update(dt) { this.life -= dt; }
  get dead() { return this.life <= 0; }
  get alpha() {
    if (this.life > this.maxLife - this.fadeIn) return (this.maxLife - this.life) / this.fadeIn;
    if (this.life < 0.4) return this.life / 0.4;
    return 1;
  }
  _layout(c) {
    if (this._laid) return;
    const maxWidth = 160, fontSize = 12;
    c.font = `500 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    const words = this.text.split(' ');
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (c.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const lineH = fontSize * 1.35, padX = 9, padY = 6;
    this._lines = lines;
    this._lineH = lineH;
    this._padY = padY;
    this._bw = Math.min(maxWidth, Math.max(...lines.map(l => c.measureText(l).width))) + padX * 2;
    this._bh = lines.length * lineH + padY * 2;
    this._laid = true;
  }
  draw(c, ox, oy) {
    const a = this.alpha; if (a <= 0.01) return;
    this._layout(c);
    const bw = this._bw, bh = this._bh, lines = this._lines;
    const bx = ox - bw / 2, by = oy - bh - 12;
    c.save(); c.globalAlpha = a;
    c.fillStyle = '#fff';
    c.beginPath();
    const r = 8;
    c.moveTo(bx + r, by); c.lineTo(bx + bw - r, by); c.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    c.lineTo(bx + bw, by + bh - r); c.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    c.lineTo(bx + bw / 2 + 6, by + bh); c.lineTo(bx + bw / 2, by + bh + 8); c.lineTo(bx + bw / 2 - 6, by + bh);
    c.lineTo(bx + r, by + bh); c.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
    c.lineTo(bx, by + r); c.quadraticCurveTo(bx, by, bx + r, by); c.closePath(); c.fill();
    c.fillStyle = '#222'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '500 12px "Segoe UI", system-ui, sans-serif';
    for (let i = 0; i < lines.length; i++) {
      c.fillText(lines[i], bx + bw / 2, by + this._padY + i * this._lineH + this._lineH / 2);
    }
    c.restore();
  }
}
