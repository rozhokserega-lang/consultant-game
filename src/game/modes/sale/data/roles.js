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
  phone5g: 'phone', video_call: 'phone',
  ultrasound: 'speaker', megaphone: 'speaker',
  black_card: 'card', vip: 'card',
  caffeine: 'coffee', cold_latte: 'coffee',
  mall_fire: 'siren', mall_evac: 'siren',
  hunter: 'flashlight', strobe: 'flashlight',
  cleaner: 'mop', wet_floor: 'mop',
  black_friday: 'tagger', mag_cart: 'tagger',
  security_loop: 'turnstile', antitheft: 'turnstile',
  auto_claimer: 'pricetag', markdown: 'pricetag',
  emergency_broadcast: 'mall_radio', chart_top: 'mall_radio',
  party_bags: 'giftbag', refund_bags: 'giftbag',
  bubble_tea: 'coffee', bag_of_bags: 'giftbag', receipt_nest: 'receipt',
  deep_clean: 'mop', livestream: 'phone', sound_blast: 'speaker',
  black_vip: 'card', fire_exit: 'siren', raid_light: 'flashlight',
  friday_cart: 'tagger', full_lock: 'turnstile', auto_markdown: 'pricetag',
  emergency_hit: 'mall_radio',
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
