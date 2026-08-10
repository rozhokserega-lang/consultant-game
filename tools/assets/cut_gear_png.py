"""Remove solid light/dark backgrounds from gear PNGs and trim transparency."""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEAR_DIR = ROOT / 'gear'
MAX_SIDE = 512


def lum(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def is_bg_pixel(r: int, g: int, b: int, light_bg: bool) -> bool:
    if light_bg:
        if min(r, g, b) >= 238:
            return True
        # checkerboard / light gray studio bg
        if min(r, g, b) >= 210 and max(r, g, b) - min(r, g, b) <= 18:
            return True
        return False
    if max(r, g, b) <= 28:
        return True
    return False


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
                r, g, b, _ = opx[x, y]
                opx[x, y] = (r, g, b, 0)
            else:
                r, g, b, _ = opx[x, y]
                opx[x, y] = (r, g, b, 255)

    # soften outer edge pixels bordering transparency
    for y in range(h):
        for x in range(w):
            r, g, b, a = opx[x, y]
            if a == 0:
                continue
            neighbours = 0
            transparent_neighbours = 0
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and opx[nx, ny][3] == 0:
                    transparent_neighbours += 1
                neighbours += 1
            if transparent_neighbours and light_bg and lum(r, g, b) > 190:
                fade = max(0, 255 - transparent_neighbours * 70)
                opx[x, y] = (r, g, b, fade)

    bbox = out.getbbox()
    if bbox:
        pad = 8
        x0 = max(0, bbox[0] - pad)
        y0 = max(0, bbox[1] - pad)
        x1 = min(w, bbox[2] + pad)
        y1 = min(h, bbox[3] + pad)
        out = out.crop((x0, y0, x1, y1))

    rw, rh = out.size
    scale = min(1.0, MAX_SIDE / max(rw, rh))
    if scale < 1.0:
        out = out.resize((max(1, int(rw * scale)), max(1, int(rh * scale))), Image.Resampling.LANCZOS)
    return out


def main() -> int:
    paths = sorted(GEAR_DIR.rglob('*.png'))
    if not paths:
        print('No PNG files in', GEAR_DIR)
        return 1
    for path in paths:
        im = Image.open(path)
        out = flood_background(im)
        out.save(path, optimize=True)
        print(path.relative_to(ROOT), '->', out.size, out.mode)
    return 0


if __name__ == '__main__':
    sys.exit(main())
