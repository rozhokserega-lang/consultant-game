/**
 * Вылазка: общие константы режима.
 */
'use strict';

const EXTRACT_VERSION = '0.5.4-extract-logs';

/** Размер хаб-парковки (мир в пикселях). */
const EXTRACT_HUB_W = 1200;
const EXTRACT_HUB_H = 820;

/** Радиус взаимодействия с NPC / лифтом / лутом. */
const EXTRACT_INTERACT_R = 56;

/** Размер этажа вылазки (~×3 площади к 2400×1800 + доп. крылья комнат). */
const EXTRACT_RAID_W = 4200;
const EXTRACT_RAID_H = 3150;

/** Маша платит долю от value лута / модов. */
const EXTRACT_SELL_RATE = 0.8;

/** Общая сложность мобов на этаже. */
const EXTRACT_MOB_HP_MUL = 1.35;
const EXTRACT_MOB_SPD_MUL = 1.08;

/** Дальность авто-снарядов в вылазке (карта огромная — иначе улетают за камеру). */
const EXTRACT_PROJ_MAX_DIST = 360;
const EXTRACT_PROJ_LIFE_CAP = 0.75;
const EXTRACT_RICOCHET_LIFE_CAP = 0.95;
const EXTRACT_RICOCHET_BOUNCE_CAP = 2;
const EXTRACT_BOOMERANG_RANGE_CAP = 220;

/** Максимальный этаж вылазки (с верхнего — только в убежище). */
const EXTRACT_MAX_FLOOR = 3;

/**
 * Множители по этажу (поверх EXTRACT_MOB_* и value лута).
 * Карта выбирается в buildExtractRaidWorld.
 */
const EXTRACT_FLOOR_DEFS = {
  1: { label: '1 этаж', hpMul: 1, spdMul: 1, lootMul: 1 },
  2: { label: '2 этаж', hpMul: 1.35, spdMul: 1.08, lootMul: 1.55 },
  3: { label: '3 этаж VIP', hpMul: 1.85, spdMul: 1.16, lootMul: 2.15 },
};
