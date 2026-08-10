/**
 * Распродажа: Эволюции: база max + пассивка → эво.
 */
'use strict';

/** Эволюции: база max + пассивка → эво (как LN partner). branch* — для выбора ветки. */
const SALE_EVOLUTIONS = [
  {
    from: 'receipt', needPassive: 'printer', into: 'endless_receipt', name: 'Бесконечный чек',
    branch: 'лента', branchHint: 'плотные орбиты',
  },
  {
    from: 'receipt', needPassive: 'pouch', into: 'receipt_return', name: 'Возврат чека',
    branch: 'возврат', branchHint: 'орбиты + залп наружу',
  },
  {
    from: 'mop', needPassive: 'spray', into: 'cleaner', name: 'Оружие уборщицы',
    branch: 'яд', branchHint: 'несколько швабр + яд',
  },
  {
    from: 'mop', needPassive: 'gloves', into: 'wet_floor', name: 'Мокрый пол',
    branch: 'пол', branchHint: 'швабры + slow-зона',
  },
  { from: 'phone', needPassive: 'charger', into: 'phone5g', name: 'Смартфон 5G' },
  { from: 'speaker', needPassive: 'headphones', into: 'ultrasound', name: 'Ультразвук' },
  {
    from: 'card', needPassive: 'money', into: 'black_card', name: 'Чёрная карта',
    branch: 'сила', branchHint: 'гигантский бумеранг, больше урон/дальность',
  },
  {
    from: 'card', needPassive: 'badge', into: 'vip', name: 'VIP-клиент',
    branch: 'магнит', branchHint: 'бумеранг + сильный магнит XP',
  },
  {
    from: 'coffee', needPassive: 'energy', into: 'caffeine', name: 'КОФЕИН',
    branch: 'заряд', branchHint: '3 лужи + ускорение',
  },
  {
    from: 'coffee', needPassive: 'mug', into: 'cold_latte', name: 'Холодный латте',
    branch: 'холод', branchHint: 'лужи slow',
  },
  {
    from: 'siren', needPassive: 'map', into: 'mall_fire', name: 'Пожар в ТЦ',
    branch: 'огонь', branchHint: 'струя огня',
  },
  {
    from: 'siren', needPassive: 'key', into: 'mall_evac', name: 'Эвакуация',
    branch: 'выход', branchHint: 'отталкивание + godframe',
  },
  { from: 'flashlight', needPassive: 'headlamp', into: 'hunter', name: 'Охотник' },
  {
    from: 'tagger', needPassive: 'discount', into: 'black_friday', name: 'Чёрная пятница',
    branch: 'ливень', branchHint: 'залп ценников, взрывы и вамлеч',
  },
  {
    from: 'tagger', needPassive: 'magnet_pass', into: 'mag_cart', name: 'Магнитная тележка',
    branch: 'тележка', branchHint: 'чардж сквозь толпу + притяжение',
  },
  { from: 'turnstile', needPassive: 'guard_pass', into: 'security_loop', name: 'Охранный контур' },
  { from: 'pricetag', needPassive: 'sticker', into: 'auto_claimer', name: 'Автоклеймер' },
  { from: 'mall_radio', needPassive: 'broadcast', into: 'emergency_broadcast', name: 'Экстренное объявление' },
  { from: 'giftbag', needPassive: 'ribbon', into: 'party_bags', name: 'Лента пакетов' },
];
