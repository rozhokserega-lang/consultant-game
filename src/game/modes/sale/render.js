/**
 * Распродажа: Отрисовка мира и экранного слоя режима.
 */
'use strict';

Game.prototype.renderSaleOverlays = function () {
  // вызывается внутри уже трансформированной камеры render()
  this.salePuddles = this.salePuddles || [];

  // босс-хазарды (ценники)
  for (const h of this.saleBossHazards || []) {
    if (h.kind !== 'pricetag') continue;
    const pulse = 0.75 + Math.sin(performance.now() / 120 + h.x) * 0.15;
    const a = Math.min(0.9, 0.35 + h.life * 0.12);
    ctx.save();
    // мягкая тонированная зона (Kenney) вместо плоского круга
    const drewZone = drawAnimFxFrame(ctx, 'kfx_circle', h.x, h.y, {
      scale: (h.r * pulse * 2.6) / 100, alpha: a * 0.85, tint: '#fbbf24',
    });
    if (!drewZone) {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = Math.min(1, a + 0.2);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('−70%', h.x, h.y);
    ctx.restore();
  }

  // телеграф рывка любого босса + метка
  for (const e of this.enemies || []) {
    if (!e.saleBossId || e.hp <= 0) continue;
    const def = SALE_BOSS_DEFS[e.saleBossId];
    if (e._saleChargeT > 0) {
      const len = 200;
      const col = def ? def.color : '#f59e0b';
      ctx.save();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(e._saleChargeAng) * len, e.y + Math.sin(e._saleChargeAng) * len);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      const flash = 0.3 + Math.sin(performance.now() / 120) * 0.2;
      drawAnimFxFrame(ctx, 'kfx_slash', e.x + Math.cos(e._saleChargeAng) * len * 0.55, e.y + Math.sin(e._saleChargeAng) * len * 0.55, {
        scale: 1.35, rot: e._saleChargeAng + Math.PI / 2, alpha: flash, tint: col,
      });
    }
    if (def) {
      ctx.save();
      ctx.strokeStyle = def.color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = def.color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.tag, e.x, e.y - e.r - 20);
      ctx.restore();
    }
  }

  // телеграф «могил» / взрывов — цвет босса, тонкий контур (без красной заливки)
  for (const h of this.saleBossHazards || []) {
    if (h.kind !== 'grave' || h.boom) continue;
    const t = 1 - h.life / Math.max(0.01, h.warnMax || 1.15);
    const pulse = 0.55 + Math.abs(Math.sin(performance.now() / 140)) * 0.25;
    const col = h.color || '#f59e0b';
    const rr = h.r * (0.72 + 0.28 * t);
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.2 * t;
    ctx.fillStyle = saleHexRgba(col, 0.14 + 0.1 * t);
    ctx.beginPath();
    ctx.arc(h.x, h.y, rr * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.45 + 0.35 * pulse * t;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // крест «зона» вместо кровавого пятна
    ctx.globalAlpha = 0.35 + 0.25 * t;
    ctx.lineWidth = 2;
    const cross = rr * 0.45;
    ctx.beginPath();
    ctx.moveTo(h.x - cross, h.y);
    ctx.lineTo(h.x + cross, h.y);
    ctx.moveTo(h.x, h.y - cross);
    ctx.lineTo(h.x, h.y + cross);
    ctx.stroke();
    ctx.restore();
  }

  // сжатие арены (Закрытие ТЦ)
  if (this.saleArenaShrink > 0.01) {
    const shrink = this.saleArenaShrink;
    const maxR = Math.min(this.worldW, this.worldH) * (0.48 - shrink * 0.25);
    ctx.save();
    ctx.strokeStyle = `rgba(251,146,60,${0.35 + shrink * 0.4})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(this.worldW / 2, this.worldH / 2, maxR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(124,45,18,0.12)';
    ctx.beginPath();
    ctx.rect(0, 0, this.worldW, this.worldH);
    ctx.arc(this.worldW / 2, this.worldH / 2, maxR, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  }

  // временные стены охраны
  if (this.saleTempWalls && this.saleTempWalls.length) {
    for (const w of this.saleTempWalls) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#ffcc80';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
      ctx.restore();
    }
  }

  // лужи (кофе / яд / кровь / пожар)
  const nowSec = performance.now() / 1000;
  for (const u of this.salePuddles) {
    const a = Math.min(0.55, 0.2 + u.life * 0.15);
    ctx.globalAlpha = a;
    ctx.fillStyle = u.color || '#d35400';
    ctx.beginPath();
    ctx.ellipse(u.x, u.y + 4, u.r * 0.95, u.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (u.hurtPlayer) {
      // живой огонь поверх горящей зоны
      drawAnimFxFrame(ctx, 'afx_fireloop', u.x, u.y - u.r * 0.35, {
        time: nowSec + u.x * 0.01, scale: (u.r * 2.2) / 100, alpha: Math.min(1, a * 2.2),
      });
    } else if (u.poison) {
      if (!drawAnimFxFrame(ctx, 'afx_bubbles', u.x, u.y - 4, {
        time: nowSec + u.y * 0.01, scale: (u.r * 2.4) / 100, alpha: 0.85,
      }) && typeof drawSpell === 'function') {
        drawSpell(ctx, 'sp_poison1', u.x, u.y, { scale: 0.45, anchorY: 0.5, alpha: 0.5 });
      }
    }
  }

  // громкоговоритель / ультразвук — постоянный пол-аура (LN censer)
  const floorAura = (this.saleWeapons && this.saleWeapons.ultrasound && this._saleUltraAuraR > 0)
    ? { r: this._saleUltraAuraR, label: 'УЗВ', fill0: 'rgba(56,189,248,0.2)', fill1: 'rgba(14,116,144,0.08)', fill2: 'rgba(8,47,73,0)', stroke: 'rgba(125,211,252,0.4)', text: 'rgba(186,230,253,0.55)' }
    : (this.saleWeapons && this.saleWeapons.speaker && this._salePromoAuraR > 0)
      ? { r: this._salePromoAuraR, label: 'АКЦИЯ', fill0: 'rgba(155,89,186,0.18)', fill1: 'rgba(120,60,160,0.08)', fill2: 'rgba(80,40,120,0)', stroke: 'rgba(241,196,15,0.35)', text: 'rgba(255,230,150,0.55)' }
      : null;
  if (floorAura && this.player) {
    const px = this.player.x;
    const py = this.player.y;
    const r = floorAura.r;
    const t = performance.now() / 1000;
    ctx.save();
    const g = ctx.createRadialGradient(px, py, r * 0.1, px, py, r);
    g.addColorStop(0, floorAura.fill0);
    g.addColorStop(0.55, floorAura.fill1);
    g.addColorStop(1, floorAura.fill2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = floorAura.stroke;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -t * 40;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 11px "Segoe UI",sans-serif';
    ctx.fillStyle = floorAura.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const a = t * 1.1 + (i * Math.PI * 2) / 3;
      ctx.fillText(floorAura.label, px + Math.cos(a) * r * 0.72, py + Math.sin(a) * r * 0.72);
    }
    ctx.restore();
  }

  // пульс ауры / волна новы
  if (this._saleAura) {
    const max = this._saleAura.max || 0.4;
    const k = 1 - Math.max(0, this._saleAura.t) / max;
    const wave = Math.sin(Math.min(1, Math.max(0, k)) * Math.PI);
    if (this._saleAura.promo) {
      ctx.save();
      ctx.globalAlpha = 0.45 * wave;
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this._saleAura.r * (0.55 + 0.5 * k), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      const alpha = Math.min(0.9, this._saleAura.t * 5);
      ctx.strokeStyle = `rgba(155,89,186,${0.35 * alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this._saleAura.r, 0, Math.PI * 2);
      ctx.stroke();
      if (this._saleAura.ico) {
        drawSaleIcon(ctx, this._saleAura.ico, this.player.x, this.player.y - this._saleAura.r * 0.25, 0.7, 0);
      }
    }
  }

  // кольца сирены
  for (const ring of this.saleRings || []) {
    const a = 1 - ring.r / Math.max(1, ring.maxR);
    ctx.save();
    ctx.globalAlpha = 0.55 * a;
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // швабры (sword)
  for (const sw of this.saleSwords || []) {
    drawSaleIcon(ctx, sw.ico || '🧹', sw.x, sw.y, (sw.size || 1) * 0.85, sw.ang || 0);
  }
  if (this._saleNova) {
    const alpha = Math.min(1, this._saleNova.t * 4);
    if (!(typeof drawSpell === 'function' && drawSpell(ctx, 'sp_fwave3', this.player.x, this.player.y, {
      scale: Math.min(0.55, (this._saleNova.r / 200) * (1 + (0.28 - this._saleNova.t))),
      anchorY: 0.5, alpha,
    }))) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this._saleNova.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // XP-дропы: выпавшие товары (Pixel Mart), тир по ценности гема
  for (const g of this.xpGems || []) {
    const bob = Math.sin(performance.now() / 180 + g.x * 0.05) * 2;
    if (!g.ico && window.MART_TIERS) {
      const tier = (g.value || 1) >= 6 ? '3' : (g.value || 1) >= 3 ? '2' : '1';
      const list = window.MART_TIERS[tier] || [];
      if (list.length) g.ico = list[Math.floor(Math.random() * list.length)];
    }
    const size = 16 + Math.min(10, (g.value || 1) * 2);
    let drawn = false;
    if (g.ico && typeof drawMartIcon === 'function') {
      // мягкая тень, чтобы товар читался на полу
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y + bob + size * 0.42, size * 0.4, size * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawn = drawMartIcon(ctx, g.ico, g.x, g.y + bob, { targetSize: size });
    }
    if (!drawn) {
      const sc = 0.18 + Math.min(0.12, (g.value || 1) * 0.03);
      if (!drawVfx(ctx, 'fx_crystal', g.x, g.y + bob, { scale: sc, anchorY: 0.85, alpha: 0.95 })) {
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // пауэрапы (посылка / магнит / хлопушка)
  for (const pu of this.salePowerups || []) {
    const def = SALE_POWERUPS[pu.kind];
    if (!def) continue;
    const bob = Math.sin(performance.now() / 220 + pu.x * 0.03) * 3;
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.1;
    const alpha = pu.life < 3 ? Math.max(0.25, pu.life / 3) : 1;
    ctx.save();
    ctx.globalAlpha = alpha * 0.45;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y + bob, (pu.r + 6) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    const drewSprite = def.sprite && typeof drawMartIcon === 'function'
      && drawMartIcon(ctx, def.sprite, pu.x, pu.y + bob, { targetSize: Math.round(30 * pulse) });
    if (!drewSprite) {
      const s = Math.round(24 * pulse);
      ctx.font = `${s}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(def.ico, pu.x, pu.y + bob);
      ctx.fillText(def.ico, pu.x, pu.y + bob);
    }
    ctx.restore();
  }

  // вихрь промо-магнита вокруг игрока
  if ((this.saleVacuumT || 0) > 0 && this.player) {
    drawAnimFxFrame(ctx, 'afx_vortex', this.player.x, this.player.y, {
      time: performance.now() / 1000, scale: 1.5,
      alpha: Math.min(0.9, this.saleVacuumT * 1.4),
    });
  }

  // цифры урона
  if (this.showDmgNumbers !== false) {
    for (const dn of this.saleDmgNums || []) {
      const t = Math.max(0, dn.life / dn.max);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 2.5);
      ctx.font = dn.big ? 'bold 15px sans-serif' : 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.fillStyle = dn.big ? '#f1c40f' : '#fff';
      ctx.strokeText(dn.txt, dn.x, dn.y);
      ctx.fillText(dn.txt, dn.x, dn.y);
      ctx.restore();
    }
  }

  // орбиты — чеки / швабра / лента
  for (const o of this.saleOrbits || []) {
    const rot = o.angle + performance.now() / 180;
    const sc = (o.size || 1) * 0.85;
    const vis = o.visual || o.weaponId || 'receipt';
    ctx.globalAlpha = 0.28;
    drawSaleIcon(ctx, o.ico || '🧾', o.x - Math.cos(o.angle) * 10, o.y - Math.sin(o.angle) * 10, sc * 0.7, rot - 0.4, vis, 1);
    ctx.globalAlpha = 1;
    drawSaleIcon(ctx, o.ico || '🧾', o.x, o.y, sc, rot, vis, 2);
  }

  // лучи (фонарик / охотник)
  for (const b of this.saleBeams || []) {
    const x1 = this.player.x, y1 = this.player.y;
    const x2 = b.x2 != null ? b.x2 : x1 + Math.cos(b.angle) * b.length;
    const y2 = b.y2 != null ? b.y2 : y1 + Math.sin(b.angle) * b.length;
    const grd = ctx.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0, 'rgba(255,230,120,0.12)');
    grd.addColorStop(0.4, 'rgba(255,210,60,0.4)');
    grd.addColorStop(1, 'rgba(255,250,200,0.04)');
    ctx.strokeStyle = grd;
    ctx.lineWidth = Math.max(5, b.width * 0.35);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,220,0.75)';
    ctx.lineWidth = Math.max(2, b.width * 0.12);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawSaleIcon(ctx, '🔦', x1 + Math.cos(b.angle) * 14, y1 + Math.sin(b.angle) * 14, 0.65, b.angle, 'flashlight', 2);
  }

  // бумеранги (карта)
  for (const b of this.saleBoomerangs || []) {
    const spin = performance.now() / 90;
    drawSaleIcon(ctx, b.ico || '💳', b.x, b.y, (b.size || 1) * 0.8, spin, b.visual || 'card', 2);
  }

  // заряды (тележка / магнит)
  for (const c of this.saleCharges || []) {
    drawSaleIcon(ctx, c.ico || '🛒', c.x, c.y, (c.size || 1.1) * 0.9, c.angle, c.visual || 'cart', 2);
    if (c.pull) {
      ctx.strokeStyle = 'rgba(155,89,186,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.pull * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // самонаводящиеся (мыши)
  for (const s of this.saleSeekers || []) {
    const batStage = 1 + (Math.floor(performance.now() / 120) % 3);
    drawSaleIcon(ctx, s.ico || '🦇', s.x, s.y, 0.7, s.angle || 0, s.visual || 'bats', batStage);
  }

  // снаряды (телефон / кофе / пакет / прайс)
  for (const pr of this.saleProjectiles || []) {
    const age = pr.born ? (performance.now() - pr.born) / 1000 : 0.5;
    const st = age < 0.08 ? 1 : 2;
    drawSaleIcon(ctx, pr.ico || '📱', pr.x, pr.y, 0.75, pr.angle + performance.now() / 140, pr.visual, st);
  }

  // обед / щит
  if (this.player.lunchTimer > 0) {
    drawVfx(ctx, 'fx_aura_gold', this.player.x, this.player.y, {
      scale: 0.4 + Math.sin(performance.now() / 120) * 0.04,
      anchorY: 0.7,
      alpha: 0.5,
    });
  } else if (this.player.invincible > 0.2) {
    if (!(typeof drawSpell === 'function' && drawSpell(ctx, 'sp_shield2', this.player.x, this.player.y - 4, {
      scale: 0.32, anchorY: 0.55, alpha: 0.45,
    }))) {
      drawVfx(ctx, 'fx_shield', this.player.x, this.player.y - 4, {
        scale: 0.32, anchorY: 0.55, alpha: 0.4,
      });
    }
  }

  // маркеры инвентаризации / VIP
  if (this.saleInvulnExcept || this.saleVipRef) {
    for (const e of this.enemies || []) {
      if (e.hp <= 0) continue;
      if (e._saleVip) {
        ctx.save();
        ctx.strokeStyle = 'rgba(241,196,15,0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 14 + Math.sin(performance.now() / 140) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (e._saleInvuln) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (this.saleInvulnExcept && e.type === this.saleInvulnExcept) {
        ctx.save();
        ctx.strokeStyle = 'rgba(46,204,113,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
};

Game.prototype.drawSalePlayerHpBar = function (sx, sy) {
  const p = this.player;
  if (!p || p.maxHp <= 0) return;
  const w = Math.max(34, Math.min(52, 28 + p.maxHp * 3));
  const h = 4;
  const barY = sy - 44;
  const hpF = Math.max(0, Math.min(1, p.hp / p.maxHp));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(sx - w / 2 - 1, barY - 1, w + 2, h + 2);
  if (p.maxHp <= 8) {
    const segW = (w - (p.maxHp - 1) * 2) / p.maxHp;
    for (let i = 0; i < p.maxHp; i++) {
      const filled = p.hp > i;
      const sx0 = sx - w / 2 + i * (segW + 2);
      ctx.fillStyle = filled
        ? (hpF > 0.35 ? '#2ecc71' : '#e74c3c')
        : 'rgba(255,255,255,0.12)';
      ctx.fillRect(sx0, barY, segW, h);
    }
  } else {
    ctx.fillStyle = hpF > 0.5 ? '#2ecc71' : hpF > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(sx - w / 2, barY, w * hpF, h);
  }
  ctx.restore();
};

/** Экранные оверлеи Sale (после restore камеры): HP над героем, стрелка на босса */
Game.prototype.renderSaleScreenUI = function () {
  if (this.isBoostersOpen() || this.gameOver || this.won || !this.player || !this.saleWeapons) return;
  const cam = this._renderCam;
  if (!cam) return;
  const p = this.player;
  const psx = (p.x - cam.x) * cam.z;
  const psy = (p.y - cam.y) * cam.z;
  if (psx > -40 && psx < this.W + 40 && psy > -60 && psy < this.H + 40) {
    this.drawSalePlayerHpBar(psx, psy);
  }
  for (const e of this.enemies || []) {
    if (e.hp <= 0 || !e.saleBossId) continue;
    const def = SALE_BOSS_DEFS[e.saleBossId];
    if (!def) continue;
    const sx = (e.x - cam.x) * cam.z;
    const sy = (e.y - cam.y) * cam.z;
    const pad = 26;
    if (sx > -pad && sx < this.W + pad && sy > -pad && sy < this.H + pad) continue;
    // босс за экраном — стрелка у края
    const edge = 46;
    const ax = Math.max(edge, Math.min(this.W - edge, sx));
    const ay = Math.max(edge + 40, Math.min(this.H - edge, sy));
    const ang = Math.atan2(sy - ay, sx - ax);
    const pulse = 1 + Math.sin(performance.now() / 160) * 0.12;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = def.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16 * pulse, 0);
    ctx.lineTo(-8 * pulse, -10 * pulse);
    ctx.lineTo(-8 * pulse, 10 * pulse);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-ang);
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText(def.tag, 0, 22);
    ctx.fillText(def.tag, 0, 22);
    ctx.restore();
  }
};
