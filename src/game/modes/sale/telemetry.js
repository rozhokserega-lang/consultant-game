/**
 * Распродажа: Дев-логи баланса: сбор, хранение и выгрузка в таблицу.
 */
'use strict';

/** Деv-only: логи забегов для анализа баланса */
const SALE_BALANCE_LOG_KEY = 'consultant_balance_logs_v1';
const SALE_BALANCE_LOG_MAX = 40;
const SALE_BALANCE_SHEET_URL_KEY = 'consultant_balance_sheet_url';
const SALE_BALANCE_UPLOADED_KEY = 'consultant_balance_uploaded_v1';
/** URL Google Apps Script Web App для выгрузки balance-логов */
const SALE_BALANCE_SHEET_URL_DEFAULT = 'https://script.google.com/macros/s/AKfycbzXuMcoFPBqmvx4eHZEeY9ocSnSl5Z8P_gar_NOhi7b3lotYqrwWieIaauXQ2ZIYlHC/exec';

function isSaleBalanceLogEnabled() {
  return typeof isDevEnvironment === 'function' && isDevEnvironment();
}

function loadSaleBalanceLogs() {
  try {
    const raw = localStorage.getItem(SALE_BALANCE_LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function saveSaleBalanceLogs(arr) {
  try {
    localStorage.setItem(SALE_BALANCE_LOG_KEY, JSON.stringify(arr.slice(-SALE_BALANCE_LOG_MAX)));
    return true;
  } catch (e) {
    console.warn('balance log save failed', e);
    return false;
  }
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function getSaleBalanceSheetUrl() {
  try {
    const fromLs = localStorage.getItem(SALE_BALANCE_SHEET_URL_KEY);
    if (fromLs && /^https:\/\//.test(fromLs)) return fromLs.trim();
  } catch (_) { /* ignore */ }
  return SALE_BALANCE_SHEET_URL_DEFAULT || '';
}

function setSaleBalanceSheetUrl(url) {
  url = String(url || '').trim();
  if (url && !/^https:\/\//.test(url)) throw new Error('URL должен начинаться с https://');
  try {
    if (url) localStorage.setItem(SALE_BALANCE_SHEET_URL_KEY, url);
    else localStorage.removeItem(SALE_BALANCE_SHEET_URL_KEY);
  } catch (_) { /* ignore */ }
  return getSaleBalanceSheetUrl();
}

function loadUploadedBalanceIds() {
  try {
    const raw = localStorage.getItem(SALE_BALANCE_UPLOADED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function markBalanceUploaded(runId) {
  if (!runId) return;
  const ids = loadUploadedBalanceIds().filter((id) => id !== runId);
  ids.push(runId);
  try {
    localStorage.setItem(SALE_BALANCE_UPLOADED_KEY, JSON.stringify(ids.slice(-200)));
  } catch (_) { /* ignore */ }
}

function isBalanceUploaded(runId) {
  return !!runId && loadUploadedBalanceIds().includes(runId);
}

/**
 * POST в Google Apps Script.
 * text/plain + no-cors — без preflight; ответ opaque, успех = нет сетевой ошибки.
 */
async function uploadSaleBalanceToSheet(run) {
  const url = getSaleBalanceSheetUrl();
  if (!url) {
    throw new Error('Сначала задай URL таблицы: __sale.balance.setSheetUrl(url)');
  }
  if (!run || !run.id) throw new Error('нет данных забега');
  if (isBalanceUploaded(run.id)) return { ok: true, already: true, runId: run.id };

  const body = JSON.stringify({
    run,
    uploadedAt: new Date().toISOString(),
    source: 'consultant-game-dev',
  });

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
  });
  markBalanceUploaded(run.id);
  return { ok: true, runId: run.id, opaque: true };
}

Game.prototype.initSaleBalanceLog = function () {
  if (!isSaleBalanceLogEnabled()) {
    this._saleBal = null;
    return;
  }
  const hero = getSaleHero(this.selectedHeroId);
  this._saleBal = {
    id: 'run_' + Date.now().toString(36),
    version: SALE_VERSION,
    startedAt: new Date().toISOString(),
    hero: hero.id,
    floor: this.saleFloorId || this.selectedFloorId || 'grocery',
    contract: (this.saleContract && this.saleContract.id) || this.selectedContractId || 'none',
    saleV2: !!this.saleV2,
    tree: (this.saleTreeActive || this.saleTreeSelected || []).slice(),
    keysOffered: 0,
    keysTaken: [],
    treePicks: [],
    ubersTaken: [],
    couponsGranted: [],
    overflowPicks: [],
    evoTaken: [],
    metaTaken: [],
    recipeReadyAt: {},
    minutes: [],
    weaponDmg: {},
    bosses: [],
      totals: {
        dmg: 0,
        kills: 0,
        elites: 0,
        xp: 0,
        gold: 0,
        hurt: 0,
        revives: 0,
        hearts: 0,
      },
      _acc: { dmg: 0, kills: 0, elites: 0, xp: 0, gold: 0, hurt: 0, hearts: 0 },
    _lastSampleMin: -1,
    _sampleT: 0,
  };
};

Game.prototype.hookSaleBalancePlayerHurt = function () {
  if (!isSaleBalanceLogEnabled() || !this.player || this.player._saleBalHurtHooked) return;
  const self = this;
  const orig = this.player.takeDamage.bind(this.player);
  this.player.takeDamage = function (fromX, fromY) {
    const before = this.hp;
    const livesBefore = this.extraLives || 0;
    const dead = orig(fromX, fromY);
    if (this._justRevived && (this.extraLives || 0) < livesBefore) {
      // смертельный удар + ревайв: HP вырос, но удар был — считаем hurt и revive
      if (self.recordSaleBalanceHurt) self.recordSaleBalanceHurt(1);
      if (self.recordSaleBalanceRevive) self.recordSaleBalanceRevive();
    } else {
      const lost = Math.max(0, before - this.hp);
      if (lost > 0 && self.recordSaleBalanceHurt) self.recordSaleBalanceHurt(lost);
    }
    return dead;
  };
  this.player._saleBalHurtHooked = true;
};

Game.prototype.recordSaleBalanceV2Event = function (kind, payload) {
  const bal = this._saleBal;
  if (!bal || !kind) return;
  const row = Object.assign({ t: Math.round((this.saleTime || 0) * 10) / 10 }, payload || {});
  if (kind === 'uber') {
    bal.ubersTaken = bal.ubersTaken || [];
    bal.ubersTaken.push(row);
  } else if (kind === 'tree') {
    bal.treePicks = bal.treePicks || [];
    bal.treePicks.push(row);
  } else if (kind === 'coupon') {
    bal.couponsGranted = bal.couponsGranted || [];
    bal.couponsGranted.push(row);
  } else if (kind === 'overflow') {
    bal.overflowPicks = bal.overflowPicks || [];
    bal.overflowPicks.push(row);
  } else if (kind === 'meta') {
    bal.metaTaken = bal.metaTaken || [];
    bal.metaTaken.push(row);
  }
};

Game.prototype.saleBalanceOwnedNodes = function () {
  return Object.keys(this.salePassives || {}).filter((id) => (this.salePassives[id] || 0) > 0);
};

Game.prototype.recordSaleBalanceRevive = function () {
  const bal = this._saleBal;
  if (!bal) return;
  bal.totals.revives = (bal.totals.revives || 0) + 1;
};

Game.prototype.recordSaleBalanceDmg = function (amount, source) {
  const bal = this._saleBal;
  if (!bal || !(amount > 0)) return;
  const src = source || 'other';
  bal.totals.dmg += amount;
  bal._acc.dmg += amount;
  bal.weaponDmg[src] = (bal.weaponDmg[src] || 0) + amount;
};

Game.prototype.recordSaleBalanceHurt = function (amount) {
  const bal = this._saleBal;
  if (!bal || !(amount > 0)) return;
  bal.totals.hurt += amount;
  bal._acc.hurt += amount;
};

Game.prototype.recordSaleBalanceXp = function (amount) {
  const bal = this._saleBal;
  if (!bal || !(amount > 0)) return;
  bal.totals.xp += amount;
  bal._acc.xp += amount;
};

Game.prototype.recordSaleBalanceGold = function (amount) {
  const bal = this._saleBal;
  if (!bal || !(amount > 0)) return;
  bal.totals.gold += amount;
  bal._acc.gold += amount;
};

Game.prototype.recordSaleBalanceKill = function (enemy) {
  const bal = this._saleBal;
  if (!bal || !enemy) return;
  bal.totals.kills += 1;
  bal._acc.kills += 1;
  if (enemy._saleElite) {
    bal.totals.elites += 1;
    bal._acc.elites += 1;
  }
};

Game.prototype.recordSaleBalanceBossKill = function (enemy) {
  const bal = this._saleBal;
  if (!bal || !enemy) return;
  const spawnAt = enemy._saleBossSpawnAt != null ? enemy._saleBossSpawnAt : 0;
  const killAt = this.saleTime || 0;
  bal.bosses.push({
    id: enemy.saleBossId || enemy.type || 'boss',
    name: enemy.nameTag || enemy.saleBossId || 'boss',
    spawnAt: Math.round(spawnAt * 10) / 10,
    killAt: Math.round(killAt * 10) / 10,
    killTimeSec: Math.round(Math.max(0, killAt - spawnAt) * 10) / 10,
    maxHp: enemy.maxHp || 0,
  });
};

Game.prototype.sampleSaleBalanceMinute = function (minute) {
  const bal = this._saleBal;
  if (!bal) return;
  const acc = bal._acc;
  const enemies = (this.enemies || []).filter((e) => e.hp > 0);
  const eliteAlive = enemies.filter((e) => e._saleElite).length;
  const wepShare = {};
  let totalW = 0;
  for (const [k, v] of Object.entries(bal.weaponDmg)) totalW += v;
  if (totalW > 0) {
    for (const [k, v] of Object.entries(bal.weaponDmg)) {
      wepShare[k] = Math.round((1000 * v) / totalW) / 10;
    }
  }
  bal.minutes.push({
    minute,
    t: Math.round((this.saleTime || 0) * 10) / 10,
    level: this.saleLevel || 1,
    hp: this.player ? this.player.hp : 0,
    maxHp: this.player ? this.player.maxHp : 0,
    coins: this.coins || 0,
    dps: Math.round(acc.dmg),
    kills: acc.kills,
    elitesKilled: acc.elites,
    hurt: acc.hurt,
    xp: Math.round(acc.xp),
    gold: Math.round(acc.gold),
    hearts: acc.hearts || 0,
    enemyCount: enemies.length,
    eliteCount: eliteAlive,
    weapons: { ...(this.saleWeapons || {}) },
    passives: { ...(this.salePassives || {}) },
    keys: this.saleV2
      ? (this.saleUbers || []).slice()
      : this.saleBalanceOwnedNodes(),
    tree: this.saleV2
      ? this.saleBalanceOwnedNodes()
      : (this.saleTreeActive || []).slice(),
    ubers: (this.saleUbers || []).slice(),
    overflow: { ...(this.saleOverflow || {}) },
    weaponSharePct: wepShare,
  });
  bal._acc = { dmg: 0, kills: 0, elites: 0, xp: 0, gold: 0, hurt: 0, hearts: 0 };
  bal._lastSampleMin = minute;
};

Game.prototype.tickSaleBalanceLog = function (dt) {
  const bal = this._saleBal;
  if (!bal) return;
  const m = Math.floor((this.saleTime || 0) / 60);
  if (m > (bal._lastSampleMin < 0 ? 0 : bal._lastSampleMin)) {
    this.sampleSaleBalanceMinute(m);
  }
};

Game.prototype.buildSaleBalanceWeaponShare = function () {
  const bal = this._saleBal;
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

Game.prototype.finalizeSaleBalanceLog = function (won, killer) {
  const bal = this._saleBal;
  if (!bal) return null;
  const m = Math.max(0, Math.floor((this.saleTime || 0) / 60));
  const hasAcc = (bal._acc.dmg + bal._acc.kills + bal._acc.hurt + bal._acc.xp + bal._acc.gold) > 0;
  if (hasAcc || bal._lastSampleMin < m) {
    this.sampleSaleBalanceMinute(Math.max(m, 1));
  }
  const survived = this.saleTime || 0;
  const summary = {
    id: bal.id,
    version: bal.version,
    startedAt: bal.startedAt,
    endedAt: new Date().toISOString(),
    won: !!won,
    killer: killer || '',
    survivedSec: Math.round(survived * 10) / 10,
    hero: bal.hero,
    floor: bal.floor,
    contract: bal.contract,
    saleV2: !!(bal.saleV2 || this.saleV2),
    level: this.saleLevel || 1,
    coins: this.coins || 0,
    kills: bal.totals.kills,
    elites: bal.totals.elites,
    hurt: bal.totals.hurt,
    revives: bal.totals.revives || 0,
    dmg: Math.round(bal.totals.dmg),
    xp: Math.round(bal.totals.xp),
    gold: Math.round(bal.totals.gold),
    hearts: bal.totals.hearts || 0,
    avgDps: survived > 0 ? Math.round((bal.totals.dmg / survived) * 10) / 10 : 0,
    weaponsEnd: { ...(this.saleWeapons || {}) },
    passivesEnd: { ...(this.salePassives || {}) },
    overflowEnd: { ...(this.saleOverflow || {}) },
    ubersEnd: (this.saleUbers || []).slice(),
    ubersTaken: bal.ubersTaken || [],
    couponsGranted: bal.couponsGranted || [],
    treePicks: bal.treePicks || [],
    overflowPicks: bal.overflowPicks || [],
    tree: this.saleV2
      ? this.saleBalanceOwnedNodes()
      : (bal.tree || (this.saleTreeActive || []).slice()),
    keysTaken: this.saleV2 ? (bal.treePicks || []) : (bal.keysTaken || []),
    keysOffered: bal.keysOffered || 0,
    evoTaken: bal.evoTaken || [],
    metaTaken: bal.metaTaken || [],
    recipeReadyAt: bal.recipeReadyAt || this._saleRecipeReadyAt || {},
    weaponShare: this.buildSaleBalanceWeaponShare(),
    bosses: bal.bosses,
    minutes: bal.minutes,
    difficulty: {
      weaponDmg: SALE_DIFFICULTY.weaponDmg,
      mul: SALE_DIFFICULTY.mul,
    },
  };
  const logs = loadSaleBalanceLogs();
  logs.push(summary);
  saveSaleBalanceLogs(logs);
  this._saleBalLast = summary;
  this._saleBal = null;
  try {
    console.log('[sale-balance]', summary.id, summary.saleV2 ? 'v2' : 'classic',
      won ? 'WIN' : 'LOSS',
      `t=${summary.survivedSec}s lv=${summary.level} dps=${summary.avgDps}`,
      summary.ubersEnd && summary.ubersEnd.length ? summary.ubersEnd : '',
      summary.weaponShare);
  } catch (_) { /* ignore */ }
  return summary;
};

Game.prototype.refreshSaleBalanceUploadBtn = function () {
  const wrap = document.getElementById('end-balance-upload');
  const btn = document.getElementById('btn-upload-balance');
  const status = document.getElementById('end-balance-status');
  if (!wrap || !btn) return;
  const show = isSaleBalanceLogEnabled() && !!this._saleBalLast;
  wrap.style.display = show ? 'block' : 'none';
  if (!show) return;
  const run = this._saleBalLast;
  const hasUrl = !!getSaleBalanceSheetUrl();
  const uploaded = isBalanceUploaded(run.id);
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
      status.textContent = `${run.won ? 'WIN' : 'LOSS'} · lv${run.level} · ${run.survivedSec}с · dps ${run.avgDps}`;
    }
  }
};

Game.prototype.uploadSaleBalanceLog = async function () {
  const btn = document.getElementById('btn-upload-balance');
  const status = document.getElementById('end-balance-status');
  const run = this._saleBalLast;
  if (!run) return;
  if (!getSaleBalanceSheetUrl()) {
    const url = window.prompt(
      'Вставь URL Google Apps Script (Web app …/exec).\nИнструкция: scripts/balance_sheet_appscript.gs',
      getSaleBalanceSheetUrl() || '',
    );
    if (!url) return;
    try {
      setSaleBalanceSheetUrl(url);
    } catch (e) {
      if (status) status.textContent = String(e.message || e);
      return;
    }
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⬆ Выгружаю…';
  }
  if (status) status.textContent = 'отправляю в Google Sheet…';
  try {
    const res = await uploadSaleBalanceToSheet(run);
    if (btn) {
      btn.textContent = res.already ? '✓ Уже было в таблице' : '✓ Логи выгружены';
      btn.disabled = true;
    }
    if (status) {
      status.textContent = res.opaque
        ? `отправлено (run ${run.id}) — проверь строку в Sheet`
        : `ok · ${run.id}`;
    }
    if (typeof sfx !== 'undefined') sfx.click();
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '☁ Повторить выгрузку';
    }
    if (status) status.textContent = 'ошибка: ' + (e && e.message ? e.message : e);
    console.error('balance upload failed', e);
  }
};
