/**
 * Вылазка: давление во времени / по ценности рюкзака + мини-апгрейды в рейде.
 */
'use strict';

/** Секунд до первого тика давления на этаже. */
const EXTRACT_PRESSURE_START = 55;
/** Интервал подкреплений давления (сек), сжимается до MIN. */
const EXTRACT_PRESSURE_INTERVAL = 42;
const EXTRACT_PRESSURE_INTERVAL_MIN = 18;
/** Сколько мобов за тик давления (база + этаж). */
const EXTRACT_PRESSURE_MOBS = 3;
/** Рост агро-радиуса со временем: +px за минуту на этаже. */
const EXTRACT_AGGRO_GROW_PER_MIN = 28;
const EXTRACT_AGGRO_GROW_CAP = 120;

/** Ценность рюкзака → «жар» охраны (пороги). */
const EXTRACT_HEAT_SOFT = 180;
const EXTRACT_HEAT_HARD = 420;
/** Шанс (0..1) доп. патруля при тике давления при hard heat. */
const EXTRACT_HEAT_PATROL_CHANCE = 0.55;

/** Макс. рабочих апгрейдов за один забег (все этажи). */
const EXTRACT_RAID_UPGRADE_MAX = 5;
/** Жетонов с элиты / босса лифта. */
const EXTRACT_TOKEN_ELITE = 1;
const EXTRACT_TOKEN_EXIT_BOSS = 2;

/** Пул выборов мини-левел-апа в рейде. */
const EXTRACT_RAID_UPGRADE_POOL = [
  {
    id: 'might',
    ico: '⚔️',
    name: 'Жёстче бить',
    desc: '+12% урон оружия на забег',
  },
  {
    id: 'tempo',
    ico: '⚡',
    name: 'Быстрее стрелять',
    desc: '−8% КД (как «Зарядка»)',
  },
  {
    id: 'boots',
    ico: '👟',
    name: 'Ноги в ход',
    desc: '+10% скорость на забег',
  },
  {
    id: 'reach',
    ico: '📐',
    name: 'Шире размах',
    desc: '+10% размер атак',
  },
  {
    id: 'patch',
    ico: '🩹',
    name: 'Пластырь смены',
    desc: '+1 макс. HP и полное сердце',
  },
];
