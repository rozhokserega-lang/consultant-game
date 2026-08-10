/**
 * Распродажа: Этажи ТЦ: ранний пул оружия и бонус этажа.
 */
'use strict';

/** Этажи ТЦ — ранний пул оружия + лёгкий бонус */
const SALE_FLOORS = [
  {
    id: 'grocery', name: 'Продукты', ico: '🛒',
    desc: 'Пул: кофе, чек, пакет. +8% урон луж.',
    weapons: ['coffee', 'receipt', 'giftbag'], puddleMul: 1.08,
  },
  {
    id: 'security', name: 'Охрана', ico: '🛡️',
    desc: 'Пул: сирена, турникет, фонарик. +8% отталкивание.',
    weapons: ['siren', 'turnstile', 'flashlight'], knockMul: 1.08,
  },
  {
    id: 'fashion', name: 'Одежда', ico: '👗',
    desc: 'Пул: карта, громкоговоритель, ценник. +магнит XP.',
    weapons: ['card', 'speaker', 'pricetag'], magnetBonus: 28,
  },
  {
    id: 'tech', name: 'Техника', ico: '🔌',
    desc: 'Пул: телефон, сканер, радио. −6% КД оружия.',
    weapons: ['phone', 'tagger', 'mall_radio'], cdMul: 0.94,
  },
];
