#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Карта эволюций оружия «Распродажа» — PDF для игрока.
Данные сверять с src/game/modes/sale/data/evolutions.js и weapons.js
"""

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'evolution-map.pdf'
FONT = Path('C:/Windows/Fonts/arial.ttf')
FONT_BOLD = Path('C:/Windows/Fonts/arialbd.ttf')

# Базовое оружие -> ветки эволюции
# hint — коротко «что получишь», desc — из таблицы оружия
EVOLUTION_MAP = [
  {
    'weapon': 'ЧЕК',
    'about': 'Чеки крутятся вокруг и режут толпу',
    'branches': [
      {
        'passive': 'Чековый аппарат',
        'passive_hint': 'больше чеков вокруг',
        'evo': '>> Бесконечный чек',
        'evo_hint': 'Плотная лента чеков — максимум орбит',
        'tag': 'урон вокруг',
      },
      {
        'passive': 'Поясная сумка',
        'passive_hint': 'больше снарядов',
        'evo': '>> Возврат чека',
        'evo_hint': 'Орбиты + периодический залп чеков наружу',
        'tag': 'орбиты + залп',
      },
    ],
  },
  {
    'weapon': 'ШВАБРА',
    'about': 'Сама бьёт покупателей рядом',
    'branches': [
      {
        'passive': 'Спрей',
        'passive_hint': 'яд на ударах',
        'evo': '>> Оружие уборщицы',
        'evo_hint': 'Несколько швабр + ядовитый след',
        'tag': 'яд + DPS',
      },
      {
        'passive': 'Перчатки грузчика',
        'passive_hint': 'больше зона',
        'evo': '>> Мокрый пол',
        'evo_hint': 'Швабры + зона замедления под ногами',
        'tag': 'контроль',
      },
    ],
  },
  {
    'weapon': 'БАНКОВСКАЯ КАРТА',
    'about': 'Карта летит через зал и возвращается',
    'branches': [
      {
        'passive': 'Деньги',
        'passive_hint': 'больше монет',
        'evo': '>> Чёрная карта',
        'evo_hint': 'Огромная карта — максимум урона и дальности',
        'tag': 'урон',
      },
      {
        'passive': 'Бейдж',
        'passive_hint': 'больше XP',
        'evo': '>> VIP-клиент',
        'evo_hint': 'Золотая карта + сильный магнит опыта',
        'tag': 'XP + урон',
      },
    ],
  },
  {
    'weapon': 'КОФЕ',
    'about': 'Горячие лужи на полу',
    'branches': [
      {
        'passive': 'Кофеиновый шот',
        'passive_hint': 'быстрее атаки',
        'evo': '>> КОФЕИН',
        'evo_hint': 'Три лужи сразу + ты бегаешь быстрее',
        'tag': 'скорость',
      },
      {
        'passive': 'Банка энергетика',
        'passive_hint': '+HP',
        'evo': '>> Холодный латте',
        'evo_hint': 'Холодные лужи — слабый урон, сильное замедление',
        'tag': 'контроль',
      },
    ],
  },
  {
    'weapon': 'ПОЖАРНАЯ СИРЕНА',
    'about': 'Кольцо урона от тебя наружу',
    'branches': [
      {
        'passive': 'План ТЦ',
        'passive_hint': 'больше дальность',
        'evo': '>> Пожар в ТЦ',
        'evo_hint': 'Широкая струя огня перед тобой',
        'tag': 'огонь',
      },
      {
        'passive': 'Ключ подсобки',
        'passive_hint': 'быстрее бег',
        'evo': '>> Эвакуация',
        'evo_hint': 'Мощный отталкивающий взрыв + краткая неуязвимость',
        'tag': 'защита',
      },
    ],
  },
  {
    'weapon': 'СКАНЕР ЦЕН',
    'about': 'Стреляет ценниками в ближайших',
    'branches': [
      {
        'passive': 'Скидочная карта',
        'passive_hint': 'больше крит',
        'evo': '>> Чёрная пятница',
        'evo_hint': 'Ливень ценников; убитые взрываются, есть вампиризм',
        'tag': 'DPS + хил',
      },
      {
        'passive': 'Магнит',
        'passive_hint': 'притягивает XP',
        'evo': '>> Магнитная тележка',
        'evo_hint': 'Тележка несётся сквозь толпу и притягивает врагов',
        'tag': 'рывок',
      },
    ],
  },
  {
    'weapon': 'СМАРТФОН',
    'about': 'Телефон прыгает по цепочке врагов',
    'branches': [
      {
        'passive': 'Зарядка',
        'passive_hint': 'меньше перезарядка',
        'evo': '>> Смартфон 5G',
        'evo_hint': 'Быстрая цепь из многих рикошетов',
        'tag': 'цепь',
      },
    ],
  },
  {
    'weapon': 'ГРОМКОГОВОРИТЕЛЬ',
    'about': 'Постоянный круг «акция!» вокруг',
    'branches': [
      {
        'passive': 'Наушники',
        'passive_hint': 'сильнее ауры',
        'evo': '>> Ультразвук',
        'evo_hint': 'Огромный постоянный круг урона',
        'tag': 'аура',
      },
    ],
  },
  {
    'weapon': 'ФОНАРИК',
    'about': 'Луч сам ловит ближайшего врага',
    'branches': [
      {
        'passive': 'Налобный фонарь',
        'passive_hint': 'магнит XP',
        'evo': '>> Охотник на покупателей',
        'evo_hint': 'Широкий прожектор + вспышки по лучу',
        'tag': 'луч',
      },
    ],
  },
  {
    'weapon': 'ТУРНИКЕТ',
    'about': 'Удар щитом + краткий блок',
    'branches': [
      {
        'passive': 'Жетон охраны',
        'passive_hint': 'сильнее отталкивание',
        'evo': '>> Охранный контур',
        'evo_hint': 'Кольцо щитовых ударов вокруг тебя',
        'tag': 'защита',
      },
    ],
  },
  {
    'weapon': 'ПИСТОЛЕТ-ЦЕННИК',
    'about': 'Тяжёлый выстрел, враг получает метку',
    'branches': [
      {
        'passive': 'Стикер «-50%»',
        'passive_hint': 'сильнее метки',
        'evo': '>> Автоклеймер',
        'evo_hint': 'Очередь ценников с долгими метками',
        'tag': 'метки',
      },
    ],
  },
  {
    'weapon': 'РАДИО ТЦ',
    'about': 'Замедляет толпу вокруг',
    'branches': [
      {
        'passive': 'Микрофон',
        'passive_hint': 'больше радиус радио',
        'evo': '>> Экстренное объявление',
        'evo_hint': 'Глобальный slow + короткий стан волны',
        'tag': 'контроль',
      },
    ],
  },
  {
    'weapon': 'ПАКЕТ «СПАСИБО»',
    'about': 'Пакеты на орбите, вспыхивают при касании',
    'branches': [
      {
        'passive': 'Лента кассы',
        'passive_hint': 'больше пакетов',
        'evo': '>> Лента пакетов',
        'evo_hint': 'Ещё больше пакетов, сильнее взрывы',
        'tag': 'орбиты',
      },
    ],
  },
]

PASSIVE_LOOKUP = [
  ('Чековый аппарат', 'Чек -> Бесконечный чек'),
  ('Поясная сумка', 'Чек -> Возврат чека'),
  ('Спрей', 'Швабра -> Оружие уборщицы'),
  ('Перчатки грузчика', 'Швабра -> Мокрый пол'),
  ('Деньги', 'Карта -> Чёрная карта'),
  ('Бейдж', 'Карта -> VIP-клиент'),
  ('Кофеиновый шот', 'Кофе -> КОФЕИН'),
  ('Банка энергетика', 'Кофе -> Холодный латте'),
  ('План ТЦ', 'Сирена -> Пожар в ТЦ'),
  ('Ключ подсобки', 'Сирена -> Эвакуация'),
  ('Скидочная карта', 'Сканер -> Чёрная пятница'),
  ('Магнит', 'Сканер -> Магнитная тележка'),
  ('Зарядка', 'Смартфон -> Смартфон 5G'),
  ('Наушники', 'Громкоговоритель -> Ультразвук'),
  ('Налобный фонарь', 'Фонарик -> Охотник'),
  ('Жетон охраны', 'Турникет -> Охранный контур'),
  ('Стикер «-50%»', 'Пистолет -> Автоклеймер'),
  ('Микрофон', 'Радио -> Экстренное объявление'),
  ('Лента кассы', 'Пакет -> Лента пакетов'),
]


class EvoMapPdf(FPDF):
  def __init__(self):
    super().__init__()
    self.add_font('Arial', '', str(FONT))
    self.add_font('Arial', 'B', str(FONT_BOLD))
    self.set_auto_page_break(auto=True, margin=16)

  def footer(self):
    self.set_y(-12)
    self.set_font('Arial', '', 8)
    self.set_text_color(130, 130, 130)
    self.cell(0, 8, f'Распродажа · карта эволюций · стр. {self.page_no()}', align='C')

  def _x0(self):
    self.set_x(self.l_margin)

  def page_title(self, text):
    self._x0()
    self.set_font('Arial', 'B', 18)
    self.set_text_color(25, 25, 25)
    self.multi_cell(0, 9, text)
    self.ln(2)

  def subtitle(self, text):
    self._x0()
    self.set_font('Arial', '', 10)
    self.set_text_color(70, 70, 70)
    self.multi_cell(0, 5.5, text)
    self.ln(2)

  def section(self, text):
    self._x0()
    self.ln(2)
    self.set_font('Arial', 'B', 13)
    self.set_text_color(35, 35, 35)
    self.multi_cell(0, 7, text)
    self.ln(1)

  def step_box(self, num, title, text):
    self._x0()
    y = self.get_y()
    self.set_fill_color(240, 246, 255)
    self.set_draw_color(180, 200, 230)
    h = 18
    self.rect(self.l_margin, y, self.epw, h, style='DF')
    self.set_xy(self.l_margin + 4, y + 3)
    self.set_font('Arial', 'B', 11)
    self.set_text_color(30, 60, 120)
    self.cell(8, 5, str(num))
    self.set_font('Arial', 'B', 10)
    self.set_text_color(20, 20, 20)
    self.cell(0, 5, title)
    self.set_xy(self.l_margin + 14, y + 9)
    self.set_font('Arial', '', 9)
    self.set_text_color(50, 50, 50)
    self.multi_cell(self.epw - 18, 4.5, text)
    self.set_y(y + h + 3)

  def weapon_card(self, entry):
    branches = entry['branches']
    card_h = 26 + len(branches) * 22
    if self.get_y() + card_h > self.h - 20:
      self.add_page()

    x = self.l_margin
    y = self.get_y()
    w = self.epw

    self.set_fill_color(252, 252, 252)
    self.set_draw_color(200, 200, 200)
    self.rect(x, y, w, card_h, style='D')

    self.set_xy(x + 5, y + 4)
    self.set_font('Arial', 'B', 11)
    self.set_text_color(20, 20, 20)
    self.cell(0, 6, entry['weapon'])
    self.ln(5)
    self.set_x(x + 5)
    self.set_font('Arial', '', 8)
    self.set_text_color(90, 90, 90)
    self.multi_cell(w - 10, 4, entry['about'])

    branch_y = y + 16
    if len(branches) == 1:
      b = branches[0]
      self._branch_row(x, branch_y, w, b, single=True)
    else:
      half = (w - 10) / 2
      self.set_xy(x + 5, branch_y - 2)
      self.set_font('Arial', 'B', 7)
      self.set_text_color(150, 150, 150)
      self.cell(half - 2, 4, 'ветка A', align='C')
      self.cell(half - 2, 4, 'ветка B', align='C')
      branch_y += 4
      self._branch_row(x + 5, branch_y, half - 2, branches[0], single=False)
      self._branch_row(x + 5 + half, branch_y, half - 2, branches[1], single=False)

    self.set_y(y + card_h + 4)

  def _branch_row(self, x, y, w, branch, single):
    self.set_xy(x, y)
    self.set_font('Arial', '', 8)
    self.set_text_color(100, 100, 100)
    self.cell(w, 4, 'нужна пассивка:', align='C' if not single else 'L')

    self.set_xy(x, y + 5)
    self.set_font('Arial', 'B', 9)
    self.set_text_color(30, 80, 140)
    self.multi_cell(w, 4.5, branch['passive'], align='C' if not single else 'L')

    self.set_x(x)
    self.set_font('Arial', '', 7)
    self.set_text_color(120, 120, 120)
    self.multi_cell(w, 3.5, branch['passive_hint'], align='C' if not single else 'L')

    arrow_y = self.get_y() + 1
    self.set_xy(x, arrow_y)
    self.set_font('Arial', 'B', 10)
    self.set_text_color(160, 160, 160)
    self.cell(w, 5, '>>', align='C' if not single else 'L')

    self.set_xy(x, arrow_y + 5)
    self.set_font('Arial', 'B', 9)
    self.set_text_color(20, 20, 20)
    self.multi_cell(w, 4.5, branch['evo'], align='C' if not single else 'L')

    self.set_x(x)
    self.set_font('Arial', '', 8)
    self.set_text_color(60, 60, 60)
    self.multi_cell(w, 4, branch['evo_hint'], align='C' if not single else 'L')

    self.set_x(x)
    self.set_font('Arial', 'B', 7)
    self.set_text_color(140, 90, 20)
    self.cell(w, 4, f"[{branch['tag']}]", align='C' if not single else 'L')

  def lookup_table(self, rows):
    self._x0()
    with FPDF.table(
      self,
      col_widths=(58, 132),
      line_height=5,
      text_align='LEFT',
      width=self.epw,
      first_row_as_headings=True,
    ) as tbl:
      hdr = tbl.row()
      hdr.cell('Пассивка-ключ')
      hdr.cell('Открывает эволюцию')
      for passive, evo in rows:
        r = tbl.row()
        r.cell(passive)
        r.cell(evo)


def build():
  pdf = EvoMapPdf()
  pdf.set_margins(16, 16, 16)
  pdf.add_page()

  pdf.page_title('Карта эволюций оружия')
  pdf.subtitle(
    'Простая шпаргалка: какое базовое оружие во что превращается. '
    'Эволюция заменяет старое оружие на новое, более мощное — слот не занимает дополнительно.'
  )

  pdf.section('Как получить эволюцию')
  pdf.step_box(
    1, 'Прокачай оружие до максимума',
    'На level-up выбирай «Улучшить …» пока не станет 5/5. Можно иметь до 4 оружий одновременно.',
  )
  pdf.step_box(
    2, 'Возьми нужную пассивку',
    'На level-up возьми пассивку-ключ (см. карту ниже). Достаточно 1 уровня. '
    'Некоторые пассивки можно купить заранее в хабе.',
  )
  pdf.step_box(
    3, 'Выбери эволюцию на level-up',
    'Когда оружие на максимуме и пассивка есть — вместо обычных карт появится эволюция. '
    'Если у оружия две ветки — выбираешь одну, вторую уже не получишь в этом забеге.',
  )

  pdf.ln(2)
  pdf.section('Если две ветки — это выбор')
  pdf.subtitle(
    'У чека, швабры, карты, кофе, сирены и сканера — по два финальных оружия. '
    'Пассивка определяет ветку. Планируй билд заранее!'
  )

  pdf.add_page()
  pdf.section('Карта: оружие → пассивка → эволюция')

  two_branch = [e for e in EVOLUTION_MAP if len(e['branches']) > 1]
  one_branch = [e for e in EVOLUTION_MAP if len(e['branches']) == 1]

  pdf.subtitle('Оружие с выбором ветки (6 штук)')
  for entry in two_branch:
    pdf.weapon_card(entry)

  pdf.add_page()
  pdf.subtitle('Оружие с одной эволюцией (7 штук)')
  for entry in one_branch:
    pdf.weapon_card(entry)

  pdf.add_page()
  pdf.section('Обратная шпаргалка: пассивка → что откроет')
  pdf.subtitle('Если выпала пассивка-ключ — смотри, какое оружие можно эволюционировать.')
  pdf.lookup_table(PASSIVE_LOOKUP)

  pdf.ln(4)
  pdf.section('Советы')
  pdf.subtitle(
    '- Эволюцию нельзя «отменить» — ветку выбираешь один раз.\n'
    '- Пассивку-ключ можно взять раньше, чем докачаешь оружие — она просто ждёт в слоте.\n'
    '- Если оба оружия и все 8 пассивок на максимуме — в level-up идут бонусы overflow (сила, темп, зона, HP).\n'
    '- В хабе можно купить пассивки и разблокировать оружие в общий пул — это ускоряет нужный билд.'
  )

  OUT.parent.mkdir(parents=True, exist_ok=True)
  pdf.output(str(OUT))
  print(f'OK: {OUT}')


if __name__ == '__main__':
  build()
