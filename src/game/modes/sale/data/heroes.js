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
    desc: 'Старший консультант. Баланс и +1 HP. Старт: Чек (орбита).',
    hue: 0,
    maxHpBonus: 1,
    dmgMul: 1.06,
    speedMul: 1,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'receipt',
  },
  igor: {
    id: 'igor',
    name: 'Игорь',
    ico: '🧔',
    desc: 'Охрана зала. Толще, чуть медленнее. Старт: Швабра (авто-сик).',
    hue: 195,
    maxHpBonus: 2,
    dmgMul: 0.95,
    speedMul: 0.9,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'mop',
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

function getSaleHero(id) {
  return SALE_HEROES[id] || SALE_HEROES.lena;
}

window.getSaleHero = getSaleHero;
