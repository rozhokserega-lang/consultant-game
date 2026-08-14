/**
 * Вылазка: паттерны атак мобов/боссов сверх базового Enemy.update.
 * Ничего не трогает в core enemy.js — через поля _extract* и примитивы Sale.
 */
'use strict';

function extractBubble(game, enemy, text) {
  if (typeof SpeechBubble !== 'function') return;
  const cap = (typeof MAX_SPEECH_BUBBLES !== 'undefined') ? MAX_SPEECH_BUBBLES : 3;
  if ((game._liveBubbles || 0) >= cap) return;
  enemy.bubble = new SpeechBubble(enemy, text);
  game._liveBubbles = (game._liveBubbles || 0) + 1;
}

Object.assign(Game.prototype, {
  /** Применить pattern/pair/patrol из записи карты + дефолты этажа. */
  applyExtractEnemyPattern(e, m, floor) {
    m = m || {};
    floor = floor || this.extractFloor || 1;
    if (m.pattern) e._extractPattern = m.pattern;
    if (m.bossPattern) e._extractBossPattern = m.bossPattern;
    if (m.pairId) e._extractPairId = m.pairId;
    if (m.passive) e._extractPassive = true;
    if (m.patrol && m.patrol.length) {
      e._extractPatrol = m.patrol.map((p) => ({
        x: this.worldW * p.x,
        y: this.worldH * p.y,
      }));
      e._extractPatrolI = 0;
    }

    // Босс лифта — свои фазы вместо director-AI
    if (e._extractExitBoss) {
      e._extractBossOwn = true;
      e.slashTimer = 1e9;
      e.patternTimer = 1e9;
      e.summonTimer = 1e9;
      if (!e._extractBossPattern) {
        e._extractBossPattern = floor >= 3 ? 'auditor_final'
          : floor >= 2 ? 'security_chief' : 'trainer';
      }
      if (floor === 1) {
        e._trainer = true;
        e.nameTag = 'Тренер';
        e.r = typeof TRAINER_RADIUS === 'number' ? TRAINER_RADIUS : 32;
      } else if (floor === 2) e.nameTag = e.nameTag || 'Начальник охраны';
      else e.nameTag = e.nameTag || 'Главный ревизор';
    }

    // Дефолты только для босса лифта — рядовых тегаем в картах
    if (!e._extractPattern && !e._extractExitBoss) {
      /* noop: pattern задаётся в raid-map / map-enrich */
    }

    if (e._extractPattern === 'cashier_pair' && e._extractPairId) {
      e.armorHits = Math.max(e.armorHits || 0, 2);
      e.nameTag = e.nameTag || 'Кассир';
    }
    if (e._extractPattern === 'auditor') {
      e._extractPassive = true;
    }
    if (e._extractPattern === 'trainee' && !e._extractPatrol) {
      const ox = e.x;
      const oy = e.y;
      e._extractPatrol = [
        { x: ox, y: oy },
        { x: ox + 70, y: oy + 20 },
        { x: ox + 20, y: oy - 55 },
      ];
      e._extractPatrolI = 0;
    }
  },

  /** Связать близких queue в цепочки (лидер + хвост). */
  linkExtractQueues() {
    const queues = (this.enemies || []).filter((e) => e.type === 'queue' && e.hp > 0);
    const used = new Set();
    for (const lead of queues) {
      if (used.has(lead)) continue;
      used.add(lead);
      lead._extractIsQueueLeader = true;
      lead.queueLeader = null;
      lead.queueIndex = 0;
      let idx = 1;
      for (const other of queues) {
        if (used.has(other) || other === lead) continue;
        if (dist(lead.x, lead.y, other.x, other.y) > 160) continue;
        used.add(other);
        other.queueLeader = lead;
        other.queueIndex = idx++;
        other._extractIsQueueLeader = false;
        if (idx > 4) break;
      }
    }
  },

  /** Спавн патруля / адда с паттерном. */
  spawnExtractPatternMob(x, y, type, opts) {
    opts = opts || {};
    if ((this.enemies || []).length > 42) return null;
    const floor = this.extractFloor || 1;
    const floorDef = this.getExtractFloorDef(floor);
    const globalHp = (typeof EXTRACT_MOB_HP_MUL !== 'undefined') ? EXTRACT_MOB_HP_MUL : 1;
    const globalSpd = (typeof EXTRACT_MOB_SPD_MUL !== 'undefined') ? EXTRACT_MOB_SPD_MUL : 1;
    const e = new Enemy(x, y, type || 'fast', 1);
    e._extractId = opts.id || ('pat_' + ((this._extractPatSeq = (this._extractPatSeq || 0) + 1)));
    e._extractAggro = opts.aggro !== false;
    e._extractAggroBase = opts.aggroR || 280;
    e._extractAggroR = e._extractAggroBase + (this._extractAggroBonus || 0);
    e.nameTag = opts.nameTag || 'Патруль';
    const hpMul = (opts.hpMul || 1) * globalHp * (floorDef.hpMul || 1);
    e.maxHp = Math.max(1, Math.round(e.maxHp * hpMul));
    e.hp = e.maxHp;
    e.speed *= (opts.spdMul || 1) * globalSpd * (floorDef.spdMul || 1);
    if (opts.pattern) e._extractPattern = opts.pattern;
    if (opts.pairId) {
      e._extractPairId = opts.pairId;
      e._extractPattern = opts.pattern || 'cashier_pair';
      e.armorHits = 2;
    }
    this.enemies.push(e);
    return e;
  },

  spawnExtractPatrolCall(guard) {
    if ((this.enemies || []).length > 40) return;
    const a = rand(0, Math.PI * 2);
    const nx = guard.x + Math.cos(a) * 70;
    const ny = guard.y + Math.sin(a) * 70;
    this.spawnExtractPatternMob(nx, ny, 'fast', {
      nameTag: 'Патруль',
      hpMul: 1.15,
      aggroR: 999,
    });
    this.showExtractBanner('📻 Охранник вызвал патруль!', 1.8);
    sfx.mode();
  },

  spawnExtractCashierPair(cx, cy, pairId) {
    const id = pairId || ('pair_' + ((this._extractPairSeq = (this._extractPairSeq || 0) + 1)));
    this.spawnExtractPatternMob(cx - 28, cy, 'tank', {
      nameTag: 'Кассир',
      pattern: 'cashier_pair',
      pairId: id,
      hpMul: 1.6,
      aggroR: 320,
    });
    this.spawnExtractPatternMob(cx + 28, cy, 'tank', {
      nameTag: 'Кассир',
      pattern: 'cashier_pair',
      pairId: id,
      hpMul: 1.6,
      aggroR: 320,
    });
  },

  spawnExtractTempWallsNear(enemy, player) {
    const wallW = 120;
    const wallH = 22;
    const a = angleTo(enemy.x, enemy.y, player.x, player.y) + Math.PI / 2;
    const mx = (enemy.x + player.x) / 2;
    const my = (enemy.y + player.y) / 2;
    this.obstacles = this.obstacles || [];
    const mk = (x, y, w, h) => {
      this.obstacles.push({
        x, y, w, h,
        dw: w,
        dh: h + 12,
        sprite: 'extract_wall',
        type: 'extract_wall',
        _extractTempWall: true,
        life: 7,
      });
    };
    mk(mx - wallW / 2, my - wallH / 2, wallW, wallH);
    mk(
      mx - wallH / 2 + Math.cos(a) * 8,
      my - wallW / 2 + Math.sin(a) * 8,
      wallH,
      wallW,
    );
  },

  tickExtractTempWalls(dt) {
    let dirty = false;
    for (const o of this.obstacles || []) {
      if (!o._extractTempWall || o.life == null) continue;
      o.life -= dt;
      if (o.life <= 0) dirty = true;
    }
    if (dirty) {
      this.obstacles = this.obstacles.filter((o) => !(o._extractTempWall && o.life <= 0));
    }
  },

  /** Убийство лидера очереди → замешательство хвоста. */
  onExtractQueueLeaderKilled(leader) {
    for (const e of this.enemies || []) {
      if (e.hp <= 0 || e.queueLeader !== leader) continue;
      e._extractConfusedT = 1.5;
      e._extractAggro = false;
      e.queueLeader = null;
      extractBubble(this, e, '…а?');
    }
    this.showExtractBanner('Очередь в замешательстве!', 1.6);
  },

  tickExtractMobPatterns(realDt) {
    let liveBubbles = 0;
    for (const e of this.enemies || []) {
      if (e.bubble && !e.bubble.dead) liveBubbles++;
    }
    this._liveBubbles = liveBubbles;

    const player = this.player;
    if (!player) return;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      // Замешательство очереди
      if (enemy._extractConfusedT > 0) {
        enemy._extractConfusedT -= realDt;
        enemy._extractAggro = false;
        continue;
      }

      // Патруль стажёра (без агро)
      if (enemy._extractPattern === 'trainee' && !enemy._extractAggro && enemy._extractPatrol) {
        const pts = enemy._extractPatrol;
        let i = enemy._extractPatrolI || 0;
        const t = pts[i];
        if (t) {
          const d = dist(enemy.x, enemy.y, t.x, t.y);
          if (d < 12) {
            enemy._extractPatrolI = (i + 1) % pts.length;
          } else {
            const a = angleTo(enemy.x, enemy.y, t.x, t.y);
            enemy.angle = a;
            enemy.x += Math.cos(a) * enemy.speed * 0.55 * realDt;
            enemy.y += Math.sin(a) * enemy.speed * 0.55 * realDt;
          }
        }
      }

      // Аудитор стоит на точке
      if (enemy._extractPattern === 'auditor' && enemy._extractAggro) {
        // не двигается сам — combat не должен сильно сдвигать; чуть тормозим ниже флагом
        enemy._extractHoldPos = true;
      }

      if (!enemy._extractPattern) continue;

      switch (enemy._extractPattern) {
        case 'trainee': {
          enemy._extractCallT = (enemy._extractCallT == null) ? rand(2, 3.5) : enemy._extractCallT - realDt;
          const d = dist(player.x, player.y, enemy.x, enemy.y);
          if (d < 260 && enemy._extractCallT <= 0) {
            enemy._extractCallT = rand(5, 7);
            extractBubble(this, enemy, 'Кто-нибудь, сюда! 🙋');
            for (const other of this.enemies) {
              if (other === enemy || other.hp <= 0 || other._extractAggro) continue;
              if (dist(enemy.x, enemy.y, other.x, other.y) < 220) {
                other._extractAggro = true;
                other._extractPassive = false;
              }
            }
          }
          break;
        }

        case 'radio_guard': {
          if (!enemy._extractAggro) break;
          if (enemy._extractCallT == null) {
            enemy._extractCallT = 3.4;
            extractBubble(this, enemy, 'Приём, нужна подмога! 📻');
            this.showExtractBanner('📻 Вызов патруля…', 1.6);
          } else if (enemy._extractCallT > 0) {
            enemy._extractCallT -= realDt;
            if (enemy._extractCallT <= 0) {
              this.spawnExtractPatrolCall(enemy);
              enemy._extractCallT = -1;
            }
          }
          break;
        }

        case 'sec_rush': {
          if (!enemy._extractAggro) break;
          const d = dist(player.x, player.y, enemy.x, enemy.y);
          enemy._extractRushState = enemy._extractRushState || 'idle';
          enemy._extractRushT = (enemy._extractRushT == null) ? rand(1.2, 2) : enemy._extractRushT - realDt;

          if (enemy._extractRushState === 'idle') {
            if (d < 240 && enemy._extractRushT <= 0) {
              enemy._extractRushState = 'windup';
              enemy._extractRushT = 0.6;
              enemy._extractRushAngle = angleTo(enemy.x, enemy.y, player.x, player.y);
              enemy.mobPose = 'attack';
              extractBubble(this, enemy, 'Стоять на месте!');
            }
          } else if (enemy._extractRushState === 'windup') {
            enemy.angle = enemy._extractRushAngle;
            if (enemy._extractRushT <= 0) {
              enemy._extractRushState = 'dash';
              enemy._extractRushT = 0.35;
            }
          } else if (enemy._extractRushState === 'dash') {
            const spd = enemy.speed * 3.4;
            enemy.x += Math.cos(enemy._extractRushAngle) * spd * realDt;
            enemy.y += Math.sin(enemy._extractRushAngle) * spd * realDt;
            enemy.angle = enemy._extractRushAngle;
            if (typeof this.hitsExtractWall === 'function'
              && this.hitsExtractWall(enemy.x, enemy.y, enemy.r + 4)) {
              enemy._extractRushState = 'stunned';
              enemy._extractRushT = 1.0;
              enemy.stunTimer = 1.0;
              this.spawnParticles(enemy.x, enemy.y, 10, '#95a5a6', 120, 0.3);
              this.showExtractBanner('СБ врезался — бей!', 1.4);
            } else if (enemy._extractRushT <= 0) {
              enemy._extractRushState = 'cool';
              enemy._extractRushT = 1.1;
            }
          } else if (enemy._extractRushState === 'stunned' || enemy._extractRushState === 'cool') {
            if (enemy._extractRushT <= 0) {
              enemy._extractRushState = 'idle';
              enemy._extractRushT = rand(2.5, 3.5);
              enemy.stunTimer = 0;
            }
          }
          break;
        }

        case 'merch_trail': {
          enemy._extractTrailT = (enemy._extractTrailT == null) ? 0.9 : enemy._extractTrailT - realDt;
          if (enemy._extractTrailT <= 0) {
            enemy._extractTrailT = 0.9;
            this.salePuddles = this.salePuddles || [];
            this.salePuddles.push({
              x: enemy.x, y: enemy.y, r: 30, life: 3.5, tick: 0,
              dmg: 1, color: '#e67e22', hurtPlayer: true, slow: 0.4,
            });
          }
          break;
        }

        case 'auditor': {
          if (!enemy._extractAggro) break;
          enemy._extractLineT = (enemy._extractLineT == null) ? rand(1.5, 2.5) : enemy._extractLineT - realDt;
          if (enemy._extractLineT <= 0) {
            enemy._extractLineT = rand(3.2, 4.2);
            if (typeof this.spawnBossLineAttack === 'function') {
              this.spawnBossLineAttack(enemy, player, {
                lines: 1, warn: 1.35, length: 560, halfW: 28, soft: true,
              });
            }
            extractBubble(this, enemy, 'Проверка документов!');
          }
          break;
        }

        case 'cashier_pair': {
          if (!enemy._extractPairId) break;
          const partner = this.enemies.find(
            (o) => o !== enemy && o._extractPairId === enemy._extractPairId && o.hp > 0,
          );
          if (partner) break;
          if (!enemy._extractEnraged) {
            enemy._extractEnraged = true;
            enemy.armorHits = 0;
            enemy.speed *= 1.6;
            enemy.r *= 1.15;
            extractBubble(this, enemy, 'Ты пожалеешь! 😡');
            this.showExtractBanner('😡 Кассир в ярости!', 1.8);
          }
          break;
        }

        default:
          break;
      }
    }
  },

  tickExtractBossPatterns(realDt) {
    const player = this.player;
    if (!player) return;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !enemy._extractExitBoss || !enemy._extractBossPattern) continue;
      const ratio = enemy.hp / Math.max(1, enemy.maxHp);
      const pat = enemy._extractBossPattern;

      // общий рывок босса (фаза 2+)
      if (enemy._extractBossRushState) {
        enemy._extractBossRushT = (enemy._extractBossRushT || 0) - realDt;
        if (enemy._extractBossRushState === 'windup') {
          enemy.angle = enemy._extractBossRushAng;
          if (enemy._extractBossRushT <= 0) {
            enemy._extractBossRushState = 'dash';
            enemy._extractBossRushT = 0.28;
          }
        } else if (enemy._extractBossRushState === 'dash') {
          const spd = enemy.speed * 3.2;
          enemy.x += Math.cos(enemy._extractBossRushAng) * spd * realDt;
          enemy.y += Math.sin(enemy._extractBossRushAng) * spd * realDt;
          if (enemy._extractBossRushT <= 0) enemy._extractBossRushState = null;
        }
      }

      switch (pat) {
        case 'trainer':
        case 'floor_manager': {
          enemy._extractLineT = (enemy._extractLineT == null) ? 2.2 : enemy._extractLineT - realDt;
          if (enemy._extractLineT <= 0 && !enemy._extractBossRushState) {
            enemy._extractLineT = 3.0;
            if (typeof this.spawnBossLineAttack === 'function') {
              this.spawnBossLineAttack(enemy, player, {
                lines: 1, warn: 1.15, length: 520, halfW: 32, soft: true,
              });
            }
            extractBubble(this, enemy, enemy._trainer ? 'Ещё подход!' : 'Стой где стоишь!');
          }
          if (ratio < 0.5) {
            enemy._extractRushCd = (enemy._extractRushCd == null) ? 1.5 : enemy._extractRushCd - realDt;
            if (enemy._extractRushCd <= 0 && !enemy._extractBossRushState) {
              enemy._extractRushCd = 3.2;
              enemy._extractBossRushState = 'windup';
              enemy._extractBossRushT = 0.55;
              enemy._extractBossRushAng = angleTo(enemy.x, enemy.y, player.x, player.y);
              extractBubble(this, enemy, enemy._trainer ? 'Рывок!' : 'Ко мне!');
              this.showExtractBanner(enemy._trainer ? '⚠️ Тренер идёт на таран!' : '⚠️ Старший смены рыщет!', 1.6);
            }
          }
          break;
        }

        case 'security_chief': {
          enemy._extractLineT = (enemy._extractLineT == null) ? 2.5 : enemy._extractLineT - realDt;
          if (enemy._extractLineT <= 0) {
            enemy._extractLineT = 3.8;
            if (typeof this.spawnBossLineAttack === 'function') {
              this.spawnBossLineAttack(enemy, player, {
                lines: 2, warn: 1.05, length: 540, halfW: 30, soft: true,
              });
            }
          }
          if (ratio < 0.65 && !enemy._extractSummonedPair) {
            enemy._extractSummonedPair = true;
            this.spawnExtractCashierPair(enemy.x, enemy.y + 50, 'boss_cashiers_f2');
            this.showExtractBanner('Кассиры на подмогу!', 2.0);
          }
          if (ratio < 0.35) {
            enemy._extractWallT = (enemy._extractWallT == null) ? 1.5 : enemy._extractWallT - realDt;
            if (enemy._extractWallT <= 0) {
              enemy._extractWallT = 6.5;
              this.spawnExtractTempWallsNear(enemy, player);
              this.showExtractBanner('🚧 Стены охраны!', 1.8);
            }
          }
          if (!enemy._extractSpiked && ratio < 0.4) {
            enemy._extractSpiked = true;
            enemy.speed *= 1.3;
            this.showExtractBanner('⚠️ Начальник охраны разозлился!', 2.2);
          }
          break;
        }

        case 'auditor_final': {
          // фаза 1+: снайпер + лужи
          enemy._extractLineT = (enemy._extractLineT == null) ? 2.0 : enemy._extractLineT - realDt;
          if (enemy._extractLineT <= 0) {
            enemy._extractLineT = ratio < 0.35 ? 2.6 : 3.5;
            if (typeof this.spawnBossLineAttack === 'function') {
              this.spawnBossLineAttack(enemy, player, {
                lines: 1, warn: 1.25, length: 580, halfW: 28, soft: true,
              });
            }
          }
          enemy._extractPuddleT = (enemy._extractPuddleT == null) ? 3.5 : enemy._extractPuddleT - realDt;
          if (enemy._extractPuddleT <= 0) {
            enemy._extractPuddleT = rand(4.5, 6);
            this.salePuddles = this.salePuddles || [];
            this.salePuddles.push({
              x: enemy.x, y: enemy.y, r: 34, life: 4, tick: 0, dmg: 1,
              color: '#38bdf8', hurtPlayer: true, slow: 0.5,
            });
          }
          // фаза 2: телепорт-рывок
          if (ratio < 0.55) {
            enemy._extractTpT = (enemy._extractTpT == null) ? rand(5, 7) : enemy._extractTpT - realDt;
            if (enemy._extractTpT <= 0 && !enemy._extractBossRushState) {
              enemy._extractTpT = rand(6.5, 8.5);
              const a = rand(0, Math.PI * 2);
              const distR = rand(90, 140);
              let nx = player.x + Math.cos(a) * distR;
              let ny = player.y + Math.sin(a) * distR;
              if (typeof this.getArenaBounds === 'function') {
                const b = this.getArenaBounds();
                nx = Math.max(b.x0 + 40, Math.min(b.x1 - 40, nx));
                ny = Math.max(b.y0 + 40, Math.min(b.y1 - 40, ny));
              }
              this.spawnParticles(enemy.x, enemy.y, 14, '#9b59b6', 160, 0.35);
              enemy.x = nx;
              enemy.y = ny;
              enemy._extractBossRushState = 'windup';
              enemy._extractBossRushT = 0.45;
              enemy._extractBossRushAng = angleTo(enemy.x, enemy.y, player.x, player.y);
              extractBubble(this, enemy, 'Внезапная проверка!');
              this.showExtractBanner('👔 Ревизор появился рядом!', 1.8);
            }
          }
          if (ratio < 0.35 && !enemy._extractSummonedPair) {
            enemy._extractSummonedPair = true;
            this.spawnExtractCashierPair(enemy.x, enemy.y + 60, 'boss_cashiers_f3');
            this.showExtractBanner('Кассиры-щитоносцы!', 2.0);
          }
          if (!enemy._extractSpiked && ratio < 0.35) {
            enemy._extractSpiked = true;
            enemy.speed *= 1.35;
            this.showExtractBanner('⚠️ Главный ревизор идёт ва-банк!', 2.4);
          }
          break;
        }

        default:
          break;
      }
    }
  },

  /** true = не вызывать Enemy.update (паттерн держит движение). */
  extractEnemySkipUpdate(enemy) {
    if (enemy._extractConfusedT > 0) return true;
    if (enemy._extractHoldPos) return true;
    if (enemy._extractPattern === 'trainee' && !enemy._extractAggro) return true;
    const rs = enemy._extractRushState;
    if (rs === 'windup' || rs === 'dash' || rs === 'stunned') return true;
    if (enemy._extractBossRushState) return true;
    if ((enemy.stunTimer || 0) > 0) return true;
    return false;
  },
});
