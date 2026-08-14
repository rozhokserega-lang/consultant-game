/**
 * Вылазка: раскладка первого этажа ТЦ — крупные комнаты.
 * Координаты — доли мира 0..1.
 */
'use strict';

const EXTRACT_RAID_MAP = {
  spawn: { x: 0.50, y: 0.92 },

  /** Лифт эвакуации — далеко от спавна, охраняется боссом. */
  elevator: {
    x: 0.10,
    y: 0.07,
    w: 96,
    h: 72,
    label: 'Лифт',
    prompt: 'Взаимодействовать',
    lockedBy: 'exit_boss',
  },

  rooms: [
    { x: 0.10, y: 0.07, label: 'Выход' },
    { x: 0.20, y: 0.26, label: 'Обувь' },
    { x: 0.80, y: 0.26, label: 'Электроника' },
    { x: 0.20, y: 0.72, label: 'Одежда' },
    { x: 0.80, y: 0.72, label: 'Сейф' },
    { x: 0.50, y: 0.48, label: 'Атриум' },
  ],

  /** Более просторные комнаты + широкий коридоры. */
  walls: [
    // обувь (лево-верх) — большая
    { x: 0.04, y: 0.12, w: 0.01, h: 0.34 },
    { x: 0.04, y: 0.12, w: 0.36, h: 0.012 },
    { x: 0.40, y: 0.12, w: 0.01, h: 0.10 },
    { x: 0.40, y: 0.36, w: 0.01, h: 0.10 },
    { x: 0.04, y: 0.45, w: 0.36, h: 0.012 },
    // электроника (право-верх)
    { x: 0.59, y: 0.12, w: 0.01, h: 0.10 },
    { x: 0.59, y: 0.36, w: 0.01, h: 0.10 },
    { x: 0.59, y: 0.12, w: 0.37, h: 0.012 },
    { x: 0.95, y: 0.12, w: 0.01, h: 0.34 },
    { x: 0.59, y: 0.45, w: 0.37, h: 0.012 },
    // одежда (лево-низ)
    { x: 0.04, y: 0.54, w: 0.01, h: 0.34 },
    { x: 0.04, y: 0.54, w: 0.36, h: 0.012 },
    { x: 0.40, y: 0.54, w: 0.01, h: 0.10 },
    { x: 0.40, y: 0.78, w: 0.01, h: 0.10 },
    { x: 0.04, y: 0.87, w: 0.36, h: 0.012 },
    // сейф (право-низ)
    { x: 0.59, y: 0.54, w: 0.01, h: 0.10 },
    { x: 0.59, y: 0.78, w: 0.01, h: 0.10 },
    { x: 0.59, y: 0.54, w: 0.37, h: 0.012 },
    { x: 0.95, y: 0.54, w: 0.01, h: 0.34 },
    { x: 0.59, y: 0.87, w: 0.37, h: 0.012 },
    // колонны атриума
    { x: 0.46, y: 0.38, w: 0.02, h: 0.035 },
    { x: 0.52, y: 0.38, w: 0.02, h: 0.035 },
    { x: 0.46, y: 0.58, w: 0.02, h: 0.035 },
    { x: 0.52, y: 0.58, w: 0.02, h: 0.035 },
  ],

  mobs: [
    // подход от спавна
    { id: 'spawn1', type: 'normal', x: 0.42, y: 0.88, hpMul: 1.15, aggro: 200 },
    { id: 'spawn2', type: 'normal', x: 0.58, y: 0.88, hpMul: 1.15, aggro: 200 },
    { id: 'spawn3', type: 'fast', x: 0.50, y: 0.84, hpMul: 1.1, aggro: 220 },
    { id: 'spawn4', type: 'queue', x: 0.46, y: 0.90, hpMul: 1.2, aggro: 190 },

    // атриум / коридоры
    { id: 'a1', type: 'normal', x: 0.42, y: 0.82, hpMul: 1.2, aggro: 200, pattern: 'trainee', passive: true, nameTag: 'Стажёр' },
    { id: 'a2', type: 'normal', x: 0.58, y: 0.82, hpMul: 1.2, aggro: 200, pattern: 'trainee', passive: true, nameTag: 'Стажёр' },
    { id: 'a3', type: 'fast', x: 0.50, y: 0.70, hpMul: 1.15, aggro: 220 },
    { id: 'a4', type: 'queue', x: 0.50, y: 0.42, hpMul: 1.25, aggro: 190 },
    { id: 'a5', type: 'returner', x: 0.44, y: 0.52, hpMul: 1.3, aggro: 200 },
    { id: 'a6', type: 'normal', x: 0.56, y: 0.52, hpMul: 1.25, aggro: 200 },
    { id: 'a7', type: 'manager', x: 0.50, y: 0.56, hpMul: 1.4, aggro: 210 },
    { id: 'a8', type: 'fatty', x: 0.48, y: 0.46, hpMul: 1.35, aggro: 190 },
    { id: 'a9', type: 'fast', x: 0.40, y: 0.60, hpMul: 1.2, aggro: 230 },
    { id: 'a10', type: 'fast', x: 0.60, y: 0.60, hpMul: 1.2, aggro: 230 },
    { id: 'a11', type: 'blogger', x: 0.50, y: 0.36, hpMul: 1.3, aggro: 210 },

    // обувь
    { id: 's1', type: 'normal', x: 0.10, y: 0.26, hpMul: 1.25, aggro: 180, pattern: 'trainee', passive: true, nameTag: 'Стажёр' },
    { id: 's2', type: 'returner', x: 0.30, y: 0.30, hpMul: 1.3, aggro: 180 },
    { id: 's3', type: 'fast', x: 0.22, y: 0.38, hpMul: 1.2, aggro: 200 },
    { id: 's4', type: 'queue', x: 0.14, y: 0.34, hpMul: 1.25, aggro: 180 },
    { id: 's5', type: 'tank', x: 0.28, y: 0.38, hpMul: 1.5, aggro: 190 },
    { id: 's6', type: 'queue', x: 0.18, y: 0.42, hpMul: 1.2, aggro: 180 },
    { id: 's_elite', type: 'tank', x: 0.20, y: 0.20, hpMul: 2.8, elite: true, lootId: 'loot_sneakers', aggro: 240 },

    // электроника
    { id: 'e1', type: 'manager', x: 0.68, y: 0.24, hpMul: 1.45, aggro: 200 },
    { id: 'e2', type: 'blogger', x: 0.88, y: 0.30, hpMul: 1.35, aggro: 210 },
    { id: 'e3', type: 'queue', x: 0.78, y: 0.36, hpMul: 1.25, aggro: 190 },
    { id: 'e4', type: 'fast', x: 0.72, y: 0.32, hpMul: 1.2, aggro: 220 },
    { id: 'e5', type: 'returner', x: 0.86, y: 0.38, hpMul: 1.3, aggro: 190 },
    { id: 'e6', type: 'normal', x: 0.80, y: 0.42, hpMul: 1.2, aggro: 180 },
    { id: 'e_elite', type: 'influencer', x: 0.80, y: 0.18, hpMul: 3.0, elite: true, lootId: 'loot_console', aggro: 250 },

    // одежда
    { id: 'c1', type: 'normal', x: 0.10, y: 0.68, hpMul: 1.25, aggro: 180 },
    { id: 'c2', type: 'fatty', x: 0.30, y: 0.74, hpMul: 1.45, aggro: 190 },
    { id: 'c3', type: 'manager', x: 0.16, y: 0.78, hpMul: 1.4, aggro: 190 },
    { id: 'c4', type: 'fast', x: 0.24, y: 0.70, hpMul: 1.2, aggro: 210 },
    { id: 'c5', type: 'queue', x: 0.12, y: 0.74, hpMul: 1.25, aggro: 180 },
    { id: 'c6', type: 'returner', x: 0.28, y: 0.80, hpMul: 1.3, aggro: 180 },
    { id: 'c_elite', type: 'manager', x: 0.20, y: 0.62, hpMul: 2.6, elite: true, lootId: 'loot_jeans', aggro: 230 },

    // сейф
    { id: 'v1', type: 'tank', x: 0.68, y: 0.68, hpMul: 1.7, aggro: 210 },
    { id: 'v2', type: 'fatty', x: 0.90, y: 0.72, hpMul: 1.5, aggro: 200 },
    { id: 'v3', type: 'returner', x: 0.78, y: 0.80, hpMul: 1.35, aggro: 200 },
    { id: 'v4', type: 'manager', x: 0.84, y: 0.68, hpMul: 1.45, aggro: 210 },
    { id: 'v5', type: 'fast', x: 0.72, y: 0.76, hpMul: 1.25, aggro: 220 },
    { id: 'v6', type: 'blogger', x: 0.88, y: 0.78, hpMul: 1.35, aggro: 210 },
    { id: 'v_elite', type: 'miniboss', x: 0.80, y: 0.62, hpMul: 1.85, elite: true, lootId: 'loot_safe', aggro: 270 },

    // охрана подхода к лифту
    { id: 'exit1', type: 'tank', x: 0.22, y: 0.14, hpMul: 1.6, aggro: 230 },
    { id: 'exit2', type: 'manager', x: 0.28, y: 0.12, hpMul: 1.5, aggro: 230 },
    { id: 'exit3', type: 'fast', x: 0.12, y: 0.16, hpMul: 1.25, aggro: 250 },
    { id: 'exit4', type: 'fatty', x: 0.20, y: 0.18, hpMul: 1.45, aggro: 220 },
    { id: 'exit5', type: 'tank', x: 0.08, y: 0.12, hpMul: 1.7, aggro: 240 },
    { id: 'exit6', type: 'manager', x: 0.18, y: 0.08, hpMul: 1.55, aggro: 240 },
    { id: 'exit7', type: 'fast', x: 0.14, y: 0.20, hpMul: 1.3, aggro: 260 },
    { id: 'exit8', type: 'blogger', x: 0.26, y: 0.16, hpMul: 1.4, aggro: 230 },
    { id: 'exit9', type: 'returner', x: 0.10, y: 0.22, hpMul: 1.35, aggro: 230 },
    { id: 'exit10', type: 'queue', x: 0.24, y: 0.20, hpMul: 1.35, aggro: 220 },
    { id: 'exit_guard', type: 'miniboss', x: 0.24, y: 0.10, hpMul: 2.1, elite: true, aggro: 280, nameTag: 'Старший охраны' },

    // охранник лифта эвакуации
    {
      id: 'exit_boss',
      type: 'director',
      x: 0.16,
      y: 0.10,
      hpMul: 2.6,
      elite: true,
      exitBoss: true,
      bossPattern: 'trainer',
      nameTag: 'Тренер',
      aggro: 340,
      spdMul: 1.05,
    },
  ],

  loot: [
    { id: 'loot_sneakers', x: 0.18, y: 0.18, defId: 'sneakers', lockedBy: 's_elite' },
    { id: 'loot_console', x: 0.82, y: 0.16, defId: 'console', lockedBy: 'e_elite' },
    { id: 'loot_jeans', x: 0.16, y: 0.62, defId: 'jeans', lockedBy: 'c_elite' },
    { id: 'loot_watch', x: 0.32, y: 0.72, defId: 'watch', lockedBy: null },
    { id: 'loot_perfume', x: 0.68, y: 0.62, defId: 'perfume', lockedBy: null },
    { id: 'loot_ring', x: 0.50, y: 0.48, defId: 'ring', lockedBy: null },
    { id: 'loot_safe', x: 0.82, y: 0.60, defId: 'safe_box', lockedBy: 'v_elite' },
    { id: 'loot_giftbag', x: 0.07, y: 0.83, defId: 'sale_giftbag', hidden: true },
  ],
};
