/**
 * Google Apps Script для логов баланса «Распродажа» и «Вылазка».
 *
 * Как подключить (один раз ~3 минуты):
 * 1. Открой Google Sheet (или создай: https://sheets.new)
 * 2. Расширения → Apps Script → вставь этот файл целиком
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Скопируй URL вида https://script.google.com/macros/s/.../exec
 * 5. В игре (dev) открой дев-панель → Balance log → «URL таблицы»
 *    или в консоли: __sale.balance.setSheetUrl('СЮДА_URL')
 *
 * Листы создаются автоматически:
 *   - runs         — Распродажа
 *   - extract_runs — Вылазка
 *
 * После забега нажми «Выгрузить логи» на end-screen.
 */

var SALE_SHEET_NAME = 'runs';
var EXTRACT_SHEET_NAME = 'extract_runs';

var SALE_HEADERS = [
  'uploaded_at',
  'run_id',
  'version',
  'won',
  'hero',
  'floor',
  'contract',
  'survived_sec',
  'level',
  'avg_dps',
  'kills',
  'elites',
  'hurt',
  'dmg',
  'xp',
  'gold',
  'weapons_end',
  'weapon_share',
  'bosses',
  'payload_json',
];

var EXTRACT_HEADERS = [
  'uploaded_at',
  'run_id',
  'version',
  'won',
  'floor_death',
  'floor_max',
  'survived_sec',
  'kills',
  'elites',
  'bosses',
  'hurt',
  'dmg',
  'avg_dps',
  'backpack_lost',
  'heat',
  'pressure_waves',
  'upgrades',
  'insured',
  'weapons_end',
  'weapon_share',
  'payload_json',
];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'balance-logs', sheets: [SALE_SHEET_NAME, EXTRACT_SHEET_NAME] }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    var run = data.run || data;
    if (!run || !run.id) {
      return jsonOut({ ok: false, error: 'missing run.id' });
    }

    var mode = String(run.mode || data.mode || 'sale');
    if (mode === 'extract') {
      appendExtractRun_(run);
    } else {
      appendSaleRun_(run);
    }

    return jsonOut({ ok: true, runId: run.id, mode: mode });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function appendSaleRun_(run) {
  var sheet = ensureSheet_(SALE_SHEET_NAME, SALE_HEADERS);
  sheet.appendRow([
    new Date().toISOString(),
    String(run.id || ''),
    String(run.version || ''),
    run.won === true ? 'WIN' : 'LOSS',
    String(run.hero || ''),
    String(run.floor || ''),
    String(run.contract || ''),
    Number(run.survivedSec || 0),
    Number(run.level || 0),
    Number(run.avgDps || 0),
    Number(run.kills || 0),
    Number(run.elites || 0),
    Number(run.hurt || 0),
    Number(run.dmg || 0),
    Number(run.xp || 0),
    Number(run.gold || 0),
    JSON.stringify(run.weaponsEnd || {}),
    JSON.stringify(run.weaponShare || {}),
    JSON.stringify(run.bosses || []),
    JSON.stringify(run).slice(0, 49000),
  ]);
}

function appendExtractRun_(run) {
  var sheet = ensureSheet_(EXTRACT_SHEET_NAME, EXTRACT_HEADERS);
  sheet.appendRow([
    new Date().toISOString(),
    String(run.id || ''),
    String(run.version || ''),
    run.won === true ? 'EVAC' : 'DEATH',
    Number(run.floorDeath || 0),
    Number(run.floorMax || 0),
    Number(run.survivedSec || 0),
    Number(run.kills || 0),
    Number(run.elites || 0),
    Number(run.bosses || 0),
    Number(run.hurt || 0),
    Number(run.dmg || 0),
    Number(run.avgDps || 0),
    Number(run.backpackLost || 0),
    Number(run.heat || 0),
    Number(run.pressureWaves || 0),
    Number(run.upgrades || 0),
    String(run.insured || ''),
    JSON.stringify(run.weaponsEnd || {}),
    JSON.stringify(run.weaponShare || {}),
    JSON.stringify(run).slice(0, 49000),
  ]);
}

function ensureSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
