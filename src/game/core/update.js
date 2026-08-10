/** Шаг симуляции: сущности, столкновения, таймеры волны. */

Object.assign(Game.prototype, {
  update(dt) {
    if (this.isBoostersOpen() || this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) return;
    const realDt = Math.min(dt, 0.1);
    music.setIntensity(this.wavePhase === 'boss' ? 'boss' : (this.isChaseMode ? 'rush' : 'calm'));

    if (this.eventCooldown > 0) this.eventCooldown -= realDt;
    if (this.lightsOut > 0) this.lightsOut -= realDt;
    if (this.fireAlarm > 0) this.fireAlarm -= realDt;
    if (this._eventBanner) {
      this._eventBanner.t -= realDt;
      if (this._eventBanner.t <= 0) this._eventBanner = null;
    }

    // Скользкий пол
    const zone = this.zoneAt(this.player.x, this.player.y);
    let slip = zone && zone.type === 'slippery' ? 1.35 : 1;

    const dir = this.getInputDir();
    if (this.player.dashTime <= 0) {
      this.player.x += dir.x * this.player.speed * slip * realDt;
      this.player.y += dir.y * this.player.speed * slip * realDt;
    }
    if (dir.x || dir.y) this.player.angle = Math.atan2(dir.y, dir.x);
    this.player.update(realDt, this.worldW, this.worldH, this);
    this.player.tickAnim(realDt, !!(dir.x || dir.y));
    this.pushOutOfObstacles(this.player, this.player.r);

    // Камера с lead (видимая область с учётом зума)
    const lead = 60;
    const targetCX = this.player.x - this.viewW() / 2 + Math.cos(this.player.angle) * lead * 0.35;
    const targetCY = this.player.y - this.viewH() / 2 + Math.sin(this.player.angle) * lead * 0.35;
    this.camera.x = this.camera.x + (targetCX - this.camera.x) * Math.min(1, realDt * 6);
    this.camera.y = this.camera.y + (targetCY - this.camera.y) * Math.min(1, realDt * 6);

    // Режим охота/побег
    this.modeTimer += realDt;
    if (this.modeFlash > 0) this.modeFlash -= realDt;
    if (this.comboShield > 0) this.comboShield -= realDt;
    if (this.comboTimer > 0) {
      this.comboTimer -= realDt;
      if (this.comboTimer <= 0 && this.comboShield <= 0) this.combo = 0;
    }
    if (this.modeTimer >= this.MODE_DURATION) {
      this.modeTimer = 0;
      this.isChaseMode = !this.isChaseMode; // rush hour on/off — побега больше нет
      this.modeFlash = 0.5;
      sfx.mode();
    }

    // Считаем живые баблы один раз за кадр (не на каждом мобе)
    let liveBubbles = 0;
    for (const e of this.enemies) {
      if (e.bubble && !e.bubble.dead) liveBubbles++;
    }
    this._liveBubbles = liveBubbles;

    for (const enemy of this.enemies) {
      enemy.update(realDt, this.player, this.worldW, this.worldH, this.isChaseMode, this);
      this.pushOutOfObstacles(enemy, enemy.r);

      // Контакт
      const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
      const hitR = this.player.r + enemy.r - (enemy.type === 'tank' ? 0 : 2);
      if (d < hitR) {
        if (enemy.noDamage || enemy.type === 'child') {
          const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
          this.player.knockback.x += Math.cos(a) * 140;
          this.player.knockback.y += Math.sin(a) * 140;
          enemy.knockback.x -= Math.cos(a) * 80;
          enemy.knockback.y -= Math.sin(a) * 80;
        } else if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (enemy.type === 'tank' || enemy.type === 'miniboss' || enemy.type === 'director') {
            const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
            this.player.knockback.x += Math.cos(a) * 100;
            this.player.knockback.y += Math.sin(a) * 100;
          }
          const beforeHp = this.player.hp;
          if (this.player.takeDamage(enemy.x, enemy.y)) {
            this.tookDamage = true;
            if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
            this.spawnParticles(this.player.x, this.player.y, 40, '#e74c3c', 350, 0.8);
            this.endGame(false, enemy.nameTag || 'Покупатель');
            return;
          }
          if (this.player.hp < beforeHp) {
            this.tookDamage = true;
            if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
          }
          sfx.hurt(); this.vibrate(40);
          this.spawnParticles(this.player.x, this.player.y, 8, '#ff6b6b', 150, 0.4);
          const a = angleTo(this.player.x, this.player.y, enemy.x, enemy.y);
          enemy.knockback.x = Math.cos(a) * 200;
          enemy.knockback.y = Math.sin(a) * 200;
        }
      }
    }

    // ranged stapler shot once per swing
    if (this.player.attacking && this.player._justFiredRanged) {
      this.player._justFiredRanged = false;
      const a = this.player.angle;
      this.playerProjectiles.push({
        x: this.player.x, y: this.player.y, angle: a, speed: 420, life: 0.9, r: 7, dmg: this.player.damage,
      });
    }

    // Атака
    if (this.player.attacking) {
      for (const enemy of this.enemies) {
        if (this.player.isEnemyInHitZone(enemy)) {
          this.player.hitEnemies.add(enemy);
          let dmg = this.player.getAttackDamage();
          if (this.player.critChance && Math.random() < this.player.critChance) dmg += 1;
          const knock = (this.player.knockPower || 300) * (1 + (this.player.chargePower || 0) * 0.4)
            * (this.player._justAoe ? 1.35 : 1);
          const died = enemy.hit(dmg, this.player.x, this.player.y, knock, this.player.stunOnHit || 0);
          this.player.fillSkill(6 + (this.player.chargePower || 0) * 8);
          this.spawnParticles(enemy.x, enemy.y, 8, this.player.stunOnHit ? '#5dade2' : '#ffaa00', 180, 0.4);
          if (Math.random() < 0.35) {
            this.spawnSpriteFx('fx_hit_spark', enemy.x, enemy.y, { scale: 0.55, life: 0.18, vy: -5 });
          }
          sfx.hit();

          // Разрушение витрин рядом — через прилавки с hp
          for (const ob of this.obstacles) {
            if (ob.type === 'counter' && ob.hp > 0) {
              const cx = ob.x + ob.w / 2, cy = ob.y + ob.h / 2;
              if (dist(enemy.x, enemy.y, cx, cy) < 50) {
                // no-op visual elsewhere
              }
            }
          }

          if (died) {
            // Комбо сильнее в побеге
            this.combo++;
            this.comboTimer = 3.2;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.player.fillSkill(12 + Math.min(20, this.combo * 2));
            const mult = 1 + Math.floor(this.combo / 3);
            this.score += mult;
            const leveled = this.player.gainXP(enemy.xpReward);
            if (leveled) {
              this.pendingUpgrades += leveled;
              this.openUpgradeUI();
            }
            sfx.kill();
            const sizeMult = (enemy.type === 'boss' || enemy.type === 'director') ? 2.5
              : (enemy.type === 'fatty' ? 2.0 : 1);
            const deathColor = enemy.type === 'fatty' ? '#ff6b00'
              : (this.isChaseMode ? '#e74c3c' : '#f1c40f');
            this.spawnParticles(enemy.x, enemy.y, Math.floor(20 * sizeMult), deathColor, 280 * sizeMult, 0.7);
            this.spawnSpriteFx(Math.random() < 0.5 ? 'fx_blood' : 'fx_hit_blood', enemy.x, enemy.y, {
              scale: 0.55 * sizeMult, scaleEnd: 0.9 * sizeMult, life: 0.32, vy: -10,
            });
            if (enemy.type === 'fatty' || enemy.explodes) {
              this.spawnSpriteFx('fx_skull', enemy.x, enemy.y - 10, { scale: 0.7, life: 0.45, vy: -40 });
            }
            this.screenShake = Math.max(this.screenShake, 0.12 * sizeMult);

            const dropChance = enemy.type === 'boss' || enemy.type === 'director' ? 1 :
              enemy.type === 'fatty' ? 0.55 :
              enemy.type === 'influencer' ? 0.6 : 0.28;
            this.dropCoins(enemy);
            if (Math.random() < dropChance) {
              this.pickups.push(new Pickup(enemy.x, enemy.y, Math.random() < 0.25 ? 'lunch' : 'heal'));
            }
            if (this.selectedChallenge !== 'hammer_only' && Math.random() < 0.09) {
              const kinds = ['temp_mop', 'temp_stapler', 'temp_extinguisher'];
              this.pickups.push(new Pickup(enemy.x + rand(-8, 8), enemy.y + rand(-8, 8), pick(kinds)));
            }

            if (enemy.type === 'fatty' || enemy.explodes) {
              this.armFattyFuse(enemy);
            }

            if (enemy.type === 'director') {
              this.endGame(true);
              return;
            }
            this.onEnemyKilled(enemy);
          }
        }
      }
    }

    // Тикают бомбы — взрыв с задержкой
    for (const bomb of this.fuseBombs) {
      bomb.life -= realDt;
      if (bomb.life <= 0 && !bomb.exploded) {
        bomb.exploded = true;
        if (this.explodeAt(bomb.x, bomb.y)) return;
      }
    }
    this.fuseBombs = this.fuseBombs.filter(b => !b.exploded);

    // на случай старых _pendingFuse (до фикса explodeAt)
    for (const e of this.enemies) {
      if (e._pendingFuse && e.hp <= 0) {
        e._pendingFuse = false;
        this.armFattyFuse(e);
        this.onEnemyKilled(e);
      }
    }

    this.enemies = this.enemies.filter(e => e.hp > 0);
    if (this._clearMobsAfterKill) {
      this.enemies = this.enemies.filter(e => e.type === 'boss' || e.type === 'miniboss' || e.type === 'director');
      this._clearMobsAfterKill = false;
    }

    // Снаряды (книга жалоб)
    for (const pr of this.projectiles) {
      pr.update(realDt);
      if (!pr.dead && dist(pr.x, pr.y, this.player.x, this.player.y) < this.player.r + pr.r) {
        pr.dead = true;
        this.player.applyComplaint();
        this.spawnParticles(this.player.x, this.player.y, 10, '#8e44ad', 120, 0.4);
        sfx.hurt();
        this.vibrate(35);
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt);
    for (const p of this.particles) p.update(realDt);
    this.particles = this.particles.filter(p => !p.dead);
    this.tickSpriteFx(realDt);
    for (const b of this.boomFx) b.life -= realDt;
    this.boomFx = this.boomFx.filter(b => b.life > 0);

    if (this.updateBossLineAttacks(realDt)) return;

    for (const pk of this.pickups) {
      pk.update(realDt, this.player);
      if (!pk.dead && dist(this.player.x, this.player.y, pk.x, pk.y) < this.player.r + pk.r + 4) {
        if (pk.type === 'coin') {
          this.coins += pk.value || 1;
          pk.life = 0; sfx.coin();
          this.spawnParticles(pk.x, pk.y, 8, '#f1c40f', 100, 0.35);
        } else if (pk.type === 'heal' && this.player.hp < this.player.maxHp) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          pk.life = 0; sfx.pickup();
          this.spawnParticles(pk.x, pk.y, 12, '#ff6b6b', 120, 0.5);
        } else if (pk.type === 'lunch') {
          this.player.fillSkill(55);
          pk.life = 0; sfx.pickup();
          this.spawnParticles(pk.x, pk.y, 16, '#f39c12', 140, 0.5);
        } else if (pk.type.startsWith('temp_') && this.selectedChallenge !== 'hammer_only') {
          const id = pk.type.replace('temp_', '');
          const tw = TEMP_WEAPONS[id];
          if (tw) {
            this.player.applyTempWeapon(tw);
            pk.life = 0; sfx.pickup();
            this.spawnParticles(pk.x, pk.y, 14, '#5dade2', 130, 0.45);
          }
        }
      }
    }
    this.pickups = this.pickups.filter(p => !p.dead);

    // player projectiles (stapler)
    for (const pr of this.playerProjectiles) {
      pr.x += Math.cos(pr.angle) * pr.speed * realDt;
      pr.y += Math.sin(pr.angle) * pr.speed * realDt;
      pr.life -= realDt;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        if (dist(pr.x, pr.y, enemy.x, enemy.y) < enemy.r + pr.r) {
          let dmg = pr.dmg || 1;
          if (this.player.critChance && Math.random() < this.player.critChance) dmg += 1;
          const died = enemy.hit(dmg, this.player.x, this.player.y, 220, 0);
          this.player.fillSkill(5);
          this.spawnParticles(enemy.x, enemy.y, 6, '#bdc3c7', 140, 0.3);
          pr.life = 0;
          if (died) this.onEnemyKilled(enemy);
          break;
        }
      }
    }
    this.playerProjectiles = this.playerProjectiles.filter(pr => pr.life > 0);
    this.flushReviveFx();
  },

  flushReviveFx() {
    if (!this.player || !this.player._justRevived) return;
    this.player._justRevived = false;
    this.showEventBanner('💖 Вторая жизнь!', 2.2);
    this.spawnParticles(this.player.x, this.player.y, 28, '#ff6b9d', 220, 0.55);
    this.screenShake = Math.max(this.screenShake, 0.25);
    sfx.level();
    this.vibrate([20, 40, 20]);
  },
});
