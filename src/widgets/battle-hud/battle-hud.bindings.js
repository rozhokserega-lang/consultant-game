/** Верхняя строка боя и легаси-HUD: что игра в них пишет. */

Object.assign(Game.prototype, {
  cacheHud() {
    this.$hpFill = document.getElementById('hud-hp-fill');
    this.$hpText = document.getElementById('hud-hp-text');
    this.$xpFill = document.getElementById('hud-xp-fill');
    this.$xpText = document.getElementById('hud-xp-text');
    this.$level = document.getElementById('hud-level');
    this.$score = document.getElementById('hud-score');
    this.$coins = document.getElementById('hud-coins');
    this.$mode = document.getElementById('hud-mode');
    this.$wave = document.getElementById('hud-wave');
    this.$enemies = document.getElementById('hud-enemies');
    this.$combo = document.getElementById('hud-combo');
    this.$buffBar = document.getElementById('buff-bar');
    this.$battleCoins = document.getElementById('battle-coins');
    this.$battleTime = document.getElementById('battle-time');
    this.$battleXpFill = document.getElementById('battle-xp-fill');
    this.$battleXpLevel = document.getElementById('battle-xp-level');
  },

  formatBattleCoins(n) {
    return Math.floor(n || 0).toLocaleString('ru-RU');
  },

  formatBattleElapsed(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return m + ':' + s;
  },

  updateBattleBar() {
    if (this.$battleCoins) {
      this.$battleCoins.textContent = this.formatBattleCoins(this.coins);
    }
    if (this.$battleTime) {
      const elapsed = this.gameMode === 'sale' ? (this.saleTime || 0) : 0;
      this.$battleTime.textContent = this.formatBattleElapsed(elapsed);
    }
    if (this.gameMode === 'sale' && this.saleWeapons) {
      const xpRow = document.querySelector('.battle-bar__xp-row');
      if (xpRow) xpRow.setAttribute('aria-hidden', 'false');
      if (this.$battleXpFill) {
        const pct = Math.min(100, 100 * (this.saleXp || 0) / Math.max(1, this.saleXpNext || 1));
        this.$battleXpFill.style.width = pct + '%';
      }
      if (this.$battleXpLevel) {
        this.$battleXpLevel.textContent = '★' + (this.saleLevel || 1);
      }
    }
  },

  showEventBanner(text, dur = 2.2) {
    this._eventBanner = { text, t: dur };
  },

  updateHUD() {
    const p = this.player;
    this.$hpFill.style.width = (100 * p.hp / p.maxHp) + '%';
    this.$hpText.textContent = `${p.hp}/${p.maxHp}`;
    this.$xpFill.style.width = (100 * p.xp / p.xpToNext) + '%';
    this.$xpText.textContent = `${p.xp}/${p.xpToNext}`;
    this.$level.textContent = p.level;
    this.$score.textContent = '🔨 ' + this.score;
    if (this.$coins) this.$coins.textContent = '🪙 ' + this.coins;
    this.updateBattleBar();
    const sk = document.getElementById('hud-skill-fill');
    const ch = document.getElementById('hud-charge-fill');
    if (sk) sk.style.width = (100 * p.skill / p.skillMax) + '%';
    if (ch) ch.style.width = (100 * (p.charging ? p.charge : 0)) + '%';
    const dashBtn = document.getElementById('dash-btn');
    const skillBtn = document.getElementById('skill-btn');
    if (dashBtn) {
      const noDash = (p.dashChargesMax || 1) > 1
        ? (p.dashCharges || 0) <= 0
        : (p.dashCd > 0 || p.dashTime > 0);
      dashBtn.classList.toggle('cd', noDash || p.dashTime > 0);
    }
    if (skillBtn) {
      skillBtn.classList.toggle('ready', p.skill >= p.skillMax);
      skillBtn.classList.toggle('cd', p.skill < p.skillMax);
    }
    const bossAlive = this.enemies.find(e => e.hp > 0 && (e.type === 'boss' || e.type === 'miniboss' || e.type === 'director'));
    this.$wave.textContent = this.wavePhase === 'boss'
      ? `🌊 В${this.wave} · ${(bossAlive && bossAlive.nameTag) || 'БОСС'}`
      : (this.blackFriday ? `🖤 В${this.wave}/${SHIFT_WAVES}` : `🌊 Волна ${this.wave}/${SHIFT_WAVES}`);
    this.$enemies.textContent = this.wavePhase === 'boss'
      ? (bossAlive ? `❤ ${Math.max(0, Math.ceil(bossAlive.hp))}` : 'Босс!')
      : `Убито ${this.waveKills}/${this.killsPerWave}`;
    const rem = Math.max(0, this.MODE_DURATION - this.modeTimer).toFixed(1);
    if (this.isChaseMode) {
      // isChaseMode = час пик (rush)
      this.$mode.textContent = '🔴 ПИК ' + rem + 'с';
      this.$mode.className = 'hud-mode chase';
    } else {
      this.$mode.textContent = '🔵 СМЕНА ' + rem + 'с';
      this.$mode.className = 'hud-mode flee';
    }
    if (this.combo >= 2) {
      this.$combo.classList.add('on');
      this.$combo.textContent = `🔥 x${this.combo}`;
    } else {
      this.$combo.classList.remove('on');
      this.$combo.textContent = '🔥 x0';
    }

    const tags = [];
    if (p.lunchTimer > 0) {
      const teaNote = p.teaDamageBonus ? ' +урон' : '';
      tags.push(`<span class="buff-tag good">☕ Обед ${p.lunchTimer.toFixed(1)}с${teaNote}</span>`);
    }
    if (p.slowTimer > 0) tags.push(`<span class="buff-tag bad">📋 Жалоба ${p.slowTimer.toFixed(1)}с</span>`);
    if (p.muteAttack > 0) tags.push(`<span class="buff-tag bad">🤐 Без удара ${p.muteAttack.toFixed(1)}с</span>`);
    if (p.shameTimer > 0) tags.push(`<span class="buff-tag bad">📸 Стыд ${p.shameTimer.toFixed(1)}с</span>`);
    if (this.blackFriday) tags.push(`<span class="buff-tag good">🖤 Чёрная пятница ×2</span>`);
    if (this.comboShield > 0) tags.push(`<span class="buff-tag good">🔥 Комбо-щит ${this.comboShield.toFixed(0)}с</span>`);
    if (p.tempWeapon && p.tempWeaponTimer > 0) {
      tags.push(`<span class="buff-tag good">${p.tempWeapon.ico} ${p.tempWeapon.name} ${p.tempWeaponTimer.toFixed(0)}с</span>`);
    }
    if (this.fireAlarm > 0) tags.push(`<span class="buff-tag bad">🚨 Тревога ${this.fireAlarm.toFixed(0)}с</span>`);
    if (this.lightsOut > 0) tags.push(`<span class="buff-tag bad">💡 Темнота ${this.lightsOut.toFixed(0)}с</span>`);
    this.$buffBar.innerHTML = tags.join('');
  },
});
