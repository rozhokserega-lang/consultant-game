#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерация PDF «Карта боевой системы Распродажа»."""

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'combat-system-map.pdf'
FONT = Path('C:/Windows/Fonts/arial.ttf')
FONT_BOLD = Path('C:/Windows/Fonts/arialbd.ttf')


class CombatMapPdf(FPDF):
  def __init__(self):
    super().__init__()
    self.add_font('Arial', '', str(FONT))
    self.add_font('Arial', 'B', str(FONT_BOLD))
    self.set_auto_page_break(auto=True, margin=18)

  def footer(self):
    self.set_y(-14)
    self.set_font('Arial', '', 8)
    self.set_text_color(120, 120, 120)
    self.cell(0, 8, f'consultant-game · Распродажа · стр. {self.page_no()}', align='C')

  def _reset_x(self):
    self.set_x(self.l_margin)

  def h1(self, text):
    self._reset_x()
    self.ln(4)
    self.set_font('Arial', 'B', 16)
    self.set_text_color(30, 30, 30)
    self.multi_cell(0, 9, text)
    self.ln(2)

  def h2(self, text):
    self._reset_x()
    self.ln(3)
    self.set_font('Arial', 'B', 12)
    self.set_text_color(40, 40, 40)
    self.multi_cell(0, 7, text)
    self.ln(1)

  def h3(self, text):
    self._reset_x()
    self.ln(2)
    self.set_font('Arial', 'B', 10)
    self.set_text_color(50, 50, 50)
    self.multi_cell(0, 6, text)

  def body(self, text):
    self._reset_x()
    self.set_font('Arial', '', 9)
    self.set_text_color(20, 20, 20)
    self.multi_cell(0, 5, text)
    self.ln(1)

  def mono(self, text):
    self._reset_x()
    self.set_font('Arial', '', 8)
    self.set_fill_color(245, 245, 245)
    self.multi_cell(0, 4.5, text, fill=True)
    self.ln(1)

  def bullet(self, text):
    self._reset_x()
    self.set_font('Arial', '', 9)
    self.set_text_color(20, 20, 20)
    self.multi_cell(0, 5, f'- {text}')

  def data_table(self, headers, rows, col_widths):
    self._reset_x()
    self.set_font('Arial', '', 8)
    self.set_text_color(20, 20, 20)
    with FPDF.table(
      self,
      col_widths=col_widths,
      line_height=5,
      text_align='LEFT',
      width=self.epw,
      first_row_as_headings=True,
    ) as tbl:
      hdr = tbl.row()
      for h in headers:
        hdr.cell(h)
      for row in rows:
        r = tbl.row()
        for cell in row:
          r.cell(cell)
    self.ln(2)


def build():
  pdf = CombatMapPdf()
  pdf.set_margins(18, 18, 18)
  pdf.add_page()

  pdf.h1('Боевая система «Распродажа» — карта')
  pdf.body(
    'Pet-подобная VS-петля: ты только двигаешься, урон идёт от авто-оружия. '
    'Прокачка — уровни в забеге + мета между забегами.'
  )

  pdf.h2('1. Общий цикл боя')
  pdf.mono(
    'Мета (герой, этаж, контракт, хаб, META_PERKS, Gear)\n'
    '    |\n'
    'Забег 20 мин: XP -> level-up -> до 4 оружий + 8 пассивок + overflow + эво\n'
    '    |\n'
    'Каждый кадр: updateSaleWeapons -> saleHitEnemy + директор + события'
  )
  pdf.body('Итоговый урон одного попадания:')
  pdf.mono(
    'baseDmg[уровень оружия]\n'
    'x saleDmgMul()              глобальный множитель\n'
    'x (1 + weaponOver x 7%)     оверлевел после max\n'
    'x auraMul / markMul / ...   тип и контекст'
  )
  pdf.body('КД оружия: baseCd x saleCdMul() (мин. ~35% от базы).')
  pdf.body('Размер/дальность: x saleAreaMul() (радиус, луч, range).')

  pdf.h2('2. Три слоя прогрессии')
  pdf.data_table(
    ['Слой', 'Где', 'Когда', 'Слоты'],
    [
      ['Мета', 'Хаб за банк', 'Каждый забег', '-'],
      ['Хаб-пассивки', 'Хаб за банк', 'Стартуют в забеге', 'как пассивки'],
      ['Забег', 'Level-up за XP', 'Только run', '4 оружия + 8 пассивок'],
    ],
    (28, 44, 44, 54),
  )
  pdf.body('Мета не заменяет скиллы забега — она подмешивается в статы игрока и экономику.')

  pdf.h2('3. Скиллы = оружия (авто-атака)')
  pdf.body('Макс. 4 слота. Старт — одно оружие героя. Купленное в хабе — в пул level-up, не в инвентарь.')
  pdf.h3('Роли (типы)')
  pdf.data_table(
    ['type', 'Роль', 'Примеры'],
    [
      ['orbit', 'Крутится вокруг', 'Чек, пакет'],
      ['projectile', 'Залп в цель', 'Сканер'],
      ['ricochet', 'Цепь рикошетов', 'Смартфон'],
      ['aura', 'Постоянный круг', 'Громкоговоритель'],
      ['puddle', 'Лужи на полу', 'Кофе'],
      ['nova', 'Кольцо от игрока', 'Сирена'],
      ['beam', 'Луч', 'Фонарик'],
      ['sword', 'Авто-сик рядом', 'Швабра'],
      ['shield', 'Дуга + блок', 'Турникет'],
      ['radio', 'Slow-волна', 'Радио ТЦ'],
      ['mark', 'Выстрел + метка', 'Ценник'],
      ['boomerang', 'Бумerang', 'Карта'],
      ['charge', 'Рывок сквозь толпу', 'Магн. тележка'],
      ['spray', 'Конус огня', 'Пожар в ТЦ'],
    ],
    (28, 48, 114),
  )
  pdf.h3('Level-up по оружию')
  pdf.data_table(
    ['Карта', 'Условие'],
    [
      ['Новое', 'Есть слот + оружие в каталоге'],
      ['Улучшить', 'Уже есть, < max'],
      ['Over +N', 'На капе, до +12 (+7% урона этого оружия)'],
      ['Эволюция', 'База на max + нужная пассивка'],
    ],
    (35, 155),
  )
  pdf.body('Эво заменяет базу в том же слоте (не +5-й слот).')
  pdf.body('Каталог: герой + этаж -> хаб-покупки -> с 6 мин / 12 lvl весь базовый ассортимент.')

  pdf.add_page()
  pdf.h2('4. Пассивки забега')
  pdf.body('Макс. 8 слотов. Каждая стакается до своего max (обычно 5, ключи эво — 3, medkit — 3).')
  pdf.mono(
    'SALE_PASSIVES ->\n'
    '  глобальные: saleDmgMul, saleCdMul, saleAreaMul, saleXpMul, saleMagnetRange\n'
    '  игрок: _saleSpeedMul, HP (mug / vital / medkit)\n'
    '  оружие: saleOrbitBonus, saleProjectileBonus, saleAuraDmgMul, sticker'
  )
  pdf.h3('Таблица пассивок')
  pdf.data_table(
    ['ID', 'Эффект', 'Куда'],
    [
      ['mug', '+1 max HP', 'level-up / overflow vital'],
      ['badge', '+12% XP', 'saleXpMul'],
      ['radio', '+30% магнит XP', 'saleMagnetRange'],
      ['key, shoes', '+8-9% скорость', '_saleSpeedMul'],
      ['charger, energy', '-8-10% КД', 'saleCdMul'],
      ['discount', '+10% крит в dmg', 'saleDmgMul'],
      ['pouch', '+1 снаряд / 2 ур.', 'count projectile...'],
      ['gloves, map', '+10% зона', 'saleAreaMul'],
      ['headphones', '+15% урон аур', 'saleAuraDmgMul'],
      ['money', '+18% монет', 'лут'],
      ['medkit', 'реген + шанс HP', 'тик HP / дроп'],
      ['headlamp, magnet_pass', '+магнит', 'saleMagnetRange'],
      ['printer, ribbon', '+орбита (кап 2)', 'saleOrbitBonus'],
      ['spray', 'яд + урон швабры', 'sword + puddle'],
      ['guard_pass', '+8% knock', 'saleHitEnemy'],
      ['sticker', '+12% урон по метке', 'mark mul'],
      ['broadcast', '+10% радиус radio', 'radio maxR'],
    ],
    (38, 62, 90),
  )
  pdf.body('Ключи эво (printer, pouch, spray...) — обязательное условие эволюции.')

  pdf.h2('5. Overflow — хвост после капов')
  pdf.data_table(
    ['ID', 'Эффект', 'max'],
    [
      ['power', '+8% урона всему', '30'],
      ['tempo', '-6% КД', '25'],
      ['space', '+8% размер атак', '25'],
      ['vital', '+1 max HP + heal', '20'],
    ],
    (30, 110, 50),
  )

  pdf.h2('6. Эволюции (скилл + пассивка -> новый скилл)')
  pdf.body('Условие: базовое оружие ур. 5 + нужная пассивка >= 1.')
  pdf.bullet('Чек max + printer -> Бесконечный чек | + pouch -> Возврат чека')
  pdf.bullet('Сканер max + discount -> Чёрная пятница | + magnet_pass -> Тележка')
  pdf.bullet('Громкоговоритель max + headphones -> Ультразвук')
  pdf.bullet('Полный список: src/game/modes/sale/data/evolutions.js')

  pdf.h2('7. Синергии (два оружия, без эво)')
  pdf.data_table(
    ['Пара', 'Эффект'],
    [
      ['Чек + карта', '+12% радиус орбит'],
      ['Кофе + швабра', 'яд на лужах'],
      ['Фонарик + сирена', 'луч жжёт'],
      ['Сканер + рупор', 'аура сильнее по меченым'],
    ],
    (55, 135),
  )

  pdf.add_page()
  pdf.h2('8. Метаперки (META_PERKS, хаб)')
  pdf.body('Покупаются за банк монет между забегами. В Sale через applyMetaToPlayer():')
  pdf.data_table(
    ['Перк', 'В Sale', 'Эффект'],
    [
      ['tank', 'да', '+1 max HP / ур.'],
      ['speed', 'да', '+14 скорости'],
      ['crit', 'да', '+12% critChance'],
      ['life', 'да', '1 воскрешение'],
      ['wallet', 'да', '+4 старт. монет / ур.'],
      ['magnet', 'да', 'магнит монет + saleMagnetRange'],
      ['dash', 'да', '-0.3с КД рывка'],
      ['reach', 'legacy', 'дальность ближнего удара'],
      ['thick', 'legacy', 'короче жалобы'],
    ],
    (28, 22, 140),
  )
  pdf.body('Способности (дэш / обед / сильный удар) — прокачка в хабе; основной DPS — авто-оружие.')

  pdf.h2('9. Gear (экипировка героя)')
  pdf.body('Не даёт урон/КД. Только экономика:')
  pdf.data_table(
    ['Слот', 'Стат'],
    [
      ['Бейдж', 'XP x1.05..1.20'],
      ['Карта', 'старт монет +2..+12'],
      ['Рация', 'магнит XP +15..+70'],
    ],
    (40, 150),
  )

  pdf.h2('10. Подготовка в хабе')
  pdf.mono(
    'Герой -> Этаж ТЦ -> Контракт -> Старт\n'
    'Хаб: оружие в пул | SALE_HUB_PASSIVES | META_PERKS | Gear tiers'
  )
  pdf.body('Контракты: ограничение <-> бонус монет в банк.')
  pdf.body('Этажи: ранний пул + бонус (лужи, knock, магнит, -КД).')

  pdf.h2('11. Формулы урона')
  pdf.mono(
    'saleDmgMul =\n'
    '  (1 + discount*0.1 + overflow.power*0.08)\n'
    '  x saleWeaponDmgMul x hero.dmgMul x 0.85\n\n'
    'saleCdMul = max(0.35, (1 - haste*0.08 - overflow.tempo*0.06) x floor.cdMul)\n\n'
    'saleAreaMul = 1 + (gloves+map)*0.1 + overflow.space*0.08 + synergy\n\n'
    'saleProjectileBonus = floor((pouch + 1) / 2)'
  )
  pdf.body('Попадание (saleHitEnemy): метка x1.3; lifesteal только с kill, КД 2.2с.')

  pdf.h2('12. Level-up UI')
  pdf.bullet('3 карты: эво (если готовы) -> random оружие / пассив / overflow / heal')
  pdf.bullet('Banish: 2 за забег. Reroll: 3 за забег.')
  pdf.bullet('«Улучшить X» только если saleWeapons[X] > 0.')

  pdf.h2('13. Вне level-up')
  pdf.data_table(
    ['Система', 'Что делает'],
    [
      ['Директор', 'спавн, волны ~42с, элиты ~70с, босс ~180с'],
      ['События', 'XPx2, fragile, inventory, VIP...'],
      ['Пауэрапы', 'level-up, вакуум XP, зачистка, heal'],
      ['Сложность', 'HP/скорость орды по минутам (SALE_DIFFICULTY)'],
    ],
    (35, 155),
  )

  pdf.h2('14. Шпаргалка «что качать»')
  pdf.data_table(
    ['Хочешь', 'Качай'],
    [
      ['Больше DPS', 'оружие -> эво -> overflow power'],
      ['Больше AOE', 'gloves, map, overflow space'],
      ['Чаще стреляет', 'charger, energy, overflow tempo'],
      ['Больше снарядов', 'pouch + projectile-оружие'],
      ['Орбиты', 'printer / ribbon + эво чека/пакета'],
      ['Выживаемость', 'mug, medkit, vital, meta tank'],
      ['Билд под эво', 'ключ-пассивка в хабе + база в забеге'],
    ],
    (45, 145),
  )

  OUT.parent.mkdir(parents=True, exist_ok=True)
  pdf.output(str(OUT))
  print(f'OK: {OUT}')


if __name__ == '__main__':
  build()
