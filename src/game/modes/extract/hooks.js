/**
 * Вылазка: перехваты Game и маршрутизация относительно Распродажи.
 */
'use strict';

// Sale hooks уже перехватили update/endGame/resetGame безусловно —
// здесь добавляем ветки extract поверх и чиним dispatch.

const extractPrevUpdate = Game.prototype.update;
Game.prototype.update = function (dt) {
  if (this.gameMode === 'extract') return this.updateExtract(dt);
  return extractPrevUpdate.call(this, dt);
};

const extractPrevUpdateHUD = Game.prototype.updateHUD;
Game.prototype.updateHUD = function () {
  if (this.gameMode === 'extract') return this.updateExtractHUD();
  return extractPrevUpdateHUD.call(this);
};

const extractPrevOnSaleEnemyKilled = Game.prototype.onSaleEnemyKilled;
Game.prototype.onSaleEnemyKilled = function (enemy) {
  if (this.gameMode === 'extract') return this.onExtractEnemyKilled(enemy);
  return extractPrevOnSaleEnemyKilled.call(this, enemy);
};

const extractPrevSaleHitEnemy = Game.prototype.saleHitEnemy;
if (typeof extractPrevSaleHitEnemy === 'function') {
  Game.prototype.saleHitEnemy = function (e, dmg, srcX, srcY, knock, opts) {
    opts = opts || {};
    if (this.gameMode === 'extract' && e) {
      e._extractAggro = true;
      e._extractPassive = false;
      if (e._extractPattern === 'cashier_pair' && e._extractPairId) {
        const partner = (this.enemies || []).find(
          (o) => o !== e && o._extractPairId === e._extractPairId && o.hp > 0,
        );
        if (partner) {
          this.spawnSpriteFx('fx_shield', e.x, e.y - 6, { scale: 0.35, life: 0.12, vy: -6 });
          return false;
        }
      }
      const hpBefore = Math.max(0, e.hp || 0);
      const died = extractPrevSaleHitEnemy.call(this, e, dmg, srcX, srcY, knock, opts);
      const dealt = Math.max(0, hpBefore - Math.max(0, e.hp || 0));
      if (dealt > 0 && typeof this.recordExtractBalanceDmg === 'function') {
        this.recordExtractBalanceDmg(dealt, opts.weapon || opts.source || 'other');
      }
      return died;
    }
    return extractPrevSaleHitEnemy.call(this, e, dmg, srcX, srcY, knock, opts);
  };
}

const extractPrevEndSaleGame = Game.prototype.endSaleGame;
if (typeof extractPrevEndSaleGame === 'function') {
  Game.prototype.endSaleGame = function (won, killer) {
    if (this.gameMode === 'extract') {
      if (!won) this.failExtractRaid(killer || 'Поражение');
      return;
    }
    return extractPrevEndSaleGame.call(this, won, killer);
  };
}

const extractPrevEndGame = Game.prototype.endGame;
Game.prototype.endGame = function (won, killer) {
  if (this.gameMode === 'extract') {
    if (this.extractPhase === 'raid' && !won) {
      this.failExtractRaid(killer || 'Поражение');
      return;
    }
    this.endExtractToMenu();
    return;
  }
  return extractPrevEndGame.call(this, won, killer);
};

const extractPrevResetGame = Game.prototype.resetGame;
Game.prototype.resetGame = function () {
  if (this.gameMode === 'extract') {
    if (this.extractPhase === 'raid') {
      this.startExtractRaid({ floor: this.extractFloor || 1 });
      return;
    }
    if (this.gameOver || this.won) {
      this.gameOver = false;
      this.won = false;
      this.paused = false;
      this.killedBy = '';
      this.refreshMusicState();
      return;
    }
    this.startExtractHub({ resetPack: true });
    return;
  }
  return extractPrevResetGame.call(this);
};

const extractPrevResize = Game.prototype.resize;
Game.prototype.resize = function () {
  extractPrevResize.call(this);
  if (this.gameMode === 'extract' && !this.inMainMenu) {
    if (this.extractPhase === 'raid') {
      this.worldW = EXTRACT_RAID_W;
      this.worldH = EXTRACT_RAID_H;
    } else {
      this.worldW = EXTRACT_HUB_W;
      this.worldH = EXTRACT_HUB_H;
    }
  }
};

const extractPrevDrawBackground = Game.prototype.drawBackground;
Game.prototype.drawBackground = function () {
  if (this.gameMode === 'extract') {
    if (this.extractPhase === 'raid') this.drawExtractRaidBackground();
    else this.drawExtractHubBackground();
    // Препятствия рисуем в depth-sort через drawObstacle hook ниже
    return;
  }
  return extractPrevDrawBackground.call(this);
};

const extractPrevDrawObstacle = Game.prototype.drawObstacle;
Game.prototype.drawObstacle = function (ob) {
  if (this.gameMode === 'extract' && ob && String(ob.type || '').startsWith('extract_')) {
    return this.drawExtractObstacle(ob);
  }
  return extractPrevDrawObstacle.call(this, ob);
};

const extractPrevGetArenaBounds = Game.prototype.getArenaBounds;
Game.prototype.getArenaBounds = function () {
  if (this.gameMode === 'extract') {
    if (this.extractPhase === 'hub') return this.getExtractHubBounds();
    return {
      x0: 40,
      y0: 40,
      x1: this.worldW - 40,
      y1: this.worldH - 40,
      doorCx: this.worldW / 2,
      doorW: 80,
    };
  }
  return extractPrevGetArenaBounds.call(this);
};
