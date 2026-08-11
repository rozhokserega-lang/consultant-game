#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерация PDF «Таблица урона Распродажа»."""

from __future__ import annotations

import re
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
WEAPONS_JS = ROOT / 'src' / 'game' / 'modes' / 'sale' / 'data' / 'weapons.js'
CONFIG_JS = ROOT / 'src' / 'game' / 'modes' / 'sale' / 'data' / 'config.js'
OUT = ROOT / 'docs' / 'damage-table.pdf'
FONT = Path('C:/Windows/Fonts/arial.ttf')
FONT_BOLD = Path('C:/Windows/Fonts/arialbd.ttf')

WDMG = 0.85
STAT_SCALE = 10
ORB_HIT_CD = 0.42
BEAM_TICK = 0.1
PUDDLE_TICK = 0.35
TYPE_RU = {
  'projectile': 'залп',
  'orbit': 'орбита',
  'ricochet': 'рикошет',
  'aura': 'аура',
  'boomerang': 'бумеранг',
  'puddle': 'лужи',
  'nova': 'волна',
  'beam': 'луч',
  'sword': 'швабра',
  'charge': 'тележка',
  'spray': 'струя',
  'shield': 'щит',
  'radio': 'радио',
  'mark': 'метка',
}


def _arr(s: str | None) -> list[float]:
  if not s:
    return []
  return [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', s)]


def parse_weapons(text: str) -> list[dict]:
  # блоки вида: id: { ... },
  items = []
  for m in re.finditer(
    r'(\w+)\s*:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}',
    text,
  ):
    wid, body = m.group(1), m.group(2)
    if wid in ('SALE_WEAPONS',) or 'name:' not in body:
      continue
    name_m = re.search(r"name:\s*'([^']+)'", body)
    type_m = re.search(r"type:\s*'([^']+)'", body)
    if not name_m or not type_m:
      continue
    dmg = _arr((re.search(r'dmg:\s*\[([^\]]*)\]', body) or [None, ''])[1])
    cd_m = re.search(r'baseCd:\s*([\d.]+)', body)
    count = _arr((re.search(r'count:\s*\[([^\]]*)\]', body) or [None, ''])[1])
    evolved = 'evolved: true' in body
    items.append({
      'id': wid,
      'name': name_m.group(1),
      'type': type_m.group(1),
      'dmg': dmg,
      'cd': float(cd_m.group(1)) if cd_m else 1.0,
      'count': count,
      'evolved': evolved,
      'mark': 'markSec:' in body,
      'explode': 'explodeOnKill: true' in body or 'explodeHit: true' in body,
      'puddle': type_m.group(1) == 'puddle',
    })
  return items


def lvl_val(arr: list[float], level: int, default: float = 1.0) -> float:
  if not arr:
    return default
  i = min(max(level - 1, 0), len(arr) - 1)
  return arr[i]


def theoretical_st_dps(w: dict, level: int) -> float:
  """Грубая оценка ST DPS без пассивок/героя, с global weaponDmg."""
  dmg = lvl_val(w['dmg'], level)
  cd = max(0.05, w['cd'])
  cnt = lvl_val(w['count'], level, 1.0)
  t = w['type']

  if t == 'orbit':
    # общий orbT на враге — count не множит частоту хитов
    raw = dmg / ORB_HIT_CD
  elif t == 'aura' or t == 'radio':
    raw = dmg / cd
  elif t == 'beam':
    raw = dmg / BEAM_TICK
  elif t == 'sword':
    # швабры бьют по касанию; baseCd — спавн. Оценка: ~dmg*count / 0.35
    raw = dmg * cnt / 0.35
  elif t == 'puddle':
    # удар снарядом + DoT лужи 1/0.35 пока стоит
    raw = (dmg * cnt / cd) + (1.0 / PUDDLE_TICK)
  else:
    raw = dmg * cnt / cd
  return raw * WDMG * STAT_SCALE


def fmt(n: float) -> str:
  if n >= 100:
    return str(int(round(n)))
  if n >= 10:
    return f'{n:.1f}'
  return f'{n:.2f}'


def dmg_cell(w: dict) -> str:
  d = w['dmg']
  if not d:
    return '-'
  if len(d) == 1:
    return str(int(d[0]) if d[0] == int(d[0]) else d[0])
  return '-'.join(str(int(x) if x == int(x) else x) for x in d)


def count_cell(w: dict) -> str:
  c = w['count']
  if not c:
    return '1'
  if len(c) == 1:
    return str(int(c[0]))
  return '-'.join(str(int(x)) for x in c)


class DamagePdf(FPDF):
  def __init__(self):
    super().__init__(orientation='L', format='A4')
    self.add_font('Arial', '', str(FONT))
    self.add_font('Arial', 'B', str(FONT_BOLD))
    self.set_auto_page_break(auto=True, margin=14)

  def footer(self):
    self.set_y(-11)
    self.set_font('Arial', '', 8)
    self.set_text_color(120, 120, 120)
    self.cell(0, 6, f'consultant-game · Таблица урона · стр. {self.page_no()}', align='C')

  def _rx(self):
    self.set_x(self.l_margin)

  def h1(self, text):
    self._rx()
    self.set_font('Arial', 'B', 16)
    self.set_text_color(30, 30, 30)
    self.multi_cell(0, 8, text)
    self.ln(1)

  def h2(self, text):
    self._rx()
    self.ln(2)
    self.set_font('Arial', 'B', 11)
    self.set_text_color(40, 40, 40)
    self.multi_cell(0, 6, text)
    self.ln(1)

  def body(self, text):
    self._rx()
    self.set_font('Arial', '', 8.5)
    self.set_text_color(25, 25, 25)
    self.multi_cell(0, 4.5, text)
    self.ln(0.5)

  def bullet(self, text):
    self._rx()
    self.set_font('Arial', '', 8.5)
    self.set_text_color(25, 25, 25)
    self.multi_cell(0, 4.5, f'- {text}')

  def data_table(self, headers, rows, col_widths):
    self._rx()
    self.set_font('Arial', '', 7.5)
    self.set_text_color(20, 20, 20)
    with FPDF.table(
      self,
      col_widths=col_widths,
      line_height=4.6,
      text_align=('LEFT',) + ('CENTER',) * (len(headers) - 1),
      width=self.epw,
      first_row_as_headings=True,
    ) as tbl:
      hdr = tbl.row()
      for h in headers:
        hdr.cell(h)
      for row in rows:
        r = tbl.row()
        for cell in row:
          r.cell(str(cell))
    self.ln(1.5)


def build():
  weapons = parse_weapons(WEAPONS_JS.read_text(encoding='utf-8'))
  bases = [w for w in weapons if not w['evolved']]
  evos = [w for w in weapons if w['evolved']]

  # сортировка по DPS lv5
  bases.sort(key=lambda w: theoretical_st_dps(w, 5), reverse=True)
  evos.sort(key=lambda w: theoretical_st_dps(w, 1), reverse=True)

  pdf = DamagePdf()
  pdf.set_margins(12, 12, 12)
  pdf.add_page()

  pdf.h1('Таблица урона — режим «Распродажа»')
  pdf.body(
    'Цифры из data/weapons.js. «ST DPS» — теоретический урон в секунду по одной цели '
    'без пассивок и героя, но с глобальным множителем weaponDmg = 0.85 и SALE_STAT_SCALE = 10. '
    'Это оценка для сравнения оружия, не точная копия логов забега.'
  )

  pdf.h2('1. Глобальные множители')
  pdf.data_table(
    ['Источник', 'Формула / значение', 'Комментарий'],
    [
      ['SALE_STAT_SCALE', 'x10', 'HP врагов и урон по ним (не HP игрока)'],
      ['weaponDmg (SALE_DIFFICULTY)', 'x0.85', 'Всегда в saleDmgMul'],
      ['Лена', 'x1.06', 'Герой'],
      ['Игорь', 'x0.95', 'Герой'],
      ['Маша', 'x1.00', 'Герой'],
      ['discount / might', '+10% / +12% за ур.', 'Пассивка силы'],
      ['spray', '+8% за ур.', 'Универсальный ключ'],
      ['sticker', '+6% за ур.', 'Универсальный ключ'],
      ['overflow power', '+8% за стак', 'Дроп босса'],
      ['Метка (mark)', 'x1.30 (+sticker)', 'После попадания pricetag/auto_claimer'],
      ['Орбиты orbHitCd', '0.42 с', 'Общий КД хита орбитой на враге'],
      ['Лужа DoT', '10 урона / 0.35 с', 'saleFlatDmg(1) при SCALE=10'],
      ['Хлопушка bomb', 'фиксированный удар x SCALE', 'Источник в логе: bomb'],
    ],
    col_widths=(55, 50, 160),
  )

  pdf.h2('2. Базовое оружие (уровни 1-5)')
  pdf.body(
    'Урон — таблица dmg[lv]. Count — снаряды/орбиты. CD — baseCd (сек). '
    'DPS1 / DPS5 — теоретический ST DPS на 1 и 5 уровне.'
  )
  base_rows = []
  for w in bases:
    base_rows.append([
      w['name'],
      TYPE_RU.get(w['type'], w['type']),
      dmg_cell(w),
      f"{w['cd']:.2f}",
      count_cell(w),
      fmt(theoretical_st_dps(w, 1)),
      fmt(theoretical_st_dps(w, 5)),
      w['id'],
    ])
  pdf.data_table(
    ['Оружие', 'Тип', 'Урон lv1-5', 'CD', 'Count', 'DPS lv1', 'DPS lv5', 'id'],
    base_rows,
    col_widths=(42, 22, 32, 16, 22, 22, 22, 40),
  )

  pdf.add_page()
  pdf.h2('3. Эволюции (max 1)')
  pdf.body('После эволюции уровень всегда 1. DPS — теоретический ST с weaponDmg 0.85.')
  evo_rows = []
  for w in evos:
    notes = []
    if w['mark']:
      notes.append('метка')
    if w['explode']:
      notes.append('взрыв')
    if w['puddle']:
      notes.append('+лужи')
    evo_rows.append([
      w['name'],
      TYPE_RU.get(w['type'], w['type']),
      dmg_cell(w),
      f"{w['cd']:.2f}",
      count_cell(w),
      fmt(theoretical_st_dps(w, 1)),
      ', '.join(notes) if notes else '-',
      w['id'],
    ])
  pdf.data_table(
    ['Эволюция', 'Тип', 'Урон', 'CD', 'Count', 'ST DPS', 'Фишки', 'id'],
    evo_rows,
    col_widths=(48, 24, 16, 16, 16, 22, 28, 42),
  )

  pdf.h2('4. Как считается ST DPS (упрощение)')
  pdf.bullet(f'Обычные (залп / бумеранг / волна / метка / щит / тележка / струя): dmg x count / CD x {WDMG} x {STAT_SCALE}')
  pdf.bullet(f'Орбита (чек, пакеты): dmg / {ORB_HIT_CD} x {WDMG} x {STAT_SCALE}  — count не ускоряет хит по одной цели')
  pdf.bullet(f'Аура / радио: dmg / CD x {WDMG} x {STAT_SCALE}')
  pdf.bullet(f'Луч (фонарик): dmg / {BEAM_TICK} x {WDMG} x {STAT_SCALE}  — тик луча')
  pdf.bullet(f'Швабра: dmg x count / 0.35 x {WDMG} x {STAT_SCALE}  — грубая оценка касаний')
  pdf.bullet(f'Лужи (кофе): удар снаряда + DoT {STAT_SCALE}/{PUDDLE_TICK}с пока враг в луже')
  pdf.bullet('Не учтено: AoE по толпе, рикошеты, mark x1.3, пассивки, герой, синергии, bomb/puddle от убийств')

  pdf.h2('5. Что видно в логах забега (реальный урон)')
  pdf.bullet('В balance-лог пишется только реально снятое HP: min(урон удара, текущее HP врага)')
  pdf.bullet('Оверкилл не засчитывается — поэтому DPS в логе ниже «бумажного» на поздней стадии')
  pdf.bullet('Отдельные источники: puddle (лужи/DoT), bomb (хлопушки), weapon id оружия')
  pdf.bullet('Цифры над врагом на экране = min(урон, maxHp), не всегда равны снятому HP')

  # Топ по DPS для быстрой навигации
  pdf.h2('6. Топ теоретического ST DPS')
  top_base = sorted(bases, key=lambda w: theoretical_st_dps(w, 5), reverse=True)[:8]
  top_evo = sorted(evos, key=lambda w: theoretical_st_dps(w, 1), reverse=True)[:8]
  pdf.data_table(
    ['#', 'База lv5', 'DPS', 'Эволюция', 'DPS'],
    [
      [
        str(i + 1),
        top_base[i]['name'] if i < len(top_base) else '-',
        fmt(theoretical_st_dps(top_base[i], 5)) if i < len(top_base) else '-',
        top_evo[i]['name'] if i < len(top_evo) else '-',
        fmt(theoretical_st_dps(top_evo[i], 1)) if i < len(top_evo) else '-',
      ]
      for i in range(8)
    ],
    col_widths=(12, 55, 25, 55, 25),
  )

  pdf.h2('7. Пример: тот же удар с билдом')
  pdf.body(
    'Базовый урон оружия умножается на saleDmgMul. Пример для Лены с discount 5 + spray 3 + sticker 2:'
  )
  mul = (1 + 5 * 0.1 + 3 * 0.08 + 2 * 0.06) * 1.06 * WDMG * STAT_SCALE
  pdf.bullet(f'saleDmgMul = (1 + 0.50 + 0.24 + 0.12) x 1.06 x 0.85 x {STAT_SCALE} = {mul:.3f}')
  pdf.bullet('То есть табличный урон 3 на экране станет round(3 x %.2f) = %d' % (mul, max(1, round(3 * mul))))
  pdf.bullet('С меткой ещё x1.30 (и больше со sticker) — поэтому late-game цифры выглядят огромными')

  OUT.parent.mkdir(parents=True, exist_ok=True)
  pdf.output(str(OUT))
  print(f'Wrote {OUT} ({len(bases)} bases, {len(evos)} evolutions)')


if __name__ == '__main__':
  build()
