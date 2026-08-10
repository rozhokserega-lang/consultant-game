/** Внутриигровой магазин между волнами. */

// oncePerRun: можно купить 1 раз за смену; perWave: лимит на визит магазина; weapon: покупается навсегда
const SHOP_ITEMS = [
  { id: 'heal', ico: '❤️', ttl: 'Пластырь', desc: '+2 HP', price: 8, perWave: 1,
    apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 2); } },
  { id: 'medkit', ico: '🩹', ttl: 'Аптечка', desc: 'Полное лечение', price: 18, perWave: 1,
    apply: (p) => { p.hp = p.maxHp; } },
  { id: 'shield', ico: '🛡️', ttl: 'Бейдж', desc: 'Блок 1 удара', price: 14, perWave: 1,
    apply: (p) => { p.shieldCharges = Math.min(2, (p.shieldCharges || 0) + 1); } },
  { id: 'maxhp', ico: '💖', ttl: 'Жилетка', desc: 'Макс HP +1', price: 28, oncePerRun: true,
    apply: (p) => { p.maxHp++; p.hp = Math.min(p.hp + 1, p.maxHp); } },
  { id: 'shoe', ico: '👟', ttl: 'Кроссы', desc: 'Скорость +15', price: 24, oncePerRun: true,
    apply: (p) => { p.bonusSpeed = (p.bonusSpeed || 0) + 15; p.recalcStats(); } },
  { id: 'dmg', ico: '💥', ttl: 'Энергетик', desc: 'Урон +1', price: 32, oncePerRun: true,
    apply: (p) => { p.bonusDamage = (p.bonusDamage || 0) + 1; p.recalcStats(); } },
  { id: 'w_glove', weaponId: 'glove', ico: '🥊', ttl: 'Перчатка', desc: 'Быстрые удары', price: 35 },
  { id: 'w_bat', weaponId: 'bat', ico: '🏏', ttl: 'Бита', desc: 'Дальше и больнее', price: 50 },
  { id: 'w_crowbar', weaponId: 'crowbar', ico: '🔧', ttl: 'Лом', desc: 'Сильный отброс', price: 55 },
  { id: 'w_pan', weaponId: 'pan', ico: '🍳', ttl: 'Сковорода', desc: 'Широкая дуга + стан', price: 60 },
  { id: 'w_cleaver', weaponId: 'cleaver', ico: '🔪', ttl: 'Тесак', desc: 'Быстро и больно', price: 70 },
  { id: 'w_sledge', weaponId: 'sledge', ico: '⛏️', ttl: 'Кувалда', desc: 'Урон 3, медленно', price: 80 },
];

const SHOP_BUYS_PER_VISIT = 2;
