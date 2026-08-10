/**
 * Google Apps Script для логов баланса «Распродажа».
 *
 * Как подключить (один раз ~3 минуты):
 * 1. Создай Google Sheet: https://sheets.new
 * 2. Лист назови "runs" (или оставь первый — скрипт создаст "runs")
 * 3. Расширения → Apps Script → вставь этот файл целиком
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Скопируй URL вида https://script.google.com/macros/s/.../exec
 * 6. В игре (dev) открой дев-панель → Balance log → «URL таблицы»
 *    или в консоли: __sale.balance.setSheetUrl('СЮДА_URL')
 *
 * После забега нажми «Выгрузить логи» на end-screen.
 */

var SHEET_NAME = 'runs';
var HEADERS = [
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

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'sale-balance-logs' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    // клиент может слать { run: {...} } или сразу summary
    var run = data.run || data;
    if (!run || !run.id) {
      return jsonOut({ ok: false, error: 'missing run.id' });
    }

    var sheet = ensureSheet_();
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
      // полный JSON (до ~50k символов на ячейку)
      JSON.stringify(run).slice(0, 49000),
    ]);

    return jsonOut({ ok: true, runId: run.id });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
