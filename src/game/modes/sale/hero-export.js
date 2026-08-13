/**
 * Распродажа: выгрузка кадров героя для скинов.
 * Dev (localhost / file:// / ?dev=1):
 *   __sale.exportHero()
 *   __sale.exportHero({ frames: true })
 * На file:// canvas tainted — кадры режет python tools/export-hero-patterns.py
 */
'use strict';

function saleHeroExportEnabled() {
  return typeof isDevEnvironment === 'function' && isDevEnvironment();
}

function saleHeroDownloadBlob(filename, blob) {
  if (typeof saleDownloadBlob === 'function') {
    saleDownloadBlob(filename, blob);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function saleHeroDownloadJson(filename, data) {
  saleHeroDownloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
}

function saleHeroCanvasTainted(canvas) {
  try {
    canvas.getContext('2d').getImageData(0, 0, 1, 1);
    return false;
  } catch (_) {
    return true;
  }
}

function saleHeroDownloadHref(relPath, filename) {
  const a = document.createElement('a');
  a.href = relPath;
  a.download = filename || relPath.split('/').pop();
  a.click();
}

function saleHeroDownloadCanvas(canvas, filename) {
  if (saleHeroCanvasTainted(canvas)) {
    return Promise.reject(new Error('tainted'));
  }
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) saleHeroDownloadBlob(filename, blob);
        resolve();
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

function saleHeroDelay(ms) {
  if (typeof saleDelay === 'function') return saleDelay(ms);
  return new Promise((r) => setTimeout(r, ms));
}

function saleHeroAnimReady() {
  if (typeof playerAnimReady !== 'undefined' && playerAnimReady) return Promise.resolve();
  if (typeof playerAnimImg === 'undefined') {
    return Promise.reject(new Error('Нет атласа героя (playerAnimImg)'));
  }
  if (playerAnimImg.complete && playerAnimImg.naturalWidth) return Promise.resolve();
  return new Promise((resolve, reject) => {
    playerAnimImg.addEventListener('load', () => resolve(), { once: true });
    playerAnimImg.addEventListener('error', () => reject(new Error('Не загрузился player_anim_atlas.png')), { once: true });
  });
}

function saleHeroAnimCell(keys) {
  let w = 1;
  let h = 1;
  for (const key of keys) {
    const f = PLAYER_ANIM.frames[key];
    if (!f) continue;
    if (f.w > w) w = f.w;
    if (f.h > h) h = f.h;
  }
  return { w, h };
}

function saleHeroBlitFrame(ctx, key, dx, dy, cellW, cellH) {
  const f = PLAYER_ANIM.frames[key];
  if (!f) return;
  const x = dx + Math.floor((cellW - f.w) / 2);
  const y = dy + (cellH - f.h);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(playerAnimImg, f.x, f.y, f.w, f.h, x, y, f.w, f.h);
}

function saleHeroDrawStrip(keys) {
  const cell = saleHeroAnimCell(keys);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cell.w * keys.length);
  canvas.height = Math.max(1, cell.h);
  const ctx = canvas.getContext('2d');
  keys.forEach((key, i) => saleHeroBlitFrame(ctx, key, i * cell.w, 0, cell.w, cell.h));
  return { canvas, cell };
}

function saleHeroDrawSheet(scale) {
  scale = scale || 2;
  const pad = 10;
  const labelH = 16;
  const rowGap = 14;
  const anims = PLAYER_ANIM.anims;
  const rows = [];
  let width = pad;
  let height = pad + 22;
  for (const anim of Object.keys(anims)) {
    const keys = anims[anim];
    const cell = saleHeroAnimCell(keys);
    const cw = cell.w * scale;
    const ch = cell.h * scale;
    const rowW = pad + keys.length * (cw + pad);
    rows.push({ anim, keys, cell, cw, ch, rowW });
    if (rowW > width) width = rowW;
    height += labelH + ch + rowGap;
  }
  width += pad;
  height += pad;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a1520';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('Паттерны героя — те же имена кадров для нового скина', pad, pad);

  let y = pad + 22;
  for (const row of rows) {
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(row.anim + '  ×' + row.keys.length + '  ' + row.cell.w + '×' + row.cell.h, pad, y);
    y += labelH;
    row.keys.forEach((key, i) => {
      const x = pad + i * (row.cw + pad);
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, row.cw, row.ch);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      saleHeroBlitFrame(ctx, key, 0, 0, row.cell.w, row.cell.h);
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(x, y + row.ch - 13, row.cw, 13);
      ctx.fillStyle = '#fff';
      ctx.font = '9px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(key.replace(row.anim + '_', ''), x + 3, y + row.ch - 6);
    });
    y += row.ch + rowGap;
  }
  return canvas;
}

function saleHeroDrawAtlasCopy() {
  const canvas = document.createElement('canvas');
  canvas.width = playerAnimImg.naturalWidth;
  canvas.height = playerAnimImg.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(playerAnimImg, 0, 0);
  return canvas;
}

async function exportSaleHeroPatterns(opts) {
  opts = opts || {};
  if (!saleHeroExportEnabled()) {
    console.warn('[hero-export] только в dev (localhost или ?dev=1)');
    return null;
  }
  if (typeof PLAYER_ANIM === 'undefined' || !PLAYER_ANIM.frames) {
    console.warn('[hero-export] PLAYER_ANIM нет');
    return null;
  }
  await saleHeroAnimReady();

  const stamp = new Date().toISOString().slice(0, 10);
  const base = 'hero-patterns-' + stamp;
  const stripsMeta = {};
  for (const anim of Object.keys(PLAYER_ANIM.anims)) {
    const keys = PLAYER_ANIM.anims[anim];
    const cell = saleHeroAnimCell(keys);
    stripsMeta[anim] = { file: base + '_' + anim + '.png', cellW: cell.w, cellH: cell.h, count: keys.length };
  }
  const json = {
    exportedAt: new Date().toISOString(),
    source: 'assets/atlases/player_anim_atlas.png',
    inGameScale: typeof PLAYER_SPRITE_SCALE === 'number' ? PLAYER_SPRITE_SCALE : 0.54,
    anchor: { x: 0.5, y: 1 },
    note: 'Сейчас все герои — этот лист + hue. Новый скин: нарисуй кадры тех же имён и размеров (якорь — ноги по центру низа), собери атлас, подключи в src/game/render/atlases/player.js.',
    heroesHue: typeof SALE_HEROES !== 'undefined'
      ? Object.fromEntries(Object.keys(SALE_HEROES).map((id) => [id, SALE_HEROES[id].hue]))
      : null,
    anims: PLAYER_ANIM.anims,
    frames: PLAYER_ANIM.frames,
    strips: stripsMeta,
  };

  const firstAnim = Object.keys(PLAYER_ANIM.anims)[0];
  const probe = saleHeroDrawStrip(PLAYER_ANIM.anims[firstAnim]);
  if (saleHeroCanvasTainted(probe.canvas)) {
    saleHeroDownloadHref('assets/atlases/player_anim_atlas.png', base + '_atlas.png');
    saleHeroDownloadJson(base + '.json', json);
    console.warn(
      '[hero-export] file:// не даёт вырезать кадры (tainted canvas).\n'
      + 'Атлас и JSON скачались. Полоски кадров:\n'
      + '  python tools/export-hero-patterns.py\n'
      + 'Файлы появятся в export/hero-patterns/\n'
      + 'Либо открой игру через сервер (localhost) и снова вызови __sale.exportHero()',
    );
    return json;
  }

  const strips = stripsMeta;
  for (const anim of Object.keys(PLAYER_ANIM.anims)) {
    const keys = PLAYER_ANIM.anims[anim];
    const drawn = saleHeroDrawStrip(keys);
    strips[anim] = { file: base + '_' + anim + '.png', cellW: drawn.cell.w, cellH: drawn.cell.h, count: keys.length };
    await saleHeroDownloadCanvas(drawn.canvas, strips[anim].file);
    await saleHeroDelay(180);
  }

  await saleHeroDownloadCanvas(saleHeroDrawSheet(2), base + '_sheet.png');
  await saleHeroDelay(180);
  await saleHeroDownloadCanvas(saleHeroDrawAtlasCopy(), base + '_atlas.png');
  await saleHeroDelay(180);

  if (opts.frames) {
    for (const key of Object.keys(PLAYER_ANIM.frames)) {
      const f = PLAYER_ANIM.frames[key];
      const canvas = document.createElement('canvas');
      canvas.width = f.w;
      canvas.height = f.h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(playerAnimImg, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      await saleHeroDownloadCanvas(canvas, base + '_' + key + '.png');
      await saleHeroDelay(80);
    }
  }

  saleHeroDownloadJson(base + '.json', json);
  console.log('[hero-export]', base, Object.keys(PLAYER_ANIM.anims));
  return json;
}

if (saleHeroExportEnabled()) {
  window.__sale = window.__sale || {};
  Object.assign(window.__sale, {
    exportHero: (opts) => exportSaleHeroPatterns(opts),
  });
  window.__game = window.__sale;
}
