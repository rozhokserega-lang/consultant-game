/** Оружие режима «Смена»: характеристики, прокачка, временные подборы. */

const WEAPONS = [
  { id: 'hammer', name: 'Молоток', ico: '🔨', icon: 'wicon_hammer', price: 0,
    stickLength: 42, cooldown: 0.36, damage: 1, arc: Math.PI / 3, knock: 300, speedBonus: 0, stun: 0, color: '#8B4513', tip: '#95a5a6' },
  { id: 'glove', name: 'Перчатка', ico: '🥊', icon: 'wicon_glove', price: 35,
    stickLength: 26, cooldown: 0.17, damage: 1, arc: Math.PI / 2.1, knock: 460, speedBonus: 12, stun: 0, color: '#c0392b', tip: '#e74c3c' },
  { id: 'bat', name: 'Бита', ico: '🏏', icon: 'wicon_bat', price: 50,
    stickLength: 58, cooldown: 0.48, damage: 2, arc: Math.PI / 3.4, knock: 400, speedBonus: -8, stun: 0, color: '#a67c2d', tip: '#d4a017' },
  { id: 'crowbar', name: 'Лом', ico: '🔧', icon: 'wicon_crowbar', price: 55,
    stickLength: 50, cooldown: 0.40, damage: 1, arc: Math.PI / 2.8, knock: 520, speedBonus: 0, stun: 0.35, color: '#922b21', tip: '#e74c3c' },
  { id: 'pan', name: 'Сковорода', ico: '🍳', icon: 'wicon_pan', price: 60,
    stickLength: 36, cooldown: 0.42, damage: 1, arc: Math.PI / 1.8, knock: 380, speedBonus: -5, stun: 0.55, color: '#7f8c8d', tip: '#bdc3c7' },
  { id: 'sledge', name: 'Кувалда', ico: '⛏️', icon: 'wicon_sledge', price: 80,
    stickLength: 54, cooldown: 0.62, damage: 3, arc: Math.PI / 3.6, knock: 560, speedBonus: -18, stun: 0.25, color: '#5d4e37', tip: '#95a5a6' },
  { id: 'cleaver', name: 'Тесак', ico: '🔪', icon: 'wicon_cleaver', price: 70,
    stickLength: 40, cooldown: 0.30, damage: 2, arc: Math.PI / 2.6, knock: 280, speedBonus: 5, stun: 0, color: '#566573', tip: '#ecf0f1' },
];

const WEAPON_MAX_LEVEL = 10;
/** Цены уровней 1→10 (сумма ~1600🪙 на одно оружие — слив банка). */
const WEAPON_UPGRADE_COSTS = [28, 40, 55, 75, 100, 135, 180, 240, 320, 430];
/**
 * Мелкий прирост за уровень. Урон только точечно (не у тесака/перчатки).
 * dmgAt — уровни, на которых +1 урона.
 */
const WEAPON_LEVEL_BONUS = {
  hammer:  { cd: -0.005, knock: 10, dmgAt: [5, 10] },
  glove:   { cd: -0.003, knock: 8, speed: 1.2 },
  bat:     { reach: 1.0, knock: 12, dmgAt: [10] },
  crowbar: { stun: 0.018, knock: 15, dmgAt: [10] },
  pan:     { arc: 0.015, stun: 0.02, knock: 8, dmgAt: [10] },
  cleaver: { knock: 10, speed: 1.0, cd: -0.003 },
  sledge:  { stun: 0.012, reach: 0.9, knock: 16, dmgAt: [10] },
};

function weaponUpgradeCost(currentLevel) {
  if (currentLevel < 0 || currentLevel >= WEAPON_MAX_LEVEL) return null;
  return WEAPON_UPGRADE_COSTS[currentLevel];
}

function scaleWeaponStats(base, level) {
  const lv = Math.max(0, Math.min(WEAPON_MAX_LEVEL, level | 0));
  const def = WEAPON_LEVEL_BONUS[base.id] || {};
  const dmgBonus = (def.dmgAt || []).filter(t => lv >= t).length;
  return Object.assign({}, base, {
    cooldown: Math.max(0.12, +(base.cooldown + (def.cd || 0) * lv).toFixed(3)),
    knock: Math.round(base.knock + (def.knock || 0) * lv),
    stickLength: Math.round(base.stickLength + (def.reach || 0) * lv),
    speedBonus: Math.round(((base.speedBonus || 0) + (def.speed || 0) * lv) * 10) / 10,
    stun: Math.max(0, +((base.stun || 0) + (def.stun || 0) * lv).toFixed(3)),
    arc: base.arc + (def.arc || 0) * lv,
    damage: (base.damage || 1) + dmgBonus,
    level: lv,
  });
}

const HAMMERS = WEAPONS;


const TEMP_WEAPONS = {
  mop: { id: 'mop', name: 'Швабра', ico: '🧹', stickLength: 52, cooldown: 0.40, damage: 1, arc: Math.PI / 1.6, knock: 340, speedBonus: 0, stun: 0, color: '#2980b9', tip: '#85c1e9', duration: 14 },
  stapler: { id: 'stapler', name: 'Степлер', ico: '📎', stickLength: 28, cooldown: 0.28, damage: 1, arc: Math.PI / 5, knock: 180, speedBonus: 5, stun: 0, color: '#566573', tip: '#ecf0f1', duration: 14, ranged: true },
  extinguisher: { id: 'extinguisher', name: 'Огнетушитель', ico: '🧯', stickLength: 48, cooldown: 0.55, damage: 2, arc: Math.PI / 1.5, knock: 620, speedBonus: -10, stun: 0.2, color: '#c0392b', tip: '#fff', duration: 16, aoe: true },
};
