/**
 * Вылазка: экран поражения / эвакуации с выгрузкой логов.
 */
'use strict';

Game.prototype.showExtractEndOverlay = function (won, killer, opts) {
  opts = opts || {};
  const t = opts.survivedSec != null ? opts.survivedSec : (this.extractRaidTime || 0);
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  const floor = opts.floorDeath != null ? opts.floorDeath : (this.extractFloor || 1);
  const kills = opts.kills != null ? opts.kills : 0;
  const lost = opts.backpackLost != null ? opts.backpackLost : 0;

  this.gameOver = !won;
  this.won = !!won;
  this.killedBy = killer || '';
  this.paused = true;

  this.setEndOverlayState(won);
  document.getElementById('end-title').textContent = won ? 'ЭВАКУАЦИЯ!' : 'ВЫНОС ПРОВАЛЕН';
  let sub = won
    ? `Лут в рюкзаке · этаж ${floor}`
    : ((killer ? `Причина: ${killer}. ` : '') + `Этаж ${floor} · лут сгорел (${lost}🪙)`);
  if (opts.insured) sub += ` · страховка: ${opts.insured}`;
  if (isExtractBalanceLogEnabled && isExtractBalanceLogEnabled() && this._extractBalLast) {
    const share = this._extractBalLast.weaponShare || {};
    const top = Object.entries(share)
      .sort((a, b) => b[1].pct - a[1].pct)
      .slice(0, 2)
      .map(([k, v]) => `${k} ${v.pct}%`)
      .join(', ');
    if (top) sub += ` · log: ${top}`;
  }
  document.getElementById('end-sub').textContent = sub;
  document.getElementById('end-time').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('end-wave').textContent = String(floor);
  document.getElementById('end-wave-record').textContent = String(opts.floorMax != null ? opts.floorMax : floor);
  document.getElementById('end-bank').textContent = String(kills);
  document.getElementById('end-score').textContent = `убийств ${kills} · потеря ${lost}🪙`;
  document.getElementById('end-combo').textContent = String(opts.upgrades != null ? opts.upgrades : 0);
  document.getElementById('end-record').textContent = String(opts.heat != null ? opts.heat : 0);
  document.getElementById('end-newrec').style.display = 'none';
  const cl = document.getElementById('end-challenge-line');
  if (cl) {
    let line = `Режим: Вылазка · жар ${opts.heat != null ? opts.heat : 0} · волн давления ${opts.pressureWaves != null ? opts.pressureWaves : 0}`;
    if (isExtractBalanceLogEnabled && isExtractBalanceLogEnabled()) line += ' · balance log ✓';
    cl.textContent = line;
  }
  const retryLbl = document.querySelector('#btn-retry .button__label');
  if (retryLbl) retryLbl.textContent = won ? 'В парковку' : 'В парковку';
  const againLbl = document.querySelector('#btn-again .button__label');
  if (againLbl) againLbl.textContent = 'В меню';
  if (typeof this.refreshExtractBalanceUploadBtn === 'function') {
    this.refreshExtractBalanceUploadBtn();
  }
  document.getElementById('end-overlay').classList.add('show');
  this.refreshMusicState();
  if (won) sfx.win(); else sfx.lose();
  this.vibrate(won ? [40, 40, 80] : 80);
};
