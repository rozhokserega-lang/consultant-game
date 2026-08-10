/**
 * Распродажа: Перехваты базовых методов Game под режим Распродажи.
 */
'use strict';

// ─── hooks into Game ───────────────────────────────────────────

const saleBaseResize = Game.prototype.resize;
Game.prototype.resize = function () {
  saleBaseResize.call(this);
  if (this.gameMode === 'sale' && !this.isBoostersOpen() && !this.inMainMenu) {
    this.worldW = Math.max(2800, Math.floor(this.viewW() * SALE_WORLD_MUL));
    this.worldH = Math.max(2000, Math.floor(this.viewH() * SALE_WORLD_MUL));
  }
};

Game.prototype.update = function (dt) {
  return this.updateSale(dt);
};

const saleBaseUpdateHUD = Game.prototype.updateHUD;
Game.prototype.updateHUD = function () {
  if (this.isBoostersOpen() || this.inMainMenu || !this.saleWeapons) {
    return saleBaseUpdateHUD.call(this);
  }
  return this.updateSaleHUD();
};

Game.prototype.endGame = function (won, killer) {
  return this.endSaleGame(won, killer);
};

Game.prototype.onEnemyKilled = function (enemy) {
  return this.onSaleEnemyKilled(enemy);
};

Game.prototype.openUpgradeUI = function () {
  return this.openSaleUpgradeUI();
};

Game.prototype.pickUpgrade = function (i) {
  return this.pickSaleUpgrade(i);
};

Game.prototype.resetGame = function () {
  return this.resetSaleGame();
};

const saleBaseExplodeAt = Game.prototype.explodeAt;
Game.prototype.explodeAt = function (x, y) {
  if (this.gameMode !== 'sale') return saleBaseExplodeAt.call(this, x, y);
  const R = typeof FATTY_EXPLODE_RADIUS !== 'undefined' ? FATTY_EXPLODE_RADIUS : 90;
  this.spawnParticles(x, y, 45, '#ff6b00', 420, 0.9);
  this.spawnParticles(x, y, 25, '#fff200', 280, 0.6);
  this.spawnParticles(x, y, 18, '#e74c3c', 200, 0.5);
  this.screenShake = Math.max(this.screenShake, 0.35);
  sfx.hurt();
  this.vibrate([40, 30, 60]);
  this.boomFx = this.boomFx || [];
  this.boomFx.push({ x, y, life: 0.45, max: 0.45 });
  // подпалина после взрыва (тонированная частица Kenney)
  this.spawnAnimFx('kfx_scorch', x, y, { life: 3.0, scale: 1.35, alpha: 0.45, tint: '#140b05' });

  if (this.player.invincible <= 0 && this.player.lunchTimer <= 0) {
    if (dist(x, y, this.player.x, this.player.y) < R + this.player.r) {
      if (this.player.takeDamage(x, y)) {
        this.tookDamage = true;
        this.endSaleGame(false, 'Взрыв жирного покупателя 💣');
        return true;
      }
      this.tookDamage = true;
      if (this.applySaleFragileExtra && this.applySaleFragileExtra()) return true;
    }
  }

  for (const e of this.enemies) {
    if (e.hp <= 0) continue;
    if (e.type === 'boss' || e.type === 'director') continue;
    if (dist(x, y, e.x, e.y) < R + e.r) {
      const died = e.hit(2, x, y);
      this.spawnParticles(e.x, e.y, 8, '#ffaa00', 160, 0.35);
      if (died) {
        if (e.type === 'fatty' || e.explodes) this.armFattyFuse(e);
        this.onSaleEnemyKilled(e);
      }
    }
  }
  return false;
};
