/**
 * Режим «Распродажа» — Vampire Survivors на 20 минут.
 * Подключается после класса Game, до new Game().
 */
(function () {
  'use strict';

  const SALE_DURATION = 20 * 60; // 20 минут
  const SALE_MAX_ENEMIES = 55;
  const SALE_WORLD_MUL = 2.75;
  const SALE_MAX_WEAPONS = 6;
  const SALE_MAX_PASSIVES = 6;

  /**
   * Оружия Распродажи — вещи из ТЦ + вампирская ветка.
   * type: swing | orbit | projectile | ricochet | beam | spray | aura | charge | seek | puddle
   */
  const SALE_WEAPONS = {
    receipt: {
      id: 'receipt', name: 'Чек', ico: '🧾', max: 5,
      desc: 'Чеки крутятся вокруг и режут покупателей',
      type: 'orbit', evolve: 'endless_receipt',
      baseCd: 0.1, dmg: [1, 1, 1, 2, 2], count: [3, 4, 5, 6, 8], radius: [58, 68, 78, 90, 105],
      spin: 3.4, visual: 'receipt',
    },
    phone: {
      id: 'phone', name: 'Смартфон', ico: '📱', max: 5,
      desc: 'Кидает телефон — рикошет между врагами',
      type: 'ricochet', evolve: 'phone5g',
      baseCd: 1.05, dmg: [1, 1, 2, 2, 3], count: [1, 1, 1, 2, 2], speed: 420, bounces: [2, 3, 4, 5, 6],
      visual: 'phone', impact: 'sp_elec3',
    },
    cart: {
      id: 'cart', name: 'Тележка', ico: '🛒', max: 5,
      desc: 'Тележка летит вперёд и сбивает толпу',
      type: 'charge', evolve: 'mag_cart',
      baseCd: 1.55, dmg: [2, 2, 3, 3, 4], speed: 340, range: [220, 250, 280, 320, 380],
      visual: 'cart', impact: 'sp_quake2',
    },
    mop: {
      id: 'mop', name: 'Швабра', ico: '🧹', max: 5,
      desc: 'Швабра крутится вокруг и бьёт по кругу',
      type: 'orbit', evolve: 'cleaner',
      baseCd: 0.1, dmg: [1, 1, 2, 2, 3], count: [1, 1, 2, 2, 3], radius: [50, 58, 66, 76, 90],
      spin: 4.2, visual: 'mop', size: 1.25,
    },
    extinguisher: {
      id: 'extinguisher', name: 'Огнетушитель', ico: '🧯', max: 5,
      desc: 'Струя пены/огня перед тобой',
      type: 'spray',
      baseCd: 0.55, dmg: [1, 1, 2, 2, 3], range: [90, 100, 115, 130, 150], arc: 0.7,
      visual: 'extinguisher', impact: 'sp_fwave2',
    },
    coffee: {
      id: 'coffee', name: 'Кофе', ico: '☕', max: 5,
      desc: 'Бросок кофе + горячая лужа',
      type: 'puddle', evolve: 'caffeine',
      baseCd: 1.25, dmg: [1, 2, 2, 3, 3], speed: 300, count: [1, 1, 2, 2, 3],
      visual: 'coffee', impact: 'sp_fire2',
    },
    card: {
      id: 'card', name: 'Банковская карта', ico: '💳', max: 5,
      desc: 'Карта-бумеранг через зал',
      type: 'boomerang', evolve: 'black_card',
      baseCd: 1.2, dmg: [1, 2, 2, 3, 3], speed: 360, range: [160, 190, 220, 260, 300],
      visual: 'card',
    },
    speaker: {
      id: 'speaker', name: 'Громкоговоритель', ico: '📢', max: 5,
      desc: 'Звуковая волна вокруг',
      type: 'aura', evolve: 'ultrasound',
      baseCd: 0.85, dmg: [1, 1, 2, 2, 3], radius: [75, 90, 105, 125, 150],
      visual: 'speaker', impact: 'sp_elec2',
    },
    flashlight: {
      id: 'flashlight', name: 'Фонарик', ico: '🔦', max: 5,
      desc: 'Вращающийся луч постоянный урон',
      type: 'beam', evolve: 'hunter',
      baseCd: 0.08, dmg: [1, 1, 1, 2, 2], length: [110, 125, 140, 160, 185], width: 28,
      spin: 2.1, visual: 'flashlight',
    },
    bag: {
      id: 'bag', name: 'Пакет', ico: '🛍️', max: 5,
      desc: 'Пакет на голову — враг бежит хаотично',
      type: 'projectile',
      baseCd: 1.4, dmg: [1, 1, 1, 2, 2], speed: 280, count: [1, 1, 2, 2, 3], confuse: 1.6,
      visual: 'bag', impact: 'sp_poison2',
    },
    chair: {
      id: 'chair', name: 'Стул', ico: '🪑', max: 5,
      desc: 'Бросок стула по прямой с отскоком',
      type: 'ricochet',
      baseCd: 1.35, dmg: [2, 2, 3, 3, 4], count: [1, 1, 1, 2, 2], speed: 380, bounces: [1, 2, 2, 3, 4],
      visual: 'chair', impact: 'sp_quake1',
    },
    axe: {
      id: 'axe', name: 'Топор из хозмага', ico: '🪓', max: 5,
      desc: 'Мощный топор по дуге',
      type: 'boomerang',
      baseCd: 1.5, dmg: [2, 3, 3, 4, 5], speed: 300, range: [140, 160, 180, 210, 240],
      visual: 'axe', impact: 'sp_quake2',
    },
    magnet: {
      id: 'magnet', name: 'Магнит', ico: '🧲', max: 5,
      desc: 'Притягивает врагов и взрывается',
      type: 'charge',
      baseCd: 2.0, dmg: [2, 2, 3, 3, 4], speed: 220, range: [180, 200, 230, 260, 300],
      visual: 'magnet', size: 1.2, pull: 140, impact: 'sp_elec2',
    },
    spray_wep: {
      id: 'spray_wep', name: 'Спрей', ico: '🧴', max: 5,
      desc: 'Облако химии перед героем',
      type: 'spray',
      baseCd: 0.7, dmg: [1, 1, 2, 2, 3], range: [80, 95, 110, 125, 145], arc: 0.75,
      visual: 'spray', impact: 'sp_poison2',
    },
    box: {
      id: 'box', name: 'Коробка', ico: '📦', max: 5,
      desc: 'Коробка падает на врага и оглушает',
      type: 'projectile',
      baseCd: 1.5, dmg: [2, 2, 3, 3, 4], speed: 260, count: [1, 1, 1, 2, 2],
      visual: 'bag', impact: 'sp_quake2',
    },
    bloody_price: {
      id: 'bloody_price', name: 'Кровавый прайс', ico: '🩸', max: 5,
      desc: 'Красные листки воруют HP',
      type: 'projectile', evolve: 'black_friday',
      baseCd: 0.95, dmg: [1, 1, 2, 2, 3], speed: 360, count: [2, 2, 3, 4, 5], lifesteal: 0.15,
      visual: 'bloody_price', impact: 'sp_bleed2',
    },
    bats: {
      id: 'bats', name: 'Стая мышей', ico: '🦇', max: 5,
      desc: 'Летучие мыши сами ищут покупателей',
      type: 'seek', evolve: 'hunter',
      baseCd: 1.6, dmg: [1, 1, 2, 2, 3], count: [2, 3, 3, 4, 5], speed: 260,
      visual: 'bats', impact: 'sp_bat2',
    },
    graveyard: {
      id: 'graveyard', name: 'Кладбище отдела', ico: '🪦', max: 5,
      desc: 'На карте появляются плиты с руками',
      type: 'aura',
      baseCd: 2.2, dmg: [2, 2, 3, 3, 4], radius: [90, 100, 115, 130, 150],
      visual: 'graveyard', impact: 'sp_curse3',
    },
    bloody_aura: {
      id: 'bloody_aura', name: 'Кровавая скидка', ico: '🔴', max: 5,
      desc: 'Круг урона + вампиризм',
      type: 'aura', evolve: 'black_friday',
      baseCd: 0.4, dmg: [1, 1, 1, 2, 2], radius: [70, 82, 95, 110, 130], lifesteal: 0.2,
      visual: 'bloody_aura', impact: 'sp_curse2',
    },
    // Эволюции (не в пуле новых, только через evolve)
    endless_receipt: {
      id: 'endless_receipt', name: 'Бесконечный чек', ico: '📜', max: 1,
      desc: 'Длинная лента чеков вокруг тебя',
      type: 'orbit', evolved: true,
      baseCd: 0.08, dmg: [3], count: [12], radius: [100], spin: 5.5, visual: 'receipt', size: 1.15,
    },
    phone5g: {
      id: 'phone5g', name: 'Смартфон 5G', ico: '📱', max: 1,
      desc: 'Быстрые телефоны + молнии между врагами',
      type: 'ricochet', evolved: true,
      baseCd: 0.55, dmg: [3], count: [3], speed: 520, bounces: [8], visual: 'phone', impact: 'sp_elec3',
    },
    mag_cart: {
      id: 'mag_cart', name: 'Магнитная тележка', ico: '🛒', max: 1,
      desc: 'Огромная тележка притягивает врагов',
      type: 'charge', evolved: true,
      baseCd: 1.1, dmg: [5], speed: 300, range: [450], visual: 'cart', size: 1.6, pull: 180, impact: 'sp_quake3',
    },
    cleaner: {
      id: 'cleaner', name: 'Оружие уборщицы', ico: '🧹', max: 1,
      desc: 'Швабра + ядовитый след',
      type: 'orbit', evolved: true,
      baseCd: 0.08, dmg: [3], count: [4], radius: [95], spin: 5.0, visual: 'mop', trail: true, size: 1.3,
    },
    caffeine: {
      id: 'caffeine', name: 'КОФЕИН', ico: '⚡', max: 1,
      desc: 'Кофе в 3 стороны + ускорение',
      type: 'puddle', evolved: true,
      baseCd: 0.7, dmg: [3], speed: 380, count: [3], visual: 'coffee', impact: 'sp_bolt3', buffSpeed: 1.3,
    },
    black_card: {
      id: 'black_card', name: 'Чёрная карта', ico: '🖤', max: 1,
      desc: 'Огромная вращающаяся карта',
      type: 'orbit', evolved: true,
      baseCd: 0.1, dmg: [4], count: [1], radius: [70], spin: 6.5, visual: 'card', size: 2.2,
    },
    ultrasound: {
      id: 'ultrasound', name: 'Ультразвук', ico: '🔊', max: 1,
      desc: 'Экранная звуковая волна',
      type: 'aura', evolved: true,
      baseCd: 1.8, dmg: [4], radius: [260], visual: 'speaker', impact: 'sp_elec3', knock: 320,
    },
    hunter: {
      id: 'hunter', name: 'Охотник на покупателей', ico: '🔦', max: 1,
      desc: 'Прожектор + мыши на цель луча',
      type: 'beam', evolved: true,
      baseCd: 0.06, dmg: [2], length: [220], width: 40, spin: 2.6, visual: 'flashlight', summonBats: true,
    },
    black_friday: {
      id: 'black_friday', name: 'Чёрная пятница', ico: '💀', max: 1,
      desc: 'Убитые взрываются кровавой лужей',
      type: 'aura', evolved: true,
      baseCd: 0.3, dmg: [3], radius: [120], lifesteal: 0.35, visual: 'bloody_aura', explodeOnKill: true,
    },
  };

  const SALE_PASSIVES = {
    mug: { id: 'mug', name: 'Кофейная кружка', ico: '☕', max: 5, desc: '+1 макс HP / ур.' },
    badge: { id: 'badge', name: 'Бейдж', ico: '🪪', max: 5, desc: '+12% XP / ур.' },
    radio: { id: 'radio', name: 'Рация', ico: '📻', max: 5, desc: '+30% магнит XP / ур.' },
    key: { id: 'key', name: 'Ключ подсобки', ico: '🔑', max: 5, desc: '+8% скорости / ур.' },
    charger: { id: 'charger', name: 'Зарядка', ico: '🔌', max: 5, desc: '−8% КД оружия / ур.' },
    discount: { id: 'discount', name: 'Скидочная карта', ico: '🏷️', max: 5, desc: '+10% крит / ур.' },
    pouch: { id: 'pouch', name: 'Поясная сумка', ico: '👝', max: 5, desc: '+1 снаряд на 2 ур.' },
    shoes: { id: 'shoes', name: 'Кроссовки', ico: '👟', max: 5, desc: '+9% скорости / ур.' },
    headphones: { id: 'headphones', name: 'Наушники', ico: '🎧', max: 5, desc: '+15% урон аур / ур.' },
    gloves: { id: 'gloves', name: 'Перчатки грузчика', ico: '🧤', max: 5, desc: '+12% размер / ур.' },
    energy: { id: 'energy', name: 'Энергетик', ico: '🥤', max: 5, desc: '+10% скорость атаки / ур.' },
    map: { id: 'map', name: 'План ТЦ', ico: '🗺️', max: 5, desc: '+10% дальность / ур.' },
    money: { id: 'money', name: 'Деньги', ico: '💰', max: 5, desc: '+18% монет / ур.' },
    printer: { id: 'printer', name: 'Принтер', ico: '🖨️', max: 3, desc: 'Нужен для эволюции чека' },
    spray: { id: 'spray', name: 'Спрей', ico: '🧴', max: 3, desc: 'Нужен для эволюции швабры' },
    magnet_pass: { id: 'magnet_pass', name: 'Магнит', ico: '🧲', max: 3, desc: 'Нужен для эволюции тележки' },
  };
  // aliases for old hub saves
  SALE_PASSIVES.might = SALE_PASSIVES.discount;
  SALE_PASSIVES.haste = SALE_PASSIVES.charger;
  SALE_PASSIVES.area = SALE_PASSIVES.gloves;
  SALE_PASSIVES.speed = SALE_PASSIVES.shoes;
  SALE_PASSIVES.magnet = SALE_PASSIVES.radio;
  SALE_PASSIVES.vitality = SALE_PASSIVES.mug;
  SALE_PASSIVES.regen = { id: 'regen', name: 'Пластырь', ico: '🩹', max: 3, desc: 'Реген HP' };
  SALE_PASSIVES.wallet = SALE_PASSIVES.money;

  /** Эволюции: оружие max + пассивка → новое оружие */
  const SALE_EVOLUTIONS = [
    { from: 'receipt', needPassive: 'printer', into: 'endless_receipt', name: 'Бесконечный чек' },
    { from: 'phone', needPassive: 'charger', into: 'phone5g', name: 'Смартфон 5G' },
    { from: 'cart', needPassive: 'magnet_pass', into: 'mag_cart', name: 'Магнитная тележка' },
    { from: 'mop', needPassive: 'spray', into: 'cleaner', name: 'Оружие уборщицы' },
    { from: 'coffee', needPassive: 'energy', into: 'caffeine', name: 'КОФЕИН' },
    { from: 'card', needPassive: 'money', into: 'black_card', name: 'Чёрная карта' },
    { from: 'speaker', needPassive: 'headphones', into: 'ultrasound', name: 'Ультразвук' },
    { from: 'flashlight', needPassive: 'bats', into: 'hunter', name: 'Охотник', needWeapon: 'bats' },
    { from: 'bloody_price', needPassive: 'bloody_aura', into: 'black_friday', name: 'Чёрная пятница', needWeapon: 'bloody_aura' },
  ];

  const SALE_HUB_WEAPON_COST = {
    phone: 80, mop: 90, cart: 120, extinguisher: 110, coffee: 100,
    card: 130, speaker: 140, flashlight: 150, bag: 95,
    chair: 100, axe: 125, magnet: 135, spray_wep: 105, box: 100,
    bloody_price: 160, bats: 170, bloody_aura: 180, graveyard: 175,
  };

  const SALE_HUB_PASSIVES = [
    { id: 'mug', ico: '☕', name: 'Кружка', max: 3, cost: [40, 80, 130], desc: 'Старт с +HP' },
    { id: 'charger', ico: '🔌', name: 'Зарядка', max: 3, cost: [45, 85, 140], desc: 'Старт с меньшей КД' },
    { id: 'shoes', ico: '👟', name: 'Кроссовки', max: 3, cost: [40, 75, 120], desc: 'Старт быстрее' },
    { id: 'radio', ico: '📻', name: 'Рация', max: 3, cost: [35, 65, 110], desc: 'Старт с магнитом XP' },
    { id: 'gloves', ico: '🧤', name: 'Перчатки', max: 3, cost: [40, 75, 120], desc: 'Старт с большей зоной' },
    { id: 'money', ico: '💰', name: 'Деньги', max: 2, cost: [55, 100], desc: 'Старт с бонусом монет' },
    { id: 'printer', ico: '🖨️', name: 'Принтер', max: 1, cost: [120], desc: 'Для эволюции чека' },
    { id: 'spray', ico: '🧴', name: 'Спрей', max: 1, cost: [120], desc: 'Для эволюции швабры' },
    { id: 'magnet_pass', ico: '🧲', name: 'Магнит', max: 1, cost: [120], desc: 'Для эволюции тележки' },
    { id: 'energy', ico: '🥤', name: 'Энергетик', max: 1, cost: [130], desc: 'Для КОФЕИНа' },
  ];

  /** visual id в атласе оружия (wp_<id>1/2/3) */
  const SALE_VISUAL_ALIAS = {
    fire: 'extinguisher', sound: 'speaker', beam: 'flashlight',
    blood: 'bloody_price', blood_aura: 'bloody_aura', bat: 'bats',
  };

  function saleVisualKey(visual) {
    if (!visual) return null;
    return SALE_VISUAL_ALIAS[visual] || visual;
  }

  function drawSaleIcon(ctx, ico, x, y, scale, rot, visual, stage) {
    const v = saleVisualKey(visual);
    const st = stage || 2;
    // scale — относительный множитель к целевому размеру ~32px
    const mul = Math.max(0.45, scale || 1);
    if (v && typeof drawWeaponAtlas === 'function' && drawWeaponAtlas(ctx, v, st, x, y, {
      targetSize: 32 * mul,
      rot: rot || 0,
      anchorX: 0.5,
      anchorY: 0.5,
    })) {
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    const s = Math.max(14, Math.round(22 * mul));
    ctx.font = `${s}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, s * 0.12);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeText(ico, 0, 0);
    ctx.fillText(ico, 0, 0);
    ctx.restore();
  }

  function saleXpToNext(level) {
    return Math.floor(8 + level * 4.5 + level * level * 0.35);
  }

  function saleTimeFactor(t) {
    // 0..1 за 20 минут
    return Math.min(1, t / SALE_DURATION);
  }

  function saleSpawnInterval(t) {
    const f = saleTimeFactor(t);
    return Math.max(0.18, 1.15 - f * 0.95);
  }

  function saleEnemyType(t) {
    const f = saleTimeFactor(t);
    const r = Math.random();
    if (f > 0.85 && r < 0.04) return 'director';
    if (f > 0.55 && r < 0.08) return 'boss';
    if (f > 0.35 && r < 0.12) return 'fatty';
    if (f > 0.25 && r < 0.18) return 'tank';
    if (f > 0.15 && r < 0.28) return 'fast';
    if (f > 0.4 && r < 0.35) return 'manager';
    if (r < 0.12) return 'returner';
    return 'normal';
  }

  function saleEnemyWaveApprox(t) {
    return 1 + Math.floor(saleTimeFactor(t) * 14);
  }

  /** Минутные события ТЦ — пулы по фазам забега */
  const SALE_EVENT_POOLS = {
    early: ['queue_rush', 'happy_hour', 'xp_double', 'xp_discount', 'checkout_hall'],
    mid: ['lights_out', 'fire_dept', 'security_walls', 'complaint_book', 'evacuation', 'weapon_sale'],
    late: ['triple_boss', 'vip_day', 'director_call', 'black_friday', 'inventory', 'fire_dept'],
    brutal: ['black_friday', 'triple_boss', 'evacuation', 'director_call', 'weapon_sale', 'vip_day', 'complaint_book'],
    finale: ['mall_closing'],
  };

  function saleEventPoolForMinute(minute) {
    if (minute >= 19) return SALE_EVENT_POOLS.finale;
    if (minute >= 15) return SALE_EVENT_POOLS.brutal;
    if (minute >= 10) return SALE_EVENT_POOLS.late;
    if (minute >= 5) return SALE_EVENT_POOLS.mid;
    return SALE_EVENT_POOLS.early;
  }

  function pickSaleEventId(minute, lastId) {
    const pool = saleEventPoolForMinute(minute).slice();
    if (pool.length > 1 && lastId) {
      const filtered = pool.filter((id) => id !== lastId);
      if (filtered.length) return filtered[randi(0, filtered.length - 1)];
    }
    return pool[randi(0, pool.length - 1)];
  }

  // ─── hooks into Game ───────────────────────────────────────────

  const _resize = Game.prototype.resize;
  Game.prototype.resize = function () {
    _resize.call(this);
    if (this.gameMode === 'sale' && !this.inHub) {
      this.worldW = Math.max(2800, Math.floor(this.viewW() * SALE_WORLD_MUL));
      this.worldH = Math.max(2000, Math.floor(this.viewH() * SALE_WORLD_MUL));
    }
  };

  const _update = Game.prototype.update;
  Game.prototype.update = function (dt) {
    if (this.gameMode === 'sale') return this.updateSale(dt);
    return _update.call(this, dt);
  };

  const _updateHUD = Game.prototype.updateHUD;
  Game.prototype.updateHUD = function () {
    if (this.gameMode === 'sale') return this.updateSaleHUD();
    return _updateHUD.call(this);
  };

  const _endGame = Game.prototype.endGame;
  Game.prototype.endGame = function (won, killer) {
    if (this.gameMode === 'sale') return this.endSaleGame(won, killer);
    return _endGame.call(this, won, killer);
  };

  const _onEnemyKilled = Game.prototype.onEnemyKilled;
  Game.prototype.onEnemyKilled = function (enemy) {
    if (this.gameMode === 'sale') return this.onSaleEnemyKilled(enemy);
    return _onEnemyKilled.call(this, enemy);
  };

  const _openUpgradeUI = Game.prototype.openUpgradeUI;
  Game.prototype.openUpgradeUI = function () {
    if (this.gameMode === 'sale') return this.openSaleUpgradeUI();
    return _openUpgradeUI.call(this);
  };

  const _pickUpgrade = Game.prototype.pickUpgrade;
  Game.prototype.pickUpgrade = function (i) {
    if (this.gameMode === 'sale') return this.pickSaleUpgrade(i);
    return _pickUpgrade.call(this, i);
  };

  const _resetGame = Game.prototype.resetGame;
  Game.prototype.resetGame = function () {
    if (this.gameMode === 'sale') return this.resetSaleGame();
    return _resetGame.call(this);
  };

  const _explodeAt = Game.prototype.explodeAt;
  Game.prototype.explodeAt = function (x, y) {
    if (this.gameMode !== 'sale') return _explodeAt.call(this, x, y);
    const R = typeof FATTY_EXPLODE_RADIUS !== 'undefined' ? FATTY_EXPLODE_RADIUS : 90;
    this.spawnParticles(x, y, 45, '#ff6b00', 420, 0.9);
    this.spawnParticles(x, y, 25, '#fff200', 280, 0.6);
    this.spawnParticles(x, y, 18, '#e74c3c', 200, 0.5);
    this.screenShake = Math.max(this.screenShake, 0.35);
    sfx.hurt();
    this.vibrate([40, 30, 60]);
    this.boomFx = this.boomFx || [];
    this.boomFx.push({ x, y, life: 0.45, max: 0.45 });

    if (this.player.invincible <= 0 && this.player.lunchTimer <= 0) {
      if (dist(x, y, this.player.x, this.player.y) < R + this.player.r) {
        if (this.player.takeDamage(x, y)) {
          this.tookDamage = true;
          this.endSaleGame(false, 'Взрыв жирного покупателя 💣');
          return true;
        }
        this.tookDamage = true;
        if (this.applySaleFragileExtra && this.applySaleFragileExtra()) return true;
      }
    }

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.type === 'boss' || e.type === 'director') continue;
      if (dist(x, y, e.x, e.y) < R + e.r) {
        const died = e.hit(2, x, y);
        this.spawnParticles(e.x, e.y, 8, '#ffaa00', 160, 0.35);
        if (died) {
          if (e.type === 'fatty' || e.explodes) this.armFattyFuse(e);
          this.onSaleEnemyKilled(e);
        }
      }
    }
    return false;
  };

  // ─── Sale mode implementation ──────────────────────────────────

  Game.prototype.resetSaleGame = function () {
    this.hideOverlays();
    this.worldW = Math.max(2800, Math.floor(this.viewW() * SALE_WORLD_MUL));
    this.worldH = Math.max(2000, Math.floor(this.viewH() * SALE_WORLD_MUL));

    if (this.selectedChallenge === 'hammer_only') {
      this.weaponId = 'hammer';
      this.hammerId = 'hammer';
    }
    const weapon = this.getWeapon();
    this.player = new Player(this.worldW / 2, this.worldH / 2, weapon);
    this.player.equippedWeaponId = this.weaponId;
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
    this.pickups = [];
    this.boomFx = [];
    this.bossLines = [];
    this.fuseBombs = [];
    this.playerProjectiles = [];
    this.saleOrbits = [];
    this.saleBoomerangs = [];
    this.xpGems = [];
    this.spriteFx = [];

    this.score = 0;
    this.coins = 5 + (this.metaPerks.wallet || 0) * 4;
    this.coinMult = this.selectedChallenge === 'x2' ? 2 : 1;
    this.screenShake = 0;
    this.modeTimer = 0;
    this.isChaseMode = true;
    this.modeFlash = 0;
    this.wavePhase = 'sale';
    this.wave = 1;
    this.waveKills = 0;
    this.waveSpawned = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboShield = 0;
    this.pendingUpgrades = 0;
    this.upgradeChoices = [];
    this.upgradeRerollsLeft = 3;
    this.choosingUpgrade = false;
    this.shopping = false;
    this.paused = false;
    this.gameOver = false;
    this.won = false;
    this.killedBy = '';
    this.directorSpawned = false;
    this.lightsOut = 0;
    this.fireAlarm = 0;
    this.eventCooldown = 9999;
    this._eventBanner = null;
    this.challengeFailed = false;
    this.tookDamage = false;

    // минутные события
    this.saleEventMinute = 0;
    this.saleLastEventId = null;
    this.saleActiveEvent = null;
    this.saleMobSpeedMul = 1;
    this.saleSpawnMul = 1;
    this.saleXpEventMul = 1;
    this.saleWeaponDmgMul = 1;
    this.saleFragile = false;
    this.saleForceTypes = null;
    this.saleInvulnExcept = null;
    this.saleEvacMode = null;
    this.saleEventAcc = 0;
    this.saleTempWalls = [];
    this.saleVipRef = null;

    // Sale state
    this.saleTime = 0;
    this.saleSpawnAcc = 0;
    this.saleLevel = 1;
    this.saleXp = 0;
    this.saleXpNext = saleXpToNext(1);
    this.salePassives = {};
    // стартовые пассивки из хаба
    const startP = this.saleStartPassives || {};
    for (const [id, lv] of Object.entries(startP)) {
      const n = Math.max(0, lv | 0);
      if (n > 0) this.salePassives[id] = n;
    }
    this.saleWeapons = { receipt: 1 };
    const unlocked = this.saleUnlockedWeapons || ['receipt'];
    for (const id of unlocked) {
      if (SALE_WEAPONS[id] && !SALE_WEAPONS[id].evolved) {
        this.saleWeapons[id] = Math.max(this.saleWeapons[id] || 0, 1);
      }
    }
    // миграция старых сейвов
    if (this.saleWeapons.hammer) { delete this.saleWeapons.hammer; this.saleWeapons.receipt = this.saleWeapons.receipt || 1; }
    if (this.saleWeapons.tags) { this.saleWeapons.receipt = Math.max(this.saleWeapons.receipt || 0, this.saleWeapons.tags); delete this.saleWeapons.tags; }
    if (this.saleWeapons.scanner) { this.saleWeapons.phone = Math.max(this.saleWeapons.phone || 0, this.saleWeapons.scanner); delete this.saleWeapons.scanner; }

    this.saleWeaponCd = {};
    this.saleRegenTimer = 0;
    this.saleOrbits = [];
    this.saleProjectiles = [];
    this.saleBeams = [];
    this.salePuddles = [];
    this.saleCharges = [];
    this.saleSeekers = [];
    Object.keys(SALE_WEAPONS).forEach((id) => { this.saleWeaponCd[id] = 0.25; });

    this.applyMetaToPlayer();
    this.applySalePassivesToPlayer();
    // стартовая vitality из хаба
    const vit = this.salePassives.vitality || 0;
    if (vit > 0) {
      this.player.maxHp += vit;
      this.player.hp = this.player.maxHp;
    }
    this.generateObstacles();
    this.generateStorefronts();
    this.generateWallDecor();
    this.generateZones();
    this.camera.x = this.player.x - this.viewW() / 2;
    this.camera.y = this.player.y - this.viewH() / 2;

    // стартовый наплыв
    for (let i = 0; i < 12; i++) this.spawnSaleEnemy();

    this.refreshMusicState();
    sfx.click();
  };

  Game.prototype.applySalePassivesToPlayer = function () {
    const p = this.player;
    if (!p) return;
    const spd = (this.salePassives.speed || 0) + (this.salePassives.shoes || 0) + (this.salePassives.key || 0);
    const caff = this.saleWeapons.caffeine ? 0.25 : 0;
    p._saleSpeedMul = 1 + spd * 0.08 + caff;
  };

  Game.prototype.saleDmgMul = function () {
    return (1 + (this.salePassives.might || 0) * 0.12 + (this.salePassives.discount || 0) * 0.1)
      * (this.saleWeaponDmgMul || 1);
  };
  Game.prototype.saleCdMul = function () {
    const haste = (this.salePassives.haste || 0) + (this.salePassives.charger || 0) + (this.salePassives.energy || 0);
    return Math.max(0.4, 1 - haste * 0.08);
  };
  Game.prototype.saleAreaMul = function () {
    return 1 + ((this.salePassives.area || 0) + (this.salePassives.gloves || 0) + (this.salePassives.map || 0)) * 0.1;
  };
  Game.prototype.saleMagnetRange = function () {
    const mag = (this.salePassives.magnet || 0) + (this.salePassives.radio || 0);
    return 70 + mag * 36 + (this.metaPerks.magnet || 0) * 20;
  };
  Game.prototype.saleXpMul = function () {
    return 1 + (this.salePassives.badge || 0) * 0.12;
  };
  Game.prototype.saleAuraDmgMul = function () {
    return 1 + (this.salePassives.headphones || 0) * 0.15;
  };
  Game.prototype.saleProjectileBonus = function () {
    return Math.floor(((this.salePassives.pouch || 0) + 1) / 2);
  };

  Game.prototype.spawnSaleEnemy = function (forcedType) {
    if (this.enemies.filter((e) => e.hp > 0).length >= SALE_MAX_ENEMIES) return null;
    const margin = 80;
    const side = randi(0, 3);
    let x, y;
    // спавн за краем камеры / у границ мира
    const cam = this.camera;
    const vw = this.viewW();
    const vh = this.viewH();
    if (side === 0) { x = rand(cam.x - 40, cam.x + vw + 40); y = cam.y - margin; }
    else if (side === 1) { x = cam.x + vw + margin; y = rand(cam.y - 40, cam.y + vh + 40); }
    else if (side === 2) { x = rand(cam.x - 40, cam.x + vw + 40); y = cam.y + vh + margin; }
    else { x = cam.x - margin; y = rand(cam.y - 40, cam.y + vh + 40); }
    x = Math.max(margin, Math.min(this.worldW - margin, x));
    y = Math.max(margin, Math.min(this.worldH - margin, y));

    let type = forcedType || saleEnemyType(this.saleTime);
    if (!forcedType && this.saleForceTypes && this.saleForceTypes.length) {
      type = this.saleForceTypes[randi(0, this.saleForceTypes.length - 1)];
    }
    const wave = saleEnemyWaveApprox(this.saleTime);
    const e = new Enemy(x, y, type, wave);
    // в распродаже все агрессивны
    this.enemies.push(e);
    return e;
  };

  Game.prototype.spawnSaleEnemyNear = function (x, y, type, opts) {
    opts = opts || {};
    if (this.enemies.filter((e) => e.hp > 0).length >= SALE_MAX_ENEMIES + (opts.overCap || 0)) return null;
    const wave = saleEnemyWaveApprox(this.saleTime);
    const e = new Enemy(x, y, type || 'normal', wave);
    if (opts.nameTag) e.nameTag = opts.nameTag;
    if (opts.hp) { e.hp = e.maxHp = opts.hp; }
    if (opts.hpMul) { e.maxHp = Math.max(1, Math.round(e.maxHp * opts.hpMul)); e.hp = e.maxHp; }
    if (opts.xpReward) e.xpReward = opts.xpReward;
    if (opts.vip) e._saleVip = true;
    this.enemies.push(e);
    return e;
  };

  Game.prototype.dropSaleXp = function (enemy) {
    let amount = enemy.xpReward || 1;
    if (enemy.type === 'boss' || enemy.type === 'director') amount = Math.max(amount, 8);
    if (enemy.type === 'fatty') amount = Math.max(amount, 4);
    const n = amount <= 2 ? 1 : amount <= 5 ? 2 : 3;
    const per = Math.ceil(amount / n);
    for (let i = 0; i < n; i++) {
      this.xpGems.push({
        x: enemy.x + rand(-18, 18),
        y: enemy.y + rand(-18, 18),
        value: per,
        r: 7 + Math.min(6, per),
        life: 25,
        vx: rand(-40, 40),
        vy: rand(-40, 40),
      });
    }
  };

  Game.prototype.onSaleEnemyKilled = function (enemy) {
    this.recordKill(enemy.type);
    this.score++;
    this.waveKills++;
    this.dropSaleXp(enemy);
    this.spawnSpriteFx(Math.random() < 0.55 ? 'fx_blood' : 'fx_hit_blood', enemy.x, enemy.y, {
      scale: enemy.type === 'fatty' ? 0.85 : 0.55,
      scaleEnd: enemy.type === 'fatty' ? 1.2 : 0.9,
      life: 0.3,
      vy: -12,
    });
    if (enemy.type === 'fatty' || enemy.explodes) {
      this.spawnSpriteFx('fx_skull', enemy.x, enemy.y - 8, { scale: 0.75, life: 0.4, vy: -35 });
    }
    // монеты реже
    if (Math.random() < 0.22) this.dropCoins(enemy);
  };

  Game.prototype.gainSaleXp = function (amount) {
    const mul = (this.saleXpMul() || 1) * (this.saleXpEventMul || 1);
    this.saleXp += Math.max(0, amount * mul);
    let leveled = 0;
    while (this.saleXp >= this.saleXpNext) {
      this.saleXp -= this.saleXpNext;
      this.saleLevel++;
      this.saleXpNext = saleXpToNext(this.saleLevel);
      leveled++;
      this.player.fillSkill(0.15);
    }
    if (leveled) {
      this.pendingUpgrades += leveled;
      this.openSaleUpgradeUI();
      sfx.level();
      this.spawnSpriteFx('fx_levelup', this.player.x, this.player.y - 50, {
        scale: 0.7, scaleEnd: 1.0, life: 0.85, vy: -55, anchorY: 0.5,
      });
      this.spawnSpriteFx('fx_aura_gold', this.player.x, this.player.y, {
        scale: 0.45, scaleEnd: 0.7, life: 0.55, vy: -10,
      });
      this.spawnParticles(this.player.x, this.player.y, 22, '#f1c40f', 200, 0.55);
    }
  };

  Game.prototype.buildSaleUpgradeChoices = function () {
    const pool = [];
    const ownedW = Object.keys(this.saleWeapons).filter((id) => (this.saleWeapons[id] || 0) > 0 && !SALE_WEAPONS[id]?.evolved);
    const ownedP = Object.keys(this.salePassives).filter((id) => (this.salePassives[id] || 0) > 0);
    const canNewWeapon = ownedW.length < SALE_MAX_WEAPONS;

    for (const def of Object.values(SALE_WEAPONS)) {
      if (def.evolved) continue;
      const lv = this.saleWeapons[def.id] || 0;
      if (lv <= 0) {
        if (canNewWeapon) pool.push({ kind: 'weapon_new', id: def.id, ico: def.ico, ttl: def.name, desc: def.desc });
      } else if (lv < def.max) {
        pool.push({
          kind: 'weapon_up', id: def.id, ico: def.ico,
          ttl: `${def.name} ур.${lv + 1}`, desc: `Улучшить до ${lv + 1}/${def.max}`,
        });
      }
    }
    const canNewPassive = ownedP.length < SALE_MAX_PASSIVES;
    const seenPassive = new Set();
    for (const def of Object.values(SALE_PASSIVES)) {
      if (seenPassive.has(def.id)) continue;
      seenPassive.add(def.id);
      const lv = this.salePassives[def.id] || 0;
      if (lv <= 0 && !canNewPassive) continue;
      if (lv < def.max) {
        pool.push({
          kind: 'passive', id: def.id, ico: def.ico,
          ttl: `${def.name} ур.${lv + 1}`, desc: def.desc,
        });
      }
    }
    // эволюции
    for (const ev of SALE_EVOLUTIONS) {
      const haveFrom = (this.saleWeapons[ev.from] || 0) >= (SALE_WEAPONS[ev.from]?.max || 5);
      if (!haveFrom) continue;
      if (this.saleWeapons[ev.into]) continue;
      let ok = true;
      if (ev.needPassive && !(this.salePassives[ev.needPassive] > 0)) ok = false;
      if (ev.needWeapon && !(this.saleWeapons[ev.needWeapon] > 0)) ok = false;
      if (ok) {
        const into = SALE_WEAPONS[ev.into];
        pool.unshift({
          kind: 'evolve', id: ev.into, from: ev.from, ico: into.ico,
          ttl: `✨ ${ev.name}`, desc: into.desc,
        });
      }
    }
    if (this.player.hp < this.player.maxHp) {
      pool.push({ kind: 'heal', id: 'heal', ico: '❤️', ttl: 'Аптечка', desc: '+2 HP сейчас' });
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = randi(0, i);
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    const ownedCount = ownedW.length;
    if (ownedCount < 4) {
      const news = pool.filter((c) => c.kind === 'weapon_new' || c.kind === 'evolve');
      const rest = pool.filter((c) => c.kind !== 'weapon_new' && c.kind !== 'evolve');
      return [...news.slice(0, 2), ...rest].slice(0, 3);
    }
    return pool.slice(0, 3);
  };

  Game.prototype.openSaleUpgradeUI = function () {
    this.choosingUpgrade = true;
    this.paused = true;
    if (this.upgradeRerollsLeft == null) this.upgradeRerollsLeft = 3;
    this.upgradeChoices = this.buildSaleUpgradeChoices();
    if (!this.upgradeChoices.length) {
      this.choosingUpgrade = false;
      this.pendingUpgrades = 0;
      this.paused = false;
      this.updateUpgradeRerollBtn();
      return;
    }
    const wrap = document.getElementById('upgrade-cards');
    wrap.innerHTML = '';
    const title = document.querySelector('#upgrade-overlay h2');
    const sub = document.getElementById('upgrade-sub') || document.querySelector('#upgrade-overlay p');
    if (title) title.textContent = `⬆ Уровень ${this.saleLevel}!`;
    if (sub) sub.textContent = 'Оружие / пассивка / эволюция · можно перебросить выбор';
    this.upgradeChoices.forEach((up, i) => {
      const el = document.createElement('button');
      el.className = 'card';
      el.type = 'button';
      el.innerHTML = `<div class="ico">${up.ico}</div><div class="ttl">${i + 1}. ${up.ttl}</div><div class="desc">${up.desc}</div>`;
      el.onclick = () => this.pickSaleUpgrade(i);
      wrap.appendChild(el);
    });
    document.getElementById('upgrade-overlay').classList.add('show');
    this.updateUpgradeRerollBtn();
    this.refreshMusicState();
    if (!this._saleRerolling) sfx.level();
  };

  Game.prototype.pickSaleUpgrade = function (i) {
    const up = this.upgradeChoices[i];
    if (!up) return;
    if (up.kind === 'weapon_new') {
      this.saleWeapons[up.id] = 1;
      this.saleWeaponCd[up.id] = 0.15;
    } else if (up.kind === 'weapon_up') {
      this.saleWeapons[up.id] = (this.saleWeapons[up.id] || 1) + 1;
    } else if (up.kind === 'evolve') {
      delete this.saleWeapons[up.from];
      this.saleWeapons[up.id] = 1;
      this.saleWeaponCd[up.id] = 0.1;
      this.spawnSpriteFx('fx_levelup', this.player.x, this.player.y - 40, { scale: 1.8, life: 0.7, vy: -40 });
      this.spawnParticles(this.player.x, this.player.y, 28, '#f1c40f', 240, 0.6);
      this.applySalePassivesToPlayer();
    } else if (up.kind === 'passive') {
      this.salePassives[up.id] = (this.salePassives[up.id] || 0) + 1;
      if (up.id === 'vitality' || up.id === 'mug') {
        this.player.maxHp += 1;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      }
      this.applySalePassivesToPlayer();
    } else if (up.kind === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
      this.spawnSpriteFx('fx_medkit', this.player.x, this.player.y - 20, { scale: 0.9, life: 0.45, vy: -30 });
      if (typeof drawSpell === 'function') {
        this.spawnSpriteFx('sp_heal2', this.player.x, this.player.y, { scale: 0.55, life: 0.4, vy: -10 });
      }
    }
    sfx.click();
    document.getElementById('upgrade-overlay').classList.remove('show');
    this.choosingUpgrade = false;
    this.updateUpgradeRerollBtn();
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
    if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
    else {
      this.paused = false;
      this.refreshMusicState();
    }
  };

  Game.prototype.saleHitEnemy = function (e, dmg, srcX, srcY, knock, opts) {
    opts = opts || {};
    if (e._saleInvuln && this.saleInvulnExcept && e.type !== this.saleInvulnExcept) {
      this.spawnSpriteFx('fx_shield', e.x, e.y - 6, { scale: 0.35, life: 0.12, vy: -6 });
      return false;
    }
    const died = e.hit(dmg, srcX, srcY, knock || 140, opts.stun || 0);
    if (opts.confuse && !died) {
      e._saleConfuse = Math.max(e._saleConfuse || 0, opts.confuse);
    }
    if (opts.lifesteal && this.player.hp < this.player.maxHp) {
      if (Math.random() < opts.lifesteal) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.spawnSpriteFx('sp_heal1', this.player.x, this.player.y - 18, { scale: 0.7, life: 0.25, vy: -25 });
      }
    }
    if (died) {
      this.spawnParticles(e.x, e.y, 8, opts.color || '#e74c3c', 140, 0.35);
      if (opts.impact) this.spawnSpriteFx(opts.impact, e.x, e.y, { scale: 0.35, life: 0.28, vy: -8 });
      this.onSaleEnemyKilled(e);
      if (opts.explodeOnKill || this.saleWeapons.black_friday) {
        this.salePuddles.push({ x: e.x, y: e.y, r: 55, life: 2.5, dmg: 1, tick: 0, color: '#8e0000' });
        this.spawnSpriteFx('sp_bleed3', e.x, e.y, { scale: 0.4, life: 0.35, vy: 0 });
      }
    } else if (Math.random() < 0.35) {
      this.spawnSpriteFx(opts.spark || 'fx_hit_spark', e.x, e.y, { scale: 0.35, life: 0.14, vy: -4 });
    }
    return died;
  };

  Game.prototype.nearestSaleEnemy = function (x, y, maxDist) {
    let best = null; let bd = maxDist || 1e9;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };

  Game.prototype.updateSaleWeapons = function (dt) {
    const p = this.player;
    const area = this.saleAreaMul();
    const dmgM = this.saleDmgMul();
    const cdM = this.saleCdMul();
    const projBonus = this.saleProjectileBonus();

    for (const [id, lv] of Object.entries(this.saleWeapons)) {
      const def = SALE_WEAPONS[id];
      if (!def) continue;
      const level = Math.min(def.max, Math.max(1, lv)) - 1;
      this.saleWeaponCd[id] = (this.saleWeaponCd[id] || 0) - dt;
      if (this.saleWeaponCd[id] > 0) continue;

      let dmg = Math.max(1, Math.round((def.dmg[level] || def.dmg[0] || 1) * dmgM));
      if (def.type === 'aura') dmg = Math.max(1, Math.round(dmg * this.saleAuraDmgMul()));

      if (def.type === 'orbit') {
        const need = (def.count[level] || def.count[0] || 1);
        const radius = (def.radius[level] || def.radius[0] || 60) * area;
        const spin = def.spin || 3;
        let list = this.saleOrbits.filter((o) => o.weaponId === id);
        while (list.length < need) {
          const o = {
            weaponId: id, ico: def.ico, visual: def.visual || id, angle: (Math.PI * 2 * list.length) / need,
            radius, dmg, spin, size: def.size || 1, trail: !!def.trail, hitAt: new Map(),
          };
          this.saleOrbits.push(o);
          list.push(o);
        }
        while (list.length > need) {
          const drop = list.pop();
          this.saleOrbits = this.saleOrbits.filter((o) => o !== drop);
        }
        for (const o of this.saleOrbits) {
          if (o.weaponId !== id) continue;
          o.radius = radius; o.dmg = dmg; o.spin = spin; o.ico = def.ico; o.size = def.size || 1;
          o.visual = def.visual || id;
        }
        this.saleWeaponCd[id] = 0.15;
        continue;
      }

      this.saleWeaponCd[id] = def.baseCd * cdM;

      if (def.type === 'beam') {
        const len = (def.length[level] || def.length[0] || 120) * area;
        this.saleBeams = this.saleBeams.filter((b) => b.weaponId !== id);
        this.saleBeams.push({
          weaponId: id, angle: this._saleBeamAng || 0, length: len,
          width: (def.width || 28) * area, dmg, spin: def.spin || 2, summonBats: !!def.summonBats,
          tick: 0,
        });
        continue;
      }

      if (def.type === 'aura') {
        const radius = (def.radius[level] || def.radius[0] || 80) * area;
        this._saleAura = { r: radius, t: 0.22, ico: def.ico, visual: def.visual, blood: def.visual === 'bloody_aura' };
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (dist(p.x, p.y, e.x, e.y) < radius + e.r) {
            this.saleHitEnemy(e, dmg, p.x, p.y, def.knock || 90, {
              lifesteal: def.lifesteal, impact: def.impact, explodeOnKill: def.explodeOnKill, color: '#c0392b',
            });
          }
        }
        if (def.visual === 'bloody_aura' && typeof drawWeaponAtlas === 'function') {
          // стадия 3 ауры — рисуется в overlays через _saleAura
        } else if (def.impact) this.spawnSpriteFx(def.impact, p.x, p.y, { scale: Math.min(0.45, radius / 220), life: 0.2, vy: 0 });
        continue;
      }

      if (def.type === 'spray') {
        const range = (def.range[level] || 100) * area;
        const ang = p.angle;
        const half = def.arc || 0.65;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const d = dist(p.x, p.y, e.x, e.y);
          if (d > range + e.r) continue;
          let diff = angleTo(p.x, p.y, e.x, e.y) - ang;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < half) {
            this.saleHitEnemy(e, dmg, p.x, p.y, 160, { impact: def.impact || 'sp_fwave1', color: '#e67e22' });
          }
        }
        this.spawnSpriteFx(def.impact || 'sp_fwave2', p.x + Math.cos(ang) * 40, p.y + Math.sin(ang) * 40, {
          scale: 0.4 * Math.min(1.2, area), life: 0.22, rot: ang, vy: 0,
        });
        continue;
      }

      if (def.type === 'charge') {
        const ang = p.angle;
        const nearest = this.nearestSaleEnemy(p.x, p.y, 400);
        const a = nearest ? angleTo(p.x, p.y, nearest.x, nearest.y) : ang;
        this.saleCharges.push({
          x: p.x, y: p.y, angle: a, speed: def.speed || 320,
          life: ((def.range && def.range[level]) || def.range?.[0] || 260) / (def.speed || 320),
          dmg, ico: def.ico, visual: def.visual || id, size: def.size || 1.2, pull: def.pull || 0, hit: new Set(), impact: def.impact,
        });
        continue;
      }

      if (def.type === 'boomerang') {
        const range = (def.range?.[level] || def.range?.[0] || 200) * area;
        const nearest = this.nearestSaleEnemy(p.x, p.y, 500);
        const a = nearest ? angleTo(p.x, p.y, nearest.x, nearest.y) : p.angle;
        this.saleBoomerangs.push({
          x: p.x, y: p.y, angle: a, speed: def.speed || 340,
          range, traveled: 0, returning: false, dmg, ico: def.ico, visual: def.visual || id, hit: new Set(), size: 1.1,
        });
        continue;
      }

      if (def.type === 'seek') {
        const count = (def.count[level] || 2) + projBonus;
        for (let i = 0; i < count; i++) {
          const ang = rand(0, Math.PI * 2);
          this.saleSeekers.push({
            x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20,
            vx: Math.cos(ang) * 80, vy: Math.sin(ang) * 80,
            speed: def.speed || 260, life: 3.5, dmg, ico: '🦇', visual: 'bats', target: null, hit: new Set(),
          });
        }
        this.spawnSpriteFx('sp_bat1', p.x, p.y - 10, { scale: 0.8, life: 0.25, vy: -20 });
        continue;
      }

      if (def.type === 'puddle' || def.type === 'projectile' || def.type === 'ricochet') {
        let count = (def.count?.[level] || def.count?.[0] || 1) + projBonus;
        if (def.id === 'caffeine') count = 3;
        const targets = this.enemies.filter((e) => e.hp > 0)
          .map((e) => ({ e, d: dist(p.x, p.y, e.x, e.y) }))
          .sort((a, b) => a.d - b.d);
        for (let i = 0; i < count; i++) {
          let ang = p.angle + (count > 1 ? (i - (count - 1) / 2) * 0.35 : 0);
          if (targets[i]) ang = angleTo(p.x, p.y, targets[i].e.x, targets[i].e.y);
          else if (targets[0]) ang = angleTo(p.x, p.y, targets[0].e.x, targets[0].e.y) + (i - 1) * 0.4;
          this.saleProjectiles.push({
            x: p.x, y: p.y, angle: ang,
            speed: def.speed || 340,
            life: def.type === 'ricochet' ? 2.2 : 1.5,
            r: 12, dmg, ico: def.ico, visual: def.visual || id,
            bounces: def.type === 'ricochet' ? (def.bounces?.[level] || 3) : 0,
            puddle: def.type === 'puddle',
            confuse: def.confuse || 0,
            lifesteal: def.lifesteal || 0,
            impact: def.impact,
            hit: new Set(),
            born: performance.now(),
          });
        }
      }
    }
  };

  Game.prototype.updateSaleOrbits = function (dt) {
    const p = this.player;
    const now = performance.now();
    for (const o of this.saleOrbits) {
      o.angle += dt * (o.spin || 3);
      o.x = p.x + Math.cos(o.angle) * o.radius;
      o.y = p.y + Math.sin(o.angle) * o.radius;
      if (o.trail && Math.random() < 0.2) {
        this.salePuddles.push({ x: o.x, y: o.y, r: 22, life: 1.2, dmg: 1, tick: 0, color: '#27ae60', poison: true });
      }
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if ((o.hitAt.get(e) || 0) > now) continue;
        if (dist(o.x, o.y, e.x, e.y) < e.r + 22 * (o.size || 1)) {
          o.hitAt.set(e, now + 280);
          this.saleHitEnemy(e, o.dmg, p.x, p.y, 130, { color: '#f39c12', spark: 'fx_slash' });
        }
      }
    }
    this.saleOrbits = this.saleOrbits.filter((o) => this.saleWeapons[o.weaponId]);
  };

  Game.prototype.updateSaleBoomerangs = function (dt) {
    const p = this.player;
    for (const b of this.saleBoomerangs) {
      if (!b.returning) {
        b.x += Math.cos(b.angle) * b.speed * dt;
        b.y += Math.sin(b.angle) * b.speed * dt;
        b.traveled += b.speed * dt;
        if (b.traveled >= b.range) b.returning = true;
      } else {
        const a = angleTo(b.x, b.y, p.x, p.y);
        b.angle = a;
        b.x += Math.cos(a) * b.speed * 1.2 * dt;
        b.y += Math.sin(a) * b.speed * 1.2 * dt;
        if (dist(b.x, b.y, p.x, p.y) < 22) b.dead = true;
      }
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hit.has(e)) continue;
        if (dist(b.x, b.y, e.x, e.y) < e.r + 14) {
          b.hit.add(e);
          this.saleHitEnemy(e, b.dmg, b.x, b.y, 200, { color: '#1abc9c' });
        }
      }
    }
    this.saleBoomerangs = this.saleBoomerangs.filter((b) => !b.dead);
  };

  Game.prototype.updateSaleProjectiles = function (dt) {
    for (const pr of this.saleProjectiles) {
      pr.x += Math.cos(pr.angle) * pr.speed * dt;
      pr.y += Math.sin(pr.angle) * pr.speed * dt;
      pr.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0 || pr.hit.has(e)) continue;
        if (dist(pr.x, pr.y, e.x, e.y) < e.r + pr.r) {
          pr.hit.add(e);
          this.saleHitEnemy(e, pr.dmg, pr.x, pr.y, 160, {
            confuse: pr.confuse, lifesteal: pr.lifesteal, impact: pr.impact, color: '#f1c40f',
          });
          if (pr.impact) this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.45, life: 0.2, vy: 0 });
          if (pr.puddle) {
            this.salePuddles.push({ x: e.x, y: e.y, r: 40, life: 2.8, dmg: 1, tick: 0, color: '#d35400', slow: 0.55 });
            pr.life = 0;
          } else if (pr.bounces > 0) {
            pr.bounces--;
            const next = this.nearestSaleEnemy(pr.x, pr.y, 280);
            if (next && next !== e) pr.angle = angleTo(pr.x, pr.y, next.x, next.y);
            else pr.life = 0;
            if (pr.impact) this.spawnSpriteFx(pr.impact, pr.x, pr.y, { scale: 0.4, life: 0.18, vy: 0 });
          } else {
            pr.life = 0;
          }
          break;
        }
      }
      if (pr.x < -40 || pr.y < -40 || pr.x > this.worldW + 40 || pr.y > this.worldH + 40) pr.life = 0;
    }
    this.saleProjectiles = this.saleProjectiles.filter((pr) => pr.life > 0);
  };

  Game.prototype.updateSaleCharges = function (dt) {
    for (const c of this.saleCharges) {
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      c.life -= dt;
      if (c.pull) {
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const d = dist(c.x, c.y, e.x, e.y);
          if (d < c.pull && d > 1) {
            const a = angleTo(e.x, e.y, c.x, c.y);
            e.x += Math.cos(a) * 120 * dt;
            e.y += Math.sin(a) * 120 * dt;
          }
        }
      }
      for (const e of this.enemies) {
        if (e.hp <= 0 || c.hit.has(e)) continue;
        if (dist(c.x, c.y, e.x, e.y) < e.r + 18 * (c.size || 1)) {
          c.hit.add(e);
          this.saleHitEnemy(e, c.dmg, c.x, c.y, 260, { impact: c.impact, color: '#16a085' });
        }
      }
    }
    this.saleCharges = this.saleCharges.filter((c) => c.life > 0);
  };

  Game.prototype.updateSaleSeekers = function (dt) {
    for (const s of this.saleSeekers) {
      if (!s.target || s.target.hp <= 0) s.target = this.nearestSaleEnemy(s.x, s.y, 420);
      if (s.target) {
        const a = angleTo(s.x, s.y, s.target.x, s.target.y);
        s.vx += Math.cos(a) * 420 * dt;
        s.vy += Math.sin(a) * 420 * dt;
      }
      const sp = Math.hypot(s.vx, s.vy) || 1;
      const maxSp = s.speed;
      if (sp > maxSp) { s.vx = s.vx / sp * maxSp; s.vy = s.vy / sp * maxSp; }
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= dt;
      s.angle = Math.atan2(s.vy, s.vx);
      for (const e of this.enemies) {
        if (e.hp <= 0 || s.hit.has(e)) continue;
        if (dist(s.x, s.y, e.x, e.y) < e.r + 12) {
          s.hit.add(e);
          this.saleHitEnemy(e, s.dmg, s.x, s.y, 100, { impact: 'sp_bat2', color: '#2c3e50' });
          s.life -= 0.8;
        }
      }
    }
    this.saleSeekers = this.saleSeekers.filter((s) => s.life > 0);
  };

  Game.prototype.updateSaleBeams = function (dt) {
    this._saleBeamAng = (this._saleBeamAng || 0);
    for (const b of this.saleBeams) {
      if (!this.saleWeapons[b.weaponId]) { b.dead = true; continue; }
      b.angle += dt * (b.spin || 2);
      this._saleBeamAng = b.angle;
      b.tick += dt;
      const x2 = this.player.x + Math.cos(b.angle) * b.length;
      const y2 = this.player.y + Math.sin(b.angle) * b.length;
      b.x2 = x2; b.y2 = y2;
      if (b.tick < 0.08) continue;
      b.tick = 0;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        // расстояние до отрезка луча
        const ax = this.player.x, ay = this.player.y;
        const bx = x2 - ax, by = y2 - ay;
        const t = Math.max(0, Math.min(1, ((e.x - ax) * bx + (e.y - ay) * by) / (bx * bx + by * by || 1)));
        const px = ax + bx * t, py = ay + by * t;
        if (dist(px, py, e.x, e.y) < e.r + b.width * 0.35) {
          this.saleHitEnemy(e, b.dmg, px, py, 60, { color: '#f1c40f', spark: 'sp_fire1' });
          if (b.summonBats && Math.random() < 0.12) {
            this.saleSeekers.push({
              x: this.player.x, y: this.player.y, vx: 0, vy: 0,
              speed: 280, life: 2.2, dmg: b.dmg, ico: '🦇', target: e, hit: new Set(),
            });
          }
        }
      }
    }
    this.saleBeams = this.saleBeams.filter((b) => !b.dead && this.saleWeapons[b.weaponId]);
  };

  Game.prototype.updateSalePuddles = function (dt) {
    for (const u of this.salePuddles) {
      u.life -= dt;
      u.tick += dt;
      if (u.tick >= 0.35) {
        u.tick = 0;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (dist(u.x, u.y, e.x, e.y) < u.r + e.r) {
            this.saleHitEnemy(e, u.dmg, u.x, u.y, 40, { color: u.color });
            if (u.slow) e.slowTimer = Math.max(e.slowTimer || 0, 0.6);
          }
        }
        if (u.hurtPlayer && this.player && this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (dist(u.x, u.y, this.player.x, this.player.y) < u.r + this.player.r) {
            if (this.player.takeDamage(u.x, u.y)) {
              this.endSaleGame(false, u.killName || 'Пожар в отделе');
              return true;
            }
            this.tookDamage = true;
            sfx.hurt();
            this.applySaleFragileExtra();
          }
        }
      }
    }
    this.salePuddles = this.salePuddles.filter((u) => u.life > 0);
    return false;
  };

  Game.prototype.applySaleFragileExtra = function () {
    if (!this.saleFragile || !this.player || this.player.hp <= 0) return false;
    this.player.hp -= 1;
    if (this.player.hp <= 0) {
      if ((this.player.extraLives || 0) > 0) {
        this.player.extraLives -= 1;
        this.player.hp = Math.max(1, Math.ceil(this.player.maxHp * 0.5));
        this.player.invincible = 2.2;
        return false;
      }
      this.endSaleGame(false, 'Распродажа оружия (хрупкость)');
      return true;
    }
    return false;
  };

  Game.prototype.clearSaleEventModifiers = function () {
    this.saleMobSpeedMul = 1;
    this.saleSpawnMul = 1;
    this.saleXpEventMul = 1;
    this.saleWeaponDmgMul = 1;
    this.saleFragile = false;
    this.saleForceTypes = null;
    this.saleInvulnExcept = null;
    this.saleEvacMode = null;
    this.saleEventAcc = 0;
    this.saleVipRef = null;
    if (this.saleTempWalls && this.saleTempWalls.length) {
      const temps = new Set(this.saleTempWalls);
      this.obstacles = (this.obstacles || []).filter((o) => !temps.has(o) && !o._saleTemp);
      this.saleTempWalls = [];
    }
    for (const e of this.enemies || []) {
      e._saleInvuln = false;
    }
  };

  Game.prototype.endSaleEvent = function () {
    this.clearSaleEventModifiers();
    this.saleActiveEvent = null;
  };

  Game.prototype.startSaleEvent = function (id) {
    this.endSaleEvent();
    const p = this.player;
    const banners = {
      queue_rush: '👥 НАПЛЫВ ОЧЕРЕДИ!',
      triple_boss: '👔 ТРОЙКА АДМИНОВ!',
      black_friday: '🏷 ЧЁРНАЯ ПЯТНИЦА! Все ускорились',
      lights_out: '💡 СВЕТ ВЫКЛЮЧИЛИ!',
      fire_dept: '🔥 ПОЖАР В ОТДЕЛЕ!',
      inventory: '📋 ИНВЕНТАРИЗАЦИЯ! Бей только отмеченных',
      vip_day: '👑 VIP-ДЕНЬ! Пока жив VIP — толпа быстрее',
      xp_discount: '💸 СКИДКА −50% НА XP',
      xp_double: '✨ ДВОЙНОЙ XP!',
      evacuation: '🚨 ЭВАКУАЦИЯ! Сначала бегут, потом навалятся',
      complaint_book: '📕 КНИГА ЖАЛОБ С ПОТОЛКА!',
      security_walls: '🚧 ОХРАНА ЗАКРЫЛА ПРОХОДЫ!',
      happy_hour: '💎 СЧАСТЛИВЫЙ ЧАС! Гемы в центре',
      checkout_hall: '🧾 КАССОВЫЙ ЗАЛ! Только очереди',
      director_call: '📞 ДИРЕКТОР НА СВЯЗИ! Линии с краёв',
      weapon_sale: '⚔ РАСПРОДАЖА ОРУЖИЯ! ×2 урон, ×2 входящий',
      mall_closing: '🔒 ЗАКРЫТИЕ ТЦ! Всё сразу',
    };
    const durations = {
      queue_rush: 10, triple_boss: 12, black_friday: 30, lights_out: 22,
      fire_dept: 28, inventory: 16, vip_day: 40, xp_discount: 25, xp_double: 25,
      evacuation: 18, complaint_book: 22, security_walls: 24, happy_hour: 14,
      checkout_hall: 28, director_call: 26, weapon_sale: 20, mall_closing: 55,
    };
    const dur = durations[id] || 20;
    this.saleActiveEvent = { id, t: dur, max: dur };
    this.saleLastEventId = id;
    this.modeFlash = Math.max(this.modeFlash || 0, 0.7);
    if (typeof this.showEventBanner === 'function') {
      this.showEventBanner(banners[id] || ('Событие: ' + id), Math.min(3.2, dur * 0.2));
    }
    sfx.mode();

    if (id === 'queue_rush') {
      const n = 14 + randi(0, 6);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const r = 140 + rand(0, 50);
        this.spawnSaleEnemyNear(
          p.x + Math.cos(a) * r,
          p.y + Math.sin(a) * r,
          Math.random() < 0.55 ? 'queue' : 'normal',
          { nameTag: 'Очередь', overCap: 12 }
        );
      }
    } else if (id === 'triple_boss') {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        const e = this.spawnSaleEnemyNear(
          p.x + Math.cos(a) * 220,
          p.y + Math.sin(a) * 220,
          i === 1 ? 'boss' : 'miniboss',
          { nameTag: i === 1 ? 'Админ' : 'Зам. админа', hpMul: 0.42, xpReward: 10, overCap: 8 }
        );
        if (e) e.speed *= 0.85;
      }
    } else if (id === 'black_friday') {
      this.saleMobSpeedMul = 1.5;
      this.saleSpawnMul = 0.55;
      this.fireAlarm = Math.max(this.fireAlarm, dur);
      for (let i = 0; i < 8; i++) this.spawnSaleEnemy();
    } else if (id === 'lights_out') {
      this.lightsOut = Math.max(this.lightsOut, dur);
    } else if (id === 'fire_dept') {
      this.fireAlarm = Math.max(this.fireAlarm, dur * 0.6);
      this.saleSpawnMul = 0.75;
      for (let i = 0; i < 5; i++) {
        const e = this.spawnSaleEnemy('fatty');
        if (e) e.nameTag = 'Горючее';
      }
      this._saleSeedFirePuddles(6);
    } else if (id === 'inventory') {
      const types = {};
      for (const e of this.enemies) {
        if (e.hp > 0) types[e.type] = (types[e.type] || 0) + 1;
      }
      const keys = Object.keys(types);
      const except = keys.length ? keys[randi(0, keys.length - 1)] : 'normal';
      this.saleInvulnExcept = except;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        e._saleInvuln = e.type !== except;
      }
      const labels = {
        normal: 'обычных', fast: 'быстрых', tank: 'танков', fatty: 'жирных',
        queue: 'очередь', returner: 'жалобщиков', manager: 'менеджеров',
        boss: 'боссов', miniboss: 'минибоссов', director: 'директора',
      };
      if (typeof this.showEventBanner === 'function') {
        this.showEventBanner(`📋 Уязвимы: ${labels[except] || except}`, 3.5);
      }
    } else if (id === 'vip_day') {
      const vip = this.spawnSaleEnemyNear(p.x + 200, p.y - 160, 'boss', {
        nameTag: 'VIP-клиент', hpMul: 1.8, xpReward: 18, vip: true, overCap: 4,
      });
      this.saleVipRef = vip;
      this.saleMobSpeedMul = 1.35;
    } else if (id === 'xp_discount') {
      this.saleXpEventMul = 0.5;
    } else if (id === 'xp_double') {
      this.saleXpEventMul = 2;
    } else if (id === 'evacuation') {
      this.saleEvacMode = 'flee';
      this.saleActiveEvent.fleeT = 8;
    } else if (id === 'complaint_book') {
      this.saleEventAcc = 0;
    } else if (id === 'security_walls') {
      this._saleSpawnTempWalls();
    } else if (id === 'happy_hour') {
      const cx = this.worldW * 0.5;
      const cy = this.worldH * 0.5;
      for (let i = 0; i < 18; i++) {
        this.xpGems.push({
          x: cx + rand(-90, 90), y: cy + rand(-70, 70),
          value: 2 + randi(0, 2), r: 10, life: 30, vx: rand(-20, 20), vy: rand(-20, 20),
        });
      }
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16;
        this.spawnSaleEnemyNear(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160, 'fast', {
          nameTag: 'Охотник за скидкой', overCap: 14,
        });
      }
    } else if (id === 'checkout_hall') {
      this.saleForceTypes = ['queue', 'normal', 'normal'];
      this.saleSpawnMul = 0.5;
      for (let i = 0; i < 12; i++) this.spawnSaleEnemy();
    } else if (id === 'director_call') {
      this.saleEventAcc = 0.5;
    } else if (id === 'weapon_sale') {
      this.saleWeaponDmgMul = 2;
      this.saleFragile = true;
    } else if (id === 'mall_closing') {
      this.saleMobSpeedMul = 1.45;
      this.saleSpawnMul = 0.45;
      this.fireAlarm = Math.max(this.fireAlarm, 40);
      this.lightsOut = Math.max(this.lightsOut, 12);
      this.saleWeaponDmgMul = 1.5;
      this.saleFragile = true;
      this._saleSeedFirePuddles(8);
      for (let i = 0; i < 2; i++) {
        this.spawnSaleEnemyNear(p.x + (i ? 240 : -240), p.y - 180, 'boss', {
          nameTag: 'Охрана закрытия', hpMul: 0.55, xpReward: 12, overCap: 6,
        });
      }
      for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
      this.saleEventAcc = 0;
    }
  };

  Game.prototype._saleSeedFirePuddles = function (n) {
    const p = this.player;
    for (let i = 0; i < n; i++) {
      this.salePuddles.push({
        x: p.x + rand(-320, 320),
        y: p.y + rand(-240, 240),
        r: 38 + rand(0, 28),
        life: 8 + rand(0, 6),
        dmg: 1,
        tick: rand(0, 0.3),
        color: '#e67e22',
        hurtPlayer: true,
        killName: 'Пожар в отделе',
      });
    }
  };

  Game.prototype._saleSpawnTempWalls = function () {
    this.saleTempWalls = this.saleTempWalls || [];
    const p = this.player;
    const specs = [
      { dx: -110, dy: -40, w: 28, h: 140 },
      { dx: 110, dy: -40, w: 28, h: 140 },
      { dx: -80, dy: -130, w: 160, h: 26 },
      { dx: -80, dy: 90, w: 70, h: 26 },
      { dx: 20, dy: 90, w: 70, h: 26 },
    ];
    for (const s of specs) {
      const ob = {
        x: p.x + s.dx, y: p.y + s.dy, w: s.w, h: s.h,
        dw: s.w + 8, dh: s.h + 10, sprite: 'box_stack', type: 'prop', _saleTemp: true,
      };
      this.obstacles.push(ob);
      this.saleTempWalls.push(ob);
    }
  };

  Game.prototype.tickSaleEvents = function (dt) {
    const minute = Math.floor(this.saleTime / 60);
    if (minute >= 1 && minute > this.saleEventMinute && minute <= 19) {
      this.saleEventMinute = minute;
      const id = pickSaleEventId(minute, this.saleLastEventId);
      this.startSaleEvent(id);
    }

    const ev = this.saleActiveEvent;
    if (!ev) return false;

    ev.t -= dt;
    this.saleEventAcc = (this.saleEventAcc || 0) + dt;

    if (ev.id === 'vip_day') {
      const vip = this.saleVipRef;
      if (!vip || vip.hp <= 0) {
        this.saleMobSpeedMul = 1;
        this.saleVipRef = null;
      } else {
        this.saleMobSpeedMul = 1.4;
        // аура визуально через speed
      }
    }

    if (ev.id === 'evacuation') {
      if (ev.fleeT > 0) {
        ev.fleeT -= dt;
        this.saleEvacMode = 'flee';
        if (ev.fleeT <= 0) {
          this.saleEvacMode = 'rush';
          this.saleMobSpeedMul = 1.6;
          this.showEventBanner('😱 ТОЛПА ВЕРНУЛАСЬ!', 2.2);
          for (let i = 0; i < 10; i++) this.spawnSaleEnemy();
        }
      }
    }

    if (ev.id === 'complaint_book' || ev.id === 'mall_closing') {
      const every = ev.id === 'mall_closing' ? 1.6 : 2.0;
      if (this.saleEventAcc >= every) {
        this.saleEventAcc = 0;
        this._saleFireComplaintBurst();
      }
    }

    if (ev.id === 'director_call' || ev.id === 'mall_closing') {
      const every = ev.id === 'mall_closing' ? 3.2 : 3.8;
      // отдельный аккумулятор через t modulo — используем max-t
      const elapsed = ev.max - ev.t;
      if (!ev._lastLineAt) ev._lastLineAt = -99;
      if (elapsed - ev._lastLineAt >= every) {
        ev._lastLineAt = elapsed;
        this._saleDirectorEdgeSlash();
      }
    }

    if (ev.id === 'fire_dept' || ev.id === 'mall_closing') {
      if (!ev._lastFireAt) ev._lastFireAt = 0;
      const elapsed = ev.max - ev.t;
      if (elapsed - ev._lastFireAt >= 4.5) {
        ev._lastFireAt = elapsed;
        this._saleSeedFirePuddles(ev.id === 'mall_closing' ? 3 : 2);
      }
    }

    if (ev.id === 'inventory') {
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        e._saleInvuln = e.type !== this.saleInvulnExcept;
      }
    }

    if (ev.t <= 0) {
      this.endSaleEvent();
      if (typeof this.showEventBanner === 'function') {
        this.showEventBanner('✅ Событие закончилось', 1.4);
      }
    }
    return false;
  };

  Game.prototype._saleFireComplaintBurst = function () {
    const p = this.player;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const side = randi(0, 3);
      let x, y;
      if (side === 0) { x = rand(40, this.worldW - 40); y = 20; }
      else if (side === 1) { x = this.worldW - 20; y = rand(40, this.worldH - 40); }
      else if (side === 2) { x = rand(40, this.worldW - 40); y = this.worldH - 20; }
      else { x = 20; y = rand(40, this.worldH - 40); }
      const a = angleTo(x, y, p.x + rand(-40, 40), p.y + rand(-40, 40));
      this.projectiles.push(new Projectile(x, y, a, 240 + rand(0, 60), null));
    }
  };

  Game.prototype._saleDirectorEdgeSlash = function () {
    const p = this.player;
    const side = randi(0, 3);
    let x, y;
    if (side === 0) { x = p.x; y = Math.max(40, p.y - 280); }
    else if (side === 1) { x = Math.min(this.worldW - 40, p.x + 280); y = p.y; }
    else if (side === 2) { x = p.x; y = Math.min(this.worldH - 40, p.y + 280); }
    else { x = Math.max(40, p.x - 280); y = p.y; }
    const fake = { x, y, type: 'director', bossPhase: 2, nameTag: 'Директор (по рации)' };
    this.spawnBossLineAttack(fake, p, { lines: Math.random() < 0.35 ? 2 : 1, warn: 0.95, length: 520 });
  };

  Game.prototype.updateSale = function (dt) {
    if (this.inHub || this.paused || this.choosingUpgrade || this.shopping || this.gameOver || this.won) return;
    const realDt = Math.min(dt, 0.1);
    music.setIntensity(this.saleTime > SALE_DURATION * 0.75 ? 'boss' : 'rush');

    this.saleTime += realDt;
    if (this.saleTime >= SALE_DURATION) {
      this.endSaleGame(true);
      return;
    }

    // минутные события ТЦ
    this.tickSaleEvents(realDt);

    // timers inherited from shift events
    if (this.lightsOut > 0) this.lightsOut -= realDt;
    if (this.fireAlarm > 0) this.fireAlarm -= realDt;
    if (this._eventBanner) {
      this._eventBanner.t -= realDt;
      if (this._eventBanner.t <= 0) this._eventBanner = null;
    }
    if (this.modeFlash > 0) this.modeFlash -= realDt;

    // regen
    const regenLv = this.salePassives.regen || 0;
    if (regenLv > 0) {
      this.saleRegenTimer += realDt;
      const every = Math.max(4, 12 - regenLv * 2.5);
      if (this.saleRegenTimer >= every) {
        this.saleRegenTimer = 0;
        if (this.player.hp < this.player.maxHp) this.player.hp++;
      }
    }

    if (this._saleAura) { this._saleAura.t -= realDt; if (this._saleAura.t <= 0) this._saleAura = null; }
    if (this._saleNova) { this._saleNova.t -= realDt; if (this._saleNova.t <= 0) this._saleNova = null; }

    const zone = this.zoneAt(this.player.x, this.player.y);
    let slip = zone && zone.type === 'slippery' ? 1.35 : 1;
    const speedMul = this.player._saleSpeedMul || 1;

    const dir = this.getInputDir();
    if (this.player.dashTime <= 0) {
      this.player.x += dir.x * this.player.speed * slip * speedMul * realDt;
      this.player.y += dir.y * this.player.speed * slip * speedMul * realDt;
    }
    if (dir.x || dir.y) this.player.angle = Math.atan2(dir.y, dir.x);

    // look at nearest for facing even when idle
    let nearest = null; let best = 280;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist(this.player.x, this.player.y, e.x, e.y);
      if (d < best) { best = d; nearest = e; }
    }
    if (nearest && !(dir.x || dir.y)) {
      this.player.angle = angleTo(this.player.x, this.player.y, nearest.x, nearest.y);
    }

    this.player.update(realDt, this.worldW, this.worldH, this);
    this.player.tickAnim(realDt, !!(dir.x || dir.y));
    this.pushOutOfObstacles(this.player, this.player.r);

    const lead = 40;
    const targetCX = this.player.x - this.viewW() / 2 + Math.cos(this.player.angle) * lead * 0.25;
    const targetCY = this.player.y - this.viewH() / 2 + Math.sin(this.player.angle) * lead * 0.25;
    this.camera.x += (targetCX - this.camera.x) * Math.min(1, realDt * 5);
    this.camera.y += (targetCY - this.camera.y) * Math.min(1, realDt * 5);

    // spawn
    this.saleSpawnAcc += realDt;
    const interval = saleSpawnInterval(this.saleTime) * (this.saleSpawnMul || 1);
    while (this.saleSpawnAcc >= interval) {
      this.saleSpawnAcc -= interval;
      this.spawnSaleEnemy();
      if (saleTimeFactor(this.saleTime) > 0.5) this.spawnSaleEnemy();
    }

    // enemies always chase in sale
    for (const enemy of this.enemies) {
      if (this.saleEvacMode === 'flee') {
        const toL = enemy.x;
        const toR = this.worldW - enemy.x;
        const toT = enemy.y;
        const toB = this.worldH - enemy.y;
        let ax = 0; let ay = 0;
        const m = Math.min(toL, toR, toT, toB);
        if (m === toL) ax = -1;
        else if (m === toR) ax = 1;
        else if (m === toT) ay = -1;
        else ay = 1;
        const spd = enemy.speed * 1.5 * realDt;
        enemy.x += ax * spd;
        enemy.y += ay * spd;
        enemy.angle = Math.atan2(ay, ax);
        clampEntityToArena(enemy, this.worldW, this.worldH, this);
      } else {
        enemy.update(realDt, this.player, this.worldW, this.worldH, true, this);
      }
      this.pushOutOfObstacles(enemy, enemy.r);

      const d = dist(this.player.x, this.player.y, enemy.x, enemy.y);
      const hitR = this.player.r + enemy.r - 2;
      if (d < hitR) {
        if (enemy.noDamage || enemy.type === 'child') {
          const a = angleTo(enemy.x, enemy.y, this.player.x, this.player.y);
          this.player.knockback.x += Math.cos(a) * 140;
          this.player.knockback.y += Math.sin(a) * 140;
        } else if (this.player.invincible <= 0 && this.player.lunchTimer <= 0 && this.player.dashTime <= 0) {
          if (this.player.takeDamage(enemy.x, enemy.y)) {
            this.endSaleGame(false, enemy.nameTag || 'Покупатель');
            return;
          }
          this.tookDamage = true;
          sfx.hurt();
          this.vibrate(40);
          if (this.applySaleFragileExtra()) return;
        }
      }
    }

    // книги жалоб / снаряды боссов
    for (const pr of this.projectiles) {
      pr.update(realDt);
      if (!pr.dead && dist(pr.x, pr.y, this.player.x, this.player.y) < this.player.r + pr.r) {
        pr.dead = true;
        this.player.applyComplaint();
        this.spawnParticles(this.player.x, this.player.y, 10, '#8e44ad', 120, 0.4);
        sfx.hurt();
        this.vibrate(35);
      }
    }
    this.projectiles = this.projectiles.filter((pr) => !pr.dead);

    // auto weapons (орбиты, снаряды, лучи…)
    this.updateSaleWeapons(realDt);
    this.updateSaleOrbits(realDt);
    this.updateSaleBoomerangs(realDt);
    this.updateSaleProjectiles(realDt);
    this.updateSaleCharges(realDt);
    this.updateSaleSeekers(realDt);
    this.updateSaleBeams(realDt);
    if (this.updateSalePuddles(realDt)) return;

    // fuse bombs
    for (const bomb of this.fuseBombs) {
      bomb.life -= realDt;
      if (bomb.life <= 0 && !bomb.exploded) {
        bomb.exploded = true;
        if (this.explodeAt(bomb.x, bomb.y)) return;
      }
    }
    this.fuseBombs = this.fuseBombs.filter((b) => !b.exploded);

    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // XP gems
    const mag = this.saleMagnetRange();
    for (const g of this.xpGems) {
      g.life -= realDt;
      g.x += (g.vx || 0) * realDt;
      g.y += (g.vy || 0) * realDt;
      g.vx *= 0.92; g.vy *= 0.92;
      const d = dist(this.player.x, this.player.y, g.x, g.y);
      if (d < mag) {
        const pull = Math.min(1, (mag - d) / mag) * 420 * realDt;
        const a = angleTo(g.x, g.y, this.player.x, this.player.y);
        g.x += Math.cos(a) * pull;
        g.y += Math.sin(a) * pull;
      }
      if (d < this.player.r + g.r) {
        g.dead = true;
        this.gainSaleXp(g.value || 1);
        sfx.pickup();
      }
    }
    this.xpGems = this.xpGems.filter((g) => !g.dead && g.life > 0);

    // coin pickups (reuse)
    for (const pk of this.pickups) {
      pk.update(realDt, this.player);
      if (!pk.dead && dist(this.player.x, this.player.y, pk.x, pk.y) < this.player.r + pk.r + 8) {
        if (pk.type === 'coin' || pk.type === 'coins') {
          const wallet = 1 + (this.salePassives.wallet || 0) * 0.15;
          this.coins += Math.ceil((pk.value || 1) * wallet * (this.coinMult || 1));
          pk.life = 0;
          sfx.pickup();
        } else if (pk.type === 'heal' && this.player.hp < this.player.maxHp) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          pk.life = 0;
          sfx.pickup();
        } else if (pk.type === 'lunch') {
          this.player.applyLunch();
          pk.life = 0;
          sfx.pickup();
        }
      }
    }
    this.pickups = this.pickups.filter((p) => !p.dead);

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - realDt);
    for (const p of this.particles) p.update(realDt);
    this.particles = this.particles.filter((p) => !p.dead);
    for (const b of this.boomFx) b.life -= realDt;
    this.boomFx = this.boomFx.filter((b) => b.life > 0);
    this.tickSpriteFx(realDt);

    // линейные удары босса (телеграф → удар → исчезновение)
    if (this.updateBossLineAttacks(realDt)) return;

    // skill/dash still work via input
    if ((this.keys['f'] || this.keys['F'] || this.keys['e'] || this.keys['E']) && this.player.trySkill()) {
      sfx.level(); this.vibrate([20, 30, 20]);
    }
  };

  Game.prototype.updateSaleHUD = function () {
    const p = this.player;
    if (!p) return;
    this.$hpFill.style.width = (100 * p.hp / p.maxHp) + '%';
    this.$hpText.textContent = `${p.hp}/${p.maxHp}`;
    this.$xpFill.style.width = (100 * this.saleXp / this.saleXpNext) + '%';
    this.$xpText.textContent = `${this.saleXp}/${this.saleXpNext}`;
    this.$level.textContent = this.saleLevel;
    this.$score.textContent = '🛒 ' + this.score;
    if (this.$coins) this.$coins.textContent = '🪙 ' + this.coins;

    const left = Math.max(0, SALE_DURATION - this.saleTime);
    const m = Math.floor(left / 60);
    const s = Math.floor(left % 60).toString().padStart(2, '0');
    this.$mode.textContent = `⏱ ${m}:${s}`;
    this.$mode.className = 'hud-mode ' + (left < 60 ? 'chase' : 'flee');

    this.$wave.textContent = this.saleActiveEvent
      ? `📣 ${Math.ceil(this.saleActiveEvent.t)}с · мин.${Math.floor(this.saleTime / 60)}`
      : `🔥 Распродажа · мин.${Math.floor(this.saleTime / 60)}`;
    this.$enemies.textContent = `Убито: ${this.waveKills} · Врагов: ${this.enemies.length}`;

    if (this.$combo) this.$combo.style.display = 'none';

    const tags = [];
    const weps = Object.keys(this.saleWeapons);
    tags.push(`<span class="buff-tag good">⚔ ${weps.length} ор.</span>`);
    if (p.lunchTimer > 0) tags.push(`<span class="buff-tag good">☕ ${p.lunchTimer.toFixed(0)}с</span>`);
    if (this.saleActiveEvent) {
      const left = Math.max(0, this.saleActiveEvent.t);
      tags.push(`<span class="buff-tag bad">📣 ${left.toFixed(0)}с</span>`);
    }
    if (this.saleXpEventMul > 1.01) tags.push(`<span class="buff-tag good">✨ XP×${this.saleXpEventMul}</span>`);
    if (this.saleXpEventMul < 0.99) tags.push(`<span class="buff-tag bad">💸 XP×${this.saleXpEventMul}</span>`);
    if (this.saleWeaponDmgMul > 1.01) tags.push(`<span class="buff-tag good">⚔ урон×${this.saleWeaponDmgMul}</span>`);
    if (this.saleFragile) tags.push(`<span class="buff-tag bad">💔 хрупкий</span>`);
    if (this.lightsOut > 0) tags.push(`<span class="buff-tag bad">💡 темнота</span>`);
    if (this.fireAlarm > 0) tags.push(`<span class="buff-tag bad">🚨 тревога</span>`);
    if (this.saleInvulnExcept) tags.push(`<span class="buff-tag bad">📋 только ${this.saleInvulnExcept}</span>`);
    this.$buffBar.innerHTML = tags.join('');

    if (this.$skillFill) this.$skillFill.style.width = (100 * p.skill / p.skillMax) + '%';
    if (this.$chargeFill) this.$chargeFill.style.width = '0%';
  };

  Game.prototype.renderSaleOverlays = function () {
    // вызывается внутри уже трансформированной камеры render()
    if (!this.salePuddles) return;

    // временные стены охраны
    if (this.saleTempWalls && this.saleTempWalls.length) {
      for (const w of this.saleTempWalls) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.restore();
      }
    }

    // лужи (кофе / яд / кровь)
    for (const u of this.salePuddles) {
      const a = Math.min(0.55, 0.2 + u.life * 0.15);
      ctx.globalAlpha = a;
      ctx.fillStyle = u.color || '#d35400';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + 4, u.r * 0.95, u.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (u.poison && typeof drawSpell === 'function') {
        drawSpell(ctx, 'sp_poison1', u.x, u.y, { scale: 0.45, anchorY: 0.5, alpha: 0.5 });
      }
    }

    // аура / новы
    if (this._saleAura) {
      const alpha = Math.min(0.9, this._saleAura.t * 5);
      const sc = Math.min(0.5, (this._saleAura.r / 180));
      const spell = this._saleAura.blood ? 'sp_bleed3' : 'sp_heal3';
      if (!(typeof drawSpell === 'function' && drawSpell(ctx, spell, this.player.x, this.player.y + 4, { scale: sc, anchorY: 0.55, alpha }))) {
        ctx.strokeStyle = this._saleAura.blood ? `rgba(192,57,43,${0.45 * alpha})` : `rgba(155,89,186,${0.35 * alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this._saleAura.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this._saleAura.ico) {
        drawSaleIcon(ctx, this._saleAura.ico, this.player.x, this.player.y - this._saleAura.r * 0.25, 0.7, 0, this._saleAura.visual, 2);
      }
      if (this._saleAura.visual === 'bloody_aura' && typeof drawWeaponAtlas === 'function') {
        drawWeaponAtlas(ctx, 'bloody_aura', 3, this.player.x, this.player.y + 4, { targetSize: 28, alpha: alpha * 0.75 });
      }
    }
    if (this._saleNova) {
      const alpha = Math.min(1, this._saleNova.t * 4);
      if (!(typeof drawSpell === 'function' && drawSpell(ctx, 'sp_fwave3', this.player.x, this.player.y, {
        scale: Math.min(0.55, (this._saleNova.r / 200) * (1 + (0.28 - this._saleNova.t))),
        anchorY: 0.5, alpha,
      }))) {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this._saleNova.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // XP-кристаллы
    for (const g of this.xpGems || []) {
      const bob = Math.sin(performance.now() / 180 + g.x * 0.05) * 2;
      const sc = 0.18 + Math.min(0.12, (g.value || 1) * 0.03);
      if (!drawVfx(ctx, 'fx_crystal', g.x, g.y + bob, { scale: sc, anchorY: 0.85, alpha: 0.95 })) {
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // орбиты — чеки / швабра / лента
    for (const o of this.saleOrbits || []) {
      const rot = o.angle + performance.now() / 180;
      const sc = (o.size || 1) * 0.85;
      const vis = o.visual || o.weaponId || 'receipt';
      ctx.globalAlpha = 0.28;
      drawSaleIcon(ctx, o.ico || '🧾', o.x - Math.cos(o.angle) * 10, o.y - Math.sin(o.angle) * 10, sc * 0.7, rot - 0.4, vis, 1);
      ctx.globalAlpha = 1;
      drawSaleIcon(ctx, o.ico || '🧾', o.x, o.y, sc, rot, vis, 2);
    }

    // лучи (фонарик / охотник)
    for (const b of this.saleBeams || []) {
      const x1 = this.player.x, y1 = this.player.y;
      const x2 = b.x2 != null ? b.x2 : x1 + Math.cos(b.angle) * b.length;
      const y2 = b.y2 != null ? b.y2 : y1 + Math.sin(b.angle) * b.length;
      const grd = ctx.createLinearGradient(x1, y1, x2, y2);
      grd.addColorStop(0, 'rgba(255,230,120,0.12)');
      grd.addColorStop(0.4, 'rgba(255,210,60,0.4)');
      grd.addColorStop(1, 'rgba(255,250,200,0.04)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = Math.max(5, b.width * 0.35);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,220,0.75)';
      ctx.lineWidth = Math.max(2, b.width * 0.12);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawSaleIcon(ctx, '🔦', x1 + Math.cos(b.angle) * 14, y1 + Math.sin(b.angle) * 14, 0.65, b.angle, 'flashlight', 2);
    }

    // бумеранги (карта)
    for (const b of this.saleBoomerangs || []) {
      const spin = performance.now() / 90;
      drawSaleIcon(ctx, b.ico || '💳', b.x, b.y, (b.size || 1) * 0.8, spin, b.visual || 'card', 2);
    }

    // заряды (тележка / магнит)
    for (const c of this.saleCharges || []) {
      drawSaleIcon(ctx, c.ico || '🛒', c.x, c.y, (c.size || 1.1) * 0.9, c.angle, c.visual || 'cart', 2);
      if (c.pull) {
        ctx.strokeStyle = 'rgba(155,89,186,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.pull * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // самонаводящиеся (мыши)
    for (const s of this.saleSeekers || []) {
      const batStage = 1 + (Math.floor(performance.now() / 120) % 3);
      drawSaleIcon(ctx, s.ico || '🦇', s.x, s.y, 0.7, s.angle || 0, s.visual || 'bats', batStage);
    }

    // снаряды (телефон / кофе / пакет / прайс)
    for (const pr of this.saleProjectiles || []) {
      const age = pr.born ? (performance.now() - pr.born) / 1000 : 0.5;
      const st = age < 0.08 ? 1 : 2;
      drawSaleIcon(ctx, pr.ico || '📱', pr.x, pr.y, 0.75, pr.angle + performance.now() / 140, pr.visual, st);
    }

    // обед / щит
    if (this.player.lunchTimer > 0) {
      drawVfx(ctx, 'fx_aura_gold', this.player.x, this.player.y, {
        scale: 0.4 + Math.sin(performance.now() / 120) * 0.04,
        anchorY: 0.7,
        alpha: 0.5,
      });
    } else if (this.player.invincible > 0.2) {
      if (!(typeof drawSpell === 'function' && drawSpell(ctx, 'sp_shield2', this.player.x, this.player.y - 4, {
        scale: 0.32, anchorY: 0.55, alpha: 0.45,
      }))) {
        drawVfx(ctx, 'fx_shield', this.player.x, this.player.y - 4, {
          scale: 0.32, anchorY: 0.55, alpha: 0.4,
        });
      }
    }

    // маркеры инвентаризации / VIP
    if (this.saleInvulnExcept || this.saleVipRef) {
      for (const e of this.enemies || []) {
        if (e.hp <= 0) continue;
        if (e._saleVip) {
          ctx.save();
          ctx.strokeStyle = 'rgba(241,196,15,0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r + 14 + Math.sin(performance.now() / 140) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (e._saleInvuln) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = '#7f8c8d';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        } else if (this.saleInvulnExcept && e.type === this.saleInvulnExcept) {
          ctx.save();
          ctx.strokeStyle = 'rgba(46,204,113,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  };

  Game.prototype.endSaleGame = function (won, killer) {
    this.gameOver = !won;
    this.won = won;
    this.killedBy = killer || '';
    this.paused = true;
    const isNew = this.score > this.highScore;
    if (isNew) this.highScore = this.score;

    const survived = Math.min(SALE_DURATION, this.saleTime);
    const mins = Math.floor(survived / 60);
    const secs = Math.floor(survived % 60);
    let bankGain = Math.floor(this.coins * 0.4) + Math.floor(survived / 30) + (won ? 40 : Math.floor(survived / 60) * 3);
    bankGain = Math.floor(bankGain * (1 + (this.salePassives.wallet || 0) * 0.1));
    this.bankCoins += bankGain;
    this.persist();

    document.getElementById('end-title').textContent = won ? '🛒 Распродажа закрыта!' : '💀 Вас растоптали';
    document.getElementById('end-sub').textContent = won
      ? `Продержался 20:00. В банк: +${bankGain}🪙`
      : `${killer ? 'Причина: ' + killer + '. ' : ''}Время ${mins}:${String(secs).padStart(2, '0')}. В банк: +${bankGain}🪙`;
    document.getElementById('end-score').textContent = this.score + ` · 🪙 ${this.coins}`;
    document.getElementById('end-wave').textContent = `ур.${this.saleLevel}`;
    document.getElementById('end-combo').textContent = this.waveKills;
    document.getElementById('end-record').textContent = this.highScore;
    document.getElementById('end-newrec').style.display = isNew ? 'inline' : 'none';
    const cl = document.getElementById('end-challenge-line');
    if (cl) cl.textContent = `Режим: Распродажа · оружий: ${Object.keys(this.saleWeapons).length}`;
    document.getElementById('end-overlay').classList.add('show');
    this.refreshMusicState();
    if (won) sfx.win(); else sfx.lose();
    this.vibrate(won ? [40, 40, 80] : 80);
  };

  // expose for debugging / hub
  window.SALE_WEAPONS = SALE_WEAPONS;
  window.SALE_PASSIVES = SALE_PASSIVES;
  window.SALE_DURATION = SALE_DURATION;
  window.SALE_HUB_WEAPON_COST = SALE_HUB_WEAPON_COST;
  window.SALE_EVENT_POOLS = SALE_EVENT_POOLS;
  window.SALE_HUB_PASSIVES = SALE_HUB_PASSIVES;

  Game.prototype.renderSaleHubLoadout = function () {
    const wepBox = document.getElementById('hub-sale-weapons');
    if (wepBox) {
      wepBox.innerHTML = '';
      for (const def of Object.values(SALE_WEAPONS)) {
        if (def.evolved) continue;
        const owned = (this.saleUnlockedWeapons || []).includes(def.id);
        const cost = SALE_HUB_WEAPON_COST[def.id];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (owned ? ' sel' : '');
        if (def.id === 'receipt') {
          el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc}</div>
            <div class="meta">Всегда со старта</div>`;
          el.disabled = true;
        } else {
          el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc}</div>
            <div class="meta">${owned ? 'Разблокировано' : ('Купить 🪙 ' + cost)}</div>`;
          if (!owned) {
            el.onclick = () => this.buySaleWeaponUnlock(def.id);
          }
        }
        wepBox.appendChild(el);
      }
    }

    const pasBox = document.getElementById('hub-sale-passives');
    if (pasBox) {
      pasBox.innerHTML = '';
      for (const pk of SALE_HUB_PASSIVES) {
        const lv = (this.saleStartPassives && this.saleStartPassives[pk.id]) || 0;
        const nextCost = lv >= pk.max ? null : pk.cost[lv];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (lv > 0 ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${pk.ico} ${pk.name} · ${lv}/${pk.max}</div>
          <div class="desc">${pk.desc}</div>
          <div class="meta">${nextCost == null ? 'Макс' : 'Купить 🪙 ' + nextCost}</div>`;
        el.onclick = () => this.buySaleStartPassive(pk.id);
        pasBox.appendChild(el);
      }
    }

    const ar = document.getElementById('hub-sale-arenas');
    if (ar && typeof ARENA_THEMES !== 'undefined') {
      ar.innerHTML = '';
      for (const th of Object.values(ARENA_THEMES)) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (this.selectedArena === th.id ? ' sel' : '');
        el.innerHTML = `<div class="ttl">${th.ico} ${th.name}</div><div class="desc">Арена распродажи</div>`;
        el.onclick = () => {
          this.selectedArena = th.id;
          this.persist();
          this.prepareIdleWorld();
          this.renderHub();
          sfx.click();
        };
        ar.appendChild(el);
      }
    }
  };

  Game.prototype.buySaleWeaponUnlock = function (id) {
    if (id === 'receipt' || SALE_WEAPONS[id]?.evolved) return;
    if (!SALE_WEAPONS[id]) return;
    if (!this.saleUnlockedWeapons) this.saleUnlockedWeapons = ['receipt'];
    if (this.saleUnlockedWeapons.includes(id)) return;
    const cost = SALE_HUB_WEAPON_COST[id];
    if (cost == null) return;
    if (this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.saleUnlockedWeapons.push(id);
    this.persist();
    this.renderHub();
    sfx.shop();
  };

  Game.prototype.buySaleStartPassive = function (id) {
    const pk = SALE_HUB_PASSIVES.find((p) => p.id === id);
    if (!pk) return;
    if (!this.saleStartPassives) this.saleStartPassives = {};
    const lv = this.saleStartPassives[id] || 0;
    if (lv >= pk.max) return;
    const cost = pk.cost[lv];
    if (this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.saleStartPassives[id] = lv + 1;
    this.persist();
    this.renderHub();
    sfx.shop();
  };
})();
