/**
 * Распродажа: постоянное дерево подготовки. До забега активируются 3 узла.
 */
'use strict';

const SALE_TREE_PERKS = [
  { id: 'damage', branch: 'damage', ico: '🏷️', name: 'Красный ценник', desc: '+4% урона оружия', cost: 0, bonus: { damage: 0.04 } },
  { id: 'mark', branch: 'damage', ico: '🎯', name: 'Охота за меткой', desc: '+15% урон по меткам, −8% область', cost: 180, keystone: true, bonus: { mark: 0.15, area: -0.08 } },
  { id: 'tempo', branch: 'tempo', ico: '🔌', name: 'Быстрая смена', desc: '−4% КД оружия', cost: 0, bonus: { cooldown: -0.04 } },
  { id: 'double_shift', branch: 'tempo', ico: '⏱️', name: 'Двойная смена', desc: '+1 слот оружия, −1 max HP', cost: 220, keystone: true, bonus: { weaponSlots: 1, hp: -1 } },
  { id: 'vital', branch: 'survival', ico: '🥫', name: 'Запас энергии', desc: '+1 max HP', cost: 0, bonus: { hp: 1 } },
  { id: 'medic', branch: 'survival', ico: '🩹', name: 'Неотложка', desc: '+8% шанс сердца при низком HP', cost: 160, keystone: true, bonus: { heartLow: 0.08 } },
  { id: 'area', branch: 'utility', ico: '📐', name: 'Планограмма', desc: '+5% размер атак', cost: 90, bonus: { area: 0.05 } },
  { id: 'xp', branch: 'utility', ico: '🪪', name: 'Стажировка', desc: '+8% опыта', cost: 90, bonus: { xp: 0.08 } },
  { id: 'magnet', branch: 'utility', ico: '📻', name: 'Рация смены', desc: '+12 радиуса XP', cost: 70, bonus: { magnet: 12 } },
  { id: 'key_luck', branch: 'utility', ico: '📦', name: 'Складской маршрут', desc: '+1 реролл и ключи чаще', cost: 140, bonus: { reroll: 1, keyWeight: 0.25 } },
];

const SALE_TREE_DEFAULT_UNLOCKED = ['damage', 'tempo', 'vital'];
const SALE_TREE_DEFAULT_SELECTED = ['damage', 'tempo', 'vital'];
const SALE_TREE_MAX_SELECTED = 3;

/** Колонки дерева — как три ветки навыков, плюс хозяйственный столбец. */
const SALE_TREE_BRANCHES = [
  { id: 'damage', name: 'Урон' },
  { id: 'tempo', name: 'Темп' },
  { id: 'survival', name: 'Жизнь' },
  { id: 'utility', name: 'Склад' },
];

function getSaleTreePerk(id) {
  return SALE_TREE_PERKS.find((perk) => perk.id === id) || null;
}

function clampSaleTreeSelected(ids, unlocked) {
  const out = [];
  let keystones = 0;
  for (const id of ids || []) {
    if (unlocked && unlocked.indexOf(id) < 0) continue;
    const perk = getSaleTreePerk(id);
    if (!perk) continue;
    if (perk.keystone) {
      if (keystones >= 1) continue;
      keystones += 1;
    }
    if (out.length >= SALE_TREE_MAX_SELECTED) break;
    if (out.indexOf(id) >= 0) continue;
    out.push(id);
  }
  return out;
}
