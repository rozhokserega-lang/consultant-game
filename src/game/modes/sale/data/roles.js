/**
 * Распродажа: Подписи ролей оружия и семьи «база → эволюция».
 */
'use strict';

/** Подписи ролей для UI */
const SALE_ROLE_LABEL = {
  projectile: 'bolt', orbit: 'orbit', ricochet: 'chain', aura: 'aura',
  boomerang: 'scythe', puddle: 'mortar', nova: 'bell', beam: 'lantern',
  sword: 'sword', charge: 'charge', spray: 'spray', shield: 'barrier',
  radio: 'pulse', mark: 'mark',
};

/** Семья базы ← эво (для синергий и веток) */
const SALE_WEAPON_FAMILY = {
  endless_receipt: 'receipt', receipt_return: 'receipt',
  phone5g: 'phone', ultrasound: 'speaker',
  black_card: 'card', vip: 'card',
  caffeine: 'coffee', cold_latte: 'coffee',
  mall_fire: 'siren', mall_evac: 'siren',
  hunter: 'flashlight', cleaner: 'mop', wet_floor: 'mop',
  black_friday: 'tagger', mag_cart: 'tagger',
  security_loop: 'turnstile', auto_claimer: 'pricetag',
  emergency_broadcast: 'mall_radio', party_bags: 'giftbag',
};

function saleWeaponFamily(id) {
  return SALE_WEAPON_FAMILY[id] || id;
}

function saleHasFamily(weapons, family) {
  if (!weapons) return false;
  for (const id of Object.keys(weapons)) {
    if ((weapons[id] || 0) > 0 && saleWeaponFamily(id) === family) return true;
  }
  return false;
}
