/**
 * Распродажа: Боссы ТЦ: определения, порядок появления и фирменный дроп.
 */
'use strict';

/** Уникальные боссы ТЦ — LN-позвоночник каждые ~3 мин (порядок = SALE_BOSS_ORDER) */
const SALE_BOSS_DEFS = {
  floor_manager: {
    id: 'floor_manager',
    name: 'Старший смены',
    hp: 140,
    speed: 62,
    r: 26,
    color: '#94a3b8',
    tag: 'СМЕНА',
    xpReward: 16,
    coinDrop: 12,
  },
  cart_horde: {
    id: 'cart_horde',
    name: 'Король тележек',
    hp: 180,
    speed: 68,
    r: 28,
    color: '#a78bfa',
    tag: 'ТЕЛЕЖКИ',
    xpReward: 20,
    coinDrop: 14,
  },
  discount_king: {
    id: 'discount_king',
    name: 'Король скидок',
    hp: 240,
    speed: 58,
    r: 30,
    color: '#f59e0b',
    tag: '−70%',
    xpReward: 26,
    coinDrop: 18,
  },
  security_chief: {
    id: 'security_chief',
    name: 'Начальник охраны',
    hp: 320,
    speed: 72,
    r: 28,
    color: '#38bdf8',
    tag: 'STOP',
    xpReward: 32,
    coinDrop: 22,
  },
  promo_witch: {
    id: 'promo_witch',
    name: 'Промо-ведьма',
    hp: 380,
    speed: 55,
    r: 30,
    color: '#e879f9',
    tag: 'АКЦИЯ',
    xpReward: 38,
    coinDrop: 26,
  },
  mall_closing: {
    id: 'mall_closing',
    name: 'Тренер',
    hp: 520,
    speed: 50,
    r: 32,
    color: '#f97316',
    tag: 'ТРЕНЕР',
    xpReward: 50,
    coinDrop: 34,
    final: true,
    trainer: true,
  },
};
const SALE_BOSS_ORDER = [
  'floor_manager', 'cart_horde', 'discount_king',
  'security_chief', 'promo_witch', 'mall_closing',
];

/** Фирменный дроп босса (в следующий левел-ап / сразу) */
const SALE_BOSS_DROP = {
  floor_manager: { kind: 'overflow', id: 'power', label: 'Сверхурочные +1' },
  cart_horde: { kind: 'powerup', id: 'bomb', label: 'Хлопушка' },
  discount_king: { kind: 'weapon_unlock', id: 'pricetag', label: 'Пистолет-ценник в пуле' },
  security_chief: { kind: 'buff', id: 'walls', label: 'Стены охраны' },
  promo_witch: { kind: 'buff', id: 'puddles', label: 'Промо-лужи' },
  mall_closing: { kind: 'heal_max', id: '1', label: '+1 макс HP' },
};
