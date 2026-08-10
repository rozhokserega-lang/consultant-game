/** Активные способности: дэш, обед, сильный удар. */

/** Прокачка кнопок: дэш / обед / сильный удар (макс 5). */
const ABILITY_MAX_LEVEL = 5;
const ABILITY_UPGRADE_COSTS = [40, 70, 110, 160, 250];
const ABILITY_DEFS = [
  { id: 'dash', ico: '💨', name: 'Дэш', desc: '1–4: −КД · 5: двойной дэш' },
  { id: 'tea', ico: '☕', name: 'Обед', desc: '1–4: дольше · 5: +1 урон в обеде' },
  { id: 'charge', ico: '⚔', name: 'Сильный удар', desc: '1–4: −КД заряда · 5: больше радиус' },
];

function abilityUpgradeCost(level) {
  if (level < 0 || level >= ABILITY_MAX_LEVEL) return null;
  return ABILITY_UPGRADE_COSTS[level];
}
