/**
 * Распродажа: Таблица оружия Распродажи и миграция старых id.
 */
'use strict';

/**
 * Оружия Распродажи — LN-роли + mall extras (турникет/ценник/радио/пакет).
 * Бюджет ST-DPS по ролям — docs/SALE_BALANCE_V2.md. Эво ≤ 1.7× базы за счёт паттерна, не сырого dmg.
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
  // orbit → чек (как LN blades: меньше штук, общий orbT на враге)
  receipt: {
    id: 'receipt', name: 'Чек', ico: '🧾', max: 5,
    desc: 'Чеки крутятся вокруг и режут толпу',
    type: 'orbit', evolve: 'endless_receipt',
    baseCd: 0.1, dmg: [1, 1, 1, 1, 2], count: [2, 3, 3, 4, 5], radius: [52, 60, 68, 78, 88],
    spin: 2.7, visual: 'receipt',
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
    desc: 'Два луча крутятся вокруг тебя — ты в центре «лампы»',
    type: 'nova', evolve: 'mall_fire',
    baseCd: 1.9, dmg: [2, 2, 3, 3, 4], radius: [110, 130, 155, 180, 210],
    visual: 'siren', knock: 220, impact: 'sp_fwave2', spinWedges: true,
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
    baseCd: 0.12, dmg: [1, 1, 1, 1, 2], count: [2, 2, 2, 3, 3], radius: [64, 72, 80, 90, 100],
    spin: 2.3, visual: 'giftbag', explodeHit: true, size: 1.0,
  },

  // ── эволюции ──
  endless_receipt: {
    id: 'endless_receipt', name: 'Бесконечный чек', ico: '📜', max: 1,
    desc: 'Плотная лента чеков вокруг',
    type: 'orbit', evolved: true,
    baseCd: 0.08, dmg: [2], count: [7], radius: [92], spin: 4.0, visual: 'endless_receipt', size: 1.1,
  },
  receipt_return: {
    id: 'receipt_return', name: 'Возврат чека', ico: '↩️', max: 1,
    desc: 'Орбиты + периодический залп чеков наружу',
    type: 'orbit', evolved: true,
    baseCd: 0.1, dmg: [2], count: [5], radius: [86], spin: 3.4, visual: 'endless_receipt',
    size: 1.05, volleyOut: true, volleyCd: 2.0,
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
    baseCd: 0.1, dmg: [2], count: [5], radius: [96], spin: 3.0, visual: 'giftbag',
    explodeHit: true, size: 1.15,
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
