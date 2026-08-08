#!/usr/bin/env python3
"""Build dark-background contact sheets for downloaded asset packs."""
import os
from PIL import Image

BG = (26, 26, 46, 255)  # #1a1a2e — фон игры
ROOT = os.path.dirname(os.path.abspath(__file__))


def load(p):
    return Image.open(p).convert('RGBA')


def sheet_mid_frame(img, frame_w, frame_h):
    """Взять выразительный кадр (~40% таймлайна) из грида frame_w x frame_h."""
    cols = img.width // frame_w
    rows = img.height // frame_h
    total = max(1, cols * rows)
    idx = int(total * 0.4)
    cx, cy = idx % cols, idx // cols
    return img.crop((cx * frame_w, cy * frame_h, (cx + 1) * frame_w, (cy + 1) * frame_h))


def montage(cells, cols, cell, pad, out, labels=None, scale_mode='fit'):
    rows = (len(cells) + cols - 1) // cols
    W = cols * (cell + pad) + pad
    H = rows * (cell + pad + 14) + pad
    canvas = Image.new('RGBA', (W, H), BG)
    for i, im in enumerate(cells):
        x = pad + (i % cols) * (cell + pad)
        y = pad + (i // cols) * (cell + pad + 14)
        w, h = im.size
        if scale_mode == 'fit':
            k = min(cell / w, cell / h)
        else:  # integer upscale for pixel art
            k = max(1, int(min(cell / w, cell / h)))
        nw, nh = max(1, int(w * k)), max(1, int(h * k))
        im2 = im.resize((nw, nh), Image.NEAREST)
        canvas.alpha_composite(im2, (x + (cell - nw) // 2, y + (cell - nh) // 2))
    canvas.convert('RGB').save(out)
    print('saved', out)


# 1) CodeManu Free Pixel Effects (CC0) — 20 листов, кадр 100x100
cm_dir = os.path.join(ROOT, 'codemanu')
cm_cells = []
for f in sorted(os.listdir(cm_dir)):
    if not f.endswith('_spritesheet.png'):
        continue
    img = load(os.path.join(cm_dir, f))
    cm_cells.append(sheet_mid_frame(img, 100, 100))
montage(cm_cells, 5, 110, 8, os.path.join(ROOT, 'preview_codemanu.png'), scale_mode='int')

# 2) DevWizard Pixel Art Spells (CC0) — маленькие листы, покажем целиком x3
sp_dir = os.path.join(ROOT, 'pixelart_spells', 'Pixelart Spells', 'PNG Files')
sp_cells = []
for f in sorted(os.listdir(sp_dir)):
    if f.endswith('.png'):
        img = load(os.path.join(sp_dir, f))
        sp_cells.append(img)
montage(sp_cells, 4, 200, 8, os.path.join(ROOT, 'preview_spells.png'), scale_mode='int')

# 3) Kenney Particle Pack (CC0) — репрезентативные частицы
kn_dir = os.path.join(ROOT, 'kenney_particles')
names = ['flame_01', 'flame_04', 'fire_01', 'magic_01', 'magic_04', 'slash_01',
         'slash_03', 'spark_04', 'star_06', 'twirl_02', 'smoke_04', 'scorch_01',
         'muzzle_01', 'trace_01', 'symbol_02', 'light_01']
kn_cells = []
for n in names:
    p = os.path.join(kn_dir, n + '.png')
    if os.path.exists(p):
        kn_cells.append(load(p))
montage(kn_cells, 4, 130, 8, os.path.join(ROOT, 'preview_kenney.png'), scale_mode='fit')
