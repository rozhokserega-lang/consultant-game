#!/usr/bin/env python3
"""Сборка skill_icon_atlas.png + skill_icon_data.js.

Источники в стиле боевых атласов игры (детальный пиксель + свечение):
- spell_atlas / vfx_atlas / pickup_fx_atlas — уже в проекте
- 7Soul1 «496 RPG icons» (CC0 / public domain) — пассивки-предметы

Ключи: pas_*, evo_*, wp_bloody_aura*, wp_bloody_price*
"""
from __future__ import annotations

import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(ROOT, '..')
SEVEN = os.path.join(ROOT, 'icon_candidates', 'seven_soul')
OUT_PNG = os.path.join(REPO, 'skill_icon_atlas.png')
OUT_JS = os.path.join(REPO, 'skill_icon_data.js')
PREV = os.path.join(ROOT, 'preview_skill_icons.png')

CELL = 64
COLS = 8
ICON = 48  # предмет внутри ячейки


def load(path: str) -> Image.Image:
    return Image.open(path).convert('RGBA')


def load_meta(name: str) -> dict:
    return json.load(open(os.path.join(REPO, name)))['frames']


def crop_atlas(atlas_path: str, frames: dict, key: str) -> Image.Image:
    img = load(atlas_path)
    f = frames[key]
    return img.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def fit_nn(img: Image.Image, size: int = ICON) -> Image.Image:
    """Nearest upscale into square, keep aspect, pad transparent."""
    w, h = img.size
    # trim empty alpha borders lightly
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        w, h = img.size
    k = max(1, min(size // max(1, w), size // max(1, h)))
    # if already larger, downscale with nearest
    if w > size or h > size:
        k = max(1, int(min(size / w, size / h)))
        nw, nh = max(1, int(w * min(size / w, size / h))), max(1, int(h * min(size / w, size / h)))
        big = img.resize((nw, nh), Image.NEAREST)
    else:
        nw, nh = w * k, h * k
        big = img.resize((nw, nh), Image.NEAREST)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(big, ((size - big.width) // 2, (size - big.height) // 2), big)
    return canvas


def seven(name: str) -> Image.Image:
    return fit_nn(load(os.path.join(SEVEN, name)))


def cell_of(item: Image.Image, halo: Image.Image | None = None, halo_a: float = 0.55) -> Image.Image:
    c = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    # subtle plate
    plate = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(plate)
    d.ellipse((4, 4, CELL - 5, CELL - 5), fill=(14, 16, 28, 160))
    c.alpha_composite(plate)
    if halo is not None:
        h = fit_nn(halo, 58)
        if halo_a < 1:
            h = h.copy()
            a = h.split()[3].point(lambda v: int(v * halo_a))
            h.putalpha(a)
        c.alpha_composite(h, ((CELL - h.width) // 2, (CELL - h.height) // 2))
    c.alpha_composite(item, ((CELL - item.width) // 2, (CELL - item.height) // 2))
    return c


def main():
    spell_f = load_meta('spell_atlas_meta.json')
    vfx_f = load_meta('vfx_atlas_meta.json')
    pick_f = load_meta('pickup_fx_meta.json')
    spell = os.path.join(REPO, 'spell_atlas.png')
    vfx = os.path.join(REPO, 'vfx_atlas.png')
    pick = os.path.join(REPO, 'pickup_fx_atlas.png')

    def Sp(k): return fit_nn(crop_atlas(spell, spell_f, k))
    def Vx(k): return fit_nn(crop_atlas(vfx, vfx_f, k))
    def Pk(k): return fit_nn(crop_atlas(pick, pick_f, k))

    icons: dict[str, Image.Image] = {}

    # ── Пассивки: pickup (уже в стиле игры) + 7Soul ──
    passives = {
        'pas_mug': seven('I_Bottle02.png'),
        'pas_badge': seven('Ac_Medal01.png'),
        'pas_radio': seven('I_Torch02.png'),  # «связь» / фонарь-передатчик
        'pas_key': Pk('pickup_key') if 'pickup_key' in pick_f else seven('I_Key01.png'),
        'pas_charger': seven('I_Sapphire.png') if os.path.exists(os.path.join(SEVEN, 'I_Sapphire.png')) else seven('E_Metal01.png'),
        'pas_discount': seven('Ac_Medal04.png'),
        'pas_pouch': seven('I_Chest01.png'),
        'pas_shoes': Pk('pickup_shoe') if 'pickup_shoe' in pick_f else seven('A_Shoes01.png'),
        'pas_headphones': seven('Ac_Necklace01.png'),
        'pas_gloves': Pk('pickup_glove') if 'pickup_glove' in pick_f else seven('A_Armor04.png'),
        'pas_map': seven('I_Map.png'),
        'pas_scanner': seven('I_Telescope.png') if os.path.exists(os.path.join(SEVEN, 'I_Telescope.png')) else seven('I_Map.png'),
        'pas_gold_badge': seven('Ac_Medal02.png'),
        'pas_energy': seven('P_Green01.png'),
        'pas_medkit': Pk('pickup_medkit') if 'pickup_medkit' in pick_f else seven('I_Antidote.png'),
        'pas_sandwich': seven('I_C_Bread.png'),
        'pas_headlamp': seven('I_Torch01.png'),
        'pas_umbrella': seven('W_Spear001.png') if os.path.exists(os.path.join(SEVEN, 'W_Spear001.png')) else seven('W_Axe001.png'),
        'pas_token': Pk('pickup_coin') if 'pickup_coin' in pick_f else seven('I_GoldCoin.png'),
        'pas_icecream': seven('P_Blue01.png'),
        'pas_fidget': seven('Ac_Ring01.png'),
        'pas_scissors': seven('W_Dagger001.png') if os.path.exists(os.path.join(SEVEN, 'W_Dagger001.png')) else seven('W_Axe002.png'),
        'pas_pen': seven('I_Scroll.png'),
        'pas_calc': seven('I_Book.png'),
        'pas_folder': seven('I_Scroll02.png'),
        'pas_plane': seven('I_Feather01.png') if os.path.exists(os.path.join(SEVEN, 'I_Feather01.png')) else seven('I_BatWing.png'),
        'pas_usb': seven('E_Metal02.png'),
        'pas_battery': Pk('pickup_bolt') if 'pickup_bolt' in pick_f else seven('P_Orange01.png'),
        'pas_gum': seven('P_Pink01.png'),
        'pas_coffee_xl': seven('I_Bottle01.png'),
        'pas_money': Pk('pickup_coin') if 'pickup_coin' in pick_f else seven('E_Gold01.png'),
        'pas_printer': seven('I_Book.png'),
        'pas_spray': seven('P_Green02.png') if os.path.exists(os.path.join(SEVEN, 'P_Green02.png')) else seven('S_Poison01.png'),
        'pas_magnet_pass': seven('Ac_Ring02.png'),
    }
    # resolve missing files gracefully
    for key, img in list(passives.items()):
        icons[key] = cell_of(img)

    # ── Эволюции: spell/vfx — тот же стиль, что в бою ──
    evolutions = {
        'evo_phone5g': (Sp('sp_elec3'), Vx('fx_bolt'), 0.45),
        'evo_mag_cart': (Vx('fx_tornado'), Sp('sp_elec2'), 0.4),
        'evo_cleaner': (Sp('sp_poison3'), Sp('sp_poison1'), 0.4),
        'evo_caffeine': (Pk('pickup_bolt'), Vx('fx_aura_gold'), 0.55),
        'evo_black_card': (seven('Ac_Medal03.png'), Vx('fx_aura_dark'), 0.55),
        'evo_ultrasound': (Sp('sp_elec3'), Sp('sp_hole2'), 0.35),
        'evo_endless_receipt': (seven('I_Scroll02.png'), Sp('sp_heal2'), 0.4),
        'evo_logistics': (seven('I_Chest02.png'), Sp('sp_quake2'), 0.4),
        'evo_furniture_ram': (Sp('sp_quake3'), Sp('sp_quake1'), 0.35),
        'evo_mall_fire': (Sp('sp_fwave3'), Sp('sp_fire3'), 0.4),
        'evo_consultant_call': (Sp('sp_bolt3'), Sp('sp_elec1'), 0.4),
        'evo_hunter': (Sp('sp_bat3'), Vx('fx_aura_gold'), 0.35),
        'evo_black_friday': (Vx('fx_skull'), Sp('sp_curse3'), 0.5),
        'evo_vip': (seven('Ac_Medal02.png'), Vx('fx_aura_gold'), 0.6),
        'evo_sleepless': (Sp('sp_curse3'), Sp('sp_hole3'), 0.45),
        'evo_night_consultant': (Sp('sp_hole3'), Vx('fx_aura_dark'), 0.5),
    }
    for key, (item, halo, a) in evolutions.items():
        icons[key] = cell_of(item, halo, a)

    # ── Кровавая аура / прайс ──
    icons['wp_bloody_aura1'] = cell_of(Sp('sp_bleed1'), Sp('sp_curse1'), 0.4)
    icons['wp_bloody_aura2'] = cell_of(Sp('sp_bleed2'), Sp('sp_curse2'), 0.5)
    icons['wp_bloody_aura3'] = cell_of(Sp('sp_bleed3'), Sp('sp_curse3'), 0.6)
    icons['wp_bloody_price1'] = cell_of(seven('I_Scroll.png'), Sp('sp_bleed1'), 0.35)
    icons['wp_bloody_price2'] = cell_of(seven('I_Scroll02.png'), Sp('sp_bleed2'), 0.45)
    icons['wp_bloody_price3'] = cell_of(Vx('fx_skull'), Sp('sp_bleed3'), 0.5)

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
    with open(OUT_JS, 'w') as f:
        f.write(
            '// Автогенерировано assets_src/build_skill_icons.py\n'
            '// Источники: spell/vfx/pickup атласы проекта + 7Soul1 496 RPG icons (CC0).\n'
            'window.SKILL_ICON_FRAMES = ' + json.dumps(frames) + ';\n'
        )
    prev = Image.new('RGBA', atlas.size, (26, 26, 46, 255))
    prev.alpha_composite(atlas)
    prev.convert('RGB').save(PREV)
    print(f'atlas {atlas.size}, {os.path.getsize(OUT_PNG)/1024:.1f} KB, icons={len(keys)}')


if __name__ == '__main__':
    main()
