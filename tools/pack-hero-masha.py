"""Нарезка стрипов Маши → атлас + JS.

Исходники: tools/assets/heroes/masha/*.png (не в прекеше).
Запуск из корня: python tools/pack-hero-masha.py
"""
from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'tools' / 'assets' / 'heroes' / 'masha'
OUT_ATLAS = ROOT / 'assets' / 'heroes' / 'masha' / 'atlas.png'
OUT_JS = ROOT / 'src' / 'game' / 'render' / 'atlases' / 'hero-masha.js'

TARGET_H = 85
PAD = 2

STRIPS = [
    ('run.png', 'run', 5),
    ('walk_right.png', 'walk_right', 7),
    ('walk_down.png', 'walk_down', 6),
    ('walk_up.png', 'walk_up', 6),
    ('atk_punch.png', 'atk_punch', 5),
]


def is_backdrop(r: int, g: int, b: int) -> bool:
    chroma = max(r, g, b) - min(r, g, b)
    lum = (r + g + b) // 3
    if chroma > 18:
        return False
    return lum <= 22 or lum >= 170


def flood_backdrop(im: Image.Image) -> Image.Image:
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    q = deque()

    def push(x: int, y: int) -> None:
        i = y * w + x
        if seen[i]:
            return
        r, g, b, _ = px[x, y]
        if not is_backdrop(r, g, b):
            return
        seen[i] = 1
        q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        if x > 0:
            push(x - 1, y)
        if x + 1 < w:
            push(x + 1, y)
        if y > 0:
            push(x, y - 1)
        if y + 1 < h:
            push(x, y + 1)

    # оставшийся почти-чёрный внутри сцены — тоже фон
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) <= 12:
                px[x, y] = (0, 0, 0, 0)
    return im


def content_bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 12:
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return None
    return minx, miny, maxx + 1, maxy + 1


def slice_strip(path: Path, count: int) -> list[Image.Image]:
    raw = Image.open(path)
    cleared = flood_backdrop(raw)
    w, h = cleared.size
    frames = []
    for i in range(count):
        x0 = int(round(i * w / count))
        x1 = int(round((i + 1) * w / count))
        cell = cleared.crop((x0, 0, x1, h))
        box = content_bbox(cell)
        if not box:
            frames.append(cell)
            continue
        pad = 2
        x0b = max(0, box[0] - pad)
        y0b = max(0, box[1] - pad)
        x1b = min(cell.width, box[2] + pad)
        y1b = min(cell.height, box[3] + pad)
        crop = cell.crop((x0b, y0b, x1b, y1b))
        scale = TARGET_H / crop.height
        nw = max(1, int(round(crop.width * scale)))
        nh = TARGET_H
        frames.append(crop.resize((nw, nh), Image.Resampling.LANCZOS))
    return frames


def pack(rows: list[tuple[str, list[Image.Image]]]) -> tuple[Image.Image, dict]:
    width = PAD
    height = PAD
    for _, frames in rows:
        width = max(width, PAD + sum(f.width + PAD for f in frames))
        height += max(f.height for f in frames) + PAD
    atlas = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    frames_meta = {}
    anims = {}
    y = PAD
    for name, frames in rows:
        x = PAD
        keys = []
        row_h = max(f.height for f in frames)
        for i, fr in enumerate(frames):
            dy = y + (row_h - fr.height)
            atlas.alpha_composite(fr, (x, dy))
            key = f'{name}_{i}'
            frames_meta[key] = {'x': x, 'y': dy, 'w': fr.width, 'h': fr.height}
            keys.append(key)
            x += fr.width + PAD
        anims[name] = keys
        y += row_h + PAD
    return atlas, {'frames': frames_meta, 'anims': anims}


def write_js(data: dict) -> None:
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    src = (
        '/**\n'
        ' * Распродажа: спрайт-лист Маши.\n'
        ' */\n'
        "'use strict';\n\n"
        f'const MASHA_ANIM = {payload};\n\n'
        'const mashaAnimImg = new Image();\n'
        'let mashaAnimReady = false;\n'
        'mashaAnimImg.onload = () => { mashaAnimReady = true; };\n'
        "mashaAnimImg.src = 'assets/heroes/masha/atlas.png';\n\n"
        'HERO_ANIM_PACKS.masha = {\n'
        "  id: 'masha',\n"
        '  frames: MASHA_ANIM.frames,\n'
        '  anims: MASHA_ANIM.anims,\n'
        '  img: mashaAnimImg,\n'
        '  ready() { return mashaAnimReady; },\n'
        '};\n'
    )
    OUT_JS.write_text(src, encoding='utf-8')


def main() -> None:
    rows = []
    for file_name, anim, count in STRIPS:
        path = SRC / file_name
        if not path.exists():
            raise SystemExit(f'Нет файла {path}')
        print('slice', anim, path.name)
        rows.append((anim, slice_strip(path, count)))
    atlas, data = pack(rows)
    OUT_ATLAS.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT_ATLAS)
    write_js(data)
    print('atlas', atlas.size, '->', OUT_ATLAS.relative_to(ROOT))
    print('js', OUT_JS.relative_to(ROOT))


if __name__ == '__main__':
    main()
