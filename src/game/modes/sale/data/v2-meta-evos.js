/**
 * Распродажа 2.0: мета-эволюция — обе ветки одной базы.
 * Сама мета слот не занимает; две эво остаются в своих слотах.
 */
'use strict';

const SALE_META_EVOS = {
  coffee: {
    id: 'bubble_tea', name: 'Бабл-ти', ico: '🧋',
    desc: 'КОФЕИН + латте: шарики тапиоки и чайные лужи',
  },
  giftbag: {
    id: 'bag_of_bags', name: 'Пакет с пакетами', ico: '📦',
    desc: 'Лента + возврат: матрёшка пакетов',
  },
  receipt: {
    id: 'receipt_nest', name: 'Чек в чеке', ico: '📑',
    desc: 'Бесконечный чек + возврат: лента и залп вместе',
  },
  mop: {
    id: 'deep_clean', name: 'Генеральная уборка', ico: '🧽',
    desc: 'Уборщица + мокрый пол',
  },
  phone: {
    id: 'livestream', name: 'Прямой эфир', ico: '📡',
    desc: '5G + видеозвонок: цепь трансляции',
  },
  speaker: {
    id: 'sound_blast', name: 'Звуковая атака', ico: '📢',
    desc: 'Ультразвук + мегафон: ударная волна',
  },
  card: {
    id: 'black_vip', name: 'Чёрный VIP', ico: '🖤',
    desc: 'Чёрная карта + VIP',
  },
  siren: {
    id: 'fire_exit', name: 'Пожарная эвакуация', ico: '🚒',
    desc: 'Пожар в ТЦ + эвакуация',
  },
  flashlight: {
    id: 'raid_light', name: 'Рейд охраны', ico: '🚨',
    desc: 'Охотник + стробоскоп',
  },
  tagger: {
    id: 'friday_cart', name: 'Тележка в пятницу', ico: '🛒',
    desc: 'Чёрная пятница + магнитная тележка',
  },
  turnstile: {
    id: 'full_lock', name: 'Полный контур', ico: '🔒',
    desc: 'Охранный контур + антикражные рамки',
  },
  pricetag: {
    id: 'auto_markdown', name: 'Автоуценка', ico: '🏷️',
    desc: 'Автоклеймер + уценка',
  },
  mall_radio: {
    id: 'emergency_hit', name: 'Экстренный хит', ico: '📻',
    desc: 'Экстренное объявление + хит парада',
  },
};

function getSaleMetaEvo(family) {
  return SALE_META_EVOS[family] || null;
}

function saleEvoIdsForFamily(family) {
  if (!family || typeof SALE_EVOLUTIONS === 'undefined') return [];
  return SALE_EVOLUTIONS.filter((ev) => ev.from === family).map((ev) => ev.into);
}
