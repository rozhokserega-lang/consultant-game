/** Настройки сложности, лимиты сущностей и размеры арены. */

/** −20% к давлению врагов (HP, скорость, длина волны, плотность). */
const DIFFICULTY_EASE = 0.8;
const KILLS_PER_WAVE = Math.round(30 * DIFFICULTY_EASE);
const MAX_ENEMIES_ON_FIELD = Math.max(12, Math.round(18 * DIFFICULTY_EASE));
const SHIFT_WAVES = 10;
const FATTY_EXPLODE_RADIUS = Math.round(110 * DIFFICULTY_EASE);
const FATTY_FUSE_TIME = 1.35 / DIFFICULTY_EASE; // чуть больше времени убежать
/** Сколько облачков речи одновременно (measureText/текст на Android дорогой). */
const MAX_SPEECH_BUBBLES = 3;
/** Потолок частиц — на мобилках сотни fill-дуг в кадр. */
const MAX_PARTICLES = 90;
/** Авто: Android/iPhone — меньше дорогих оверлеев. Число мобов не трогаем. */
const GFX_MOBILE = /Android|Mobile|iPhone|iPad/i.test(navigator.userAgent || '');
/** Совместимость: true на мобилках или в облегчённом режиме из настроек. */
let LOW_GFX = GFX_MOBILE;
/** Ручной режим «меньше эффектов» — ещё жёстче, чем авто-мобилка. */
let LITE_GFX = false;

function applyGfxFlags(lite) {
  LITE_GFX = !!lite;
  LOW_GFX = GFX_MOBILE || LITE_GFX;
}

function isLiteGfx() {
  return LITE_GFX;
}

/** Ограждение арены (витрины сверху + стены по периметру). */
const ARENA_FENCE = {
  topShop: 102,
  side: 42,
  bottom: 54,
  doorW: 116,
  doorH: 54,
};
