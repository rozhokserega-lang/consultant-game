/** Пул апгрейдов при повышении уровня в режиме «Смена». */

const UPGRADES = [
  { id: 'hp', ico: '❤️', ttl: '+1 HP', desc: 'Макс. и текущее здоровье +1', apply: p => { p.maxHp++; p.hp = Math.min(p.hp + 1, p.maxHp); } },
  { id: 'spd', ico: '💨', ttl: 'Скорость', desc: 'Бегай быстрее по ТЦ', apply: p => { p.bonusSpeed = (p.bonusSpeed || 0) + 20; p.recalcStats(); } },
  { id: 'stick', ico: '📏', ttl: 'Длиннее', desc: 'Дальность удара +6', apply: p => { p.stickLength += 6; } },
  { id: 'atk', ico: '⚡', ttl: 'Быстрее удар', desc: 'Кулдаун атаки −0.04с', apply: p => { p.attackCooldownTime = Math.max(0.12, p.attackCooldownTime - 0.04); } },
  { id: 'dmg', ico: '💥', ttl: 'Урон +1', desc: 'Удар бьёт сильнее', apply: p => { p.bonusDamage = (p.bonusDamage || 0) + 1; p.recalcStats(); } },
  { id: 'heal', ico: '🩹', ttl: 'Аптечка', desc: 'Полностью вылечить', apply: p => { p.hp = p.maxHp; } },
  { id: 'combo', ico: '🔥', ttl: 'Комбо+', desc: 'Комбо не сбрасывается 8с', apply: (p, g) => { g.comboShield = 8; } },
];
