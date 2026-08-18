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
  {
    from: 'phone', needPassive: 'charger', into: 'phone5g', name: 'Смартфон 5G',
    branch: 'сеть', branchHint: 'быстрая цепь рикошетов',
  },
  {
    from: 'phone', into: 'video_call', name: 'Видеозвонок', v2Only: true,
    branch: 'звонок', branchHint: 'луч сам держит цель',
  },
  {
    from: 'speaker', needPassive: 'headphones', into: 'ultrasound', name: 'Ультразвук',
    branch: 'поле', branchHint: 'широкая аура вокруг тебя',
  },
  {
    from: 'speaker', into: 'megaphone', name: 'Мегафон', v2Only: true,
    branch: 'крик', branchHint: 'конус вперёд + отброс',
  },
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
  {
    from: 'flashlight', needPassive: 'headlamp', into: 'hunter', name: 'Охотник',
    branch: 'луч', branchHint: 'широкий прожектор + вспышки',
  },
  {
    from: 'flashlight', into: 'strobe', name: 'Стробоскоп', v2Only: true,
    branch: 'вспышка', branchHint: 'волны света и стан',
  },
  {
    from: 'tagger', needPassive: 'discount', into: 'black_friday', name: 'Чёрная пятница',
    branch: 'ливень', branchHint: 'залп ценников, взрывы и вамлеч',
  },
  {
    from: 'tagger', needPassive: 'magnet_pass', into: 'mag_cart', name: 'Магнитная тележка',
    branch: 'тележка', branchHint: 'чардж сквозь толпу + притяжение',
  },
  {
    from: 'turnstile', needPassive: 'guard_pass', into: 'security_loop', name: 'Охранный контур',
    branch: 'кольцо', branchHint: 'щитовые удары вокруг',
  },
  {
    from: 'turnstile', into: 'antitheft', name: 'Антикражные рамки', v2Only: true,
    branch: 'рамка', branchHint: 'чардж вперёд через очередь',
  },
  {
    from: 'pricetag', needPassive: 'sticker', into: 'auto_claimer', name: 'Автоклеймер',
    branch: 'очередь', branchHint: 'залп меток',
  },
  {
    from: 'pricetag', into: 'markdown', name: 'Уценка', v2Only: true,
    branch: 'взрыв', branchHint: 'метки, убитые взрываются',
  },
  {
    from: 'mall_radio', needPassive: 'broadcast', into: 'emergency_broadcast', name: 'Экстренное объявление',
    branch: 'эвакуация', branchHint: 'slow и стан на всю волну',
  },
  {
    from: 'mall_radio', into: 'chart_top', name: 'Хит парада', v2Only: true,
    branch: 'хит', branchHint: 'частые ударные волны',
  },
  {
    from: 'giftbag', needPassive: 'ribbon', into: 'party_bags', name: 'Лента пакетов',
    branch: 'орбита', branchHint: 'пакеты вокруг, рвутся от касания',
  },
  {
    from: 'giftbag', into: 'refund_bags', name: 'Возврат в кассу', v2Only: true,
    branch: 'бросок', branchHint: 'пакеты летят во врагов',
  },
];
