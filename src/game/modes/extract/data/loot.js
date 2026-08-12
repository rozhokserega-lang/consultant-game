/**
 * Вылазка: таблица лута для этажа ТЦ.
 * slots > 1 — крупногабарит (занимает несколько ячеек рюкзака).
 */
'use strict';

const EXTRACT_LOOT_DEFS = {
  sneakers: { id: 'sneakers', name: 'Кроссовки', ico: '👟', value: 25, rarity: 'common' },
  jeans: { id: 'jeans', name: 'Джинсы', ico: '👖', value: 20, rarity: 'common' },
  watch: { id: 'watch', name: 'Часы', ico: '⌚', value: 55, rarity: 'uncommon' },
  perfume: { id: 'perfume', name: 'Духи', ico: '🧴', value: 45, rarity: 'uncommon' },
  ring: { id: 'ring', name: 'Кольцо', ico: '💍', value: 90, rarity: 'rare' },
  console: { id: 'console', name: 'Приставка', ico: '🎮', value: 120, rarity: 'rare', slots: 2 },
  safe_box: { id: 'safe_box', name: 'Кассета сейфа', ico: '🗃️', value: 160, rarity: 'epic', slots: 2 },

  // 2 этаж — дороже
  gold_sneakers: { id: 'gold_sneakers', name: 'Кроссовки лимитка', ico: '👟', value: 45, rarity: 'uncommon' },
  brand_bag: { id: 'brand_bag', name: 'Брендовая сумка', ico: '👜', value: 70, rarity: 'uncommon' },
  gold_watch: { id: 'gold_watch', name: 'Золотые часы', ico: '⌚', value: 95, rarity: 'rare' },
  perfume_xl: { id: 'perfume_xl', name: 'Парфюм XL', ico: '🧴', value: 80, rarity: 'rare' },
  diamond_ring: { id: 'diamond_ring', name: 'Бриллиантовое кольцо', ico: '💍', value: 150, rarity: 'epic' },
  tablet: { id: 'tablet', name: 'Планшет', ico: '📱', value: 180, rarity: 'epic', slots: 2 },
  vault_case: { id: 'vault_case', name: 'Кейс из хранилища', ico: '💼', value: 240, rarity: 'legendary', slots: 2 },

  /** Ключ на 3 этаж — спрятан на 2-м, занимает 1 слот рюкзака. */
  vip_access_card: {
    id: 'vip_access_card',
    name: 'VIP-карта',
    ico: '🪪',
    value: 0,
    rarity: 'legendary',
    key: 'floor3',
  },

  // 3 этаж — VIP
  vip_watch: { id: 'vip_watch', name: 'VIP-хронограф', ico: '⌚', value: 160, rarity: 'epic' },
  server_blade: { id: 'server_blade', name: 'Серверный диск', ico: '💾', value: 220, rarity: 'epic', slots: 2 },
  cash_brick: { id: 'cash_brick', name: 'Пачка выручки', ico: '💵', value: 280, rarity: 'legendary', slots: 2 },
  rare_crate: { id: 'rare_crate', name: 'Ящик со склада', ico: '📦', value: 200, rarity: 'epic', slots: 2 },
  black_ledger: { id: 'black_ledger', name: 'Чёрная книга', ico: '📕', value: 320, rarity: 'legendary', slots: 2 },
};
