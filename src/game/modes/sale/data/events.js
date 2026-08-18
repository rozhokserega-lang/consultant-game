/**
 * Распродажа: Пулы минутных событий по фазам забега.
 */
'use strict';

/** Подписи минутных событий для баннера и строки баффов. */
const SALE_EVENT_BANNERS = {
  queue_rush: '👥 НАПЛЫВ ОЧЕРЕДИ!',
  triple_boss: '👔 ТРОЙКА АДМИНОВ!',
  black_friday: '🏷 ЧЁРНАЯ ПЯТНИЦА!',
  lights_out: '💡 СВЕТ ВЫКЛЮЧИЛИ!',
  fire_dept: '🔥 ПОЖАР В ОТДЕЛЕ!',
  inventory: '📋 ИНВЕНТАРИЗАЦИЯ!',
  vip_day: '👑 VIP-ДЕНЬ!',
  xp_discount: '💸 СКИДКА −50% НА XP',
  xp_double: '✨ ДВОЙНОЙ XP!',
  evacuation: '🚨 ЭВАКУАЦИЯ!',
  complaint_book: '📕 КНИГА ЖАЛОБ!',
  security_walls: '🚧 ОХРАНА ЗАКРЫЛА ПРОХОДЫ!',
  happy_hour: '💎 СЧАСТЛИВЫЙ ЧАС!',
  checkout_hall: '🧾 КАССОВЫЙ ЗАЛ!',
  director_call: '📞 ДИРЕКТОР НА СВЯЗИ!',
  weapon_sale: '⚔ РАСПРОДАЖА ОРУЖИЯ!',
  mall_closing: '🔒 ЗАКРЫТИЕ ТЦ!',
};

/** Минутные события ТЦ — пулы по фазам забега */
const SALE_EVENT_POOLS = {
  early: ['queue_rush', 'happy_hour', 'xp_double', 'xp_discount', 'checkout_hall'],
  mid: ['lights_out', 'fire_dept', 'security_walls', 'complaint_book', 'evacuation', 'weapon_sale'],
  late: ['triple_boss', 'vip_day', 'director_call', 'black_friday', 'inventory', 'fire_dept'],
  brutal: ['black_friday', 'triple_boss', 'evacuation', 'director_call', 'weapon_sale', 'vip_day', 'complaint_book'],
  finale: ['mall_closing'],
};

function saleEventPoolForMinute(minute, opts) {
  const endless = !!(opts && opts.endless);
  if (endless && minute >= 15) return SALE_EVENT_POOLS.brutal;
  if (minute >= 20) return SALE_EVENT_POOLS.brutal;
  if (minute >= 19) return SALE_EVENT_POOLS.finale;
  if (minute >= 15) return SALE_EVENT_POOLS.brutal;
  if (minute >= 10) return SALE_EVENT_POOLS.late;
  if (minute >= 5) return SALE_EVENT_POOLS.mid;
  return SALE_EVENT_POOLS.early;
}

function pickSaleEventId(minute, lastId, opts) {
  const pool = saleEventPoolForMinute(minute, opts).slice();
  if (pool.length > 1 && lastId) {
    const filtered = pool.filter((id) => id !== lastId);
    if (filtered.length) return filtered[randi(0, filtered.length - 1)];
  }
  return pool[randi(0, pool.length - 1)];
}

/** Короткие имена для верхней плашки боя */
const SALE_EVENT_LABELS = {
  queue_rush: 'НАПЛЫВ ОЧЕРЕДИ',
  triple_boss: 'ТРОЙКА АДМИНОВ',
  black_friday: 'ЧЁРНАЯ ПЯТНИЦА',
  lights_out: 'СВЕТ ВЫКЛЮЧИЛИ',
  fire_dept: 'ПОЖАР В ОТДЕЛЕ',
  inventory: 'ИНВЕНТАРИЗАЦИЯ',
  vip_day: 'VIP-ДЕНЬ',
  xp_discount: 'СКИДКА НА XP',
  xp_double: 'ДВОЙНОЙ XP',
  evacuation: 'ЭВАКУАЦИЯ',
  complaint_book: 'КНИГА ЖАЛОБ',
  security_walls: 'ОХРАНА',
  happy_hour: 'СЧАСТЛИВЫЙ ЧАС',
  checkout_hall: 'КАССОВЫЙ ЗАЛ',
  director_call: 'ДИРЕКТОР',
  weapon_sale: 'ОРУЖИЕ ×2',
  mall_closing: 'ЗАКРЫТИЕ ТЦ',
};

function saleEventHudLabel(id) {
  return SALE_EVENT_LABELS[id] || 'СОБЫТИЕ';
}

/** Секунд до следующего минутного события или null, если расписание кончилось. */
function saleNextEventEta(saleTime, opts) {
  const t = Math.max(0, saleTime || 0);
  const minute = Math.floor(t / 60);
  const endless = !!(opts && opts.endless);
  if (!endless && minute >= 19) return null;
  return (minute + 1) * 60 - t;
}
