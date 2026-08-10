/**
 * Распродажа: Кривые забега: масштаб врагов, спавн, XP, потолок орды.
 */
'use strict';

function saleWarmMul(tSec) {
  const m = Math.max(0, tSec) / 60;
  return SALE_DIFFICULTY.warm(m);
}
function saleCoinWarmMul(tSec) {
  const m = Math.max(0, tSec) / 60;
  // ×2 в начале → ×1 к концу warm
  return Math.max(1, 2 - m / SALE_WARM_MINUTES);
}
/** Итоговый множитель HP моба (волна Enemy × эта кривая). */
function saleEnemyScaleMul(tSec) {
  const m = Math.max(0, tSec) / 60;
  return SALE_DIFFICULTY.mul
    * SALE_DIFFICULTY.warm(m)
    * SALE_DIFFICULTY.hpWarm(m)
    * SALE_DIFFICULTY.hp(m);
}
function saleEnemySpdScale(tSec) {
  const m = Math.max(0, tSec) / 60;
  const early = SALE_DIFFICULTY.spdEarly
    ? SALE_DIFFICULTY.spdEarly(m)
    : 1;
  return early * SALE_DIFFICULTY.spd(m);
}

/** Потолок орды растёт со временем — в начале не душим игрока */
function saleMaxEnemiesForTime(t) {
  if (t < 60) return 32;
  if (t < 180) return 50;
  if (t < 360) return 75;
  if (t < 600) return 105;
  return SALE_MAX_ENEMIES;
}

function saleXpToNext(level) {
  // к середине забега уровни дороже — пул апгрейдов не кончается на 10-й минуте
  const late = Math.max(0, level - 10);
  return Math.floor(10 + level * 5.2 + level * level * 0.42 + late * late * 0.55);
}

function saleTimeFactor(t) {
  // 0..1 за 20 минут
  return Math.min(1, t / SALE_DURATION);
}

function saleSpawnInterval(t) {
  const f = saleTimeFactor(t);
  // VS-like: старт редкий (~1с), к концу орда
  let iv = Math.max(0.07, 1.05 - f * 0.95);
  if (t < 120) iv = Math.max(iv, 0.9);
  else if (t < 300) iv = Math.max(iv, 0.55);
  if (t >= 600) iv *= 0.85;
  return iv;
}

/** Сколько мобов за один тик спавна */
function saleSpawnBurst(t) {
  const f = saleTimeFactor(t);
  let burst = 1;
  if (f > 0.75) burst = 5;
  else if (f > 0.5) burst = 4;
  else if (f > 0.35) burst = 3;
  else if (f > 0.22) burst = 2; // ~4.5 мин, не со 2-й
  if (t >= 600) burst += 1;
  return burst;
}

function saleEnemyType(t) {
  const f = saleTimeFactor(t);
  const r = Math.random();
  if (f > 0.85 && r < 0.04) return 'director';
  if (f > 0.55 && r < 0.08) return 'boss';
  if (f > 0.35 && r < 0.12) return 'fatty';
  if (f > 0.25 && r < 0.18) return 'tank';
  if (f > 0.15 && r < 0.28) return 'fast';
  if (f > 0.4 && r < 0.35) return 'manager';
  if (r < 0.12) return 'returner';
  return 'normal';
}

function saleEnemyWaveApprox(t) {
  return 1 + Math.floor(saleTimeFactor(t) * 14);
}
