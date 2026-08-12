/**
 * Вылазка: давление по времени и ценности рюкзака.
 */
'use strict';

Object.assign(Game.prototype, {
  resetExtractRaidPressure(keepRun) {
    if (!keepRun) {
      this.extractRaidTime = 0;
      this.extractRaidUpgrades = 0;
      this.extractRaidMods = { dmg: 1, speed: 1, haste: 0, area: 0, hp: 0 };
      this._extractUpgradeQueue = 0;
    }
    this._extractPressureAcc = 0;
    this._extractPressureTicks = 0;
  },

  getExtractBackpackValue() {
    let v = 0;
    for (const it of this.extractBackpack || []) {
      if (!it || it.kind === 'bulkPad') continue;
      v += it.value || 0;
    }
    return v;
  },

  getExtractHeatLevel() {
    const v = this.getExtractBackpackValue();
    const soft = (typeof EXTRACT_HEAT_SOFT !== 'undefined') ? EXTRACT_HEAT_SOFT : 180;
    const hard = (typeof EXTRACT_HEAT_HARD !== 'undefined') ? EXTRACT_HEAT_HARD : 420;
    if (v >= hard) return 2;
    if (v >= soft) return 1;
    return 0;
  },

  /** Множитель интервала давления: жар ускоряет подкрепления. */
  getExtractPressureInterval() {
    const base = (typeof EXTRACT_PRESSURE_INTERVAL !== 'undefined') ? EXTRACT_PRESSURE_INTERVAL : 42;
    const min = (typeof EXTRACT_PRESSURE_INTERVAL_MIN !== 'undefined') ? EXTRACT_PRESSURE_INTERVAL_MIN : 18;
    const start = (typeof EXTRACT_PRESSURE_START !== 'undefined') ? EXTRACT_PRESSURE_START : 55;
    const t = this.extractRaidTime || 0;
    // после старта плавно сжимаем интервал
    const late = Math.max(0, t - start);
    let interval = base - late * 0.35;
    const heat = this.getExtractHeatLevel();
    if (heat >= 2) interval *= 0.72;
    else if (heat >= 1) interval *= 0.88;
    if ((this.extractFloor || 1) >= 3) interval *= 0.9;
    return Math.max(min, interval);
  },

  tickExtractRaidPressure(dt) {
    if (this.extractPhase !== 'raid' || !this.player) return;
    this.extractRaidTime = (this.extractRaidTime || 0) + dt;

    // растущий агро
    const grow = (typeof EXTRACT_AGGRO_GROW_PER_MIN !== 'undefined') ? EXTRACT_AGGRO_GROW_PER_MIN : 28;
    const cap = (typeof EXTRACT_AGGRO_GROW_CAP !== 'undefined') ? EXTRACT_AGGRO_GROW_CAP : 120;
    const bonus = Math.min(cap, (this.extractRaidTime / 60) * grow);
    this._extractAggroBonus = bonus;
    for (const e of this.enemies || []) {
      if (e.hp <= 0 || e._extractExitBoss) continue;
      const base = e._extractAggroBase != null ? e._extractAggroBase : (e._extractAggroR || 160);
      e._extractAggroBase = base;
      e._extractAggroR = base + bonus + (this.getExtractHeatLevel() >= 2 ? 40 : this.getExtractHeatLevel() >= 1 ? 18 : 0);
    }

    const start = (typeof EXTRACT_PRESSURE_START !== 'undefined') ? EXTRACT_PRESSURE_START : 55;
    if (this.extractRaidTime < start) return;
    // не давим, пока жив босс лифта и игрок ещё далеко в начале — ок, тикаем всегда после START
    this._extractPressureAcc = (this._extractPressureAcc || 0) + dt;
    const need = this.getExtractPressureInterval();
    if (this._extractPressureAcc < need) return;
    this._extractPressureAcc = 0;
    this._extractPressureTicks = (this._extractPressureTicks || 0) + 1;
    this.spawnExtractPressureWave();
  },

  spawnExtractPressureWave() {
    if (!this.player) return;
    let n = (typeof EXTRACT_PRESSURE_MOBS !== 'undefined') ? EXTRACT_PRESSURE_MOBS : 3;
    n += Math.min(3, (this.extractFloor || 1) - 1);
    const heat = this.getExtractHeatLevel();
    if (heat >= 2) n += 2;
    else if (heat >= 1) n += 1;

    const chance = (typeof EXTRACT_HEAT_PATROL_CHANCE !== 'undefined') ? EXTRACT_HEAT_PATROL_CHANCE : 0.55;
    const nearPlayer = heat >= 2 && Math.random() < chance;

    const types = heat >= 2
      ? ['tank', 'manager', 'fast', 'fatty', 'returner']
      : ['normal', 'fast', 'queue', 'returner', 'manager'];
    const floor = this.extractFloor || 1;
    const floorDef = this.getExtractFloorDef(floor);
    const globalHp = (typeof EXTRACT_MOB_HP_MUL !== 'undefined') ? EXTRACT_MOB_HP_MUL : 1;
    const globalSpd = (typeof EXTRACT_MOB_SPD_MUL !== 'undefined') ? EXTRACT_MOB_SPD_MUL : 1;
    const px = this.player.x;
    const py = this.player.y;

    for (let i = 0; i < n; i++) {
      let x;
      let y;
      if (nearPlayer && i < 2) {
        const ang = rand(0, Math.PI * 2);
        const rad = rand(220, 340);
        x = px + Math.cos(ang) * rad;
        y = py + Math.sin(ang) * rad;
      } else {
        // с края карты / у комнат
        const edge = Math.floor(rand(0, 4));
        if (edge === 0) { x = rand(80, this.worldW - 80); y = 80; }
        else if (edge === 1) { x = rand(80, this.worldW - 80); y = this.worldH - 80; }
        else if (edge === 2) { x = 80; y = rand(80, this.worldH - 80); }
        else { x = this.worldW - 80; y = rand(80, this.worldH - 80); }
      }
      x = Math.max(60, Math.min(this.worldW - 60, x));
      y = Math.max(60, Math.min(this.worldH - 60, y));
      const type = types[i % types.length];
      const e = new Enemy(x, y, type, 1);
      e._extractId = 'pressure_' + (this._extractPressureTicks || 0) + '_' + i;
      e._extractAggro = nearPlayer && i < 2;
      e._extractAggroBase = nearPlayer ? 280 : 200;
      e._extractAggroR = e._extractAggroBase + (this._extractAggroBonus || 0);
      e.nameTag = heat >= 2 ? 'Патруль ★' : 'Подкрепление';
      const hpMul = 1.25 * globalHp * (floorDef.hpMul || 1);
      e.maxHp = Math.max(1, Math.round(e.maxHp * hpMul));
      e.hp = e.maxHp;
      e.speed *= 1.05 * globalSpd * (floorDef.spdMul || 1);
      this.enemies.push(e);
    }

    const heatTip = heat >= 2 ? 'Охрана чует дорогой груз!' : (heat >= 1 ? 'Охрана насторожилась…' : 'Подкрепление на этаже');
    this.showExtractBanner(heatTip, 2.2);
    sfx.mode();
  },
});
