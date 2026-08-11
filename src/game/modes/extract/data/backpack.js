/**
 * Вылазка: рюкзак и стартовый ассортимент продавца.
 */
'use strict';

const EXTRACT_BACKPACK_START_SLOTS = 5;
const EXTRACT_BACKPACK_MAX_SLOTS = 12;

/** Товары у продавца на парковке. */
const EXTRACT_VENDOR_STOCK = [
  {
    id: 'pack_slot',
    name: 'Карман рюкзака',
    ico: '🎒',
    desc: '+1 слот для лута (до 12).',
    price: 40,
    kind: 'slot',
  },
  {
    id: 'pack_note',
    name: 'Заметка смены',
    ico: '📝',
    desc: 'Пока просто сувенир — займёт слот склада.',
    price: 5,
    kind: 'trinket',
  },
];
