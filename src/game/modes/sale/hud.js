/**
 * Распродажа: Обновление боевого HUD Распродажи.
 */
'use strict';

Game.prototype.updateSaleHUD = function () {
  const p = this.player;
  if (!p || !this.saleWeapons) return;
  this.$hpFill.style.width = (100 * p.hp / p.maxHp) + '%';
  this.$hpText.textContent = `${p.hp}/${p.maxHp}`;
  this.$xpFill.style.width = (100 * this.saleXp / this.saleXpNext) + '%';
  this.$xpText.textContent = `${this.saleXp}/${this.saleXpNext}`;
  this.$level.textContent = this.saleLevel;
  this.$score.textContent = '🛒 ' + this.score;
  if (this.$coins) this.$coins.textContent = '🪙 ' + this.coins;
  this.updateBattleBar();

  const left = Math.max(0, SALE_DURATION - this.saleTime);
  const m = Math.floor(left / 60);
  const s = Math.floor(left % 60).toString().padStart(2, '0');
  this.$mode.textContent = `⏱ ${m}:${s}`;
  this.$mode.className = 'hud-mode ' + (left < 60 ? 'chase' : 'flee');

  // фаза LN-директора: босс N/6 / до следующего босса / волна·элита
  const bossN = SALE_BOSS_ORDER.length;
  const idx = this.saleBossIdx || 0;
  const aliveBoss = (this.enemies || []).find((e) => e.hp > 0 && e.saleBossId);
  let phaseTxt;
  if (aliveBoss) {
    const shown = Math.min(bossN, Math.max(1, idx));
    phaseTxt = `⚔ Босс ${shown}/${bossN} · ${aliveBoss.nameTag || 'Босс'}`;
  } else if (idx >= bossN) {
    phaseTxt = this.saleActiveEvent
      ? `📣 ${Math.ceil(this.saleActiveEvent.t)}с · финал`
      : '🔥 Финал забега';
  } else {
    const eta = Math.max(0, Math.ceil((this.saleBossT || 0) - (this.saleTime || 0)));
    const waveEta = Math.max(0, Math.ceil(this.saleWaveT || 0));
    const eliteReady = (this.saleTime || 0) >= SALE_ELITE_START;
    phaseTxt = `⏳ Босс ${idx + 1}/${bossN} через ${eta}с · волна ${waveEta}с`
      + (eliteReady ? ' · элита' : '');
    if (this.saleActiveEvent) {
      phaseTxt = `📣 ${Math.ceil(this.saleActiveEvent.t)}с · босс через ${eta}с`;
    }
  }
  this.$wave.textContent = phaseTxt;
  this.$enemies.textContent = `Убито: ${this.waveKills} · Врагов: ${this.enemies.length}`;

  if (this.$combo) this.$combo.style.display = 'none';

  this.tickSaleSynergyAnnounce();

  const tags = [];
  if (this.saleActiveEvent) {
    const ev = this.saleActiveEvent;
    const label = (typeof SALE_EVENT_BANNERS !== 'undefined' && SALE_EVENT_BANNERS[ev.id]) || ev.id;
    const leftEv = Math.max(0, ev.t);
    tags.push(`<span class="buff-tag bad">${label} · ${leftEv.toFixed(0)}с</span>`);
  }
  if (this.saleRoleBan && this.saleRoleBan.t > 0) {
    const role = SALE_ROLE_LABEL[this.saleRoleBan.type] || this.saleRoleBan.type;
    tags.push(`<span class="buff-tag bad">🚫 ${role} ${this.saleRoleBan.t.toFixed(0)}с</span>`);
  }
  if ((this._saleShieldT || 0) > 0) {
    tags.push(`<span class="buff-tag bad">🚧 блок ${this._saleShieldT.toFixed(0)}с</span>`);
  }
  if (this.saleXpEventMul > 1.01) tags.push(`<span class="buff-tag good">✨ XP×${this.saleXpEventMul}</span>`);
  if (this.saleXpEventMul < 0.99) tags.push(`<span class="buff-tag bad">💸 XP×${this.saleXpEventMul}</span>`);
  if (this.saleWeaponDmgMul > 1.01) tags.push(`<span class="buff-tag good">⚔ урон×${this.saleWeaponDmgMul}</span>`);
  if (this.saleFragile) tags.push(`<span class="buff-tag bad">💔 хрупкий</span>`);
  if (this.lightsOut > 0) tags.push(`<span class="buff-tag bad">💡 темнота ${this.lightsOut.toFixed(0)}с</span>`);
  if (this.fireAlarm > 0) tags.push(`<span class="buff-tag bad">🚨 тревога ${this.fireAlarm.toFixed(0)}с</span>`);
  if (this.saleInvulnExcept) tags.push(`<span class="buff-tag bad">📋 только ${this.saleInvulnExcept}</span>`);
  this.$buffBar.innerHTML = tags.join('');

  if (this.$skillFill) this.$skillFill.style.width = (100 * p.skill / p.skillMax) + '%';
  if (this.$chargeFill) this.$chargeFill.style.width = '0%';

  // HP-бар уникального босса ТЦ
  if (!this.$bossBar) {
    this.$bossBar = document.getElementById('sale-boss-bar');
    this.$bossName = document.getElementById('sale-boss-name');
    this.$bossFill = document.getElementById('sale-boss-fill');
  }
  if (this.$bossBar) {
    let boss = null;
    for (const e of this.enemies) {
      if (e.hp > 0 && e.saleBossId && (!boss || e.maxHp > boss.maxHp)) boss = e;
    }
    const show = !!boss && !this.isBoostersOpen() && !this.gameOver && !this.won;
    this.$bossBar.classList.toggle('show', show);
    if (show) {
      const def = SALE_BOSS_DEFS[boss.saleBossId];
      this.$bossName.textContent = `${def ? def.name : boss.nameTag || 'Босс'} · фаза ${boss.bossPhase || 1}`;
      this.$bossFill.style.width = (100 * boss.hp / Math.max(1, boss.maxHp)) + '%';
    }
  }

  // синхронизация кнопки скорости (дев-панель тоже меняет timescale)
  if (!this.$speedBtn) this.$speedBtn = document.getElementById('btn-speed');
  if (this.$speedBtn) {
    const ts = this.__saleTimeScale || 1;
    const label = ts > 1.01 ? `▶▶ ×${ts}` : '▶ ×1';
    if (this.$speedBtn.textContent !== label) this.$speedBtn.textContent = label;
  }
};
