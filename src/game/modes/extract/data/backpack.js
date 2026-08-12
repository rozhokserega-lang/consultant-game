/**
 * Вылазка: рюкзак и стартовый ассортимент продавца.
 */
'use strict';

const EXTRACT_BACKPACK_START_SLOTS = 5;
const EXTRACT_BACKPACK_MAX_SLOTS = 12;

/** Базовая цена первого купленного кармана (слот 6). Дальше +STEP. */
const EXTRACT_SLOT_BASE_PRICE = 40;
const EXTRACT_SLOT_PRICE_STEP = 25;

/** Цена следующего кармана при текущем числе слотов. */
function extractNextSlotPrice(slots) {
  const n = Math.max(EXTRACT_BACKPACK_START_SLOTS, slots | 0);
  if (n >= EXTRACT_BACKPACK_MAX_SLOTS) return 0;
  const bought = Math.max(0, n - EXTRACT_BACKPACK_START_SLOTS);
  return EXTRACT_SLOT_BASE_PRICE + bought * EXTRACT_SLOT_PRICE_STEP;
}

/** Сколько ячеек занимает предмет (1 по умолчанию). */
function extractItemSlotSize(it) {
  if (!it || it.kind === 'bulkPad') return 0;
  const n = it.slots | 0;
  return n > 1 ? n : 1;
}

/** Товары у Игоря на парковке. */
const EXTRACT_VENDOR_STOCK = [
  {
    id: 'pack_slot',
    name: 'Карман рюкзака',
    ico: '🎒',
    desc: '+1 слот навсегда (цена растёт). При смерти содержимое сгорает, слоты остаются.',
    kind: 'slot',
  },
  {
    id: 'pack_medkit',
    name: 'Аптечка',
    ico: '🩹',
    desc: 'В рейде: нажми слот в рюкзаке и подтверди — +1❤.',
    price: 25,
    kind: 'consumable',
    use: 'heal',
    heal: 1,
    value: 12,
  },
  {
    id: 'pack_insurance',
    name: 'Страховка предмета',
    ico: '🛡️',
    desc: '1 предмет в рюкзаке не сгорит при смерти (1 раз за забег).',
    price: typeof EXTRACT_INSURANCE_PRICE !== 'undefined' ? EXTRACT_INSURANCE_PRICE : 100,
    kind: 'insurance',
  },
];
