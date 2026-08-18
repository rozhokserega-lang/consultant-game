/**
 * Распродажа 2.0: Uber-карты с чёрного купона босса.
 * Обычные боссы — ordinary, Промо-ведьма и Тренер — mythic.
 * В 2.0 Тренер не заканчивает забег: дальше круги боссов.
 */
'use strict';

const SALE_V2_UBER_AFTER_DARK_SEC = 15 * 60;

const SALE_V2_UBERS = {
  overclock: {
    id: 'overclock', rarity: 'normal', ico: '⚡',
    name: 'Ночная смена', desc: '−18% перезарядка всего оружия',
    stat: { cooldown: 0.18 },
  },
  loudspeaker: {
    id: 'loudspeaker', rarity: 'normal', ico: '📢',
    name: 'Громкая связь', desc: '+16% размер атак и +22% аура',
    stat: { area: 0.16, aura: 0.22 },
  },
  rush: {
    id: 'rush', rarity: 'normal', ico: '🏃',
    name: 'План эвакуации', desc: '+28% скорость героя',
    stat: { speed: 0.28 },
  },
  cashback: {
    id: 'cashback', rarity: 'normal', ico: '💳',
    name: 'Кэшбэк', desc: '+28% XP и +18% монеты',
    stat: { xp: 0.28, coins: 0.18 },
  },
  bulk: {
    id: 'bulk', rarity: 'normal', ico: '📦',
    name: 'Оптовая партия', desc: '+14% урон всего оружия',
    stat: { damage: 0.14 },
  },
  vitrine: {
    id: 'vitrine', rarity: 'normal', ico: '🧲',
    name: 'Притяжение витрины', desc: '+45% радиус сбора лута',
    stat: { magnetPct: 0.45 },
  },
  night_watch: {
    id: 'night_watch', rarity: 'normal', ico: '🛰️',
    name: 'Охранная башня', desc: '+1 орбитальный снаряд',
    stat: { orbit: 1 },
  },
  dark_card: {
    id: 'dark_card', rarity: 'normal', ico: '🖤',
    name: 'Чёрная карта', desc: '+20% шанс крита',
    stat: { crit: 0.20 },
  },
  after_dark: {
    id: 'after_dark', rarity: 'mythic', ico: '🌙',
    name: 'После закрытия',
    desc: 'После 15:00 мобы крепче, XP с убийств +40%',
    stat: { xp: 0.15 },
    effect: 'after_dark',
  },
  directors_cut: {
    id: 'directors_cut', rarity: 'mythic', ico: '🎬',
    name: 'Режиссёрская версия',
    desc: 'Снаряды пробивают врагов · +12% размер · −10% КД',
    stat: { area: 0.12, cooldown: 0.10 },
    effect: 'pierce',
  },
};

function getSaleV2Uber(id) {
  return SALE_V2_UBERS[id] || null;
}

function listSaleV2UbersByRarity(rarity) {
  return Object.values(SALE_V2_UBERS).filter((u) => u.rarity === rarity);
}
