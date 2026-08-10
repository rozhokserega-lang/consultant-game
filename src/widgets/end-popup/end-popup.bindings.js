/** Экран конца смены. */

Object.assign(Game.prototype, {
  setEndOverlayState(won) {
    const popup = document.getElementById('end-popup');
    if (popup) popup.classList.toggle('end-popup--win', !!won);
  },

  endGame(won, killer = '') {
    this.gameOver = !won;
    this.won = won;
    this.killedBy = killer;
    this.paused = true;
    const isNew = this.score > this.highScore;
    if (isNew) {
      this.highScore = this.score;
    }
    const waveLevel = this.wave || 1;
    if (waveLevel > (this.highWaveLevel || 0)) this.highWaveLevel = waveLevel;
    const ch = CHALLENGES.find(c => c.id === this.selectedChallenge) || CHALLENGES[0];
    let challengeOk = won && ch.id !== 'none' && !this.challengeFailed;
    if (ch.id === 'no_damage' && this.tookDamage) challengeOk = false;
    let bankGain = Math.floor(this.coins * 0.35) + (won ? 15 : 0);
    let challengeBonus = 0;
    if (challengeOk) {
      challengeBonus = ch.bonus || 0;
      bankGain += challengeBonus;
    }
    this.bankCoins += bankGain;
    this.persist();
    this.setEndOverlayState(won);
    document.getElementById('end-title').textContent = won ? 'СМЕНА ЗАКРЫТА!' : 'ВАС УВОЛИЛИ';
    document.getElementById('end-sub').textContent = won
      ? `Все 10 волн пройдены. В банк: +${bankGain}🪙`
      : ((killer ? `Причина: ${killer}. ` : '') + `В банк: +${bankGain}🪙`);
    document.getElementById('end-time').textContent = '00:00';
    document.getElementById('end-wave').textContent = String(waveLevel);
    document.getElementById('end-wave-record').textContent = String(this.highWaveLevel || 0);
    document.getElementById('end-bank').textContent = String(bankGain);
    document.getElementById('end-score').textContent = this.score + ` · 🪙 ${this.coins}`;
    document.getElementById('end-combo').textContent = this.maxCombo;
    document.getElementById('end-record').textContent = this.highScore;
    document.getElementById('end-newrec').style.display = isNew ? 'inline' : 'none';
    const cl = document.getElementById('end-challenge-line');
    if (cl) {
      if (ch.id === 'none') cl.textContent = 'Испытание: не выбрано';
      else if (challengeOk) cl.textContent = `Испытание «${ch.name}» ✅ · бонус +${challengeBonus}🪙`;
      else cl.textContent = `Испытание «${ch.name}» ❌`;
    }
    document.getElementById('end-overlay').classList.add('show');
    this.refreshMusicState();
    if (won) sfx.win(); else sfx.lose();
    this.vibrate(won ? [40, 40, 80] : 80);
  },
});
