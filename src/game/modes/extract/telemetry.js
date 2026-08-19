/**
 * Вылазка: дев-логи забегов — сбор, хранение, выгрузка в Google Sheet (лист extract_runs).
 */
'use strict';

const EXTRACT_BALANCE_LOG_KEY = 'consultant_extract_balance_logs_v1';
const EXTRACT_BALANCE_LOG_MAX = 40;
const EXTRACT_BALANCE_UPLOADED_KEY = 'consultant_extract_balance_uploaded_v1';

function isExtractBalanceLogEnabled() {
  return typeof isDevEnvironment === 'function' && isDevEnvironment();
}

function loadExtractBalanceLogs() {
  try {
    const raw = localStorage.getItem(EXTRACT_BALANCE_LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function saveExtractBalanceLogs(arr) {
  try {
    localStorage.setItem(EXTRACT_BALANCE_LOG_KEY, JSON.stringify(arr.slice(-EXTRACT_BALANCE_LOG_MAX)));
    return true;
  } catch (e) {
    console.warn('extract balance log save failed', e);
    return false;
  }
}

function loadExtractUploadedIds() {
  try {
    const raw = localStorage.getItem(EXTRACT_BALANCE_UPLOADED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function markExtractBalanceUploaded(runId) {
  if (!runId) return;
  const ids = loadExtractUploadedIds().filter((id) => id !== runId);
  ids.push(runId);
  try {
    localStorage.setItem(EXTRACT_BALANCE_UPLOADED_KEY, JSON.stringify(ids.slice(-200)));
  } catch (_) { /* ignore */ }
}

function isExtractBalanceUploaded(runId) {
  return !!runId && loadExtractUploadedIds().includes(runId);
}

async function uploadExtractBalanceToSheet(run) {
  const url = typeof getSaleBalanceSheetUrl === 'function' ? getSaleBalanceSheetUrl() : '';
  if (!url) {
    throw new Error('Сначала задай URL таблицы: __sale.balance.setSheetUrl(url)');
  }
  if (!run || !run.id) throw new Error('нет данных забега');
  if (isExtractBalanceUploaded(run.id)) return { ok: true, already: true, runId: run.id };

  const body = JSON.stringify({
    run,
    mode: 'extract',
    uploadedAt: new Date().toISOString(),
    source: 'consultant-game-dev',
  });

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
  });
  markExtractBalanceUploaded(run.id);
  return { ok: true, runId: run.id, opaque: true };
}

Game.prototype.initExtractBalanceLog = function () {
  if (!isExtractBalanceLogEnabled()) {
    this._extractBal = null;
    return;
  }
  const starter = (this.extractMeta && this.extractMeta.starterWeapon) || EXTRACT_DEFAULT_STARTER;
  this._extractBal = {
    id: 'xrun_' + Date.now().toString(36),
    mode: 'extract',
    version: EXTRACT_VERSION,
    startedAt: new Date().toISOString(),
    starterWeapon: starter,
    floorMax: this.extractFloor || 1,
    floors: [{ floor: this.extractFloor || 1, atSec: 0 }],
    samples: [],
    weaponDmg: {},
    bosses: [],
    totals: {
      dmg: 0,
      kills: 0,
      elites: 0,
      bosses: 0,
      hurt: 0,
      revives: 0,
      lootValue: 0,
    },
    _acc: { dmg: 0, kills: 0, elites: 0, hurt: 0 },
    _lastSampleMin: -1,
  };
};

Game.prototype.recordExtractFloorAscend = function (floor) {
  const bal = this._extractBal;
  if (!bal) return;
  bal.floorMax = Math.max(bal.floorMax || 1, floor | 0);
  bal.floors = bal.floors || [];
  bal.floors.push({
    floor: floor | 0,
    atSec: Math.round((this.extractRaidTime || 0) * 10) / 10,
  });
};

Game.prototype.hookExtractBalancePlayerHurt = function () {
  if (!isExtractBalanceLogEnabled() || !this.player || this.player._extractBalHurtHooked) return;
  const self = this;
  const orig = this.player.takeDamage.bind(this.player);
  this.player.takeDamage = function (fromX, fromY, amount) {
    const before = this.hp;
    const livesBefore = this.extraLives || 0;
    const dead = orig(fromX, fromY, amount);
    if (this._justRevived && (this.extraLives || 0) < livesBefore) {
      if (self.recordExtractBalanceHurt) self.recordExtractBalanceHurt(1);
      if (self.recordExtractBalanceRevive) self.recordExtractBalanceRevive();
    } else {
      const lost = Math.max(0, before - this.hp);
      if (lost > 0 && self.recordExtractBalanceHurt) self.recordExtractBalanceHurt(lost);
    }
    return dead;
  };
  this.player._extractBalHurtHooked = true;
};

Game.prototype.recordExtractBalanceRevive = function () {
  const bal = this._extractBal;
  if (!bal) return;
  bal.totals.revives = (bal.totals.revives || 0) + 1;
};

Game.prototype.recordExtractBalanceDmg = function (amount, source) {
  const bal = this._extractBal;
  if (!bal || !(amount > 0)) return;
  const src = source || 'other';
  bal.totals.dmg += amount;
  bal._acc.dmg += amount;
  bal.weaponDmg[src] = (bal.weaponDmg[src] || 0) + amount;
};

Game.prototype.recordExtractBalanceHurt = function (amount) {
  const bal = this._extractBal;
  if (!bal || !(amount > 0)) return;
  bal.totals.hurt += amount;
  bal._acc.hurt += amount;
};

Game.prototype.recordExtractBalanceKill = function (enemy) {
  const bal = this._extractBal;
  if (!bal || !enemy) return;
  bal.totals.kills += 1;
  bal._acc.kills += 1;
  if (enemy._extractElite) {
    bal.totals.elites += 1;
    bal._acc.elites += 1;
  }
  if (enemy._extractExitBoss) {
    bal.totals.bosses += 1;
    bal.bosses.push({
      id: enemy._extractId || enemy.type || 'boss',
      name: enemy.nameTag || 'босс',
      floor: this.extractFloor || 1,
      killAt: Math.round((this.extractRaidTime || 0) * 10) / 10,
    });
  }
};

Game.prototype.sampleExtractBalanceMinute = function (minute) {
  const bal = this._extractBal;
  if (!bal) return;
  const acc = bal._acc;
  bal.samples.push({
    minute,
    t: Math.round((this.extractRaidTime || 0) * 10) / 10,
    floor: this.extractFloor || 1,
    hp: this.player ? this.player.hp : 0,
    maxHp: this.player ? this.player.maxHp : 0,
    backpackValue: typeof this.getExtractBackpackValue === 'function' ? this.getExtractBackpackValue() : 0,
    heat: typeof this.getExtractHeatLevel === 'function' ? this.getExtractHeatLevel() : 0,
    dps: Math.round(acc.dmg),
    kills: acc.kills,
    elites: acc.elites,
    hurt: acc.hurt,
    pressureWaves: this._extractPressureTicks || 0,
    upgrades: this.extractRaidUpgrades || 0,
    weapons: { ...(this.saleWeapons || {}) },
  });
  bal._acc = { dmg: 0, kills: 0, elites: 0, hurt: 0 };
  bal._lastSampleMin = minute;
};

Game.prototype.tickExtractBalanceLog = function (dt) {
  const bal = this._extractBal;
  if (!bal || this.extractPhase !== 'raid') return;
  const m = Math.floor((this.extractRaidTime || 0) / 60);
  if (m > (bal._lastSampleMin < 0 ? 0 : bal._lastSampleMin)) {
    this.sampleExtractBalanceMinute(m);
  }
};

Game.prototype.buildExtractBalanceWeaponShare = function () {
  const bal = this._extractBal;
  if (!bal) return {};
  const out = {};
  let total = 0;
  for (const v of Object.values(bal.weaponDmg)) total += v;
  if (total <= 0) return out;
  for (const [k, v] of Object.entries(bal.weaponDmg)) {
    out[k] = {
      dmg: Math.round(v),
      pct: Math.round((1000 * v) / total) / 10,
    };
  }
  return out;
};

Game.prototype.finalizeExtractBalanceLog = function (won, killer, extras) {
  extras = extras || {};
  const bal = this._extractBal;
  if (!bal) return null;
  const t = this.extractRaidTime || 0;
  const m = Math.max(0, Math.floor(t / 60));
  const hasAcc = (bal._acc.dmg + bal._acc.kills + bal._acc.hurt) > 0;
  if (hasAcc || bal._lastSampleMin < m) {
    this.sampleExtractBalanceMinute(Math.max(m, 1));
  }
  const summary = {
    id: bal.id,
    mode: 'extract',
    version: bal.version,
    startedAt: bal.startedAt,
    endedAt: new Date().toISOString(),
    won: !!won,
    killer: killer || '',
    floorDeath: extras.floorDeath != null ? extras.floorDeath : (this.extractFloor || 1),
    floorMax: Math.max(bal.floorMax || 1, extras.floorDeath || this.extractFloor || 1),
    survivedSec: Math.round(t * 10) / 10,
    starterWeapon: bal.starterWeapon,
    kills: bal.totals.kills,
    elites: bal.totals.elites,
    bosses: bal.totals.bosses,
    hurt: bal.totals.hurt,
    revives: bal.totals.revives || 0,
    dmg: Math.round(bal.totals.dmg),
    avgDps: t > 0 ? Math.round((bal.totals.dmg / t) * 10) / 10 : 0,
    backpackLost: extras.backpackLost || 0,
    heat: extras.heat != null ? extras.heat : (typeof this.getExtractHeatLevel === 'function' ? this.getExtractHeatLevel() : 0),
    pressureWaves: extras.pressureWaves != null ? extras.pressureWaves : (this._extractPressureTicks || 0),
    upgrades: extras.upgrades != null ? extras.upgrades : (this.extractRaidUpgrades || 0),
    insured: extras.insured || '',
    weaponsEnd: { ...(this.saleWeapons || {}) },
    weaponShare: this.buildExtractBalanceWeaponShare(),
    bossesKilled: bal.bosses,
    floors: bal.floors || [],
    samples: bal.samples,
  };
  const logs = loadExtractBalanceLogs();
  logs.push(summary);
  saveExtractBalanceLogs(logs);
  this._extractBalLast = summary;
  this._extractBal = null;
  try {
    console.log('[extract-balance]', summary.id, won ? 'EVAC' : 'DEATH',
      `f=${summary.floorDeath} t=${summary.survivedSec}s dps=${summary.avgDps}`);
  } catch (_) { /* ignore */ }
  return summary;
};

Game.prototype.refreshExtractBalanceUploadBtn = function () {
  const wrap = document.getElementById('end-balance-upload');
  const btn = document.getElementById('btn-upload-balance');
  const status = document.getElementById('end-balance-status');
  if (!wrap || !btn) return;
  const show = isExtractBalanceLogEnabled() && !!this._extractBalLast;
  wrap.style.display = show ? 'block' : 'none';
  if (!show) return;
  const run = this._extractBalLast;
  const hasUrl = typeof getSaleBalanceSheetUrl === 'function' && !!getSaleBalanceSheetUrl();
  const uploaded = isExtractBalanceUploaded(run.id);
  btn.disabled = false;
  if (!hasUrl) {
    btn.textContent = '⚙️ Сначала задай URL таблицы';
    if (status) status.textContent = 'В дев-панели: Balance log → URL таблицы';
  } else if (uploaded) {
    btn.textContent = '✓ Логи уже в таблице';
    btn.disabled = true;
    if (status) status.textContent = run.id;
  } else {
    btn.textContent = '☁ Выгрузить логи';
    if (status) {
      status.textContent = `${run.won ? 'EVAC' : 'DEATH'} · этаж ${run.floorDeath} · ${run.survivedSec}с · dps ${run.avgDps}`;
    }
  }
};

Game.prototype.uploadExtractBalanceLog = async function () {
  const btn = document.getElementById('btn-upload-balance');
  const status = document.getElementById('end-balance-status');
  const run = this._extractBalLast;
  if (!run) return;
  const urlFn = typeof getSaleBalanceSheetUrl === 'function' ? getSaleBalanceSheetUrl : () => '';
  if (!urlFn()) {
    const url = window.prompt(
      'Вставь URL Google Apps Script (Web app …/exec).\nИнструкция: tools/balance_sheet_appscript.gs',
      urlFn() || '',
    );
    if (!url) return;
    try {
      if (typeof setSaleBalanceSheetUrl === 'function') setSaleBalanceSheetUrl(url);
    } catch (e) {
      if (status) status.textContent = String(e.message || e);
      return;
    }
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⬆ Выгружаю…';
  }
  if (status) status.textContent = 'отправляю в Google Sheet (extract_runs)…';
  try {
    const res = await uploadExtractBalanceToSheet(run);
    if (btn) {
      btn.textContent = res.already ? '✓ Уже было в таблице' : '✓ Логи выгружены';
      btn.disabled = true;
    }
    if (status) {
      status.textContent = res.opaque
        ? `отправлено (run ${run.id}) — проверь лист extract_runs`
        : `ok · ${run.id}`;
    }
    if (typeof sfx !== 'undefined') sfx.click();
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '☁ Повторить выгрузку';
    }
    if (status) status.textContent = 'ошибка: ' + (e && e.message ? e.message : e);
    console.error('extract balance upload failed', e);
  }
};
