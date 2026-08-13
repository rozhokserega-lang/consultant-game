"""Выгрузка кадров главного героя для скинов.

Запуск из корня репозитория:
  python tools/export-hero-patterns.py

Результат: export/hero-patterns/
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PLAYER_JS = ROOT / 'src' / 'game' / 'render' / 'atlases' / 'player.js'
ATLAS = ROOT / 'assets' / 'atlases' / 'player_anim_atlas.png'
OUT = ROOT / 'export' / 'hero-patterns'


def load_player_anim() -> dict:
    src = PLAYER_JS.read_text(encoding='utf-8')
    match = re.search(r'const PLAYER_ANIM = ({.*?});', src, re.S)
    if not match:
        raise SystemExit('Не нашёл PLAYER_ANIM в player.js')
    return json.loads(match.group(1))


def cell_size(frames: dict, keys: list[str]) -> tuple[int, int]:
    w = max(frames[k]['w'] for k in keys)
    h = max(frames[k]['h'] for k in keys)
    return w, h


def blit(atlas: Image.Image, frames: dict, key: str, dst: Image.Image, dx: int, dy: int, cw: int, ch: int) -> None:
    f = frames[key]
    crop = atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
    x = dx + (cw - f['w']) // 2
    y = dy + (ch - f['h'])
    dst.alpha_composite(crop, (x, y))


def draw_sheet(atlas: Image.Image, data: dict, scale: int = 2) -> Image.Image:
    frames = data['frames']
    anims = data['anims']
    pad = 10
    label_h = 18
    row_gap = 14
    rows = []
    width = pad
    height = pad + 24
    for anim, keys in anims.items():
        cw, ch = cell_size(frames, keys)
        cw_s, ch_s = cw * scale, ch * scale
        row_w = pad + len(keys) * (cw_s + pad)
        rows.append((anim, keys, cw, ch, cw_s, ch_s, row_w))
        width = max(width, row_w)
        height += label_h + ch_s + row_gap
    width += pad
    height += pad
    img = Image.new('RGBA', (width, height), (26, 21, 32, 255))
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    draw.text((pad, pad), 'Паттерны героя — те же имена кадров для нового скина', fill=(196, 181, 253, 255), font=font)
    y = pad + 24
    for anim, keys, cw, ch, cw_s, ch_s, _ in rows:
        draw.text((pad, y), f'{anim}  x{len(keys)}  {cw}x{ch}', fill=(253, 230, 138, 255), font=font)
        y += label_h
        for i, key in enumerate(keys):
            x = pad + i * (cw_s + pad)
            cell = Image.new('RGBA', (cw, ch), (255, 0, 255, 255))
            blit(atlas, frames, key, cell, 0, 0, cw, ch)
            cell = cell.resize((cw_s, ch_s), Image.NEAREST)
            img.alpha_composite(cell, (x, y))
            draw.rectangle((x, y + ch_s - 13, x + cw_s, y + ch_s), fill=(0, 0, 0, 170))
            suffix = key[len(anim) + 1 :] if key.startswith(anim + '_') else key
            draw.text((x + 3, y + ch_s - 12), suffix, fill=(255, 255, 255, 255), font=font)
        y += ch_s + row_gap
    return img


def main() -> None:
    data = load_player_anim()
    frames = data['frames']
    anims = data['anims']
    atlas = Image.open(ATLAS).convert('RGBA')
    OUT.mkdir(parents=True, exist_ok=True)
    frames_dir = OUT / 'frames'
    frames_dir.mkdir(exist_ok=True)

    shutil.copyfile(ATLAS, OUT / 'atlas.png')

    strips = {}
    for anim, keys in anims.items():
        cw, ch = cell_size(frames, keys)
        strip = Image.new('RGBA', (cw * len(keys), ch), (0, 0, 0, 0))
        for i, key in enumerate(keys):
            blit(atlas, frames, key, strip, i * cw, 0, cw, ch)
        name = f'{anim}.png'
        strip.save(OUT / name)
        strips[anim] = {'file': name, 'cellW': cw, 'cellH': ch, 'count': len(keys)}

    draw_sheet(atlas, data, 2).save(OUT / 'sheet.png')

    for key, f in frames.items():
        crop = atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
        crop.save(frames_dir / f'{key}.png')

    meta = {
        'source': 'assets/atlases/player_anim_atlas.png',
        'inGameScale': 0.54,
        'anchor': {'x': 0.5, 'y': 1},
        'note': 'Новый скин: те же имена и размеры кадров, якорь — ноги по центру низа.',
        'anims': anims,
        'frames': frames,
        'strips': strips,
    }
    (OUT / 'hero-patterns.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
    print('OK —', OUT)
    print('  atlas.png, sheet.png, полоски анимаций, frames/*.png, hero-patterns.json')


if __name__ == '__main__':
    main()
