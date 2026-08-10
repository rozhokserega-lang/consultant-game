/** Записи книги жалоб — типы покупателей для статистики киллов. */

/** Записи книги жалоб — статистика киллов по типам. */
const COMPLAINT_BOOK = [
  { id: 'normal', name: 'Покупатель', ico: '🧍', skin: 'mob_elder' },
  { id: 'fast', name: 'Торопыга', ico: '🏃', skin: 'mob_fast' },
  { id: 'tank', name: 'Танк', ico: '🛡️', skin: 'mob_tank' },
  { id: 'fatty', name: 'Жирный', ico: '💣', skin: 'mob_muscle' },
  { id: 'queue', name: 'Очередь', ico: '🧍‍♂️', skin: 'mob_purple' },
  { id: 'returner', name: 'Возврат', ico: '📕', skin: 'mob_cane' },
  { id: 'manager', name: 'Менеджер', ico: '👔', skin: 'mob_pink' },
  { id: 'influencer', name: 'Инфлюенсер', ico: '📸', skin: 'mob_purple' },
  { id: 'blogger', name: 'Блогер', ico: '📱', skin: 'mob_pink' },
  { id: 'child', name: 'Ребёнок', ico: '🧒', skin: 'mob_fast', scale: 0.78 },
  { id: 'boss', name: 'Админ', ico: '📢', skin: 'mob_muscle', boss: true },
  { id: 'miniboss', name: 'Мини-босс', ico: '👮', skin: 'mob_tank', boss: true },
  { id: 'director', name: 'Директор', ico: '💼', skin: 'mob_muscle', boss: true, scale: 1.18 },
];
