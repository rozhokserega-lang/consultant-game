/** Фитиль жирного покупателя и взрыв по площади. */

Object.assign(Game.prototype, {
  /** Завод фитиля — взрыв через FATTY_FUSE_TIME */
  armFattyFuse(enemy) {
    this.fuseBombs = this.fuseBombs || [];
    this.fuseBombs.push({
      x: enemy.x,
      y: enemy.y,
      life: FATTY_FUSE_TIME,
      max: FATTY_FUSE_TIME,
      sprite: enemy.sprite || 'enemy_tank',
      scale: 0.78,
      hueRotate: enemy.hueRotate || 0,
      r: enemy.r,
    });
    sfx.mode();
  },

  /** Взрыв по координатам: урон игроку и соседям */
  explodeAt(x, y) {
    const R = FATTY_EXPLODE_RADIUS;
    this.spawnParticles(x, y, 45, '#ff6b00', 420, 0.9);
    this.spawnParticles(x, y, 25, '#fff200', 280, 0.6);
    this.spawnParticles(x, y, 18, '#e74c3c', 200, 0.5);
    this.screenShake = Math.max(this.screenShake, 0.35);
    sfx.hurt();
    this.vibrate([40, 30, 60]);

    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x, y, life: 0.45, max: 0.45 });

    if (this.player.invincible <= 0 && this.player.lunchTimer <= 0) {
      if (dist(x, y, this.player.x, this.player.y) < R + this.player.r) {
        if (this.player.takeDamage(x, y)) {
          this.tookDamage = true;
          if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
          this.endGame(false, 'Взрыв жирного покупателя 💣');
          return true;
        }
      }
    }

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.type === 'boss' || e.type === 'director') continue;
      if (dist(x, y, e.x, e.y) < R + e.r) {
        const died = e.hit(2, x, y);
        this.spawnParticles(e.x, e.y, 8, '#ffaa00', 160, 0.35);
        if (died) {
          this.score += 1;
          this.player.gainXP(e.xpReward);
          this.dropCoins(e);
          // сразу кредитовать килл: _pendingFuse раньше терялся при filter в том же кадре
          if (e.type === 'fatty' || e.explodes) this.armFattyFuse(e);
          this.onEnemyKilled(e);
        }
      }
    }
    return false;
  },
});
