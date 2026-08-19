/** Консультант: движение, атака, отрисовка. */

class Player {
  constructor(x, y, weapon) {
    this.x = x; this.y = y; this.r = 18; this.angle = 0;
    this.bonusSpeed = 0;
    this.bonusDamage = 0;
    this.shieldCharges = 0;
    this.weapon = weapon || WEAPONS[0];
    this.baseSpeed = 220;
    this.speed = this.baseSpeed;
    this.hp = 5; this.maxHp = 5; this.invincible = 0;
    this.knockback = { x: 0, y: 0 };
    this.attacking = false; this.attackTimer = 0; this.attackDuration = 0.18;
    this.attackCooldown = 0;
    this.attackCooldownTime = 0.35;
    this.stickLength = 42;
    this.hitArc = Math.PI / 3;
    this.knockPower = 300;
    this.stunOnHit = 0;
    this.stickSwingAngle = 0; this.hitEnemies = new Set();
    this.level = 1; this.xp = 0; this.xpToNext = 10;
    this.damage = 1;
    this.slowTimer = 0; this.muteAttack = 0; this.lunchTimer = 0; this.shameTimer = 0;
    // дэш / заряд / скилл
    this.dashCd = 0; this.dashTime = 0; this.dashDir = { x: 1, y: 0 };
    this.dashCdBase = 1.05;
    this.dashChargesMax = 1;
    this.dashCharges = 1;
    this.charging = false; this.charge = 0;
    this.skill = 0; this.skillMax = 100;
    this.chargePower = 0;
    this.teaDurationBonus = 0;
    this.teaDamageBonus = 0;
    this.chargeCdMul = 1;
    this.chargeRadiusMul = 1;
    this.baseStickLength = 42;
    this.baseHitArc = Math.PI / 3;
    this.critChance = 0;
    this.extraLives = 0;
    this.coinMagnet = 90;
    this.coinMagnetBonus = 0;
    this.complaintResist = 0;
    this.equippedWeaponId = (weapon && weapon.id) || 'hammer';
    this.tempWeapon = null;
    this.tempWeaponTimer = 0;
    this._animPhase = 0;
    this._wasMoving = false;
    this._animName = 'walk_down';
    this._animFrame = 0;
    this._atkAnim = null;
    this.applyWeapon(this.weapon);
  }

  applyWeapon(weapon) {
    this.weapon = weapon || WEAPONS[0];
    this.attackCooldownTime = this.weapon.cooldown;
    this.baseStickLength = this.weapon.stickLength;
    this.stickLength = this.weapon.stickLength;
    this.baseHitArc = this.weapon.arc;
    this.hitArc = this.weapon.arc;
    this.knockPower = this.weapon.knock;
    this.stunOnHit = this.weapon.stun || 0;
    this.recalcStats();
  }

  recalcStats() {
    const w = this.weapon || WEAPONS[0];
    this.baseSpeed = 220 + (w.speedBonus || 0) + (this.bonusSpeed || 0);
    const teaDmg = (this.lunchTimer > 0 && this.teaDamageBonus) ? this.teaDamageBonus : 0;
    this.damage = (w.damage || 1) + (this.bonusDamage || 0) + teaDmg;
    this.speed = this.baseSpeed * (this.slowTimer > 0 ? 0.55 : 1) * (this.lunchTimer > 0 ? 1.25 : 1) * (this.shameTimer > 0 ? 0.85 : 1);
  }

  applyTempWeapon(tw) {
    if (!tw) return;
    this.tempWeapon = tw;
    this.tempWeaponTimer = tw.duration || 14;
    this.applyWeapon(tw);
  }

  clearTempWeapon() {
    if (!this.tempWeapon) return;
    this.tempWeapon = null;
    this.tempWeaponTimer = 0;
    if (this._loadoutWeapon) this.applyWeapon(this._loadoutWeapon);
    else {
      const base = WEAPONS.find(w => w.id === this.equippedWeaponId) || WEAPONS[0];
      this.applyWeapon(base);
    }
    if (this._metaReachBonus) {
      this.stickLength += this._metaReachBonus;
      this.baseStickLength += this._metaReachBonus;
    }
  }

  gainXP(amount) {
    this.xp += amount;
    let leveled = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = this.level * 8 + 5;
      leveled++;
    }
    return leveled;
  }

  update(dt, worldW, worldH, game) {
    if (this.invincible > 0) this.invincible -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.muteAttack > 0) this.muteAttack -= dt;
    if (this.lunchTimer > 0) this.lunchTimer -= dt;
    if (this.shameTimer > 0) this.shameTimer -= dt;
    if (this.dashCd > 0) {
      this.dashCd -= dt;
      if (this.dashCd <= 0) this.dashCharges = this.dashChargesMax || 1;
    }
    if (this.tempWeaponTimer > 0) {
      this.tempWeaponTimer -= dt;
      if (this.tempWeaponTimer <= 0) this.clearTempWeapon();
    }

    this.recalcStats();

    // дэш
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      const sp = 560;
      this.x += this.dashDir.x * sp * dt;
      this.y += this.dashDir.y * sp * dt;
      this.invincible = Math.max(this.invincible, 0.05);
      if (this.dashTime <= 0) this.invincible = Math.max(this.invincible, 0.12);
    }

    this.x += this.knockback.x * dt;
    this.y += this.knockback.y * dt;
    this.knockback.x *= Math.exp(-10 * dt);
    this.knockback.y *= Math.exp(-10 * dt);

    clampEntityToArena(this, worldW, worldH, game);

    if (this.charging) {
      this.charge = Math.min(1, this.charge + dt / 0.75);
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.attacking) {
      this.attackTimer += dt;
      const t = this.attackTimer / this.attackDuration;
      this.stickSwingAngle = Math.sin(t * Math.PI) * (Math.PI / 1.7) - Math.PI / 3.2;
      if (this.attackTimer >= this.attackDuration) {
        this.attacking = false; this.stickSwingAngle = 0; this.hitEnemies.clear();
        this.chargePower = 0;
        this.stickLength = this.baseStickLength;
        this.hitArc = this.baseHitArc;
      }
    }
  }

  startCharge() {
    if (this.muteAttack > 0) return false;
    if (this.attackCooldown > 0 || this.attacking || this.dashTime > 0) return false;
    if (this.charging) return true;
    this.charging = true;
    this.charge = 0;
    return true;
  }

  releaseAttack() {
    if (!this.charging) return false;
    const c = this.charge;
    this.charging = false;
    this.charge = 0;
    return this.attack(c);
  }

  attack(charge = 0) {
    if (this.muteAttack > 0) return false;
    if (this.attackCooldown > 0 || this.attacking || this.dashTime > 0) return false;
    this.charging = false;
    this.charge = 0;
    const t = Math.max(0, Math.min(1, charge));
    this.chargePower = t;
    const radiusMul = t >= 0.45 ? (this.chargeRadiusMul || 1) : 1;
    this.stickLength = this.baseStickLength * (1 + t * 0.85) * radiusMul;
    this.hitArc = this.baseHitArc * (1 + t * 0.7) * (radiusMul > 1 ? 1.08 : 1);
    this.attackDuration = 0.16 + t * 0.16;
    this.attacking = true; this.attackTimer = 0;
    let cdMul = (1 + t * 1.05) * (this.lunchTimer > 0 ? 0.7 : 1) * (this.shameTimer > 0 ? 1.55 : 1);
    if (t >= 0.35) cdMul *= (this.chargeCdMul || 1);
    this.attackCooldown = this.attackCooldownTime * cdMul;
    this.hitEnemies.clear();
    this._justFiredRanged = !!(this.weapon && this.weapon.ranged);
    this._justAoe = !!(this.weapon && this.weapon.aoe);
    const wid = (this.weapon && this.weapon.id) || '';
    const pack = typeof playerAnimData === 'function' ? playerAnimData(this._saleHeroId) : null;
    const ownPunch = pack && pack.id && pack.id !== 'default'
      && typeof playerAnimKeys === 'function'
      && playerAnimKeys(this._saleHeroId, 'atk_punch').length;
    if (ownPunch && !(this.weapon && this.weapon.ranged)) this._atkAnim = 'atk_punch';
    else if (wid === 'glove') this._atkAnim = 'atk_punch';
    else if (wid === 'hammer') this._atkAnim = 'atk_radio';
    else this._atkAnim = null;
    this._animFrame = 0;
    this._animPhase = 0;
    return true;
  }

  /** Удары из листа — только «в лицо» (вниз на экране). */
  facingFrontForSpriteAttack() {
    return Math.sin(this.angle) > 0.35;
  }

  useSpriteAttackDraw() {
    if (!this.attacking || !this._atkAnim) return false;
    if (this.facingFrontForSpriteAttack()) return true;
    return this._atkAnim === 'atk_punch' && Math.abs(Math.cos(this.angle)) > 0.35;
  }

  tryDash(dirX, dirY) {
    if (this.dashTime > 0 || this.attacking) return false;
    const maxCh = this.dashChargesMax || 1;
    if (maxCh <= 1) {
      if (this.dashCd > 0) return false;
    } else if ((this.dashCharges || 0) <= 0) {
      return false;
    }
    let dx = dirX, dy = dirY;
    const len = Math.hypot(dx, dy);
    if (len < 0.1) {
      dx = Math.cos(this.angle); dy = Math.sin(this.angle);
    } else {
      dx /= len; dy /= len;
    }
    this.dashDir = { x: dx, y: dy };
    this.dashTime = 0.16;
    if (maxCh <= 1) {
      this.dashCd = this.dashCdBase || 1.05;
    } else {
      this.dashCharges = Math.max(0, (this.dashCharges || 0) - 1);
      if (this.dashCharges <= 0) this.dashCd = this.dashCdBase || 1.05;
    }
    this.invincible = Math.max(this.invincible, 0.22);
    this.charging = false; this.charge = 0;
    return true;
  }

  fillSkill(amount) {
    if (this.lunchTimer > 0) return;
    this.skill = Math.min(this.skillMax, this.skill + amount);
  }

  trySkill() {
    if (this.skill < this.skillMax) return false;
    if (this.lunchTimer > 0) return false;
    this.skill = 0;
    this.applyLunch();
    return true;
  }

  getAttackDamage() {
    return Math.max(1, Math.round(this.damage * (1 + (this.chargePower || 0) * 0.75)));
  }

  getStickEnd() {
    const baseAngle = this.angle + this.stickSwingAngle;
    const sx = this.x + Math.cos(this.angle) * this.r;
    const sy = this.y + Math.sin(this.angle) * this.r;
    return {
      x: sx + Math.cos(baseAngle) * this.stickLength,
      y: sy + Math.sin(baseAngle) * this.stickLength,
      angle: baseAngle,
    };
  }

  /** Превью зоны удара (как isEnemyInHitZone), с учётом заряда */
  getAimPreview() {
    const charge = this.charging ? this.charge : (this.attacking ? (this.chargePower || 0) : 0);
    const t = Math.max(0, Math.min(1, charge));
    const radiusMul = t >= 0.45 ? (this.chargeRadiusMul || 1) : 1;
    const baseLen = this.baseStickLength || this.stickLength || 42;
    const baseArc = this.baseHitArc || this.hitArc || Math.PI / 3;
    const reach = this.attacking
      ? this.stickLength
      : baseLen * (1 + t * 0.85) * radiusMul;
    const arc = this.attacking
      ? this.hitArc
      : baseArc * (1 + t * 0.7) * (radiusMul > 1 ? 1.08 : 1);
    return { angle: this.angle, reach, arc, charge: t };
  }

  drawAimMarker(c) {
    if (this.dashTime > 0) return;
    const aim = this.getAimPreview();
    const ang = aim.angle;
    const half = (aim.arc || Math.PI / 3) * 0.5;
    const outer = this.r + aim.reach;
    const charging = this.charging && aim.charge > 0.02;
    const swinging = this.attacking;

    c.save();
    // сектор на полу — куда реально бьёт хитбокс
    c.globalAlpha = swinging ? 0.28 : (charging ? 0.18 + aim.charge * 0.2 : 0.12);
    c.fillStyle = swinging ? '#f1c40f' : (charging ? '#9b59b6' : '#5dade2');
    c.beginPath();
    c.moveTo(this.x, this.y);
    c.arc(this.x, this.y, outer, ang - half, ang + half);
    c.closePath();
    c.fill();

    c.globalAlpha = swinging ? 0.65 : (charging ? 0.5 + aim.charge * 0.35 : 0.38);
    c.strokeStyle = swinging ? '#ffeaa7' : (charging ? '#d2b4de' : '#aed6f1');
    c.lineWidth = 2;
    c.beginPath();
    c.arc(this.x, this.y, outer, ang - half, ang + half);
    c.stroke();
    // боковые лучи
    c.beginPath();
    c.moveTo(this.x, this.y);
    c.lineTo(this.x + Math.cos(ang - half) * outer, this.y + Math.sin(ang - half) * outer);
    c.moveTo(this.x, this.y);
    c.lineTo(this.x + Math.cos(ang + half) * outer, this.y + Math.sin(ang + half) * outer);
    c.stroke();

    // маркер «куда бьёт» на краю сектора
    const tipX = this.x + Math.cos(ang) * outer;
    const tipY = this.y + Math.sin(ang) * outer;
    const px = Math.cos(ang + Math.PI / 2);
    const py = Math.sin(ang + Math.PI / 2);
    const back = 8;
    c.globalAlpha = swinging ? 0.9 : 0.75;
    c.strokeStyle = '#ffffff';
    c.fillStyle = swinging ? 'rgba(241,196,15,0.85)' : (charging ? 'rgba(155,89,186,0.8)' : 'rgba(93,173,226,0.75)');
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(tipX, tipY);
    c.lineTo(tipX - Math.cos(ang) * back + px * 6, tipY - Math.sin(ang) * back + py * 6);
    c.lineTo(tipX - Math.cos(ang) * back - px * 6, tipY - Math.sin(ang) * back - py * 6);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  isEnemyInHitZone(enemy) {
    if (!this.attacking) return false;
    if (this.hitEnemies.has(enemy)) return false;
    const d = dist(this.x, this.y, enemy.x, enemy.y);
    if (d < this.r + enemy.r) return true;
    if (d > this.r + this.stickLength + enemy.r) return false;
    const a = angleTo(this.x, this.y, enemy.x, enemy.y);
    let diff = a - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const halfArc = (this.hitArc || Math.PI / 3) * 0.5;
    return Math.abs(diff - this.stickSwingAngle * 0.5) < halfArc;
  }

  takeDamage(fromX, fromY, amount) {
    if (window.game && window.game.__god) return false;
    if (this.invincible > 0 || this.lunchTimer > 0) return false;
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.invincible = 0.6;
      return false;
    }
    const dmg = Math.max(1, Math.round(amount != null ? amount : (this.hitDamage || 1)));
    this.hp = Math.max(0, this.hp - dmg);
    this.invincible = 0.8;
    const a = angleTo(fromX, fromY, this.x, this.y);
    this.knockback.x = Math.cos(a) * 280;
    this.knockback.y = Math.sin(a) * 280;
    if (this.hp <= 0 && (this.extraLives || 0) > 0) {
      this.extraLives -= 1;
      this.hp = Math.max(1, Math.ceil(this.maxHp * 0.5));
      this.invincible = 2.2;
      this._justRevived = true;
      return false;
    }
    return this.hp <= 0;
  }

  applyComplaint() {
    const resist = Math.max(0, Math.min(0.7, this.complaintResist || 0));
    const mul = 1 - resist;
    this.slowTimer = Math.max(this.slowTimer, 2.8 * mul);
    if (this.muteAttack <= 0.15) this.muteAttack = 1.4 * mul;
  }

  applyLunch() {
    const dur = 4.5 + (this.teaDurationBonus || 0);
    this.lunchTimer = dur;
    this.invincible = Math.max(this.invincible, dur);
    this.skill = 0;
  }

  draw(c) {
    const blink = this.invincible > 0 && Math.floor(this.invincible * 20) % 2 === 0;
    c.save();
    if (blink && this.lunchTimer <= 0) c.globalAlpha = 0.35;
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.beginPath(); c.ellipse(this.x + 2, this.y + 4, 12, 5, 0, 0, Math.PI * 2); c.fill();

    const ang = this.angle;
    let flip = false;
    let anim = this._animName || 'walk_down';
    let frameIdx = this._animFrame || 0;

    const heroId = this._saleHeroId;
    if (this.useSpriteAttackDraw()) {
      anim = this._atkAnim;
      const keys = playerAnimKeys(heroId, anim);
      const t = Math.min(0.999, this.attackTimer / Math.max(0.01, this.attackDuration));
      frameIdx = Math.min(keys.length - 1, Math.floor(t * keys.length));
      flip = Math.cos(ang) < 0;
    } else if (this.attacking) {
      const loco = pickPlayerLocomotionAnim(ang, false, false);
      anim = loco.anim;
      flip = loco.flip;
      frameIdx = Math.min(2, this._animFrame || 0);
    } else if (this.dashTime > 0) {
      anim = 'sprint';
      flip = Math.cos(ang) < 0;
    } else if (this._wasMoving) {
      const loco = pickPlayerLocomotionAnim(ang, true, false);
      anim = loco.anim;
      flip = loco.flip;
      frameIdx = this._animFrame || 0;
    } else {
      const loco = pickPlayerLocomotionAnim(ang, false, false);
      anim = loco.anim;
      flip = loco.flip;
      frameIdx = 0;
    }

    const keys = playerAnimKeys(heroId, anim);
    const walkKeys = playerAnimKeys(heroId, 'walk_down');
    const useKeys = keys.length ? keys : walkKeys;
    const frameKey = useKeys[Math.max(0, frameIdx % Math.max(1, useKeys.length))];
    if (this.lunchTimer > 0) {
      c.strokeStyle = 'rgba(241,196,15,0.75)';
      c.lineWidth = 3;
      c.beginPath(); c.arc(this.x, this.y, this.r + 10, 0, Math.PI * 2); c.stroke();
    }
    if (this.slowTimer > 0) c.globalAlpha = 0.85;

    const pack = typeof playerAnimData === 'function' ? playerAnimData(heroId) : null;
    const ownSprite = pack && pack.id && pack.id !== 'default';
    if (!ownSprite && this._saleHeroHue && (typeof LOW_GFX === 'undefined' || !LOW_GFX)) {
      c.filter = `hue-rotate(${this._saleHeroHue}deg)`;
    }
    const drawn = drawPlayerAnimFrame(c, frameKey, this.x, this.y + 4, { flip, anchorY: 1, heroId });
    if (this._saleHeroHue) c.filter = 'none';
    if (!drawn) {
      // fallback на старый атлас
      let name = 'player_front';
      if (this.attacking) name = 'player_attack';
      else if (Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang))) {
        name = (this._animPhase || 0) > 0.5 ? 'player_run1' : 'player_run2';
        if (!this._wasMoving) name = 'player_side';
      } else if (Math.sin(ang) < 0) name = 'player_back';
      if (!drawSprite(c, name, this.x, this.y + 4, { scale: 0.55, flip: Math.cos(ang) < 0, anchorY: 1 })) {
        c.fillStyle = '#3498db'; c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2); c.fill();
      }
    }

    if (this.shieldCharges > 0) {
      c.strokeStyle = 'rgba(52,152,219,0.85)'; c.lineWidth = 3;
      c.beginPath(); c.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2); c.stroke();
    }

    if (this.dashTime > 0) {
      c.strokeStyle = 'rgba(93,173,226,0.85)'; c.lineWidth = 3;
      c.beginPath(); c.arc(this.x, this.y, this.r + 12, 0, Math.PI * 2); c.stroke();
    }

    if (this.charging) {
      c.strokeStyle = `rgba(155,89,186,${0.4 + this.charge * 0.55})`;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(this.x, this.y, this.r + 14 + this.charge * 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.charge);
      c.stroke();
    }

    // Оружие: рисуем сам предмет удара (не «иконку на палке»)
    const showStick = this.attacking || this.attackCooldown > this.attackCooldownTime - 0.05;
    const hideWeaponSprite = this.useSpriteAttackDraw();
    if (showStick && !(hideWeaponSprite && (this.weapon && this.weapon.id === 'glove'))) {
      const stick = this.getStickEnd();
      const w = this.weapon || WEAPONS[0];
      const t = this.attacking
        ? Math.min(1, this.attackTimer / Math.max(0.01, this.attackDuration))
        : 0;
      // точка «хвата» ближе к телу, клинок/предмет — в середине–конце дуги
      const gripX = this.x + Math.cos(this.angle) * (this.r * 0.35);
      const gripY = this.y - 6 + Math.sin(this.angle) * (this.r * 0.35);
      const midX = (gripX + stick.x) * 0.5;
      const midY = (gripY + stick.y) * 0.5;
      const weaponAngle = stick.angle + Math.PI / 2;
      const iconScale = 0.52 + (this.attacking ? 0.12 * Math.sin(t * Math.PI) : 0);

      // след взмаха
      if (this.attacking) {
        c.save();
        c.globalAlpha = 0.22 + 0.2 * Math.sin(t * Math.PI);
        c.strokeStyle = w.color || '#f1c40f';
        c.lineWidth = 10;
        c.lineCap = 'round';
        c.beginPath();
        const arcR = this.r + this.stickLength * 0.72;
        const swing = this.stickSwingAngle;
        c.arc(this.x, this.y, arcR, this.angle + swing - 0.55, this.angle + swing + 0.15);
        c.stroke();
        c.restore();
      }

      // короткая рукоять только если нет иконки/спрайта
      const hasVisual = !!(w.icon || w.sprite);
      if (!hasVisual) {
        c.strokeStyle = w.color || '#8B4513';
        c.lineWidth = (w.id === 'sledge' || w.id === 'bat') ? 5 : 3.5;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(gripX, gripY);
        c.lineTo(stick.x, stick.y);
        c.stroke();
        c.fillStyle = w.tip || '#95a5a6';
        c.beginPath();
        c.arc(stick.x, stick.y, 7, 0, Math.PI * 2);
        c.fill();
      } else if (w.icon && drawWeaponIcon(c, w.icon, midX, midY, { scale: iconScale, rotation: weaponAngle })) {
        // ударный след иконкой у конца
        if (this.attacking && t > 0.35 && t < 0.85) {
          c.globalAlpha = 0.35;
          drawWeaponIcon(c, w.icon, stick.x, stick.y, { scale: iconScale * 0.85, rotation: weaponAngle + 0.25 });
          c.globalAlpha = 1;
        }
      } else if (w.sprite) {
        drawSprite(c, w.sprite, midX, midY, { scale: 0.85, anchorY: 0.5, rotation: stick.angle });
      }
    }
    c.restore();
  }

  tickAnim(dt, moving) {
    this._wasMoving = moving;
    if (this.attacking) return;
    const loco = pickPlayerLocomotionAnim(this.angle, moving, this.dashTime > 0);
    const anim = loco.anim;
    if (anim !== this._animName) {
      this._animName = anim;
      this._animFrame = 0;
      this._animPhase = 0;
    }
    const keys = playerAnimKeys(this._saleHeroId, anim);
    const fps = this.dashTime > 0 ? 14 : (moving ? 10 : 0);
    if (fps > 0 && keys.length) {
      this._animPhase = (this._animPhase || 0) + dt * fps;
      while (this._animPhase >= 1) {
        this._animPhase -= 1;
        this._animFrame = ((this._animFrame || 0) + 1) % keys.length;
      }
    } else {
      this._animFrame = 0;
      this._animPhase = 0;
    }
  }
}
