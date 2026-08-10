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
/** Android/мобилки: меньше дорогих оверлеев (свет, blur). Число мобов не трогаем. */
const LOW_GFX = /Android|Mobile|iPhone|iPad/i.test(navigator.userAgent || '');

/** Ограждение арены (витрины сверху + стены по периметру). */
const ARENA_FENCE = {
  topShop: 102,
  side: 42,
  bottom: 54,
  doorW: 116,
  doorH: 54,
};
