/**
 * Вылазка: прогрессия меты, баффы редкости, окно эвакуации.
 */
'use strict';

/** Секунд на эвакуацию после босса лифта, затем подкрепление. */
const EXTRACT_EVAC_WINDOW = 48;
/** Сколько мобов спавнится у лифта по истечении окна. */
const EXTRACT_EVAC_REINFORCE = 7;

/** Цена страховки 1 предмета на забег (у Игоря). */
const EXTRACT_INSURANCE_PRICE = 100;

/** Бафф скорости при подборе лута редкости rare+. */
const EXTRACT_RARITY_BUFFS = {
  rare: { speedMul: 1.1, t: 20, label: '+10% скорость' },
  epic: { speedMul: 1.12, t: 22, label: '+12% скорость' },
  legendary: { speedMul: 1.15, t: 25, heal: 1, label: '+15% скорость и +1❤' },
};

/** Сет модов Коли: 3+ одновременно в рюкзаке. */
const EXTRACT_MOD_SET_NEED = 3;
const EXTRACT_MOD_SET_DMG = 1.1;
const EXTRACT_MOD_SET_SPEED = 1.08;

/**
 * Разлок за суммарный вынесенный value (totalExtractedValue).
 * Стартеры без need всегда доступны.
 */
const EXTRACT_STARTER_UNLOCKS = {
  receipt: 0,
  mop: 0,
  coffee: 0,
  phone: 400,
  speaker: 800,
  card: 1200,
};

/** Порог выноса, чтобы подниматься на этаж (ключ = целевой этаж). */
const EXTRACT_FLOOR_NEED = {
  2: 350,
  3: 900,
};

/** @deprecated используй EXTRACT_FLOOR_NEED[2] */
const EXTRACT_FLOOR2_NEED = 350;
/** Порог выноса на 3 этаж VIP. */
const EXTRACT_FLOOR3_NEED = 900;
