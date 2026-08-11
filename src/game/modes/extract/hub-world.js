/**
 * Вылазка: сборка мира хаб-парковки.
 */
'use strict';

Object.assign(Game.prototype, {
  getExtractHubBounds() {
    const pad = 28;
    return {
      x0: pad,
      y0: pad + 70,
      x1: this.worldW - pad,
      y1: this.worldH - pad,
      doorCx: this.worldW / 2,
      doorW: 80,
    };
  },

  ensureExtractMeta() {
    if (!this.extractMeta) {
      this.extractMeta = {
        backpackSlots: EXTRACT_BACKPACK_START_SLOTS,
        stash: [],
        coins: 80,
        starterWeapon: EXTRACT_DEFAULT_STARTER,
      };
    }
    if (!this.extractMeta.starterWeapon) {
      this.extractMeta.starterWeapon = EXTRACT_DEFAULT_STARTER;
    }
    return this.extractMeta;
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
    this.player.angle = -Math.PI / 2;

    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;
  },
});
