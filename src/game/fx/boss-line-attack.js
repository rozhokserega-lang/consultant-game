/** Линейная атака босса: телеграф, удар, отрисовка. */

Object.assign(Game.prototype, {
  /** Линейная атака босса: сначала телеграф, потом удар по линии. */
  spawnBossLineAttack(boss, player, opts = {}) {
    if (!boss || !player) return;
    this.bossLines = this.bossLines || [];
    const n = Math.max(1, opts.lines || 1);
    const warn = opts.warn || 1.05;
    const length = opts.length || (boss.type === 'director' ? 560 : 500);
    const halfW = opts.halfW || (boss.type === 'director' ? 42 : 36);
    // цвет телеграфа: у sale-боссов — свой акцент, иначе янтарный (не кровавый красный)
    let color = opts.color;
    if (!color && boss.saleBossId && typeof SALE_BOSS_DEFS !== 'undefined' && SALE_BOSS_DEFS[boss.saleBossId]) {
      color = SALE_BOSS_DEFS[boss.saleBossId].color;
    }
    if (!color) color = (opts.soft || this.gameMode === 'sale' || this.gameMode === 'extract') ? '#f59e0b' : '#e74c3c';
    const soft = opts.soft != null ? !!opts.soft : (this.gameMode === 'sale' || this.gameMode === 'extract');
    // чуть вперёд от текущей позиции игрока (lead); opts.ang — фиксированный угол (полка вдоль бега)
    const lead = 40 + (boss.bossPhase || 1) * 12;
    const aimX = player.x + Math.cos(player.angle || 0) * lead * 0.25;
    const aimY = player.y + Math.sin(player.angle || 0) * lead * 0.25;
    const aim = opts.ang != null ? opts.ang : angleTo(boss.x, boss.y, aimX, aimY);
    for (let i = 0; i < n; i++) {
      let ang = aim;
      if (n === 2) ang = aim + (i === 0 ? -0.55 : 0.55);
      else if (n === 3) ang = aim + (i - 1) * 0.7;
      else if (n > 1) ang = aim + (i - (n - 1) / 2) * 0.5;
      // линия через босса в обе стороны — длинный коридор
      const x1 = boss.x - Math.cos(ang) * length * 0.25;
      const y1 = boss.y - Math.sin(ang) * length * 0.25;
      const x2 = boss.x + Math.cos(ang) * length * 0.75;
      const y2 = boss.y + Math.sin(ang) * length * 0.75;
      this.bossLines.push({
        x1, y1, x2, y2, ang,
        warn, warnMax: warn,
        strike: soft ? 0.18 : 0.22,
        halfW,
        owner: boss,
        color,
        soft,
        slowEdge: !!opts.slowEdge,
        killName: opts.killName,
        hit: false,
        dead: false,
        age: 0,
      });
    }
    sfx.mode();
  },

  updateBossLineAttacks(dt) {
    if (!this.bossLines || !this.bossLines.length) return false;
    let killed = false;
    for (const line of this.bossLines) {
      if (line.dead) continue;
      line.age = (line.age || 0) + dt;
      // страховка: линия не должна висеть вечно (например если тик забыли)
      if (line.age > 3.5) {
        line.dead = true;
        continue;
      }
      if (line.warn > 0) {
        line.warn -= dt;
        continue;
      }
      if (!line.hit) {
        line.hit = true;
        const d = distToSegment(this.player.x, this.player.y, line.x1, line.y1, line.x2, line.y2);
        const inBand = d < line.halfW + this.player.r;
        const coreW = line.slowEdge ? line.halfW * 0.42 : line.halfW;
        const inCore = d < coreW + this.player.r;
        if (inBand && this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (line.slowEdge && !inCore) {
            this.player.slowTimer = Math.max(this.player.slowTimer || 0, 1.6);
            this.spawnParticles(this.player.x, this.player.y, 8, '#7dd3fc', 90, 0.28);
          } else {
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;
            const killName = line.killName || (line.owner && line.owner.nameTag) || 'Босс';
            if (this.gameMode === 'sale' && typeof this.saleHurtPlayer === 'function') {
              const died = this.saleHurtPlayer(midX, midY, 'boss', killName);
              if (died) {
                this.spawnParticles(this.player.x, this.player.y, Math.round(36 * this._fxBudget()), '#e74c3c', 320, 0.75);
                killed = true;
              } else if (this.tookDamage) {
                if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
                this.spawnParticles(this.player.x, this.player.y, 12, '#ff6b6b', 160, 0.4);
                this.screenShake = Math.max(this.screenShake, 0.22);
              }
            } else if (this.player.takeDamage(midX, midY)) {
              this.tookDamage = true;
              if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
              this.spawnParticles(this.player.x, this.player.y, Math.round(36 * this._fxBudget()), '#e74c3c', 320, 0.75);
              this.endGame(false, killName);
              killed = true;
            } else {
              this.tookDamage = true;
              if (this.selectedChallenge === 'no_damage') this.challengeFailed = true;
              sfx.hurt();
              this.vibrate(45);
              this.spawnParticles(this.player.x, this.player.y, 12, '#ff6b6b', 160, 0.4);
              this.screenShake = Math.max(this.screenShake, 0.22);
            }
          }
        } else if (!inBand) {
          // промах — лёгкий FX на линии (на поздних минутах режем)
          const missCount = Math.round(10 * this._fxBudget());
          if (missCount > 0) this.spawnParticles((line.x1 + line.x2) / 2, (line.y1 + line.y2) / 2, missCount, '#f1c40f', 120, 0.3);
        }
        this.screenShake = Math.max(this.screenShake, 0.16);
        sfx.hit();
      }
      line.strike -= dt;
      if (line.strike <= 0) line.dead = true;
    }
    this.bossLines = this.bossLines.filter(l => !l.dead);
    return killed;
  },

  drawBossLineAttacks() {
    if (!this.bossLines || !this.bossLines.length) return;
    for (const line of this.bossLines) {
      const warning = line.warn > 0;
      const tWarn = warning ? (1 - line.warn / (line.warnMax || 1)) : 1;
      const soft = !!line.soft;
      const pulse = warning
        ? (soft ? (0.55 + 0.3 * Math.abs(Math.sin(performance.now() / 140))) : (0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 90))))
        : 1;
      const col = line.color || (soft ? '#f59e0b' : '#e74c3c');
      ctx.save();
      ctx.lineCap = 'round';
      if (warning) {
        ctx.globalAlpha = soft ? (0.22 + 0.28 * pulse) : (0.35 + 0.45 * pulse);
        ctx.strokeStyle = col;
        ctx.lineWidth = line.halfW * 2 * (soft ? (0.28 + 0.12 * tWarn) : (0.35 + 0.15 * tWarn));
        ctx.setLineDash(soft ? [10, 14] : [14, 12]);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        // тонкая ось
        ctx.globalAlpha = soft ? (0.4 * pulse) : (0.7 * pulse);
        ctx.lineWidth = soft ? 1.5 : 2;
        ctx.strokeStyle = soft ? '#fff7ed' : '#ffecec';
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      } else {
        const strikeMax = soft ? 0.18 : 0.22;
        ctx.globalAlpha = Math.max(0.12, line.strike / strikeMax) * (soft ? 0.75 : 1);
        ctx.strokeStyle = soft ? col : '#ff3b1f';
        ctx.lineWidth = line.halfW * (soft ? 0.95 : 1.15);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.globalAlpha = soft ? 0.55 : 0.85;
        ctx.strokeStyle = '#fff5e6';
        ctx.lineWidth = soft ? 2 : 3;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }
      ctx.restore();
    }
  },
});
