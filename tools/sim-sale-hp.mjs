/**
 * Пробный забег 2.0: блендер (орда на игроке) и AFK со стартером.
 * Не в игре — только Node + jsdom. Запуск: node tools/sim-sale-hp.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { runInContext } from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSDOM_DIR = join(process.env.TEMP || '/tmp', 'consultant-smoke');
const { JSDOM } = createRequire(pathToFileURL(join(JSDOM_DIR, 'index.js')))('jsdom');

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
      return typeof prop === 'string' ? () => undefined : undefined;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  .replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', '');
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
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
      constructor() { this.currentTime = 0; this.destination = {}; this.state = 'running'; }
      createOscillator() {
        return { frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, type: '', connect() {}, start() {}, stop() {} };
      }
      createGain() {
        return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
      }
      createBiquadFilter() {
        return { frequency: { value: 0, setValueAtTime() {} }, type: '', Q: { value: 0 }, connect() {} };
      }
      createBuffer() { return { getChannelData: () => new Float32Array(16) }; }
      createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {} }; }
      resume() { return Promise.resolve(); }
    };
    window.webkitAudioContext = window.AudioContext;
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    window.navigator.vibrate = () => true;
    window.matchMedia = (query) => ({
      media: query, matches: false,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    });
  },
});

const vmContext = dom.getInternalVMContext();
for (const el of dom.window.document.querySelectorAll('script[src]')) {
  const src = el.getAttribute('src');
  if (/^https?:/.test(src)) continue;
  runInContext(readFileSync(join(ROOT, src), 'utf8'), vmContext, { filename: src });
}

const game = dom.window.game;
if (!game) {
  console.error('no game');
  process.exit(1);
}

function skipUi() {
  game.choosingUpgrade = false;
  game.paused = false;
  game.shopping = false;
  game.pendingUpgrades = 0;
  game._saleV2WepPending = 0;
  game._saleV2UberQueue = [];
  game._saleV2WepPick = false;
  game._saleV2UberPick = false;
  game.__saleDevOpen = false;
  if (game.player) game.player.lunchTimer = 0;
}

function invest(id, times) {
  for (let i = 0; i < times; i += 1) {
    if (!game.investSaleV2Node(id, { force: true })) break;
  }
}

function startRun(hero, build, atSec) {
  game.saleV2 = true;
  game.selectedHeroId = hero;
  game.selectedArena = 'sport';
  game.saleTreeSelected = [];
  game.startGame();
  skipUi();
  if (build === 'mug') invest('mug', 5);
  if (build === 'armor') {
    invest('mug', 5);
    invest('armor', 5);
    invest('cap_till', 1);
  }
  if (build === 'regen') {
    invest('mug', 5);
    invest('medkit', 3);
    invest('cap_ems', 1);
  }
  if (atSec) game.saleTime = atSec;
  skipUi();
}

function glueHorde(n) {
  const p = game.player;
  game.saleWeapons = {};
  game.enemies = [];
  for (let i = 0; i < n; i += 1) {
    game.spawnSaleEnemyNear(p.x + 6, p.y, 'normal', { overCap: 20, skipDiff: false });
  }
}

function tickBlender(maxSec) {
  const dt = 1 / 30;
  let hits = 0;
  let till = 0;
  const startHp = game.player.hp;
  const startMax = game.player.maxHp;
  const t0 = game.saleTime || 0;
  const incoming = game.saleIncomingDmg('trash');
  const afterArmor = game.saleArmorMitigate(incoming);
  while ((game.saleTime - t0) < maxSec && !game.gameOver && !game.won && game.player && game.player.hp > 0) {
    skipUi();
    const p = game.player;
    for (const e of game.enemies || []) {
      if (e.hp <= 0) continue;
      e.x = p.x + 8;
      e.y = p.y;
      e.hp = e.maxHp;
    }
    const before = p.hp;
    const tillBefore = game._saleV2TillCd || 0;
    game.update(dt);
    if (game.player && game.player.hp < before) hits += 1;
    if (tillBefore <= 0 && (game._saleV2TillCd || 0) > 15) till += 1;
  }
  const survived = Math.round(((game.saleTime || 0) - t0) * 10) / 10;
  return {
    survivedSec: survived,
    dead: !!(game.gameOver || (game.player && game.player.hp <= 0)),
    hpStart: startHp,
    maxHp: startMax,
    hpEnd: game.player ? game.player.hp : 0,
    hits,
    tillProcs: till,
    incoming,
    afterArmor,
    armor: game.saleV2Stat ? game.saleV2Stat('armor') : 0,
    regen: game.saleV2Stat ? game.saleV2Stat('regen') : 0,
  };
}

function tickAfk(maxSec) {
  const dt = 1 / 30;
  const samples = [];
  const t0 = game.saleTime || 0;
  let lastSample = -10;
  while ((game.saleTime - t0) < maxSec && !game.gameOver && !game.won && game.player && game.player.hp > 0) {
    skipUi();
    const t = game.saleTime - t0;
    if (game.player) {
      const ang = t * 1.2;
      game.player.x = game.worldW / 2 + Math.cos(ang) * 180;
      game.player.y = game.worldH / 2 + Math.sin(ang) * 180;
    }
    game.update(dt);
    if (t - lastSample >= 10) {
      lastSample = t;
      samples.push({
        t: Math.round(t),
        hp: game.player ? game.player.hp : 0,
        maxHp: game.player ? game.player.maxHp : 0,
        kills: game.waveKills || 0,
        mobs: (game.enemies || []).filter((e) => e.hp > 0).length,
      });
    }
  }
  const survived = Math.round(((game.saleTime || 0) - t0) * 10) / 10;
  return {
    survivedSec: survived,
    dead: !!(game.gameOver || (game.player && game.player.hp <= 0)),
    hpStart: samples[0] ? samples[0].hp : (game.player && game.player.maxHp),
    hpEnd: game.player ? game.player.hp : 0,
    maxHp: game.player ? game.player.maxHp : 0,
    kills: game.waveKills || 0,
    samples,
    killer: game._saleKillName || game.killName || '',
  };
}

function median(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function summarizeBlender(spec, atSec, maxSec, repeats) {
  const runs = [];
  for (let i = 0; i < repeats; i += 1) {
    startRun(spec.hero, spec.build, atSec);
    glueHorde(10);
    runs.push(tickBlender(maxSec));
  }
  const times = runs.map((r) => r.survivedSec);
  return {
    ...spec,
    atSec,
    hpStart: runs[0].hpStart,
    maxHp: runs[0].maxHp,
    incoming: runs[0].incoming,
    afterArmor: runs[0].afterArmor,
    armor: runs[0].armor,
    regen: runs[0].regen,
    hitsMedian: median(runs.map((r) => r.hits)),
    ttDMedian: median(times),
    ttDMin: Math.min(...times),
    ttDMax: Math.max(...times),
    hpEndMedian: median(runs.map((r) => r.hpEnd)),
    deadCount: runs.filter((r) => r.dead).length,
    tillMedian: median(runs.map((r) => r.tillProcs)),
  };
}

function bossSlams(hero, build, n, atSec) {
  startRun(hero, build, atSec);
  const p = game.player;
  const raw = game.saleIncomingDmg('boss');
  const armor = game.saleV2Stat('armor');
  const hp0 = p.hp;
  const hits = [];
  for (let i = 0; i < n; i += 1) {
    p.invincible = 0;
    p.dashTime = 0;
    p.lunchTimer = 0;
    const before = p.hp;
    game.saleHurtPlayer(p.x, p.y, 'boss', 'Босс');
    hits.push({ lost: before - p.hp, hp: p.hp });
  }
  return {
    hero,
    build,
    atSec,
    hp0,
    raw,
    armor,
    mitigated: game.saleArmorMitigate(raw),
    hits,
    hpEnd: p.hp,
    barPct: Math.round((p.hp / p.maxHp) * 100),
  };
}

const blenderSpecs = [
  { id: 'igor-bare', hero: 'igor', build: 'none', label: 'Игорь, без дерева' },
  { id: 'masha-bare', hero: 'masha', build: 'none', label: 'Маша, без дерева' },
  { id: 'igor-mug', hero: 'igor', build: 'mug', label: 'Игорь, банка 5/5' },
  { id: 'igor-armor', hero: 'igor', build: 'armor', label: 'Игорь, живучесть → броня' },
  { id: 'igor-regen', hero: 'igor', build: 'regen', label: 'Игорь, живучесть → реген' },
];

const blender = blenderSpecs.map((spec) => summarizeBlender(spec, 0, 30, 4));
const blenderLate = blenderSpecs
  .filter((spec) => spec.id === 'igor-bare' || spec.id === 'igor-armor' || spec.id === 'igor-regen')
  .map((spec) => summarizeBlender(spec, 15 * 60, 30, 3));

const afkSpecs = [
  { id: 'igor-afk', hero: 'igor', build: 'none', label: 'Игорь стартер, крутится 3 мин' },
  { id: 'igor-armor-afk', hero: 'igor', build: 'armor', label: 'Игорь броня, крутится 3 мин' },
  { id: 'igor-regen-afk', hero: 'igor', build: 'regen', label: 'Игорь реген, крутится 3 мин' },
];

const afk = [];
for (const spec of afkSpecs) {
  startRun(spec.hero, spec.build);
  const result = tickAfk(180);
  afk.push({ ...spec, ...result });
}

const boss = [
  bossSlams('igor', 'none', 3, 0),
  bossSlams('igor', 'armor', 3, 0),
  bossSlams('igor', 'armor', 3, 15 * 60),
];

const out = {
  version: vmContext.SALE_VERSION,
  hitTrash: vmContext.SALE_HIT_TRASH,
  hitBoss: vmContext.SALE_HIT_BOSS,
  iframeV2: vmContext.SALE_IFRAME_V2,
  blender,
  blenderLate,
  afk,
  boss,
};
const outPath = join(ROOT, 'tools', 'sim-sale-hp-out.json');
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.error('wrote', outPath);
