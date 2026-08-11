/**
 * Вылазка: таблица лута для этажа ТЦ.
 */
'use strict';

const EXTRACT_LOOT_DEFS = {
  sneakers: { id: 'sneakers', name: 'Кроссовки', ico: '👟', value: 25, rarity: 'common' },
  jeans: { id: 'jeans', name: 'Джинсы', ico: '👖', value: 20, rarity: 'common' },
  watch: { id: 'watch', name: 'Часы', ico: '⌚', value: 55, rarity: 'uncommon' },
  perfume: { id: 'perfume', name: 'Духи', ico: '🧴', value: 45, rarity: 'uncommon' },
  ring: { id: 'ring', name: 'Кольцо', ico: '💍', value: 90, rarity: 'rare' },
  console: { id: 'console', name: 'Приставка', ico: '🎮', value: 120, rarity: 'rare' },
  safe_box: { id: 'safe_box', name: 'Кассета сейфа', ico: '🗃️', value: 160, rarity: 'epic' },

  // 2 этаж — дороже
  gold_sneakers: { id: 'gold_sneakers', name: 'Кроссовки лимитка', ico: '👟', value: 45, rarity: 'uncommon' },
  brand_bag: { id: 'brand_bag', name: 'Брендовая сумка', ico: '👜', value: 70, rarity: 'uncommon' },
  gold_watch: { id: 'gold_watch', name: 'Золотые часы', ico: '⌚', value: 95, rarity: 'rare' },
  perfume_xl: { id: 'perfume_xl', name: 'Парфюм XL', ico: '🧴', value: 80, rarity: 'rare' },
  diamond_ring: { id: 'diamond_ring', name: 'Бриллиантовое кольцо', ico: '💍', value: 150, rarity: 'epic' },
  tablet: { id: 'tablet', name: 'Планшет', ico: '📱', value: 180, rarity: 'epic' },
  vault_case: { id: 'vault_case', name: 'Кейс из хранилища', ico: '💼', value: 240, rarity: 'legendary' },
};
