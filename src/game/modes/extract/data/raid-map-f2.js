/**
 * Вылазка: раскладка 2-го этажа ТЦ — другая геометрия, сильнее мобы.
 * Координаты — доли мира 0..1.
 */
'use strict';

const EXTRACT_RAID_MAP_F2 = {
  spawn: { x: 0.12, y: 0.90 },

  /** Лифт — справа сверху; с 2 этажа только вниз в убежище. */
  elevator: {
    x: 0.88,
    y: 0.08,
    w: 96,
    h: 72,
    label: 'Лифт на парковку',
    prompt: 'Взаимодействовать',
    lockedBy: 'exit_boss',
  },

  rooms: [
    { x: 0.88, y: 0.08, label: 'Выход' },
    { x: 0.22, y: 0.28, label: 'Спорт' },
    { x: 0.78, y: 0.28, label: 'Ювелирка' },
    { x: 0.22, y: 0.74, label: 'Продукты' },
    { x: 0.78, y: 0.74, label: 'Бытовая' },
    { x: 0.50, y: 0.52, label: 'Холл' },
  ],

  /** Горизонтальный «хребет» коридоров + боковые залы. */
  walls: [
    // спорт (лево-верх)
    { x: 0.05, y: 0.14, w: 0.01, h: 0.30 },
    { x: 0.05, y: 0.14, w: 0.34, h: 0.012 },
    { x: 0.38, y: 0.14, w: 0.01, h: 0.08 },
    { x: 0.38, y: 0.34, w: 0.01, h: 0.10 },
    { x: 0.05, y: 0.43, w: 0.34, h: 0.012 },
    // ювелирка (право-верх, у выхода)
    { x: 0.62, y: 0.14, w: 0.01, h: 0.08 },
    { x: 0.62, y: 0.34, w: 0.01, h: 0.10 },
    { x: 0.62, y: 0.14, w: 0.33, h: 0.012 },
    { x: 0.94, y: 0.14, w: 0.01, h: 0.30 },
    { x: 0.62, y: 0.43, w: 0.33, h: 0.012 },
    // продукты (лево-низ)
    { x: 0.05, y: 0.56, w: 0.01, h: 0.30 },
    { x: 0.05, y: 0.56, w: 0.34, h: 0.012 },
    { x: 0.38, y: 0.56, w: 0.01, h: 0.08 },
    { x: 0.38, y: 0.78, w: 0.01, h: 0.08 },
    { x: 0.05, y: 0.85, w: 0.34, h: 0.012 },
    // бытовая (право-низ)
    { x: 0.62, y: 0.56, w: 0.01, h: 0.08 },
    { x: 0.62, y: 0.78, w: 0.01, h: 0.08 },
    { x: 0.62, y: 0.56, w: 0.33, h: 0.012 },
    { x: 0.94, y: 0.56, w: 0.01, h: 0.30 },
    { x: 0.62, y: 0.85, w: 0.33, h: 0.012 },
    // центральный хребет
    { x: 0.44, y: 0.46, w: 0.12, h: 0.014 },
    { x: 0.44, y: 0.58, w: 0.12, h: 0.014 },
    { x: 0.48, y: 0.34, w: 0.03, h: 0.04 },
    { x: 0.48, y: 0.66, w: 0.03, h: 0.04 },
  ],

  mobs: [
    { id: 'spawn1', type: 'normal', x: 0.18, y: 0.86, hpMul: 1.35, aggro: 210 },
    { id: 'spawn2', type: 'fast', x: 0.10, y: 0.84, hpMul: 1.25, aggro: 230 },
    { id: 'spawn3', type: 'queue', x: 0.22, y: 0.90, hpMul: 1.3, aggro: 200 },
    { id: 'spawn4', type: 'returner', x: 0.14, y: 0.92, hpMul: 1.35, aggro: 200 },

    // холл
    { id: 'h1', type: 'manager', x: 0.44, y: 0.52, hpMul: 1.55, aggro: 220 },
    { id: 'h2', type: 'fatty', x: 0.56, y: 0.52, hpMul: 1.5, aggro: 210 },
    { id: 'h3', type: 'fast', x: 0.50, y: 0.40, hpMul: 1.3, aggro: 240 },
    { id: 'h4', type: 'fast', x: 0.50, y: 0.64, hpMul: 1.3, aggro: 240 },
    { id: 'h5', type: 'blogger', x: 0.42, y: 0.58, hpMul: 1.4, aggro: 220 },
    { id: 'h6', type: 'tank', x: 0.58, y: 0.44, hpMul: 1.65, aggro: 220 },
    { id: 'h7', type: 'queue', x: 0.50, y: 0.48, hpMul: 1.35, aggro: 200 },

    // спорт
    { id: 'sp1', type: 'tank', x: 0.12, y: 0.24, hpMul: 1.7, aggro: 210 },
    { id: 'sp2', type: 'fast', x: 0.30, y: 0.30, hpMul: 1.35, aggro: 230 },
    { id: 'sp3', type: 'manager', x: 0.18, y: 0.36, hpMul: 1.5, aggro: 210 },
    { id: 'sp4', type: 'returner', x: 0.26, y: 0.22, hpMul: 1.4, aggro: 200 },
    { id: 'sp5', type: 'fatty', x: 0.14, y: 0.34, hpMul: 1.5, aggro: 200 },
    { id: 'sp_elite', type: 'tank', x: 0.20, y: 0.20, hpMul: 3.1, elite: true, lootId: 'loot_sneakers', aggro: 260 },

    // ювелирка
    { id: 'j1', type: 'manager', x: 0.70, y: 0.24, hpMul: 1.55, aggro: 220 },
    { id: 'j2', type: 'blogger', x: 0.86, y: 0.30, hpMul: 1.45, aggro: 230 },
    { id: 'j3', type: 'fast', x: 0.76, y: 0.36, hpMul: 1.3, aggro: 240 },
    { id: 'j4', type: 'returner', x: 0.84, y: 0.38, hpMul: 1.4, aggro: 210 },
    { id: 'j5', type: 'queue', x: 0.72, y: 0.32, hpMul: 1.35, aggro: 210 },
    { id: 'j_elite', type: 'influencer', x: 0.80, y: 0.18, hpMul: 3.3, elite: true, lootId: 'loot_console', aggro: 270 },

    // продукты
    { id: 'p1', type: 'normal', x: 0.12, y: 0.68, hpMul: 1.35, aggro: 200 },
    { id: 'p2', type: 'fatty', x: 0.28, y: 0.74, hpMul: 1.55, aggro: 210 },
    { id: 'p3', type: 'manager', x: 0.16, y: 0.78, hpMul: 1.5, aggro: 210 },
    { id: 'p4', type: 'fast', x: 0.24, y: 0.70, hpMul: 1.3, aggro: 230 },
    { id: 'p5', type: 'queue', x: 0.10, y: 0.76, hpMul: 1.35, aggro: 200 },
    { id: 'p_elite', type: 'manager', x: 0.20, y: 0.62, hpMul: 2.9, elite: true, lootId: 'loot_jeans', aggro: 250 },

    // бытовая
    { id: 'b1', type: 'tank', x: 0.70, y: 0.68, hpMul: 1.8, aggro: 230 },
    { id: 'b2', type: 'fatty', x: 0.88, y: 0.74, hpMul: 1.6, aggro: 220 },
    { id: 'b3', type: 'returner', x: 0.78, y: 0.80, hpMul: 1.45, aggro: 220 },
    { id: 'b4', type: 'manager', x: 0.84, y: 0.68, hpMul: 1.55, aggro: 230 },
    { id: 'b5', type: 'blogger', x: 0.74, y: 0.76, hpMul: 1.4, aggro: 220 },
    { id: 'b_elite', type: 'miniboss', x: 0.80, y: 0.62, hpMul: 2.1, elite: true, lootId: 'loot_safe', aggro: 290 },

    // охрана лифта (право-верх)
    { id: 'exit1', type: 'tank', x: 0.78, y: 0.14, hpMul: 1.75, aggro: 250 },
    { id: 'exit2', type: 'manager', x: 0.84, y: 0.18, hpMul: 1.65, aggro: 250 },
    { id: 'exit3', type: 'fast', x: 0.90, y: 0.16, hpMul: 1.4, aggro: 270 },
    { id: 'exit4', type: 'fatty', x: 0.76, y: 0.20, hpMul: 1.55, aggro: 240 },
    { id: 'exit5', type: 'tank', x: 0.92, y: 0.12, hpMul: 1.8, aggro: 260 },
    { id: 'exit6', type: 'blogger', x: 0.82, y: 0.22, hpMul: 1.5, aggro: 250 },
    { id: 'exit7', type: 'returner', x: 0.72, y: 0.16, hpMul: 1.45, aggro: 240 },
    { id: 'exit8', type: 'queue', x: 0.86, y: 0.24, hpMul: 1.4, aggro: 240 },
    { id: 'exit_guard', type: 'miniboss', x: 0.80, y: 0.12, hpMul: 2.3, elite: true, aggro: 300, nameTag: 'Старший охраны' },

    {
      id: 'exit_boss',
      type: 'director',
      x: 0.86,
      y: 0.10,
      hpMul: 3.0,
      elite: true,
      exitBoss: true,
      nameTag: 'Охранник лифта',
      aggro: 360,
      spdMul: 1.08,
    },
  ],

  loot: [
    { id: 'loot_sneakers', x: 0.18, y: 0.18, defId: 'gold_sneakers', lockedBy: 'sp_elite' },
    { id: 'loot_console', x: 0.82, y: 0.16, defId: 'tablet', lockedBy: 'j_elite' },
    { id: 'loot_jeans', x: 0.16, y: 0.62, defId: 'brand_bag', lockedBy: 'p_elite' },
    { id: 'loot_watch', x: 0.30, y: 0.70, defId: 'gold_watch', lockedBy: null },
    { id: 'loot_perfume', x: 0.70, y: 0.62, defId: 'perfume_xl', lockedBy: null },
    { id: 'loot_ring', x: 0.50, y: 0.50, defId: 'diamond_ring', lockedBy: null },
    { id: 'loot_safe', x: 0.82, y: 0.60, defId: 'vault_case', lockedBy: 'b_elite' },
  ],
};
