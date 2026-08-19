/**
 * Распродажа: Герои-консультанты: статы и стартовое оружие.
 */
'use strict';

/** Герои-консультанты (выбор в хабе) */
const SALE_HEROES = {
  igor: {
    id: 'igor',
    name: 'Игорь',
    ico: '🧔',
    desc: 'Охрана зала. 300 HP, чуть медленнее. Старт: Кофе (лужи).',
    hue: 195,
    maxHp: 300,
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
    desc: 'Касса экспресс. 250 HP, быстрее и больше XP. Старт: Смартфон (цепь).',
    hue: 310,
    maxHp: 250,
    dmgMul: 1,
    speedMul: 1.14,
    xpMul: 1.22,
    magnetBonus: 35,
    starterWeapon: 'phone',
    unlockHint: 'Победа на Спорттоварах',
  },
  cashier: {
    id: 'cashier',
    name: 'Кассир',
    ico: '🧾',
    desc: 'Чековая лента. 250 HP. Старт: Чек (орбиты).',
    hue: 28,
    maxHp: 250,
    dmgMul: 1.04,
    speedMul: 1.02,
    xpMul: 1.1,
    magnetBonus: 12,
    starterWeapon: 'receipt',
    unlockHint: 'Спорттовары: 10:00 или босс «Король скидок»',
  },
  guard: {
    id: 'guard',
    name: 'Сторож',
    ico: '🔦',
    desc: 'Ночная смена. 300 HP. Старт: Фонарик (луч).',
    hue: 48,
    maxHp: 300,
    dmgMul: 1,
    speedMul: 0.92,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'flashlight',
    unlockHint: 'Эвакуация с 1 этажа вылазки',
  },
  janitor: {
    id: 'janitor',
    name: 'Уборщица',
    ico: '🧹',
    desc: 'Хозяйственный блок. 275 HP. Старт: Швабра (авто-сик).',
    hue: 125,
    maxHp: 275,
    dmgMul: 1.05,
    speedMul: 1.04,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'mop',
    unlockHint: 'Эвакуация со 2 этажа вылазки',
  },
  lena: {
    id: 'lena',
    name: 'Лена',
    ico: '👩‍💼',
    desc: 'Старший консультант. 275 HP. Старт: Карта (бумеранг).',
    hue: 0,
    maxHp: 275,
    dmgMul: 1.06,
    speedMul: 1,
    xpMul: 1,
    magnetBonus: 0,
    starterWeapon: 'card',
    unlockHint: 'Эвакуация с 3 этажа вылазки',
  },
};

/** Порядок в выборе: стартер, потом по условиям открытия. */
const SALE_HERO_UNLOCK_ORDER = ['igor', 'masha', 'cashier', 'guard', 'janitor', 'lena'];

/** Оружие не в ассортименте, пока не открыт герой. Чек всегда доступен. */
const SALE_WEAPON_NEED_HERO = {
  phone: 'masha',
  flashlight: 'guard',
  mop: 'janitor',
  card: 'lena',
};

/** Оружие только после выноса с вылазки (не покупается и не открывается в 6:00). */
const SALE_WEAPON_NEED_FIND = {
  giftbag: true,
};

const SALE_WEAPON_FIND_HINT = {
  giftbag: 'Спрятан на 1 этаже вылазки — вынеси в рюкзаке',
};

/** Кассир: половина первой карты (Спорт) или средний босс (~9 мин). */
const SALE_CASHIER_UNLOCK_SEC = 10 * 60;
const SALE_CASHIER_UNLOCK_BOSS = 'discount_king';
const SALE_CASHIER_UNLOCK_ARENA = 'sport';

function getSaleHero(id) {
  return SALE_HEROES[id] || SALE_HEROES.igor;
}

window.getSaleHero = getSaleHero;
