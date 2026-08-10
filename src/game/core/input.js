/** Клавиатура, мышь и тач: сбор направления движения и действий. */

Object.assign(Game.prototype, {
  setupInput() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') this.togglePause();
      if (e.key === 'r' || e.key === 'R') {
        if (this.gameOver || this.won) { this.hideOverlays(); this.openMainMenu(); }
      }
      if (this.choosingUpgrade && ['1','2','3'].includes(e.key)) {
        this.pickUpgrade(Number(e.key) - 1);
      }
      if (this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) { sfx.ensure(); music.start(); return; }
      if (e.key === ' ' && !e.repeat && this.gameMode !== 'sale') this.player.startCharge();
      if (this.gameMode !== 'sale' && (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') && !e.repeat) {
        const dir = this.getInputDir();
        if (this.player.tryDash(dir.x, dir.y)) { sfx.mode(); this.vibrate(12); this.spawnParticles(this.player.x, this.player.y, 10, '#5dade2', 160, 0.3); }
      }
      if (this.gameMode !== 'sale' && (e.key === 'f' || e.key === 'F' || e.key === 'e' || e.key === 'E') && !e.repeat) {
        if (this.player.trySkill()) { sfx.level(); this.vibrate([20, 30, 20]); this.spawnParticles(this.player.x, this.player.y, 24, '#f1c40f', 220, 0.55); }
      }
      sfx.ensure(); music.start();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key] = false;
      if (e.key === ' ' && this.gameMode !== 'sale' && !(this.paused || this.choosingUpgrade || this.shopping || this.gameOver)) {
        if (this.player.releaseAttack()) { sfx.hit(); this.vibrate(15); }
      }
    });

    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      sfx.ensure(); music.start();
      if (this.gameOver || this.won) return;
      if (this.paused || this.choosingUpgrade || this.shopping) return;
      const rect = canvas.getBoundingClientRect();
      const wpt = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      this.player.angle = angleTo(this.player.x, this.player.y, wpt.x, wpt.y);
      if (this.gameMode === 'sale') return;
      this.mouseAttack = true;
      this.player.startCharge();
    });
    canvas.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      if (!this.mouseAttack) return;
      this.mouseAttack = false;
      if (this.gameMode === 'sale') return;
      if (this.paused || this.choosingUpgrade || this.shopping || this.gameOver) { this.player.charging = false; this.player.charge = 0; return; }
      if (this.player.releaseAttack()) { sfx.hit(); this.vibrate(15); }
    });
    canvas.addEventListener('mouseleave', () => {
      if (this.mouseAttack) {
        this.mouseAttack = false;
        if (this.gameMode !== 'sale' && this.player.releaseAttack()) sfx.hit();
      }
    });
    canvas.addEventListener('mousemove', e => {
      if (this.paused || this.choosingUpgrade || this.shopping || this.gameOver) return;
      const rect = canvas.getBoundingClientRect();
      if (!this.player.attacking) {
        const wpt = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        this.player.angle = angleTo(this.player.x, this.player.y, wpt.x, wpt.y);
      }
    });

    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');
    const attackZone = document.getElementById('attack-zone');
    const attackBtn = document.getElementById('attack-btn');

    joystickZone.addEventListener('touchstart', e => {
      e.preventDefault(); sfx.ensure(); music.start();
      if (this.gameOver || this.won) { this.hideOverlays(); this.resetGame(); return; }
      for (const t of e.changedTouches) {
        if (this.joystickId === null && this.attackTouchId !== t.identifier) {
          this.joystickId = t.identifier; this.joystickActive = true;
          this.joystickBase.x = t.clientX; this.joystickBase.y = t.clientY;
          joystickBase.classList.add('active');
          joystickBase.style.left = (t.clientX - joystickZone.getBoundingClientRect().left - 55) + 'px';
          joystickBase.style.bottom = 'auto';
          joystickBase.style.top = (t.clientY - joystickZone.getBoundingClientRect().top - 55) + 'px';
        }
      }
    }, { passive: false });

    joystickZone.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.joystickId) {
          const dx = t.clientX - this.joystickBase.x, dy = t.clientY - this.joystickBase.y;
          const maxR = 42, d = Math.hypot(dx, dy), clampD = Math.min(d, maxR);
          const nx = d > 0 ? (dx / d) * clampD : 0, ny = d > 0 ? (dy / d) * clampD : 0;
          this.moveDir.x = nx / maxR; this.moveDir.y = ny / maxR;
          joystickThumb.style.transform = `translate(${nx}px, ${ny}px)`;
        }
      }
    }, { passive: false });

    const endJoy = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joystickId) {
          this.joystickId = null; this.joystickActive = false;
          this.moveDir.x = 0; this.moveDir.y = 0;
          joystickThumb.style.transform = ''; joystickBase.classList.remove('active');
        }
      }
    };
    joystickZone.addEventListener('touchend', endJoy);
    joystickZone.addEventListener('touchcancel', endJoy);

    const dashBtn = document.getElementById('dash-btn');
    const skillBtn = document.getElementById('skill-btn');
    this.dashTouchId = null;
    this.skillTouchId = null;

    const touchPos = (t) => {
      const r = attackZone.getBoundingClientRect();
      return { x: t.clientX - r.left, y: t.clientY - r.top, w: r.width, h: r.height };
    };
    const hitBtn = (t, el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return Math.hypot(t.clientX - cx, t.clientY - cy) < Math.max(r.width, r.height) * 0.65;
    };

    attackZone.addEventListener('touchstart', e => {
      e.preventDefault(); sfx.ensure(); music.start();
      if (this.gameOver || this.won) { this.hideOverlays(); this.resetGame(); return; }
      if (this.paused || this.choosingUpgrade || this.shopping) return;
      // В Распродаже атак/дэша/обеда нет — только джойстик на весь экран
      if (this.gameMode === 'sale') return;
      for (const t of e.changedTouches) {
        if (this.joystickId === t.identifier) continue;

        if (this.dashTouchId === null && hitBtn(t, dashBtn)) {
          this.dashTouchId = t.identifier;
          dashBtn.classList.add('pressed');
          const dir = this.getInputDir();
          if (this.player.tryDash(dir.x, dir.y)) { sfx.mode(); this.vibrate(12); this.spawnParticles(this.player.x, this.player.y, 10, '#5dade2', 160, 0.3); }
          continue;
        }
        if (this.skillTouchId === null && hitBtn(t, skillBtn)) {
          this.skillTouchId = t.identifier;
          skillBtn.classList.add('pressed');
          if (this.player.trySkill()) { sfx.level(); this.vibrate([20,30,20]); this.spawnParticles(this.player.x, this.player.y, 24, '#f1c40f', 220, 0.55); }
          continue;
        }
        if (this.attackTouchId === null) {
          this.attackTouchId = t.identifier; this.attackHeld = true;
          attackBtn.classList.add('pressed');
          attackBtn.classList.add('charging');
          this.player.startCharge();
        }
      }
    }, { passive: false });
    const endAtk = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.attackTouchId) {
          this.attackTouchId = null; this.attackHeld = false;
          attackBtn.classList.remove('pressed');
          attackBtn.classList.remove('charging');
          if (this.gameMode !== 'sale' && !(this.paused || this.choosingUpgrade || this.shopping || this.gameOver)) {
            if (this.player.releaseAttack()) { sfx.hit(); this.vibrate(18); }
          } else {
            this.player.charging = false; this.player.charge = 0;
          }
        }
        if (t.identifier === this.dashTouchId) {
          this.dashTouchId = null; dashBtn.classList.remove('pressed');
        }
        if (t.identifier === this.skillTouchId) {
          this.skillTouchId = null; skillBtn.classList.remove('pressed');
        }
      }
    };
    attackZone.addEventListener('touchend', endAtk);
    attackZone.addEventListener('touchcancel', endAtk);
  },

  getInputDir() {
    let dx = this.moveDir.x, dy = this.moveDir.y;
    if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) dx += 1;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    return { x: dx, y: dy };
  },
});
