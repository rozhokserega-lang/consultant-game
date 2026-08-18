/**
 * Распродажа: Числовые константы забега и единый регулятор сложности.
 */
'use strict';

const SALE_VERSION = '0.16.1-second-base';
const SALE_DURATION = 20 * 60; // классика: конец; 2.0: старт овертайма
const SALE_MAX_ENEMIES = 130; // орда как в VS (мобильный потолок)
const SALE_WORLD_MUL = 2.75;
/**
 * Общий масштаб HP врагов и урона по ним (не HP игрока).
 * ×10 → цифры «вкуснее», TTK и баланс те же, если крутить только здесь.
 */
const SALE_STAT_SCALE = 10;

/** LN-style: жёсткий потолок слотов — билд, а не «собери всё» */
const SALE_MAX_WEAPONS = 4;
const SALE_MAX_PASSIVES = 8;

/**
 * Настройки забега по арене. sport — первый зал; food — второй, сложнее, но 5 слотов.
 * Не указанные поля берутся из SALE_ARENA_RUN_DEFAULT.
 */
const SALE_ARENA_RUN_DEFAULT = {
  weaponSlots: SALE_MAX_WEAPONS,
  hpMul: 1,
  spdMul: 1,
  spawnMul: 1,
  capMul: 1,
  burstAdd: 0,
};
const SALE_ARENA_RUN = {
  food: {
    weaponSlots: 5,
    hpMul: 1.22,
    spdMul: 1.07,
    spawnMul: 0.88,
    capMul: 1.15,
    burstAdd: 1,
  },
};
/** После этого времени/уровня в пул попадают все базы (хаб = ранний ассортимент) */
const SALE_CATALOG_OPEN_SEC = 360; // 6 мин
const SALE_CATALOG_OPEN_LV = 12;
const SALE_ROLE_BAN_SEC = 20;
const SALE_LIFESTEAL_CD = 2.2; // сек между хилами от вампиризма
/** LN-style: враги слабее в начале, к 9:00 выходят на baseline кривой */
const SALE_WARM_MINUTES = 9;

/**
 * Единый регулятор сложности как в LONG NIGHT (DIFFICULTY + WDMG).
 * m = минуты забега. Крутить только здесь.
 */
const SALE_DIFFICULTY = {
  mul: 1.15,
  /** LN WDMG: глобальный множитель урона оружия — один раз в saleDmgMul */
  weaponDmg: 0.85,
  /** общий i-frame орбит на враге (сек), как LN orbT */
  orbHitCd: 0.42,
  warm: (m) => 0.65 + 0.35 * Math.min(1, m / SALE_WARM_MINUTES),
  hpWarm: (m) => 0.55 + 0.45 * Math.min(1, m / 4),
  /** кривая HP: ~20× к 20-й минуте (не 35×) */
  hp: (m) => 1 + 0.25 * m + 0.035 * m * m,
  spd: (m) => 1 + Math.min(0.32, m * 0.038),
  /** early soft: мобы медленнее в первые минуты (VS-feel) */
  spdEarly: (m) => 0.58 + 0.42 * Math.min(1, m / 6),
  bossHp: (m) => 1 + m * 0.09,
};
/** LN-style директор: босс каждые 180с, волны ~42с, элиты ~70с */
const SALE_BOSS_INTERVAL = 180;
const SALE_BOSS_GAP_AFTER_KILL = 45;
const SALE_WAVE_FIRST = 90;
const SALE_WAVE_INTERVAL = 42;
const SALE_ELITE_START = 115;
const SALE_ELITE_INTERVAL = 70;
