/**
 * Вылазка: 3-й этаж — самый жёсткий рейд (VIP / админ-зона).
 * Координаты — доли мира 0..1.
 */
'use strict';

const EXTRACT_RAID_MAP_F3 = {
  spawn: { x: 0.50, y: 0.92 },

  /** Лифт в центре сверху — только вниз (убежище или ниже по цепочке через выбор). */
  elevator: {
    x: 0.46,
    y: 0.05,
    w: 96,
    h: 72,
    label: 'Лифт на парковку',
    prompt: 'Взаимодействовать',
    lockedBy: 'exit_boss',
  },

  rooms: [
    { x: 0.50, y: 0.08, label: 'Выход VIP' },
    { x: 0.18, y: 0.30, label: 'Серверная' },
    { x: 0.82, y: 0.30, label: 'Касса' },
    { x: 0.18, y: 0.72, label: 'Склад' },
    { x: 0.82, y: 0.72, label: 'Архив' },
    { x: 0.50, y: 0.52, label: 'Галерея' },
  ],

  walls: [
    // серверная
    { x: 0.04, y: 0.14, w: 0.01, h: 0.32 },
    { x: 0.04, y: 0.14, w: 0.32, h: 0.012 },
    { x: 0.35, y: 0.14, w: 0.01, h: 0.08 },
    { x: 0.35, y: 0.36, w: 0.01, h: 0.10 },
    { x: 0.04, y: 0.45, w: 0.32, h: 0.012 },
    // касса
    { x: 0.64, y: 0.14, w: 0.01, h: 0.08 },
    { x: 0.64, y: 0.36, w: 0.01, h: 0.10 },
    { x: 0.64, y: 0.14, w: 0.32, h: 0.012 },
    { x: 0.95, y: 0.14, w: 0.01, h: 0.32 },
    { x: 0.64, y: 0.45, w: 0.32, h: 0.012 },
    // склад
    { x: 0.04, y: 0.54, w: 0.01, h: 0.32 },
    { x: 0.04, y: 0.54, w: 0.32, h: 0.012 },
    { x: 0.35, y: 0.54, w: 0.01, h: 0.08 },
    { x: 0.35, y: 0.78, w: 0.01, h: 0.08 },
    { x: 0.04, y: 0.85, w: 0.32, h: 0.012 },
    // архив
    { x: 0.64, y: 0.54, w: 0.01, h: 0.08 },
    { x: 0.64, y: 0.78, w: 0.01, h: 0.08 },
    { x: 0.64, y: 0.54, w: 0.32, h: 0.012 },
    { x: 0.95, y: 0.54, w: 0.01, h: 0.32 },
    { x: 0.64, y: 0.85, w: 0.32, h: 0.012 },
    // узкий коридор к лифту + колонны
    { x: 0.42, y: 0.20, w: 0.01, h: 0.12 },
    { x: 0.57, y: 0.20, w: 0.01, h: 0.12 },
    { x: 0.46, y: 0.40, w: 0.02, h: 0.04 },
    { x: 0.52, y: 0.40, w: 0.02, h: 0.04 },
    { x: 0.46, y: 0.60, w: 0.02, h: 0.04 },
    { x: 0.52, y: 0.60, w: 0.02, h: 0.04 },
  ],

  mobs: [
    { id: 'spawn1', type: 'tank', x: 0.42, y: 0.88, hpMul: 1.7, aggro: 240 },
    { id: 'spawn2', type: 'tank', x: 0.58, y: 0.88, hpMul: 1.7, aggro: 240 },
    { id: 'spawn3', type: 'fast', x: 0.50, y: 0.84, hpMul: 1.45, aggro: 260 },
    { id: 'spawn4', type: 'manager', x: 0.46, y: 0.90, hpMul: 1.6, aggro: 230 },
    { id: 'spawn5', type: 'fatty', x: 0.54, y: 0.90, hpMul: 1.55, aggro: 230 },

    // галерея
    { id: 'g1', type: 'miniboss', x: 0.50, y: 0.52, hpMul: 2.2, aggro: 260 },
    { id: 'g2', type: 'tank', x: 0.40, y: 0.48, hpMul: 1.85, aggro: 250, pattern: 'cashier_pair', pairId: 'gallery_pair', nameTag: 'Кассир' },
    { id: 'g3', type: 'tank', x: 0.60, y: 0.48, hpMul: 1.85, aggro: 250, pattern: 'cashier_pair', pairId: 'gallery_pair', nameTag: 'Кассир' },
    { id: 'g4', type: 'influencer', x: 0.50, y: 0.40, hpMul: 2.4, aggro: 270 },
    { id: 'g5', type: 'fast', x: 0.44, y: 0.58, hpMul: 1.5, aggro: 280 },
    { id: 'g6', type: 'fast', x: 0.56, y: 0.58, hpMul: 1.5, aggro: 280 },
    { id: 'g7', type: 'blogger', x: 0.50, y: 0.64, hpMul: 1.55, aggro: 250 },

    // серверная
    { id: 'sv1', type: 'tank', x: 0.12, y: 0.24, hpMul: 1.9, aggro: 240, pattern: 'sec_rush', nameTag: 'СБ' },
    { id: 'sv2', type: 'manager', x: 0.28, y: 0.28, hpMul: 1.7, aggro: 240 },
    { id: 'sv3', type: 'fatty', x: 0.18, y: 0.36, hpMul: 1.7, aggro: 230, pattern: 'merch_trail', nameTag: 'Мерчендайзер' },
    { id: 'sv4', type: 'returner', x: 0.26, y: 0.22, hpMul: 1.55, aggro: 230, pattern: 'auditor', passive: true, nameTag: 'Ревизор' },
    { id: 'sv5', type: 'queue', x: 0.14, y: 0.32, hpMul: 1.5, aggro: 220 },
    { id: 'sv_elite', type: 'miniboss', x: 0.20, y: 0.18, hpMul: 3.4, elite: true, lootId: 'loot_server', aggro: 300, pattern: 'sec_rush' },

    // касса
    { id: 'c1', type: 'influencer', x: 0.78, y: 0.22, hpMul: 2.6, aggro: 280 },
    { id: 'c2', type: 'tank', x: 0.88, y: 0.30, hpMul: 1.9, aggro: 250, pattern: 'cashier_pair', pairId: 'cash_pair', nameTag: 'Кассир' },
    { id: 'c3', type: 'manager', x: 0.72, y: 0.34, hpMul: 1.7, aggro: 250 },
    { id: 'c4', type: 'fast', x: 0.84, y: 0.38, hpMul: 1.5, aggro: 270 },
    { id: 'c5', type: 'tank', x: 0.76, y: 0.28, hpMul: 1.85, aggro: 250, pattern: 'cashier_pair', pairId: 'cash_pair', nameTag: 'Кассир' },
    { id: 'c_elite', type: 'director', x: 0.82, y: 0.16, hpMul: 2.8, elite: true, lootId: 'loot_cash', aggro: 320, nameTag: 'Кассир-охранник' },

    // склад
    { id: 'w1', type: 'fatty', x: 0.12, y: 0.68, hpMul: 1.75, aggro: 230, pattern: 'merch_trail', nameTag: 'Мерчендайзер' },
    { id: 'w2', type: 'tank', x: 0.28, y: 0.74, hpMul: 1.95, aggro: 250, pattern: 'sec_rush', nameTag: 'СБ' },
    { id: 'w3', type: 'manager', x: 0.16, y: 0.78, hpMul: 1.7, aggro: 240 },
    { id: 'w4', type: 'returner', x: 0.24, y: 0.70, hpMul: 1.55, aggro: 240, pattern: 'auditor', passive: true, nameTag: 'Ревизор' },
    { id: 'w5', type: 'queue', x: 0.10, y: 0.76, hpMul: 1.5, aggro: 220 },
    { id: 'w_elite', type: 'tank', x: 0.20, y: 0.62, hpMul: 3.5, elite: true, lootId: 'loot_crate', aggro: 290, pattern: 'sec_rush' },

    // архив
    { id: 'a1', type: 'miniboss', x: 0.78, y: 0.68, hpMul: 2.4, aggro: 280 },
    { id: 'a2', type: 'tank', x: 0.88, y: 0.74, hpMul: 1.95, aggro: 260 },
    { id: 'a3', type: 'fatty', x: 0.74, y: 0.78, hpMul: 1.7, aggro: 240 },
    { id: 'a4', type: 'manager', x: 0.84, y: 0.70, hpMul: 1.75, aggro: 250 },
    { id: 'a5', type: 'blogger', x: 0.72, y: 0.72, hpMul: 1.55, aggro: 250 },
    { id: 'a_elite', type: 'miniboss', x: 0.82, y: 0.62, hpMul: 3.2, elite: true, lootId: 'loot_archive', aggro: 310 },

    // охрана лифта VIP
    { id: 'exit1', type: 'tank', x: 0.40, y: 0.14, hpMul: 2.0, aggro: 280 },
    { id: 'exit2', type: 'tank', x: 0.60, y: 0.14, hpMul: 2.0, aggro: 280 },
    { id: 'exit3', type: 'fast', x: 0.46, y: 0.18, hpMul: 1.55, aggro: 300 },
    { id: 'exit4', type: 'fast', x: 0.54, y: 0.18, hpMul: 1.55, aggro: 300 },
    { id: 'exit5', type: 'manager', x: 0.42, y: 0.10, hpMul: 1.85, aggro: 280 },
    { id: 'exit6', type: 'manager', x: 0.58, y: 0.10, hpMul: 1.85, aggro: 280 },
    { id: 'exit7', type: 'fatty', x: 0.48, y: 0.20, hpMul: 1.7, aggro: 260 },
    { id: 'exit8', type: 'miniboss', x: 0.52, y: 0.12, hpMul: 2.6, elite: true, aggro: 320, nameTag: 'VIP-охрана' },
    { id: 'exit9', type: 'influencer', x: 0.44, y: 0.16, hpMul: 2.5, aggro: 290 },
    { id: 'exit10', type: 'blogger', x: 0.56, y: 0.16, hpMul: 1.6, aggro: 270 },

    {
      id: 'exit_boss',
      type: 'director',
      x: 0.50,
      y: 0.08,
      hpMul: 3.8,
      elite: true,
      exitBoss: true,
      bossPattern: 'auditor_final',
      nameTag: 'Главный ревизор',
      aggro: 400,
      spdMul: 1.12,
    },
  ],

  loot: [
    { id: 'loot_server', x: 0.18, y: 0.18, defId: 'server_blade', lockedBy: 'sv_elite' },
    { id: 'loot_cash', x: 0.84, y: 0.16, defId: 'cash_brick', lockedBy: 'c_elite' },
    { id: 'loot_crate', x: 0.16, y: 0.62, defId: 'rare_crate', lockedBy: 'w_elite' },
    { id: 'loot_archive', x: 0.84, y: 0.60, defId: 'black_ledger', lockedBy: 'a_elite' },
    { id: 'loot_gallery', x: 0.50, y: 0.48, defId: 'vip_watch', lockedBy: null },
    { id: 'loot_side', x: 0.30, y: 0.70, defId: 'gold_watch', lockedBy: null },
    { id: 'loot_side2', x: 0.70, y: 0.70, defId: 'diamond_ring', lockedBy: null },
  ],
};
