/**
 * Распродажа: Завершение забега: итоги, награды, экран конца.
 */
'use strict';

Game.prototype.endSaleGame = function (won, killer) {
  this.finalizeSaleBalanceLog(won, killer);
  this.gameOver = !won;
  this.won = won;
  this.killedBy = killer || '';
  this.paused = true;
  const isNew = this.score > this.highScore;
  if (isNew) this.highScore = this.score;

  const survived = Math.min(SALE_DURATION, this.saleTime);
  const mins = Math.floor(survived / 60);
  const secs = Math.floor(survived % 60);
  let bankGain = Math.floor(this.coins * 0.4) + Math.floor(survived / 30) + (won ? 40 : Math.floor(survived / 60) * 3);
  bankGain = Math.floor(bankGain * (1 + (this.salePassives.wallet || 0) * 0.1));
  const contractMul = (this.saleContract && this.saleContract.coinMul) || 1;
  bankGain = Math.floor(bankGain * contractMul);
  const waveLevel = this.saleLevel || 1;
  if (waveLevel > (this.highWaveLevel || 0)) this.highWaveLevel = waveLevel;
  this.bankCoins += bankGain;
  const matGain = this._gearRunMatGain || 0;
  const kpiGain = this._gearRunKpiGain || 0;
  this.persist();

  let subExtra = '';
  if (matGain > 0 || kpiGain > 0) {
    const bits = [];
    if (matGain > 0) bits.push('мат. +' + matGain);
    if (kpiGain > 0) bits.push('KPI +' + kpiGain);
    subExtra = ' · ' + bits.join(', ');
  }
  if (isSaleBalanceLogEnabled() && this._saleBalLast) {
    const share = this._saleBalLast.weaponShare || {};
    const top = Object.entries(share)
      .sort((a, b) => b[1].pct - a[1].pct)
      .slice(0, 3)
      .map(([k, v]) => `${k} ${v.pct}%`)
      .join(', ');
    if (top) subExtra += ` · log: ${top}`;
  }
  this.setEndOverlayState(won);
  document.getElementById('end-title').textContent = won ? 'РАСПРОДАЖА ЗАКРЫТА!' : 'ВАС РАСТОПТАЛИ';
  document.getElementById('end-sub').textContent = won
    ? `Продержался 20:00. В банк: +${bankGain}🪙${subExtra}`
    : `${killer ? 'Причина: ' + killer + '. ' : ''}Время ${mins}:${String(secs).padStart(2, '0')}. В банк: +${bankGain}🪙${subExtra}`;
  document.getElementById('end-time').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('end-wave').textContent = String(waveLevel);
  document.getElementById('end-wave-record').textContent = String(this.highWaveLevel || 0);
  document.getElementById('end-bank').textContent = String(bankGain);
  document.getElementById('end-score').textContent = this.score + ` · 🪙 ${this.coins}`;
  document.getElementById('end-combo').textContent = this.waveKills;
  document.getElementById('end-record').textContent = this.highScore;
  document.getElementById('end-newrec').style.display = isNew ? 'inline' : 'none';
  const cl = document.getElementById('end-challenge-line');
  if (cl) {
    let line = `Режим: Распродажа · оружий: ${Object.keys(this.saleWeapons).length}`;
    if (isSaleBalanceLogEnabled()) line += ' · balance log ✓';
    cl.textContent = line;
  }
  const retryLbl = document.querySelector('#btn-retry .button__label');
  if (retryLbl) retryLbl.textContent = 'Попробовать ещё раз';
  const againLbl = document.querySelector('#btn-again .button__label');
  if (againLbl) againLbl.textContent = 'В меню';
  this.refreshSaleBalanceUploadBtn();
  document.getElementById('end-overlay').classList.add('show');
  this.refreshMusicState();
  if (won) sfx.win(); else sfx.lose();
  this.vibrate(won ? [40, 40, 80] : 80);
};
