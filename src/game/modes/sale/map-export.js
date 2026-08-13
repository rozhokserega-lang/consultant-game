/**
 * Распродажа: экспорт чертежа арены для Photoshop (PNG + JSON).
 * Dev:
 *   __sale.exportMap()
 *   __sale.exportMap({ arena: 'food' })
 *   __sale.exportMap({ arena: 'tech', scale: 0.5 })
 *   __sale.exportMap({ source: 'live' })  // текущая рандомная раскладка
 *   __sale.exportAll()
 */
'use strict';

const SALE_BLUEPRINT_TILE = 64;
const SALE_BLUEPRINT_W = 2800;
const SALE_BLUEPRINT_H = 2000;

function saleBlueprintEnabled() {
  return typeof isDevEnvironment === 'function' && isDevEnvironment();
}

function saleDownloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function saleDownloadJson(filename, data) {
  saleDownloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
}

function saleDownloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) saleDownloadBlob(filename, blob);
      resolve();
    }, 'image/png');
  });
}

function saleDelay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function saleFenceWalls(worldW, worldH) {
  const f = ARENA_FENCE;
  const doorX0 = worldW / 2 - f.doorW / 2;
  const doorX1 = doorX0 + f.doorW;
  return [
    { id: 'wall_top', label: 'витрины', x: 0, y: 0, w: worldW, h: f.topShop },
    { id: 'wall_left', label: 'стена L', x: 0, y: f.topShop, w: f.side, h: worldH - f.topShop - f.bottom },
    { id: 'wall_right', label: 'стена R', x: worldW - f.side, y: f.topShop, w: f.side, h: worldH - f.topShop - f.bottom },
    { id: 'wall_bottom_l', label: 'забор L', x: 0, y: worldH - f.bottom, w: doorX0, h: f.bottom },
    { id: 'wall_bottom_r', label: 'забор R', x: doorX1, y: worldH - f.bottom, w: worldW - doorX1, h: f.bottom },
  ];
}

function saleThemeObstacles(theme, worldW, worldH) {
  const out = [];
  for (const def of theme.obstacles || []) {
    const dw = def.dw || Math.round(def.cw * 1.15);
    const dh = def.dh || Math.round(def.ch * 1.35);
    const footW = Math.max(22, Math.round(dw * 0.78));
    const footH = Math.max(20, Math.round(dh * 0.42));
    out.push({
      kind: 'prop',
      label: def.sprite,
      sprite: def.sprite,
      x: worldW * def.x - footW / 2,
      y: worldH * def.y - footH / 2,
      w: footW,
      h: footH,
      dw,
      dh,
    });
  }
  return out;
}

function saleThemeZones(theme, worldW, worldH) {
  return (theme.zones || []).map((z, i) => ({
    id: 'zone_' + i,
    type: z.type,
    label: z.type,
    x: worldW * z.x,
    y: worldH * z.y,
    w: z.w,
    h: z.h,
  }));
}

function saleThemeStorefronts(theme, worldW) {
  const primary = theme.store || 'store_food';
  return [0.12, 0.32, 0.52, 0.72].map((fx, i) => ({
    id: 'store_' + i,
    sprite: primary,
    label: primary,
    x: worldW * fx,
    y: 6,
    w: 118,
    h: 92,
  }));
}

Game.prototype.resolveSaleBlueprintSize = function () {
  if (this.gameMode === 'sale' && this.worldW > 100 && this.worldH > 100) {
    return { worldW: this.worldW | 0, worldH: this.worldH | 0 };
  }
  return { worldW: SALE_BLUEPRINT_W, worldH: SALE_BLUEPRINT_H };
};

Game.prototype.buildSaleThemeBlueprint = function (arenaId) {
  const id = arenaId || this.selectedArena || 'food';
  const theme = ARENA_THEMES[id] || ARENA_THEMES.food;
  const size = this.resolveSaleBlueprintSize();
  const worldW = size.worldW;
  const worldH = size.worldH;
  const f = ARENA_FENCE;
  return {
    id: 'sale-' + theme.id,
    label: 'Арена · ' + (theme.name || theme.id),
    mode: 'sale',
    source: 'theme',
    arena: theme.id,
    worldW,
    worldH,
    tile: SALE_BLUEPRINT_TILE,
    spawn: { x: worldW / 2, y: worldH / 2 },
    door: {
      x: worldW / 2,
      y: worldH - f.bottom / 2,
      w: f.doorW,
      h: f.doorH,
      label: 'вход',
    },
    walls: saleFenceWalls(worldW, worldH),
    obstacles: saleThemeObstacles(theme, worldW, worldH),
    zones: saleThemeZones(theme, worldW, worldH),
    storefronts: saleThemeStorefronts(theme, worldW),
    tileName: theme.tile || 'tile_dark',
    fenceStripe: theme.fenceStripe || '#888',
  };
};

Game.prototype.buildSaleLiveBlueprint = function () {
  const theme = this.getArenaTheme ? this.getArenaTheme() : (ARENA_THEMES[this.selectedArena] || ARENA_THEMES.food);
  const worldW = this.worldW | 0;
  const worldH = this.worldH | 0;
  const f = ARENA_FENCE;
  const obstacles = (this.obstacles || [])
    .filter((ob) => !ob._saleTemp && !ob._saleBossWall)
    .map((ob) => ({
      kind: 'prop',
      label: ob.sprite || 'prop',
      sprite: ob.sprite,
      x: ob.x,
      y: ob.y,
      w: ob.w,
      h: ob.h,
      dw: ob.dw,
      dh: ob.dh,
    }));
  const zones = (this.zones || []).map((z, i) => ({
    id: 'zone_' + i,
    type: z.type,
    label: z.type,
    x: z.x,
    y: z.y,
    w: z.w,
    h: z.h,
  }));
  const storefronts = (this.storefronts || []).map((s, i) => ({
    id: 'store_' + i,
    sprite: s.sprite,
    label: s.sprite,
    x: s.x,
    y: s.y,
    w: s.w,
    h: s.h,
  }));
  return {
    id: 'sale-' + (theme.id || 'live') + '-live',
    label: 'Арена live · ' + (theme.name || theme.id || 'sale'),
    mode: 'sale',
    source: 'live',
    arena: theme.id || this.selectedArena || 'food',
    worldW,
    worldH,
    tile: SALE_BLUEPRINT_TILE,
    spawn: this.player
      ? { x: this.player.x, y: this.player.y }
      : { x: worldW / 2, y: worldH / 2 },
    door: {
      x: worldW / 2,
      y: worldH - f.bottom / 2,
      w: f.doorW,
      h: f.doorH,
      label: 'вход',
    },
    walls: saleFenceWalls(worldW, worldH),
    obstacles,
    zones,
    storefronts,
    tileName: theme.tile || 'tile_dark',
    fenceStripe: theme.fenceStripe || '#888',
  };
};

Game.prototype.resolveSaleBlueprint = function (opts) {
  opts = opts || {};
  const source = opts.source || 'theme';
  if (source === 'live') return this.buildSaleLiveBlueprint();
  return this.buildSaleThemeBlueprint(opts.arena);
};

function drawSaleBlueprintLayer(blueprint, layer, scale) {
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
  }

  if (drawMarkers && (layer === 'combined' || layer === 'markers')) {
    for (const z of blueprint.zones || []) {
      const colors = {
        slippery: 'rgba(52,152,219,0.22)',
        foodcourt: 'rgba(230,126,34,0.22)',
        checkout: 'rgba(241,196,15,0.22)',
      };
      c.fillStyle = colors[z.type] || 'rgba(149,165,166,0.2)';
      c.fillRect(z.x * s, z.y * s, z.w * s, z.h * s);
      c.strokeStyle = 'rgba(0,0,0,0.25)';
      c.strokeRect(z.x * s, z.y * s, z.w * s, z.h * s);
    }
  }

  if (drawWalls) {
    c.fillStyle = layer === 'collision' ? '#000' : '#5d6d7e';
    for (const w of blueprint.walls) {
      c.fillRect(w.x * s, w.y * s, w.w * s, w.h * s);
    }
    if (layer !== 'collision' && blueprint.fenceStripe) {
      c.fillStyle = blueprint.fenceStripe;
      for (const w of blueprint.walls) {
        if (String(w.id || '').startsWith('wall_bottom')) {
          c.fillRect(w.x * s, w.y * s, w.w * s, Math.max(4, 6 * s));
        }
      }
    }
  }

  if (drawObs) {
    for (const ob of blueprint.obstacles) {
      c.fillStyle = layer === 'collision' ? '#000' : '#7f8c8d';
      c.fillRect(ob.x * s, ob.y * s, ob.w * s, ob.h * s);
      if (layer === 'combined' && ob.label) {
        c.fillStyle = '#fff';
        c.font = `${Math.max(9, 10 * s)}px monospace`;
        c.fillText(ob.label, ob.x * s + 3, ob.y * s + 12 * s);
      }
    }
  }

  if (drawMarkers) {
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    for (const st of blueprint.storefronts || []) {
      c.fillStyle = 'rgba(155,89,182,0.45)';
      c.fillRect(st.x * s, st.y * s, st.w * s, st.h * s);
      c.fillStyle = '#4a235a';
      c.font = `${Math.max(10, 11 * s)}px monospace`;
      c.fillText(st.label || 'витрина', st.x * s + (st.w * s) / 2, st.y * s + (st.h * s) / 2);
    }

    for (const z of blueprint.zones || []) {
      c.fillStyle = '#1a5276';
      c.font = `bold ${Math.max(11, 12 * s)}px "Segoe UI", sans-serif`;
      c.fillText(z.label, z.x * s + (z.w * s) / 2, z.y * s + (z.h * s) / 2);
    }

    if (blueprint.door) {
      const d = blueprint.door;
      c.fillStyle = 'rgba(52,152,219,0.45)';
      c.fillRect(d.x * s - (d.w * s) / 2, d.y * s - (d.h * s) / 2, d.w * s, d.h * s);
      c.fillStyle = '#1a5276';
      c.font = `bold ${Math.max(11, 12 * s)}px "Segoe UI", sans-serif`;
      c.fillText(d.label || 'вход', d.x * s, d.y * s);
    }

    const sp = blueprint.spawn;
    c.fillStyle = 'rgba(46,204,113,0.55)';
    c.beginPath();
    c.arc(sp.x * s, sp.y * s, 18 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#145a32';
    c.font = `bold ${Math.max(11, 12 * s)}px "Segoe UI", sans-serif`;
    c.fillText('SPAWN', sp.x * s, sp.y * s);
  }

  if (layer === 'combined') {
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = 'rgba(0,0,0,0.72)';
    c.fillRect(8 * s, 8 * s, 320 * s, 96 * s);
    c.fillStyle = '#ecf0f1';
    c.font = `${Math.max(10, 11 * s)}px monospace`;
    const lines = [
      blueprint.label + ' · ' + blueprint.source,
      `${WW}×${WH}px · сетка ${blueprint.tile}px`,
      'зелёный=спавн · синий=дверь · фиолет=витрины',
      'серый=пропсы · тёмно-серый=забор · зоны цветные',
    ];
    lines.forEach((ln, i) => c.fillText(ln, 14 * s, (14 + i * 18) * s));
  }

  return canvas;
}

/**
 * @param {object} [opts]
 * @param {'food'|'tech'|'clothes'|'sport'} [opts.arena]
 * @param {'theme'|'live'} [opts.source='theme']
 * @param {number} [opts.scale=1]
 * @param {'pack'|'combined'|'layers'} [opts.mode='pack']
 */
Game.prototype.exportSaleMapBlueprint = async function (opts) {
  if (!saleBlueprintEnabled()) {
    console.warn('[sale-blueprint] только в dev-окружении');
    return null;
  }
  opts = opts || {};
  const scale = opts.scale == null ? 1 : Math.max(0.25, Math.min(1, Number(opts.scale) || 1));
  const mode = opts.mode || 'pack';
  const blueprint = this.resolveSaleBlueprint(opts);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const base = blueprint.id + '_' + stamp;

  const json = Object.assign({}, blueprint, {
    exportedAt: new Date().toISOString(),
    scale,
    psHint: 'Импортируй PNG в Photoshop 1:1. Сетка 64px = тайл пола. collision — маска непроходимых зон (забор + footprint пропсов). source=theme — шаблон темы; source=live — текущий рандомный забег.',
  });

  if (mode === 'combined' || mode === 'pack') {
    const canvas = drawSaleBlueprintLayer(blueprint, 'combined', scale);
    await saleDownloadCanvas(canvas, base + '_blueprint.png');
    await saleDelay(250);
  }

  if (mode === 'layers' || mode === 'pack') {
    const layers = ['floor', 'grid', 'walls', 'collision', 'markers'];
    for (const layer of layers) {
      const canvas = drawSaleBlueprintLayer(blueprint, layer, scale);
      await saleDownloadCanvas(canvas, base + '_' + layer + '.png');
      await saleDelay(250);
    }
  }

  saleDownloadJson(base + '.json', json);

  try {
    console.log('[sale-blueprint] exported', base, blueprint);
  } catch (_) { /* ignore */ }
  return blueprint;
};

if (saleBlueprintEnabled()) {
  window.__sale = window.__sale || {};
  Object.assign(window.__sale, {
    exportMap: (opts) => {
      const g = window.game;
      if (!g || typeof g.exportSaleMapBlueprint !== 'function') return Promise.resolve(null);
      return g.exportSaleMapBlueprint(opts);
    },
    exportAll: async () => {
      const g = window.game;
      if (!g) return;
      const ids = Object.keys(ARENA_THEMES || { food: 1, tech: 1, clothes: 1, sport: 1 });
      for (const id of ids) {
        await g.exportSaleMapBlueprint({ arena: id, source: 'theme', mode: 'pack' });
        await saleDelay(400);
      }
    },
  });
}
