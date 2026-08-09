/**
 * Режим «Распродажа» — Vampire Survivors на 20 минут.
 * Подключается после класса Game, до new Game().
 * Баланс warm-start / дев-API — по мотивам LONG NIGHT (MIT, emorozoff).
 */
(function () {
  'use strict';

  const SALE_VERSION = '0.10.3-sale';
  const SALE_DURATION = 20 * 60; // 20 минут
  const SALE_MAX_ENEMIES = 130; // орда как в VS (мобильный потолок)
  const SALE_WORLD_MUL = 2.75;
  /** LN-style: жёсткий потолок слотов — билд, а не «собери всё» */
  const SALE_MAX_WEAPONS = 4;
  const SALE_MAX_PASSIVES = 8;
  /** После этого времени/уровня в пул попадают все базы (хаб = ранний ассортимент) */
  const SALE_CATALOG_OPEN_SEC = 360; // 6 мин
  const SALE_CATALOG_OPEN_LV = 12;
  const SALE_ROLE_BAN_SEC = 20;
  const SALE_LIFESTEAL_CD = 2.2; // сек между хилами от вампиризма
  /** LN-style: враги слабее в начале, к 6:00 выходят на baseline */
  const SALE_WARM_MINUTES = 6;
  /** LN-style директор: босс каждые 180с, волны ~42с, элиты ~70с */
  const SALE_BOSS_INTERVAL = 180;
  const SALE_BOSS_GAP_AFTER_KILL = 45;
  const SALE_WAVE_FIRST = 55;
  const SALE_WAVE_INTERVAL = 42;
  const SALE_ELITE_START = 115;
  const SALE_ELITE_INTERVAL = 70;

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
      name: 'Закрытие ТЦ',
      hp: 520,
      speed: 50,
      r: 36,
      color: '#fb923c',
      tag: 'CLOSED',
      xpReward: 50,
      coinDrop: 34,
      final: true,
    },
  };
  const SALE_BOSS_ORDER = [
    'floor_manager', 'cart_horde', 'discount_king',
    'security_chief', 'promo_witch', 'mall_closing',
  ];

  /** Пауэрапы (LN-style: chest / magnet / bomb / heart) */
  const SALE_POWERUPS = {
    chest: { id: 'chest', ico: '📦', sprite: 'paper_bag', name: 'Посылка со склада', color: '#d35400' },
    magnet: { id: 'magnet', ico: '🧲', name: 'Промо-магнит', color: '#9b59b6' },
    bomb: { id: 'bomb', ico: '🧨', name: 'Хлопушка', color: '#e74c3c' },
    heart: { id: 'heart', ico: '❤️', name: 'Сердце', color: '#e11d48' },
  };
  const SALE_BANISH_LIMIT = 2;

  function saleWarmMul(tSec) {
    const m = Math.max(0, tSec) / 60;
    // 0.65 → 1.0 за SALE_WARM_MINUTES
    return Math.min(1, 0.65 + 0.35 * Math.min(1, m / SALE_WARM_MINUTES));
  }
  function saleCoinWarmMul(tSec) {
    const m = Math.max(0, tSec) / 60;
    // ×2 в начале → ×1 к 6 мин
    return Math.max(1, 2 - m / SALE_WARM_MINUTES);
  }

  window.SALE_VERSION = SALE_VERSION;

  /** Подписи ролей для UI */
  const SALE_ROLE_LABEL = {
    projectile: 'bolt', orbit: 'orbit', ricochet: 'chain', aura: 'aura',
    boomerang: 'scythe', puddle: 'mortar', nova: 'bell', beam: 'lantern',
    sword: 'sword', charge: 'charge', spray: 'spray', shield: 'barrier',
    radio: 'pulse', mark: 'mark',
  };

  /** Семья базы ← эво (для синергий и веток) */
  const SALE_WEAPON_FAMILY = {
    endless_receipt: 'receipt', receipt_return: 'receipt',
    phone5g: 'phone', ultrasound: 'speaker',
    black_card: 'card', vip: 'card',
    caffeine: 'coffee', cold_latte: 'coffee',
    mall_fire: 'siren', mall_evac: 'siren',
    hunter: 'flashlight', cleaner: 'mop', wet_floor: 'mop',
    black_friday: 'tagger', mag_cart: 'tagger',
    security_loop: 'turnstile', auto_claimer: 'pricetag',
    emergency_broadcast: 'mall_radio', party_bags: 'giftbag',
  };

  function saleWeaponFamily(id) {
    return SALE_WEAPON_FAMILY[id] || id;
  }

  function saleHasFamily(weapons, family) {
    if (!weapons) return false;
    for (const id of Object.keys(weapons)) {
      if ((weapons[id] || 0) > 0 && saleWeaponFamily(id) === family) return true;
    }
    return false;
  }

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

  /** Контракты смены — модификаторы забега за монеты */
  const SALE_CONTRACTS = [
    { id: 'none', name: 'Обычная смена', ico: '📋', desc: 'Без ограничений.', coinMul: 1 },
    {
      id: 'dual', name: 'Только 2 оружия', ico: '✌️',
      desc: 'Макс 2 слота оружия. +35% монет в банк.',
      maxWeapons: 2, coinMul: 1.35,
    },
    {
      id: 'no_orbit', name: 'Без орбит', ico: '🚫',
      desc: 'Орбитальное оружие недоступно. +25% монет.',
      banTypes: ['orbit'], coinMul: 1.25,
    },
    {
      id: 'elite', name: 'Элиты ×2', ico: '⭐',
      desc: 'Элиты чаще и плотнее. +40% монет.',
      eliteMul: 2, coinMul: 1.4,
    },
  ];

  /** Синергии без эволюции */
  const SALE_SYNERGIES = [
    {
      a: 'receipt', b: 'card', orbitBonus: 0.12,
      label: 'Чек+карта: орбиты шире', short: '🧾💳 орбиты',
    },
    {
      a: 'coffee', b: 'mop', poisonPuddle: true,
      label: 'Кофе+швабра: яд на лужах', short: '☕🧹 яд',
    },
    {
      a: 'flashlight', b: 'siren', beamBurn: true,
      label: 'Фонарик+сирена: луч жжёт', short: '🔦🚨 огонь',
    },
    {
      a: 'tagger', b: 'speaker', markAura: true,
      label: 'Сканер+рупор: аура бьёт меченых сильнее', short: '📟📢 метка',
    },
  ];

  /**
   * Оружия Распродажи — LN-роли + mall extras (турникет/ценник/радио/пакет).
   * type: projectile | orbit | ricochet | aura | boomerang | puddle | nova | beam | sword | charge | spray | shield | radio | mark
   */
  const SALE_WEAPONS = {
    // bolt → ценник: залп в ближайших (id не scanner — тот в сейвах = старый чек)
    tagger: {
      id: 'tagger', name: 'Сканер цен', ico: '📟', max: 5,
      desc: 'Пилит ценники в ближайших покупателей',
      type: 'projectile', evolve: 'black_friday',
      baseCd: 0.95, dmg: [1, 1, 2, 2, 3], count: [1, 2, 2, 3, 4], speed: 520,
      visual: 'bloody_price', impact: 'sp_elec2',
    },
    // orbit → чек
    receipt: {
      id: 'receipt', name: 'Чек', ico: '🧾', max: 5,
      desc: 'Чеки крутятся вокруг и режут толпу',
      type: 'orbit', evolve: 'endless_receipt',
      baseCd: 0.1, dmg: [1, 1, 1, 2, 2], count: [3, 4, 5, 6, 8], radius: [58, 68, 78, 90, 105],
      spin: 3.4, visual: 'receipt',
    },
    // chain → смартфон
    phone: {
      id: 'phone', name: 'Смартфон', ico: '📱', max: 5,
      desc: 'Телефон рикошетит по цепочке врагов',
      type: 'ricochet', evolve: 'phone5g',
      baseCd: 1.05, dmg: [1, 1, 2, 2, 3], count: [1, 1, 1, 2, 2], speed: 420, bounces: [2, 3, 4, 5, 6],
      visual: 'phone', impact: 'sp_elec3',
    },
    // aura → громкоговоритель (единственная body-aura в базе)
    speaker: {
      id: 'speaker', name: 'Громкоговоритель', ico: '📢', max: 5,
      desc: 'Постоянный круг «акция!» вокруг тебя',
      type: 'aura', evolve: 'ultrasound',
      baseCd: 0.45, dmg: [1, 1, 1, 2, 2], radius: [64, 78, 94, 112, 132],
      visual: 'speaker', impact: 'sp_elec2', promo: true,
    },
    // scythe → карта
    card: {
      id: 'card', name: 'Банковская карта', ico: '💳', max: 5,
      desc: 'Карта-бумеранг через зал',
      type: 'boomerang', evolve: 'black_card',
      baseCd: 1.15, dmg: [1, 2, 2, 3, 3], speed: 360, range: [160, 190, 220, 260, 300],
      visual: 'card',
    },
    // mortar → кофе
    coffee: {
      id: 'coffee', name: 'Кофе', ico: '☕', max: 5,
      desc: 'Бросок кофе — горячие лужи на полу',
      type: 'puddle', evolve: 'caffeine',
      baseCd: 1.35, dmg: [1, 2, 2, 3, 3], speed: 300, count: [1, 1, 2, 2, 3],
      visual: 'coffee', impact: 'sp_fire2',
    },
    // bell → сирена
    siren: {
      id: 'siren', name: 'Пожарная сирена', ico: '🚨', max: 5,
      desc: 'Кольцо тревоги: волна урона от тебя наружу',
      type: 'nova', evolve: 'mall_fire',
      baseCd: 1.9, dmg: [2, 2, 3, 3, 4], radius: [110, 130, 155, 180, 210],
      visual: 'siren', knock: 220, impact: 'sp_fwave2',
    },
    // lantern → фонарик (луч в ближайшего)
    flashlight: {
      id: 'flashlight', name: 'Фонарик', ico: '🔦', max: 5,
      desc: 'Луч света сам ловит ближайшего врага',
      type: 'beam', evolve: 'hunter',
      baseCd: 0.1, dmg: [1, 1, 1, 2, 2], length: [130, 150, 170, 195, 220], width: 30,
      spin: 0, aimNearest: true, turn: 9, visual: 'flashlight',
    },
    // sword → швабра (авто-сик, НЕ орбита)
    mop: {
      id: 'mop', name: 'Швабра', ico: '🧹', max: 5,
      desc: 'Швабра сама догоняет покупателей рядом',
      type: 'sword', evolve: 'cleaner',
      baseCd: 0.05, dmg: [1, 1, 2, 2, 3], count: [1, 1, 2, 2, 3],
      range: [140, 155, 170, 190, 215], speed: 175, visual: 'mop', size: 1.2,
    },
    // barrier → турникет (контроль ближней дуги, не основной DPS)
    turnstile: {
      id: 'turnstile', name: 'Турникет', ico: '🚧', max: 5,
      desc: 'Удар щитом перед собой + краткий блок',
      type: 'shield', evolve: 'security_loop',
      baseCd: 1.05, dmg: [1, 1, 2, 2, 3], range: [95, 110, 125, 145, 165], arc: 0.8,
      visual: 'turnstile', knock: 200,
    },
    // mark bolt → пистолет-ценник
    pricetag: {
      id: 'pricetag', name: 'Пистолет-ценник', ico: '🏷️', max: 5,
      desc: 'Тяжёлый выстрел; метит врагов (+урон по метке)',
      type: 'mark', evolve: 'auto_claimer',
      baseCd: 1.1, dmg: [2, 2, 2, 3, 3], count: [1, 1, 1, 2, 2], speed: 440,
      visual: 'bloody_price', impact: 'sp_elec2', markSec: 3.5,
    },
    // pulse → радио ТЦ (utility: slow; урон слабый)
    mall_radio: {
      id: 'mall_radio', name: 'Радио ТЦ', ico: '📻', max: 5,
      desc: 'Объявление: замедляет толпу вокруг',
      type: 'radio', evolve: 'emergency_broadcast',
      baseCd: 2.9, dmg: [1, 1, 1, 1, 2], radius: [120, 140, 160, 185, 210],
      visual: 'speaker', slow: 0.55, impact: 'sp_elec2',
    },
    // orbit bags → пакет «спасибо»
    giftbag: {
      id: 'giftbag', name: 'Пакет «спасибо»', ico: '🛍️', max: 5,
      desc: 'Пакеты на орбите; при касании вспыхивают',
      type: 'orbit', evolve: 'party_bags',
      baseCd: 0.12, dmg: [1, 1, 1, 2, 2], count: [2, 2, 3, 3, 4], radius: [68, 78, 88, 98, 110],
      spin: 2.6, visual: 'giftbag', explodeHit: true, size: 1.05,
    },

    // ── эволюции ──
    endless_receipt: {
      id: 'endless_receipt', name: 'Бесконечный чек', ico: '📜', max: 1,
      desc: 'Плотная лента чеков вокруг',
      type: 'orbit', evolved: true,
      baseCd: 0.08, dmg: [3], count: [12], radius: [100], spin: 5.5, visual: 'endless_receipt', size: 1.15,
    },
    receipt_return: {
      id: 'receipt_return', name: 'Возврат чека', ico: '↩️', max: 1,
      desc: 'Орбиты + периодический залп чеков наружу',
      type: 'orbit', evolved: true,
      baseCd: 0.1, dmg: [2], count: [7], radius: [92], spin: 4.0, visual: 'endless_receipt',
      size: 1.08, volleyOut: true, volleyCd: 1.75,
    },
    phone5g: {
      id: 'phone5g', name: 'Смартфон 5G', ico: '📶', max: 1,
      desc: 'Быстрая цепь рикошетов по залу',
      type: 'ricochet', evolved: true,
      baseCd: 0.6, dmg: [3], count: [3], speed: 500, bounces: [7], visual: 'phone5g', impact: 'sp_elec3',
    },
    ultrasound: {
      id: 'ultrasound', name: 'Ультразвук', ico: '🔊', max: 1,
      desc: 'Огромный постоянный круг ультразвука (как громкоговоритель, но шире)',
      type: 'aura', evolved: true,
      baseCd: 0.38, dmg: [2], radius: [195], visual: 'ultrasound', knock: 140, impact: 'sp_elec3',
    },
    black_card: {
      id: 'black_card', name: 'Чёрная карта', ico: '🖤', max: 1,
      desc: 'Огромная карта-бумеранг через весь зал',
      type: 'boomerang', evolved: true,
      baseCd: 0.88, dmg: [4], speed: 380, range: [360], visual: 'black_card', size: 1.95,
    },
    vip: {
      id: 'vip', name: 'VIP-клиент', ico: '⭐', max: 1,
      desc: 'Золотая карта-бумеранг + магнит XP',
      type: 'boomerang', evolved: true,
      baseCd: 0.78, dmg: [3], speed: 400, range: [320], visual: 'vip', size: 1.3, magnetBonus: 55,
    },
    caffeine: {
      id: 'caffeine', name: 'КОФЕИН', ico: '⚡', max: 1,
      desc: 'Кофе в 3 стороны + ускорение',
      type: 'puddle', evolved: true,
      baseCd: 0.75, dmg: [3], speed: 360, count: [3], visual: 'caffeine', impact: 'sp_bolt3', buffSpeed: 1.25,
    },
    cold_latte: {
      id: 'cold_latte', name: 'Холодный латте', ico: '🧊', max: 1,
      desc: 'Холодные лужи: слабый урон, сильный slow',
      type: 'puddle', evolved: true,
      baseCd: 0.9, dmg: [1], speed: 290, count: [3], visual: 'coffee', impact: 'sp_bolt1',
      puddleSlow: 0.38, puddleColor: '#7dd3fc',
    },
    mall_fire: {
      id: 'mall_fire', name: 'Пожар в ТЦ', ico: '🔥', max: 1,
      desc: 'Широкая струя огня перед тобой',
      type: 'spray', evolved: true,
      baseCd: 0.45, dmg: [3], range: [170], arc: 0.95, visual: 'mall_fire', impact: 'sp_fwave3',
    },
    mall_evac: {
      id: 'mall_evac', name: 'Эвакуация', ico: '🚪', max: 1,
      desc: 'Мощная волна отталкивания + краткий godframe',
      type: 'nova', evolved: true,
      baseCd: 1.85, dmg: [3], radius: [220], visual: 'siren', knock: 380, impact: 'sp_fwave3',
      iFrames: 0.4,
    },
    hunter: {
      id: 'hunter', name: 'Охотник на покупателей', ico: '💡', max: 1,
      desc: 'Прожектор 180° + вспышки по лучу',
      type: 'beam', evolved: true,
      baseCd: 0.08, dmg: [2], length: [230], width: 44, spin: 0, aimNearest: true, turn: 11,
      visual: 'hunter', summonBats: true, cone: 0.5,
    },
    cleaner: {
      id: 'cleaner', name: 'Оружие уборщицы', ico: '🧼', max: 1,
      desc: 'Несколько швабр + ядовитый след',
      type: 'sword', evolved: true,
      baseCd: 0.05, dmg: [3], count: [3], range: [195], speed: 205, visual: 'cleaner', trail: true, size: 1.3,
    },
    wet_floor: {
      id: 'wet_floor', name: 'Мокрый пол', ico: '⚠️', max: 1,
      desc: 'Швабры + зона slow под ногами',
      type: 'sword', evolved: true,
      baseCd: 0.05, dmg: [2], count: [2], range: [180], speed: 195, visual: 'mop', size: 1.2,
      floorSlow: true,
    },
    black_friday: {
      id: 'black_friday', name: 'Чёрная пятница', ico: '💀', max: 1,
      desc: 'Ливень ценников; убитые взрываются',
      type: 'projectile', evolved: true,
      baseCd: 0.62, dmg: [3], count: [4], speed: 460, lifesteal: 0.12,
      visual: 'bloody_price', impact: 'sp_bleed2', explodeOnKill: true,
    },
    mag_cart: {
      id: 'mag_cart', name: 'Магнитная тележка', ico: '🛒', max: 1,
      desc: 'Тележка несётся и притягивает толпу',
      type: 'charge', evolved: true,
      baseCd: 1.2, dmg: [4], speed: 290, range: [420], visual: 'mag_cart', size: 1.55, pull: 165, impact: 'sp_quake3',
    },
    security_loop: {
      id: 'security_loop', name: 'Охранный контур', ico: '🛂', max: 1,
      desc: 'Кольцо щитовых ударов вокруг тебя',
      type: 'nova', evolved: true,
      baseCd: 1.55, dmg: [3], radius: [155], visual: 'siren', knock: 280, impact: 'sp_quake2',
    },
    auto_claimer: {
      id: 'auto_claimer', name: 'Автоклеймер', ico: '🔫', max: 1,
      desc: 'Очередь ценников с долгими метками',
      type: 'mark', evolved: true,
      baseCd: 0.72, dmg: [3], count: [3], speed: 500, visual: 'bloody_price', impact: 'sp_elec3', markSec: 5,
    },
    emergency_broadcast: {
      id: 'emergency_broadcast', name: 'Экстренное объявление', ico: '📣', max: 1,
      desc: 'Глобальный slow + короткий стан волны',
      type: 'radio', evolved: true,
      baseCd: 2.15, dmg: [2], radius: [270], visual: 'ultrasound', slow: 0.42, impact: 'sp_elec3', stun: 0.22,
    },
    party_bags: {
      id: 'party_bags', name: 'Лента пакетов', ico: '🎁', max: 1,
      desc: 'Пакеты на орбите, взрываются от касания',
      type: 'orbit', evolved: true,
      baseCd: 0.1, dmg: [2], count: [7], radius: [105], spin: 3.4, visual: 'giftbag',
      explodeHit: true, size: 1.2,
    },
  };

  /** Старые id из сейвов/хаба → новая карта */
  const SALE_WEAPON_MIGRATE = {
    cart: 'tagger', extinguisher: 'siren', spray_wep: 'siren',
    bag: 'tagger', box: 'tagger', chair: 'card', axe: 'card',
    magnet: 'tagger', bloody_price: 'tagger', bats: 'flashlight',
    graveyard: 'coffee', bloody_aura: 'speaker',
    furniture_ram: 'vip', logistics: 'black_friday', sleepless: 'ultrasound',
  };

  const SALE_PASSIVES = {
    mug: { id: 'mug', name: 'Кофейная кружка', ico: '☕', max: 5, desc: '+1 макс HP / ур.' },
    badge: { id: 'badge', name: 'Бейдж', ico: '🪪', max: 5, desc: '+12% XP / ур.' },
    radio: { id: 'radio', name: 'Рация', ico: '📻', max: 5, desc: '+30% магнит XP / ур.' },
    key: { id: 'key', name: 'Ключ подсобки', ico: '🔑', max: 5, desc: '+8% скорости / ур.' },
    charger: { id: 'charger', name: 'Зарядка', ico: '🔌', max: 5, desc: '−8% КД оружия / ур.' },
    discount: { id: 'discount', name: 'Скидочная карта', ico: '🏷️', max: 5, desc: '+10% крит / ур.' },
    pouch: { id: 'pouch', name: 'Поясная сумка', ico: '👝', max: 5, desc: '+1 снаряд на 2 ур.' },
    shoes: { id: 'shoes', name: 'Кроссовки', ico: '👟', max: 5, desc: '+9% скорости / ур.' },
    headphones: { id: 'headphones', name: 'Наушники', ico: '🎧', max: 5, desc: '+15% урон аур / ур.' },
    gloves: { id: 'gloves', name: 'Перчатки грузчика', ico: '🧤', max: 5, desc: '+12% размер / ур.' },
    energy: { id: 'energy', name: 'Энергетик', ico: '🥤', max: 5, desc: '+10% скорость атаки / ур.' },
    map: { id: 'map', name: 'План ТЦ', ico: '🗺️', max: 5, desc: '+10% дальность / ур.' },
    money: { id: 'money', name: 'Деньги', ico: '💰', max: 5, desc: '+18% монет / ур.' },
    medkit: {
      id: 'medkit', name: 'Аптечка', ico: '🩹', max: 3,
      desc: 'Реген HP каждые N сек; +2% шанс сердца с врагов / ур.',
    },
    headlamp: { id: 'headlamp', name: 'Налобный фонарь', ico: '💡', max: 5, desc: '+магнит XP / ур.' },
    printer: {
      id: 'printer', name: 'Чековый аппарат', ico: '🖨️', max: 3,
      desc: '+1 орбитальный чек и +8% радиус орбит / ур. (эво → Бесконечный чек)',
    },
    spray: {
      id: 'spray', name: 'Спрей', ico: '🧴', max: 3,
      desc: 'Швабра оставляет яд; +12% урон сика / ур. (эво → Уборщица)',
    },
    magnet_pass: {
      id: 'magnet_pass', name: 'Магнит', ico: '🧲', max: 3,
      desc: '+40 магнит XP / ур. (эво сканера → тележка)',
    },
    guard_pass: {
      id: 'guard_pass', name: 'Жетон охраны', ico: '🪪', max: 3,
      desc: '+8% отталкивание / ур. (эво → Охранный контур)',
    },
    sticker: {
      id: 'sticker', name: 'Стикер «−50%»', ico: '🔻', max: 3,
      desc: '+12% урон меток / ур. (эво → Автоклеймер)',
    },
    broadcast: {
      id: 'broadcast', name: 'Микрофон', ico: '🎙️', max: 3,
      desc: '+10% радиус радио / ур. (эво → Экстренное объявление)',
    },
    ribbon: {
      id: 'ribbon', name: 'Лента кассы', ico: '🎀', max: 3,
      desc: '+1 орбитальный пакет / ур. (эво → Лента пакетов)',
    },
  };
  // aliases for old hub saves
  SALE_PASSIVES.might = SALE_PASSIVES.discount;
  SALE_PASSIVES.haste = SALE_PASSIVES.charger;
  SALE_PASSIVES.area = SALE_PASSIVES.gloves;
  SALE_PASSIVES.speed = SALE_PASSIVES.shoes;
  SALE_PASSIVES.magnet = SALE_PASSIVES.radio;
  SALE_PASSIVES.vitality = SALE_PASSIVES.mug;
  SALE_PASSIVES.regen = SALE_PASSIVES.medkit;
  SALE_PASSIVES.wallet = SALE_PASSIVES.money;

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

  const SALE_HUB_WEAPON_COST = {
    mop: 70, phone: 80, tagger: 100, coffee: 100, giftbag: 110,
    card: 120, speaker: 130, flashlight: 140, siren: 150,
    turnstile: 130, pricetag: 140, mall_radio: 145,
  };

  const SALE_HUB_PASSIVES = [
    { id: 'mug', ico: '☕', name: 'Кружка', max: 3, cost: [40, 80, 130], desc: 'Старт +HP / эво кофе → латте' },
    { id: 'charger', ico: '🔌', name: 'Зарядка', max: 3, cost: [45, 85, 140], desc: 'Старт с меньшей КД / эво телефона' },
    { id: 'shoes', ico: '👟', name: 'Кроссовки', max: 3, cost: [40, 75, 120], desc: 'Старт быстрее' },
    { id: 'radio', ico: '📻', name: 'Рация', max: 3, cost: [35, 65, 110], desc: 'Старт с магнитом XP' },
    { id: 'gloves', ico: '🧤', name: 'Перчатки', max: 3, cost: [40, 75, 120], desc: 'Зона / эво швабры → мокрый пол' },
    { id: 'key', ico: '🔑', name: 'Ключ', max: 2, cost: [50, 100], desc: 'Скорость / эво сирены → эвакуация' },
    { id: 'pouch', ico: '👝', name: 'Сумка', max: 2, cost: [55, 100], desc: 'Снаряды / эво чека → возврат' },
    { id: 'money', ico: '💰', name: 'Деньги', max: 2, cost: [55, 100], desc: 'Монеты / эво карты' },
    { id: 'printer', ico: '🖨️', name: 'Чековый аппарат', max: 2, cost: [80, 140], desc: '+орбиты чеков / эво чека' },
    { id: 'spray', ico: '🧴', name: 'Спрей', max: 2, cost: [80, 140], desc: 'Яд на швабре / эво швабры' },
    { id: 'magnet_pass', ico: '🧲', name: 'Магнит', max: 2, cost: [80, 140], desc: '+магнит XP / эво → тележка' },
    { id: 'guard_pass', ico: '🪪', name: 'Жетон', max: 1, cost: [120], desc: 'Эво турникета' },
    { id: 'sticker', ico: '🔻', name: 'Стикер', max: 1, cost: [120], desc: 'Эво пистолета-ценника' },
    { id: 'broadcast', ico: '🎙️', name: 'Микрофон', max: 1, cost: [120], desc: 'Эво радио ТЦ' },
    { id: 'ribbon', ico: '🎀', name: 'Лента', max: 1, cost: [120], desc: 'Эво пакета' },
    { id: 'energy', ico: '🥤', name: 'Энергетик', max: 1, cost: [130], desc: 'Эво кофе → КОФЕИН' },
    { id: 'headphones', ico: '🎧', name: 'Наушники', max: 1, cost: [130], desc: 'Эво громкоговорителя' },
    { id: 'map', ico: '🗺️', name: 'План ТЦ', max: 1, cost: [130], desc: 'Эво сирены → пожар' },
    { id: 'headlamp', ico: '💡', name: 'Налобник', max: 1, cost: [130], desc: 'Эво фонарика' },
    { id: 'discount', ico: '🏷️', name: 'Скидка', max: 1, cost: [140], desc: 'Эво сканера → Чёрная пятница' },
    { id: 'badge', ico: '🪪', name: 'Бейдж', max: 1, cost: [130], desc: 'Эво карты → VIP' },
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

  /** visual id в атласе оружия (wp_<id>1/2/3) */
  const SALE_VISUAL_ALIAS = {
    fire: 'extinguisher', sound: 'speaker', beam: 'flashlight',
    blood: 'bloody_price', blood_aura: 'bloody_aura', bat: 'bats',
  };

  function saleVisualKey(visual) {
    if (!visual) return null;
    return SALE_VISUAL_ALIAS[visual] || visual;
  }

  /** Оружие в бою и UI — системные emoji (🧾 🧹 📱), не атлас. */
  function drawSaleIcon(ctx, ico, x, y, scale, rot) {
    const mul = Math.max(0.45, scale || 1);
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    const s = Math.max(14, Math.round(22 * mul));
    ctx.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, s * 0.12);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeText(ico || '?', 0, 0);
    ctx.fillText(ico || '?', 0, 0);
    ctx.restore();
  }

  function paintSaleChoiceIcon(el, up) {
    if (!el) return;
    // оружие / эволюции / пассивки — системные emoji из ico, если есть
    let ico = up.ico;
    if (!ico && up.kind === 'passive' && SALE_PASSIVES[up.id]) ico = SALE_PASSIVES[up.id].ico;
    if (!ico && SALE_WEAPONS[up.id]) ico = SALE_WEAPONS[up.id].ico;
    el.textContent = ico || '?';
  }

  function saleXpToNext(level) {
    // к середине забега уровни дороже — пул апгрейдов не кончается на 10-й минуте
    const late = Math.max(0, level - 10);
    return Math.floor(10 + level * 5.2 + level * level * 0.42 + late * late * 0.55);
  }

  /** Бесконечный хвост прокачки (как LN после капов) */
  const SALE_OVERFLOW = [
    { id: 'power', ico: '💪', name: 'Сверхурочные', desc: '+8% урона всему', max: 30 },
    { id: 'tempo', ico: '⏱️', name: 'Час пик', desc: '−6% перезарядка оружия', max: 25 },
    { id: 'space', ico: '📐', name: 'Расширение зала', desc: '+8% размер атак', max: 25 },
    { id: 'vital', ico: '❤️‍🔥', name: 'Медосмотр', desc: '+1 макс HP и +1 HP', max: 20 },
  ];

  function saleTimeFactor(t) {
    // 0..1 за 20 минут
    return Math.min(1, t / SALE_DURATION);
  }

  function saleSpawnInterval(t) {
    const f = saleTimeFactor(t);
    // VS-плотность: быстро выходим на орду
    return Math.max(0.07, 0.48 - f * 0.4);
  }

  /** Сколько мобов за один тик спавна */
  function saleSpawnBurst(t) {
    const f = saleTimeFactor(t);
    if (f > 0.75) return 5;
    if (f > 0.5) return 4;
    if (f > 0.3) return 3;
    if (f > 0.12) return 2;
    return 1;
  }

  function saleEnemyType(t) {
    const f = saleTimeFactor(t);
    const r = Math.random();
    if (f > 0.85 && r < 0.04) return 'director';
    if (f > 0.55 && r < 0.08) return 'boss';
    if (f > 0.35 && r < 0.12) return 'fatty';
    if (f > 0.25 && r < 0.18) return 'tank';
    if (f > 0.15 && r < 0.28) return 'fast';
    if (f > 0.4 && r < 0.35) return 'manager';
    if (r < 0.12) return 'returner';
    return 'normal';
  }

  function saleEnemyWaveApprox(t) {
    return 1 + Math.floor(saleTimeFactor(t) * 14);
  }

  /** Минутные события ТЦ — пулы по фазам забега */
  const SALE_EVENT_POOLS = {
    early: ['queue_rush', 'happy_hour', 'xp_double', 'xp_discount', 'checkout_hall'],
    mid: ['lights_out', 'fire_dept', 'security_walls', 'complaint_book', 'evacuation', 'weapon_sale'],
    late: ['triple_boss', 'vip_day', 'director_call', 'black_friday', 'inventory', 'fire_dept'],
    brutal: ['black_friday', 'triple_boss', 'evacuation', 'director_call', 'weapon_sale', 'vip_day', 'complaint_book'],
    finale: ['mall_closing'],
  };

  function saleEventPoolForMinute(minute) {
    if (minute >= 19) return SALE_EVENT_POOLS.finale;
    if (minute >= 15) return SALE_EVENT_POOLS.brutal;
    if (minute >= 10) return SALE_EVENT_POOLS.late;
    if (minute >= 5) return SALE_EVENT_POOLS.mid;
    return SALE_EVENT_POOLS.early;
  }

  function pickSaleEventId(minute, lastId) {
    const pool = saleEventPoolForMinute(minute).slice();
    if (pool.length > 1 && lastId) {
      const filtered = pool.filter((id) => id !== lastId);
      if (filtered.length) return filtered[randi(0, filtered.length - 1)];
    }
    return pool[randi(0, pool.length - 1)];
  }

  // ─── hooks into Game ───────────────────────────────────────────

  const _resize = Game.prototype.resize;
  Game.prototype.resize = function () {
    _resize.call(this);
    if (this.gameMode === 'sale' && !this.inHub) {
      this.worldW = Math.max(2800, Math.floor(this.viewW() * SALE_WORLD_MUL));
      this.worldH = Math.max(2000, Math.floor(this.viewH() * SALE_WORLD_MUL));
    }
  };

  Game.prototype.update = function (dt) {
    return this.updateSale(dt);
  };

  Game.prototype.updateHUD = function () {
    return this.updateSaleHUD();
  };

  Game.prototype.endGame = function (won, killer) {
    return this.endSaleGame(won, killer);
  };

  Game.prototype.onEnemyKilled = function (enemy) {
    return this.onSaleEnemyKilled(enemy);
  };

  Game.prototype.openUpgradeUI = function () {
    return this.openSaleUpgradeUI();
  };

  Game.prototype.pickUpgrade = function (i) {
    return this.pickSaleUpgrade(i);
  };

  Game.prototype.resetGame = function () {
    return this.resetSaleGame();
  };

  const _explodeAt = Game.prototype.explodeAt;
  Game.prototype.explodeAt = function (x, y) {
    if (this.gameMode !== 'sale') return _explodeAt.call(this, x, y);
    const R = typeof FATTY_EXPLODE_RADIUS !== 'undefined' ? FATTY_EXPLODE_RADIUS : 90;
    this.spawnParticles(x, y, 45, '#ff6b00', 420, 0.9);
    this.spawnParticles(x, y, 25, '#fff200', 280, 0.6);
    this.spawnParticles(x, y, 18, '#e74c3c', 200, 0.5);
    this.screenShake = Math.max(this.screenShake, 0.35);
    sfx.hurt();
    this.vibrate([40, 30, 60]);
    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x, y, life: 0.45, max: 0.45 });
    // подпалина после взрыва (тонированная частица Kenney)
    this.spawnAnimFx('kfx_scorch', x, y, { life: 3.0, scale: 1.35, alpha: 0.45, tint: '#140b05' });

    if (this.player.invincible <= 0 && this.player.lunchTimer <= 0) {
      if (dist(x, y, this.player.x, this.player.y) < R + this.player.r) {
        if (this.player.takeDamage(x, y)) {
          this.tookDamage = true;
          this.endSaleGame(false, 'Взрыв жирного покупателя 💣');
          return true;
        }
        this.tookDamage = true;
        if (this.applySaleFragileExtra && this.applySaleFragileExtra()) return true;
      }
    }

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.type === 'boss' || e.type === 'director') continue;
      if (dist(x, y, e.x, e.y) < R + e.r) {
        const died = e.hit(2, x, y);
        this.spawnParticles(e.x, e.y, 8, '#ffaa00', 160, 0.35);
        if (died) {
          if (e.type === 'fatty' || e.explodes) this.armFattyFuse(e);
          this.onSaleEnemyKilled(e);
        }
      }
    }
    return false;
  };

  // ─── Sale mode implementation ──────────────────────────────────

  Game.prototype.resetSaleGame = function () {
    this.hideOverlays();
    // на случай если class ещё не применился — гарантируем layout
    document.body.classList.add('sale-mode');
    this.resize();
    this.worldW = Math.max(2800, Math.floor(this.viewW() * SALE_WORLD_MUL));
    this.worldH = Math.max(2000, Math.floor(this.viewH() * SALE_WORLD_MUL));

    if (this.selectedChallenge === 'hammer_only') {
      this.weaponId = 'hammer';
      this.hammerId = 'hammer';
    }
    const weapon = this.getWeapon();
    this.player = new Player(this.worldW / 2, this.worldH / 2, weapon);
    this.player.equippedWeaponId = this.weaponId;
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
    this.pickups = [];
    this.boomFx = [];
    this.bossLines = [];
    this.fuseBombs = [];
    this.playerProjectiles = [];
    this.saleOrbits = [];
    this.saleBoomerangs = [];
    this.xpGems = [];
    this.spriteFx = [];
    this.animFx = [];

    this.score = 0;
    this.coins = 5 + (this.metaPerks.wallet || 0) * 4;
    this.coinMult = this.selectedChallenge === 'x2' ? 2 : 1;
    this.screenShake = 0;
    this.modeTimer = 0;
    this.isChaseMode = true;
    this.modeFlash = 0;
    this.wavePhase = 'sale';
    this.wave = 1;
    this.waveKills = 0;
    this.waveSpawned = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboShield = 0;
    this.pendingUpgrades = 0;
    this.upgradeChoices = [];
    this.upgradeRerollsLeft = 3;
    this.choosingUpgrade = false;
    this.shopping = false;
    this.paused = false;
    this.gameOver = false;
    this.won = false;
    this.killedBy = '';
    this.directorSpawned = false;
    this.lightsOut = 0;
    this.fireAlarm = 0;
    this.eventCooldown = 9999;
    this._eventBanner = null;
    this.challengeFailed = false;
    this.tookDamage = false;

    // минутные события
    this.saleEventMinute = 0;
    this.saleLastEventId = null;
    this.saleActiveEvent = null;
    this.saleMobSpeedMul = 1;
    this.saleSpawnMul = 1;
    this.saleXpEventMul = 1;
    this.saleWeaponDmgMul = 1;
    this.saleFragile = false;
    this.saleForceTypes = null;
    this.saleInvulnExcept = null;
    this.saleEvacMode = null;
    this.saleEventAcc = 0;
    this.saleTempWalls = [];
    this.saleVipRef = null;
    this.saleBossSpawned = {};
    this.saleBossIdx = 0;
    this.saleBossT = SALE_BOSS_INTERVAL;
    this.saleWaveT = SALE_WAVE_FIRST;
    this.saleEliteT = SALE_ELITE_START;
    this.saleLastWaveKind = null;
    this.saleBossHazards = [];
    this.saleArenaShrink = 0;
    this.salePowerups = [];
    this.saleDmgNums = [];
    this.saleVacuumT = 0;
    this._saleBloodAuraR = 0;
    this._saleAura = null;
    this.saleBanned = {};
    this.saleBanishesLeft = SALE_BANISH_LIMIT;
    this._saleBanishMode = false;
    this.saleOverflow = {};
    this.saleWeaponOver = {};
    this.saleRoleBan = null;
    this.saleRunUnlocks = [];
    this._saleSynSeen = {};
    this.saleFloorId = this.selectedFloorId || 'grocery';
    this.saleContract = SALE_CONTRACTS.find((c) => c.id === (this.selectedContractId || 'none')) || SALE_CONTRACTS[0];
    this._saleShieldT = 0;
    this._saleOrbitVolleyCd = {};
    // баннер контракта/этажа — после старта кадра (см. ниже)

    // Sale state
    this.saleTime = 0;
    this.saleSpawnAcc = 0;
    this.saleLevel = 1;
    this.saleXp = 0;
    this.saleXpNext = saleXpToNext(1);
    this.salePassives = {};
    // стартовые пассивки из хаба
    const startP = this.saleStartPassives || {};
    for (const [id, lv] of Object.entries(startP)) {
      const n = Math.max(0, lv | 0);
      if (n > 0) this.salePassives[id] = n;
    }
    // LN-style: в руки только стартер героя. Купленное в хабе — ассортимент пула, не инвентарь.
    const heroStart = getSaleHero(this.selectedHeroId);
    let starter = heroStart.starterWeapon || 'receipt';
    if (!SALE_WEAPONS[starter] || SALE_WEAPONS[starter].evolved) starter = 'receipt';
    this.saleWeapons = { [starter]: 1 };
    // миграция старых id на всякий случай (если дев-панель подсунула)
    if (this.saleWeapons.hammer) { delete this.saleWeapons.hammer; this.saleWeapons.receipt = this.saleWeapons.receipt || 1; }
    if (this.saleWeapons.tags) { this.saleWeapons.receipt = Math.max(this.saleWeapons.receipt || 0, this.saleWeapons.tags); delete this.saleWeapons.tags; }
    if (this.saleWeapons.scanner) { this.saleWeapons.phone = Math.max(this.saleWeapons.phone || 0, this.saleWeapons.scanner); delete this.saleWeapons.scanner; }

    this.saleWeaponCd = {};
    this.saleRegenTimer = 0;
    this.saleOrbits = [];
    this.saleProjectiles = [];
    this.saleBeams = [];
    this.salePuddles = [];
    this.saleCharges = [];
    this.saleSeekers = [];
    this.saleSwords = [];
    this.saleRings = [];
    this._salePromoAuraR = 0;
    this._saleUltraAuraR = 0;
    Object.keys(SALE_WEAPONS).forEach((id) => { this.saleWeaponCd[id] = 0.25; });

    this.applyMetaToPlayer();
    this.applySalePassivesToPlayer();
    this.applySaleHeroToPlayer();
    // стартовая vitality из хаба
    const vit = this.salePassives.vitality || 0;
    if (vit > 0) {
      this.player.maxHp += vit;
      this.player.hp = this.player.maxHp;
    }
    // HP героя после vitality
    const hero = getSaleHero(this.selectedHeroId);
    if (hero.maxHpBonus) {
      this.player.maxHp += hero.maxHpBonus;
      this.player.hp = this.player.maxHp;
    }
    this.generateObstacles();
    this.generateStorefronts();
    this.generateWallDecor();
    this.generateZones();
    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;

    // стартовый наплыв — сразу как мини-орда
    for (let i = 0; i < 28; i++) this.spawnSaleEnemy();
    this._saleLsCd = 0;

    const fl = this.getSaleFloor();
    const c = this.saleContract;
    const bits = [];
    if (fl) bits.push(fl.ico + ' ' + fl.name);
    if (c && c.id !== 'none') bits.push(c.ico + ' ' + c.name);
    if (bits.length) this.showEventBanner(bits.join(' · '), 2.2);

    this.refreshMusicState();
    sfx.click();
  };

  Game.prototype.applySalePassivesToPlayer = function () {
    const p = this.player;
    if (!p) return;
    const spd = (this.salePassives.speed || 0) + (this.salePassives.shoes || 0) + (this.salePassives.key || 0);
    const caffDef = this.saleWeapons.caffeine && SALE_WEAPONS.caffeine;
    const caff = caffDef ? ((caffDef.buffSpeed || 1.25) - 1) : 0;
    const hero = getSaleHero(this.selectedHeroId);
    p._saleSpeedMul = (1 + spd * 0.08 + caff) * (hero.speedMul || 1);
  };

  Game.prototype.applySaleHeroToPlayer = function () {
    const p = this.player;
    if (!p) return;
    const hero = getSaleHero(this.selectedHeroId);
    this.saleHeroId = hero.id;
    p._saleHeroId = hero.id;
    p._saleHeroHue = hero.hue || 0;
    p._saleHeroName = hero.name;
  };

  Game.prototype.getSaleFloor = function () {
    return SALE_FLOORS.find((f) => f.id === (this.saleFloorId || this.selectedFloorId)) || SALE_FLOORS[0];
  };

  Game.prototype.saleSynergyOn = function (key) {
    for (const s of SALE_SYNERGIES) {
      if (saleHasFamily(this.saleWeapons, s.a) && saleHasFamily(this.saleWeapons, s.b) && s[key]) return s[key];
    }
    return null;
  };

  Game.prototype.getActiveSaleSynergies = function () {
    const out = [];
    for (const s of SALE_SYNERGIES) {
      if (saleHasFamily(this.saleWeapons, s.a) && saleHasFamily(this.saleWeapons, s.b)) out.push(s);
    }
    return out;
  };

  /** Баннер при первой активации синергии в забеге */
  Game.prototype.tickSaleSynergyAnnounce = function () {
    this._saleSynSeen = this._saleSynSeen || {};
    for (const s of this.getActiveSaleSynergies()) {
      const key = s.a + '+' + s.b;
      if (this._saleSynSeen[key]) continue;
      this._saleSynSeen[key] = true;
      this.showEventBanner('🔗 Синергия: ' + s.label, 2.0);
      break;
    }
  };

  Game.prototype.saleMaxWeaponSlots = function () {
    const c = this.saleContract;
    if (c && c.maxWeapons) return c.maxWeapons;
    return SALE_MAX_WEAPONS;
  };

  Game.prototype.saleDmgMul = function () {
    const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
    const over = (this.saleOverflow && this.saleOverflow.power) || 0;
    return (1 + (this.salePassives.might || 0) * 0.12 + (this.salePassives.discount || 0) * 0.1 + over * 0.08)
      * (this.saleWeaponDmgMul || 1)
      * (hero.dmgMul || 1);
  };
  Game.prototype.saleCdMul = function () {
    const haste = (this.salePassives.haste || 0) + (this.salePassives.charger || 0) + (this.salePassives.energy || 0);
    const over = (this.saleOverflow && this.saleOverflow.tempo) || 0;
    const floor = this.getSaleFloor();
    const floorCd = floor && floor.cdMul ? floor.cdMul : 1;
    return Math.max(0.35, (1 - haste * 0.08 - over * 0.06) * floorCd);
  };
  Game.prototype.saleAreaMul = function () {
    const over = (this.saleOverflow && this.saleOverflow.space) || 0;
    let m = 1 + ((this.salePassives.area || 0) + (this.salePassives.gloves || 0) + (this.salePassives.map || 0)) * 0.1 + over * 0.08;
    const orb = this.saleSynergyOn('orbitBonus');
    if (orb) m += orb;
    return m;
  };
  Game.prototype.saleMagnetRange = function () {
    const mag = (this.salePassives.magnet || 0)
      + (this.salePassives.radio || 0)
      + (this.salePassives.headlamp || 0)
      + (this.salePassives.magnet_pass || 0);
    const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
    const floor = this.getSaleFloor();
    let bonus = 70 + mag * 36 + (this.salePassives.magnet_pass || 0) * 8
      + (this.metaPerks.magnet || 0) * 20 + (hero.magnetBonus || 0)
      + (floor && floor.magnetBonus ? floor.magnetBonus : 0);
    if (this.saleWeapons && this.saleWeapons.vip) bonus += 50;
    return bonus;
  };

  /** Бонус орбит от чекового аппарата / ленты */
  Game.prototype.saleOrbitBonus = function () {
    return (this.salePassives.printer || 0) + (this.salePassives.ribbon || 0);
  };
  Game.prototype.saleXpMul = function () {
    const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
    return (1 + (this.salePassives.badge || 0) * 0.12) * (hero.xpMul || 1);
  };
  Game.prototype.saleAuraDmgMul = function () {
    return 1 + (this.salePassives.headphones || 0) * 0.15;
  };
  Game.prototype.saleProjectileBonus = function () {
    return Math.floor(((this.salePassives.pouch || 0) + 1) / 2);
  };

  Game.prototype.spawnSaleEnemy = function (forcedType) {
    if (this.enemies.filter((e) => e.hp > 0).length >= SALE_MAX_ENEMIES) return null;
    const margin = 80;
    const side = randi(0, 3);
    let x, y;
    // спавн за краем камеры / у границ мира
    const cam = this.camera;
    const vw = this.viewW();
    const vh = this.viewH();
    if (side === 0) { x = rand(cam.x - 40, cam.x + vw + 40); y = cam.y - margin; }
    else if (side === 1) { x = cam.x + vw + margin; y = rand(cam.y - 40, cam.y + vh + 40); }
    else if (side === 2) { x = rand(cam.x - 40, cam.x + vw + 40); y = cam.y + vh + margin; }
    else { x = cam.x - margin; y = rand(cam.y - 40, cam.y + vh + 40); }
    x = Math.max(margin, Math.min(this.worldW - margin, x));
    y = Math.max(margin, Math.min(this.worldH - margin, y));

    let type = forcedType || saleEnemyType(this.saleTime);
    if (!forcedType && this.saleForceTypes && this.saleForceTypes.length) {
      type = this.saleForceTypes[randi(0, this.saleForceTypes.length - 1)];
    }
    const wave = saleEnemyWaveApprox(this.saleTime);
    const e = new Enemy(x, y, type, wave);
    const warm = saleWarmMul(this.saleTime);
    if (warm < 0.999) {
      e.maxHp = Math.max(1, Math.round(e.maxHp * warm));
      e.hp = e.maxHp;
    }
    // в распродаже все агрессивны
    this.enemies.push(e);
    return e;
  };

  Game.prototype.spawnSaleEnemyNear = function (x, y, type, opts) {
    opts = opts || {};
    if (this.enemies.filter((e) => e.hp > 0).length >= SALE_MAX_ENEMIES + (opts.overCap || 0)) return null;
    const wave = saleEnemyWaveApprox(this.saleTime);
    const e = new Enemy(x, y, type || 'normal', wave);
    if (opts.nameTag) e.nameTag = opts.nameTag;
    if (opts.hp) { e.hp = e.maxHp = opts.hp; }
    if (opts.hpMul) { e.maxHp = Math.max(1, Math.round(e.maxHp * opts.hpMul)); e.hp = e.maxHp; }
    if (!opts.hp && !opts.hpMul) {
      const warm = saleWarmMul(this.saleTime);
      if (warm < 0.999) {
        e.maxHp = Math.max(1, Math.round(e.maxHp * warm));
        e.hp = e.maxHp;
      }
    }
    if (opts.xpReward) e.xpReward = opts.xpReward;
    if (opts.vip) e._saleVip = true;
    this.enemies.push(e);
    return e;
  };

  Game.prototype.spawnSaleBoss = function (bossId, opts) {
    opts = opts || {};
    const def = SALE_BOSS_DEFS[bossId];
    if (!def) return null;
    const p = this.player;
    const ang = rand(0, Math.PI * 2);
    const distSpawn = opts.near ? 180 : 320;
    let x = (p ? p.x : this.worldW / 2) + Math.cos(ang) * distSpawn;
    let y = (p ? p.y : this.worldH / 2) + Math.sin(ang) * distSpawn;
    x = Math.max(60, Math.min(this.worldW - 60, x));
    y = Math.max(60, Math.min(this.worldH - 60, y));
    const e = this.spawnSaleEnemyNear(x, y, 'boss', {
      overCap: 4,
      nameTag: def.name,
      hp: def.hp,
      xpReward: def.xpReward,
    });
    if (!e) return null;
    e.saleBossId = def.id;
    e.speed = def.speed;
    e.r = def.r;
    e.coinDrop = def.coinDrop;
    e.slashTimer = 9999; // отключаем дефолтный slash админа
    e.bossPhase = 1;
    e._saleBossCd = 1.2;
    e._saleBossCd2 = 2.8;
    e._saleBossCd3 = 3.6;
    e._saleChargeT = 0;
    e._saleChargeAng = 0;
    e.hueRotate = def.id === 'discount_king' ? 35
      : def.id === 'security_chief' ? 200
      : def.id === 'promo_witch' ? 280
      : def.id === 'cart_horde' ? 260
      : def.id === 'floor_manager' ? 0
      : 15;
    e._saleFinalBoss = !!def.final;
    this.saleBossSpawned = this.saleBossSpawned || {};
    this.saleBossSpawned[def.id] = true;
    const n = Math.min(SALE_BOSS_ORDER.length, (this.saleBossIdx || 0) + 1);
    this._eventBanner = {
      t: 4.2,
      text: (def.final ? '⚠ ФИНАЛ: ' : '⚠ ') + def.name.toUpperCase() + '!',
      sub: def.tag + ' · босс ' + n + '/' + SALE_BOSS_ORDER.length,
    };
    this.spawnAnimFx('afx_darkburst', e.x, e.y, { life: 0.75, scale: 1.6, scaleEnd: 2.2 });
    this.spawnAnimFx('afx_ring', e.x, e.y, { life: 0.5, scale: 1.0, scaleEnd: 3.0 });
    if (typeof sfx !== 'undefined' && sfx.alarm) sfx.alarm();
    return e;
  };

  Game.prototype.saleBossAlive = function () {
    return (this.enemies || []).some((e) => e.hp > 0 && e.saleBossId);
  };

  /** LN-директор боссов: один за раз, интервал 180с, после килла — gap. */
  Game.prototype.tickSaleBossSchedule = function () {
    if (this.saleBossIdx == null) this.saleBossIdx = 0;
    if (this.saleBossT == null) this.saleBossT = SALE_BOSS_INTERVAL;
    if (this.saleBossIdx >= SALE_BOSS_ORDER.length) return;
    if (this.saleBossAlive()) return;
    if ((this.saleTime || 0) < this.saleBossT) return;
    const id = SALE_BOSS_ORDER[this.saleBossIdx];
    const b = this.spawnSaleBoss(id);
    if (!b) return;
    this.saleBossIdx++;
    this.saleBossT = (this.saleTime || 0) + SALE_BOSS_INTERVAL;
  };

  Game.prototype.applySaleBossDrop = function (bossId, x, y) {
    const drop = SALE_BOSS_DROP[bossId];
    if (!drop) return;
    const p = this.player;
    if (drop.kind === 'overflow') {
      this.saleOverflow = this.saleOverflow || {};
      this.saleOverflow[drop.id] = (this.saleOverflow[drop.id] || 0) + 1;
    } else if (drop.kind === 'powerup') {
      this.spawnSalePowerup(x, y - 28, drop.id);
    } else if (drop.kind === 'weapon_unlock') {
      this.saleRunUnlocks = this.saleRunUnlocks || [];
      if (!this.saleRunUnlocks.includes(drop.id)) this.saleRunUnlocks.push(drop.id);
    } else if (drop.kind === 'buff' && drop.id === 'walls') {
      this.obstacles = this.obstacles || [];
      this.saleTempWalls = this.saleTempWalls || [];
      if (p) {
        for (let i = 0; i < 2; i++) {
          const a = (p.angle || 0) + (i === 0 ? Math.PI / 2 : -Math.PI / 2);
          const o = {
            x: p.x + Math.cos(a) * 70 - 40, y: p.y + Math.sin(a) * 70 - 12,
            w: 80, h: 24, _saleTemp: true, _saleBossWall: true, life: 8,
          };
          this.obstacles.push(o); this.saleTempWalls.push(o);
        }
      }
    } else if (drop.kind === 'buff' && drop.id === 'puddles' && p) {
      this.salePuddles = this.salePuddles || [];
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 2 * i) / 4;
        this.salePuddles.push({
          x: p.x + Math.cos(a) * 70, y: p.y + Math.sin(a) * 70,
          r: 32, life: 5, dmg: 1, tick: 0, color: '#c026d3', slow: 0.5, poison: true,
        });
      }
    } else if (drop.kind === 'heal_max' && p) {
      p.maxHp += 1;
      p.hp = Math.min(p.maxHp, p.hp + 1);
    }
    this.showEventBanner('🎁 Босс: ' + drop.label, 2.0);
  };

  Game.prototype.onSaleBossKilled = function (enemy) {
    // LN kill-kit: хил + магнит + хлопушка (+ посылка уже в dropSalePowerup)
    if (this.player && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }
    this.spawnSalePowerup(enemy.x, enemy.y - 18, 'bomb');
    if (enemy.saleBossId) this.applySaleBossDrop(enemy.saleBossId, enemy.x, enemy.y);
    // не стакать следующего босса сразу после долгого боя
    const now = this.saleTime || 0;
    this.saleBossT = Math.max(this.saleBossT || 0, now + SALE_BOSS_GAP_AFTER_KILL);
    if (enemy._saleFinalBoss || enemy.saleBossId === 'mall_closing') {
      this.saleArenaShrink = 0;
      // финал ночи ТЦ — победа сразу после килла (не ждать таймер 20:00)
      this.showEventBanner('🏆 ТЦ СДАЛСЯ! Закрытие отменено', 2.5);
      setTimeout(() => {
        if (!this.gameOver && !this.won && this.gameMode === 'sale') this.endSaleGame(true);
      }, 900);
    }
  };

  /** LN-пакеты: конечная угроза, не вечный тип. */
  Game.prototype.doSaleWave = function (t) {
    const p = this.player;
    if (!p) return;
    const opts = ['crowd'];
    if (t > 45) opts.push('ring_fast');
    if (t > 70) opts.push('queue');
    if (t > 95) opts.push('fatty');
    if (t > 120) opts.push('managers');
    if (t > 150) opts.push('tanks');
    if (t > 185) opts.push('directors');
    if (t > 220) opts.push('mixed_horde');
    // не повторять ту же волну подряд
    let kind = opts[randi(0, opts.length - 1)];
    if (opts.length > 1 && kind === this.saleLastWaveKind) {
      kind = opts[randi(0, opts.length - 1)];
    }
    this.saleLastWaveKind = kind;

    const ring = (type, n, extra) => {
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const R = 220 + (i % 3) * 18;
        this.spawnSaleEnemyNear(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, type, Object.assign({ overCap: 16 }, extra || {}));
      }
    };
    const labels = {
      crowd: 'ТОЛПА',
      ring_fast: 'КОЛЬЦО БЫСТРЫХ',
      queue: 'ОЧЕРЕДЬ',
      fatty: 'ЖИРНЫЕ ПАКЕТЫ',
      managers: 'МЕНЕДЖЕРЫ',
      tanks: 'ОХРАНА ЗАЛА',
      directors: 'ДИРЕКТОРА',
      mixed_horde: 'ЧЁРНАЯ ПЯТНИЦА',
    };

    switch (kind) {
      case 'crowd':
        for (let i = 0; i < randi(9, 14); i++) this.spawnSaleEnemy('normal');
        break;
      case 'ring_fast':
        ring('fast', 16, { nameTag: 'Спринтер' });
        break;
      case 'queue':
        for (let i = 0; i < randi(7, 11); i++) this.spawnSaleEnemy('queue');
        break;
      case 'fatty':
        for (let i = 0; i < randi(5, 8); i++) this.spawnSaleEnemy('fatty');
        break;
      case 'managers':
        for (let i = 0; i < randi(4, 6); i++) this.spawnSaleEnemy('manager');
        break;
      case 'tanks':
        for (let i = 0; i < randi(3, 5); i++) this.spawnSaleEnemy('tank');
        break;
      case 'directors':
        for (let i = 0; i < randi(1, 2); i++) {
          const e = this.spawnSaleEnemy('director');
          if (e) {
            e.maxHp = Math.max(1, Math.round(e.maxHp * 0.85));
            e.hp = e.maxHp;
            e.xpReward = Math.max(e.xpReward || 0, 10);
          }
        }
        break;
      case 'mixed_horde':
        for (let i = 0; i < 8; i++) this.spawnSaleEnemy(pick(['fast', 'queue', 'returner', 'normal']));
        for (let i = 0; i < 3; i++) this.spawnSaleEnemy(pick(['fatty', 'tank', 'manager']));
        break;
      default:
        for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
    }

    this.showEventBanner('🌊 ВОЛНА: ' + (labels[kind] || kind), 2.0);
    this.spawnAnimFx('afx_ring', p.x, p.y, { life: 0.45, scale: 1.2, scaleEnd: 3.5 });
  };

  Game.prototype.tickSaleElites = function (dt) {
    const t = this.saleTime || 0;
    if (t < SALE_ELITE_START) return;
    if (this.saleEliteT == null) this.saleEliteT = SALE_ELITE_START;
    this.saleEliteT -= dt;
    if (this.saleEliteT > 0) return;
    const eliteMul = (this.saleContract && this.saleContract.eliteMul) || 1;
    this.saleEliteT = SALE_ELITE_INTERVAL / Math.max(1, eliteMul);
    const n = (1 + Math.floor(t / 420)) * Math.max(1, Math.round(eliteMul));
    const pool = ['miniboss'];
    if (t > 200) pool.push('director');
    if (t > 300) pool.push('boss');
    for (let i = 0; i < n; i++) {
      const type = pool[randi(0, pool.length - 1)];
      const e = this.spawnSaleEnemy(type);
      if (!e) continue;
      e._saleElite = true;
      e.nameTag = (e.nameTag || 'Элита') + ' ★';
      e.maxHp = Math.max(1, Math.round(e.maxHp * 1.35));
      e.hp = e.maxHp;
      e.xpReward = Math.max(e.xpReward || 0, 12);
    }
    this.showEventBanner('⭐ Элита со склада…', 1.6);
  };

  /** LN-директор волн/элит (боссы — отдельно в tickSaleBossSchedule). */
  Game.prototype.tickSaleDirector = function (dt) {
    if (this.saleWaveT == null) this.saleWaveT = SALE_WAVE_FIRST;
    this.saleWaveT -= dt;
    if (this.saleWaveT <= 0) {
      this.saleWaveT = SALE_WAVE_INTERVAL;
      this.doSaleWave(this.saleTime || 0);
    }
    this.tickSaleElites(dt);
  };

  /** LN-стиль: телеграф рывка → рывок. */
  Game.prototype.saleBossTickCharge = function (enemy, dt, opts) {
    opts = opts || {};
    const p = this.player;
    if (enemy._saleChargeT > 0) {
      enemy._saleChargeT -= dt;
      if (enemy._saleChargeT <= 0) {
        const spd = opts.spd || 380;
        const slide = opts.slide != null ? opts.slide : 0.2;
        enemy.x += Math.cos(enemy._saleChargeAng) * spd * slide;
        enemy.y += Math.sin(enemy._saleChargeAng) * spd * slide;
        enemy.knockback.x = Math.cos(enemy._saleChargeAng) * spd * (opts.kb || 0.5);
        enemy.knockback.y = Math.sin(enemy._saleChargeAng) * spd * (opts.kb || 0.5);
        enemy.mobPose = 'attack';
        this.spawnAnimFx('afx_slash', enemy.x + Math.cos(enemy._saleChargeAng) * 40, enemy.y + Math.sin(enemy._saleChargeAng) * 40, {
          life: 0.32, scale: opts.fxScale || 1.2, rot: enemy._saleChargeAng + Math.PI / 2,
        });
        this.screenShake = Math.max(this.screenShake || 0, 0.2);
        return 'struck';
      }
      if (!opts.lockAim) {
        enemy._saleChargeAng = angleTo(enemy.x, enemy.y, p.x, p.y);
        enemy.angle = enemy._saleChargeAng;
      }
      return 'telegraph';
    }
    return null;
  };

  Game.prototype.saleBossStartCharge = function (enemy, warn, opts) {
    opts = opts || {};
    const p = this.player;
    enemy._saleChargeT = warn != null ? warn : 0.75;
    enemy._saleChargeAng = angleTo(enemy.x, enemy.y, p.x, p.y);
    enemy.angle = enemy._saleChargeAng;
    enemy._saleChargeOpts = opts;
  };

  /** Залп «жалоб» / ценников снарядами. */
  Game.prototype.saleBossVolley = function (enemy, n, opts) {
    opts = opts || {};
    const p = this.player;
    const base = angleTo(enemy.x, enemy.y, p.x, p.y);
    const spread = opts.spread != null ? opts.spread : 0.55;
    const fullRing = spread >= Math.PI * 1.8;
    this.projectiles = this.projectiles || [];
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? base
        : fullRing ? base + (Math.PI * 2 * i) / n
        : base + (i - (n - 1) / 2) * (spread / Math.max(1, n - 1));
      const pr = new Projectile(enemy.x, enemy.y, a, opts.speed || 260, null);
      pr.r = opts.r || 9;
      pr._saleBossShot = true;
      pr._saleBossKill = opts.killName || enemy.nameTag || 'Босс';
      this.projectiles.push(pr);
    }
    this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.28, scale: 0.5, scaleEnd: 1.4 });
  };

  function saleHexRgba(hex, a) {
    let h = String(hex || '#f59e0b').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return `rgba(245,158,11,${a})`;
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /** Кольцо телеграфов под игроком → взрыв (могилы LN). Цвет — от босса, не «кровавый» красный. */
  Game.prototype.saleBossGraveRing = function (cx, cy, count, opts) {
    opts = opts || {};
    this.saleBossHazards = this.saleBossHazards || [];
    // не заваливать экран телеграфами в конце забега
    const pending = this.saleBossHazards.filter((h) => h.kind === 'grave' && !h.boom).length;
    const room = Math.max(0, 5 - pending);
    count = Math.min(count, room);
    if (count <= 0) return;
    const col = opts.color || '#f59e0b';
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (opts.spin || 0);
      const rr = opts.radius != null ? opts.radius : (i === 0 && opts.underPlayer ? 0 : 90);
      const off = opts.underPlayer && i === 0 ? 0 : rr + rand(-12, 18);
      this.saleBossHazards.push({
        kind: 'grave',
        x: cx + Math.cos(a) * off,
        y: cy + Math.sin(a) * off,
        r: opts.r || 48,
        life: opts.warn || 1.15,
        warnMax: opts.warn || 1.15,
        boom: false,
        killName: opts.killName || 'Взрыв',
        color: col,
      });
    }
  };

  Game.prototype.saleBossLineOpts = function (enemy, extra) {
    const def = enemy && SALE_BOSS_DEFS[enemy.saleBossId];
    return Object.assign({
      color: (def && def.color) || '#f59e0b',
      soft: true,
    }, extra || {});
  };

  Game.prototype.saleBossHurtPlayer = function (fromX, fromY, killName) {
    const p = this.player;
    if (!p || p.invincible > 0 || p.dashTime > 0 || this.__god) return false;
    if (p.takeDamage(fromX, fromY)) {
      this.endSaleGame(false, killName || 'Босс');
      return true;
    }
    this.tookDamage = true;
    if (typeof sfx !== 'undefined' && sfx.hurt) sfx.hurt();
    this.vibrate && this.vibrate(40);
    return this.applySaleFragileExtra();
  };

  Game.prototype.tickSaleBossAI = function (enemy, dt) {
    if (!enemy || enemy.hp <= 0 || !enemy.saleBossId) return;
    const id = enemy.saleBossId;
    const p = this.player;
    if (!p) return;
    const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
    const prevPhase = enemy.bossPhase || 1;
    enemy.bossPhase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;
    const ph = enemy.bossPhase;
    enemy._saleBossCd = (enemy._saleBossCd || 0) - dt;
    enemy._saleBossCd2 = (enemy._saleBossCd2 || 0) - dt;
    enemy._saleBossCd3 = (enemy._saleBossCd3 || 0) - dt;

    // общий тик рывка (если активен)
    if (enemy._saleChargeT > 0) {
      this.saleBossTickCharge(enemy, dt, enemy._saleChargeOpts || {});
    }

    // смена фазы — разовый «spike» как в LN
    if (ph > prevPhase) {
      enemy._salePhaseSpike = true;
      this.spawnAnimFx('afx_darkburst', enemy.x, enemy.y, { life: 0.55, scale: 1.2, scaleEnd: 2.0 });
      this.screenShake = Math.max(this.screenShake || 0, 0.35);
      // фаза 3: бан одной роли оружия игрока на ~20с
      if (ph === 3) {
        const types = [];
        for (const wid of Object.keys(this.saleWeapons || {})) {
          if (!(this.saleWeapons[wid] > 0)) continue;
          const t = SALE_WEAPONS[wid] && SALE_WEAPONS[wid].type;
          if (t && !types.includes(t)) types.push(t);
        }
        if (types.length) {
          const ban = types[randi(0, types.length - 1)];
          this.saleRoleBan = { type: ban, t: SALE_ROLE_BAN_SEC };
          this.showEventBanner(`🚫 Босс банит роль: ${SALE_ROLE_LABEL[ban] || ban} (${SALE_ROLE_BAN_SEC}с)`, 2.2);
        }
      }
    }

    if (id === 'floor_manager') {
      // танк: рывок · линия-«выписка» · призыв · залп жалоб
      if (enemy._saleChargeT <= 0 && enemy._saleBossCd <= 0) {
        enemy._saleBossCd = Math.max(2.6, 4.8 - ph * 0.45);
        this.saleBossStartCharge(enemy, 0.7, { spd: 300 + ph * 35, slide: 0.16, kb: 0.5 });
        if (typeof SpeechBubble === 'function') {
          enemy.bubble = new SpeechBubble(enemy, pick(['Кто на смене?!', 'Отчёт на стол!', 'Опоздание!']));
        }
      }
      if (enemy._saleBossCd2 <= 0) {
        enemy._saleBossCd2 = Math.max(5, 7.5 - ph);
        const n = 1 + (ph > 1 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n + rand(0, 1);
          this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 70, enemy.y + Math.sin(a) * 70, 'manager', {
            nameTag: 'Подсмена', hpMul: 0.9, overCap: 4,
          });
        }
      }
      if (enemy._saleBossCd3 <= 0) {
        enemy._saleBossCd3 = Math.max(3.2, 5.5 - ph * 0.5);
        if (ph >= 2 && typeof this.spawnBossLineAttack === 'function') {
          this.spawnBossLineAttack(enemy, p, this.saleBossLineOpts(enemy, {
            lines: ph >= 3 ? 2 : 1, warn: 0.9, length: 420, halfW: 32,
          }));
        } else {
          this.saleBossVolley(enemy, 1 + ph, { speed: 240, spread: 0.7, killName: 'Жалоба' });
        }
      }
      if (enemy._salePhaseSpike && ph === 3) {
        enemy._salePhaseSpike = false;
        this.saleBossVolley(enemy, 8, { speed: 200, spread: Math.PI * 2, killName: 'Приказ' });
      }
    } else if (id === 'cart_horde') {
      // чардж · орда · кольцо-стампид телеграфов · тройной рывок в ярости
      if (enemy._saleChargeT <= 0 && enemy._saleBossCd <= 0) {
        enemy._saleBossCd = Math.max(2.2, 4.0 - ph * 0.4);
        this.saleBossStartCharge(enemy, 0.72, { spd: 400 + ph * 40, slide: 0.2, kb: 0.55, fxScale: 1.3 });
        if (typeof SpeechBubble === 'function') {
          enemy.bubble = new SpeechBubble(enemy, pick(['Тележки в проход!', 'Разгон!', 'Не стой!']));
        }
      }
      if (enemy._saleBossCd2 <= 0) {
        enemy._saleBossCd2 = Math.max(3.8, 6.2 - ph * 0.55);
        const n = 3 + ph;
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n;
          this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 85, enemy.y + Math.sin(a) * 85, i % 2 ? 'fast' : 'queue', {
            nameTag: 'Тележка', hpMul: 0.8, overCap: 8,
          });
        }
      }
      if (enemy._saleBossCd3 <= 0) {
        enemy._saleBossCd3 = Math.max(5.5, 8 - ph);
        // стампид: телеграфы вокруг игрока → взрывы «колёс»
        this.saleBossGraveRing(p.x, p.y, 1 + ph, {
          underPlayer: true, radius: 70, warn: 1.0, r: 42, killName: 'Тележка',
          color: SALE_BOSS_DEFS.cart_horde.color,
        });
      }
      if (enemy._salePhaseSpike && ph === 3) {
        enemy._salePhaseSpike = false;
        // тройной рывок-очередь
        enemy._saleMultiCharge = 3;
      }
      if (enemy._saleMultiCharge > 0 && enemy._saleChargeT <= 0) {
        enemy._saleMultiCharge--;
        this.saleBossStartCharge(enemy, 0.45, { spd: 480, slide: 0.22, kb: 0.6, lockAim: false });
      }
    } else if (id === 'discount_king') {
      // ценники · охотники · дождь ценников под игроком · веер снарядов
      if (enemy._saleBossCd <= 0) {
        enemy._saleBossCd = Math.max(1.3, 3.0 - ph * 0.4);
        this.saleBossHazards = this.saleBossHazards || [];
        for (let i = 0; i < 1 + ph; i++) {
          const a = rand(0, Math.PI * 2);
          const d = rand(40, 140);
          this.saleBossHazards.push({
            kind: 'pricetag', x: enemy.x + Math.cos(a) * d, y: enemy.y + Math.sin(a) * d,
            r: 22, life: 4.5, dmgCd: 0,
          });
        }
        if (typeof SpeechBubble === 'function') {
          enemy.bubble = new SpeechBubble(enemy, pick(['МИНУС СЕМЬДЕСЯТ!', 'Ценник не обманешь!', 'Только сегодня!']));
        }
      }
      if (enemy._saleBossCd2 <= 0) {
        enemy._saleBossCd2 = Math.max(3.8, 6.5 - ph);
        for (let i = 0; i < ph; i++) {
          const a = (Math.PI * 2 * i) / ph;
          this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 70, enemy.y + Math.sin(a) * 70, 'fast', {
            nameTag: 'Охотник за скидкой', hpMul: 0.85, overCap: 6,
          });
        }
      }
      if (enemy._saleBossCd3 <= 0) {
        enemy._saleBossCd3 = Math.max(3.5, 5.8 - ph * 0.5);
        if (ph >= 2) {
          this.saleBossGraveRing(p.x, p.y, ph, {
            underPlayer: true, radius: 55, warn: 1.05, r: 40, killName: 'Ценник',
            color: SALE_BOSS_DEFS.discount_king.color,
          });
        } else {
          this.saleBossVolley(enemy, 3, { speed: 280, spread: 0.9, killName: 'Ценник' });
        }
      }
      if (enemy._salePhaseSpike && ph === 3) {
        enemy._salePhaseSpike = false;
        this.saleBossVolley(enemy, 10, { speed: 220, spread: Math.PI * 2, killName: 'Распродажа' });
        this.saleBossGraveRing(p.x, p.y, 4, {
          radius: 100, warn: 1.05, r: 34, killName: '−90%',
          color: SALE_BOSS_DEFS.discount_king.color,
        });
      }
    } else if (id === 'security_chief') {
      // рывок · стены · крест линий · свисток-нова
      if (enemy._saleChargeT <= 0 && enemy._saleBossCd <= 0) {
        enemy._saleBossCd = Math.max(2.0, 4.2 - ph * 0.45);
        this.saleBossStartCharge(enemy, 0.85, { spd: 440 + ph * 40, slide: 0.22, kb: 0.55, fxScale: 1.35 });
        if (typeof SpeechBubble === 'function') {
          enemy.bubble = new SpeechBubble(enemy, pick(['СТОЯТЬ!', 'Охрана!', 'Проход закрыт!']));
        }
      }
      if (enemy._saleBossCd2 <= 0) {
        enemy._saleBossCd2 = Math.max(4.5, 7.5 - ph);
        const wallW = 110, wallH = 22;
        const a = angleTo(enemy.x, enemy.y, p.x, p.y) + Math.PI / 2;
        const mx = (enemy.x + p.x) / 2, my = (enemy.y + p.y) / 2;
        this.obstacles = this.obstacles || [];
        this.saleTempWalls = this.saleTempWalls || [];
        const mk = (x, y, w, h) => {
          const o = { x, y, w, h, _saleTemp: true, _saleBossWall: true, life: 6 };
          this.obstacles.push(o); this.saleTempWalls.push(o);
        };
        mk(mx - wallW / 2, my - wallH / 2, wallW, wallH);
        mk(mx - wallH / 2 + Math.cos(a) * 8, my - wallW / 2 + Math.sin(a) * 8, wallH, wallW);
      }
      if (enemy._saleBossCd3 <= 0) {
        enemy._saleBossCd3 = Math.max(4.0, 6.5 - ph * 0.5);
        if (typeof this.spawnBossLineAttack === 'function') {
          this.spawnBossLineAttack(enemy, p, this.saleBossLineOpts(enemy, {
            lines: ph >= 3 ? 2 : 2, warn: 1.0, length: 500, halfW: 34,
          }));
        }
      }
      if (enemy._salePhaseSpike && ph >= 2) {
        enemy._salePhaseSpike = false;
        // свисток: кольцо отталкивания
        this.saleRings = this.saleRings || [];
        this.saleRings.push({
          x: enemy.x, y: enemy.y, r: 20, maxR: 200 + ph * 40, dmg: 1, hit: new Set(),
          knock: 280, ico: '🚨', visual: 'siren',
        });
        this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.5, scale: 0.8, scaleEnd: 2.8, tint: '#38bdf8' });
      }
    } else if (id === 'promo_witch') {
      // лужи · проклятие · болты · телепорт · кольцо яда на фазе 3
      if (enemy._saleBossCd <= 0) {
        enemy._saleBossCd = Math.max(1.5, 3.2 - ph * 0.35);
        this.salePuddles = this.salePuddles || [];
        for (let i = 0; i < 1 + ph; i++) {
          const a = rand(0, Math.PI * 2);
          const d = rand(50, 160);
          this.salePuddles.push({
            x: enemy.x + Math.cos(a) * d, y: enemy.y + Math.sin(a) * d,
            r: 28 + ph * 4, life: 5.5, dmg: 1, tick: 0, color: '#c026d3', slow: 0.5, poison: true,
          });
        }
        if (typeof SpeechBubble === 'function') {
          enemy.bubble = new SpeechBubble(enemy, pick(['АКЦИЯ НАВСЕГДА!', 'Промо-проклятие!', 'Ценник живой!']));
        }
      }
      if (enemy._saleBossCd2 <= 0) {
        enemy._saleBossCd2 = Math.max(4.2, 6.8 - ph);
        this.salePuddles = this.salePuddles || [];
        this.salePuddles.push({
          x: p.x, y: p.y, r: 36, life: 3.2, dmg: 1, tick: 0, color: '#a21caf', slow: 0.45, poison: true,
        });
        this.spawnAnimFx('afx_darkburst', p.x, p.y, { life: 0.45, scale: 0.9, scaleEnd: 1.4 });
        const n = 2 + (ph > 2 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n;
          this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 80, enemy.y + Math.sin(a) * 80, 'fast', {
            nameTag: 'Промо-фан', hpMul: 0.85, overCap: 6,
          });
        }
      }
      if (enemy._saleBossCd3 <= 0) {
        enemy._saleBossCd3 = Math.max(3.5, 5.5 - ph * 0.4);
        this.saleBossVolley(enemy, 2 + ph, { speed: 230, spread: 1.1, killName: 'Проклятие' });
        // короткий телепорт как у LN maiden
        if (ph >= 2) {
          const a = rand(0, Math.PI * 2);
          const rr = 100 + rand(0, 80);
          this.spawnAnimFx('afx_darkburst', enemy.x, enemy.y, { life: 0.35, scale: 0.8, scaleEnd: 1.3 });
          enemy.x = Math.max(60, Math.min(this.worldW - 60, p.x + Math.cos(a) * rr));
          enemy.y = Math.max(60, Math.min(this.worldH - 60, p.y + Math.sin(a) * rr));
          this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.35, scale: 0.6, scaleEnd: 1.6, tint: '#e879f9' });
        }
      }
      if (enemy._salePhaseSpike && ph === 3) {
        enemy._salePhaseSpike = false;
        this.saleBossGraveRing(enemy.x, enemy.y, 5, {
          radius: 110, warn: 1.15, r: 36, killName: 'АКЦИЯ',
          color: SALE_BOSS_DEFS.promo_witch.color,
        });
      }
    } else if (id === 'mall_closing') {
      // сжатие · тьма · орда · линии директора · пожары · врата
      this.saleArenaShrink = Math.min(0.55, 0.12 + (1 - hpRatio) * 0.4);
      if (enemy._saleBossCd <= 0) {
        enemy._saleBossCd = Math.max(2.2, 4.6 - ph * 0.5);
        this.lightsOut = Math.max(this.lightsOut || 0, 2.4);
        if (typeof SpeechBubble === 'function') {
          enemy.bubble = new SpeechBubble(enemy, pick(['ТЦ ЗАКРЫВАЕТСЯ!', 'На выход!', 'Последний звонок!']));
        }
      }
      if (enemy._saleBossCd2 <= 0) {
        enemy._saleBossCd2 = Math.max(3.2, 6.0 - ph * 0.6);
        const n = 3 + ph;
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n + rand(-0.2, 0.2);
          this.spawnSaleEnemyNear(enemy.x + Math.cos(a) * 90, enemy.y + Math.sin(a) * 90, i % 2 ? 'returner' : 'queue', {
            overCap: 10,
          });
        }
      }
      if (enemy._saleBossCd3 <= 0) {
        enemy._saleBossCd3 = Math.max(3.8, 5.8 - ph * 0.4);
        if (typeof this.spawnBossLineAttack === 'function') {
          this.spawnBossLineAttack(enemy, p, this.saleBossLineOpts(enemy, {
            lines: ph >= 3 ? 2 : 1, warn: 1.1, length: 520, halfW: 36,
          }));
        }
        // пожары реже в фазе 3 — иначе экран весь в красном
        if (ph >= 2 && typeof this._saleSeedFirePuddles === 'function' && enemy._saleBossCd3 > 2.5) {
          this._saleSeedFirePuddles(ph >= 3 ? 1 : 2);
        }
      }
      if (!enemy._saleRingAcc) enemy._saleRingAcc = 0;
      enemy._saleRingAcc += dt;
      if (enemy._saleRingAcc >= 0.35) {
        enemy._saleRingAcc = 0;
        const shrink = this.saleArenaShrink || 0;
        const maxR = Math.min(this.worldW, this.worldH) * (0.48 - shrink * 0.25);
        const dx = p.x - this.worldW / 2;
        const dy = p.y - this.worldH / 2;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > maxR) {
          if (this.saleBossHurtPlayer(p.x + dx, p.y + dy, 'Закрытие ТЦ')) return;
        }
      }
      if (enemy._salePhaseSpike && ph === 3) {
        enemy._salePhaseSpike = false;
        this.saleBossGraveRing(p.x, p.y, 4, {
          radius: 120, warn: 1.25, r: 40, killName: 'CLOSED',
          color: SALE_BOSS_DEFS.mall_closing.color,
        });
        this.lightsOut = Math.max(this.lightsOut || 0, 3.2);
      }
    }
  };

  Game.prototype.tickSaleBossHazards = function (dt) {
    if (this.saleTempWalls && this.saleTempWalls.length) {
      for (const w of this.saleTempWalls) {
        if (w._saleBossWall && w.life != null) w.life -= dt;
      }
      const dead = this.saleTempWalls.filter((w) => w._saleBossWall && w.life != null && w.life <= 0);
      if (dead.length) {
        const kill = new Set(dead);
        this.saleTempWalls = this.saleTempWalls.filter((w) => !kill.has(w));
        this.obstacles = (this.obstacles || []).filter((o) => !kill.has(o));
      }
    }

    this.saleBossHazards = this.saleBossHazards || [];
    const p = this.player;
    for (const h of this.saleBossHazards) {
      if (h.kind === 'grave') {
        h.life -= dt;
        if (!h.boom && h.life <= 0) {
          h.boom = true;
          h.life = 0.28;
          const col = h.color || '#f59e0b';
          this.spawnAnimFx('afx_ring', h.x, h.y, {
            life: 0.35, scale: 0.55, scaleEnd: 1.35, tint: col, alpha: 0.75,
          });
          this.spawnParticles(h.x, h.y, 12, col, 140, 0.35);
          this.screenShake = Math.max(this.screenShake || 0, 0.18);
          if (p && dist(p.x, p.y, h.x, h.y) < p.r + h.r) {
            if (this.saleBossHurtPlayer(h.x, h.y, h.killName || 'Взрыв')) return true;
          }
        }
        continue;
      }

      h.life -= dt;
      if (h.dmgCd > 0) h.dmgCd -= dt;
      if (!p || h.life <= 0 || h.kind !== 'pricetag') continue;
      if (h.dmgCd > 0) continue;
      if (dist(p.x, p.y, h.x, h.y) < p.r + h.r - 4) {
        h.dmgCd = 0.7;
        if (this.saleBossHurtPlayer(h.x, h.y, 'Ценник')) return true;
      }
    }
    this.saleBossHazards = this.saleBossHazards.filter((h) => h.life > 0);
    return false;
  };

  Game.prototype.dropSaleXp = function (enemy) {
    let amount = enemy.xpReward || 1;
    if (enemy.saleBossId) amount = Math.max(amount, 20);
    if (enemy.type === 'boss' || enemy.type === 'director') amount = Math.max(amount, 8);
    if (enemy.type === 'fatty') amount = Math.max(amount, 4);
    const n = amount <= 2 ? 1 : amount <= 5 ? 2 : 3;
    const per = Math.ceil(amount / n);
    for (let i = 0; i < n; i++) {
      this.xpGems.push({
        x: enemy.x + rand(-18, 18),
        y: enemy.y + rand(-18, 18),
        value: per,
        r: 7 + Math.min(6, per),
        life: 25,
        vx: rand(-40, 40),
        vy: rand(-40, 40),
      });
    }
  };

  Game.prototype.spawnSalePowerup = function (x, y, kind) {
    const def = SALE_POWERUPS[kind];
    if (!def) return;
    this.salePowerups = this.salePowerups || [];
    this.salePowerups.push({
      kind,
      x: Math.max(40, Math.min(this.worldW - 40, x)),
      y: Math.max(40, Math.min(this.worldH - 40, y)),
      r: 16,
      life: 25,
      vx: rand(-50, 50),
      vy: rand(-70, -20),
    });
  };

  Game.prototype.dropSalePowerup = function (enemy) {
    if (enemy.saleBossId) {
      // уникальный босс ТЦ — гарантированная посылка + магнит (+ bomb/heal в onSaleBossKilled)
      this.spawnSalePowerup(enemy.x - 22, enemy.y, 'chest');
      this.spawnSalePowerup(enemy.x + 22, enemy.y, 'magnet');
      this.spawnSalePowerup(enemy.x, enemy.y - 26, 'heart');
      return;
    }
    if (enemy._saleElite) {
      this.spawnSalePowerup(enemy.x, enemy.y, 'chest');
      if (Math.random() < 0.55) this.spawnSalePowerup(enemy.x + rand(-16, 16), enemy.y - 18, 'heart');
      return;
    }
    const elite = enemy.type === 'boss' || enemy.type === 'director' || enemy.type === 'miniboss';
    if (!elite) return;
    if (Math.random() > 0.55) return;
    const r = Math.random();
    const kind = r < 0.45 ? 'bomb' : r < 0.8 ? 'magnet' : 'chest';
    this.spawnSalePowerup(enemy.x, enemy.y, kind);
  };

  /** LN-style: хил с мобов; чаще при низком HP / с аптечкой (у LN ~0.2%, у нас щедрее — HP мало). */
  Game.prototype.dropSaleHeart = function (enemy) {
    if (!enemy || enemy.saleBossId || enemy._saleElite) return; // уже в dropSalePowerup
    const p = this.player;
    if (!p) return;
    let chance = 0.03;
    if (p.hp < p.maxHp) chance = 0.08;
    if (p.hp <= Math.max(1, Math.ceil(p.maxHp * 0.4))) chance = 0.13;
    if (p.hp >= p.maxHp) chance *= 0.2; // почти не мусорим пол при фулл HP
    const med = this.salePassives.medkit || this.salePassives.regen || 0;
    chance += med * 0.02;
    if (enemy.type === 'fatty' || enemy.type === 'tank') chance += 0.04;
    if (enemy.type === 'miniboss' || enemy.type === 'director') chance += 0.12;
    if (Math.random() >= chance) return;
    this.spawnSalePowerup(enemy.x + rand(-12, 12), enemy.y + rand(-12, 12), 'heart');
  };

  Game.prototype.pickSaleEvoKeyDrop = function () {
    const opts = [];
    for (const ev of SALE_EVOLUTIONS) {
      const fromMax = SALE_WEAPONS[ev.from]?.max || 5;
      if ((this.saleWeapons[ev.from] || 0) < fromMax) continue;
      if (this.saleWeapons[ev.into]) continue;
      if (!ev.needPassive) continue;
      if ((this.salePassives[ev.needPassive] || 0) > 0) continue;
      if (!SALE_PASSIVES[ev.needPassive]) continue;
      opts.push(ev.needPassive);
    }
    if (!opts.length) return null;
    return opts[randi(0, opts.length - 1)];
  };

  Game.prototype.applySalePowerup = function (pu) {
    const p = this.player;
    if (pu.kind === 'chest') {
      // редко: ключ эво вместо/вместе с апгрейдом
      if (Math.random() < 0.28) {
        const key = this.pickSaleEvoKeyDrop();
        if (key && SALE_PASSIVES[key]) {
          this.salePassives[key] = (this.salePassives[key] || 0) + 1;
          this.applySalePassivesToPlayer();
          this.showEventBanner(`📦 В посылке ключ: ${SALE_PASSIVES[key].name}!`, 2.0);
          this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.65, scale: 0.9, scaleEnd: 1.3 });
          sfx.level();
          return;
        }
      }
      this.pendingUpgrades = (this.pendingUpgrades || 0) + 1;
      this.showEventBanner('📦 Посылка со склада: бесплатное улучшение!', 1.8);
      this.spawnAnimFx('afx_levelup', p.x, p.y, { life: 0.65, scale: 0.9, scaleEnd: 1.3 });
      sfx.level();
      this.openSaleUpgradeUI();
    } else if (pu.kind === 'magnet') {
      this.saleVacuumT = 1.8;
      this.showEventBanner('🧲 Промо-магнит: весь XP летит к тебе!', 1.5);
      sfx.pickup();
    } else if (pu.kind === 'bomb') {
      const R = 540;
      this.showEventBanner('🧨 Хлопушка: зал зачищен!', 1.5);
      this.screenShake = Math.max(this.screenShake, 0.6);
      this.boomFx = this.boomFx || [];
      this.boomFx.push({ x: p.x, y: p.y, life: 0.45, max: 0.45 });
      this.spawnAnimFx('afx_bigburst', p.x, p.y, { life: 0.6, scale: 2.4, scaleEnd: 3.6 });
      this.spawnAnimFx('afx_ring', p.x, p.y, { life: 0.5, scale: 1.5, scaleEnd: 5.5 });
      this.spawnParticles(p.x, p.y, 60, '#ff6b00', 480, 0.9);
      this.vibrate([50, 40, 70]);
      sfx.hurt();
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (dist(p.x, p.y, e.x, e.y) > R) continue;
        const dmg = e.saleBossId ? 12 : (e.type === 'boss' || e.type === 'director' || e.type === 'miniboss') ? 20 : 999;
        this.saleHitEnemy(e, dmg, p.x, p.y, 300, { impact: 'sp_fwave2', color: '#ff6b00' });
      }
    } else if (pu.kind === 'heart') {
      const before = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.spawnAnimFx('afx_heal', p.x, p.y - 10, { life: 0.45, scale: 0.75, vy: -18 });
      this.spawnParticles(p.x, p.y, 10, '#e11d48', 100, 0.35);
      sfx.pickup();
      if (p.hp > before) {
        this.showEventBanner('❤️ +1 HP', 1.1);
      }
    }
  };

  Game.prototype.updateSalePowerups = function (dt) {
    const p = this.player;
    this.salePowerups = this.salePowerups || [];
    for (const pu of this.salePowerups) {
      pu.life -= dt;
      pu.x += (pu.vx || 0) * dt;
      pu.y += (pu.vy || 0) * dt;
      pu.vx *= 0.9;
      pu.vy *= 0.9;
      if (!p) continue;
      const d = dist(p.x, p.y, pu.x, pu.y);
      // лёгкий магнит на пауэрапы
      if (d < 110) {
        const a = angleTo(pu.x, pu.y, p.x, p.y);
        const pull = (110 - d) * 4 * dt;
        pu.x += Math.cos(a) * pull;
        pu.y += Math.sin(a) * pull;
      }
      if (d < p.r + pu.r) {
        pu.dead = true;
        this.applySalePowerup(pu);
      }
    }
    this.salePowerups = this.salePowerups.filter((pu) => !pu.dead && pu.life > 0);
  };

  Game.prototype.pushSaleDmgNum = function (x, y, dmg) {
    if (this.showDmgNumbers === false) return;
    this.saleDmgNums = this.saleDmgNums || [];
    if (this.saleDmgNums.length > 48) this.saleDmgNums.shift();
    this.saleDmgNums.push({
      x: x + rand(-6, 6),
      y,
      txt: String(dmg),
      big: dmg >= 5,
      life: 0.65,
      max: 0.65,
      vy: -52,
    });
  };

  Game.prototype.onSaleEnemyKilled = function (enemy) {
    this.recordKill(enemy.type);
    this.score++;
    this.waveKills++;
    this.dropSaleXp(enemy);
    this.dropSalePowerup(enemy);
    this.dropSaleHeart(enemy);
    if (enemy.saleBossId) {
      this.spawnAnimFx('afx_darkburst', enemy.x, enemy.y, { life: 0.9, scale: 2.0, scaleEnd: 2.8 });
      this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.6, scale: 1.4, scaleEnd: 4.5 });
      this.onSaleBossKilled(enemy);
    }
    this.spawnSpriteFx(Math.random() < 0.55 ? 'fx_blood' : 'fx_hit_blood', enemy.x, enemy.y, {
      scale: enemy.saleBossId ? 1.1 : enemy.type === 'fatty' ? 0.85 : 0.55,
      scaleEnd: enemy.saleBossId ? 1.5 : enemy.type === 'fatty' ? 1.2 : 0.9,
      life: 0.3,
      vy: -12,
    });
    if (enemy.type === 'fatty' || enemy.explodes) {
      this.spawnSpriteFx('fx_skull', enemy.x, enemy.y - 8, { scale: 0.75, life: 0.4, vy: -35 });
    }
    // монеты реже
    if (Math.random() < 0.22 || enemy.saleBossId || enemy._saleElite) this.dropCoins(enemy);
  };

  Game.prototype.gainSaleXp = function (amount) {
    const mul = (this.saleXpMul() || 1) * (this.saleXpEventMul || 1);
    this.saleXp += Math.max(0, amount * mul);
    let leveled = 0;
    while (this.saleXp >= this.saleXpNext) {
      this.saleXp -= this.saleXpNext;
      this.saleLevel++;
      this.saleXpNext = saleXpToNext(this.saleLevel);
      leveled++;
      this.player.fillSkill(0.15);
    }
    if (leveled) {
      this.pendingUpgrades += leveled;
      this.openSaleUpgradeUI();
      sfx.level();
      this.spawnAnimFx('afx_levelup', this.player.x, this.player.y, {
        life: 0.7, scale: 1.1, scaleEnd: 1.5,
      });
      this.spawnParticles(this.player.x, this.player.y, 22, '#f1c40f', 200, 0.55);
    }
  };

  Game.prototype.migrateSaleWeaponId = function (id) {
    return SALE_WEAPON_MIGRATE[id] || id;
  };

  /** Оружие в пуле: хаб = ранний ассортимент; этаж ТЦ; после 6 мин / 12 ур. — весь зал. */
  Game.prototype.saleWeaponInCatalog = function (id) {
    id = this.migrateSaleWeaponId(id);
    const def = SALE_WEAPONS[id];
    if (!def || def.evolved) return false;
    const banTypes = (this.saleContract && this.saleContract.banTypes) || [];
    if (banTypes.includes(def.type)) return false;
    if (id === 'receipt') return true;
    const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
    if (hero.starterWeapon === id) return true;
    const floor = this.getSaleFloor();
    if (floor && floor.weapons && floor.weapons.includes(id)) return true;
    if ((this.saleRunUnlocks || []).includes(id)) return true;
    const unlocked = (this.saleUnlockedWeapons || ['receipt']).map((x) => this.migrateSaleWeaponId(x));
    if (unlocked.includes(id)) return true;
    if ((this.saleTime || 0) >= SALE_CATALOG_OPEN_SEC || (this.saleLevel || 0) >= SALE_CATALOG_OPEN_LV) {
      return true;
    }
    return false;
  };

  Game.prototype.buildSaleUpgradeChoices = function () {
    const candidates = [];
    // слот занимает любое оружие, включая эволюции (evo заменяет базу, слот тот же)
    const slotCount = Object.keys(this.saleWeapons).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
    const ownedP = Object.keys(this.salePassives).filter((id) => (this.salePassives[id] || 0) > 0);
    const canNewWeapon = slotCount < this.saleMaxWeaponSlots();
    const banned = this.saleBanned || {};
    this.saleOverflow = this.saleOverflow || {};
    this.saleWeaponOver = this.saleWeaponOver || {};

    for (const def of Object.values(SALE_WEAPONS)) {
      if (def.evolved) continue;
      if (banned['w:' + def.id]) continue;
      const lv = this.saleWeapons[def.id] || 0;
      if (lv <= 0) {
        if (!canNewWeapon) continue;
        if (!this.saleWeaponInCatalog(def.id)) continue;
        const role = SALE_ROLE_LABEL[def.type] || def.type;
        candidates.push({
          kind: 'weapon_new', id: def.id, ico: def.ico,
          ttl: def.name, desc: `${def.desc} · ${role}`,
          weight: 2.2, role,
        });
      } else if (lv < def.max) {
        const role = SALE_ROLE_LABEL[def.type] || def.type;
        candidates.push({
          kind: 'weapon_up', id: def.id, ico: def.ico,
          ttl: `${def.name} ур.${lv + 1}`,
          desc: `Улучшить до ${lv + 1}/${def.max} · ${role}`,
          weight: 3, role,
        });
      } else {
        // поверх капа — мягкий оверлевел оружия
        const ov = this.saleWeaponOver[def.id] || 0;
        if (ov < 12) {
          candidates.push({
            kind: 'weapon_over', id: def.id, ico: def.ico,
            ttl: `${def.name} +${ov + 1}`, desc: '+7% урон этого оружия',
            weight: 1.6,
          });
        }
      }
    }
    // эволюции тоже можно «докрутить»
    for (const [wid, lv] of Object.entries(this.saleWeapons)) {
      const def = SALE_WEAPONS[wid];
      if (!def || !def.evolved || banned['w:' + wid]) continue;
      const ov = this.saleWeaponOver[wid] || 0;
      if (ov < 12) {
        candidates.push({
          kind: 'weapon_over', id: wid, ico: def.ico,
          ttl: `${def.name} +${ov + 1}`, desc: '+7% урон этого оружия',
          weight: 1.8,
        });
      }
    }

    const canNewPassive = ownedP.length < SALE_MAX_PASSIVES;
    const seenPassive = new Set();
    for (const def of Object.values(SALE_PASSIVES)) {
      if (seenPassive.has(def.id)) continue;
      seenPassive.add(def.id);
      if (banned['p:' + def.id]) continue;
      const lv = this.salePassives[def.id] || 0;
      if (lv <= 0 && !canNewPassive) continue;
      if (lv < def.max) {
        // ключ эво: если база уже на капе — чаще предлагаем пассивку, чтобы ветка открылась
        let weight = 2;
        for (const ev of SALE_EVOLUTIONS) {
          if (ev.needPassive !== def.id) continue;
          const fromMax = SALE_WEAPONS[ev.from]?.max || 5;
          if ((this.saleWeapons[ev.from] || 0) >= fromMax && !this.saleWeapons[ev.into]) {
            weight = 4.8;
            break;
          }
        }
        candidates.push({
          kind: 'passive', id: def.id, ico: def.ico,
          ttl: `${def.name} ур.${lv + 1}`, desc: def.desc,
          weight,
        });
      }
    }

    // оверфлоу-статы — всегда есть что взять до конца 20 мин
    for (const ov of SALE_OVERFLOW) {
      if (banned['o:' + ov.id]) continue;
      const lv = this.saleOverflow[ov.id] || 0;
      if (lv >= ov.max) continue;
      candidates.push({
        kind: 'overflow', id: ov.id, ico: ov.ico,
        ttl: `${ov.name} · ${lv + 1}`, desc: ov.desc,
        weight: 2.4,
      });
    }

    // эволюции — гарантированные слоты (как в LN)
    const guaranteed = [];
    for (const ev of SALE_EVOLUTIONS) {
      const haveFrom = (this.saleWeapons[ev.from] || 0) >= (SALE_WEAPONS[ev.from]?.max || 5);
      if (!haveFrom) continue;
      if (this.saleWeapons[ev.into]) continue;
      if (ev.needPassive && !(this.salePassives[ev.needPassive] > 0)) continue;
      if (ev.needWeapon && !(this.saleWeapons[ev.needWeapon] > 0)) continue;
      const into = SALE_WEAPONS[ev.into];
      const fromDef = SALE_WEAPONS[ev.from];
      const fromName = fromDef?.name || ev.from;
      const role = SALE_ROLE_LABEL[into.type] || into.type;
      const before = fromDef ? `${SALE_ROLE_LABEL[fromDef.type] || fromDef.type}` : '?';
      const after = `${role}`;
      const hint = ev.branchHint ? `${ev.branchHint} · ` : '';
      guaranteed.push({
        kind: 'evolve', id: ev.into, from: ev.from, ico: into.ico,
        ttl: ev.branch ? `✨ ${fromName} → ${ev.name}` : `✨ ${ev.name}`,
        desc: `${hint}${into.desc} · ${before} → ${after}`,
        branch: ev.branch || null,
        role,
      });
    }

    // две готовые ветки одной базы (сканер / карта) — только выбор ветки, без лишних карт
    const byFrom = {};
    for (const g of guaranteed) {
      (byFrom[g.from] = byFrom[g.from] || []).push(g);
    }
    const branchPick = Object.values(byFrom).find((arr) => arr.length >= 2);
    if (branchPick) {
      return branchPick.map((g) => ({
        ...g,
        ttl: `✨ Ветка «${g.branch || g.id}»: ${SALE_WEAPONS[g.id]?.name || g.id}`,
      }));
    }

    if (this.player.hp < this.player.maxHp) {
      candidates.push({ kind: 'heal', id: 'heal', ico: '❤️', ttl: 'Аптечка', desc: '+2 HP сейчас', weight: 1.2 });
    }

    const picked = [];
    const used = new Set();
    for (const g of guaranteed) {
      if (picked.length >= 3) break;
      picked.push(g);
      used.add(g.kind + ':' + g.id);
    }
    while (picked.length < 3 && candidates.length) {
      let total = 0;
      const avail = [];
      for (const c of candidates) {
        const key = c.kind + ':' + c.id;
        if (used.has(key)) continue;
        avail.push(c);
        total += c.weight || 1;
      }
      if (!avail.length || total <= 0) break;
      let r = Math.random() * total;
      let choice = avail[avail.length - 1];
      for (const c of avail) {
        r -= c.weight || 1;
        if (r <= 0) { choice = c; break; }
      }
      picked.push(choice);
      used.add(choice.kind + ':' + choice.id);
    }
    return picked;
  };

  Game.prototype.openSaleUpgradeUI = function () {
    this.choosingUpgrade = true;
    this.paused = true;
    if (this.upgradeRerollsLeft == null) this.upgradeRerollsLeft = 3;
    if (!this._saleKeepBanishMode) this._saleBanishMode = false;
    this.upgradeChoices = this.buildSaleUpgradeChoices();
    if (!this.upgradeChoices.length) {
      // LN noChoices: не сбрасываем уровни в пустоту
      const n = Math.max(1, this.pendingUpgrades | 0);
      if (this.player) {
        this.player.maxHp += Math.min(3, n);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.min(3, n));
      }
      this.choosingUpgrade = false;
      this.pendingUpgrades = 0;
      this.paused = false;
      this.updateUpgradeRerollBtn();
      this.showEventBanner(`❤️ Нечего брать — +${Math.min(3, n)} HP`, 1.6);
      return;
    }
    const wrap = document.getElementById('upgrade-cards');
    wrap.innerHTML = '';
    wrap.classList.toggle('banish-mode', !!this._saleBanishMode);
    const title = document.querySelector('#upgrade-overlay h2');
    const sub = document.getElementById('upgrade-sub') || document.querySelector('#upgrade-overlay p');
    const branchOnly = this.upgradeChoices.length >= 2
      && this.upgradeChoices.every((u) => u.kind === 'evolve' && u.branch);
    if (title) {
      title.textContent = branchOnly
        ? `✨ Выбери ветку эволюции`
        : `⬆ Уровень ${this.saleLevel}!`;
    }
    if (sub) {
      sub.textContent = this._saleBanishMode
        ? '🚫 Выбери карту, которую забанить до конца забега'
        : branchOnly
          ? 'Две ветки готовы — выбери одну (вторая станет недоступна)'
          : 'Оружие / пассивка / эволюция · можно перебросить выбор';
    }
    this.upgradeChoices.forEach((up, i) => {
      const el = document.createElement('button');
      el.className = 'card';
      el.type = 'button';
      el.innerHTML = `<div class="ico"></div><div class="ttl">${i + 1}. ${up.ttl}</div><div class="desc">${up.desc}</div>`;
      paintSaleChoiceIcon(el.querySelector('.ico'), up);
      el.onclick = () => (this._saleBanishMode ? this.banSaleUpgrade(i) : this.pickSaleUpgrade(i));
      wrap.appendChild(el);
    });
    document.getElementById('upgrade-overlay').classList.add('show');
    this.updateUpgradeRerollBtn();
    this.refreshMusicState();
    if (!this._saleRerolling && !this._saleKeepBanishMode) sfx.level();
  };

  Game.prototype.toggleSaleBanish = function () {
    if (!this.choosingUpgrade) return;
    if (!this._saleBanishMode && (this.saleBanishesLeft | 0) <= 0) { sfx.hurt(); return; }
    this._saleBanishMode = !this._saleBanishMode;
    sfx.click();
    // пересобираем UI, сохраняя режим бана
    this._saleKeepBanishMode = true;
    this._saleRerolling = true;
    this.openSaleUpgradeUI();
    this._saleRerolling = false;
    this._saleKeepBanishMode = false;
  };

  Game.prototype.banSaleUpgrade = function (i) {
    const up = this.upgradeChoices[i];
    if (!up) return;
    if (up.kind === 'evolve' || up.kind === 'heal') { sfx.hurt(); return; }
    if ((this.saleBanishesLeft | 0) <= 0) { sfx.hurt(); return; }
    this.saleBanned = this.saleBanned || {};
    const key = up.kind === 'passive' ? 'p:' + up.id
      : up.kind === 'overflow' ? 'o:' + up.id
      : 'w:' + up.id;
    this.saleBanned[key] = true;
    this.saleBanishesLeft -= 1;
    this._saleBanishMode = false;
    sfx.click();
    this.showEventBanner(`🚫 ${up.ttl} — забанено до конца забега`, 1.6);
    // пересобрать выбор без потраченного реролла
    this._saleRerolling = true;
    this.openSaleUpgradeUI();
    this._saleRerolling = false;
  };

  Game.prototype.skipSaleUpgrade = function () {
    if (!this.choosingUpgrade) return;
    sfx.click();
    document.getElementById('upgrade-overlay').classList.remove('show');
    this.choosingUpgrade = false;
    this._saleBanishMode = false;
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
    this.updateUpgradeRerollBtn();
    if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
    else {
      this.paused = false;
      this.refreshMusicState();
    }
  };

  Game.prototype.pickSaleUpgrade = function (i) {
    const up = this.upgradeChoices[i];
    if (!up) return;
    if (up.kind === 'weapon_new') {
      this.saleWeapons[up.id] = 1;
      this.saleWeaponCd[up.id] = 0.15;
    } else if (up.kind === 'weapon_up') {
      this.saleWeapons[up.id] = (this.saleWeapons[up.id] || 1) + 1;
    } else if (up.kind === 'evolve') {
      delete this.saleWeapons[up.from];
      this.saleWeapons[up.id] = 1;
      this.saleWeaponCd[up.id] = 0.1;
      this.spawnAnimFx('afx_levelup', this.player.x, this.player.y, { life: 0.9, scale: 1.6, scaleEnd: 2.4 });
      this.spawnAnimFx('afx_ring', this.player.x, this.player.y, { life: 0.55, scale: 1.2, scaleEnd: 3.2 });
      this.spawnParticles(this.player.x, this.player.y, 28, '#f1c40f', 240, 0.6);
      this.applySalePassivesToPlayer();
    } else if (up.kind === 'passive') {
      this.salePassives[up.id] = (this.salePassives[up.id] || 0) + 1;
      if (up.id === 'vitality' || up.id === 'mug') {
        this.player.maxHp += 1;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      }
      this.applySalePassivesToPlayer();
    } else if (up.kind === 'overflow') {
      this.saleOverflow = this.saleOverflow || {};
      this.saleOverflow[up.id] = (this.saleOverflow[up.id] || 0) + 1;
      if (up.id === 'vital') {
        this.player.maxHp += 1;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      }
      this.applySalePassivesToPlayer();
    } else if (up.kind === 'weapon_over') {
      this.saleWeaponOver = this.saleWeaponOver || {};
      this.saleWeaponOver[up.id] = (this.saleWeaponOver[up.id] || 0) + 1;
    } else if (up.kind === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
      this.spawnSpriteFx('fx_medkit', this.player.x, this.player.y - 20, { scale: 0.9, life: 0.45, vy: -30 });
      if (typeof drawSpell === 'function') {
        this.spawnSpriteFx('sp_heal2', this.player.x, this.player.y, { scale: 0.55, life: 0.4, vy: -10 });
      }
    }
    sfx.click();
    document.getElementById('upgrade-overlay').classList.remove('show');
    this.choosingUpgrade = false;
    this._saleBanishMode = false;
    this.updateUpgradeRerollBtn();
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
    if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
    else {
      this.paused = false;
      this.refreshMusicState();
    }
  };

  // расширяем управление кнопками апгрейда: бан + скип
  const _updateRerollBtn = Game.prototype.updateUpgradeRerollBtn;
  Game.prototype.updateUpgradeRerollBtn = function () {
    _updateRerollBtn.call(this);
    const banBtn = document.getElementById('btn-upgrade-banish');
    if (banBtn) {
      const left = this.saleBanishesLeft | 0;
      banBtn.textContent = this._saleBanishMode ? '🚫 Выбери карту…' : `🚫 Бан (${left})`;
      banBtn.disabled = (left <= 0 && !this._saleBanishMode) || !this.choosingUpgrade;
      banBtn.style.display = this.choosingUpgrade ? '' : 'none';
      banBtn.classList.toggle('active', !!this._saleBanishMode);
    }
    const skipBtn = document.getElementById('btn-upgrade-skip');
    if (skipBtn) skipBtn.style.display = this.choosingUpgrade ? '' : 'none';
  };

  Game.prototype.saleHitEnemy = function (e, dmg, srcX, srcY, knock, opts) {
    opts = opts || {};
    if (e._saleInvuln && this.saleInvulnExcept && e.type !== this.saleInvulnExcept) {
      this.spawnSpriteFx('fx_shield', e.x, e.y - 6, { scale: 0.35, life: 0.12, vy: -6 });
      return false;
    }
    if (opts.mark) e._saleMarked = Math.max(e._saleMarked || 0, opts.mark);
    if ((e._saleMarked || 0) > 0) {
      let markMul = 1.3;
      if (this.salePassives.sticker) markMul += this.salePassives.sticker * 0.12;
      if (this.saleSynergyOn('markAura') && opts.fromAura) markMul += 0.25;
      dmg = Math.max(1, Math.round(dmg * markMul));
    }
    const floor = this.getSaleFloor();
    if (floor && floor.knockMul && knock) knock *= floor.knockMul;
    const died = e.hit(dmg, srcX, srcY, knock || 140, opts.stun || 0);
    this.pushSaleDmgNum(e.x, e.y - e.r - 6, Math.min(dmg, e.maxHp || dmg));
    if (opts.confuse && !died) {
      e._saleConfuse = Math.max(e._saleConfuse || 0, opts.confuse);
    }
    if (opts.lifesteal && died && this.player.hp < this.player.maxHp) {
      // вампиризм только с убийства + общий КД — нельзя AFK-хилиться с ауры
      if ((this._saleLsCd || 0) <= 0 && Math.random() < opts.lifesteal) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this._saleLsCd = SALE_LIFESTEAL_CD;
        this.spawnAnimFx('afx_heal', this.player.x, this.player.y - 10, { life: 0.45, scale: 0.7, vy: -20 });
      }
    }
    if (died) {
      this.spawnParticles(e.x, e.y, 8, opts.color || '#e74c3c', 140, 0.35);
      if (opts.impact) this.spawnSpriteFx(opts.impact, e.x, e.y, { scale: 0.35, life: 0.28, vy: -8 });
      this.onSaleEnemyKilled(e);
      if (opts.explodeOnKill || this.saleWeapons.black_friday) {
        this.salePuddles.push({ x: e.x, y: e.y, r: 55, life: 2.5, dmg: 1, tick: 0, color: '#8e0000' });
        this.spawnSpriteFx('sp_bleed3', e.x, e.y, { scale: 0.4, life: 0.35, vy: 0 });
      }
    } else if (Math.random() < 0.35) {
      this.spawnAnimFx('afx_hit', e.x, e.y - 4, { life: 0.22, scale: 0.55, rot: rand(-0.4, 0.4) });
    }
    return died;
  };

  Game.prototype.nearestSaleEnemy = function (x, y, maxDist) {
    let best = null; let bd = maxDist || 1e9;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };

  Game.prototype.updateSaleWeapons = function (dt) {
    const p = this.player;
    const area = this.saleAreaMul();
    const dmgM = this.saleDmgMul();
    const cdM = this.saleCdMul();
    const projBonus = this.saleProjectileBonus();
    if (this._saleShieldT > 0) this._saleShieldT -= dt;
    if (this.saleRoleBan) {
      this.saleRoleBan.t -= dt;
      if (this.saleRoleBan.t <= 0) {
        this.showEventBanner('🔓 Бан роли снят', 1.2);
        this.saleRoleBan = null;
      }
    }
    for (const e of this.enemies) {
      if ((e._saleMarked || 0) > 0) e._saleMarked -= dt;
    }

    for (const [id, lv] of Object.entries(this.saleWeapons)) {
      const def = SALE_WEAPONS[id];
      if (!def) continue;
      if (this.saleRoleBan && def.type === this.saleRoleBan.type) continue;
      const banTypes = (this.saleContract && this.saleContract.banTypes) || [];
      if (banTypes.includes(def.type)) continue;
      const level = Math.min(def.max, Math.max(1, lv)) - 1;
      this.saleWeaponCd[id] = (this.saleWeaponCd[id] || 0) - dt;
      if (this.saleWeaponCd[id] > 0) continue;

      const overW = (this.saleWeaponOver && this.saleWeaponOver[id]) || 0;
      let dmg = Math.max(1, Math.round((def.dmg[level] || def.dmg[0] || 1) * dmgM * (1 + overW * 0.07)));
      if (def.type === 'aura') dmg = Math.max(1, Math.round(dmg * this.saleAuraDmgMul()));

      if (def.type === 'orbit') {
        const printLv = this.saleOrbitBonus();
        const need = (def.count[level] || def.count[0] || 1) + printLv;
        const radius = (def.radius[level] || def.radius[0] || 60) * area * (1 + printLv * 0.08);
        const spin = def.spin || 3;
        let list = this.saleOrbits.filter((o) => o.weaponId === id);
        while (list.length < need) {
          const o = {
            weaponId: id, ico: def.ico, visual: def.visual || id, angle: (Math.PI * 2 * list.length) / need,
            radius, dmg, spin, size: def.size || 1, trail: !!def.trail, explodeHit: !!def.explodeHit,
            hitAt: new Map(),
          };
          this.saleOrbits.push(o);
          list.push(o);
        }
        while (list.length > need) {
          const drop = list.pop();
          this.saleOrbits = this.saleOrbits.filter((o) => o !== drop);
        }
        for (const o of this.saleOrbits) {
          if (o.weaponId !== id) continue;
          o.radius = radius; o.dmg = dmg; o.spin = spin; o.ico = def.ico; o.size = def.size || 1;
          o.visual = def.visual || id; o.explodeHit = !!def.explodeHit;
        }
        this.saleWeaponCd[id] = 0.15;
        continue;
      }

      this.saleWeaponCd[id] = def.baseCd * cdM;

      if (def.type === 'beam') {
        const len = (def.length[level] || def.length[0] || 120) * area;
        this.saleBeams = this.saleBeams.filter((b) => b.weaponId !== id);
        this.saleBeams.push({
          weaponId: id,
          angle: this._saleBeamAng || p.angle || 0,
          length: len,
          width: (def.width || 28) * area,
          dmg,
          spin: def.spin || 0,
          aimNearest: !!def.aimNearest,
          turn: def.turn || 8,
          cone: def.cone || 0,
          summonBats: !!def.summonBats,
          burn: !!this.saleSynergyOn('beamBurn'),
          tick: 0,
        });
        continue;
      }

      if (def.type === 'sword') {
        // LN sword: авто-сик рядом — тик каждый кадр
        this.saleWeaponCd[id] = 0;
        const sprayLv = this.salePassives.spray || 0;
        const need = def.count[level] || def.count[0] || 1;
        const range = (def.range[level] || def.range[0] || 150) * area;
        const speed = def.speed || 175;
        const swordDmg = Math.max(1, Math.round(dmg * (1 + sprayLv * 0.12)));
        const trail = !!def.trail || sprayLv > 0;
        this.saleSwords = this.saleSwords || [];
        let list = this.saleSwords.filter((s) => s.weaponId === id);
        while (list.length < need) {
          const s = {
            weaponId: id, x: p.x, y: p.y, ang: 0, cd: 0,
            ico: def.ico, visual: def.visual || id, size: def.size || 1,
            trail, floorSlow: !!def.floorSlow, dmg: swordDmg, range, speed,
            hitR: 16 + (def.size || 1) * 4,
          };
          this.saleSwords.push(s);
          list.push(s);
        }
        while (list.length > need) {
          const drop = list.pop();
          this.saleSwords = this.saleSwords.filter((s) => s !== drop);
        }
        for (const s of list) {
          s.dmg = swordDmg; s.range = range; s.speed = speed; s.ico = def.ico;
          s.visual = def.visual || id; s.trail = trail; s.size = def.size || 1;
          s.floorSlow = !!def.floorSlow;
        }
        if (def.floorSlow && p) {
          this.salePuddles = this.salePuddles || [];
          // одна «мокрая» зона под игроком
          let floor = this.salePuddles.find((u) => u._wetFloor);
          if (!floor) {
            floor = {
              x: p.x, y: p.y, r: 48, life: 0.4, dmg: 0, tick: 0, color: '#38bdf8',
              slow: 0.45, _wetFloor: true, hurtPlayer: false,
            };
            this.salePuddles.push(floor);
          }
          floor.x = p.x; floor.y = p.y; floor.life = 0.45;
        }
        continue;
      }

      if (def.type === 'nova') {
        const maxR = (def.radius[level] || def.radius[0] || 120) * area;
        this.saleRings = this.saleRings || [];
        this.saleRings.push({
          x: p.x, y: p.y, r: 18, maxR, dmg, hit: new Set(),
          knock: def.knock || 200, ico: def.ico, visual: def.visual || id,
        });
        this._saleNova = { r: maxR, t: 0.38 };
        this.spawnAnimFx('afx_ring', p.x, p.y, {
          life: 0.45, scale: 0.6, scaleEnd: Math.max(1.2, maxR / 70), tint: '#f59e0b', alpha: 0.85,
        });
        if (def.impact) {
          this.spawnSpriteFx(def.impact, p.x, p.y, { scale: Math.min(0.55, maxR / 240), life: 0.28, vy: 0 });
        }
        if (def.iFrames && p) {
          p.invincible = Math.max(p.invincible || 0, def.iFrames);
        }
        continue;
      }

      if (def.type === 'aura') {
        const radius = (def.radius[level] || def.radius[0] || 80) * area;
        const isPromo = !!def.promo || def.visual === 'speaker';
        const isUltra = def.visual === 'ultrasound' || id === 'ultrasound';
        const pulseT = isPromo || isUltra ? 0.4 : 0.22;
        this._saleAura = {
          r: radius, t: pulseT, max: pulseT,
          ico: isPromo || isUltra ? null : def.ico,
          visual: def.visual,
          blood: false,
          promo: isPromo,
          ultra: isUltra,
        };
        if (isPromo) this._salePromoAuraR = radius;
        if (isUltra) this._saleUltraAuraR = radius;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (dist(p.x, p.y, e.x, e.y) < radius + e.r) {
            this.saleHitEnemy(e, dmg, p.x, p.y, def.knock || 70, {
              lifesteal: def.lifesteal, impact: def.impact, explodeOnKill: def.explodeOnKill,
              color: isUltra ? '#38bdf8' : '#9b59b6', fromAura: true,
            });
          }
        }
        if (def.impact) {
          this.spawnSpriteFx(def.impact, p.x, p.y, { scale: Math.min(0.4, radius / 220), life: 0.18, vy: 0 });
        }
        continue;
      }

      if (def.type === 'shield') {
        const range = (def.range[level] || def.range[0] || 100) * area;
        const ang = p.angle;
        const half = def.arc || 0.85;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const d = dist(p.x, p.y, e.x, e.y);
          if (d > range + e.r) continue;
          let diff = angleTo(p.x, p.y, e.x, e.y) - ang;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < half) {
            this.saleHitEnemy(e, dmg, p.x, p.y, def.knock || 220, { color: '#64748b', impact: 'sp_quake1' });
          }
        }
        this._saleShieldT = Math.max(this._saleShieldT || 0, 0.55);
        this.spawnAnimFx('afx_ring', p.x + Math.cos(ang) * 36, p.y + Math.sin(ang) * 36, {
          life: 0.3, scale: 0.5, scaleEnd: 1.2, tint: '#94a3b8',
        });
        continue;
      }

      if (def.type === 'radio') {
        let maxR = (def.radius[level] || def.radius[0] || 160) * area;
        if (this.salePassives.broadcast) maxR *= 1 + this.salePassives.broadcast * 0.1;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (dist(p.x, p.y, e.x, e.y) > maxR + e.r) continue;
          this.saleHitEnemy(e, dmg, p.x, p.y, 40, {
            color: '#38bdf8', impact: def.impact, stun: def.stun || 0,
          });
          e.slowTimer = Math.max(e.slowTimer || 0, 1.1);
          e._saleRadioSlow = def.slow || 0.55;
        }
        this.spawnAnimFx('afx_ring', p.x, p.y, {
          life: 0.5, scale: 0.7, scaleEnd: Math.max(1.4, maxR / 90), tint: '#7dd3fc',
        });
        continue;
      }

      if (def.type === 'mark') {
        let count = (def.count?.[level] || def.count?.[0] || 1) + projBonus;
        const targets = this.enemies.filter((e) => e.hp > 0)
          .map((e) => ({ e, d: dist(p.x, p.y, e.x, e.y) }))
          .sort((a, b) => a.d - b.d);
        for (let i = 0; i < count; i++) {
          let ang = p.angle;
          if (targets[i]) ang = angleTo(p.x, p.y, targets[i].e.x, targets[i].e.y);
          else if (targets[0]) ang = angleTo(p.x, p.y, targets[0].e.x, targets[0].e.y) + (i - 1) * 0.25;
          this.saleProjectiles.push({
            x: p.x, y: p.y, angle: ang, speed: def.speed || 460, life: 1.6, r: 11,
            dmg, ico: def.ico, visual: def.visual || id, bounces: 0, puddle: false,
            mark: def.markSec || 4, impact: def.impact, hit: new Set(),
          });
        }
        continue;
      }

      if (def.type === 'spray') {
        const range = (def.range[level] || 100) * area;
        const ang = p.angle;
        const half = def.arc || 0.65;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const d = dist(p.x, p.y, e.x, e.y);
          if (d > range + e.r) continue;
          let diff = angleTo(p.x, p.y, e.x, e.y) - ang;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < half) {
            this.saleHitEnemy(e, dmg, p.x, p.y, 160, { impact: def.impact || 'sp_fwave1', color: '#e67e22' });
          }
        }
        this.spawnSpriteFx(def.impact || 'sp_fwave2', p.x + Math.cos(ang) * 40, p.y + Math.sin(ang) * 40, {
          scale: 0.4 * Math.min(1.2, area), life: 0.22, rot: ang, vy: 0,
        });
        continue;
      }

      if (def.type === 'charge') {
        const ang = p.angle;
        const nearest = this.nearestSaleEnemy(p.x, p.y, 400);
        const a = nearest ? angleTo(p.x, p.y, nearest.x, nearest.y) : ang;
        this.saleCharges.push({
          x: p.x, y: p.y, angle: a, speed: def.speed || 320,
          life: ((def.range && def.range[level]) || def.range?.[0] || 260) / (def.speed || 320),
          dmg, ico: def.ico, visual: def.visual || id, size: def.size || 1.2, pull: def.pull || 0, hit: new Set(), impact: def.impact,
        });
        continue;
      }

      if (def.type === 'boomerang') {
        const range = (def.range?.[level] || def.range?.[0] || 200) * area;
        const nearest = this.nearestSaleEnemy(p.x, p.y, 500);
        const a = nearest ? angleTo(p.x, p.y, nearest.x, nearest.y) : p.angle;
        this.saleBoomerangs.push({
          x: p.x, y: p.y, angle: a, speed: def.speed || 340,
          range, traveled: 0, returning: false, dmg, ico: def.ico, visual: def.visual || id,
          hit: new Set(), size: def.size || 1.1,
        });
        continue;
      }

      if (def.type === 'seek') {
        const count = (def.count[level] || 2) + projBonus;
        for (let i = 0; i < count; i++) {
          const ang = rand(0, Math.PI * 2);
          this.saleSeekers.push({
            x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20,
            vx: Math.cos(ang) * 80, vy: Math.sin(ang) * 80,
            speed: def.speed || 260, life: 3.5, dmg, ico: '🦇', visual: 'bats', target: null, hit: new Set(),
          });
        }
        this.spawnSpriteFx('sp_bat1', p.x, p.y - 10, { scale: 0.8, life: 0.25, vy: -20 });
        continue;
      }

      if (def.type === 'puddle' || def.type === 'projectile' || def.type === 'ricochet') {
        let count = (def.count?.[level] || def.count?.[0] || 1) + projBonus;
        if (def.id === 'caffeine') count = 3;
        const targets = this.enemies.filter((e) => e.hp > 0)
          .map((e) => ({ e, d: dist(p.x, p.y, e.x, e.y) }))
          .sort((a, b) => a.d - b.d);
        for (let i = 0; i < count; i++) {
          let ang = p.angle + (count > 1 ? (i - (count - 1) / 2) * 0.35 : 0);
          if (targets[i]) ang = angleTo(p.x, p.y, targets[i].e.x, targets[i].e.y);
          else if (targets[0]) ang = angleTo(p.x, p.y, targets[0].e.x, targets[0].e.y) + (i - 1) * 0.4;
          this.saleProjectiles.push({
            x: p.x, y: p.y, angle: ang,
            speed: def.speed || 340,
            life: def.type === 'ricochet' ? 2.2 : 1.5,
            r: 12, dmg, ico: def.ico, visual: def.visual || id,
            bounces: def.type === 'ricochet' ? (def.bounces?.[level] || 3) : 0,
            puddle: def.type === 'puddle',
            puddleSlow: def.puddleSlow,
            puddleColor: def.puddleColor,
            confuse: def.confuse || 0,
            lifesteal: def.lifesteal || 0,
            explodeOnKill: !!def.explodeOnKill,
            impact: def.impact,
            hit: new Set(),
            born: performance.now(),
          });
        }
      }
    }
  };

  Game.prototype.updateSaleOrbits = function (dt) {
    const p = this.player;
    if (!p) return;
    const now = performance.now();
    this._saleOrbitVolleyCd = this._saleOrbitVolleyCd || {};
    // залп «Возврат чека»
    for (const [wid, lv] of Object.entries(this.saleWeapons || {})) {
      if (!lv) continue;
      const def = SALE_WEAPONS[wid];
      if (!def || !def.volleyOut) continue;
      this._saleOrbitVolleyCd[wid] = (this._saleOrbitVolleyCd[wid] || 0) - dt;
      if (this._saleOrbitVolleyCd[wid] > 0) continue;
      this._saleOrbitVolleyCd[wid] = def.volleyCd || 1.4;
      const dmg = Math.max(1, Math.round((def.dmg[0] || 2) * this.saleDmgMul()));
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + now * 0.001;
        this.saleProjectiles.push({
          x: p.x, y: p.y, angle: a, speed: 340, life: 1.1, r: 10,
          dmg, ico: def.ico, visual: def.visual || wid, bounces: 0, puddle: false, hit: new Set(),
        });
      }
    }
    for (const o of this.saleOrbits) {
      o.angle += dt * (o.spin || 3);
      o.x = p.x + Math.cos(o.angle) * o.radius;
      o.y = p.y + Math.sin(o.angle) * o.radius;
      if (o.trail && Math.random() < 0.2) {
        this.salePuddles.push({ x: o.x, y: o.y, r: 22, life: 1.2, dmg: 1, tick: 0, color: '#27ae60', poison: true });
      }
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if ((o.hitAt.get(e) || 0) > now) continue;
        if (dist(o.x, o.y, e.x, e.y) < e.r + 22 * (o.size || 1)) {
          o.hitAt.set(e, now + 280);
          this.saleHitEnemy(e, o.dmg, p.x, p.y, 130, { color: '#f39c12', spark: 'fx_slash' });
          if (o.explodeHit) {
            this.spawnAnimFx('afx_ring', e.x, e.y, { life: 0.28, scale: 0.4, scaleEnd: 1.1 });
            this.salePuddles.push({
              x: e.x, y: e.y, r: 28, life: 1.05, dmg: 1, tick: 0, color: '#f59e0b',
            });
          }
        }
      }
    }
    this.saleOrbits = this.saleOrbits.filter((o) => this.saleWeapons[o.weaponId]);
  };

  Game.prototype.updateSaleBoomerangs = function (dt) {
    const p = this.player;
    for (const b of this.saleBoomerangs) {
      if (!b.returning) {
        b.x += Math.cos(b.angle) * b.speed * dt;
        b.y += Math.sin(b.angle) * b.speed * dt;
        b.traveled += b.speed * dt;
        if (b.traveled >= b.range) b.returning = true;
      } else {
        const a = angleTo(b.x, b.y, p.x, p.y);
        b.angle = a;
        b.x += Math.cos(a) * b.speed * 1.2 * dt;
        b.y += Math.sin(a) * b.speed * 1.2 * dt;
        if (dist(b.x, b.y, p.x, p.y) < 22) b.dead = true;
      }
      const hitR = 14 * (b.size || 1.1);
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hit.has(e)) continue;
        if (dist(b.x, b.y, e.x, e.y) < e.r + hitR) {
          b.hit.add(e);
          this.saleHitEnemy(e, b.dmg, b.x, b.y, 200, { color: '#1abc9c' });
        }
      }
    }
    this.saleBoomerangs = this.saleBoomerangs.filter((b) => !b.dead);
  };

  Game.prototype.updateSaleProjectiles = function (dt) {
    for (const pr of this.saleProjectiles) {
      pr.x += Math.cos(pr.angle) * pr.speed * dt;
      pr.y += Math.sin(pr.angle) * pr.speed * dt;
      pr.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0 || pr.hit.has(e)) continue;
        if (dist(pr.x, pr.y, e.x, e.y) < e.r + pr.r) {
          pr.hit.add(e);
          this.saleHitEnemy(e, pr.dmg, pr.x, pr.y, 160, {
            confuse: pr.confuse, lifesteal: pr.lifesteal, impact: pr.impact,
            explodeOnKill: pr.explodeOnKill, color: '#f1c40f', mark: pr.mark || 0,
          });
          if (pr.impact) this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.45, life: 0.2, vy: 0 });
          if (pr.puddle) {
            this.salePuddles.push({
              x: e.x, y: e.y, r: 40, life: 2.8, dmg: 1, tick: 0,
              color: pr.puddleColor || '#d35400',
              slow: pr.puddleSlow != null ? pr.puddleSlow : 0.55,
              poison: !!pr.poison || !!this.saleSynergyOn('poisonPuddle'),
            });
            pr.life = 0;
          } else if (pr.bounces > 0) {
            pr.bounces--;
            const next = this.nearestSaleEnemy(pr.x, pr.y, 280);
            if (next && next !== e) pr.angle = angleTo(pr.x, pr.y, next.x, next.y);
            else pr.life = 0;
            if (pr.impact) this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.4, life: 0.18, vy: 0 });
          } else {
            pr.life = 0;
          }
          break;
        }
      }
      if (pr.x < -40 || pr.y < -40 || pr.x > this.worldW + 40 || pr.y > this.worldH + 40) pr.life = 0;
    }
    this.saleProjectiles = this.saleProjectiles.filter((pr) => pr.life > 0);
  };

  Game.prototype.updateSaleCharges = function (dt) {
    for (const c of this.saleCharges) {
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      c.life -= dt;
      if (c.pull) {
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const d = dist(c.x, c.y, e.x, e.y);
          if (d < c.pull && d > 1) {
            const a = angleTo(e.x, e.y, c.x, c.y);
            e.x += Math.cos(a) * 120 * dt;
            e.y += Math.sin(a) * 120 * dt;
          }
        }
      }
      for (const e of this.enemies) {
        if (e.hp <= 0 || c.hit.has(e)) continue;
        if (dist(c.x, c.y, e.x, e.y) < e.r + 18 * (c.size || 1)) {
          c.hit.add(e);
          this.saleHitEnemy(e, c.dmg, c.x, c.y, 260, { impact: c.impact, color: '#16a085' });
        }
      }
    }
    this.saleCharges = this.saleCharges.filter((c) => c.life > 0);
  };

  Game.prototype.updateSaleSeekers = function (dt) {
    for (const s of this.saleSeekers) {
      if (!s.target || s.target.hp <= 0) s.target = this.nearestSaleEnemy(s.x, s.y, 420);
      if (s.target) {
        const a = angleTo(s.x, s.y, s.target.x, s.target.y);
        s.vx += Math.cos(a) * 420 * dt;
        s.vy += Math.sin(a) * 420 * dt;
      }
      const sp = Math.hypot(s.vx, s.vy) || 1;
      const maxSp = s.speed;
      if (sp > maxSp) { s.vx = s.vx / sp * maxSp; s.vy = s.vy / sp * maxSp; }
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= dt;
      s.angle = Math.atan2(s.vy, s.vx);
      for (const e of this.enemies) {
        if (e.hp <= 0 || s.hit.has(e)) continue;
        if (dist(s.x, s.y, e.x, e.y) < e.r + 12) {
          s.hit.add(e);
          this.saleHitEnemy(e, s.dmg, s.x, s.y, 100, { impact: 'sp_bat2', color: '#2c3e50' });
          s.life -= 0.8;
        }
      }
    }
    this.saleSeekers = this.saleSeekers.filter((s) => s.life > 0);
  };

  Game.prototype.updateSaleBeams = function (dt) {
    this._saleBeamAng = (this._saleBeamAng || 0);
    const p = this.player;
    for (const b of this.saleBeams) {
      if (!this.saleWeapons[b.weaponId]) { b.dead = true; continue; }
      if (b.aimNearest) {
        const n = this.nearestSaleEnemy(p.x, p.y, b.length * 1.15);
        if (n) {
          const targetA = angleTo(p.x, p.y, n.x, n.y);
          let da = targetA - b.angle;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          const maxTurn = (b.turn || 8) * dt;
          b.angle += Math.abs(da) <= maxTurn ? da : Math.sign(da) * maxTurn;
        }
      } else if (b.spin) {
        b.angle += dt * b.spin;
      }
      this._saleBeamAng = b.angle;
      b.tick += dt;
      const x2 = p.x + Math.cos(b.angle) * b.length;
      const y2 = p.y + Math.sin(b.angle) * b.length;
      b.x2 = x2; b.y2 = y2;
      if (b.tick < 0.1) continue;
      b.tick = 0;
      const halfCone = b.cone || 0;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > b.length + e.r) continue;
        if (halfCone > 0) {
          let da = angleTo(p.x, p.y, e.x, e.y) - b.angle;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          if (Math.abs(da) > halfCone) continue;
          this.saleHitEnemy(e, b.dmg, e.x, e.y, 50, { color: '#f1c40f', spark: 'sp_fire1' });
        } else {
          const ax = p.x, ay = p.y;
          const bx = x2 - ax, by = y2 - ay;
          const t = Math.max(0, Math.min(1, ((e.x - ax) * bx + (e.y - ay) * by) / (bx * bx + by * by || 1)));
          const px = ax + bx * t, py = ay + by * t;
          if (dist(px, py, e.x, e.y) < e.r + b.width * 0.35) {
            this.saleHitEnemy(e, b.dmg, px, py, 60, { color: '#f1c40f', spark: 'sp_fire1' });
            if (b.burn && Math.random() < 0.35) {
              this.salePuddles.push({
                x: e.x, y: e.y, r: 22, life: 1.6, dmg: 1, tick: 0, color: '#ea580c',
              });
            }
            if (b.summonBats && Math.random() < 0.1) {
              this.saleSeekers.push({
                x: p.x, y: p.y, vx: 0, vy: 0,
                speed: 280, life: 2.0, dmg: b.dmg, ico: '🦇', visual: 'bats', target: e, hit: new Set(),
              });
            }
          }
        }
      }
    }
    this.saleBeams = this.saleBeams.filter((b) => !b.dead && this.saleWeapons[b.weaponId]);
  };

  /** LN sword: швабры догоняют цель в радиусе, иначе орбита ожидания. */
  Game.prototype.updateSaleSwords = function (dt) {
    const p = this.player;
    if (!p) return;
    this.saleSwords = this.saleSwords || [];
    for (const sw of this.saleSwords) {
      if (!this.saleWeapons[sw.weaponId]) { sw.dead = true; continue; }
      if (sw.cd > 0) sw.cd -= dt;
      const R = sw.range || 160;
      let tgt = null; let bd = R * R;
      for (const e of this.enemies) {
        if (e.hp <= 0 || (e._saleSwordIframe || 0) > 0) continue;
        const dx = e.x - p.x, dy = e.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; tgt = e; }
      }
      if (tgt) {
        const dx = tgt.x - sw.x, dy = tgt.y - sw.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const step = (sw.speed || 175) * dt;
        sw.x += (dx / d) * step;
        sw.y += (dy / d) * step;
        sw.ang = Math.atan2(dy, dx);
        if (d < (sw.hitR || 18) + tgt.r && sw.cd <= 0) {
          this.saleHitEnemy(tgt, sw.dmg, sw.x, sw.y, 80, { color: '#27ae60', spark: 'fx_slash' });
          tgt._saleSwordIframe = 0.4;
          sw.cd = 0.22;
          if (sw.trail) {
            this.salePuddles.push({
              x: sw.x, y: sw.y, r: 20, life: 1.1, dmg: 1, tick: 0, color: '#27ae60', poison: true,
            });
          }
        }
      } else {
        const oa = performance.now() * 0.002 + (sw.weaponId.length || 0);
        const ox = p.x + Math.cos(oa) * (R * 0.55);
        const oy = p.y + Math.sin(oa) * (R * 0.55);
        const dx = ox - sw.x, dy = oy - sw.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const step = Math.min(d, (sw.speed || 175) * dt);
        sw.x += (dx / d) * step;
        sw.y += (dy / d) * step;
        if (d > 2) sw.ang = Math.atan2(dy, dx);
      }
    }
    for (const e of this.enemies) {
      if (e._saleSwordIframe > 0) e._saleSwordIframe -= dt;
    }
    this.saleSwords = this.saleSwords.filter((s) => !s.dead && this.saleWeapons[s.weaponId]);
  };

  /** LN bell: расширяющееся кольцо урона. */
  Game.prototype.updateSaleRings = function (dt) {
    this.saleRings = this.saleRings || [];
    for (const ring of this.saleRings) {
      ring.r += Math.max(140, ring.maxR) * dt * 1.35;
      for (const e of this.enemies) {
        if (e.hp <= 0 || ring.hit.has(e)) continue;
        const d = dist(ring.x, ring.y, e.x, e.y);
        if (Math.abs(d - ring.r) < e.r + 14) {
          ring.hit.add(e);
          this.saleHitEnemy(e, ring.dmg, ring.x, ring.y, ring.knock || 200, {
            color: '#f39c12', impact: 'sp_fwave1',
          });
        }
      }
    }
    this.saleRings = this.saleRings.filter((r) => r.r < r.maxR);
  };

  Game.prototype.updateSalePuddles = function (dt) {
    for (const u of this.salePuddles) {
      u.life -= dt;
      u.tick += dt;
      if (u.tick >= 0.35) {
        u.tick = 0;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (dist(u.x, u.y, e.x, e.y) < u.r + e.r) {
            this.saleHitEnemy(e, u.dmg, u.x, u.y, 40, { color: u.color });
            if (u.slow) e.slowTimer = Math.max(e.slowTimer || 0, 0.6);
          }
        }
        if (u.hurtPlayer && this.player && this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (dist(u.x, u.y, this.player.x, this.player.y) < u.r + this.player.r) {
            if (this.player.takeDamage(u.x, u.y)) {
              this.endSaleGame(false, u.killName || 'Пожар в отделе');
              return true;
            }
            this.tookDamage = true;
            sfx.hurt();
            this.applySaleFragileExtra();
          }
        }
      }
    }
    this.salePuddles = this.salePuddles.filter((u) => u.life > 0);
    return false;
  };

  Game.prototype.applySaleFragileExtra = function () {
    if (!this.saleFragile || !this.player || this.player.hp <= 0) return false;
    this.player.hp -= 1;
    if (this.player.hp <= 0) {
      if ((this.player.extraLives || 0) > 0) {
        this.player.extraLives -= 1;
        this.player.hp = Math.max(1, Math.ceil(this.player.maxHp * 0.5));
        this.player.invincible = 2.2;
        return false;
      }
      this.endSaleGame(false, 'Распродажа оружия (хрупкость)');
      return true;
    }
    return false;
  };

  Game.prototype.clearSaleEventModifiers = function () {
    this.saleMobSpeedMul = 1;
    this.saleSpawnMul = 1;
    this.saleXpEventMul = 1;
    this.saleWeaponDmgMul = 1;
    this.saleFragile = false;
    this.saleForceTypes = null;
    this.saleInvulnExcept = null;
    this.saleEvacMode = null;
    this.saleEventAcc = 0;
    this.saleVipRef = null;
    if (this.saleTempWalls && this.saleTempWalls.length) {
      const temps = new Set(this.saleTempWalls);
      this.obstacles = (this.obstacles || []).filter((o) => !temps.has(o) && !o._saleTemp);
      this.saleTempWalls = [];
    }
    for (const e of this.enemies || []) {
      e._saleInvuln = false;
    }
  };

  Game.prototype.endSaleEvent = function () {
    this.clearSaleEventModifiers();
    this.saleActiveEvent = null;
  };

  Game.prototype.startSaleEvent = function (id) {
    this.endSaleEvent();
    const p = this.player;
    const banners = {
      queue_rush: '👥 НАПЛЫВ ОЧЕРЕДИ!',
      triple_boss: '👔 ТРОЙКА АДМИНОВ!',
      black_friday: '🏷 ЧЁРНАЯ ПЯТНИЦА! Все ускорились',
      lights_out: '💡 СВЕТ ВЫКЛЮЧИЛИ!',
      fire_dept: '🔥 ПОЖАР В ОТДЕЛЕ!',
      inventory: '📋 ИНВЕНТАРИЗАЦИЯ! Бей только отмеченных',
      vip_day: '👑 VIP-ДЕНЬ! Пока жив VIP — толпа быстрее',
      xp_discount: '💸 СКИДКА −50% НА XP',
      xp_double: '✨ ДВОЙНОЙ XP!',
      evacuation: '🚨 ЭВАКУАЦИЯ! Сначала бегут, потом навалятся',
      complaint_book: '📕 КНИГА ЖАЛОБ С ПОТОЛКА!',
      security_walls: '🚧 ОХРАНА ЗАКРЫЛА ПРОХОДЫ!',
      happy_hour: '💎 СЧАСТЛИВЫЙ ЧАС! Гемы в центре',
      checkout_hall: '🧾 КАССОВЫЙ ЗАЛ! Только очереди',
      director_call: '📞 ДИРЕКТОР НА СВЯЗИ! Линии с краёв',
      weapon_sale: '⚔ РАСПРОДАЖА ОРУЖИЯ! ×2 урон, ×2 входящий',
      mall_closing: '🔒 ЗАКРЫТИЕ ТЦ! Всё сразу',
    };
    const durations = {
      queue_rush: 10, triple_boss: 12, black_friday: 30, lights_out: 22,
      fire_dept: 28, inventory: 16, vip_day: 40, xp_discount: 25, xp_double: 25,
      evacuation: 18, complaint_book: 22, security_walls: 24, happy_hour: 14,
      checkout_hall: 28, director_call: 26, weapon_sale: 20, mall_closing: 55,
    };
    const dur = durations[id] || 20;
    this.saleActiveEvent = { id, t: dur, max: dur };
    this.saleLastEventId = id;
    this.modeFlash = Math.max(this.modeFlash || 0, 0.7);
    if (typeof this.showEventBanner === 'function') {
      this.showEventBanner(banners[id] || ('Событие: ' + id), Math.min(3.2, dur * 0.2));
    }
    sfx.mode();

    if (id === 'queue_rush') {
      const n = 14 + randi(0, 6);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const r = 140 + rand(0, 50);
        this.spawnSaleEnemyNear(
          p.x + Math.cos(a) * r,
          p.y + Math.sin(a) * r,
          Math.random() < 0.55 ? 'queue' : 'normal',
          { nameTag: 'Очередь', overCap: 12 }
        );
      }
    } else if (id === 'triple_boss') {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        const e = this.spawnSaleEnemyNear(
          p.x + Math.cos(a) * 220,
          p.y + Math.sin(a) * 220,
          i === 1 ? 'boss' : 'miniboss',
          { nameTag: i === 1 ? 'Админ' : 'Зам. админа', hpMul: 0.42, xpReward: 10, overCap: 8 }
        );
        if (e) e.speed *= 0.85;
      }
    } else if (id === 'black_friday') {
      this.saleMobSpeedMul = 1.5;
      this.saleSpawnMul = 0.55;
      this.fireAlarm = Math.max(this.fireAlarm, dur);
      for (let i = 0; i < 8; i++) this.spawnSaleEnemy();
    } else if (id === 'lights_out') {
      this.lightsOut = Math.max(this.lightsOut, dur);
    } else if (id === 'fire_dept') {
      this.fireAlarm = Math.max(this.fireAlarm, dur * 0.6);
      this.saleSpawnMul = 0.75;
      for (let i = 0; i < 5; i++) {
        const e = this.spawnSaleEnemy('fatty');
        if (e) e.nameTag = 'Горючее';
      }
      this._saleSeedFirePuddles(6);
    } else if (id === 'inventory') {
      const types = {};
      for (const e of this.enemies) {
        if (e.hp > 0) types[e.type] = (types[e.type] || 0) + 1;
      }
      const keys = Object.keys(types);
      const except = keys.length ? keys[randi(0, keys.length - 1)] : 'normal';
      this.saleInvulnExcept = except;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        e._saleInvuln = e.type !== except;
      }
      const labels = {
        normal: 'обычных', fast: 'быстрых', tank: 'танков', fatty: 'жирных',
        queue: 'очередь', returner: 'жалобщиков', manager: 'менеджеров',
        boss: 'боссов', miniboss: 'минибоссов', director: 'директора',
      };
      if (typeof this.showEventBanner === 'function') {
        this.showEventBanner(`📋 Уязвимы: ${labels[except] || except}`, 3.5);
      }
    } else if (id === 'vip_day') {
      const vip = this.spawnSaleEnemyNear(p.x + 200, p.y - 160, 'boss', {
        nameTag: 'VIP-клиент', hpMul: 1.8, xpReward: 18, vip: true, overCap: 4,
      });
      this.saleVipRef = vip;
      this.saleMobSpeedMul = 1.35;
    } else if (id === 'xp_discount') {
      this.saleXpEventMul = 0.5;
    } else if (id === 'xp_double') {
      this.saleXpEventMul = 2;
    } else if (id === 'evacuation') {
      this.saleEvacMode = 'flee';
      this.saleActiveEvent.fleeT = 8;
    } else if (id === 'complaint_book') {
      this.saleEventAcc = 0;
    } else if (id === 'security_walls') {
      this._saleSpawnTempWalls();
    } else if (id === 'happy_hour') {
      const cx = this.worldW * 0.5;
      const cy = this.worldH * 0.5;
      for (let i = 0; i < 18; i++) {
        this.xpGems.push({
          x: cx + rand(-90, 90), y: cy + rand(-70, 70),
          value: 2 + randi(0, 2), r: 10, life: 30, vx: rand(-20, 20), vy: rand(-20, 20),
        });
      }
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16;
        this.spawnSaleEnemyNear(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160, 'fast', {
          nameTag: 'Охотник за скидкой', overCap: 14,
        });
      }
    } else if (id === 'checkout_hall') {
      this.saleForceTypes = ['queue', 'normal', 'normal'];
      this.saleSpawnMul = 0.5;
      for (let i = 0; i < 12; i++) this.spawnSaleEnemy();
    } else if (id === 'director_call') {
      this.saleEventAcc = 0.5;
    } else if (id === 'weapon_sale') {
      this.saleWeaponDmgMul = 2;
      this.saleFragile = true;
    } else if (id === 'mall_closing') {
      this.saleMobSpeedMul = 1.45;
      this.saleSpawnMul = 0.45;
      this.fireAlarm = Math.max(this.fireAlarm, 40);
      this.lightsOut = Math.max(this.lightsOut, 12);
      this.saleWeaponDmgMul = 1.5;
      this.saleFragile = true;
      this._saleSeedFirePuddles(8);
      for (let i = 0; i < 2; i++) {
        this.spawnSaleEnemyNear(p.x + (i ? 240 : -240), p.y - 180, 'boss', {
          nameTag: 'Охрана закрытия', hpMul: 0.55, xpReward: 12, overCap: 6,
        });
      }
      for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
      this.saleEventAcc = 0;
    }
  };

  Game.prototype._saleSeedFirePuddles = function (n) {
    const p = this.player;
    for (let i = 0; i < n; i++) {
      this.salePuddles.push({
        x: p.x + rand(-320, 320),
        y: p.y + rand(-240, 240),
        r: 38 + rand(0, 28),
        life: 8 + rand(0, 6),
        dmg: 1,
        tick: rand(0, 0.3),
        color: '#e67e22',
        hurtPlayer: true,
        killName: 'Пожар в отделе',
      });
    }
  };

  Game.prototype._saleSpawnTempWalls = function () {
    this.saleTempWalls = this.saleTempWalls || [];
    const p = this.player;
    const specs = [
      { dx: -110, dy: -40, w: 28, h: 140 },
      { dx: 110, dy: -40, w: 28, h: 140 },
      { dx: -80, dy: -130, w: 160, h: 26 },
      { dx: -80, dy: 90, w: 70, h: 26 },
      { dx: 20, dy: 90, w: 70, h: 26 },
    ];
    for (const s of specs) {
      const ob = {
        x: p.x + s.dx, y: p.y + s.dy, w: s.w, h: s.h,
        dw: s.w + 8, dh: s.h + 10, sprite: 'box_stack', type: 'prop', _saleTemp: true,
      };
      this.obstacles.push(ob);
      this.saleTempWalls.push(ob);
    }
  };

  Game.prototype.tickSaleEvents = function (dt) {
    const minute = Math.floor(this.saleTime / 60);
    if (minute >= 1 && minute > this.saleEventMinute && minute <= 19) {
      this.saleEventMinute = minute;
      const id = pickSaleEventId(minute, this.saleLastEventId);
      this.startSaleEvent(id);
    }

    const ev = this.saleActiveEvent;
    if (!ev) return false;

    ev.t -= dt;
    this.saleEventAcc = (this.saleEventAcc || 0) + dt;

    if (ev.id === 'vip_day') {
      const vip = this.saleVipRef;
      if (!vip || vip.hp <= 0) {
        this.saleMobSpeedMul = 1;
        this.saleVipRef = null;
      } else {
        this.saleMobSpeedMul = 1.4;
        // аура визуально через speed
      }
    }

    if (ev.id === 'evacuation') {
      if (ev.fleeT > 0) {
        ev.fleeT -= dt;
        this.saleEvacMode = 'flee';
        if (ev.fleeT <= 0) {
          this.saleEvacMode = 'rush';
          this.saleMobSpeedMul = 1.6;
          this.showEventBanner('😱 ТОЛПА ВЕРНУЛАСЬ!', 2.2);
          for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
        }
      }
    }

    if (ev.id === 'complaint_book' || ev.id === 'mall_closing') {
      const every = ev.id === 'mall_closing' ? 1.6 : 2.0;
      if (this.saleEventAcc >= every) {
        this.saleEventAcc = 0;
        this._saleFireComplaintBurst();
      }
    }

    if (ev.id === 'director_call' || ev.id === 'mall_closing') {
      const every = ev.id === 'mall_closing' ? 3.2 : 3.8;
      // отдельный аккумулятор через t modulo — используем max-t
      const elapsed = ev.max - ev.t;
      if (!ev._lastLineAt) ev._lastLineAt = -99;
      if (elapsed - ev._lastLineAt >= every) {
        ev._lastLineAt = elapsed;
        this._saleDirectorEdgeSlash();
      }
    }

    if (ev.id === 'fire_dept' || ev.id === 'mall_closing') {
      if (!ev._lastFireAt) ev._lastFireAt = 0;
      const elapsed = ev.max - ev.t;
      if (elapsed - ev._lastFireAt >= 4.5) {
        ev._lastFireAt = elapsed;
        this._saleSeedFirePuddles(ev.id === 'mall_closing' ? 3 : 2);
      }
    }

    if (ev.id === 'inventory') {
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        e._saleInvuln = e.type !== this.saleInvulnExcept;
      }
    }

    if (ev.t <= 0) {
      this.endSaleEvent();
      if (typeof this.showEventBanner === 'function') {
        this.showEventBanner('✅ Событие закончилось', 1.4);
      }
    }
    return false;
  };

  Game.prototype._saleFireComplaintBurst = function () {
    const p = this.player;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const side = randi(0, 3);
      let x, y;
      if (side === 0) { x = rand(40, this.worldW - 40); y = 20; }
      else if (side === 1) { x = this.worldW - 20; y = rand(40, this.worldH - 40); }
      else if (side === 2) { x = rand(40, this.worldW - 40); y = this.worldH - 20; }
      else { x = 20; y = rand(40, this.worldH - 40); }
      const a = angleTo(x, y, p.x + rand(-40, 40), p.y + rand(-40, 40));
      this.projectiles.push(new Projectile(x, y, a, 240 + rand(0, 60), null));
    }
  };

  Game.prototype._saleDirectorEdgeSlash = function () {
    const p = this.player;
    const side = randi(0, 3);
    let x, y;
    if (side === 0) { x = p.x; y = Math.max(40, p.y - 280); }
    else if (side === 1) { x = Math.min(this.worldW - 40, p.x + 280); y = p.y; }
    else if (side === 2) { x = p.x; y = Math.min(this.worldH - 40, p.y + 280); }
    else { x = Math.max(40, p.x - 280); y = p.y; }
    const fake = { x, y, type: 'director', bossPhase: 2, nameTag: 'Директор (по рации)' };
    this.spawnBossLineAttack(fake, p, { lines: Math.random() < 0.35 ? 2 : 1, warn: 0.95, length: 520 });
  };

  Game.prototype.updateSale = function (dt) {
    if (this.inHub || this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) return;
    if (this.__saleDevOpen) return;
    const scale = this.__saleTimeScale || 1;
    const realDt = Math.min(dt, 0.1) * scale;
    music.setIntensity(this.saleTime > SALE_DURATION * 0.75 ? 'boss' : 'rush');

    this.saleTime += realDt;
    if (this._saleLsCd > 0) this._saleLsCd -= realDt;
    if (this.saleTime >= SALE_DURATION) {
      this.endSaleGame(true);
      return;
    }

    // минутные события ТЦ
    this.tickSaleEvents(realDt);

    // timers inherited from shift events
    if (this.lightsOut > 0) this.lightsOut -= realDt;
    if (this.fireAlarm > 0) this.fireAlarm -= realDt;
    if (this._eventBanner) {
      this._eventBanner.t -= realDt;
      if (this._eventBanner.t <= 0) this._eventBanner = null;
    }
    if (this.modeFlash > 0) this.modeFlash -= realDt;

    // regen
    const regenLv = this.salePassives.medkit || this.salePassives.regen || 0;
    if (regenLv > 0) {
      this.saleRegenTimer += realDt;
      const every = Math.max(4, 12 - regenLv * 2.5);
      if (this.saleRegenTimer >= every) {
        this.saleRegenTimer = 0;
        if (this.player.hp < this.player.maxHp) this.player.hp++;
      }
    }

    if (this._saleAura) { this._saleAura.t -= realDt; if (this._saleAura.t <= 0) this._saleAura = null; }
    if (this._saleNova) { this._saleNova.t -= realDt; if (this._saleNova.t <= 0) this._saleNova = null; }

    const zone = this.zoneAt(this.player.x, this.player.y);
    let slip = zone && zone.type === 'slippery' ? 1.35 : 1;
    const speedMul = this.player._saleSpeedMul || 1;

    const dir = this.getInputDir();
    if (this.player.dashTime <= 0) {
      this.player.x += dir.x * this.player.speed * slip * speedMul * realDt;
      this.player.y += dir.y * this.player.speed * slip * speedMul * realDt;
    }
    if (dir.x || dir.y) this.player.angle = Math.atan2(dir.y, dir.x);

    // look at nearest for facing even when idle
    let nearest = null; let best = 280;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist(this.player.x, this.player.y, e.x, e.y);
      if (d < best) { best = d; nearest = e; }
    }
    if (nearest && !(dir.x || dir.y)) {
      this.player.angle = angleTo(this.player.x, this.player.y, nearest.x, nearest.y);
    }

    this.player.update(realDt, this.worldW, this.worldH, this);
    this.player.tickAnim(realDt, !!(dir.x || dir.y));
    this.pushOutOfObstacles(this.player, this.player.r);

    const lead = 40;
    const targetCX = this.player.x - this.viewW() / 2 + Math.cos(this.player.angle) * lead * 0.25;
    const targetCY = this.player.y - this.viewH() / 2 + Math.sin(this.player.angle) * lead * 0.25;
    this.camera.x += (targetCX - this.camera.x) * Math.min(1, realDt * 5);
    this.camera.y += (targetCY - this.camera.y) * Math.min(1, realDt * 5);

    // spawn — трикл fodder; при живом боссе урезаем burst, чтобы босс читался
    this.saleSpawnAcc += realDt;
    const interval = saleSpawnInterval(this.saleTime) * (this.saleSpawnMul || 1);
    const bossAlive = this.saleBossAlive();
    while (this.saleSpawnAcc >= interval) {
      this.saleSpawnAcc -= interval;
      let burst = saleSpawnBurst(this.saleTime);
      if (bossAlive) burst = Math.max(1, Math.floor(burst * 0.55));
      for (let i = 0; i < burst; i++) this.spawnSaleEnemy();
    }

    // LN-директор: пакетные волны + элиты; боссы one-at-a-time
    this.tickSaleDirector(realDt);
    this.tickSaleBossSchedule();

    // enemies always chase in sale
    for (const enemy of this.enemies) {
      if (this.saleEvacMode === 'flee') {
        const toL = enemy.x;
        const toR = this.worldW - enemy.x;
        const toT = enemy.y;
        const toB = this.worldH - enemy.y;
        let ax = 0; let ay = 0;
        const m = Math.min(toL, toR, toT, toB);
        if (m === toL) ax = -1;
        else if (m === toR) ax = 1;
        else if (m === toT) ay = -1;
        else ay = 1;
        const spd = enemy.speed * 1.5 * realDt;
        enemy.x += ax * spd;
        enemy.y += ay * spd;
        enemy.angle = Math.atan2(ay, ax);
        clampEntityToArena(enemy, this.worldW, this.worldH, this);
      } else {
        // во время телеграфа рывка босс стоит — иначе пунктир не читается
        if (!(enemy.saleBossId && enemy._saleChargeT > 0)) {
          enemy.update(realDt, this.player, this.worldW, this.worldH, true, this);
        }
        if (enemy.saleBossId) this.tickSaleBossAI(enemy, realDt);
      }
      this.pushOutOfObstacles(enemy, enemy.r);

      const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
      const hitR = this.player.r + enemy.r - 2;
      if (d < hitR) {
        if (enemy.noDamage || enemy.type === 'child') {
          const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
          this.player.knockback.x += Math.cos(a) * 140;
          this.player.knockback.y += Math.sin(a) * 140;
        } else if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          // турникет: краткий блок контакта
          if ((this._saleShieldT || 0) > 0 && Math.random() < 0.65) {
            this.spawnAnimFx('afx_ring', this.player.x, this.player.y, { life: 0.2, scale: 0.4, scaleEnd: 0.9, tint: '#94a3b8' });
            const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.knockback = enemy.knockback || { x: 0, y: 0 };
            enemy.knockback.x -= Math.cos(a) * 180;
            enemy.knockback.y -= Math.sin(a) * 180;
          } else if (this.player.takeDamage(enemy.x, enemy.y)) {
            this.endSaleGame(false, enemy.nameTag || 'Покупатель');
            return;
          } else {
            this.tookDamage = true;
            sfx.hurt();
            this.vibrate(40);
            if (this.applySaleFragileExtra()) return;
          }
        }
      }
    }

    if (this.tickSaleBossHazards(realDt)) return;

    // книги жалоб / снаряды боссов
    for (const pr of this.projectiles) {
      pr.update(realDt);
      if (!pr.dead && dist(pr.x, pr.y, this.player.x, this.player.y) < this.player.r + pr.r) {
        pr.dead = true;
        if (pr._saleBossShot) {
          if (this.saleBossHurtPlayer(pr.x, pr.y, pr._saleBossKill || 'Босс')) return;
          this.spawnParticles(this.player.x, this.player.y, 12, '#e74c3c', 140, 0.4);
        } else {
          this.player.applyComplaint();
          this.spawnParticles(this.player.x, this.player.y, 10, '#8e44ad', 120, 0.4);
          sfx.hurt();
          this.vibrate(35);
        }
      }
    }
    this.projectiles = this.projectiles.filter((pr) => !pr.dead);

    // auto weapons (орбиты, снаряды, лучи…)
    this.updateSaleWeapons(realDt);
    this.updateSaleOrbits(realDt);
    this.updateSaleSwords(realDt);
    this.updateSaleRings(realDt);
    this.updateSaleBoomerangs(realDt);
    this.updateSaleProjectiles(realDt);
    this.updateSaleCharges(realDt);
    this.updateSaleSeekers(realDt);
    this.updateSaleBeams(realDt);
    if (this.updateSalePuddles(realDt)) return;

    // fuse bombs
    for (const bomb of this.fuseBombs) {
      bomb.life -= realDt;
      if (bomb.life <= 0 && !bomb.exploded) {
        bomb.exploded = true;
        if (this.explodeAt(bomb.x, bomb.y)) return;
      }
    }
    this.fuseBombs = this.fuseBombs.filter((b) => !b.exploded);

    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // пауэрапы (посылка / магнит / хлопушка)
    this.updateSalePowerups(realDt);

    // цифры урона
    if (this.saleDmgNums && this.saleDmgNums.length) {
      for (const dn of this.saleDmgNums) {
        dn.life -= realDt;
        dn.y += dn.vy * realDt;
      }
      this.saleDmgNums = this.saleDmgNums.filter((dn) => dn.life > 0);
    }

    // XP gems
    if (this.saleVacuumT > 0) this.saleVacuumT -= realDt;
    const vacuum = this.saleVacuumT > 0;
    const mag = vacuum ? 1e9 : this.saleMagnetRange();
    for (const g of this.xpGems) {
      g.life -= realDt;
      g.x += (g.vx || 0) * realDt;
      g.y += (g.vy || 0) * realDt;
      g.vx *= 0.92; g.vy *= 0.92;
      const d = dist(this.player.x, this.player.y, g.x, g.y);
      if (d < mag) {
        const pull = vacuum
          ? 1200 * realDt
          : Math.min(1, (mag - d) / mag) * 420 * realDt;
        const a = angleTo(g.x, g.y, this.player.x, this.player.y);
        g.x += Math.cos(a) * Math.min(d, pull);
        g.y += Math.sin(a) * Math.min(d, pull);
      }
      if (d < this.player.r + g.r) {
        g.dead = true;
        this.gainSaleXp(g.value || 1);
        sfx.pickup();
      }
    }
    this.xpGems = this.xpGems.filter((g) => !g.dead && g.life > 0);

    // coin pickups (reuse)
    for (const pk of this.pickups) {
      pk.update(realDt, this.player);
      if (!pk.dead && dist(this.player.x, this.player.y, pk.x, pk.y) < this.player.r + pk.r + 8) {
        if (pk.type === 'coin' || pk.type === 'coins') {
          const wallet = 1 + (this.salePassives.wallet || 0) * 0.15;
          const warmCoins = saleCoinWarmMul(this.saleTime || 0);
          this.coins += Math.ceil((pk.value || 1) * wallet * (this.coinMult || 1) * warmCoins);
          pk.life = 0;
          sfx.pickup();
        } else if (pk.type === 'heal' && this.player.hp < this.player.maxHp) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          pk.life = 0;
          sfx.pickup();
        } else if (pk.type === 'lunch') {
          this.player.applyLunch();
          pk.life = 0;
          sfx.pickup();
        }
      }
    }
    this.pickups = this.pickups.filter((p) => !p.dead);

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt);
    for (const p of this.particles) p.update(realDt);
    this.particles = this.particles.filter((p) => !p.dead);
    for (const b of this.boomFx) b.life -= realDt;
    this.boomFx = this.boomFx.filter((b) => b.life > 0);
    this.tickSpriteFx(realDt);

    // линейные удары босса (телеграф → удар → исчезновение)
    if (this.updateBossLineAttacks(realDt)) return;
  };

  Game.prototype.updateSaleHUD = function () {
    const p = this.player;
    if (!p) return;
    this.$hpFill.style.width = (100 * p.hp / p.maxHp) + '%';
    this.$hpText.textContent = `${p.hp}/${p.maxHp}`;
    this.$xpFill.style.width = (100 * this.saleXp / this.saleXpNext) + '%';
    this.$xpText.textContent = `${this.saleXp}/${this.saleXpNext}`;
    this.$level.textContent = this.saleLevel;
    this.$score.textContent = '🛒 ' + this.score;
    if (this.$coins) this.$coins.textContent = '🪙 ' + this.coins;

    const left = Math.max(0, SALE_DURATION - this.saleTime);
    const m = Math.floor(left / 60);
    const s = Math.floor(left % 60).toString().padStart(2, '0');
    this.$mode.textContent = `⏱ ${m}:${s}`;
    this.$mode.className = 'hud-mode ' + (left < 60 ? 'chase' : 'flee');

    // фаза LN-директора: босс N/6 / до следующего босса / волна·элита
    const bossN = SALE_BOSS_ORDER.length;
    const idx = this.saleBossIdx || 0;
    const aliveBoss = (this.enemies || []).find((e) => e.hp > 0 && e.saleBossId);
    let phaseTxt;
    if (aliveBoss) {
      const shown = Math.min(bossN, Math.max(1, idx));
      phaseTxt = `⚔ Босс ${shown}/${bossN} · ${aliveBoss.nameTag || 'Босс'}`;
    } else if (idx >= bossN) {
      phaseTxt = this.saleActiveEvent
        ? `📣 ${Math.ceil(this.saleActiveEvent.t)}с · финал`
        : '🔥 Финал забега';
    } else {
      const eta = Math.max(0, Math.ceil((this.saleBossT || 0) - (this.saleTime || 0)));
      const waveEta = Math.max(0, Math.ceil(this.saleWaveT || 0));
      const eliteReady = (this.saleTime || 0) >= SALE_ELITE_START;
      phaseTxt = `⏳ Босс ${idx + 1}/${bossN} через ${eta}с · волна ${waveEta}с`
        + (eliteReady ? ' · элита' : '');
      if (this.saleActiveEvent) {
        phaseTxt = `📣 ${Math.ceil(this.saleActiveEvent.t)}с · босс через ${eta}с`;
      }
    }
    this.$wave.textContent = phaseTxt;
    this.$enemies.textContent = `Убито: ${this.waveKills} · Врагов: ${this.enemies.length}`;

    if (this.$combo) this.$combo.style.display = 'none';

    this.tickSaleSynergyAnnounce();

    const tags = [];
    // слоты: базовое + эволюции считаются занятыми слотами билда
    const wepSlots = Object.keys(this.saleWeapons).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
    const maxSlots = this.saleMaxWeaponSlots();
    tags.push(`<span class="buff-tag good">⚔ ${wepSlots}/${maxSlots}</span>`);
    for (const syn of this.getActiveSaleSynergies()) {
      tags.push(`<span class="buff-tag syn" title="${syn.label}">🔗 ${syn.short || syn.label}</span>`);
    }
    if (this.saleRoleBan && this.saleRoleBan.t > 0) {
      const role = SALE_ROLE_LABEL[this.saleRoleBan.type] || this.saleRoleBan.type;
      tags.push(`<span class="buff-tag bad">🚫 ${role} ${this.saleRoleBan.t.toFixed(0)}с</span>`);
    }
    if ((this._saleShieldT || 0) > 0) {
      tags.push(`<span class="buff-tag good">🚧 блок</span>`);
    }
    const ovPower = (this.saleOverflow && this.saleOverflow.power) || 0;
    if (ovPower > 0) tags.push(`<span class="buff-tag good">💪 +${ovPower}</span>`);
    if (p.lunchTimer > 0) tags.push(`<span class="buff-tag good">☕ ${p.lunchTimer.toFixed(0)}с</span>`);
    if (this.saleActiveEvent) {
      const leftEv = Math.max(0, this.saleActiveEvent.t);
      tags.push(`<span class="buff-tag bad">📣 ${leftEv.toFixed(0)}с</span>`);
    }
    if (this.saleXpEventMul > 1.01) tags.push(`<span class="buff-tag good">✨ XP×${this.saleXpEventMul}</span>`);
    if (this.saleXpEventMul < 0.99) tags.push(`<span class="buff-tag bad">💸 XP×${this.saleXpEventMul}</span>`);
    if (this.saleWeaponDmgMul > 1.01) tags.push(`<span class="buff-tag good">⚔ урон×${this.saleWeaponDmgMul}</span>`);
    if (this.saleFragile) tags.push(`<span class="buff-tag bad">💔 хрупкий</span>`);
    if (this.lightsOut > 0) tags.push(`<span class="buff-tag bad">💡 темнота</span>`);
    if (this.fireAlarm > 0) tags.push(`<span class="buff-tag bad">🚨 тревога</span>`);
    if (this.saleInvulnExcept) tags.push(`<span class="buff-tag bad">📋 только ${this.saleInvulnExcept}</span>`);
    this.$buffBar.innerHTML = tags.join('');

    if (this.$skillFill) this.$skillFill.style.width = (100 * p.skill / p.skillMax) + '%';
    if (this.$chargeFill) this.$chargeFill.style.width = '0%';

    // HP-бар уникального босса ТЦ
    if (!this.$bossBar) {
      this.$bossBar = document.getElementById('sale-boss-bar');
      this.$bossName = document.getElementById('sale-boss-name');
      this.$bossFill = document.getElementById('sale-boss-fill');
    }
    if (this.$bossBar) {
      let boss = null;
      for (const e of this.enemies) {
        if (e.hp > 0 && e.saleBossId && (!boss || e.maxHp > boss.maxHp)) boss = e;
      }
      const show = !!boss && !this.inHub && !this.gameOver && !this.won;
      this.$bossBar.classList.toggle('show', show);
      if (show) {
        const def = SALE_BOSS_DEFS[boss.saleBossId];
        this.$bossName.textContent = `${def ? def.name : boss.nameTag || 'Босс'} · фаза ${boss.bossPhase || 1}`;
        this.$bossFill.style.width = (100 * boss.hp / Math.max(1, boss.maxHp)) + '%';
      }
    }

    // синхронизация кнопки скорости (дев-панель тоже меняет timescale)
    if (!this.$speedBtn) this.$speedBtn = document.getElementById('btn-speed');
    if (this.$speedBtn) {
      const ts = this.__saleTimeScale || 1;
      const label = ts > 1.01 ? `▶▶ ×${ts}` : '▶ ×1';
      if (this.$speedBtn.textContent !== label) this.$speedBtn.textContent = label;
    }
  };

  Game.prototype.renderSaleOverlays = function () {
    // вызывается внутри уже трансформированной камеры render()
    this.salePuddles = this.salePuddles || [];

    // босс-хазарды (ценники)
    for (const h of this.saleBossHazards || []) {
      if (h.kind !== 'pricetag') continue;
      const pulse = 0.75 + Math.sin(performance.now() / 120 + h.x) * 0.15;
      const a = Math.min(0.9, 0.35 + h.life * 0.12);
      ctx.save();
      // мягкая тонированная зона (Kenney) вместо плоского круга
      const drewZone = drawAnimFxFrame(ctx, 'kfx_circle', h.x, h.y, {
        scale: (h.r * pulse * 2.6) / 100, alpha: a * 0.85, tint: '#fbbf24',
      });
      if (!drewZone) {
        ctx.globalAlpha = a;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = Math.min(1, a + 0.2);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7c2d12';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('−70%', h.x, h.y);
      ctx.restore();
    }

    // телеграф рывка любого босса + метка
    for (const e of this.enemies || []) {
      if (!e.saleBossId || e.hp <= 0) continue;
      const def = SALE_BOSS_DEFS[e.saleBossId];
      if (e._saleChargeT > 0) {
        const len = 200;
        const col = def ? def.color : '#f59e0b';
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e._saleChargeAng) * len, e.y + Math.sin(e._saleChargeAng) * len);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        const flash = 0.3 + Math.sin(performance.now() / 120) * 0.2;
        drawAnimFxFrame(ctx, 'kfx_slash', e.x + Math.cos(e._saleChargeAng) * len * 0.55, e.y + Math.sin(e._saleChargeAng) * len * 0.55, {
          scale: 1.35, rot: e._saleChargeAng + Math.PI / 2, alpha: flash, tint: col,
        });
      }
      if (def) {
        ctx.save();
        ctx.strokeStyle = def.color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = def.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(def.tag, e.x, e.y - e.r - 20);
        ctx.restore();
      }
    }

    // телеграф «могил» / взрывов — цвет босса, тонкий контур (без красной заливки)
    for (const h of this.saleBossHazards || []) {
      if (h.kind !== 'grave' || h.boom) continue;
      const t = 1 - h.life / Math.max(0.01, h.warnMax || 1.15);
      const pulse = 0.55 + Math.abs(Math.sin(performance.now() / 140)) * 0.25;
      const col = h.color || '#f59e0b';
      const rr = h.r * (0.72 + 0.28 * t);
      ctx.save();
      ctx.globalAlpha = 0.22 + 0.2 * t;
      ctx.fillStyle = saleHexRgba(col, 0.14 + 0.1 * t);
      ctx.beginPath();
      ctx.arc(h.x, h.y, rr * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.45 + 0.35 * pulse * t;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(h.x, h.y, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // крест «зона» вместо кровавого пятна
      ctx.globalAlpha = 0.35 + 0.25 * t;
      ctx.lineWidth = 2;
      const cross = rr * 0.45;
      ctx.beginPath();
      ctx.moveTo(h.x - cross, h.y);
      ctx.lineTo(h.x + cross, h.y);
      ctx.moveTo(h.x, h.y - cross);
      ctx.lineTo(h.x, h.y + cross);
      ctx.stroke();
      ctx.restore();
    }

    // сжатие арены (Закрытие ТЦ)
    if (this.saleArenaShrink > 0.01) {
      const shrink = this.saleArenaShrink;
      const maxR = Math.min(this.worldW, this.worldH) * (0.48 - shrink * 0.25);
      ctx.save();
      ctx.strokeStyle = `rgba(251,146,60,${0.35 + shrink * 0.4})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(this.worldW / 2, this.worldH / 2, maxR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(124,45,18,0.12)';
      ctx.beginPath();
      ctx.rect(0, 0, this.worldW, this.worldH);
      ctx.arc(this.worldW / 2, this.worldH / 2, maxR, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      ctx.restore();
    }

    // временные стены охраны
    if (this.saleTempWalls && this.saleTempWalls.length) {
      for (const w of this.saleTempWalls) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.restore();
      }
    }

    // лужи (кофе / яд / кровь / пожар)
    const nowSec = performance.now() / 1000;
    for (const u of this.salePuddles) {
      const a = Math.min(0.55, 0.2 + u.life * 0.15);
      ctx.globalAlpha = a;
      ctx.fillStyle = u.color || '#d35400';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + 4, u.r * 0.95, u.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (u.hurtPlayer) {
        // живой огонь поверх горящей зоны
        drawAnimFxFrame(ctx, 'afx_fireloop', u.x, u.y - u.r * 0.35, {
          time: nowSec + u.x * 0.01, scale: (u.r * 2.2) / 100, alpha: Math.min(1, a * 2.2),
        });
      } else if (u.poison) {
        if (!drawAnimFxFrame(ctx, 'afx_bubbles', u.x, u.y - 4, {
          time: nowSec + u.y * 0.01, scale: (u.r * 2.4) / 100, alpha: 0.85,
        }) && typeof drawSpell === 'function') {
          drawSpell(ctx, 'sp_poison1', u.x, u.y, { scale: 0.45, anchorY: 0.5, alpha: 0.5 });
        }
      }
    }

    // громкоговоритель / ультразвук — постоянный пол-аура (LN censer)
    const floorAura = (this.saleWeapons && this.saleWeapons.ultrasound && this._saleUltraAuraR > 0)
      ? { r: this._saleUltraAuraR, label: 'УЗВ', fill0: 'rgba(56,189,248,0.2)', fill1: 'rgba(14,116,144,0.08)', fill2: 'rgba(8,47,73,0)', stroke: 'rgba(125,211,252,0.4)', text: 'rgba(186,230,253,0.55)' }
      : (this.saleWeapons && this.saleWeapons.speaker && this._salePromoAuraR > 0)
        ? { r: this._salePromoAuraR, label: 'АКЦИЯ', fill0: 'rgba(155,89,186,0.18)', fill1: 'rgba(120,60,160,0.08)', fill2: 'rgba(80,40,120,0)', stroke: 'rgba(241,196,15,0.35)', text: 'rgba(255,230,150,0.55)' }
        : null;
    if (floorAura && this.player) {
      const px = this.player.x;
      const py = this.player.y;
      const r = floorAura.r;
      const t = performance.now() / 1000;
      ctx.save();
      const g = ctx.createRadialGradient(px, py, r * 0.1, px, py, r);
      g.addColorStop(0, floorAura.fill0);
      g.addColorStop(0.55, floorAura.fill1);
      g.addColorStop(1, floorAura.fill2);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = floorAura.stroke;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 11px "Segoe UI",sans-serif';
      ctx.fillStyle = floorAura.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) {
        const a = t * 1.1 + (i * Math.PI * 2) / 3;
        ctx.fillText(floorAura.label, px + Math.cos(a) * r * 0.72, py + Math.sin(a) * r * 0.72);
      }
      ctx.restore();
    }

    // пульс ауры / волна новы
    if (this._saleAura) {
      const max = this._saleAura.max || 0.4;
      const k = 1 - Math.max(0, this._saleAura.t) / max;
      const wave = Math.sin(Math.min(1, Math.max(0, k)) * Math.PI);
      if (this._saleAura.promo) {
        ctx.save();
        ctx.globalAlpha = 0.45 * wave;
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this._saleAura.r * (0.55 + 0.5 * k), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        const alpha = Math.min(0.9, this._saleAura.t * 5);
        ctx.strokeStyle = `rgba(155,89,186,${0.35 * alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this._saleAura.r, 0, Math.PI * 2);
        ctx.stroke();
        if (this._saleAura.ico) {
          drawSaleIcon(ctx, this._saleAura.ico, this.player.x, this.player.y - this._saleAura.r * 0.25, 0.7, 0);
        }
      }
    }

    // кольца сирены
    for (const ring of this.saleRings || []) {
      const a = 1 - ring.r / Math.max(1, ring.maxR);
      ctx.save();
      ctx.globalAlpha = 0.55 * a;
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // швабры (sword)
    for (const sw of this.saleSwords || []) {
      drawSaleIcon(ctx, sw.ico || '🧹', sw.x, sw.y, (sw.size || 1) * 0.85, sw.ang || 0);
    }
    if (this._saleNova) {
      const alpha = Math.min(1, this._saleNova.t * 4);
      if (!(typeof drawSpell === 'function' && drawSpell(ctx, 'sp_fwave3', this.player.x, this.player.y, {
        scale: Math.min(0.55, (this._saleNova.r / 200) * (1 + (0.28 - this._saleNova.t))),
        anchorY: 0.5, alpha,
      }))) {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this._saleNova.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // XP-дропы: выпавшие товары (Pixel Mart), тир по ценности гема
    for (const g of this.xpGems || []) {
      const bob = Math.sin(performance.now() / 180 + g.x * 0.05) * 2;
      if (!g.ico && window.MART_TIERS) {
        const tier = (g.value || 1) >= 6 ? '3' : (g.value || 1) >= 3 ? '2' : '1';
        const list = window.MART_TIERS[tier] || [];
        if (list.length) g.ico = list[Math.floor(Math.random() * list.length)];
      }
      const size = 16 + Math.min(10, (g.value || 1) * 2);
      let drawn = false;
      if (g.ico && typeof drawMartIcon === 'function') {
        // мягкая тень, чтобы товар читался на полу
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(g.x, g.y + bob + size * 0.42, size * 0.4, size * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawn = drawMartIcon(ctx, g.ico, g.x, g.y + bob, { targetSize: size });
      }
      if (!drawn) {
        const sc = 0.18 + Math.min(0.12, (g.value || 1) * 0.03);
        if (!drawVfx(ctx, 'fx_crystal', g.x, g.y + bob, { scale: sc, anchorY: 0.85, alpha: 0.95 })) {
          ctx.fillStyle = '#2ecc71';
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // пауэрапы (посылка / магнит / хлопушка)
    for (const pu of this.salePowerups || []) {
      const def = SALE_POWERUPS[pu.kind];
      if (!def) continue;
      const bob = Math.sin(performance.now() / 220 + pu.x * 0.03) * 3;
      const pulse = 1 + Math.sin(performance.now() / 180) * 0.1;
      const alpha = pu.life < 3 ? Math.max(0.25, pu.life / 3) : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y + bob, (pu.r + 6) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      const drewSprite = def.sprite && typeof drawMartIcon === 'function'
        && drawMartIcon(ctx, def.sprite, pu.x, pu.y + bob, { targetSize: Math.round(30 * pulse) });
      if (!drewSprite) {
        const s = Math.round(24 * pulse);
        ctx.font = `${s}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(def.ico, pu.x, pu.y + bob);
        ctx.fillText(def.ico, pu.x, pu.y + bob);
      }
      ctx.restore();
    }

    // вихрь промо-магнита вокруг игрока
    if ((this.saleVacuumT || 0) > 0 && this.player) {
      drawAnimFxFrame(ctx, 'afx_vortex', this.player.x, this.player.y, {
        time: performance.now() / 1000, scale: 1.5,
        alpha: Math.min(0.9, this.saleVacuumT * 1.4),
      });
    }

    // цифры урона
    if (this.showDmgNumbers !== false) {
      for (const dn of this.saleDmgNums || []) {
        const t = Math.max(0, dn.life / dn.max);
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 2.5);
        ctx.font = dn.big ? 'bold 15px sans-serif' : 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.fillStyle = dn.big ? '#f1c40f' : '#fff';
        ctx.strokeText(dn.txt, dn.x, dn.y);
        ctx.fillText(dn.txt, dn.x, dn.y);
        ctx.restore();
      }
    }

    // орбиты — чеки / швабра / лента
    for (const o of this.saleOrbits || []) {
      const rot = o.angle + performance.now() / 180;
      const sc = (o.size || 1) * 0.85;
      const vis = o.visual || o.weaponId || 'receipt';
      ctx.globalAlpha = 0.28;
      drawSaleIcon(ctx, o.ico || '🧾', o.x - Math.cos(o.angle) * 10, o.y - Math.sin(o.angle) * 10, sc * 0.7, rot - 0.4, vis, 1);
      ctx.globalAlpha = 1;
      drawSaleIcon(ctx, o.ico || '🧾', o.x, o.y, sc, rot, vis, 2);
    }

    // лучи (фонарик / охотник)
    for (const b of this.saleBeams || []) {
      const x1 = this.player.x, y1 = this.player.y;
      const x2 = b.x2 != null ? b.x2 : x1 + Math.cos(b.angle) * b.length;
      const y2 = b.y2 != null ? b.y2 : y1 + Math.sin(b.angle) * b.length;
      const grd = ctx.createLinearGradient(x1, y1, x2, y2);
      grd.addColorStop(0, 'rgba(255,230,120,0.12)');
      grd.addColorStop(0.4, 'rgba(255,210,60,0.4)');
      grd.addColorStop(1, 'rgba(255,250,200,0.04)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = Math.max(5, b.width * 0.35);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,220,0.75)';
      ctx.lineWidth = Math.max(2, b.width * 0.12);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawSaleIcon(ctx, '🔦', x1 + Math.cos(b.angle) * 14, y1 + Math.sin(b.angle) * 14, 0.65, b.angle, 'flashlight', 2);
    }

    // бумеранги (карта)
    for (const b of this.saleBoomerangs || []) {
      const spin = performance.now() / 90;
      drawSaleIcon(ctx, b.ico || '💳', b.x, b.y, (b.size || 1) * 0.8, spin, b.visual || 'card', 2);
    }

    // заряды (тележка / магнит)
    for (const c of this.saleCharges || []) {
      drawSaleIcon(ctx, c.ico || '🛒', c.x, c.y, (c.size || 1.1) * 0.9, c.angle, c.visual || 'cart', 2);
      if (c.pull) {
        ctx.strokeStyle = 'rgba(155,89,186,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.pull * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // самонаводящиеся (мыши)
    for (const s of this.saleSeekers || []) {
      const batStage = 1 + (Math.floor(performance.now() / 120) % 3);
      drawSaleIcon(ctx, s.ico || '🦇', s.x, s.y, 0.7, s.angle || 0, s.visual || 'bats', batStage);
    }

    // снаряды (телефон / кофе / пакет / прайс)
    for (const pr of this.saleProjectiles || []) {
      const age = pr.born ? (performance.now() - pr.born) / 1000 : 0.5;
      const st = age < 0.08 ? 1 : 2;
      drawSaleIcon(ctx, pr.ico || '📱', pr.x, pr.y, 0.75, pr.angle + performance.now() / 140, pr.visual, st);
    }

    // обед / щит
    if (this.player.lunchTimer > 0) {
      drawVfx(ctx, 'fx_aura_gold', this.player.x, this.player.y, {
        scale: 0.4 + Math.sin(performance.now() / 120) * 0.04,
        anchorY: 0.7,
        alpha: 0.5,
      });
    } else if (this.player.invincible > 0.2) {
      if (!(typeof drawSpell === 'function' && drawSpell(ctx, 'sp_shield2', this.player.x, this.player.y - 4, {
        scale: 0.32, anchorY: 0.55, alpha: 0.45,
      }))) {
        drawVfx(ctx, 'fx_shield', this.player.x, this.player.y - 4, {
          scale: 0.32, anchorY: 0.55, alpha: 0.4,
        });
      }
    }

    // маркеры инвентаризации / VIP
    if (this.saleInvulnExcept || this.saleVipRef) {
      for (const e of this.enemies || []) {
        if (e.hp <= 0) continue;
        if (e._saleVip) {
          ctx.save();
          ctx.strokeStyle = 'rgba(241,196,15,0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r + 14 + Math.sin(performance.now() / 140) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (e._saleInvuln) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = '#7f8c8d';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        } else if (this.saleInvulnExcept && e.type === this.saleInvulnExcept) {
          ctx.save();
          ctx.strokeStyle = 'rgba(46,204,113,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  };

  /** Экранные оверлеи Sale (после restore камеры): стрелка на босса за экраном */
  Game.prototype.renderSaleScreenUI = function () {
    if (this.inHub || this.gameOver || this.won || !this.player) return;
    const cam = this._renderCam;
    if (!cam) return;
    for (const e of this.enemies || []) {
      if (e.hp <= 0 || !e.saleBossId) continue;
      const def = SALE_BOSS_DEFS[e.saleBossId];
      if (!def) continue;
      const sx = (e.x - cam.x) * cam.z;
      const sy = (e.y - cam.y) * cam.z;
      const pad = 26;
      if (sx > -pad && sx < this.W + pad && sy > -pad && sy < this.H + pad) continue;
      // босс за экраном — стрелка у края
      const edge = 46;
      const ax = Math.max(edge, Math.min(this.W - edge, sx));
      const ay = Math.max(edge + 40, Math.min(this.H - edge, sy));
      const ang = Math.atan2(sy - ay, sx - ax);
      const pulse = 1 + Math.sin(performance.now() / 160) * 0.12;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = def.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16 * pulse, 0);
      ctx.lineTo(-8 * pulse, -10 * pulse);
      ctx.lineTo(-8 * pulse, 10 * pulse);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.rotate(-ang);
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(def.tag, 0, 22);
      ctx.fillText(def.tag, 0, 22);
      ctx.restore();
    }
  };

  Game.prototype.endSaleGame = function (won, killer) {
    this.gameOver = !won;
    this.won = won;
    this.killedBy = killer || '';
    this.paused = true;
    const isNew = this.score > this.highScore;
    if (isNew) this.highScore = this.score;

    const survived = Math.min(SALE_DURATION, this.saleTime);
    const mins = Math.floor(survived / 60);
    const secs = Math.floor(survived % 60);
    let bankGain = Math.floor(this.coins * 0.4) + Math.floor(survived / 30) + (won ? 40 : Math.floor(survived / 60) * 3);
    bankGain = Math.floor(bankGain * (1 + (this.salePassives.wallet || 0) * 0.1));
    const contractMul = (this.saleContract && this.saleContract.coinMul) || 1;
    bankGain = Math.floor(bankGain * contractMul);
    this.bankCoins += bankGain;
    this.persist();

    document.getElementById('end-title').textContent = won ? '🛒 Распродажа закрыта!' : '💀 Вас растоптали';
    document.getElementById('end-sub').textContent = won
      ? `Продержался 20:00. В банк: +${bankGain}🪙`
      : `${killer ? 'Причина: ' + killer + '. ' : ''}Время ${mins}:${String(secs).padStart(2, '0')}. В банк: +${bankGain}🪙`;
    document.getElementById('end-score').textContent = this.score + ` · 🪙 ${this.coins}`;
    document.getElementById('end-wave').textContent = `ур.${this.saleLevel}`;
    document.getElementById('end-combo').textContent = this.waveKills;
    document.getElementById('end-record').textContent = this.highScore;
    document.getElementById('end-newrec').style.display = isNew ? 'inline' : 'none';
    const cl = document.getElementById('end-challenge-line');
    if (cl) cl.textContent = `Режим: Распродажа · оружий: ${Object.keys(this.saleWeapons).length}`;
    document.getElementById('end-overlay').classList.add('show');
    this.refreshMusicState();
    if (won) sfx.win(); else sfx.lose();
    this.vibrate(won ? [40, 40, 80] : 80);
  };

  // expose for debugging / hub
  window.SALE_WEAPONS = SALE_WEAPONS;
  window.SALE_BOSS_DEFS = SALE_BOSS_DEFS;
  window.SALE_PASSIVES = SALE_PASSIVES;
  window.SALE_HEROES = SALE_HEROES;
  window.SALE_DURATION = SALE_DURATION;
  window.SALE_HUB_WEAPON_COST = SALE_HUB_WEAPON_COST;
  window.SALE_EVENT_POOLS = SALE_EVENT_POOLS;
  window.SALE_HUB_PASSIVES = SALE_HUB_PASSIVES;
  window.SALE_WEAPON_MIGRATE = SALE_WEAPON_MIGRATE;
  window.SALE_FLOORS = SALE_FLOORS;
  window.SALE_CONTRACTS = SALE_CONTRACTS;
  window.SALE_EVOLUTIONS = SALE_EVOLUTIONS;
  window.SALE_SYNERGIES = SALE_SYNERGIES;

  Game.prototype.renderSaleHubLoadout = function () {
    const heroBox = document.getElementById('hub-sale-heroes');
    if (heroBox) {
      heroBox.innerHTML = '';
      if (!this.selectedHeroId || !SALE_HEROES[this.selectedHeroId]) this.selectedHeroId = 'lena';
      for (const hero of Object.values(SALE_HEROES)) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (this.selectedHeroId === hero.id ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${hero.ico} ${hero.name}</div>
          <div class="desc">${hero.desc}</div>
          <div class="meta">${this.selectedHeroId === hero.id ? 'Выбран' : 'Выбрать'}</div>`;
        el.onclick = () => {
          this.selectedHeroId = hero.id;
          this.persist();
          this.renderHub();
          sfx.click();
        };
        heroBox.appendChild(el);
      }
    }

    const floorBox = document.getElementById('hub-sale-floors');
    if (floorBox) {
      floorBox.innerHTML = '';
      if (!this.selectedFloorId) this.selectedFloorId = 'grocery';
      for (const fl of SALE_FLOORS) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (this.selectedFloorId === fl.id ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${fl.ico} ${fl.name}</div>
          <div class="desc">${fl.desc}</div>
          <div class="meta">${this.selectedFloorId === fl.id ? 'Выбран' : 'Выбрать'}</div>`;
        el.onclick = () => {
          this.selectedFloorId = fl.id;
          this.persist();
          this.renderHub();
          sfx.click();
        };
        floorBox.appendChild(el);
      }
    }

    const contractBox = document.getElementById('hub-sale-contracts');
    if (contractBox) {
      contractBox.innerHTML = '';
      if (!this.selectedContractId) this.selectedContractId = 'none';
      for (const c of SALE_CONTRACTS) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (this.selectedContractId === c.id ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${c.ico} ${c.name}</div>
          <div class="desc">${c.desc}</div>
          <div class="meta">${this.selectedContractId === c.id ? 'Активен' : 'Выбрать'} · ×${c.coinMul}</div>`;
        el.onclick = () => {
          this.selectedContractId = c.id;
          this.persist();
          this.renderHub();
          sfx.click();
        };
        contractBox.appendChild(el);
      }
    }

    const wepBox = document.getElementById('hub-sale-weapons');
    if (wepBox) {
      wepBox.innerHTML = '';
      const startP = this.saleStartPassives || {};
      const evoHint = (wid) => {
        const tips = [];
        for (const ev of SALE_EVOLUTIONS) {
          if (ev.from !== wid) continue;
          if (startP[ev.needPassive] > 0) tips.push('откроет «' + ev.name + '»');
        }
        return tips.length ? ' · ' + tips.join(' / ') : '';
      };
      for (const def of Object.values(SALE_WEAPONS)) {
        if (def.evolved) continue;
        const owned = (this.saleUnlockedWeapons || []).includes(def.id);
        const cost = SALE_HUB_WEAPON_COST[def.id];
        const role = SALE_ROLE_LABEL[def.type] || def.type;
        const hint = evoHint(def.id);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (owned ? ' sel' : '') + (hint ? ' hot' : '');
        if (def.id === 'receipt') {
          el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc} · ${role}${hint}</div>
            <div class="meta">Всегда в ассортименте</div>`;
          el.disabled = true;
        } else {
          el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc} · ${role}${hint}</div>
            <div class="meta">${owned ? 'В ассортименте забега' : ('Купить в ассортимент 🪙 ' + cost)}</div>`;
          if (!owned) {
            el.onclick = () => this.buySaleWeaponUnlock(def.id);
          }
        }
        wepBox.appendChild(el);
      }
    }

    const pasBox = document.getElementById('hub-sale-passives');
    if (pasBox) {
      pasBox.innerHTML = '';
      for (const pk of SALE_HUB_PASSIVES) {
        const lv = (this.saleStartPassives && this.saleStartPassives[pk.id]) || 0;
        const nextCost = lv >= pk.max ? null : pk.cost[lv];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (lv > 0 ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${pk.ico} ${pk.name} · ${lv}/${pk.max}</div>
          <div class="desc">${pk.desc}</div>
          <div class="meta">${nextCost == null ? 'Макс' : 'Купить 🪙 ' + nextCost}</div>`;
        el.onclick = () => this.buySaleStartPassive(pk.id);
        pasBox.appendChild(el);
      }
    }

    const ar = document.getElementById('hub-sale-arenas');
    if (ar && typeof ARENA_THEMES !== 'undefined') {
      ar.innerHTML = '';
      for (const th of Object.values(ARENA_THEMES)) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (this.selectedArena === th.id ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${th.ico} ${th.name}</div><div class="desc">Арена распродажи</div>`;
        el.onclick = () => {
          this.selectedArena = th.id;
          this.persist();
          this.prepareIdleWorld();
          this.renderHub();
          sfx.click();
        };
        ar.appendChild(el);
      }
    }
  };

  Game.prototype.buySaleWeaponUnlock = function (id) {
    if (id === 'receipt' || SALE_WEAPONS[id]?.evolved) return;
    if (!SALE_WEAPONS[id]) return;
    if (!this.saleUnlockedWeapons) this.saleUnlockedWeapons = ['receipt'];
    if (this.saleUnlockedWeapons.includes(id)) return;
    const cost = SALE_HUB_WEAPON_COST[id];
    if (cost == null) return;
    if (this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.saleUnlockedWeapons.push(id);
    this.persist();
    this.renderHub();
    sfx.shop();
  };

  Game.prototype.buySaleStartPassive = function (id) {
    const pk = SALE_HUB_PASSIVES.find((p) => p.id === id);
    if (!pk) return;
    if (!this.saleStartPassives) this.saleStartPassives = {};
    const lv = this.saleStartPassives[id] || 0;
    if (lv >= pk.max) return;
    const cost = pk.cost[lv];
    if (this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.saleStartPassives[id] = lv + 1;
    this.persist();
    this.renderHub();
    sfx.shop();
  };

  // ─── Debug API + UI panel (по мотивам LONG NIGHT) ─────────────
  function fmtSaleClock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return m + ':' + s;
  }

  function saleDevEnsureRun() {
    const g = window.game;
    if (!g) return null;
    if (g.inHub || g.gameMode !== 'sale' || !g.player) {
      g.gameMode = 'sale';
      g.startShiftFromHub();
      g.__god = true;
    }
    return g;
  }

  function buildSaleDevPanel() {
    const panel = document.getElementById('sale-dev-panel');
    if (!panel) return;
    const g = window.game;
    const bq = (act, arg, label) =>
      `<button type="button" class="dvb" data-act="${act}"${arg != null ? ` data-arg="${arg}"` : ''}>${label}</button>`;
    const H = (t) => `<div class="dvh">${t}</div>`;
    const R = (s) => `<div class="dvrow">${s}</div>`;
    const enemyTypes = ['normal', 'fast', 'tank', 'fatty', 'manager', 'returner', 'boss', 'director', 'miniboss'];
    const wepIds = Object.keys(SALE_WEAPONS).filter((id) => !SALE_WEAPONS[id].evolved);
    const info = g
      ? `t=${fmtSaleClock(g.saleTime)} · lv=${g.saleLevel || 0} · 🪙${g.coins || 0} · mobs=${(g.enemies || []).filter((e) => e.hp > 0).length} · god=${g.__god ? 'ON' : 'off'} · ×${g.__saleTimeScale || 1}`
      : 'game не готов';
    panel.innerHTML =
      bq('close', null, '✕ закрыть') +
      `<h3>DEV · Распродажа · v${SALE_VERSION}</h3>` +
      `<div id="sale-dev-info">${info}</div>` +
      H('Старт') +
      R(bq('start', null, 'старт / рестарт') + bq('hub', null, 'в хаб')) +
      H('Время') +
      R(
        bq('warp', 60, '+1 мин') +
          bq('warp', 180, '+3 мин') +
          bq('warp', 600, '+10 мин') +
          bq('warpto', 0, '0:00') +
          bq('warpto', 300, '5:00') +
          bq('warpto', 900, '15:00'),
      ) +
      H('Скорость') +
      R(bq('ts', 0.5, '0.5×') + bq('ts', 1, '1×') + bq('ts', 2, '2×') + bq('ts', 3, '3×')) +
      H('Прокачка') +
      R(bq('lvl', 1, '+1 ур') + bq('lvl', 5, '+5 ур') + bq('gold', 500, '+500 🪙') + bq('bank', 1000, '+1000 банк')) +
      H('Читы') +
      R(bq('god', null, 'бог-мод') + bq('heal', null, 'хил') + bq('killall', null, 'убить всех') + bq('killself', null, 'убить себя')) +
      H('Спавн ×15') +
      R(enemyTypes.map((t) => bq('spawn', t, t)).join('')) +
      H('Боссы ТЦ') +
      R(
        bq('boss', 'discount_king', 'Король скидок') +
          bq('boss', 'security_chief', 'Охрана') +
          bq('boss', 'mall_closing', 'Закрытие ТЦ'),
      ) +
      H('Пауэрапы') +
      R(
        bq('powerup', 'chest', '📦 посылка') +
          bq('powerup', 'magnet', '🧲 магнит') +
          bq('powerup', 'bomb', '🧨 хлопушка') +
          bq('powerup', 'heart', '❤️ сердце'),
      ) +
      H('Оружие +1') +
      R(wepIds.map((id) => bq('wpn', id, SALE_WEAPONS[id].ico + ' ' + SALE_WEAPONS[id].name)).join(''));
  }

  function saleDevAction(act, arg) {
    const g = window.game;
    const info = (msg) => {
      const el = document.getElementById('sale-dev-info');
      if (el) el.textContent = msg;
    };
    switch (act) {
      case 'close':
        toggleSaleDev(false);
        break;
      case 'start':
        saleDevEnsureRun();
        toggleSaleDev(false);
        break;
      case 'hub':
        if (g) {
          g.__saleDevOpen = false;
          g.openHub();
        }
        toggleSaleDev(false);
        break;
      case 'warp': {
        const run = saleDevEnsureRun();
        if (!run) break;
        run.saleTime = Math.min(SALE_DURATION - 1, (run.saleTime || 0) + (+arg || 0));
        info(`время ${fmtSaleClock(run.saleTime)}`);
        break;
      }
      case 'warpto': {
        const run = saleDevEnsureRun();
        if (!run) break;
        run.saleTime = Math.max(0, Math.min(SALE_DURATION - 1, +arg || 0));
        info(`время ${fmtSaleClock(run.saleTime)}`);
        break;
      }
      case 'ts':
        if (g) {
          g.__saleTimeScale = +arg || 1;
          info(`скорость ×${g.__saleTimeScale}`);
        }
        break;
      case 'lvl': {
        const run = saleDevEnsureRun();
        if (!run) break;
        const n = Math.max(1, +arg || 1);
        for (let i = 0; i < n; i++) run.gainSaleXp(run.saleXpNext || 99);
        info(`уровень ${run.saleLevel}`);
        break;
      }
      case 'gold': {
        if (!g) break;
        g.coins = (g.coins || 0) + (+arg || 0);
        info(`монеты забега ${g.coins}`);
        break;
      }
      case 'bank': {
        if (!g) break;
        g.bankCoins = (g.bankCoins || 0) + (+arg || 0);
        g.persist && g.persist();
        g.renderHub && g.inHub && g.renderHub();
        info(`банк ${g.bankCoins}`);
        break;
      }
      case 'god': {
        const run = saleDevEnsureRun();
        if (!run) break;
        run.__god = !run.__god;
        if (run.__god && run.player) run.player.hp = run.player.maxHp;
        info(`бог-мод ${run.__god ? 'ON' : 'off'}`);
        break;
      }
      case 'heal': {
        const run = saleDevEnsureRun();
        if (run && run.player) {
          run.player.hp = run.player.maxHp;
          info('хил full');
        }
        break;
      }
      case 'killall': {
        const run = window.game;
        if (!run || !run.enemies) break;
        for (const e of run.enemies) e.hp = 0;
        run.enemies = run.enemies.filter((e) => e.hp > 0);
        info('враги очищены');
        break;
      }
      case 'killself': {
        const run = window.game;
        if (!run || !run.player) break;
        run.__god = false;
        run.player.hp = 0;
        run.endSaleGame(false);
        toggleSaleDev(false);
        break;
      }
      case 'spawn': {
        const run = saleDevEnsureRun();
        if (!run) break;
        for (let i = 0; i < 15; i++) run.spawnSaleEnemy(arg || null);
        info(`спавн ${arg} ×15`);
        break;
      }
      case 'boss': {
        const run = saleDevEnsureRun();
        if (!run || !arg || !SALE_BOSS_DEFS[arg]) break;
        run.saleBossSpawned = run.saleBossSpawned || {};
        run.saleBossSpawned[arg] = false;
        const b = run.spawnSaleBoss(arg, { near: true });
        info(b ? `босс ${SALE_BOSS_DEFS[arg].name}` : 'не удалось заспавнить');
        break;
      }
      case 'powerup': {
        const run = saleDevEnsureRun();
        if (!run || !run.player) break;
        run.spawnSalePowerup(run.player.x + 60, run.player.y, arg || 'chest');
        info(`пауэрап ${arg}`);
        break;
      }
      case 'wpn': {
        const run = saleDevEnsureRun();
        if (!run || !arg || !SALE_WEAPONS[arg]) break;
        const max = SALE_WEAPONS[arg].max || 5;
        run.saleWeapons = run.saleWeapons || {};
        run.saleWeapons[arg] = Math.min(max, (run.saleWeapons[arg] || 0) + 1);
        info(`${SALE_WEAPONS[arg].name} lv${run.saleWeapons[arg]}`);
        break;
      }
      default:
        break;
    }
  }

  function toggleSaleDev(on) {
    const panel = document.getElementById('sale-dev-panel');
    if (!panel) return;
    const g = window.game;
    const show = on === true || (on == null && !panel.classList.contains('show'));
    if (show) {
      buildSaleDevPanel();
      panel.classList.add('show');
      panel.setAttribute('aria-hidden', 'false');
      if (g) {
        g.__saleDevOpen = true;
        g.__saleDevPaused = !g.paused && !g.inHub;
        if (g.__saleDevPaused) g.paused = true;
      }
    } else {
      panel.classList.remove('show');
      panel.setAttribute('aria-hidden', 'true');
      if (g) {
        g.__saleDevOpen = false;
        if (g.__saleDevPaused) {
          g.paused = false;
          g.__saleDevPaused = false;
        }
      }
    }
  }

  function bindSaleDevUi() {
    const syncVer = () => {
      const label = 'v' + SALE_VERSION;
      const hub = document.getElementById('hub-version');
      const corner = document.getElementById('sale-ver-corner');
      if (hub) hub.textContent = label;
      if (corner) corner.textContent = label;
    };
    syncVer();
    const open = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSaleDev(true);
    };
    const hub = document.getElementById('hub-version');
    const corner = document.getElementById('sale-ver-corner');
    if (hub) {
      hub.addEventListener('click', open);
      hub.addEventListener('touchend', open, { passive: false });
    }
    if (corner) {
      corner.addEventListener('click', open);
      corner.addEventListener('touchend', open, { passive: false });
    }
    const panel = document.getElementById('sale-dev-panel');
    if (panel) {
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        saleDevAction(b.dataset.act, b.dataset.arg);
      });
    }
    window.toggleSaleDev = toggleSaleDev;

    // кнопки бан / скип на левел-апе
    const banBtn = document.getElementById('btn-upgrade-banish');
    if (banBtn) banBtn.onclick = () => {
      const g = window.game;
      if (g && typeof g.toggleSaleBanish === 'function') g.toggleSaleBanish();
    };
    const skipBtn = document.getElementById('btn-upgrade-skip');
    if (skipBtn) skipBtn.onclick = () => {
      const g = window.game;
      if (g && typeof g.skipSaleUpgrade === 'function') g.skipSaleUpgrade();
    };

    // кнопка скорости ×1.5 в HUD
    const speedBtn = document.getElementById('btn-speed');
    if (speedBtn) speedBtn.onclick = () => {
      const g = window.game;
      if (!g) return;
      g.__saleTimeScale = (g.__saleTimeScale || 1) > 1.01 ? 1 : 1.5;
      speedBtn.textContent = g.__saleTimeScale > 1.01 ? `▶▶ ×${g.__saleTimeScale}` : '▶ ×1';
      if (typeof sfx !== 'undefined') sfx.click();
    };
  }

  window.__sale = {
    version: () => SALE_VERSION,
    start: () => saleDevEnsureRun(),
    warp: (sec) => {
      const g = saleDevEnsureRun();
      if (!g) return;
      g.saleTime = Math.max(0, Number(sec) || 0);
    },
    god: (on) => {
      const g = saleDevEnsureRun();
      if (!g) return;
      g.__god = on !== false;
      if (g.__god && g.player) g.player.hp = g.player.maxHp;
    },
    spawn: (type, n) => {
      const g = saleDevEnsureRun();
      if (!g) return;
      const count = Math.max(1, Number(n) || 1);
      for (let i = 0; i < count; i++) g.spawnSaleEnemy(type || null);
    },
    boss: (id) => {
      const g = saleDevEnsureRun();
      if (!g) return null;
      const key = id || 'discount_king';
      if (!SALE_BOSS_DEFS[key]) return null;
      g.saleBossSpawned = g.saleBossSpawned || {};
      g.saleBossSpawned[key] = false;
      return g.spawnSaleBoss(key, { near: true });
    },
    levelup: () => {
      const g = saleDevEnsureRun();
      if (!g) return;
      g.gainSaleXp(g.saleXpNext || 99);
    },
    gold: (n) => {
      const g = window.game;
      if (!g) return;
      g.coins = Math.max(0, Number(n) || 0);
      g.bankCoins = Math.max(g.bankCoins || 0, g.coins);
      g.persist && g.persist();
      g.renderHub && g.inHub && g.renderHub();
    },
    clearEnemies: () => saleDevAction('killall'),
    count: () => {
      const g = window.game;
      if (!g) return null;
      return {
        enemies: (g.enemies || []).filter((e) => e.hp > 0).length,
        time: g.saleTime || 0,
        level: g.saleLevel || 0,
        coins: g.coins || 0,
      };
    },
    warm: (t) => ({ enemy: saleWarmMul(t || 0), coin: saleCoinWarmMul(t || 0) }),
    panel: (on) => toggleSaleDev(on),
  };
  window.__game = window.__sale;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSaleDevUi);
  } else {
    bindSaleDevUi();
  }
})();
