/**
 * Распродажа: Хаб: оружие в витрине «Усилители».
 */
'use strict';

Game.prototype.renderSaleHubLoadout = function () {
  const wepBox = document.getElementById('hub-sale-weapons');
  if (!wepBox) return;
  wepBox.innerHTML = '';

  const startP = this.saleStartPassives || {};
  const evoHint = (wid) => {
    const tips = [];
    for (const ev of SALE_EVOLUTIONS) {
      if (ev.from !== wid) continue;
      if (startP[ev.needPassive] > 0) tips.push('откроет «' + ev.name + '»');
    }
    return tips.length ? ' ' + tips.join(' / ') : '';
  };

  for (const def of Object.values(SALE_WEAPONS)) {
    if (def.evolved) continue;
    const owned = (this.saleUnlockedWeapons || []).includes(def.id);
    const cost = SALE_HUB_WEAPON_COST[def.id];
    const role = SALE_ROLE_LABEL[def.type] || def.type;
    const hint = evoHint(def.id);
    const heroLocked = typeof this.isSaleWeaponHeroUnlocked === 'function'
      && !this.isSaleWeaponHeroUnlocked(def.id);
    const findLocked = typeof this.isSaleWeaponFindLocked === 'function'
      && this.isSaleWeaponFindLocked(def.id);

    let priceText;
    let extraClass = '';
    let disabled = false;
    let onClick = null;

    if (heroLocked) {
      const needId = (typeof SALE_WEAPON_NEED_HERO !== 'undefined') ? SALE_WEAPON_NEED_HERO[def.id] : null;
      const needHero = needId && SALE_HEROES[needId];
      const needName = needHero ? ((needHero.ico || '') + ' ' + needHero.name) : 'героем';
      priceText = 'ОТКРОЕТСЯ С ' + needName.toUpperCase();
      extraClass = 'is-locked';
      disabled = true;
    } else if (findLocked) {
      const findHint = (typeof SALE_WEAPON_FIND_HINT !== 'undefined' && SALE_WEAPON_FIND_HINT[def.id])
        ? SALE_WEAPON_FIND_HINT[def.id]
        : 'Найди на вылазке';
      priceText = findHint.toUpperCase();
      extraClass = 'is-locked';
      disabled = true;
    } else if (def.id === 'receipt') {
      priceText = 'ВСЕГДА В АССОРТИМЕНТЕ';
      extraClass = 'is-owned';
      disabled = true;
    } else if (owned) {
      priceText = 'В АССОРТИМЕНТЕ ЗАБЕГА';
      extraClass = 'is-owned';
      disabled = true;
    } else {
      priceText = this.formatHubPrice(cost);
      if (hint) extraClass = 'is-hot';
      onClick = () => this.buySaleWeaponUnlock(def.id);
    }

    const desc = def.desc + ' · ' + role + hint;
    wepBox.appendChild(this.createHubShopCard({
      ico: def.ico,
      name: def.name,
      desc,
      priceText,
      extraClass,
      disabled,
      onClick,
    }));
  }
};

Game.prototype.ensureSaleArenaUnlocks = function () {
  if (!Array.isArray(this.saleUnlockedArenas) || !this.saleUnlockedArenas.length) {
    this.saleUnlockedArenas = ['sport'];
  }
  if (!(this.saleUnlockedArenas || []).includes(this.selectedArena)) this.selectedArena = 'sport';
};

Game.prototype.isSaleArenaUnlocked = function (id) {
  if (!Array.isArray(this.saleUnlockedArenas) || !this.saleUnlockedArenas.length) {
    this.saleUnlockedArenas = ['sport'];
  }
  return this.saleUnlockedArenas.includes(id);
};

/** После победы на арене открывает следующую в цепочке. Возвращает id новой или null. */
Game.prototype.unlockNextSaleArena = function () {
  this.ensureSaleArenaUnlocks();
  const order = (typeof SALE_ARENA_UNLOCK_ORDER !== 'undefined') ? SALE_ARENA_UNLOCK_ORDER : [];
  const cur = this.selectedArena || 'sport';
  const i = order.indexOf(cur);
  if (i < 0 || i >= order.length - 1) return null;
  const next = order[i + 1];
  if (this.saleUnlockedArenas.includes(next)) return null;
  this.saleUnlockedArenas.push(next);
  return next;
};

Game.prototype.grantSaleHeroUnlock = function (id) {
  if (!SALE_HEROES || !SALE_HEROES[id]) return false;
  if (!Array.isArray(this.saleUnlockedHeroes) || !this.saleUnlockedHeroes.length) {
    this.saleUnlockedHeroes = ['igor'];
  }
  if (this.saleUnlockedHeroes.includes(id)) return false;
  this.saleUnlockedHeroes.push(id);
  return true;
};

Game.prototype.ensureSaleHeroUnlocks = function () {
  if (!Array.isArray(this.saleUnlockedHeroes) || !this.saleUnlockedHeroes.length) {
    this.saleUnlockedHeroes = ['igor'];
  }
  // Следующая арена уже открыта — Спорт пройден в прошлом забеге.
  const arenas = this.saleUnlockedArenas || [];
  const beatSport = arenas.includes('food') || arenas.includes('clothes') || arenas.includes('tech');
  if (beatSport) {
    this.grantSaleHeroUnlock('masha');
    this.grantSaleHeroUnlock('cashier');
  }
  if (this.saleUnlockedHeroes.includes('lena')) {
    this.grantSaleHeroUnlock('janitor');
    this.grantSaleHeroUnlock('guard');
  }
  if (this.saleUnlockedHeroes.includes('janitor')) this.grantSaleHeroUnlock('guard');
  if (!this.saleUnlockedHeroes.includes(this.selectedHeroId)) this.selectedHeroId = 'igor';
};

Game.prototype.isSaleHeroUnlocked = function (id) {
  if (!Array.isArray(this.saleUnlockedHeroes) || !this.saleUnlockedHeroes.length) {
    this.saleUnlockedHeroes = ['igor'];
  }
  return this.saleUnlockedHeroes.includes(id);
};

/** Распродажа: победа на Спорте → Маша. Возвращает новых героев. */
Game.prototype.unlockSaleHeroesForSaleWin = function (arenaId) {
  this.ensureSaleHeroUnlocks();
  const fresh = [];
  if (arenaId === 'sport' && this.grantSaleHeroUnlock('masha')) fresh.push('masha');
  return fresh;
};

/** Вылазка: 1 этаж → Сторож, 2 → Уборщица, 3 → Лена. */
Game.prototype.unlockSaleHeroesForExtractFloor = function (floor) {
  this.ensureSaleHeroUnlocks();
  const bossOk = typeof this.isExtractExitBossCleared === 'function'
    ? this.isExtractExitBossCleared()
    : true;
  const f = floor | 0;
  const fresh = [];
  if (f >= 1 && bossOk && this.grantSaleHeroUnlock('guard')) fresh.push('guard');
  if (f >= 2 && bossOk && this.grantSaleHeroUnlock('janitor')) fresh.push('janitor');
  if (f >= 3 && bossOk && this.grantSaleHeroUnlock('lena')) fresh.push('lena');
  return fresh;
};

Game.prototype.tryUnlockSaleCashier = function (opts) {
  opts = opts || {};
  const needArena = (typeof SALE_CASHIER_UNLOCK_ARENA !== 'undefined') ? SALE_CASHIER_UNLOCK_ARENA : 'sport';
  if ((this.selectedArena || 'sport') !== needArena) return null;
  const needSec = (typeof SALE_CASHIER_UNLOCK_SEC !== 'undefined') ? SALE_CASHIER_UNLOCK_SEC : 600;
  const needBoss = (typeof SALE_CASHIER_UNLOCK_BOSS !== 'undefined') ? SALE_CASHIER_UNLOCK_BOSS : 'discount_king';
  const timeOk = (this.saleTime || 0) >= needSec;
  const bossOk = !!(this._saleBossKilled && this._saleBossKilled[needBoss]);
  if (!timeOk && !bossOk) return null;
  if (!this.grantSaleHeroUnlock('cashier')) return null;
  if (!opts.silent && typeof this.showEventBanner === 'function') {
    const h = SALE_HEROES.cashier;
    this.showEventBanner((h.ico || '') + ' Открыт ' + h.name, 2.6);
  }
  if (typeof this.persist === 'function') this.persist();
  return 'cashier';
};

Game.prototype.isSaleWeaponHeroUnlocked = function (weaponId) {
  const need = (typeof SALE_WEAPON_NEED_HERO !== 'undefined') ? SALE_WEAPON_NEED_HERO[weaponId] : null;
  if (!need) return true;
  return typeof this.isSaleHeroUnlocked === 'function' ? this.isSaleHeroUnlocked(need) : true;
};

Game.prototype.isSaleWeaponFindLocked = function (weaponId) {
  if (typeof SALE_WEAPON_NEED_FIND === 'undefined' || !SALE_WEAPON_NEED_FIND[weaponId]) return false;
  return !(this.saleUnlockedWeapons || []).includes(weaponId);
};

Game.prototype.grantSaleWeaponUnlock = function (id) {
  if (!id || !SALE_WEAPONS[id] || SALE_WEAPONS[id].evolved) return false;
  if (!this.saleUnlockedWeapons) this.saleUnlockedWeapons = ['receipt'];
  if (this.saleUnlockedWeapons.includes(id)) return false;
  this.saleUnlockedWeapons.push(id);
  return true;
};

Game.prototype.buySaleWeaponUnlock = function (id) {
  if (id === 'receipt' || SALE_WEAPONS[id]?.evolved) return;
  if (!SALE_WEAPONS[id]) return;
  if (typeof this.isSaleWeaponHeroUnlocked === 'function' && !this.isSaleWeaponHeroUnlocked(id)) return;
  if (typeof this.isSaleWeaponFindLocked === 'function' && this.isSaleWeaponFindLocked(id)) return;
  if (!this.saleUnlockedWeapons) this.saleUnlockedWeapons = ['receipt'];
  if (this.saleUnlockedWeapons.includes(id)) return;
  const cost = SALE_HUB_WEAPON_COST[id];
  if (cost == null) return;
  if (this.bankCoins < cost) { sfx.hurt(); return; }
  this.bankCoins -= cost;
  this.saleUnlockedWeapons.push(id);
  this.persist();
  this.renderBoosters();
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
  this.renderBoosters();
  sfx.shop();
};
