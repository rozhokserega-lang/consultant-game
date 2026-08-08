#!/usr/bin/env python3
"""Сборка anim_fx_atlas.png + anim_fx_data.js из CC0-паков.

Источники (см. ATTRIBUTION.md):
- CodeManu «Free Pixel Effects Pack» (CC0) — анимированные эффекты 100x100
- Kenney «Particle Pack» (CC0) — белые тонируемые частицы (даунскейл до 128px)
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_PNG = os.path.join(ROOT, '..', 'anim_fx_atlas.png')
OUT_JS = os.path.join(ROOT, '..', 'anim_fx_data.js')

CM = os.path.join(ROOT, 'codemanu')
KN = os.path.join(ROOT, 'kenney_particles')

# id -> (файл, размер кадра листа, сколько кадров взять, loop, fps)
CODEMANU = {
    'afx_explosion':  ('16_sunburn_spritesheet.png', 100, 12, False, 24),
    'afx_bigburst':   ('12_nebula_spritesheet.png', 100, 12, False, 24),
    'afx_vortex':     ('13_vortex_spritesheet.png', 100, 12, True, 20),
    'afx_slash':      ('14_phantom_spritesheet.png', 100, 10, False, 26),
    'afx_hit':        ('5_magickahit_spritesheet.png', 100, 10, False, 28),
    'afx_levelup':    ('17_felspell_spritesheet.png', 100, 12, False, 22),
    'afx_darkburst':  ('18_midnight_spritesheet.png', 100, 12, False, 22),
    'afx_heal':       ('1_magicspell_spritesheet.png', 100, 10, False, 22),
    'afx_fireloop':   ('11_fire_spritesheet.png', 100, 12, True, 16),
    'afx_firespin':   ('7_firespin_spritesheet.png', 100, 12, True, 18),
    'afx_ring':       ('10_weaponhit_spritesheet.png', 100, 10, False, 26),
    'afx_bubbles':    ('20_magicbubbles_spritesheet.png', 100, 10, True, 14),
    'afx_bluefire':   ('3_bluefire_spritesheet.png', 100, 10, False, 24),
    'afx_protect':    ('8_protectioncircle_spritesheet.png', 100, 12, True, 16),
}

# Kenney: одиночные белые кадры под тонировку (128px)
KENNEY = {
    'kfx_slash': 'slash_03.png',
    'kfx_slash_wide': 'slash_02.png',
    'kfx_circle': 'circle_05.png',
    'kfx_circle_hard': 'circle_02.png',
    'kfx_scorch': 'scorch_01.png',
    'kfx_glow': 'light_02.png',
    'kfx_spark': 'spark_04.png',
    'kfx_twirl': 'twirl_02.png',
}
K_SIZE = 128

CELL = 100
COLS = 16  # 16 * 100 = 1600 px в ширину


def sample_frames(img, fw, count):
    cols = img.width // fw
    rows = img.height // fw
    total = cols * rows
    picks = [min(total - 1, round(i * (total - 1) / max(1, count - 1))) for i in range(count)]
    out = []
    for idx in picks:
        cx, cy = idx % cols, idx // cols
        out.append(img.crop((cx * fw, cy * fw, (cx + 1) * fw, (cy + 1) * fw)))
    return out


def main():
    cells = []  # (эффект, номер кадра, изображение 100x100)
    defs = {}

    for fx_id, (fname, fw, count, loop, fps) in CODEMANU.items():
        img = Image.open(os.path.join(CM, fname)).convert('RGBA')
        frames = sample_frames(img, fw, count)
        defs[fx_id] = {'frames': len(frames), 'loop': loop, 'fps': fps, 'tint': False}
        for i, fr in enumerate(frames):
            if fw != CELL:
                fr = fr.resize((CELL, CELL), Image.NEAREST)
            cells.append((fx_id, i, fr))

    for fx_id, fname in KENNEY.items():
        img = Image.open(os.path.join(KN, fname)).convert('RGBA')
        img = img.resize((K_SIZE, K_SIZE), Image.LANCZOS)
        # белые частицы кладём в ячейку 100px с даунскейлом до 100
        img = img.resize((CELL, CELL), Image.LANCZOS)
        defs[fx_id] = {'frames': 1, 'loop': False, 'fps': 1, 'tint': True}
        cells.append((fx_id, 0, img))

    rows = (len(cells) + COLS - 1) // COLS
    atlas = Image.new('RGBA', (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    frames_meta = {}
    for n, (fx_id, i, fr) in enumerate(cells):
        x = (n % COLS) * CELL
        y = (n // COLS) * CELL
        atlas.paste(fr, (x, y))
        frames_meta.setdefault(fx_id, []).append({'x': x, 'y': y, 'w': CELL, 'h': CELL})

    atlas.save(OUT_PNG, optimize=True)

    js = (
        '// Автогенерировано assets_src/build_anim_atlas.py — не редактировать руками.\n'
        '// Источники: CodeManu Free Pixel Effects Pack (CC0), Kenney Particle Pack (CC0).\n'
        'window.ANIM_FX_DEFS = ' + json.dumps(defs) + ';\n'
        'window.ANIM_FX_FRAMES = ' + json.dumps(frames_meta) + ';\n'
    )
    with open(OUT_JS, 'w') as f:
        f.write(js)

    kb = os.path.getsize(OUT_PNG) / 1024
    print(f'atlas {atlas.width}x{atlas.height}, {kb:.0f} KB, effects={len(defs)}, cells={len(cells)}')


if __name__ == '__main__':
    main()
