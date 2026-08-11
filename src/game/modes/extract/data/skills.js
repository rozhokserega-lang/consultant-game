/**
 * Вылазка: стартовые навыки (оружие Распродажи) для выбора у инструктора.
 */
'use strict';

/** id совпадают с SALE_WEAPONS — в рейде берём этот стартер. */
const EXTRACT_STARTER_SKILLS = [
  { id: 'receipt', name: 'Чек', ico: '🧾', desc: 'Орбиты вокруг тебя' },
  { id: 'mop', name: 'Швабра', ico: '🧹', desc: 'Сама бьёт ближайших' },
  { id: 'phone', name: 'Смартфон', ico: '📱', desc: 'Рикошет по цепочке' },
  { id: 'speaker', name: 'Громкоговоритель', ico: '📢', desc: 'Аура урона вокруг' },
  { id: 'coffee', name: 'Кофе', ico: '☕', desc: 'Горячие лужи на полу' },
  { id: 'card', name: 'Банковская карта', ico: '💳', desc: 'Бумеранг через зал' },
];

const EXTRACT_DEFAULT_STARTER = 'receipt';
