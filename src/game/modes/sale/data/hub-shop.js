/**
 * Распродажа: Ассортимент хаба: цены оружия и стартовые пассивки.
 */
'use strict';

const SALE_HUB_WEAPON_COST = {
  mop: 70, phone: 80, tagger: 100, coffee: 100, giftbag: 110,
  card: 120, speaker: 130, flashlight: 140, siren: 150,
  turnstile: 130, pricetag: 140, mall_radio: 145,
};

const SALE_HUB_PASSIVES = [
  { id: 'mug', ico: '🥫', name: 'Банка энергетика', max: 3, cost: [40, 80, 130], desc: 'Старт +HP / эво кофе → латте' },
  { id: 'charger', ico: '🔌', name: 'Зарядка', max: 3, cost: [45, 85, 140], desc: 'Старт с меньшей КД / эво телефона' },
  { id: 'shoes', ico: '👟', name: 'Кроссовки', max: 3, cost: [40, 75, 120], desc: 'Старт быстрее' },
  { id: 'radio', ico: '📻', name: 'Рация', max: 3, cost: [35, 65, 110], desc: 'Старт с магнитом XP' },
  { id: 'gloves', ico: '🧤', name: 'Перчатки', max: 3, cost: [40, 75, 120], desc: 'Зона / эво швабры → мокрый пол' },
  { id: 'key', ico: '🔑', name: 'Ключ', max: 2, cost: [50, 100], desc: 'Скорость / эво сирены → эвакуация' },
  { id: 'pouch', ico: '👝', name: 'Сумка', max: 2, cost: [55, 100], desc: '+1 снаряд / ур. / эво чека → возврат' },
  { id: 'money', ico: '💰', name: 'Деньги', max: 2, cost: [55, 100], desc: 'Монеты / эво карты' },
  { id: 'printer', ico: '🖨️', name: 'Чековый аппарат', max: 2, cost: [80, 140], desc: '+размер атак / эво чека' },
  { id: 'spray', ico: '🧴', name: 'Спрей', max: 2, cost: [80, 140], desc: '+урон / эво швабры' },
  { id: 'magnet_pass', ico: '🧲', name: 'Магнит', max: 2, cost: [80, 140], desc: '+магнит XP / эво → тележка' },
  { id: 'guard_pass', ico: '🪪', name: 'Жетон', max: 1, cost: [120], desc: '+отталкивание / эво турникета' },
  { id: 'sticker', ico: '🔻', name: 'Стикер', max: 1, cost: [120], desc: '+урон / эво пистолета' },
  { id: 'broadcast', ico: '🎙️', name: 'Микрофон', max: 1, cost: [120], desc: '+размер атак / эво радио' },
  { id: 'ribbon', ico: '🎀', name: 'Лента', max: 1, cost: [120], desc: '+монеты / эво пакета' },
  { id: 'energy', ico: '⚡', name: 'Кофеиновый шот', max: 1, cost: [130], desc: 'Эво кофе → КОФЕИН' },
  { id: 'headphones', ico: '🎧', name: 'Наушники', max: 1, cost: [130], desc: 'Эво громкоговорителя' },
  { id: 'map', ico: '🗺️', name: 'План ТЦ', max: 1, cost: [130], desc: 'Эво сирены → пожар' },
  { id: 'headlamp', ico: '💡', name: 'Налобник', max: 1, cost: [130], desc: 'Эво фонарика' },
  { id: 'discount', ico: '🏷️', name: 'Скидка', max: 1, cost: [140], desc: 'Эво сканера → Чёрная пятница' },
  { id: 'badge', ico: '🪪', name: 'Бейдж', max: 1, cost: [130], desc: 'Эво карты → VIP' },
];
