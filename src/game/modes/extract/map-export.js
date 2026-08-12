/**
 * Вылазка: экспорт чертежа локации для Photoshop (PNG + JSON).
 * Dev: __extract.exportMap({ phase: 'hub' }) или __extract.exportMap({ floor: 2 })
 */
'use strict';

const EXTRACT_BLUEPRINT_TILE = 64;

function extractBlueprintEnabled() {
  return typeof isDevEnvironment === 'function' && isDevEnvironment();
}

function downloadBlueprintBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadBlueprintJson(filename, data) {
  downloadBlueprintBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
}

function downloadBlueprintCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) downloadBlueprintBlob(filename, blob);
      resolve();
    }, 'image/png');
  });
}

function normToPx(nx, ny, worldW, worldH) {
  return { x: worldW * nx, y: worldH * ny };
}

function normWallToPx(wall, worldW, worldH) {
  const w = Math.max(14, Math.round(worldW * wall.w));
  const h = Math.max(14, Math.round(worldH * wall.h));
  return { x: worldW * wall.x, y: worldH * wall.y, w, h };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

Game.prototype.buildExtractHubBlueprint = function () {
  const map = EXTRACT_HUB_MAP;
  const worldW = EXTRACT_HUB_W;
  const worldH = EXTRACT_HUB_H;
  const obstacles = [];
  for (const car of map.cars || []) {
    obstacles.push({
      kind: 'car',
      label: car.van ? 'фургон' : 'машина',
      x: worldW * car.x - car.w / 2,
      y: worldH * car.y - car.h / 2,
      w: car.w,
      h: car.h,
      color: car.color || '#888',
    });
  }
  for (const pillar of map.pillars || []) {
    obstacles.push({
      kind: 'pillar',
      label: 'колонна',
      x: worldW * pillar.x - pillar.w / 2,
      y: worldH * pillar.y - pillar.h / 2,
      w: pillar.w,
      h: pillar.h,
    });
  }
  for (const prop of map.props || []) {
    const size = prop.kind === 'cart' ? 36 : 18;
    obstacles.push({
      kind: 'prop',
      label: prop.kind,
      x: worldW * prop.x - size / 2,
      y: worldH * prop.y - size / 2,
      w: size,
      h: size,
    });
  }
  const el = map.elevator;
  const npcs = (EXTRACT_HUB_NPCS || []).map((npc) => ({
    id: npc.id,
    label: npc.name,
    ...normToPx(npc.x, npc.y, worldW, worldH),
    r: 22,
  }));
  return {
    id: 'extract-hub',
    label: 'Парковка ТЦ',
    phase: 'hub',
    floor: 0,
    worldW,
    worldH,
    tile: EXTRACT_BLUEPRINT_TILE,
    spawn: normToPx(map.spawn.x, map.spawn.y, worldW, worldH),
    elevator: {
      label: el.label,
      x: worldW * el.x,
      y: worldH * el.y,
      w: el.w,
      h: el.h,
    },
    rooms: [],
    walls: [],
    obstacles,
    mobs: [],
    loot: [],
    npcs,
  };
};

Game.prototype.buildExtractRaidBlueprint = function (floor) {
  floor = Math.max(1, floor | 0) || 1;
  const map = (typeof this.composeExtractRaidMap === 'function')
    ? this.composeExtractRaidMap(floor)
    : this.getExtractRaidMap(floor);
  const worldW = EXTRACT_RAID_W;
  const worldH = EXTRACT_RAID_H;
  const floorDef = this.getExtractFloorDef(floor);
  const walls = (map.walls || []).map((w, i) => ({
    id: 'wall_' + i,
    ...normWallToPx(w, worldW, worldH),
  }));
  const rooms = (map.rooms || []).map((r, i) => ({
    id: 'room_' + i,
    label: r.label || ('комната ' + (i + 1)),
    ...normToPx(r.x, r.y, worldW, worldH),
  }));
  const mobs = (map.mobs || []).map((m) => ({
    id: m.id,
    type: m.type,
    label: m.nameTag || m.type,
    elite: !!m.elite,
    exitBoss: !!m.exitBoss,
    ...normToPx(m.x, m.y, worldW, worldH),
    r: m.exitBoss ? 28 : m.elite ? 20 : 14,
  }));
  const loot = (map.loot || []).map((L) => ({
    id: L.id,
    defId: L.defId,
    lockedBy: L.lockedBy || null,
    ...normToPx(L.x, L.y, worldW, worldH),
    r: 16,
  }));
  const el = map.elevator;
  return {
    id: 'extract-raid-f' + floor,
    label: floorDef.label || (floor + ' этаж'),
    phase: 'raid',
    floor,
    worldW,
    worldH,
    tile: EXTRACT_BLUEPRINT_TILE,
    spawn: normToPx(map.spawn.x, map.spawn.y, worldW, worldH),
    elevator: el ? {
      label: el.label,
      x: worldW * el.x,
      y: worldH * el.y,
      w: el.w,
      h: el.h,
      lockedBy: el.lockedBy || null,
    } : null,
    rooms,
    walls,
    obstacles: [],
    mobs,
    loot,
    npcs: [],
  };
};

Game.prototype.resolveExtractBlueprint = function (opts) {
  opts = opts || {};
  let phase = opts.phase;
  if (!phase || phase === 'current') {
    phase = (this.gameMode === 'extract' && this.extractPhase === 'hub') ? 'hub' : 'raid';
  }
  if (phase === 'hub') return this.buildExtractHubBlueprint();
  const floor = opts.floor != null ? opts.floor : (this.extractFloor || 1);
  return this.buildExtractRaidBlueprint(floor);
};

function drawExtractBlueprintLayer(blueprint, layer, scale) {
  const WW = Math.round(blueprint.worldW * scale);
  const WH = Math.round(blueprint.worldH * scale);
  const canvas = document.createElement('canvas');
  canvas.width = WW;
  canvas.height = WH;
  const c = canvas.getContext('2d');
  const s = scale;
  const tile = blueprint.tile * s;

  const fillBg = layer === 'floor' || layer === 'combined';
  const drawGrid = layer === 'grid' || layer === 'floor' || layer === 'combined';
  const drawWalls = layer === 'walls' || layer === 'collision' || layer === 'combined';
  const drawObs = layer === 'collision' || layer === 'combined';
  const drawMarkers = layer === 'markers' || layer === 'combined';

  if (fillBg) {
    if (blueprint.phase === 'hub') {
      c.fillStyle = '#2b3036';
      c.fillRect(0, 0, WW, WH);
      c.fillStyle = '#3a4048';
      c.fillRect(24 * s, 96 * s, WW - 48 * s, WH - 120 * s);
    } else {
      c.fillStyle = '#d9d2c5';
      c.fillRect(0, 0, WW, WH);
      c.fillStyle = '#e8dcc8';
      for (let x = 0; x < WW; x += tile) {
        for (let y = 0; y < WH; y += tile) {
          if (((x / s + y / s) / blueprint.tile) % 2 < 1) {
            c.fillRect(x, y, tile, tile);
          }
        }
      }
    }
  } else {
    c.clearRect(0, 0, WW, WH);
  }

  if (drawGrid) {
    c.strokeStyle = 'rgba(80,120,200,0.22)';
    c.lineWidth = 1;
    for (let x = 0; x <= WW; x += tile) {
      c.beginPath();
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, WH);
      c.stroke();
    }
    for (let y = 0; y <= WH; y += tile) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(WW, y + 0.5);
      c.stroke();
    }
    c.strokeStyle = 'rgba(200,80,80,0.35)';
    c.lineWidth = 2;
    c.strokeRect(40 * s, 40 * s, WW - 80 * s, WH - 80 * s);
  }

  if (drawWalls) {
    c.fillStyle = layer === 'collision' ? '#000' : '#4a3728';
    for (const w of blueprint.walls) {
      c.fillRect(w.x * s, w.y * s, w.w * s, w.h * s);
    }
  }

  if (drawObs) {
    for (const ob of blueprint.obstacles) {
      c.fillStyle = layer === 'collision' ? '#000' : (ob.color || '#7f8c8d');
      c.fillRect(ob.x * s, ob.y * s, ob.w * s, ob.h * s);
      if (layer === 'combined' && ob.label) {
        c.fillStyle = '#fff';
        c.font = `${Math.max(10, 11 * s)}px monospace`;
        c.fillText(ob.label, ob.x * s + 4, ob.y * s + 14 * s);
      }
    }
  }

  if (drawMarkers) {
    // комнаты
    c.font = `bold ${Math.max(12, 14 * s)}px "Segoe UI", sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const r of blueprint.rooms) {
      c.fillStyle = 'rgba(100,80,60,0.12)';
      c.beginPath();
      c.arc(r.x * s, r.y * s, 48 * s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#3d2f24';
      c.fillText(r.label, r.x * s, r.y * s);
    }

    // лифт
    if (blueprint.elevator) {
      const e = blueprint.elevator;
      c.fillStyle = 'rgba(52,152,219,0.35)';
      c.fillRect(e.x * s - (e.w * s) / 2, e.y * s - (e.h * s) / 2, e.w * s, e.h * s);
      c.strokeStyle = '#2980b9';
      c.lineWidth = 2;
      c.strokeRect(e.x * s - (e.w * s) / 2, e.y * s - (e.h * s) / 2, e.w * s, e.h * s);
      c.fillStyle = '#1a5276';
      c.fillText(e.label || 'лифт', e.x * s, e.y * s);
    }

    // спавн
    const sp = blueprint.spawn;
    c.fillStyle = 'rgba(46,204,113,0.5)';
    c.beginPath();
    c.arc(sp.x * s, sp.y * s, 18 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#145a32';
    c.fillText('SPAWN', sp.x * s, sp.y * s);

    // NPC
    for (const npc of blueprint.npcs) {
      c.fillStyle = 'rgba(155,89,182,0.55)';
      c.beginPath();
      c.arc(npc.x * s, npc.y * s, (npc.r || 22) * s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#4a235a';
      c.font = `${Math.max(10, 11 * s)}px monospace`;
      c.fillText(npc.label || npc.id, npc.x * s, npc.y * s + 20 * s);
    }

    // мобы
    for (const m of blueprint.mobs) {
      c.fillStyle = m.exitBoss ? 'rgba(192,57,43,0.75)'
        : m.elite ? 'rgba(230,126,34,0.7)' : 'rgba(231,76,60,0.45)';
      c.beginPath();
      c.arc(m.x * s, m.y * s, (m.r || 14) * s, 0, Math.PI * 2);
      c.fill();
    }

    // лут
    for (const L of blueprint.loot) {
      c.fillStyle = 'rgba(241,196,15,0.75)';
      c.fillRect(L.x * s - 10 * s, L.y * s - 10 * s, 20 * s, 20 * s);
      c.fillStyle = '#7d6608';
      c.font = `${Math.max(9, 10 * s)}px monospace`;
      c.fillText(L.defId || L.id, L.x * s, L.y * s + 18 * s);
    }
  }

  if (layer === 'combined') {
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = 'rgba(0,0,0,0.72)';
    c.fillRect(8 * s, 8 * s, 280 * s, 92 * s);
    c.fillStyle = '#ecf0f1';
    c.font = `${Math.max(10, 11 * s)}px monospace`;
    const lines = [
      blueprint.label,
      `${WW}×${WH}px · сетка ${blueprint.tile}px`,
      'зелёный=спавн · синий=лифт · красный=мобы',
      'жёлтый=лут · коричневый=стены · серый=коллизии',
    ];
    lines.forEach((ln, i) => c.fillText(ln, 14 * s, (14 + i * 18) * s));
  }

  return canvas;
}

/**
 * @param {object} [opts]
 * @param {'hub'|'raid'|'current'} [opts.phase]
 * @param {number} [opts.floor]
 * @param {number} [opts.scale=1] — 0.5 для облегчённого PNG
 * @param {'pack'|'combined'|'layers'} [opts.mode='pack'] — pack = всё сразу
 */
Game.prototype.exportExtractMapBlueprint = async function (opts) {
  if (!extractBlueprintEnabled()) {
    console.warn('[extract-blueprint] только в dev-окружении');
    return null;
  }
  opts = opts || {};
  const scale = opts.scale == null ? 1 : Math.max(0.25, Math.min(1, Number(opts.scale) || 1));
  const mode = opts.mode || 'pack';
  const blueprint = this.resolveExtractBlueprint(opts);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const base = blueprint.id + '_' + stamp;

  const json = Object.assign({}, blueprint, {
    exportedAt: new Date().toISOString(),
    scale,
    psHint: 'Импортируй PNG в Photoshop 1:1. Сетка 64px = размер тайла пола в игре. Слой collision — маска непроходимых зон.',
  });

  if (mode === 'combined' || mode === 'pack') {
    const canvas = drawExtractBlueprintLayer(blueprint, 'combined', scale);
    await downloadBlueprintCanvas(canvas, base + '_blueprint.png');
    await delay(250);
  }

  if (mode === 'layers' || mode === 'pack') {
    const layers = ['floor', 'grid', 'walls', 'collision', 'markers'];
    for (const layer of layers) {
      const canvas = drawExtractBlueprintLayer(blueprint, layer, scale);
      await downloadBlueprintCanvas(canvas, base + '_' + layer + '.png');
      await delay(250);
    }
  }

  downloadBlueprintJson(base + '.json', json);

  if (typeof this.showExtractBanner === 'function') {
    const n = mode === 'combined' ? 2 : mode === 'layers' ? 6 : 7;
    this.showExtractBanner(`Чертеж «${blueprint.label}»: ${n} файлов · ${Math.round(blueprint.worldW * scale)}×${Math.round(blueprint.worldH * scale)}px`, 3.5);
  }
  try {
    console.log('[extract-blueprint] exported', base, blueprint);
  } catch (_) { /* ignore */ }
  return blueprint;
};

if (extractBlueprintEnabled()) {
  window.__extract = window.__extract || {};
  Object.assign(window.__extract, {
    exportMap: (opts) => {
      const g = window.game;
      if (!g || typeof g.exportExtractMapBlueprint !== 'function') return Promise.resolve(null);
      return g.exportExtractMapBlueprint(opts);
    },
    exportAll: async () => {
      const g = window.game;
      if (!g) return;
      await g.exportExtractMapBlueprint({ phase: 'hub', mode: 'pack' });
      await delay(400);
      const max = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 3;
      for (let f = 1; f <= max; f++) {
        await g.exportExtractMapBlueprint({ phase: 'raid', floor: f, mode: 'pack' });
        await delay(400);
      }
    },
  });
}
