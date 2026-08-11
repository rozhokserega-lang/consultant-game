/** Покупатель: поведение, урон, отрисовка. */

class Enemy {
  constructor(x, y, type = 'normal', wave = 1) {
    this.x = x; this.y = y; this.type = type;
    this.queueLeader = null; this.queueIndex = 0;
    this.throwTimer = rand(2, 4);
    this.buffPulse = 0;
    this.nameTag = '';
    this.explodes = false;
    switch (type) {
      case 'fast':
        this.r = rand(10, 13); this.hp = randi(1, 2); this.speed = rand(130, 175); this.xpReward = 2;
        this.coinDrop = 1; this.nameTag = 'Торопыга'; break;
      case 'tank':
        this.r = rand(18, 23); this.hp = randi(5, 8); this.speed = rand(30, 55); this.xpReward = 4;
        this.coinDrop = randi(2, 3); this.nameTag = 'Танк'; break;
      case 'fatty':
        this.r = rand(24, 30); this.hp = randi(6, 10); this.speed = rand(28, 45); this.xpReward = 5;
        this.coinDrop = randi(2, 4); this.nameTag = 'Жирный'; this.explodes = true; break;
      case 'boss':
        this.r = rand(26, 32); this.hp = randi(12, 18); this.speed = rand(25, 45); this.xpReward = 10;
        this.coinDrop = randi(6, 10); this.nameTag = 'Админ';
        this.slashTimer = rand(1.6, 2.4); this.bossPhase = 1; break;
      case 'queue':
        this.r = rand(12, 15); this.hp = randi(2, 3); this.speed = rand(55, 80); this.xpReward = 2;
        this.coinDrop = 1; this.nameTag = 'Очередь'; break;
      case 'returner':
        this.r = rand(14, 17); this.hp = randi(3, 5); this.speed = rand(45, 70); this.xpReward = 3;
        this.coinDrop = randi(1, 2); this.nameTag = 'Возврат'; break;
      case 'manager':
        this.r = rand(16, 19); this.hp = randi(4, 6); this.speed = rand(50, 75); this.xpReward = 5;
        this.coinDrop = randi(2, 3); this.nameTag = 'Менеджер'; break;
      case 'influencer':
        this.r = rand(20, 24); this.hp = randi(8, 12); this.speed = rand(25, 40); this.xpReward = 8;
        this.coinDrop = randi(3, 5); this.nameTag = 'Инфлюенсер'; break;
      case 'director':
        this.r = 36; this.hp = 55; this.speed = 52; this.xpReward = 30;
        this.coinDrop = 14; this.nameTag = 'Директор';
        this.bossPhase = 1; this.patternTimer = 1.5; this.summonTimer = 4;
        this.slashTimer = 2.2; break;
      case 'miniboss':
        this.r = rand(28, 34); this.hp = randi(22, 28); this.speed = rand(40, 55); this.xpReward = 16;
        this.coinDrop = randi(8, 12); this.nameTag = 'Мини-босс';
        this.bossPhase = 1; this.patternTimer = 2; this.summonTimer = 5;
        this.slashTimer = 2.0; break;
      case 'child':
        this.r = rand(8, 10); this.hp = 1; this.speed = rand(160, 210); this.xpReward = 1;
        this.coinDrop = 1; this.nameTag = 'Ребёнок'; this.noDamage = true; this.pushOnly = true; break;
      case 'blogger':
        this.r = rand(14, 17); this.hp = randi(3, 5); this.speed = rand(90, 120); this.xpReward = 4;
        this.coinDrop = randi(2, 3); this.nameTag = 'Блогер';
        this.teleportTimer = rand(2.5, 4); this.filmTimer = 0; break;
      default:
        this.r = rand(13, 17); this.hp = randi(2, 4); this.speed = rand(40, 100); this.xpReward = 1;
        this.coinDrop = 1; this.nameTag = 'Покупатель';
    }

    // Сильнее с каждой волной
    const w = Math.max(1, wave);
    const isBossLike = type === 'boss' || type === 'director';
    const hpMul = isBossLike ? (1 + (w - 1) * 0.22) : (1 + (w - 1) * 0.16);
    const spdMul = isBossLike ? (1 + (w - 1) * 0.05) : (1 + (w - 1) * 0.07);
    this.hp = Math.max(1, Math.ceil(this.hp * hpMul * DIFFICULTY_EASE));
    this.speed *= spdMul * DIFFICULTY_EASE;
    this.xpReward = Math.max(1, Math.round(this.xpReward * (1 + (w - 1) * 0.08)));
    this.coinDrop = Math.max(1, Math.round(this.coinDrop * (1 + (w - 1) * 0.06)));
    this.wave = w;
    this.stunTimer = 0;

    this.maxHp = this.hp;
    const pool = ENEMY_SKIN_POOLS[type] || ENEMY_SKIN_POOLS.normal;
    this.sprite = pick(pool);
    this.mobId = resolveEnemyMobId(this.sprite);
    this.mobPose = 'idle';
    this._mobAnimPose = 'idle';
    this._mobAnimFrame = 0;
    this._mobAnimPhase = 0;
    this.hueRotate = 0;
    this.angle = rand(0, Math.PI * 2);
    this.wanderTimer = rand(0.5, 2);
    this.wanderAngle = this.angle;
    this.knockback = { x: 0, y: 0 };
    this.hitFlash = 0;
    this.bubble = null;
    this.nextBubbleIn = rand(3, 7);
    this.baseHue = rand(0, 360);
    this.speedBuff = 1;
    if (type === 'fatty') this.hueRotate = 0;
  }

  update(dt, player, worldW, worldH, isRush, game) {
    const stepFromX = this.x;
    const stepFromY = this.y;
    this.nextBubbleIn -= dt;
    if (!this.bubble || this.bubble.dead) {
      if (this.nextBubbleIn <= 0) {
        const live = game ? (game._liveBubbles || 0) : 0;
        if (live < MAX_SPEECH_BUBBLES && Math.random() < 0.55) {
          this.bubble = new SpeechBubble(this, pick(PHRASES));
          if (game) game._liveBubbles = live + 1;
        }
        this.nextBubbleIn = rand(5, 11);
      }
    }
    if (this.bubble && !this.bubble.dead) this.bubble.update(dt);
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.callTimer == null) this.callTimer = rand(4, 7);
    if (this.armorHits == null && this.type === 'tank') this.armorHits = 2;

    this.x += this.knockback.x * dt;
    this.y += this.knockback.y * dt;
    this.knockback.x *= Math.exp(-10 * dt);
    this.knockback.y *= Math.exp(-10 * dt);

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.speedBuff = 1;
      refreshEnemyMobPose(this, player, isRush, stepFromX, stepFromY, dt);
      clampEntityToArena(this, worldW, worldH, game);
      return;
    }

    const d = dist(this.x, this.y, player.x, player.y);
    const rushBase = (isRush ? 1.28 : 1)
      * (game && game.fireAlarm > 0 ? 1.35 : 1)
      * (game && game.saleMobSpeedMul ? game.saleMobSpeedMul : 1);
    const rushMul = (rushBase - 1) * DIFFICULTY_EASE + 1;

    // 1) Аура менеджера — ускорение + лёгкий реген (dist², без Math.hypot)
    if (this.type === 'manager') {
      this.buffPulse = (this.buffPulse || 0) + dt;
      this.regenAcc = (this.regenAcc || 0) + dt;
      const doRegen = this.regenAcc >= 1.2;
      const R2 = 150 * 150;
      for (const e of game.enemies) {
        if (e === this || e.hp <= 0) continue;
        const dx = e.x - this.x, dy = e.y - this.y;
        if (dx * dx + dy * dy < R2) {
          e.speedBuff = Math.max(e.speedBuff || 1, 1.4);
          if (doRegen && e.hp < e.maxHp && e.type !== 'boss' && e.type !== 'director') {
            e.hp = Math.min(e.maxHp, e.hp + 1);
          }
        }
      }
      if (doRegen) this.regenAcc = 0;
    }

    // 2) Жалобщик — кидает книгу с дистанции (всегда, не только в «охоте»)
    // В «Распродаже» книги от рядовых бесят (постоянный slow) — оставляем slow боссам/событиям
    if (this.type === 'returner' && !(game && game.gameMode === 'sale')) {
      this.throwTimer -= dt;
      const books = game ? game.projectiles.length : 0;
      if (this.throwTimer <= 0 && d < 340 && d > 50 && books < 4) {
        this.throwTimer = rand(2.8, 4.5) / rushMul;
        const a = angleTo(this.x, this.y, player.x, player.y);
        game.projectiles.push(new Projectile(this.x, this.y, a, 250 * rushMul, this));
        if ((game._liveBubbles || 0) < MAX_SPEECH_BUBBLES) {
          this.bubble = new SpeechBubble(this, 'Книга жалоб!!!');
          game._liveBubbles = (game._liveBubbles || 0) + 1;
        }
      }
    }

    // 3) Торопыга — просто быстрый (рывок убран — слишком жестоко)

    // 4) Инфлюенсер — «стрим»: зовёт ближайших мобов на игрока + лёгкий спавн
    if (this.type === 'influencer') {
      this.callTimer -= dt;
      if (this.callTimer <= 0) {
        this.callTimer = rand(5.5, 8.5);
        if ((game._liveBubbles || 0) < MAX_SPEECH_BUBBLES) {
          this.bubble = new SpeechBubble(this, 'Срочно все сюда! 📱');
          game._liveBubbles = (game._liveBubbles || 0) + 1;
        }
        for (const e of game.enemies) {
          if (e === this || e.hp <= 0) continue;
          if (dist(this.x, this.y, e.x, e.y) < 280) {
            e.aggroBoost = 4.5; // бегут к игроку дольше/активнее
          }
        }
        // шанс позвать ещё одного «фаната»
        if (game.wavePhase === 'mobs' && game.enemies.filter(e => e.hp > 0).length < MAX_ENEMIES_ON_FIELD) {
          if (Math.random() < 0.55) {
            const a = rand(0, Math.PI * 2);
            const nx = this.x + Math.cos(a) * 50;
            const ny = this.y + Math.sin(a) * 50;
            const fan = new Enemy(nx, ny, 'normal', game.wave);
            fan.nameTag = 'Фанат';
            fan.aggroBoost = 6;
            fan.coinDrop = Math.max(1, Math.floor((fan.coinDrop || 1) * 0.5));
            game.enemies.push(fan);
          }
        }
      }
    }

    // 5) Танк — таран: разгоняется на игрока вблизи
    if (this.type === 'tank' && d < 170) {
      this.ramBoost = 1 + (1.55 - 1) * DIFFICULTY_EASE;
    } else {
      this.ramBoost = 1;
    }

    // 6) Ребёнок — юркий, только толкает (урон обрабатывается снаружи)
    if (this.type === 'child') {
      this.angle = angleTo(this.x, this.y, player.x, player.y);
      // зигзаг
      this.angle += Math.sin(performance.now() / 120 + this.x * 0.01) * 0.8;
      const spd = this.speed * rushMul * 1.05;
      this.x += Math.cos(this.angle) * spd * dt;
      this.y += Math.sin(this.angle) * spd * dt;
      this.speedBuff = 1;
      refreshEnemyMobPose(this, player, isRush, stepFromX, stepFromY, dt);
      clampEntityToArena(this, worldW, worldH, game);
      return;
    }

    // 7) Блогер — телепорт + «съёмка» (стыд)
    if (this.type === 'blogger') {
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) {
        this.teleportTimer = rand(2.8, 4.5);
        const a = rand(0, Math.PI * 2);
        const distR = rand(80, 160);
        let nx = player.x + Math.cos(a) * distR;
        let ny = player.y + Math.sin(a) * distR;
        if (game && typeof game.getArenaBounds === 'function') {
          const b = game.getArenaBounds();
          const pad = 40;
          nx = Math.max(b.x0 + pad, Math.min(b.x1 - pad, nx));
          ny = Math.max(b.y0 + pad, Math.min(b.y1 - pad, ny));
        } else {
          nx = Math.max(40, Math.min(worldW - 40, nx));
          ny = Math.max(40, Math.min(worldH - 40, ny));
        }
        this.x = nx;
        this.y = ny;
        this.bubble = new SpeechBubble(this, 'Сторис! 📱');
        this.filmTimer = 1.4;
      }
      if (this.filmTimer > 0) {
        this.filmTimer -= dt;
        this.angle = angleTo(this.x, this.y, player.x, player.y);
        if (d < 130) {
          player.shameTimer = Math.max(player.shameTimer || 0, 2.2);
        }
      } else {
        this.angle = angleTo(this.x, this.y, player.x, player.y);
        const spd = this.speed * 0.75 * rushMul;
        this.x += Math.cos(this.angle) * spd * dt;
        this.y += Math.sin(this.angle) * spd * dt;
      }
      this.speedBuff = 1;
      refreshEnemyMobPose(this, player, isRush, stepFromX, stepFromY, dt);
      clampEntityToArena(this, worldW, worldH, game);
      return;
    }

    // 8) Директор / мини-босс — паттерны + линии-телеграфы
    if (this.type === 'director' || this.type === 'miniboss') {
      const hpRatio = this.hp / this.maxHp;
      if (this.type === 'director') {
        this.bossPhase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;
      } else {
        this.bossPhase = hpRatio > 0.5 ? 1 : 2;
      }
      this.patternTimer -= dt;
      this.summonTimer -= dt;
      if (this.slashTimer == null) this.slashTimer = 2;
      this.slashTimer -= dt;
      this.angle = angleTo(this.x, this.y, player.x, player.y);

      // линейный удар с предупреждением
      if (this.slashTimer <= 0 && game && typeof game.spawnBossLineAttack === 'function') {
        const lines = this.type === 'director' ? (this.bossPhase >= 3 ? 3 : this.bossPhase >= 2 ? 2 : 1) : (this.bossPhase >= 2 ? 2 : 1);
        game.spawnBossLineAttack(this, player, { lines, warn: this.type === 'director' ? 0.95 : 1.1 });
        this.slashTimer = this.type === 'director' ? (3.1 - this.bossPhase * 0.35) : 3.4;
        this.mobPose = 'attack';
        this.bubble = new SpeechBubble(this, this.type === 'director' ? 'УВОЛЬНЕНИЕ ПО ЛИНИИ!' : 'Проход закрыт!');
      }

      // документы / жалобы веером
      if (this.patternTimer <= 0) {
        const burst = this.type === 'director' ? (2 + this.bossPhase) : 3;
        const base = this.angle;
        for (let i = 0; i < burst; i++) {
          const spread = (i - (burst - 1) / 2) * 0.28;
          game.projectiles.push(new Projectile(this.x, this.y, base + spread, 210 + this.bossPhase * 20, this));
        }
        this.patternTimer = this.type === 'director' ? (2.8 - this.bossPhase * 0.3) : 3.0;
        this.bubble = new SpeechBubble(this, pick(BOSS_PHRASES[this.type] || BOSS_PHRASES.miniboss));
      }

      // призыв очереди
      if (this.summonTimer <= 0 && game.enemies.filter(e => e.hp > 0).length < MAX_ENEMIES_ON_FIELD) {
        this.summonTimer = this.type === 'director' ? (6.5 - this.bossPhase) : 7.5;
        const a = rand(0, Math.PI * 2);
        const nx = this.x + Math.cos(a) * 70;
        const ny = this.y + Math.sin(a) * 70;
        const q = new Enemy(nx, ny, 'queue', game.wave);
        q.nameTag = 'Очередь босса';
        game.enemies.push(q);
        if (this.type === 'director' && this.bossPhase >= 2) {
          const f = new Enemy(nx + 20, ny, Math.random() < 0.5 ? 'returner' : 'fast', game.wave);
          game.enemies.push(f);
        }
      }

      let spd = this.speed * rushMul * (this.type === 'director' ? (0.85 + this.bossPhase * 0.08) : 0.9);
      this.x += Math.cos(this.angle) * spd * dt;
      this.y += Math.sin(this.angle) * spd * dt;
      this.speedBuff = 1;
      refreshEnemyMobPose(this, player, isRush, stepFromX, stepFromY, dt);
      clampEntityToArena(this, worldW, worldH, game);
      return;
    }

    // 8b) Админ-босс волны — тоже линии
    if (this.type === 'boss') {
      if (this.slashTimer == null) this.slashTimer = 2;
      this.slashTimer -= dt;
      this.angle = angleTo(this.x, this.y, player.x, player.y);
      if (this.slashTimer <= 0 && game && typeof game.spawnBossLineAttack === 'function') {
        game.spawnBossLineAttack(this, player, { lines: 1, warn: 1.15, length: 460 });
        this.slashTimer = rand(2.8, 3.6);
        this.mobPose = 'attack';
        this.bubble = new SpeechBubble(this, 'Нарушение регламента!');
      }
    }

    if (this.aggroBoost > 0) this.aggroBoost -= dt;

    // Очередь следует за лидером
    if (this.type === 'queue' && this.queueLeader && this.queueLeader.hp > 0) {
      const lx = this.queueLeader.x - Math.cos(this.queueLeader.angle) * (28 + this.queueIndex * 22);
      const ly = this.queueLeader.y - Math.sin(this.queueLeader.angle) * (28 + this.queueIndex * 22);
      this.angle = angleTo(this.x, this.y, lx, ly);
      const followSpd = this.speed * 1.15 * (this.speedBuff || 1) * rushMul;
      this.x += Math.cos(this.angle) * followSpd * dt;
      this.y += Math.sin(this.angle) * followSpd * dt;
    } else {
      // Всегда идут К игроку (побега нет). Вдалеке — мягкий подход, вблизи — давление.
      const aggro = (this.aggroBoost > 0) || d < (isRush ? 520 : 420) || this.type === 'boss' || this.type === 'director' || this.type === 'influencer';
      if (aggro) {
        this.angle = angleTo(this.x, this.y, player.x, player.y);
        let spd = this.speed * (this.speedBuff || 1) * rushMul * (this.ramBoost || 1);
        if (this.type === 'influencer') spd *= 0.9;
        if (this.type === 'fatty') spd *= 0.95;
        if (d > 300) spd *= 1.15; // догоняют, если далеко
        this.x += Math.cos(this.angle) * spd * dt;
        this.y += Math.sin(this.angle) * spd * dt;
      } else {
        // редкий «гуляет по залу», но с уклоном к игроку — чтобы не терялись
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          const toP = angleTo(this.x, this.y, player.x, player.y);
          this.wanderAngle = toP + rand(-0.9, 0.9);
          this.wanderTimer = rand(0.8, 1.8);
        }
        let diff = this.wanderAngle - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * Math.min(1, dt * 4);
        const spd = this.speed * 0.85 * (this.speedBuff || 1) * rushMul;
        this.x += Math.cos(this.angle) * spd * dt;
        this.y += Math.sin(this.angle) * spd * dt;
      }
    }

    this.speedBuff = 1;
    refreshEnemyMobPose(this, player, isRush, stepFromX, stepFromY, dt);
    clampEntityToArena(this, worldW, worldH, game);
  }

  draw(c, isRush) {
    c.save();
    const flash = Math.max(0, this.hitFlash / 0.15);
    // Простая тень без shadowBlur — blur на Android убивает FPS при толпе
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath(); c.ellipse(this.x + 2, this.y + 3, 11, 4.5, 0, 0, Math.PI * 2); c.fill();

    if (this.type === 'manager') {
      c.strokeStyle = 'rgba(155,89,186,0.28)'; c.lineWidth = 2;
      c.beginPath(); c.arc(this.x, this.y, 150, 0, Math.PI * 2); c.stroke();
    }
    if (this.type === 'fatty') {
      const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.15;
      c.strokeStyle = `rgba(255,80,30,${pulse})`;
      c.lineWidth = 2;
      c.beginPath(); c.arc(this.x, this.y, this.r + 14, 0, Math.PI * 2); c.stroke();
    }
    if (this.type === 'influencer') {
      c.strokeStyle = 'rgba(241,196,15,0.28)'; c.lineWidth = 2;
      c.beginPath(); c.arc(this.x, this.y, 90, 0, Math.PI * 2); c.stroke();
    }
    if (this.type === 'blogger' && this.filmTimer > 0) {
      c.strokeStyle = 'rgba(255,80,180,0.65)'; c.lineWidth = 2;
      c.strokeRect(this.x - 40, this.y - 50, 80, 70);
    }
    if (this.type === 'director' || this.type === 'miniboss') {
      c.strokeStyle = 'rgba(231,76,60,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.arc(this.x, this.y, this.r + 16, 0, Math.PI * 2); c.stroke();
    }
    if (this.type === 'tank' && (this.armorHits || 0) > 0) {
      c.strokeStyle = 'rgba(149,165,166,0.75)'; c.lineWidth = 2;
      c.beginPath(); c.arc(this.x, this.y, this.r + 6, 0, Math.PI * 2); c.stroke();
    }

    const spriteName = this.sprite || (ENEMY_SKIN_POOLS[this.type] || ENEMY_SKIN_POOLS.normal)[0];
    const flip = Math.cos(this.angle) < 0;
    const scale = this.type === 'director' ? 0.72
      : this.type === 'boss' ? 0.65
      : this.type === 'fatty' ? 0.78
      : this.type === 'tank' ? 0.62
      : 0.52;
    if (flash > 0) c.globalAlpha = 0.55 + flash * 0.45;
    const frameKey = enemyMobFrameKey(this);
    const drewMob = frameKey && drawEnemyMob(c, frameKey, this.x, this.y + 4, { scale, flip });
    if (!drewMob && !drawSprite(c, spriteName, this.x, this.y + 4, { scale, flip, anchorY: 1 })) {
      c.fillStyle = this.type === 'fatty' ? '#e67e22' : (isRush ? '#e74c3c' : '#5dade2');
      c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    if (this.type === 'fatty') {
      c.fillStyle = '#fff';
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.fillText('💣', this.x, this.y - this.r - 22);
    }

    // Одна полоска HP вместо десятка кружков
    if (this.hp < this.maxHp) {
      const bw = Math.min(36, 10 + this.maxHp * 2);
      const bx = this.x - bw / 2;
      const by = this.y - this.r - 14;
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(bx - 1, by - 1, bw + 2, 5);
      c.fillStyle = '#2ecc71';
      c.fillRect(bx, by, bw * Math.max(0, this.hp / this.maxHp), 3);
    }
    c.restore();
    if (this.bubble && !this.bubble.dead) this.bubble.draw(c, this.x, this.y - this.r - 22);
  }

  hit(damage, fromX, fromY, knock = 300, stun = 0) {
    // Танк: броня съедает первые удары
    if (this.type === 'tank' && (this.armorHits || 0) > 0) {
      this.armorHits--;
      this.hitFlash = 0.2;
      const a = angleTo(fromX, fromY, this.x, this.y);
      this.knockback.x = Math.cos(a) * knock * 0.35;
      this.knockback.y = Math.sin(a) * knock * 0.35;
      return false;
    }
    this.hp -= Math.max(0, Math.round(damage));
    this.hitFlash = 0.15;
    const a = angleTo(fromX, fromY, this.x, this.y);
    this.knockback.x = Math.cos(a) * knock;
    this.knockback.y = Math.sin(a) * knock;
    if (stun > 0) this.stunTimer = Math.max(this.stunTimer || 0, stun);
    return this.hp <= 0;
  }
}
