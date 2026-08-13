/**
 * Вылазка: сборка мира хаб-парковки.
 */
'use strict';

Object.assign(Game.prototype, {
  getExtractHubBounds() {
    return {
      x0: 54,
      y0: 136,
      x1: this.worldW - 59,
      y1: 716,
      doorCx: this.worldW / 2,
      doorW: 112,
    };
  },

  ensureExtractMeta() {
    if (!this.extractMeta) {
      const saved = (this.save && this.save.extractMeta) || {};
      const startSlots = (typeof EXTRACT_BACKPACK_START_SLOTS !== 'undefined')
        ? EXTRACT_BACKPACK_START_SLOTS
        : 5;
      const maxSlots = (typeof EXTRACT_BACKPACK_MAX_SLOTS !== 'undefined')
        ? EXTRACT_BACKPACK_MAX_SLOTS
        : 12;
      let slots = saved.backpackSlots | 0;
      if (slots < startSlots) slots = startSlots;
      if (slots > maxSlots) slots = maxSlots;
      this.extractMeta = {
        backpackSlots: slots,
        coins: Math.max(0, saved.coins != null ? (saved.coins | 0) : 80),
        starterWeapon: saved.starterWeapon || EXTRACT_DEFAULT_STARTER,
        totalExtractedValue: Math.max(0, saved.totalExtractedValue | 0),
      };
    }
    if (!this.extractMeta.starterWeapon) {
      this.extractMeta.starterWeapon = EXTRACT_DEFAULT_STARTER;
    }
    if (this.extractMeta.totalExtractedValue == null) {
      this.extractMeta.totalExtractedValue = 0;
    }
    if (!Array.isArray(this.extractBackpack)) {
      this.extractBackpack = this._loadExtractBackpackFromSave(this.extractMeta.backpackSlots);
    }
    return this.extractMeta;
  },

  isExtractStarterUnlocked(id) {
    const needMap = (typeof EXTRACT_STARTER_UNLOCKS !== 'undefined') ? EXTRACT_STARTER_UNLOCKS : {};
    const need = needMap[id] != null ? needMap[id] : 0;
    const meta = this.ensureExtractMeta();
    return (meta.totalExtractedValue | 0) >= need;
  },

  /** Босс лифта на текущем этаже повержен — лифт открыт. */
  isExtractExitBossCleared() {
    if (this.extractExitBossAlive) return false;
    if (this.extractElevator && this.extractElevator.locked) return false;
    return true;
  },

  /** Можно ли подняться на targetFloor (по умолчанию — следующий). */
  canAscendExtractFloor(targetFloor) {
    const next = targetFloor != null ? (targetFloor | 0) : ((this.extractFloor || 1) + 1);
    const bossOk = typeof this.isExtractExitBossCleared === 'function'
      ? this.isExtractExitBossCleared()
      : true;
    if (next === 3) {
      return bossOk
        && typeof this.hasExtractVipCard === 'function'
        && this.hasExtractVipCard();
    }
    if (next === 2) {
      return bossOk;
    }
    return true;
  },

  /** Текст блокировки подъёма на этаж. */
  extractFloorLockHint(targetFloor) {
    const f = targetFloor | 0;
    const bossOk = typeof this.isExtractExitBossCleared === 'function'
      ? this.isExtractExitBossCleared()
      : true;
    if (f === 2) {
      return bossOk ? '2 этаж открыт' : '2 этаж: победи босса лифта';
    }
    if (f === 3) {
      if (!bossOk) return '3 этаж: победи босса лифта';
      if (typeof this.hasExtractVipCard === 'function' && !this.hasExtractVipCard()) {
        return '3 этаж: найди спрятанную 🪪 VIP-карту на 2 этаже';
      }
      return '3 этаж открыт';
    }
    return `${f} этаж закрыт`;
  },

  extractFloorUnlockNeed(targetFloor) {
    return 0;
  },

  _loadExtractBackpackFromSave(slots) {
    const n = Math.max(1, slots | 0);
    const raw = this.save && Array.isArray(this.save.extractBackpack)
      ? this.save.extractBackpack
      : null;
    const out = new Array(n).fill(null);
    if (!raw) return out;
    for (let i = 0; i < n; i++) {
      const it = raw[i];
      if (it && typeof it === 'object') out[i] = Object.assign({}, it);
    }
    return out;
  },

  /** Синхронизировать длину рюкзака со слотами меты. */
  syncExtractBackpackSize() {
    const meta = this.ensureExtractMeta();
    const n = meta.backpackSlots | 0;
    if (!Array.isArray(this.extractBackpack)) {
      this.extractBackpack = new Array(n).fill(null);
      return;
    }
    while (this.extractBackpack.length < n) this.extractBackpack.push(null);
    if (this.extractBackpack.length > n) this.extractBackpack.length = n;
  },

  persistExtract() {
    this.syncExtractBackpackSize();
    if (typeof this.persist === 'function') this.persist();
  },

  buildExtractHubWorld() {
    const map = EXTRACT_HUB_MAP;
    this.worldW = EXTRACT_HUB_W;
    this.worldH = EXTRACT_HUB_H;
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
    this.extractFacades = [];

    for (const car of map.cars) {
      const w = car.w;
      const h = car.h;
      const x = this.worldW * car.x - w / 2;
      const y = this.worldH * car.y - h / 2;
      this.obstacles.push({
        x, y, w, h,
        dw: w, dh: h,
        sprite: 'extract_car',
        type: 'extract_car',
        color: car.color || '#7f8c8d',
        van: !!car.van,
      });
    }

    for (const pillar of map.pillars || []) {
      const w = pillar.w;
      const h = pillar.h;
      const x = this.worldW * pillar.x - w / 2;
      const y = this.worldH * pillar.y - h / 2;
      this.obstacles.push({
        x, y, w, h,
        dw: w, dh: h,
        sprite: 'extract_pillar',
        type: 'extract_pillar',
      });
    }

    for (const prop of map.props) {
      const size = prop.kind === 'cart' ? 36 : 18;
      const x = this.worldW * prop.x - size / 2;
      const y = this.worldH * prop.y - size / 2;
      this.obstacles.push({
        x, y, w: size, h: size,
        dw: size, dh: size + 8,
        sprite: 'extract_prop',
        type: 'extract_prop',
        kind: prop.kind,
      });
    }

    const el = map.elevator;
    this.extractElevator = {
      x: this.worldW * el.x,
      y: this.worldH * el.y,
      w: el.w,
      h: el.h,
      label: el.label,
      prompt: el.prompt,
      role: 'elevator',
    };

    this.extractNpcs = EXTRACT_HUB_NPCS.map((npc) => {
      return {
        id: npc.id,
        role: npc.role,
        name: npc.name,
        prompt: npc.prompt || 'Взаимодействовать',
        x: this.worldW * npc.x,
        y: this.worldH * npc.y,
        r: 22,
        mobId: npc.mobId || 'mob_tank',
        mobPose: 'idle',
        angle: Math.PI / 2,
      };
    });

    const sx = this.worldW * map.spawn.x;
    const sy = this.worldH * map.spawn.y;
    const weapon = this.getWeapon ? this.getWeapon() : null;
    this.player = new Player(sx, sy, weapon);
    if (typeof this.refreshPlayerLoadoutWeapon === 'function') this.refreshPlayerLoadoutWeapon();
    if (typeof this.applySaleHeroToPlayer === 'function') this.applySaleHeroToPlayer();
    this.player.angle = -Math.PI / 2;

    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;
  },
});
