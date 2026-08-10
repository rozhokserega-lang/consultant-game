/**
 * Распродажа: Дев-панель и window.__sale — только в dev-окружении.
 */
(function () {
  'use strict';

  // ─── Debug API + UI panel (по мотивам LONG NIGHT) ─────────────
  function fmtSaleClock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return m + ':' + s;
  }

  function saleDevEnsureRun() {
    const g = window.game;
    if (!g) return null;
    if ((g.isBoostersOpen && g.isBoostersOpen()) || g.inMainMenu || g.gameMode !== 'sale' || !g.player) {
      g.gameMode = 'sale';
      g.startShiftFromHub();
      g.__god = true;
    }
    return g;
  }

  function buildSaleDevPanel() {
    const panel = document.getElementById('sale-dev-panel');
    if (!panel) return;
    const g = window.game;
    const bq = (act, arg, label) =>
      `<button type="button" class="dvb" data-act="${act}"${arg != null ? ` data-arg="${arg}"` : ''}>${label}</button>`;
    const H = (t) => `<div class="dvh">${t}</div>`;
    const R = (s) => `<div class="dvrow">${s}</div>`;
    const enemyTypes = ['normal', 'fast', 'tank', 'fatty', 'manager', 'returner', 'boss', 'director', 'miniboss'];
    const wepIds = Object.keys(SALE_WEAPONS).filter((id) => !SALE_WEAPONS[id].evolved);
    const info = g
      ? `t=${fmtSaleClock(g.saleTime)} · lv=${g.saleLevel || 0} · 🪙${g.coins || 0} · mobs=${(g.enemies || []).filter((e) => e.hp > 0).length} · god=${g.__god ? 'ON' : 'off'} · ×${g.__saleTimeScale || 1}`
      : 'game не готов';
    panel.innerHTML =
      bq('close', null, '✕ закрыть') +
      `<h3>DEV · Распродажа · v${SALE_VERSION}</h3>` +
      `<div id="sale-dev-info">${info}</div>` +
      H('Старт') +
      R(bq('start', null, 'старт / рестарт') + bq('hub', null, 'усилители')) +
      H('Время') +
      R(
        bq('warp', 60, '+1 мин') +
          bq('warp', 180, '+3 мин') +
          bq('warp', 600, '+10 мин') +
          bq('warpto', 0, '0:00') +
          bq('warpto', 300, '5:00') +
          bq('warpto', 900, '15:00'),
      ) +
      H('Скорость') +
      R(bq('ts', 0.5, '0.5×') + bq('ts', 1, '1×') + bq('ts', 2, '2×') + bq('ts', 3, '3×')) +
      H('Прокачка') +
      R(bq('lvl', 1, '+1 ур') + bq('lvl', 5, '+5 ур') + bq('gold', 500, '+500 🪙') + bq('bank', 1000, '+1000 банк')) +
      H('Читы') +
      R(bq('god', null, 'бог-мод') + bq('heal', null, 'хил') + bq('killall', null, 'убить всех') + bq('killself', null, 'убить себя')) +
      H('Спавн ×15') +
      R(enemyTypes.map((t) => bq('spawn', t, t)).join('')) +
      H('Боссы ТЦ') +
      R(
        bq('boss', 'discount_king', 'Король скидок') +
          bq('boss', 'security_chief', 'Охрана') +
          bq('boss', 'mall_closing', 'Закрытие ТЦ'),
      ) +
      H('Пауэрапы') +
      R(
        bq('powerup', 'chest', '📦 посылка') +
          bq('powerup', 'magnet', '🧲 магнит') +
          bq('powerup', 'bomb', '🧨 хлопушка') +
          bq('powerup', 'heart', '❤️ сердце'),
      ) +
      H('Оружие +1') +
      R(wepIds.map((id) => bq('wpn', id, SALE_WEAPONS[id].ico + ' ' + SALE_WEAPONS[id].name)).join('')) +
      H('Balance log') +
      R(
        bq('baldump', null, 'лог в консоль') +
          bq('baldl', null, 'скачать JSON') +
          bq('ballast', null, 'последний забег') +
          bq('balclear', null, 'очистить логи'),
      ) +
      R(
        bq('balsheet', null, 'URL таблицы') +
          bq('balup', null, 'выгрузить последний') +
          bq('balurl', null, getSaleBalanceSheetUrl() ? 'URL ✓ задан' : 'URL не задан'),
      );
  }

  function saleDevAction(act, arg) {
    const g = window.game;
    const info = (msg) => {
      const el = document.getElementById('sale-dev-info');
      if (el) el.textContent = msg;
    };
    switch (act) {
      case 'close':
        toggleSaleDev(false);
        break;
      case 'start':
        saleDevEnsureRun();
        toggleSaleDev(false);
        break;
      case 'hub':
        if (g) {
          g.__saleDevOpen = false;
          g.openBoosters();
        }
        toggleSaleDev(false);
        break;
      case 'warp': {
        const run = saleDevEnsureRun();
        if (!run) break;
        run.saleTime = Math.min(SALE_DURATION - 1, (run.saleTime || 0) + (+arg || 0));
        info(`время ${fmtSaleClock(run.saleTime)}`);
        break;
      }
      case 'warpto': {
        const run = saleDevEnsureRun();
        if (!run) break;
        run.saleTime = Math.max(0, Math.min(SALE_DURATION - 1, +arg || 0));
        info(`время ${fmtSaleClock(run.saleTime)}`);
        break;
      }
      case 'ts':
        if (g) {
          g.__saleTimeScale = +arg || 1;
          info(`скорость ×${g.__saleTimeScale}`);
        }
        break;
      case 'lvl': {
        const run = saleDevEnsureRun();
        if (!run) break;
        const n = Math.max(1, +arg || 1);
        for (let i = 0; i < n; i++) run.gainSaleXp(run.saleXpNext || 99);
        info(`уровень ${run.saleLevel}`);
        break;
      }
      case 'gold': {
        if (!g) break;
        g.coins = (g.coins || 0) + (+arg || 0);
        info(`монеты забега ${g.coins}`);
        break;
      }
      case 'bank': {
        if (!g) break;
        g.bankCoins = (g.bankCoins || 0) + (+arg || 0);
        g.persist && g.persist();
        g.renderHub && g.isBoostersOpen && g.isBoostersOpen() && g.renderHub();
        info(`банк ${g.bankCoins}`);
        break;
      }
      case 'god': {
        const run = saleDevEnsureRun();
        if (!run) break;
        run.__god = !run.__god;
        if (run.__god && run.player) run.player.hp = run.player.maxHp;
        info(`бог-мод ${run.__god ? 'ON' : 'off'}`);
        break;
      }
      case 'heal': {
        const run = saleDevEnsureRun();
        if (run && run.player) {
          run.player.hp = run.player.maxHp;
          info('хил full');
        }
        break;
      }
      case 'killall': {
        const run = window.game;
        if (!run || !run.enemies) break;
        for (const e of run.enemies) e.hp = 0;
        run.enemies = run.enemies.filter((e) => e.hp > 0);
        info('враги очищены');
        break;
      }
      case 'killself': {
        const run = window.game;
        if (!run || !run.player) break;
        run.__god = false;
        run.player.hp = 0;
        run.endSaleGame(false);
        toggleSaleDev(false);
        break;
      }
      case 'spawn': {
        const run = saleDevEnsureRun();
        if (!run) break;
        for (let i = 0; i < 15; i++) run.spawnSaleEnemy(arg || null);
        info(`спавн ${arg} ×15`);
        break;
      }
      case 'boss': {
        const run = saleDevEnsureRun();
        if (!run || !arg || !SALE_BOSS_DEFS[arg]) break;
        run.saleBossSpawned = run.saleBossSpawned || {};
        run.saleBossSpawned[arg] = false;
        const b = run.spawnSaleBoss(arg, { near: true });
        info(b ? `босс ${SALE_BOSS_DEFS[arg].name}` : 'не удалось заспавнить');
        break;
      }
      case 'powerup': {
        const run = saleDevEnsureRun();
        if (!run || !run.player) break;
        run.spawnSalePowerup(run.player.x + 60, run.player.y, arg || 'chest');
        info(`пауэрап ${arg}`);
        break;
      }
      case 'wpn': {
        const run = saleDevEnsureRun();
        if (!run || !arg || !SALE_WEAPONS[arg]) break;
        const max = SALE_WEAPONS[arg].max || 5;
        run.saleWeapons = run.saleWeapons || {};
        run.saleWeapons[arg] = Math.min(max, (run.saleWeapons[arg] || 0) + 1);
        info(`${SALE_WEAPONS[arg].name} lv${run.saleWeapons[arg]}`);
        break;
      }
      case 'baldump': {
        const logs = loadSaleBalanceLogs();
        console.log('[sale-balance] logs', logs.length, logs);
        info(`логов: ${logs.length} (см. консоль)`);
        break;
      }
      case 'baldl': {
        const logs = loadSaleBalanceLogs();
        downloadJsonFile(`sale-balance-${SALE_VERSION}-${Date.now()}.json`, {
          exportedAt: new Date().toISOString(),
          version: SALE_VERSION,
          count: logs.length,
          runs: logs,
        });
        info(`скачано ${logs.length} забегов`);
        break;
      }
      case 'ballast': {
        const last = (window.game && window.game._saleBalLast)
          || loadSaleBalanceLogs().slice(-1)[0]
          || null;
        console.log('[sale-balance] last', last);
        if (!last) info('нет логов');
        else {
          const top = Object.entries(last.weaponShare || {})
            .sort((a, b) => b[1].pct - a[1].pct)
            .slice(0, 3)
            .map(([k, v]) => `${k}:${v.pct}%`)
            .join(' ');
          info(`last ${last.won ? 'WIN' : 'LOSS'} t=${last.survivedSec}s lv=${last.level} dps=${last.avgDps} ${top}`);
        }
        break;
      }
      case 'balclear': {
        saveSaleBalanceLogs([]);
        if (window.game) window.game._saleBalLast = null;
        info('логи очищены');
        break;
      }
      case 'balsheet': {
        const cur = getSaleBalanceSheetUrl();
        const url = window.prompt(
          'URL Google Apps Script Web App (…/exec)\nСм. scripts/balance_sheet_appscript.gs',
          cur || '',
        );
        if (url == null) break;
        try {
          const saved = setSaleBalanceSheetUrl(url);
          info(saved ? 'URL таблицы сохранён' : 'URL очищен');
          buildSaleDevPanel();
        } catch (e) {
          info(String(e.message || e));
        }
        break;
      }
      case 'balup': {
        const run = (window.game && window.game._saleBalLast)
          || loadSaleBalanceLogs().slice(-1)[0]
          || null;
        if (!run) {
          info('нет забега для выгрузки');
          break;
        }
        info('выгружаю…');
        uploadSaleBalanceToSheet(run)
          .then((res) => info(res.already ? 'уже было' : (res.opaque ? 'отправлено (проверь Sheet)' : 'ok')))
          .catch((e) => info('ошибка: ' + (e.message || e)));
        break;
      }
      case 'balurl': {
        const u = getSaleBalanceSheetUrl();
        info(u ? u : 'URL не задан — нажми «URL таблицы»');
        console.log('[sale-balance] sheet url', u || '(empty)');
        break;
      }
      default:
        break;
    }
  }

  function toggleSaleDev(on) {
    const panel = document.getElementById('sale-dev-panel');
    if (!panel) return;
    const g = window.game;
    const show = on === true || (on == null && !panel.classList.contains('show'));
    if (show) {
      buildSaleDevPanel();
      panel.classList.add('show');
      panel.setAttribute('aria-hidden', 'false');
      if (g) {
        g.__saleDevOpen = true;
        g.__saleDevPaused = !g.paused && !(g.isBoostersOpen && g.isBoostersOpen()) && !g.inMainMenu;
        if (g.__saleDevPaused) g.paused = true;
      }
    } else {
      panel.classList.remove('show');
      panel.setAttribute('aria-hidden', 'true');
      if (g) {
        g.__saleDevOpen = false;
        if (g.__saleDevPaused) {
          g.paused = false;
          g.__saleDevPaused = false;
        }
      }
    }
  }

  function syncSaleVersionLabel() {
    const label = 'v' + SALE_VERSION;
    const hub = document.getElementById('hub-version');
    const corner = document.getElementById('sale-ver-corner');
    if (hub) hub.textContent = label;
    if (corner) corner.textContent = label;
  }

  function bindSaleDevUi() {
    syncSaleVersionLabel();
    const open = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSaleDev(true);
    };
    const hub = document.getElementById('hub-version');
    const corner = document.getElementById('sale-ver-corner');
    if (hub) {
      hub.addEventListener('click', open);
      hub.addEventListener('touchend', open, { passive: false });
    }
    if (corner) {
      corner.addEventListener('click', open);
      corner.addEventListener('touchend', open, { passive: false });
    }
    const panel = document.getElementById('sale-dev-panel');
    if (panel) {
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        saleDevAction(b.dataset.act, b.dataset.arg);
      });
    }
    window.toggleSaleDev = toggleSaleDev;

    // кнопка скорости ×1.5 в HUD
    const speedBtn = document.getElementById('btn-speed');
    if (speedBtn) speedBtn.onclick = () => {
      const g = window.game;
      if (!g) return;
      g.__saleTimeScale = (g.__saleTimeScale || 1) > 1.01 ? 1 : 1.5;
      speedBtn.textContent = g.__saleTimeScale > 1.01 ? `▶▶ ×${g.__saleTimeScale}` : '▶ ×1';
      if (typeof sfx !== 'undefined') sfx.click();
    };
  }

  const isDevEnv = typeof isDevEnvironment === 'function' && isDevEnvironment();

  syncSaleVersionLabel();
  if (isDevEnv) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindSaleDevUi);
    } else {
      bindSaleDevUi();
    }
  }

  if (!isDevEnv) return;

  window.__sale = {
    version: () => SALE_VERSION,
    start: () => saleDevEnsureRun(),
    warp: (sec) => {
      const g = saleDevEnsureRun();
      if (!g) return;
      g.saleTime = Math.max(0, Number(sec) || 0);
    },
    god: (on) => {
      const g = saleDevEnsureRun();
      if (!g) return;
      g.__god = on !== false;
      if (g.__god && g.player) g.player.hp = g.player.maxHp;
    },
    spawn: (type, n) => {
      const g = saleDevEnsureRun();
      if (!g) return;
      const count = Math.max(1, Number(n) || 1);
      for (let i = 0; i < count; i++) g.spawnSaleEnemy(type || null);
    },
    boss: (id) => {
      const g = saleDevEnsureRun();
      if (!g) return null;
      const key = id || 'discount_king';
      if (!SALE_BOSS_DEFS[key]) return null;
      g.saleBossSpawned = g.saleBossSpawned || {};
      g.saleBossSpawned[key] = false;
      return g.spawnSaleBoss(key, { near: true });
    },
    levelup: () => {
      const g = saleDevEnsureRun();
      if (!g) return;
      g.gainSaleXp(g.saleXpNext || 99);
    },
    gold: (n) => {
      const g = window.game;
      if (!g) return;
      g.coins = Math.max(0, Number(n) || 0);
      g.bankCoins = Math.max(g.bankCoins || 0, g.coins);
      g.persist && g.persist();
      g.renderHub && g.isBoostersOpen && g.isBoostersOpen() && g.renderHub();
    },
    clearEnemies: () => saleDevAction('killall'),
    count: () => {
      const g = window.game;
      if (!g) return null;
      return {
        enemies: (g.enemies || []).filter((e) => e.hp > 0).length,
        time: g.saleTime || 0,
        level: g.saleLevel || 0,
        coins: g.coins || 0,
      };
    },
    warm: (t) => ({ enemy: saleWarmMul(t || 0), coin: saleCoinWarmMul(t || 0) }),
    panel: (on) => toggleSaleDev(on),
    balance: {
      list: () => loadSaleBalanceLogs(),
      last: () => (window.game && window.game._saleBalLast) || loadSaleBalanceLogs().slice(-1)[0] || null,
      live: () => (window.game && window.game._saleBal) || null,
      download: () => saleDevAction('baldl'),
      clear: () => saleDevAction('balclear'),
      dump: () => saleDevAction('baldump'),
      getSheetUrl: () => getSaleBalanceSheetUrl(),
      setSheetUrl: (url) => setSaleBalanceSheetUrl(url),
      upload: (run) => uploadSaleBalanceToSheet(
        run || (window.game && window.game._saleBalLast) || loadSaleBalanceLogs().slice(-1)[0],
      ),
    },
  };
  window.__game = window.__sale;
})();
