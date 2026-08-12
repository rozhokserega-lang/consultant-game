/**
 * Вылазка: сборка этажа ТЦ — стены, статичные мобы, лут.
 */
'use strict';

Object.assign(Game.prototype, {
  getExtractRaidMap(floor) {
    const f = floor || this.extractFloor || 1;
    if (f >= 3 && typeof EXTRACT_RAID_MAP_F3 !== 'undefined') return EXTRACT_RAID_MAP_F3;
    if (f >= 2 && typeof EXTRACT_RAID_MAP_F2 !== 'undefined') return EXTRACT_RAID_MAP_F2;
    return EXTRACT_RAID_MAP;
  },

  getExtractFloorDef(floor) {
    const f = floor || this.extractFloor || 1;
    if (typeof EXTRACT_FLOOR_DEFS !== 'undefined' && EXTRACT_FLOOR_DEFS[f]) {
      return EXTRACT_FLOOR_DEFS[f];
    }
    return { label: f + ' этаж', hpMul: 1, spdMul: 1, lootMul: 1 };
  },

  buildExtractRaidWorld() {
    const floor = this.extractFloor || 1;
    const map = (typeof this.composeExtractRaidMap === 'function')
      ? this.composeExtractRaidMap(floor)
      : this.getExtractRaidMap(floor);
    const floorDef = this.getExtractFloorDef(floor);
    this.worldW = EXTRACT_RAID_W;
    this.worldH = EXTRACT_RAID_H;
    this.obstacles = [];
    this.storefronts = [];
    this.wallDecor = [];
    this.zones = [];
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
    this.pickups = [];
    this.playerProjectiles = [];
    this.boomFx = [];
    this.fuseBombs = [];
    this.bossLines = [];
    this.animFx = this.animFx || [];
    this.animFx.length = 0;
    this.extractNpcs = [];
    this.extractRooms = map.rooms || [];

    for (const wall of map.walls || []) {
      const w = Math.max(14, Math.round(this.worldW * wall.w));
      const h = Math.max(14, Math.round(this.worldH * wall.h));
      const x = this.worldW * wall.x;
      const y = this.worldH * wall.y;
      this.obstacles.push({
        x, y, w, h,
        dw: w,
        dh: h + 18,
        sprite: 'extract_wall',
        type: 'extract_wall',
      });
    }

    const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
    const canGoUp = floor < maxFloor;
    this.extractElevator = {
      x: this.worldW * map.elevator.x,
      y: this.worldH * map.elevator.y,
      w: map.elevator.w,
      h: map.elevator.h,
      label: canGoUp ? 'Лифт' : (map.elevator.label || 'Лифт на парковку'),
      prompt: map.elevator.prompt,
      role: 'elevator_exit',
      lockedBy: map.elevator.lockedBy || null,
      locked: !!map.elevator.lockedBy,
      canGoUp,
    };
    this.extractExitBossAlive = !!map.elevator.lockedBy;

    const lootMul = floorDef.lootMul || 1;
    this.extractLoot = (map.loot || []).map((L) => {
      const base = EXTRACT_LOOT_DEFS[L.defId] || {
        id: L.defId,
        name: L.defId,
        ico: '📦',
        value: 10,
        rarity: 'common',
      };
      const def = Object.assign({}, base, {
        value: Math.max(1, Math.round((base.value || 10) * lootMul)),
      });
      return {
        id: L.id,
        x: this.worldW * L.x,
        y: this.worldH * L.y,
        lockedBy: L.lockedBy || null,
        locked: !!L.lockedBy,
        taken: false,
        def,
      };
    });

    const floorHp = floorDef.hpMul || 1;
    const floorSpd = floorDef.spdMul || 1;
    for (const m of map.mobs || []) {
      const x = this.worldW * m.x;
      const y = this.worldH * m.y;
      const e = new Enemy(x, y, m.type || 'normal', 1);
      e._extractId = m.id;
      e._extractAggro = false;
      e._extractAggroBase = m.aggro || 160;
      e._extractAggroR = e._extractAggroBase;
      e._extractElite = !!m.elite;
      e._extractLootId = m.lootId || null;
      e._extractExitBoss = !!m.exitBoss;
      e._saleOrbT = 0;
      if (m.nameTag) e.nameTag = m.nameTag;
      const globalHp = (typeof EXTRACT_MOB_HP_MUL !== 'undefined') ? EXTRACT_MOB_HP_MUL : 1;
      const globalSpd = (typeof EXTRACT_MOB_SPD_MUL !== 'undefined') ? EXTRACT_MOB_SPD_MUL : 1;
      const hpMul = (m.hpMul || 1) * globalHp * floorHp;
      e.maxHp = Math.max(1, Math.round(e.maxHp * hpMul));
      e.hp = e.maxHp;
      const spdMul = (m.spdMul || 1) * globalSpd * floorSpd * (m.exitBoss ? 0.95 : 1);
      e.speed *= spdMul;
      if (m.exitBoss) {
        e.nameTag = (m.nameTag || 'Охранник лифта') + ' 👔';
        e.r = Math.max(e.r, e.r * 1.2);
      } else if (m.elite) {
        e.nameTag = (e.nameTag || 'Охрана') + ' ★';
        e.r = Math.max(e.r, e.r * 1.08);
      }
      if (typeof this.applyExtractEnemyPattern === 'function') {
        this.applyExtractEnemyPattern(e, m, floor);
      }
      this.enemies.push(e);
    }

    if (typeof this.linkExtractQueues === 'function') this.linkExtractQueues();

    const sx = this.worldW * map.spawn.x;
    const sy = this.worldH * map.spawn.y;
    this.initExtractRaidCombat(sx, sy);
    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;
  },
});
