/**
 * Мета-экипировка: тиры слотов, качества, материалы и KPI.
 */
'use strict';

const GEAR_VERSION = 2;
const GEAR_SLOT_IDS = ['badge', 'card', 'radio'];

const GEAR_QUALITIES = {
  normal: { label: 'Обычная', statMul: 1, matMul: 1 },
  sturdy: { label: 'Крепкая', statMul: 1.08, matMul: 1.5 },
  select: { label: 'Отборная', statMul: 1.15, matMul: 2 },
};

const GEAR_MATERIALS = {
  badge_shard: { name: 'Осколок бейджа', ico: '🪪' },
  card_film: { name: 'Плёнка карты', ico: '💳' },
  radio_cell: { name: 'Элемент рации', ico: '🔋' },
  kpi_token: { name: 'KPI-жетон', ico: '🎫' },
};

const GEAR_KPI = { perBossKill: 3 };

const GEAR_SLOTS = {
  badge: {
    id: 'badge', name: 'Бейдж', bodyPart: 'Шея', ico: '🪪',
    pinTop: 74, pinLeft: 90, pinW: 48, pinH: 58,
    statKey: 'xpMul', mat: 'badge_shard',
    tiers: [
      { tier: 1, name: 'STAFF', img: 'assets/gear/badges/badge_t1_staff.png', xpMul: 1.05, unlockCoins: 0, mats: {}, bossGate: 0 },
      { tier: 2, name: 'Консультант', img: 'assets/gear/badges/badge_t2_consultant.png', xpMul: 1.10, unlockCoins: 80, mats: { badge_shard: 4 }, bossGate: 1 },
      { tier: 3, name: 'Старший консультант', img: 'assets/gear/badges/badge_t3_senior.png', xpMul: 1.15, unlockCoins: 140, mats: { badge_shard: 8, kpi_token: 3 }, bossGate: 3 },
      { tier: 4, name: 'KPI-100', img: 'assets/gear/badges/badge_t4_kpi100.png', xpMul: 1.20, unlockCoins: 220, mats: { badge_shard: 12, kpi_token: 9 }, bossGate: 5 },
    ],
    drops: { elite: { chance: 0.35, amount: [1, 2] }, boss: { chance: 1, amount: [2, 4] } },
  },
  card: {
    id: 'card', name: 'Служебная карта', bodyPart: 'Нагрудный карман', ico: '💳',
    pinTop: 116, pinLeft: 70, pinW: 36, pinH: 28,
    statKey: 'coinStart', mat: 'card_film',
    tiers: [
      { tier: 1, name: 'Пропуск на смену', coinStart: 2, unlockCoins: 0, mats: {}, bossGate: 0 },
      { tier: 2, name: 'Карта сотрудника', coinStart: 5, unlockCoins: 60, mats: { card_film: 3 }, bossGate: 1 },
      { tier: 3, name: 'Карта отдела', coinStart: 8, unlockCoins: 120, mats: { card_film: 6, kpi_token: 2 }, bossGate: 2 },
      { tier: 4, name: 'Чёрная карта VIP', coinStart: 12, unlockCoins: 200, mats: { card_film: 10, kpi_token: 6 }, bossGate: 4 },
    ],
    drops: { elite: { chance: 0.25, amount: [1, 1] }, boss: { chance: 1, amount: [1, 3] } },
  },
  radio: {
    id: 'radio', name: 'Рация', bodyPart: 'На бедре', ico: '📻',
    pinTop: 212, pinLeft: 100, pinW: 32, pinH: 44, pinRot: -10,
    statKey: 'magnet', mat: 'radio_cell',
    tiers: [
      { tier: 1, name: 'Дешёвая рация', img: 'assets/gear/radios/radio_t1_basic.png', magnet: 15, unlockCoins: 0, mats: {}, bossGate: 0 },
      { tier: 2, name: 'SEC', img: 'assets/gear/radios/radio_t2_sec.png', magnet: 30, unlockCoins: 70, mats: { radio_cell: 3 }, bossGate: 1 },
      { tier: 3, name: 'Склад-12', img: 'assets/gear/radios/radio_t3_warehouse.png', magnet: 50, unlockCoins: 130, mats: { radio_cell: 6, kpi_token: 3 }, bossGate: 3 },
      { tier: 4, name: 'Диспетчерская', img: 'assets/gear/radios/radio_t4_dispatch.png', magnet: 70, unlockCoins: 210, mats: { radio_cell: 10, kpi_token: 9 }, bossGate: 6 },
    ],
    drops: { elite: { chance: 0.30, amount: [1, 2] }, boss: { chance: 1, amount: [2, 3] } },
  },
};
