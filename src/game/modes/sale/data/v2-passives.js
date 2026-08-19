/**
 * Распродажа 2.0: дерево пассивок с развилками.
 * Оружие — чемодан раз в SALE_V2_WEAPON_TICK. Эво с капстона (если база в слотах) или 6-й уровень в чемодане.
 */
'use strict';

const SALE_V2_WEAPON_TICK = 30;
const SALE_V2_XP_MUL = 1.55;

const SALE_V2_SIDES = [
  { id: 'atk', name: 'Атака', ico: '⚔️' },
  { id: 'def', name: 'Оборона', ico: '🛡️' },
];

const SALE_V2_LANES = [
  { id: 'tempo', side: 'atk', name: 'Темп', ico: '🔥' },
  { id: 'might', side: 'atk', name: 'Мощь', ico: '💥' },
  { id: 'vital', side: 'def', name: 'Живучесть', ico: '❤️' },
  { id: 'res', side: 'def', name: 'Ресурсы', ico: '💰' },
];

/** Для читов дев-панели: докачать целую T1-ветку. */
const SALE_V2_BRANCHES = SALE_V2_LANES;

const SALE_V2_FORKS = {
  root: { options: ['atk', 'def'] },
  atk: { options: ['tempo', 'might'] },
  def: { options: ['vital', 'res'] },
  tempo: { options: ['crit', 'cd'] },
  might: { options: ['aura', 'range'] },
  vital: { options: ['armor', 'regen'] },
  res: { options: ['gold', 'magnet'] },
};

/**
 * Развилки только для раскладки UI. T2/капстон открываются через requires
 * своей ветки — соседние листья и стороны не запираются.
 */
const SALE_V2_PASSIVES = {
  haste: {
    id: 'haste', root: 'atk', fork: 'atk', option: 'tempo', lane: 'tempo',
    tier: 1, max: 5, ico: '💨',
    name: 'Второе дыхание кассира', desc: '+10% скорость атаки за уровень',
    stat: { cooldown: 0.10 },
  },
  discount: {
    id: 'discount', root: 'atk', fork: 'tempo', option: 'crit', lane: 'tempo',
    tier: 2, max: 5, ico: '🏷️',
    name: 'Скидочная карта', desc: '+10% крит за уровень',
    requires: { id: 'haste', lvl: 5 },
    stat: { crit: 0.10 },
  },
  cap_double: {
    id: 'cap_double', root: 'atk', fork: 'tempo', option: 'crit', lane: 'tempo',
    tier: 3, max: 1, ico: '✨', capstone: true,
    name: 'Двойной чек', desc: 'Крит шлёт слабую копию снаряда в соседнюю цель',
    requires: { id: 'discount', lvl: 5 },
    effect: 'crit_echo',
    evolves: { from: 'pricetag', into: 'auto_claimer' },
  },
  charger: {
    id: 'charger', root: 'atk', fork: 'tempo', option: 'cd', lane: 'tempo',
    tier: 2, max: 5, ico: '🔌',
    name: 'Зарядка', desc: '−8% КД за уровень',
    requires: { id: 'haste', lvl: 5 },
    stat: { cooldown: 0.08 },
  },
  cap_nocd: {
    id: 'cap_nocd', root: 'atk', fork: 'tempo', option: 'cd', lane: 'tempo',
    tier: 3, max: 1, ico: '⏱️', capstone: true,
    name: 'Без выходных', desc: 'Раз в 12 сек следующая атака без КД',
    requires: { id: 'charger', lvl: 5 },
    effect: 'no_cd',
    evolves: { from: 'receipt', into: 'endless_receipt' },
  },

  gloves: {
    id: 'gloves', root: 'atk', fork: 'atk', option: 'might', lane: 'might',
    tier: 1, max: 5, ico: '🧤',
    name: 'Перчатки грузчика', desc: '+12% зона атак за уровень',
    stat: { area: 0.12 },
  },
  headphones: {
    id: 'headphones', root: 'atk', fork: 'might', option: 'aura', lane: 'might',
    tier: 2, max: 5, ico: '🎧',
    name: 'Наушники', desc: '+15% урон аур за уровень',
    requires: { id: 'gloves', lvl: 5 },
    stat: { aura: 0.15 },
  },
  cap_stun: {
    id: 'cap_stun', root: 'atk', fork: 'might', option: 'aura', lane: 'might',
    tier: 3, max: 1, ico: '📢', capstone: true,
    name: 'Оглушительная распродажа', desc: 'Аура раз в 8 сек root 0.6с в радиусе',
    requires: { id: 'headphones', lvl: 5 },
    effect: 'aura_stun',
    evolves: { from: 'speaker', into: 'ultrasound' },
  },
  map: {
    id: 'map', root: 'atk', fork: 'might', option: 'range', lane: 'might',
    tier: 2, max: 5, ico: '🗺️',
    name: 'План ТЦ', desc: '+10% дальность за уровень',
    requires: { id: 'gloves', lvl: 5 },
    stat: { range: 0.10 },
  },
  cap_pierce: {
    id: 'cap_pierce', root: 'atk', fork: 'might', option: 'range', lane: 'might',
    tier: 3, max: 1, ico: '🪟', capstone: true,
    name: 'Сквозь витрину', desc: 'Снаряды пробивают всех без потери урона',
    requires: { id: 'map', lvl: 5 },
    effect: 'pierce',
    evolves: { from: 'siren', into: 'mall_evac' },
  },

  mug: {
    id: 'mug', root: 'def', fork: 'def', option: 'vital', lane: 'vital',
    tier: 1, max: 5, ico: '🥫',
    name: 'Банка энергетика', desc: '+50 макс HP за уровень',
    stat: { hp: SALE_HP_UNIT },
  },
  armor: {
    id: 'armor', root: 'def', fork: 'vital', option: 'armor', lane: 'vital',
    tier: 2, max: 5, ico: '🧱',
    name: 'Стальной прилавок', desc: '−4 урона с удара за уровень (на 5 ур. −20)',
    requires: { id: 'mug', lvl: 5 },
    stat: { armor: 4 },
  },
  cap_till: {
    id: 'cap_till', root: 'def', fork: 'vital', option: 'armor', lane: 'vital',
    tier: 3, max: 1, ico: '🏦', capstone: true,
    name: 'Несокрушимая касса', desc: 'Раз в 20 сек летальный удар → 1 HP и 2с неуязвимости',
    requires: { id: 'armor', lvl: 5 },
    effect: 'second_wind',
  },
  medkit: {
    id: 'medkit', root: 'def', fork: 'vital', option: 'regen', lane: 'vital',
    tier: 2, max: 3, ico: '🩹',
    name: 'Аптечка', desc: 'Реген 4 HP/с за уровень и шанс сердца при низком HP',
    requires: { id: 'mug', lvl: 5 },
    stat: { heartLow: 0.02, regen: 4 },
  },
  cap_ems: {
    id: 'cap_ems', root: 'def', fork: 'vital', option: 'regen', lane: 'vital',
    tier: 3, max: 1, ico: '🚑', capstone: true,
    name: 'Скорая касса', desc: 'Сердца лечат на 50% больше и снимают дебаффы',
    requires: { id: 'medkit', lvl: 3 },
    effect: 'heart_boost',
  },

  badge: {
    id: 'badge', root: 'def', fork: 'def', option: 'res', lane: 'res',
    tier: 1, max: 5, ico: '🪪',
    name: 'Бейдж', desc: '+12% XP за уровень',
    stat: { xp: 0.12 },
  },
  money: {
    id: 'money', root: 'def', fork: 'res', option: 'gold', lane: 'res',
    tier: 2, max: 5, ico: '💰',
    name: 'Деньги', desc: '+18% монет за уровень',
    requires: { id: 'badge', lvl: 5 },
    stat: { coins: 0.18 },
  },
  ribbon: {
    id: 'ribbon', root: 'def', fork: 'res', option: 'gold', lane: 'res',
    tier: 3, max: 1, ico: '🎀', capstone: true,
    name: 'Бонусная программа', desc: '+1 пакет-орбита. С сумкой подарков → Лента пакетов',
    requires: { id: 'money', lvl: 5 },
    stat: { orbit: 1 },
    evolves: { from: 'giftbag', into: 'party_bags' },
  },
  radio: {
    id: 'radio', root: 'def', fork: 'res', option: 'magnet', lane: 'res',
    tier: 2, max: 5, ico: '📻',
    name: 'Рация', desc: '+30% магнит XP за уровень',
    requires: { id: 'badge', lvl: 5 },
    stat: { magnetPct: 0.30 },
  },
  cap_yank: {
    id: 'cap_yank', root: 'def', fork: 'res', option: 'magnet', lane: 'res',
    tier: 3, max: 1, ico: '🌀', capstone: true,
    name: 'Гравитация скидок', desc: 'Раз в 15 сек притягивает весь лут и XP на экране',
    requires: { id: 'radio', lvl: 5 },
    effect: 'loot_yank',
  },
};

function getSaleV2Passive(id) {
  return SALE_V2_PASSIVES[id] || null;
}

function saleV2PassivesInLane(laneId) {
  return Object.values(SALE_V2_PASSIVES)
    .filter((def) => def.lane === laneId)
    .sort((a, b) => (a.tier - b.tier) || a.name.localeCompare(b.name, 'ru'));
}

function saleV2PassivesInBranch(branchId) {
  return saleV2PassivesInLane(branchId);
}

function saleV2EvoName(def) {
  if (!def || !def.evolves || typeof SALE_WEAPONS === 'undefined') return '';
  const into = SALE_WEAPONS[def.evolves.into];
  return (into && into.name) || def.evolves.into;
}
