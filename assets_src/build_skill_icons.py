#!/usr/bin/env python3
"""Сборка skill_icon_atlas.png + skill_icon_data.js.

Чистые UI-иконки пассивок / эволюций / кровавой ауры:
- Pixel Mart (CC0) — где есть прямое попадание
- простые пиксельные силуэты — для остального
- CodeManu / Kenney FX — лёгкий ореол для эволюций и аур

Ключи совпадают с weapon_atlas: pas_*, evo_*, wp_bloody_aura1..3
"""
from __future__ import annotations

import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
MART = os.path.join(ROOT, 'pixel_mart')
CM = os.path.join(ROOT, 'codemanu')
KN = os.path.join(ROOT, 'kenney_particles')
OUT_PNG = os.path.join(ROOT, '..', 'skill_icon_atlas.png')
OUT_JS = os.path.join(ROOT, '..', 'skill_icon_data.js')

CELL = 64
COLS = 8
ITEM_SIZE = 40  # предмет внутри ячейки


def load_rgba(path: str) -> Image.Image:
    return Image.open(path).convert('RGBA')


def upscale_nn(img: Image.Image, size: int) -> Image.Image:
    """Integer-ish nearest upscale into square size, centered."""
    w, h = img.size
    k = max(1, min(size // w, size // h))
    nw, nh = w * k, h * k
    big = img.resize((nw, nh), Image.NEAREST)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(big, ((size - nw) // 2, (size - nh) // 2), big)
    return canvas


def mart(name: str, size: int = ITEM_SIZE) -> Image.Image:
    return upscale_nn(load_rgba(os.path.join(MART, name + '.png')), size)


def cm_frame(sheet: str, frac: float = 0.4) -> Image.Image:
    img = load_rgba(os.path.join(CM, sheet))
    fw = 100
    cols = img.width // fw
    rows = img.height // fw
    total = max(1, cols * rows)
    idx = min(total - 1, int(total * frac))
    cx, cy = idx % cols, idx // cols
    return img.crop((cx * fw, cy * fw, (cx + 1) * fw, (cy + 1) * fw))


def kn(name: str, tint: tuple[int, int, int, int] | None = None, size: int = 56) -> Image.Image:
    img = load_rgba(os.path.join(KN, name + '.png')).resize((size, size), Image.LANCZOS)
    if tint:
        r, g, b, a = tint
        # white particle → tint via multiply on RGB, keep alpha
        px = img.load()
        for y in range(img.height):
            for x in range(img.width):
                pr, pg, pb, pa = px[x, y]
                if pa == 0:
                    continue
                px[x, y] = (
                    pr * r // 255,
                    pg * g // 255,
                    pb * b // 255,
                    min(255, pa * a // 255),
                )
    return img


def paste_center(base: Image.Image, overlay: Image.Image, alpha: float = 1.0, dy: int = 0):
    if alpha < 1:
        overlay = overlay.copy()
        a = overlay.split()[3].point(lambda v: int(v * alpha))
        overlay.putalpha(a)
    x = (base.width - overlay.width) // 2
    y = (base.height - overlay.height) // 2 + dy
    base.alpha_composite(overlay, (x, y))


def cell_bg() -> Image.Image:
    """Subtle round plate so icons read on dark UI cards."""
    c = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    d.ellipse((6, 6, CELL - 7, CELL - 7), fill=(18, 22, 36, 180))
    d.ellipse((8, 8, CELL - 9, CELL - 9), outline=(255, 255, 255, 28), width=1)
    return c


def draw_shape(kind: str, color: tuple[int, int, int], size: int = ITEM_SIZE) -> Image.Image:
    """Simple readable pixel silhouettes for items not in Pixel Mart."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    outline = (20, 16, 24, 255)
    fill = (*color, 255)
    hi = tuple(min(255, c + 40) for c in color) + (255,)

    def orect(box, f=fill):
        d.rectangle(box, fill=f, outline=outline)

    def oell(box, f=fill):
        d.ellipse(box, fill=f, outline=outline)

    m = size
    if kind == 'mug':
        orect((m // 4, m // 5, m * 3 // 4, m * 4 // 5), fill)
        oell((m * 3 // 5, m // 3, m * 7 // 8, m * 2 // 3), (0, 0, 0, 0))
        d.arc((m * 3 // 5, m // 3, m * 7 // 8, m * 2 // 3), 270, 90, fill=outline, width=2)
    elif kind == 'badge':
        orect((m // 5, m // 4, m * 4 // 5, m * 3 // 4), fill)
        d.rectangle((m // 4, m // 3, m * 3 // 4, m // 3 + 3), fill=hi)
        d.rectangle((m // 4, m // 2, m * 2 // 3, m // 2 + 2), fill=outline)
    elif kind == 'radio':
        orect((m // 5, m // 3, m * 4 // 5, m * 4 // 5), fill)
        d.line((m // 2, m // 5, m // 2, m // 3), fill=outline, width=2)
        oell((m // 3, m // 2, m // 2, m * 2 // 3), hi)
    elif kind == 'key':
        oell((m // 5, m // 4, m // 2, m // 2), fill)
        orect((m // 3, m * 2 // 5, m * 4 // 5, m // 2), fill)
        d.rectangle((m * 3 // 5, m // 2, m * 2 // 3, m * 2 // 3), fill=outline)
        d.rectangle((m * 3 // 4, m // 2, m * 4 // 5, m * 3 // 5), fill=outline)
    elif kind == 'charger':
        orect((m // 3, m // 5, m * 2 // 3, m // 2), fill)
        d.line((m // 2, m // 2, m // 2, m * 3 // 4), fill=hi, width=3)
        d.line((m // 2, m * 3 // 4, m * 2 // 3, m * 4 // 5), fill=hi, width=3)
    elif kind == 'pouch':
        oell((m // 5, m // 3, m * 4 // 5, m * 4 // 5), fill)
        orect((m // 4, m // 4, m * 3 // 4, m // 2), hi)
    elif kind == 'shoes':
        oell((m // 6, m // 2, m * 3 // 5, m * 4 // 5), fill)
        oell((m * 2 // 5, m // 3, m * 5 // 6, m * 2 // 3), hi)
    elif kind == 'headphones':
        d.arc((m // 5, m // 5, m * 4 // 5, m * 4 // 5), 200, 340, fill=outline, width=4)
        orect((m // 6, m // 2, m // 3, m * 3 // 4), fill)
        orect((m * 2 // 3, m // 2, m * 5 // 6, m * 3 // 4), fill)
    elif kind == 'map':
        orect((m // 6, m // 5, m * 5 // 6, m * 4 // 5), fill)
        d.line((m // 3, m // 3, m * 2 // 3, m // 2), fill=outline, width=2)
        d.line((m * 2 // 3, m // 2, m // 2, m * 2 // 3), fill=hi, width=2)
        oell((m // 2 - 2, m * 2 // 3 - 2, m // 2 + 4, m * 2 // 3 + 4), (220, 60, 60, 255))
    elif kind == 'money':
        oell((m // 5, m // 4, m * 4 // 5, m * 3 // 4), fill)
        d.text((m // 2 - 4, m // 2 - 6), '$', fill=outline)
    elif kind == 'printer':
        orect((m // 5, m // 3, m * 4 // 5, m * 3 // 4), fill)
        orect((m // 4, m // 5, m * 3 // 4, m // 3), hi)
        orect((m // 3, m // 2, m * 2 // 3, m * 2 // 3), outline)
    elif kind == 'spray':
        orect((m // 3, m // 4, m * 2 // 3, m * 3 // 4), fill)
        orect((m * 2 // 5, m // 8, m * 3 // 5, m // 4), hi)
        d.line((m // 2, m // 8, m // 2, 2), fill=outline, width=2)
    elif kind == 'magnet':
        d.arc((m // 5, m // 5, m * 4 // 5, m * 4 // 5), 200, 340, fill=(200, 50, 50, 255), width=8)
        d.arc((m // 5, m // 5, m * 4 // 5, m * 4 // 5), 20, 160, fill=(80, 100, 200, 255), width=8)
    elif kind == 'phone':
        orect((m // 3, m // 6, m * 2 // 3, m * 5 // 6), fill)
        orect((m // 3 + 3, m // 5, m * 2 // 3 - 3, m * 2 // 3), hi)
    elif kind == 'cart':
        orect((m // 5, m // 3, m * 4 // 5, m * 2 // 3), fill)
        oell((m // 4, m * 2 // 3, m // 2, m * 5 // 6), outline)
        oell((m // 2, m * 2 // 3, m * 3 // 4, m * 5 // 6), outline)
        d.line((m // 5, m // 3, m // 8, m // 5), fill=outline, width=2)
    elif kind == 'mop':
        d.line((m // 2, m // 8, m // 2, m * 2 // 3), fill=outline, width=3)
        oell((m // 3, m * 3 // 5, m * 2 // 3, m * 5 // 6), fill)
    elif kind == 'speaker':
        orect((m // 4, m // 3, m // 2, m * 2 // 3), fill)
        d.polygon([(m // 2, m // 3), (m * 3 // 4, m // 5), (m * 3 // 4, m * 4 // 5), (m // 2, m * 2 // 3)], fill=hi)
    elif kind == 'flashlight':
        orect((m // 3, m // 4, m * 2 // 3, m * 3 // 4), fill)
        oell((m // 4, m // 6, m * 3 // 4, m // 3), hi)
    elif kind == 'chair':
        orect((m // 3, m // 4, m * 2 // 3, m // 2), fill)
        orect((m // 3, m // 2, m * 2 // 5, m * 4 // 5), outline)
        orect((m * 3 // 5, m // 2, m * 2 // 3, m * 4 // 5), outline)
        orect((m // 4, m // 2, m * 3 // 4, m * 3 // 5), hi)
    elif kind == 'box':
        orect((m // 5, m // 3, m * 4 // 5, m * 4 // 5), fill)
        d.line((m // 5, m // 2, m * 4 // 5, m // 2), fill=outline, width=1)
        d.line((m // 2, m // 3, m // 2, m * 4 // 5), fill=outline, width=1)
    elif kind == 'star':
        d.polygon([
            (m // 2, m // 8), (m * 3 // 5, m * 2 // 5), (m * 7 // 8, m * 2 // 5),
            (m * 2 // 3, m * 3 // 5), (m * 3 // 4, m * 7 // 8), (m // 2, m * 3 // 4),
            (m // 4, m * 7 // 8), (m // 3, m * 3 // 5), (m // 8, m * 2 // 5), (m * 2 // 5, m * 2 // 5),
        ], fill=fill, outline=outline)
    elif kind == 'skull':
        oell((m // 4, m // 5, m * 3 // 4, m * 3 // 5), fill)
        oell((m // 3, m // 3, m // 2, m // 2), outline)
        oell((m // 2, m // 3, m * 2 // 3, m // 2), outline)
        orect((m // 3, m * 3 // 5, m * 2 // 3, m * 3 // 4), hi)
    elif kind == 'ghost':
        oell((m // 4, m // 5, m * 3 // 4, m * 3 // 5), fill)
        orect((m // 4, m // 2, m * 3 // 4, m * 3 // 4), fill)
        oell((m // 3, m // 3, m // 2, m // 2), outline)
        oell((m // 2, m // 3, m * 2 // 3, m // 2), outline)
    elif kind == 'tag':
        d.polygon([
            (m // 5, m // 3), (m * 2 // 3, m // 6), (m * 5 // 6, m // 3),
            (m * 2 // 3, m * 5 // 6), (m // 5, m * 2 // 3),
        ], fill=fill, outline=outline)
        oell((m // 2, m // 3, m * 3 // 5, m // 2), outline)
    elif kind == 'scanner':
        orect((m // 3, m // 5, m * 2 // 3, m * 4 // 5), fill)
        orect((m // 3 + 2, m // 3, m * 2 // 3 - 2, m // 2), hi)
        d.line((m // 4, m * 2 // 3, m * 3 // 4, m * 2 // 3), fill=(80, 220, 120, 255), width=2)
    elif kind == 'usb':
        orect((m // 3, m // 3, m * 2 // 3, m * 3 // 4), fill)
        orect((m * 2 // 5, m // 6, m * 3 // 5, m // 3), hi)
    elif kind == 'battery':
        orect((m // 3, m // 4, m * 2 // 3, m * 3 // 4), fill)
        orect((m * 2 // 5, m // 6, m * 3 // 5, m // 4), outline)
        orect((m // 3 + 3, m // 2, m * 2 // 3 - 3, m * 2 // 3), hi)
    elif kind == 'calc':
        orect((m // 4, m // 6, m * 3 // 4, m * 5 // 6), fill)
        orect((m // 4 + 3, m // 5, m * 3 // 4 - 3, m // 3), hi)
        for i in range(3):
            for j in range(3):
                x0 = m // 4 + 4 + j * 8
                y0 = m // 2 + i * 7
                d.rectangle((x0, y0, x0 + 5, y0 + 5), fill=outline)
    elif kind == 'folder':
        orect((m // 5, m // 3, m * 4 // 5, m * 3 // 4), fill)
        orect((m // 5, m // 4, m // 2, m // 3), hi)
    elif kind == 'plane':
        d.polygon([
            (m // 8, m // 2), (m * 3 // 4, m // 3), (m * 7 // 8, m // 2),
            (m * 3 // 4, m * 2 // 3),
        ], fill=fill, outline=outline)
        d.line((m // 2, m // 4, m // 2, m * 3 // 4), fill=hi, width=2)
    elif kind == 'fidget':
        oell((m // 4, m // 4, m * 3 // 4, m * 3 // 4), fill)
        oell((m // 2 - 4, m // 2 - 4, m // 2 + 4, m // 2 + 4), outline)
    elif kind == 'token':
        oell((m // 5, m // 5, m * 4 // 5, m * 4 // 5), fill)
        oell((m // 3, m // 3, m * 2 // 3, m * 2 // 3), hi)
    elif kind == 'umbrella':
        d.pieslice((m // 5, m // 5, m * 4 // 5, m * 3 // 5), 180, 360, fill=fill, outline=outline)
        d.line((m // 2, m // 2, m // 2, m * 4 // 5), fill=outline, width=2)
    elif kind == 'sandwich':
        orect((m // 5, m // 3, m * 4 // 5, m * 2 // 3), fill)
        d.line((m // 5, m // 2, m * 4 // 5, m // 2), fill=hi, width=3)
    else:
        oell((m // 4, m // 4, m * 3 // 4, m * 3 // 4), fill)

    return img


def compose(item: Image.Image, fx: Image.Image | None = None, fx_alpha: float = 0.55,
            fx_size: int = 58, item_dy: int = 0) -> Image.Image:
    c = cell_bg()
    if fx is not None:
        fx_r = fx.resize((fx_size, fx_size), Image.NEAREST if fx.width <= 100 else Image.LANCZOS)
        paste_center(c, fx_r, alpha=fx_alpha)
    paste_center(c, item, dy=item_dy)
    return c


def item_or_shape(mart_name: str | None, shape: str, color: tuple[int, int, int]) -> Image.Image:
    if mart_name:
        path = os.path.join(MART, mart_name + '.png')
        if os.path.exists(path):
            return mart(mart_name)
    return draw_shape(shape, color)


def build_icons() -> dict[str, Image.Image]:
    icons: dict[str, Image.Image] = {}

    # ── Пассивки ──
    passives = {
        'pas_mug': ('teakettle', 'mug', (180, 120, 70)),
        'pas_badge': (None, 'badge', (70, 140, 210)),
        'pas_radio': (None, 'radio', (90, 90, 100)),
        'pas_key': (None, 'key', (220, 180, 60)),
        'pas_charger': ('power_strip_typeA', 'charger', (60, 60, 70)),
        'pas_discount': ('credit_card_2', 'tag', (230, 80, 80)),
        'pas_pouch': ('basket_yellow', 'pouch', (160, 110, 60)),
        'pas_shoes': (None, 'shoes', (50, 120, 90)),
        'pas_headphones': (None, 'headphones', (40, 40, 50)),
        'pas_gloves': ('cleaning_gloves', 'pouch', (240, 200, 80)),
        'pas_map': (None, 'map', (220, 210, 160)),
        'pas_scanner': (None, 'scanner', (80, 90, 100)),
        'pas_gold_badge': (None, 'badge', (220, 180, 50)),
        'pas_energy': ('soft_drink_green', 'spray', (80, 200, 100)),
        'pas_medkit': ('bandage_box', 'box', (220, 70, 70)),
        'pas_sandwich': ('sliced_bread_p', 'sandwich', (210, 170, 90)),
        'pas_headlamp': ('light_bulb', 'flashlight', (240, 220, 100)),
        'pas_umbrella': (None, 'umbrella', (80, 120, 200)),
        'pas_token': (None, 'token', (200, 160, 50)),
        'pas_icecream': ('strawberry_ice_cream', 'mug', (255, 150, 180)),
        'pas_fidget': (None, 'fidget', (120, 80, 180)),
        'pas_scissors': ('scissors', 'spray', (140, 140, 150)),
        'pas_pen': ('ball_pen', 'charger', (40, 80, 160)),
        'pas_calc': (None, 'calc', (60, 70, 80)),
        'pas_folder': (None, 'folder', (220, 180, 60)),
        'pas_plane': (None, 'plane', (100, 160, 210)),
        'pas_usb': (None, 'usb', (50, 50, 60)),
        'pas_battery': ('batteries', 'battery', (80, 180, 90)),
        'pas_gum': ('bubble_gum', 'token', (240, 120, 180)),
        'pas_coffee_xl': ('hot_cocoa_mix', 'mug', (120, 70, 40)),
        # активные в SALE_PASSIVES, раньше без кадра в концепт-атласе
        'pas_money': (None, 'money', (220, 180, 50)),
        'pas_printer': (None, 'printer', (90, 100, 110)),
        'pas_spray': ('sun_cream_tube', 'spray', (100, 200, 160)),
        'pas_magnet_pass': (None, 'magnet', (200, 50, 50)),
    }

    for key, (mname, shape, color) in passives.items():
        icons[key] = compose(item_or_shape(mname, shape, color))

    # ── Эволюции: предмет + ореол FX ──
    fx_ring = cm_frame('10_weaponhit_spritesheet.png', 0.35)
    fx_level = cm_frame('17_felspell_spritesheet.png', 0.45)
    fx_vortex = cm_frame('13_vortex_spritesheet.png', 0.4)
    fx_fire = cm_frame('16_sunburn_spritesheet.png', 0.4)
    fx_blue = cm_frame('3_bluefire_spritesheet.png', 0.4)
    fx_protect = cm_frame('8_protectioncircle_spritesheet.png', 0.35)
    fx_dark = cm_frame('18_midnight_spritesheet.png', 0.4)
    fx_phantom = cm_frame('14_phantom_spritesheet.png', 0.35)
    fx_bubbles = cm_frame('20_magicbubbles_spritesheet.png', 0.4)
    fx_spin = cm_frame('7_firespin_spritesheet.png', 0.4)
    kn_glow_gold = kn('light_02', (255, 210, 80, 200), 56)
    kn_slash = kn('slash_03', (180, 120, 255, 220), 56)
    kn_circle_red = kn('circle_05', (220, 40, 40, 200), 56)

    evolutions = {
        'evo_phone5g': (draw_shape('phone', (40, 40, 50)), fx_blue, 0.7),
        'evo_mag_cart': (draw_shape('cart', (80, 140, 180)), fx_vortex, 0.65),
        'evo_cleaner': (draw_shape('mop', (100, 180, 80)), fx_bubbles, 0.7),
        'evo_caffeine': (item_or_shape('hot_cocoa_mix', 'mug', (120, 70, 40)), kn_glow_gold, 0.75),
        'evo_black_card': (mart('credit_card_3') if os.path.exists(os.path.join(MART, 'credit_card_3.png')) else draw_shape('badge', (20, 20, 30)), fx_dark, 0.65),
        'evo_ultrasound': (draw_shape('speaker', (120, 80, 180)), kn_slash, 0.7),
        'evo_endless_receipt': (mart('receipt'), fx_ring, 0.6),
        'evo_logistics': (mart('paper_bag'), fx_protect, 0.55),
        'evo_furniture_ram': (draw_shape('chair', (140, 100, 60)), fx_phantom, 0.6),
        'evo_mall_fire': (draw_shape('spray', (220, 100, 40)), fx_fire, 0.7),
        'evo_consultant_call': (draw_shape('phone', (50, 50, 60)), fx_level, 0.65),
        'evo_hunter': (draw_shape('flashlight', (240, 220, 100)), fx_spin, 0.55),
        'evo_black_friday': (draw_shape('skull', (40, 40, 50)), kn_circle_red, 0.75),
        'evo_vip': (draw_shape('star', (230, 190, 50)), kn_glow_gold, 0.7),
        'evo_sleepless': (draw_shape('ghost', (160, 140, 200)), fx_dark, 0.7),
        'evo_night_consultant': (draw_shape('badge', (60, 50, 90)), fx_phantom, 0.65),
    }
    for key, (item, fx, a) in evolutions.items():
        icons[key] = compose(item, fx, fx_alpha=a, fx_size=60)

    # ── Кровавая аура (3 стадии) ──
    for st, (a, sz) in enumerate([(0.45, 50), (0.6, 56), (0.75, 62)], start=1):
        item = draw_shape('tag', (180, 40, 40), size=28 + st * 4)
        icons[f'wp_bloody_aura{st}'] = compose(item, kn_circle_red, fx_alpha=a, fx_size=sz)

    # ── Кровавый прайс (для UI стадий) ──
    for st in (1, 2, 3):
        item = mart('receipt') if st == 1 else item_or_shape('receipt', 'tag', (180, 40, 40))
        # tint receipt reddish for higher stages
        if st > 1:
            item = draw_shape('tag', (200, 40 + st * 10, 40), size=28 + st * 4)
        icons[f'wp_bloody_price{st}'] = compose(item, kn_circle_red if st == 3 else None, fx_alpha=0.5)

    return icons


def main():
    icons = build_icons()
    keys = sorted(icons.keys())
    rows = (len(keys) + COLS - 1) // COLS
    atlas = Image.new('RGBA', (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    frames = {}
    for i, key in enumerate(keys):
        x = (i % COLS) * CELL
        y = (i // COLS) * CELL
        atlas.paste(icons[key], (x, y), icons[key])
        frames[key] = {'x': x, 'y': y, 'w': CELL, 'h': CELL}

    atlas.save(OUT_PNG, optimize=True)
    js = (
        '// Автогенерировано assets_src/build_skill_icons.py — не редактировать руками.\n'
        '// Источники: Pixel Mart (CC0), CodeManu Free Pixel Effects (CC0), Kenney Particle Pack (CC0).\n'
        'window.SKILL_ICON_FRAMES = ' + json.dumps(frames) + ';\n'
    )
    with open(OUT_JS, 'w') as f:
        f.write(js)
    kb = os.path.getsize(OUT_PNG) / 1024
    print(f'atlas {atlas.width}x{atlas.height}, {kb:.1f} KB, icons={len(keys)}')
    # preview strip
    prev = Image.new('RGBA', (atlas.width, atlas.height), (26, 26, 46, 255))
    prev.alpha_composite(atlas)
    prev.convert('RGB').save(os.path.join(ROOT, 'preview_skill_icons.png'))
    print('preview saved assets_src/preview_skill_icons.png')


if __name__ == '__main__':
    main()
