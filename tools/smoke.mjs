/**
 * Смоук-тест: грузит index.html в jsdom со всеми скриптами по порядку,
 * подсовывает заглушки холста и Web Audio, и прогоняет ключевые сценарии.
 * Ловит то, что не видит статический анализ: битый порядок подключения,
 * обращения к необъявленным именам, опечатки в id элементов.
 *
 * jsdom не входит в проект — ставится разово во временную папку:
 *   npm install jsdom --prefix %TEMP%\consultant-smoke
 * Запуск: node tools/smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { runInContext } from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSDOM_DIR = join(process.env.TEMP || '/tmp', 'consultant-smoke');

let JSDOM;
try {
  const req = createRequire(pathToFileURL(join(JSDOM_DIR, 'index.js')));
  ({ JSDOM } = req('jsdom'));
} catch {
  console.error(`jsdom не найден. Поставь его: npm install jsdom --prefix ${JSDOM_DIR}`);
  process.exit(2);
}

/* ── Заглушки того, чего нет в jsdom ─────────────────────────────────────── */

/** Контекст холста: любой метод — пустышка, любое свойство — записываемое. */
function makeContext2d() {
  const state = {
    canvas: null,
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData() {},
    drawImage() {},
  };
  return new Proxy(state, {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Неизвестное имя может быть и методом, и свойством — отдаём функцию,
      // она корректно ведёт себя в обоих случаях кроме арифметики.
      return typeof prop === 'string' ? () => undefined : undefined;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

const failures = [];
const note = (what, err) => failures.push(`${what}: ${err && err.message ? err.message : err}`);

const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  // внешний Telegram SDK в тесте не нужен и не грузится
  .replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', '');

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  resources: undefined,
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function getContext() {
      if (!this.__ctx) {
        this.__ctx = makeContext2d();
        this.__ctx.canvas = this;
      }
      return this.__ctx;
    };
    window.AudioContext = class {
      constructor() {
        this.currentTime = 0;
        this.destination = {};
        this.state = 'running';
      }
      createOscillator() {
        return { frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, type: '', connect() {}, start() {}, stop() {} };
      }
      createGain() {
        return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
      }
      createBiquadFilter() {
        return { frequency: { value: 0, setValueAtTime() {} }, type: '', Q: { value: 0 }, connect() {} };
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(16) };
      }
      createBufferSource() {
        return { buffer: null, connect() {}, start() {}, stop() {} };
      }
      resume() {
        return Promise.resolve();
      }
    };
    window.webkitAudioContext = window.AudioContext;
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    window.navigator.vibrate = () => true;
    window.matchMedia = (query) => ({
      media: query,
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
    window.onerror = (msg, src, line, col, err) => note('runtime', err || msg);
    window.addEventListener('unhandledrejection', (ev) => note('promise', ev.reason));
  },
});

const { window } = dom;

/* ── Файлы грузим сами: jsdom не ходит за resources по умолчанию ─────────── */

// runInContext, а не window.eval: обычные скрипты делят общую лексическую
// область, и объявленные в них const/class должны быть видны следующим файлам.
const vmContext = dom.getInternalVMContext();

for (const el of window.document.querySelectorAll('script[src]')) {
  const src = el.getAttribute('src');
  if (/^https?:/.test(src)) continue;
  try {
    runInContext(readFileSync(join(ROOT, src), 'utf8'), vmContext, { filename: src });
  } catch (err) {
    note(src, err);
  }
}

if (failures.length) {
  console.error(`FAIL — падений при загрузке: ${failures.length}`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

/* ── Разметка виджетов собрана ───────────────────────────────────────────── */

// index.html держит только пустые корни, поэтому пропущенный mount() не
// уронит загрузку — узлы просто не появятся, а код молча уйдёт в if (!el).
const REQUIRED_IDS = [
  'battle-coins', 'battle-time', 'battle-xp-fill',
  'hud-level', 'hud-hp-fill', 'btn-speed',
  'joystick-zone', 'attack-btn', 'desktop-hint',
  'tog-sound', 'btn-settings-close', 'set-bank',
  'end-title', 'end-bank', 'btn-retry', 'btn-upload-balance',
  'boosters-bank', 'hub-tab-passives', 'hub-tab-weapons', 'hub-sale-weapons', 'hub-equip-doll', 'hub-book', 'hub-back-main',
  'main-menu-actions', 'crash-reload-btn',
];

const missing = REQUIRED_IDS.filter((id) => !window.document.getElementById(id));
if (missing.length) {
  console.error(`FAIL — виджеты не собрали разметку: ${missing.join(', ')}`);
  process.exit(1);
}

/* ── Сценарии ────────────────────────────────────────────────────────────── */

const game = window.game;
if (!game) {
  console.error('FAIL — bootstrap не создал window.game');
  process.exit(1);
}

let steps = 0;
const step = (name, fn) => {
  steps += 1;
  try {
    fn();
  } catch (err) {
    note(name, err);
  }
};

step('главное меню', () => game.openMainMenu());
step('хаб усилителей', () => game.openBoosters());
step('вкладка «Гардероб»', () => game.setHubTab('gear'));
step('вкладка «Книга жалоб»', () => game.setHubTab('book'));
step('вкладка «Подготовка»', () => game.setHubTab('prep'));
step('старт смены', () => game.startShiftFromHub());
// Иначе игрок умирает на десятой секунде и остальные сценарии идут вхолостую
game.__god = true;
const keepAlive = () => {
  if (game.player) game.player.hp = game.player.maxHp;
  // Забег может закончиться сам — тогда следующие сценарии крутились бы вхолостую
  if (game.gameState && game.gameState !== 'playing') game.startShiftFromHub();
};

step('30 секунд забега', () => {
  for (let i = 0; i < 1800; i += 1) {
    keepAlive();
    game.update(1 / 60);
    game.render();
  }
});
step('спавн покупателей', () => {
  for (let i = 0; i < 40; i += 1) game.spawnSaleEnemy();
  for (let i = 0; i < 120; i += 1) {
    keepAlive();
    game.update(1 / 60);
  }
  game.render();
});
step('босс', () => {
  game.spawnSaleBoss(undefined, { near: true });
  for (let i = 0; i < 600; i += 1) {
    keepAlive();
    game.update(1 / 60);
    game.render();
  }
});
step('левелап', () => window.__sale.levelup());
step('пауза', () => game.togglePause());
step('настройки', () => {
  game.openSettings();
  game.closeSettings();
});
step('игровое меню', () => {
  game.openGameMenu();
  game.closeGameMenu();
});
step('дев-панель', () => window.__sale && window.__sale.panel && window.__sale.panel());
step('конец смены', () => game.endGame(false, 'смоук-тест'));

if (failures.length) {
  console.error(`FAIL — ошибок в сценариях: ${failures.length}`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

const scripts = window.document.querySelectorAll('script[src]').length;
console.log(
  `OK — ${scripts} скриптов загрузились, ${steps} сценариев без исключений ` +
    `(уровень ${game.saleLevel ?? game.level ?? '?'}, врагов на поле ${game.enemies ? game.enemies.length : '?'}).`,
);
