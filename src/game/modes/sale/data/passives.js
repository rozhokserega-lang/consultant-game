/**
 * Распродажа: ключи эволюций (один уровень). Активны только у взятых баз.
 */
'use strict';

const SALE_PASSIVES = {
  mug: { id: 'mug', name: 'Банка энергетика', ico: '🥫', max: 1, weapon: 'coffee', desc: '+1 макс HP · ключ: Холодный латте' },
  energy: { id: 'energy', name: 'Кофеиновый шот', ico: '⚡', max: 1, weapon: 'coffee', desc: '−6% КД · ключ: КОФЕИН' },
  printer: { id: 'printer', name: 'Чековый аппарат', ico: '🖨️', max: 1, weapon: 'receipt', desc: '+6% область · ключ: Бесконечный чек' },
  pouch: { id: 'pouch', name: 'Поясная сумка', ico: '👝', max: 1, weapon: 'receipt', desc: '+1 снаряд · ключ: Возврат чека' },
  spray: { id: 'spray', name: 'Спрей', ico: '🧴', max: 1, weapon: 'mop', desc: '+6% урона швабры и яд · ключ: Уборщица' },
  gloves: { id: 'gloves', name: 'Перчатки грузчика', ico: '🧤', max: 1, weapon: 'mop', desc: '+8% область · ключ: Мокрый пол' },
  charger: { id: 'charger', name: 'Зарядка', ico: '🔌', max: 1, weapon: 'phone', desc: '−6% КД · ключ: Смартфон 5G' },
  headphones: { id: 'headphones', name: 'Наушники', ico: '🎧', max: 1, weapon: 'speaker', desc: '+12% урона аур · ключ: Ультразвук' },
  money: { id: 'money', name: 'Деньги', ico: '💰', max: 1, weapon: 'card', desc: '+12% монет · ключ: Чёрная карта' },
  badge: { id: 'badge', name: 'Бейдж', ico: '🪪', max: 1, weapon: 'card', desc: '+8% XP · ключ: VIP-клиент' },
  map: { id: 'map', name: 'План ТЦ', ico: '🗺️', max: 1, weapon: 'siren', desc: '+8% область · ключ: Пожар в ТЦ' },
  key: { id: 'key', name: 'Ключ подсобки', ico: '🔑', max: 1, weapon: 'siren', desc: '+6% скорости · ключ: Эвакуация' },
  headlamp: { id: 'headlamp', name: 'Налобный фонарь', ico: '💡', max: 1, weapon: 'flashlight', desc: '+25 радиуса XP · ключ: Охотник' },
  discount: { id: 'discount', name: 'Скидочная карта', ico: '🏷️', max: 1, weapon: 'tagger', desc: '+8% урона · ключ: Чёрная пятница' },
  magnet_pass: { id: 'magnet_pass', name: 'Магнит', ico: '🧲', max: 1, weapon: 'tagger', desc: '+25 радиуса XP · ключ: Тележка' },
  guard_pass: { id: 'guard_pass', name: 'Жетон охраны', ico: '🪪', max: 1, weapon: 'turnstile', desc: '+12% отталкивания · ключ: Охранный контур' },
  sticker: { id: 'sticker', name: 'Стикер «−50%»', ico: '🔻', max: 1, weapon: 'pricetag', desc: '+10% по меткам · ключ: Автоклеймер' },
  broadcast: { id: 'broadcast', name: 'Микрофон', ico: '🎙️', max: 1, weapon: 'mall_radio', desc: '+8% радиус радио · ключ: Экстренное объявление' },
  ribbon: { id: 'ribbon', name: 'Лента кассы', ico: '🎀', max: 1, weapon: 'giftbag', desc: '+1 пакет-орбита · ключ: Лента пакетов' },
};

const SALE_EVO_KEYS = Object.values(SALE_PASSIVES);

function getSaleEvoKey(id) {
  return SALE_PASSIVES[id] || null;
}

function saleEvoKeysForWeapon(weaponId) {
  return SALE_EVO_KEYS.filter((key) => key.weapon === weaponId);
}
