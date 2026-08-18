/**
 * Распродажа: Спавн рядовых врагов и применение к ним сложности.
 */
'use strict';

Game.prototype.spawnSaleEnemy = function (forcedType) {
  const run = this.getSaleArenaRun();
  const cap = Math.round(saleMaxEnemiesForTime(this.saleTime || 0) * (run.capMul || 1));
  if (this.enemies.filter((e) => e.hp > 0).length >= cap) return null;
  const t = this.saleTime || 0;
  // VS-feel: в начале спавн дальше за экраном
  const margin = t < 180 ? 150 + rand(0, 90) : t < 420 ? 110 + rand(0, 40) : 80;
  const side = randi(0, 3);
  let x, y;
  // спавн за краем камеры / у границ мира
  const cam = this.camera;
  const vw = this.viewW();
  const vh = this.viewH();
  if (side === 0) { x = rand(cam.x - 40, cam.x + vw + 40); y = cam.y - margin; }
  else if (side === 1) { x = cam.x + vw + margin; y = rand(cam.y - 40, cam.y + vh + 40); }
  else if (side === 2) { x = rand(cam.x - 40, cam.x + vw + 40); y = cam.y + vh + margin; }
  else { x = cam.x - margin; y = rand(cam.y - 40, cam.y + vh + 40); }
  x = Math.max(40, Math.min(this.worldW - 40, x));
  y = Math.max(40, Math.min(this.worldH - 40, y));
  if (typeof this.clampPointToPaintedWalk === 'function') {
    const p = this.clampPointToPaintedWalk(x, y, 24);
    if (p) { x = p.x; y = p.y; }
  }

  let type = forcedType || saleEnemyType(this.saleTime);
  if (!forcedType && this.saleForceTypes && this.saleForceTypes.length) {
    type = this.saleForceTypes[randi(0, this.saleForceTypes.length - 1)];
  }
  // wave=1: рост HP/скорости только через applySaleEnemyDifficulty (SALE_DIFFICULTY),
  // иначе конструктор Enemy ещё раз масштабирует по wave и получается ×2 кривая.
  const e = new Enemy(x, y, type, 1);
  this.applySaleEnemyDifficulty(e);
  // в распродаже все агрессивны
  this.enemies.push(e);
  return e;
};

/** LN DIFFICULTY: HP/скорость растут с минутами (не только warm-down). */
Game.prototype.applySaleEnemyDifficulty = function (e, opts) {
  opts = opts || {};
  if (!e || opts.noScale) return e;
  const t = this.saleTime || 0;
  const run = this.getSaleArenaRun();
  const hpMul = saleEnemyScaleMul(t) * (SALE_STAT_SCALE || 1) * (run.hpMul || 1)
    * (this.saleV2 && this.saleV2HasEffect && this.saleV2HasEffect('after_dark')
      && t >= (typeof SALE_V2_UBER_AFTER_DARK_SEC === 'number' ? SALE_V2_UBER_AFTER_DARK_SEC : 900)
      ? 1.25 : 1);
  const spdMul = saleEnemySpdScale(t) * (run.spdMul || 1);
  e.maxHp = Math.max(1, Math.round(e.maxHp * hpMul));
  e.hp = e.maxHp;
  e.speed = (e.speed || 60) * spdMul;
  e._saleOrbT = 0;
  return e;
};

Game.prototype.spawnSaleEnemyNear = function (x, y, type, opts) {
  opts = opts || {};
  if (this.enemies.filter((e) => e.hp > 0).length >= SALE_MAX_ENEMIES + (opts.overCap || 0)) return null;
  const e = new Enemy(x, y, type || 'normal', 1);
  if (opts.nameTag) e.nameTag = opts.nameTag;
  if (opts.hp) { e.hp = e.maxHp = opts.hp; }
  if (opts.hpMul) { e.maxHp = Math.max(1, Math.round(e.maxHp * opts.hpMul)); e.hp = e.maxHp; }
  if (!opts.skipDiff && !opts.hp) {
    // фиксированный hp босса — в spawnSaleBoss уже с bossHp-кривой
    this.applySaleEnemyDifficulty(e, opts);
  } else {
    e._saleOrbT = 0;
    if (!opts.hp) e.speed = (e.speed || 60) * saleEnemySpdScale(this.saleTime || 0);
  }
  if (opts.xpReward) e.xpReward = opts.xpReward;
  if (opts.vip) e._saleVip = true;
  this.enemies.push(e);
  return e;
};
