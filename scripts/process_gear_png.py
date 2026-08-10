"""Remove solid/checkerboard backgrounds from gear PNGs and trim to content."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'gear'
TOL = 36  # per-channel sum tolerance for flood neighbors


def lum(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def is_dark_bg(corners: list[tuple[int, int, int]]) -> bool:
    return sum(lum(*c) for c in corners) / len(corners) < 40


def similar(a: tuple[int, int, int], b: tuple[int, int, int]) -> bool:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) <= TOL


def flood_background(im: Image.Image) -> Image.Image:
    rgb = im.convert('RGB')
    w, h = rgb.size
    px = rgb.load()
    corners = [
        px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1],
        px[w // 2, 0], px[w // 2, h - 1], px[0, h // 2], px[w - 1, h // 2],
    ]
    dark = is_dark_bg(corners)

    def bg_like(r: int, g: int, b: int) -> bool:
        if dark:
            return r < 32 and g < 32 and b < 32
        # light gray / white checkerboard
        if min(r, g, b) > 228:
            return True
        if min(r, g, b) > 200 and max(r, g, b) - min(r, g, b) < 18:
            return True
        return False

    mask = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if bg_like(*px[x, y]):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if bg_like(*px[x, y]):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or mask[y][x]:
            continue
        r, g, b = px[x, y]
        if not bg_like(r, g, b):
            continue
        mask[y][x] = True
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    out = im.convert('RGBA')
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                opx[x, y] = (0, 0, 0, 0)
            else:
                r, g, b = px[x, y]
                opx[x, y] = (r, g, b, 255)

    # soften halos on edges
    for y in range(h):
        for x in range(w):
            if opx[x, y][3] == 0:
                continue
            r, g, b = opx[x, y][:3]
            if dark and max(r, g, b) < 48:
                opx[x, y] = (r, g, b, min(255, max(r, g, b) * 6))
            elif not dark and min(r, g, b) > 210:
                fade = max(0, 255 - (min(r, g, b) - 210) * 12)
                opx[x, y] = (r, g, b, fade)

    bbox = out.getbbox()
    if bbox:
        pad = max(8, int(min(out.size) * 0.02))
        l = max(0, bbox[0] - pad)
        t = max(0, bbox[1] - pad)
        r = min(w, bbox[2] + pad)
        b = min(h, bbox[3] + pad)
        out = out.crop((l, t, r, b))

    # downscale huge AI exports for UI (~256px max side)
    mw = max(out.size)
    if mw > 320:
        scale = 320 / mw
        out = out.resize(
            (max(1, int(out.width * scale)), max(1, int(out.height * scale))),
            Image.Resampling.LANCZOS,
        )
    return out


def main() -> None:
    for path in sorted(ROOT.rglob('*.png')):
        im = Image.open(path)
        out = flood_background(im)
        out.save(path, optimize=True)
        print(f'{path.name}: {im.size} -> {out.size} RGBA')


if __name__ == '__main__':
    main()
