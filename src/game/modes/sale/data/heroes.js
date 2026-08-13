/**
 * Распродажа: Герои-консультанты: статы и стартовое оружие.
 */
'use strict';

/** Герои-консультанты (выбор в хабе) */
const SALE_HEROES = {
  lena: {
    id: 'lena',
    name: 'Лена',
    ico: '👩‍💼',
    desc: 'Старший консультант. Баланс и +1 HP. Старт: Швабра (авто-сик).',
    hue: 0,
    maxHpBonus: 1,
    dmgMul: 1.06,
    speedMul: 1,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'mop',
  },
  igor: {
    id: 'igor',
    name: 'Игорь',
    ico: '🧔',
    desc: 'Охрана зала. Толще, чуть медленнее. Старт: Кофе (лужи).',
    hue: 195,
    maxHpBonus: 2,
    dmgMul: 0.95,
    speedMul: 0.9,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'coffee',
  },
  masha: {
    id: 'masha',
    name: 'Маша',
    ico: '💁‍♀️',
    desc: 'Касса экспресс. Быстрее и больше XP. Старт: Смартфон (цепь).',
    hue: 310,
    maxHpBonus: 0,
    dmgMul: 1,
    speedMul: 1.14,
    xpMul: 1.22,
    magnetBonus: 35,
    starterWeapon: 'phone',
  },
};

/** Порядок открытия: Игорь → Маша (победа на Спорте) → Лена (3 этаж вылазки). */
const SALE_HERO_UNLOCK_ORDER = ['igor', 'masha', 'lena'];

/** Оружие не в ассортименте, пока не открыт герой. */
const SALE_WEAPON_NEED_HERO = {
  phone: 'masha',
  mop: 'lena',
};

function getSaleHero(id) {
  return SALE_HEROES[id] || SALE_HEROES.igor;
}

window.getSaleHero = getSaleHero;
