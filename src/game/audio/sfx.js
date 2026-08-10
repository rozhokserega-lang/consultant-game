/** Звуковые эффекты на Web Audio, без файлов. */

// ── Звук (Web Audio, без файлов) ──
class SFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur);
  }
  hit() { this.tone(180, 0.08, 'square', 0.1, -60); }
  kill() { this.tone(320, 0.12, 'sawtooth', 0.09, 200); this.tone(480, 0.1, 'triangle', 0.05); }
  hurt() { this.tone(90, 0.2, 'sawtooth', 0.12, -40); }
  pickup() { this.tone(520, 0.1, 'sine', 0.08, 200); }
  coin() { this.tone(880, 0.06, 'sine', 0.07); this.tone(1175, 0.08, 'triangle', 0.05); }
  shop() { this.tone(300, 0.08, 'triangle', 0.07); this.tone(450, 0.1, 'triangle', 0.06); }
  mode() { this.tone(240, 0.15, 'triangle', 0.1); this.tone(360, 0.15, 'triangle', 0.06); }
  level() { this.tone(400, 0.1, 'sine', 0.08); setTimeout(() => this.tone(600, 0.12, 'sine', 0.08), 80); }
  win() { [400,500,600,800].forEach((f,i) => setTimeout(() => this.tone(f, 0.15, 'sine', 0.08), i * 90)); }
  lose() { this.tone(200, 0.3, 'sawtooth', 0.1, -120); }
  click() { this.tone(700, 0.04, 'square', 0.04); }
}

const sfx = new SFX();
