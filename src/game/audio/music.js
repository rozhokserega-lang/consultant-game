/** Процедурный чиптюн на том же AudioContext, что и эффекты. */

// ── Фоновая музыка (чиптюн на том же AudioContext, что и SFX) ──
class Music {
  constructor() {
    this.enabled = true;
    this.muted = false;
    this.playing = false;
    this.ctx = null;
    this.master = null;
    this.intensity = 'calm';
    this.step = 0;
    this.nextStepTime = 0;
    this.lookahead = 25;
    this.scheduleAhead = 0.15;
    this.timerId = null;
    this.rootFreq = 220;
    this.chords = [
      { root: 0, third: 3, fifth: 7 },
      { root: -4, third: 0, fifth: 3 },
      { root: 3, third: 7, fifth: 10 },
      { root: -2, third: 2, fifth: 5 },
    ];
  }

  ensure() {
    sfx.ensure();
    if (!sfx.ctx) return;
    this.ctx = sfx.ctx;
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
  }

  freq(semi) { return this.rootFreq * Math.pow(2, semi / 12); }

  start() {
    this.ensure();
    if (!this.ctx || this.playing || !this.enabled) return;
    this.playing = true;
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this._fadeTo(this.muted ? 0 : this._targetVol());
    this._tick();
  }

  stop() {
    this.playing = false;
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
    this._fadeTo(0);
  }

  setEnabled(v) {
    this.enabled = v;
    if (v) this.start(); else this.stop();
  }

  setMuted(v) {
    this.muted = !!v;
    if (this.playing) this._fadeTo(this.muted ? 0 : this._targetVol());
  }

  setIntensity(level) {
    if (this.intensity === level) return;
    this.intensity = level;
    if (this.playing && !this.muted) this._fadeTo(this._targetVol());
  }

  _targetVol() { return { calm: 0.10, rush: 0.14, boss: 0.16 }[this.intensity] ?? 0.10; }
  _bpm() { return { calm: 122, rush: 148, boss: 138 }[this.intensity] ?? 122; }
  _stepDur() { return 60 / this._bpm() / 4; }

  _fadeTo(target) {
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(target, t + 0.5);
  }

  _tick() {
    if (!this.playing || !this.ctx) return;
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAhead) {
      this._playStep(this.step, this.nextStepTime);
      this.nextStepTime += this._stepDur();
      this.step = (this.step + 1) % 16;
    }
    this.timerId = setTimeout(() => this._tick(), this.lookahead);
  }

  _osc(freq, time, type, vol, decay) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);
    o.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + decay + 0.02);
  }

  _hat(time, vol) {
    const n = Math.floor(this.ctx.sampleRate * 0.03);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass'; filt.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(time); src.stop(time + 0.04);
  }

  _kick(time, vol) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, time);
    o.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    o.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + 0.16);
  }

  _playStep(step, time) {
    // mute — не создаём осцилляторы (экономия CPU)
    if (this.muted || !this.enabled) return;
    const chord = this.chords[Math.floor(step / 4) % this.chords.length];
    const busy = this.intensity !== 'calm';
    if (step % 4 === 0) this._osc(this.freq(chord.root - 12), time, 'square', 0.10, 0.3);
    const arp = [chord.root, chord.third, chord.fifth, chord.third];
    if (busy || step % 2 === 0) {
      const note = arp[(step >> 1) % arp.length];
      this._osc(this.freq(note + 12), time, 'triangle', busy ? 0.055 : 0.04, 0.18);
    }
    if (step % 2 === 1) this._hat(time, busy ? 0.05 : 0.03);
    if (busy && step % 8 === 0) this._kick(time, 0.12);
  }
}

const music = new Music();
