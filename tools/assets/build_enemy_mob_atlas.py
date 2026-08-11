#!/usr/bin/env python3
"""Сборка enemy_mob_atlas.png из новых листов + strike-кадров старого атласа.

Источники листов: assets_src/mob_gen/mob_*_preview.png
(скопировать из Downloads или положить вручную).

Запуск из корня репозитория:
  python tools/assets/build_enemy_mob_atlas.py
"""
from __future__ import annotations

import glob
import json
import re
import sys
from collections import deque
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
GEN_DIR = REPO / 'assets_src' / 'mob_gen'
OUT_PNG = REPO / 'assets' / 'atlases' / 'enemy_mob_atlas.png'
OUT_META = REPO / 'assets' / 'atlases' / 'enemy_mob_meta.json'
OUT_JS = REPO / 'src' / 'game' / 'render' / 'atlases' / 'enemy-mobs.js'
OLD_PNG = REPO / 'assets' / 'atlases' / 'enemy_mob_atlas_legacy.png'
OLD_META = REPO / 'assets' / 'atlases' / 'enemy_mob_meta_legacy.json'
# fallback если legacy ещё не создан — текущий атлас в репо
OLD_PNG_FALLBACK = REPO / 'assets' / 'atlases' / 'enemy_mob_atlas.png'
OLD_META_FALLBACK = REPO / 'assets' / 'atlases' / 'enemy_mob_meta.json'
REF_H = 82
PAD = 2
MIN_SPRITE_AREA = 1200
MIN_COL_WIDTH = 42

MOB_IDS = [
    'mob_tank', 'mob_purple', 'mob_fast', 'mob_elder',
    'mob_muscle', 'mob_pink', 'mob_cane',
]

# roles — кадры на листе (4 в ряд); keep_old — из прежнего атласа;
# anim_order — порядок кадров в цикле (суффиксы без mob_id_).
MOB_LAYOUT: dict[str, dict] = {
    'mob_tank': {
        'roles': ['idle', 'walk_0', 'run_0', 'attack_windup'],
        'keep_old': ['walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
    'mob_purple': {
        'roles': ['idle', 'walk_0', 'run_0', 'attack_windup'],
        'keep_old': ['walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
    'mob_fast': {
        'roles': ['walk_0', 'walk_1', 'run_0', 'attack_windup'],
        'keep_old': ['idle', 'walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk_1', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
    'mob_elder': {
        'roles': ['walk_0', 'walk_1', 'run_0', 'attack_windup'],
        'keep_old': ['idle', 'walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk_1', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
    'mob_muscle': {
        'roles': ['idle', 'walk_0', 'run_0', 'attack_windup'],
        'keep_old': ['walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
    'mob_pink': {
        'roles': ['idle', 'walk_0', 'run_0', 'attack_windup'],
        'keep_old': ['walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
    'mob_cane': {
        'roles': ['walk_0', 'walk_1', 'run_0', 'attack_windup'],
        'keep_old': ['idle', 'walk', 'run', 'attack'],
        'anim_order': {
            'walk': ['walk_0', 'walk_1', 'walk'],
            'run': ['run_0', 'run'],
            'attack': ['attack_windup', 'attack'],
        },
    },
}


def lum(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def is_bg_pixel(r: int, g: int, b: int, light_bg: bool) -> bool:
    if light_bg:
        if min(r, g, b) >= 238:
            return True
        if min(r, g, b) >= 210 and max(r, g, b) - min(r, g, b) <= 18:
            return True
        return False
    return max(r, g, b) <= 28


def flood_background(im: Image.Image) -> Image.Image:
    rgb = im.convert('RGB')
    w, h = rgb.size
    px = rgb.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    light_bg = sum(lum(*c) for c in corners) / len(corners) > 128

    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h:
            r, g, b = px[x, y]
            if is_bg_pixel(r, g, b, light_bg):
                q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        if bg[y][x]:
            continue
        r, g, b = px[x, y]
        if not is_bg_pixel(r, g, b, light_bg):
            continue
        bg[y][x] = True
        if x > 0:
            q.append((x - 1, y))
        if x + 1 < w:
            q.append((x + 1, y))
        if y > 0:
            q.append((x, y - 1))
        if y + 1 < h:
            q.append((x, y + 1))

    out = im.convert('RGBA')
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                opx[x, y] = (0, 0, 0, 0)
            elif opx[x, y][3] > 0:
                r, g, b, _ = opx[x, y]
                opx[x, y] = (r, g, b, 255)
    return out


def split_sprites(im: Image.Image) -> list[Image.Image]:
    """Нарезка кадров по вертикальным полосам прозрачности (листы — один ряд)."""
    im = flood_background(im)
    w, h = im.size
    px = im.load()
    col = [sum(1 for y in range(h) if px[x, y][3] > 40) for x in range(w)]
    segments: list[tuple[int, int]] = []
    i = 0
    while i < w:
        while i < w and col[i] == 0:
            i += 1
        start = i
        while i < w and col[i] > 0:
            i += 1
        if i - start >= MIN_COL_WIDTH:
            pad = 4
            x0 = max(0, start - pad)
            x1 = min(w, i + pad)
            y0, y1 = 0, h
            # trim vertical whitespace per segment
            for y in range(h):
                if any(px[x, y][3] > 40 for x in range(x0, x1)):
                    y0 = max(0, y - pad)
                    break
            for y in range(h - 1, -1, -1):
                if any(px[x, y][3] > 40 for x in range(x0, x1)):
                    y1 = min(h, y + pad + 1)
                    break
            segments.append((x0, y0, x1, y1))
    return [im.crop(box) for box in segments]


def load_old_meta() -> dict:
    path = OLD_META if OLD_META.is_file() else OLD_META_FALLBACK
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def load_old_atlas() -> Image.Image:
    path = OLD_PNG if OLD_PNG.is_file() else OLD_PNG_FALLBACK
    return Image.open(path).convert('RGBA')


def crop_old_frame(atlas: Image.Image, meta: dict, key: str) -> Image.Image:
    fr = meta['frames'][key]
    return atlas.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h']))


def find_sheet(mob_id: str) -> Path | None:
    local = GEN_DIR / f'{mob_id}_preview.png'
    if local.is_file():
        return local
    pattern = str(REPO.parent.parent / '*' / 'Downloads' / f'{mob_id}_preview.png')
    # fallback: user Downloads via glob from home
    for p in glob.glob(str(Path.home() / 'Downloads' / f'{mob_id}_preview.png')):
        return Path(p)
    for p in glob.glob(r'C:/Users/*/Downloads/' + f'{mob_id}_preview.png'):
        return Path(p)
    return None


def ensure_gen_dir() -> None:
    GEN_DIR.mkdir(parents=True, exist_ok=True)
    for mob_id in MOB_IDS:
        dst = GEN_DIR / f'{mob_id}_preview.png'
        if dst.is_file():
            continue
        src = find_sheet(mob_id)
        if src and src != dst:
            dst.write_bytes(src.read_bytes())
            print('copied', src, '->', dst)


def build_anims(mob_id: str, layout: dict, available: set[str]) -> dict[str, list[str]]:
    prefix = mob_id + '_'
    order = layout.get('anim_order', {})
    anims: dict[str, list[str]] = {}

    def key(suffix: str) -> str | None:
        k = prefix + suffix
        return k if k in available else None

    idle_k = key('idle')
    anims['idle'] = [idle_k] if idle_k else []

    for pose in ('walk', 'run', 'attack'):
        seq = []
        for suffix in order.get(pose, []):
            k = key(suffix)
            if k:
                seq.append(k)
        anims[pose] = seq

    if not anims['idle']:
        walk = anims.get('walk') or []
        anims['idle'] = [walk[0]] if walk else []
    if not anims['walk']:
        anims['walk'] = list(anims['idle'])
    if not anims['run']:
        anims['run'] = list(anims['walk'])
    if not anims['attack']:
        anims['attack'] = list(anims['idle'])
    return anims


def build_all_anims(sprites: dict[str, Image.Image]) -> dict[str, dict[str, list[str]]]:
    available = set(sprites.keys())
    out = {}
    for mob_id in MOB_IDS:
        out[mob_id] = build_anims(mob_id, MOB_LAYOUT[mob_id], available)
    return out


def pack_atlas(sprites: dict[str, Image.Image]) -> tuple[Image.Image, dict]:
    keys = list(sprites.keys())
    max_h = max(im.size[1] for im in sprites.values())
    x = PAD
    frames = {}
    for key in keys:
        im = sprites[key]
        w, h = im.size
        frames[key] = {'x': x, 'y': PAD, 'w': w, 'h': h}
        x += w + PAD
    atlas = Image.new('RGBA', (x, max_h + PAD * 2), (0, 0, 0, 0))
    for key in keys:
        fr = frames[key]
        atlas.paste(sprites[key], (fr['x'], fr['y']))
    return atlas, frames


def patch_enemy_mobs_js(frames: dict, anims: dict) -> None:
    text = OUT_JS.read_text(encoding='utf-8')
    frames_json = json.dumps(frames, ensure_ascii=False, separators=(',', ':'))
    anims_json = json.dumps(anims, ensure_ascii=False, separators=(',', ':'))
    text = re.sub(
        r'const ENEMY_MOB_FRAMES = \{.*?\};',
        f'const ENEMY_MOB_FRAMES = {frames_json};',
        text,
        count=1,
        flags=re.DOTALL,
    )
    text = re.sub(
        r'const ENEMY_MOB_ANIMS = \{.*?\};',
        f'const ENEMY_MOB_ANIMS = {anims_json};',
        text,
        count=1,
        flags=re.DOTALL,
    )
    OUT_JS.write_text(text, encoding='utf-8')


def main() -> int:
    ensure_gen_dir()
    old_meta = load_old_meta()
    old_atlas = load_old_atlas()
    sprites: dict[str, Image.Image] = {}

    for mob_id in MOB_IDS:
        layout = MOB_LAYOUT[mob_id]
        sheet_path = GEN_DIR / f'{mob_id}_preview.png'
        if not sheet_path.is_file():
            print('MISSING sheet:', sheet_path, file=sys.stderr)
            return 1

        parts = split_sprites(Image.open(sheet_path))
        roles = layout['roles']
        if len(parts) != len(roles):
            print(f'WARN {mob_id}: expected {len(roles)} sprites, got {len(parts)} — using min')
        n = min(len(parts), len(roles))
        for i in range(n):
            role = roles[i]
            key = f'{mob_id}_{role}'
            sprites[key] = parts[i]
            print(f'  {key}: {parts[i].size}')

        for suffix in layout.get('keep_old', []):
            old_key = f'{mob_id}_{suffix}'
            if old_key in old_meta['frames']:
                sprites[old_key] = crop_old_frame(old_atlas, old_meta, old_key)
                print(f'  {old_key}: kept from old atlas {sprites[old_key].size}')

    frame_keys = {k: k for k in sprites}
    anims = build_all_anims(sprites)
    atlas, frames = pack_atlas(sprites)

    meta = {
        'frames': frames,
        'anims': anims,
        'w': atlas.size[0],
        'h': atlas.size[1],
        'legacy': old_meta.get('legacy', {}),
        'refH': REF_H,
    }

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT_PNG, optimize=True)
    with open(OUT_META, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write('\n')
    patch_enemy_mobs_js(frames, anims)

    print(f'\natlas {atlas.size[0]}x{atlas.size[1]}, frames={len(frames)}')
    for mob_id, a in anims.items():
        print(f'  {mob_id}: idle={len(a["idle"])} walk={len(a["walk"])} run={len(a["run"])} attack={len(a["attack"])}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
