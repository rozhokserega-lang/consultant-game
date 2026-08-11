/**
 * Вылазка: отрисовка хаба/рейда и экранных подсказок.
 */
'use strict';

Object.assign(Game.prototype, {
  drawExtractHubBackground() {
    const WW = this.worldW;
    const WH = this.worldH;
    ctx.fillStyle = '#2b3036';
    ctx.fillRect(0, 0, WW, WH);

    // Асфальт
    ctx.fillStyle = '#3a4048';
    ctx.fillRect(24, 96, WW - 48, WH - 120);

    // Парковочная разметка
    ctx.strokeStyle = 'rgba(245,245,245,0.55)';
    ctx.lineWidth = 3;
    const lanes = [0.28, 0.42, 0.56, 0.70];
    for (const ly of lanes) {
      const y = WH * ly;
      for (let i = 0; i < 2; i++) {
        const x0 = WW * (0.08 + i * 0.55);
        ctx.strokeRect(x0, y - 28, WW * 0.28, 56);
      }
    }

    // Пешеходная зебра к лифту
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(WW * 0.46, 108 + i * 14, WW * 0.08, 7);
    }

    // Фасад ТЦ сверху
    ctx.fillStyle = '#5d6d7e';
    ctx.fillRect(0, 0, WW, 92);
    ctx.fillStyle = '#1abc9c';
    ctx.fillRect(40, 18, 160, 52);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(220, 18, 140, 52);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('МЕГА МАРКЕТ', 52, 48);
    ctx.fillText('ЭЛЕКТРОНИКА', 232, 48);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ПАРКОВКА ТЦ', WW / 2, 36);
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Хаб вылазки', WW / 2, 56);
  },

  drawExtractRaidBackground() {
    const WW = this.worldW;
    const WH = this.worldH;
    ctx.fillStyle = '#d9d2c5';
    ctx.fillRect(0, 0, WW, WH);
    const tile = 64;
    ctx.fillStyle = '#e8dcc8';
    for (let x = 0; x < WW; x += tile) {
      for (let y = 0; y < WH; y += tile) {
        if (((x + y) / tile) % 2 < 1) ctx.fillRect(x, y, tile, tile);
      }
    }
    // Намёк на комнаты
    ctx.strokeStyle = 'rgba(120,100,80,0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(WW * 0.04, WH * 0.12, WW * 0.37, WH * 0.34);
    ctx.strokeRect(WW * 0.59, WH * 0.12, WW * 0.37, WH * 0.34);
    ctx.strokeRect(WW * 0.04, WH * 0.54, WW * 0.37, WH * 0.34);
    ctx.strokeRect(WW * 0.59, WH * 0.54, WW * 0.37, WH * 0.34);
  },

  drawExtractObstacle(ob) {
    const cx = ob.x + ob.w / 2;
    const by = ob.y + ob.h;
    if (ob.type === 'extract_car') {
      ctx.save();
      ctx.fillStyle = ob.color || '#7f8c8d';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = 'rgba(160,210,255,0.55)';
      ctx.fillRect(ob.x + 10, ob.y + 8, ob.w - 20, ob.h * 0.35);
      ctx.fillStyle = '#111';
      ctx.fillRect(ob.x + 6, ob.y + 4, 10, 8);
      ctx.fillRect(ob.x + ob.w - 16, ob.y + 4, 10, 8);
      ctx.fillRect(ob.x + 6, ob.y + ob.h - 12, 10, 8);
      ctx.fillRect(ob.x + ob.w - 16, ob.y + ob.h - 12, 10, 8);
      if (ob.van) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(ob.x + ob.w * 0.45, ob.y + 4, ob.w * 0.5 - 4, ob.h - 8);
      }
      ctx.restore();
      return;
    }
    if (ob.type === 'extract_prop') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '22px sans-serif';
      const ico = ob.kind === 'cone' ? '🚧' : ob.kind === 'cart' ? '🛒' : '⚪';
      ctx.fillText(ico, cx, by - 4);
      ctx.restore();
      return;
    }
    if (ob.type === 'extract_pillar') {
      ctx.fillStyle = '#9a8f7a';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = '#6d6456';
      ctx.fillRect(ob.x + 4, ob.y - 28, ob.w - 8, 32);
      return;
    }
    if (ob.type === 'extract_wall') {
      ctx.fillStyle = '#8b7e6a';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(ob.x, ob.y, ob.w, Math.min(8, ob.h));
      return;
    }
    this.drawObstacle(ob);
  },

  drawExtractNpc(npc) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + 10, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    let flip = false;
    if (this.player) {
      flip = this.player.x < npc.x;
      const d = dist(this.player.x, this.player.y, npc.x, npc.y);
      if (d < 140) npc.mobPose = 'idle';
    }
    const frameKey = (typeof enemyMobFrameKey === 'function')
      ? enemyMobFrameKey(npc)
      : ((npc.mobId || 'mob_muscle') + '_idle');
    const drew = typeof drawEnemyMob === 'function'
      && drawEnemyMob(ctx, frameKey, npc.x, npc.y + 4, { scale: 0.58, flip, anchorY: 1 });
    if (!drew) {
      ctx.fillStyle = npc.mobId === 'mob_pink' ? '#e91e8c' : '#c0392b';
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 3;
    ctx.strokeText(npc.name, npc.x, npc.y - 52);
    ctx.fillText(npc.name, npc.x, npc.y - 52);
    ctx.restore();
  },

  renderExtractOverlays() {
    const el = this.extractElevator;
    if (el) {
      ctx.save();
      ctx.fillStyle = el.locked ? '#5d6d7e' : '#7f8c8d';
      ctx.fillRect(el.x - el.w / 2, el.y - el.h / 2, el.w, el.h);
      ctx.fillStyle = '#34495e';
      ctx.fillRect(el.x - el.w / 2 + 6, el.y - el.h / 2 + 8, el.w / 2 - 8, el.h - 16);
      ctx.fillRect(el.x + 2, el.y - el.h / 2 + 8, el.w / 2 - 8, el.h - 16);
      ctx.fillStyle = el.locked ? '#e74c3c' : '#f1c40f';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(el.label || 'Лифт', el.x, el.y - el.h / 2 - 8);
      if (el.locked) {
        ctx.font = '20px sans-serif';
        ctx.fillText('🔒', el.x, el.y + 6);
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#ffdddd';
        ctx.fillText('Босс', el.x, el.y + el.h / 2 + 14);
      }
      ctx.restore();
    }

    if (this.extractPhase === 'raid' && this.extractRooms) {
      ctx.save();
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(80,60,40,0.55)';
      for (const room of this.extractRooms) {
        ctx.fillText(room.label, this.worldW * room.x, this.worldH * room.y);
      }
      ctx.restore();
    }

    if (this.extractPhase === 'raid') {
      for (const loot of this.extractLoot || []) {
        if (loot.taken) continue;
        const unlocked = this.isExtractLootUnlocked(loot);
        ctx.save();
        ctx.globalAlpha = unlocked ? 1 : 0.45;
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(loot.def.ico || '📦', loot.x, loot.y);
        if (!unlocked) {
          ctx.font = '14px sans-serif';
          ctx.fillText('🔒', loot.x + 14, loot.y - 12);
        }
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = unlocked ? '#1a1a1a' : '#7f8c8d';
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(loot.def.name, loot.x, loot.y + 18);
        ctx.fillText(loot.def.name, loot.x, loot.y + 18);
        ctx.restore();
      }
    }

    const focus = this.extractFocus;
    if (focus) {
      ctx.save();
      ctx.strokeStyle = 'rgba(241,196,15,0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(focus.x, focus.y, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  },

  renderExtractScreenUI() {
    if (this._extractBanner && this._extractBanner.t > 0) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 4;
      ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const tx = this.W / 2;
      const ty = this.H * 0.16;
      ctx.strokeText(this._extractBanner.text, tx, ty);
      ctx.fillText(this._extractBanner.text, tx, ty);
      ctx.restore();
    }
  },
});
