/**
 * Вылазка: уплотнение карты — доп. крылья комнат и мобы (площадь ×~3 за счёт мира).
 */
'use strict';

/**
 * Доп. крылья (норм. координаты). Мержатся в buildExtractRaidWorld.
 * floorMul — с какого этажа крыло активно.
 */
const EXTRACT_MAP_EXTRA_WINGS = [
  {
    id: 'food',
    floorMin: 1,
    room: { x: 0.50, y: 0.22, label: 'Фуд-корт' },
    walls: [
      { x: 0.42, y: 0.16, w: 0.16, h: 0.01 },
      { x: 0.42, y: 0.16, w: 0.01, h: 0.12 },
      { x: 0.57, y: 0.16, w: 0.01, h: 0.12 },
      { x: 0.42, y: 0.28, w: 0.07, h: 0.01 },
      { x: 0.51, y: 0.28, w: 0.07, h: 0.01 },
    ],
    mobs: [
      { id: 'food1', type: 'normal', x: 0.46, y: 0.20, hpMul: 1.2, aggro: 190 },
      { id: 'food2', type: 'fast', x: 0.54, y: 0.22, hpMul: 1.15, aggro: 210 },
      { id: 'food3', type: 'queue', x: 0.50, y: 0.26, hpMul: 1.25, aggro: 180 },
      { id: 'food4', type: 'manager', x: 0.48, y: 0.18, hpMul: 1.4, aggro: 200 },
      { id: 'food5', type: 'returner', x: 0.52, y: 0.24, hpMul: 1.3, aggro: 190 },
    ],
    loot: [{ id: 'loot_food', x: 0.50, y: 0.19, defId: 'perfume', lockedBy: null }],
  },
  {
    id: 'toys',
    floorMin: 1,
    room: { x: 0.50, y: 0.78, label: 'Игрушки' },
    walls: [
      { x: 0.42, y: 0.72, w: 0.16, h: 0.01 },
      { x: 0.42, y: 0.72, w: 0.01, h: 0.12 },
      { x: 0.57, y: 0.72, w: 0.01, h: 0.12 },
      { x: 0.42, y: 0.84, w: 0.07, h: 0.01 },
      { x: 0.51, y: 0.84, w: 0.07, h: 0.01 },
    ],
    mobs: [
      { id: 'toy1', type: 'normal', x: 0.46, y: 0.76, hpMul: 1.2, aggro: 190 },
      { id: 'toy2', type: 'fatty', x: 0.54, y: 0.78, hpMul: 1.35, aggro: 190 },
      { id: 'toy3', type: 'fast', x: 0.50, y: 0.80, hpMul: 1.2, aggro: 220 },
      { id: 'toy4', type: 'blogger', x: 0.48, y: 0.74, hpMul: 1.3, aggro: 200 },
      { id: 'toy5', type: 'queue', x: 0.52, y: 0.82, hpMul: 1.25, aggro: 180 },
    ],
    loot: [{ id: 'loot_toys', x: 0.50, y: 0.77, defId: 'watch', lockedBy: null }],
  },
  {
    id: 'books',
    floorMin: 2,
    room: { x: 0.08, y: 0.50, label: 'Книги' },
    walls: [
      { x: 0.03, y: 0.42, w: 0.12, h: 0.01 },
      { x: 0.03, y: 0.42, w: 0.01, h: 0.16 },
      { x: 0.14, y: 0.42, w: 0.01, h: 0.06 },
      { x: 0.14, y: 0.52, w: 0.01, h: 0.06 },
      { x: 0.03, y: 0.58, w: 0.12, h: 0.01 },
    ],
    mobs: [
      { id: 'bk1', type: 'manager', x: 0.08, y: 0.46, hpMul: 1.5, aggro: 210 },
      { id: 'bk2', type: 'tank', x: 0.10, y: 0.52, hpMul: 1.7, aggro: 220 },
      { id: 'bk3', type: 'fast', x: 0.06, y: 0.50, hpMul: 1.3, aggro: 240 },
      { id: 'bk4', type: 'returner', x: 0.12, y: 0.48, hpMul: 1.4, aggro: 200 },
      { id: 'bk5', type: 'blogger', x: 0.07, y: 0.54, hpMul: 1.35, aggro: 210 },
      { id: 'bk_elite', type: 'tank', x: 0.09, y: 0.44, hpMul: 2.9, elite: true, lootId: 'loot_books', aggro: 260 },
    ],
    loot: [{ id: 'loot_books', x: 0.08, y: 0.45, defId: 'gold_watch', lockedBy: 'bk_elite' }],
  },
  {
    id: 'cinema',
    floorMin: 2,
    room: { x: 0.92, y: 0.50, label: 'Кино' },
    walls: [
      { x: 0.85, y: 0.42, w: 0.12, h: 0.01 },
      { x: 0.85, y: 0.42, w: 0.01, h: 0.06 },
      { x: 0.85, y: 0.52, w: 0.01, h: 0.06 },
      { x: 0.96, y: 0.42, w: 0.01, h: 0.16 },
      { x: 0.85, y: 0.58, w: 0.12, h: 0.01 },
    ],
    mobs: [
      { id: 'ci1', type: 'influencer', x: 0.90, y: 0.46, hpMul: 2.2, aggro: 250 },
      { id: 'ci2', type: 'fatty', x: 0.92, y: 0.52, hpMul: 1.55, aggro: 220 },
      { id: 'ci3', type: 'fast', x: 0.88, y: 0.50, hpMul: 1.35, aggro: 250 },
      { id: 'ci4', type: 'manager', x: 0.94, y: 0.48, hpMul: 1.55, aggro: 230 },
      { id: 'ci5', type: 'queue', x: 0.91, y: 0.54, hpMul: 1.35, aggro: 210 },
      { id: 'ci_elite', type: 'miniboss', x: 0.93, y: 0.44, hpMul: 2.4, elite: true, lootId: 'loot_cinema', aggro: 280 },
    ],
    loot: [{ id: 'loot_cinema', x: 0.92, y: 0.45, defId: 'tablet', lockedBy: 'ci_elite' }],
  },
  {
    id: 'security',
    floorMin: 3,
    room: { x: 0.50, y: 0.34, label: 'Пульт охраны' },
    walls: [
      { x: 0.44, y: 0.30, w: 0.12, h: 0.01 },
      { x: 0.44, y: 0.30, w: 0.01, h: 0.10 },
      { x: 0.55, y: 0.30, w: 0.01, h: 0.10 },
      { x: 0.44, y: 0.40, w: 0.05, h: 0.01 },
      { x: 0.51, y: 0.40, w: 0.05, h: 0.01 },
    ],
    mobs: [
      { id: 'sec1', type: 'tank', x: 0.47, y: 0.34, hpMul: 2.0, aggro: 280, pattern: 'sec_rush', nameTag: 'СБ' },
      { id: 'sec2', type: 'tank', x: 0.53, y: 0.34, hpMul: 2.0, aggro: 280, pattern: 'sec_rush', nameTag: 'СБ' },
      { id: 'sec3', type: 'manager', x: 0.50, y: 0.37, hpMul: 1.8, aggro: 270 },
      { id: 'sec4', type: 'fast', x: 0.48, y: 0.32, hpMul: 1.5, aggro: 300 },
      { id: 'sec5', type: 'fast', x: 0.52, y: 0.32, hpMul: 1.5, aggro: 300 },
      { id: 'sec6', type: 'miniboss', x: 0.50, y: 0.35, hpMul: 2.8, elite: true, lootId: 'loot_sec', aggro: 320, pattern: 'sec_rush' },
    ],
    loot: [{ id: 'loot_sec', x: 0.50, y: 0.33, defId: 'cash_brick', lockedBy: 'sec6' }],
  },
];

/** Добавляет сателлитов вокруг каждой комнаты карты. */
function extractSatelliteMobsForRooms(rooms, floor, prefix) {
  const out = [];
  const types = ['normal', 'fast', 'queue', 'returner', 'manager', 'blogger'];
  let n = 0;
  for (const room of rooms || []) {
    const count = floor >= 3 ? 4 : floor >= 2 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (room.x || 0);
      out.push({
        id: (prefix || 'sat') + '_' + (n++),
        type: types[(n + floor) % types.length],
        x: Math.max(0.05, Math.min(0.95, (room.x || 0.5) + Math.cos(ang) * 0.045)),
        y: Math.max(0.08, Math.min(0.92, (room.y || 0.5) + Math.sin(ang) * 0.045)),
        hpMul: 1.15 + floor * 0.08,
        aggro: 180 + floor * 20,
      });
    }
  }
  return out;
}

Object.assign(Game.prototype, {
  /** Сливает базовую карту с крыльями и сателлитами. */
  composeExtractRaidMap(floor) {
    const base = this.getExtractRaidMap(floor);
    const map = {
      spawn: base.spawn,
      elevator: base.elevator,
      rooms: (base.rooms || []).slice(),
      walls: (base.walls || []).slice(),
      mobs: (base.mobs || []).slice(),
      loot: (base.loot || []).slice(),
    };
    for (const wing of EXTRACT_MAP_EXTRA_WINGS) {
      if ((wing.floorMin || 1) > floor) continue;
      if (wing.room) map.rooms.push(wing.room);
      if (wing.walls) map.walls.push.apply(map.walls, wing.walls);
      if (wing.mobs) {
        for (const m of wing.mobs) {
          map.mobs.push(Object.assign({}, m, {
            id: m.id + '_f' + floor,
            lootId: m.lootId ? m.lootId + '_f' + floor : null,
            hpMul: (m.hpMul || 1) * (1 + (floor - 1) * 0.08),
          }));
        }
      }
      if (wing.loot) {
        for (const L of wing.loot) {
          map.loot.push(Object.assign({}, L, {
            id: L.id + '_f' + floor,
            lockedBy: L.lockedBy ? L.lockedBy + '_f' + floor : null,
          }));
        }
      }
    }
    map.mobs.push.apply(map.mobs, extractSatelliteMobsForRooms(map.rooms, floor, 'sat' + floor));
    return map;
  },
});
