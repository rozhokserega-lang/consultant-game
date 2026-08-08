#!/usr/bin/env python3
"""Сборка mart_atlas.png + mart_data.js из пака Pixel Mart (CC0, ghostpixxells).

Товары служат XP-дропами (тир по ценности гема) и спрайтами пауэрапов.
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'pixel_mart')
OUT_PNG = os.path.join(ROOT, '..', 'mart_atlas.png')
OUT_JS = os.path.join(ROOT, '..', 'mart_data.js')

# XP-дропы по тирам: дешёвка / середина / деликатесы
TIERS = {
    1: ['red_apple', 'banana', 'potato', 'egg_white', 'milk_pack', 'cabbage',
        'mushroom_white', 'strawberry', 'green_apple', 'candy_bar', 'snack1', 'bubble_gum'],
    2: ['cereal1', 'potatochip_yellow', 'orange_juice', 'soft_drink_red', 'cookies',
        'tuna_can', 'ketchup', 'milk_chocolate', 'grape_soda', 'coffee_bag',
        'strawberry_jam', 'peanut_butter'],
    3: ['wine_red', 'salmon', 'meat1', 'white_cheese', 'teakettle', 'frying pan',
        'kitchen_knife_set', 'watermelon1', 'strawberry_ice_cream', 'olive_oil'],
}

# спрайты интерфейсных сущностей
EXTRA = ['paper_bag', 'basket_yellow', 'receipt', 'credit_card_1']

CELL = 32
COLS = 8


def main():
    names = []
    for tier in (1, 2, 3):
        names.extend(TIERS[tier])
    names.extend(EXTRA)

    rows = (len(names) + COLS - 1) // COLS
    atlas = Image.new('RGBA', (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    frames = {}
    for i, name in enumerate(names):
        p = os.path.join(SRC, name + '.png')
        img = Image.open(p).convert('RGBA')
        assert img.size == (CELL, CELL), f'{name}: {img.size}'
        x = (i % COLS) * CELL
        y = (i // COLS) * CELL
        atlas.paste(img, (x, y))
        frames[name] = {'x': x, 'y': y, 'w': CELL, 'h': CELL}

    atlas.save(OUT_PNG, optimize=True)

    js = (
        '// Автогенерировано assets_src/build_mart_atlas.py — не редактировать руками.\n'
        '// Источник: Pixel Mart by ghostpixxells (CC0), https://ghostpixxells.itch.io/pixel-mart\n'
        'window.MART_FRAMES = ' + json.dumps(frames) + ';\n'
        'window.MART_TIERS = ' + json.dumps({str(k): v for k, v in TIERS.items()}) + ';\n'
    )
    with open(OUT_JS, 'w') as f:
        f.write(js)

    kb = os.path.getsize(OUT_PNG) / 1024
    print(f'atlas {atlas.width}x{atlas.height}, {kb:.1f} KB, icons={len(names)}')


if __name__ == '__main__':
    main()
