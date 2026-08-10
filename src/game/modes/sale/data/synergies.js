/**
 * Распродажа: Синергии пар оружия (без эволюции).
 */
'use strict';

/** Синергии без эволюции */
const SALE_SYNERGIES = [
  {
    a: 'receipt', b: 'card', orbitBonus: 0.12,
    label: 'Чек+карта: орбиты шире', short: '🧾💳 орбиты',
  },
  {
    a: 'coffee', b: 'mop', poisonPuddle: true,
    label: 'Кофе+швабра: яд на лужах', short: '☕🧹 яд',
  },
  {
    a: 'flashlight', b: 'siren', beamBurn: true,
    label: 'Фонарик+сирена: луч жжёт', short: '🔦🚨 огонь',
  },
  {
    a: 'tagger', b: 'speaker', markAura: true,
    label: 'Сканер+рупор: аура бьёт меченых сильнее', short: '📟📢 метка',
  },
];
