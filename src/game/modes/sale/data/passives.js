/**
 * Распродажа: Пассивки забега и алиасы старых id.
 */
'use strict';

const SALE_PASSIVES = {
  mug: { id: 'mug', name: 'Банка энергетика', ico: '🥫', max: 5, desc: '+1 макс HP / ур.' },
  badge: { id: 'badge', name: 'Бейдж', ico: '🪪', max: 5, desc: '+12% XP / ур.' },
  radio: { id: 'radio', name: 'Рация', ico: '📻', max: 5, desc: '+30% магнит XP / ур.' },
  key: { id: 'key', name: 'Ключ подсобки', ico: '🔑', max: 5, desc: '+8% скорости / ур.' },
  charger: { id: 'charger', name: 'Зарядка', ico: '🔌', max: 5, desc: '−8% КД оружия / ур.' },
  discount: { id: 'discount', name: 'Скидочная карта', ico: '🏷️', max: 5, desc: '+10% крит / ур.' },
  pouch: { id: 'pouch', name: 'Поясная сумка', ico: '👝', max: 5, desc: '+1 снаряд / ур.' },
  shoes: { id: 'shoes', name: 'Кроссовки', ico: '👟', max: 5, desc: '+9% скорости / ур.' },
  headphones: { id: 'headphones', name: 'Наушники', ico: '🎧', max: 5, desc: '+15% урон аур / ур.' },
  gloves: { id: 'gloves', name: 'Перчатки грузчика', ico: '🧤', max: 5, desc: '+12% размер / ур.' },
  energy: { id: 'energy', name: 'Кофеиновый шот', ico: '⚡', max: 5, desc: '+10% скорость атаки / ур.' },
  map: { id: 'map', name: 'План ТЦ', ico: '🗺️', max: 5, desc: '+10% дальность / ур.' },
  money: { id: 'money', name: 'Деньги', ico: '💰', max: 5, desc: '+18% монет / ур.' },
  medkit: {
    id: 'medkit', name: 'Аптечка', ico: '🩹', max: 3,
    desc: 'Реген HP каждые N сек; +2% шанс сердца с врагов / ур.',
  },
  headlamp: { id: 'headlamp', name: 'Налобный фонарь', ico: '💡', max: 5, desc: '+магнит XP / ур.' },
  printer: {
    id: 'printer', name: 'Чековый аппарат', ico: '🖨️', max: 3,
    desc: '+8% размер атак / ур.; с чеком — +1 орбита (эво → Бесконечный чек)',
  },
  spray: {
    id: 'spray', name: 'Спрей', ico: '🧴', max: 3,
    desc: '+8% урон / ур.; с шваброй — яд и +12% урон сика (эво → Уборщица)',
  },
  magnet_pass: {
    id: 'magnet_pass', name: 'Магнит', ico: '🧲', max: 3,
    desc: '+магнит XP / ур. (эво сканера → тележка)',
  },
  guard_pass: {
    id: 'guard_pass', name: 'Жетон охраны', ico: '🪪', max: 3,
    desc: '+10% отталкивание / ур. (эво турникета → Охранный контур)',
  },
  sticker: {
    id: 'sticker', name: 'Стикер «−50%»', ico: '🔻', max: 3,
    desc: '+6% урон / ур.; по меткам ещё +12% (эво → Автоклеймер)',
  },
  broadcast: {
    id: 'broadcast', name: 'Микрофон', ico: '🎙️', max: 3,
    desc: '+8% размер атак / ур.; с радио — +10% радиус (эво → Экстренное объявление)',
  },
  ribbon: {
    id: 'ribbon', name: 'Лента кассы', ico: '🎀', max: 3,
    desc: '+10% монет / ур.; с пакетом — +1 орбита (эво → Лента пакетов)',
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
