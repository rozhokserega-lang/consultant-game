/**
 * Распродажа: Пулы минутных событий по фазам забега.
 */
'use strict';

/** Минутные события ТЦ — пулы по фазам забега */
const SALE_EVENT_POOLS = {
  early: ['queue_rush', 'happy_hour', 'xp_double', 'xp_discount', 'checkout_hall'],
  mid: ['lights_out', 'fire_dept', 'security_walls', 'complaint_book', 'evacuation', 'weapon_sale'],
  late: ['triple_boss', 'vip_day', 'director_call', 'black_friday', 'inventory', 'fire_dept'],
  brutal: ['black_friday', 'triple_boss', 'evacuation', 'director_call', 'weapon_sale', 'vip_day', 'complaint_book'],
  finale: ['mall_closing'],
};

function saleEventPoolForMinute(minute) {
  if (minute >= 19) return SALE_EVENT_POOLS.finale;
  if (minute >= 15) return SALE_EVENT_POOLS.brutal;
  if (minute >= 10) return SALE_EVENT_POOLS.late;
  if (minute >= 5) return SALE_EVENT_POOLS.mid;
  return SALE_EVENT_POOLS.early;
}

function pickSaleEventId(minute, lastId) {
  const pool = saleEventPoolForMinute(minute).slice();
  if (pool.length > 1 && lastId) {
    const filtered = pool.filter((id) => id !== lastId);
    if (filtered.length) return filtered[randi(0, filtered.length - 1)];
  }
  return pool[randi(0, pool.length - 1)];
}
