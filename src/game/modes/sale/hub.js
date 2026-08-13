/**
 * Распродажа: Хаб: витрина героев, оружия и стартовых пассивок.
 */
'use strict';

Game.prototype.renderSaleHubLoadout = function () {
  const heroBox = document.getElementById('hub-sale-heroes');
  if (heroBox) {
    heroBox.innerHTML = '';
    if (!this.selectedHeroId || !SALE_HEROES[this.selectedHeroId]) this.selectedHeroId = 'igor';
    this.ensureSaleHeroUnlocks();
    for (const id of (typeof SALE_HERO_UNLOCK_ORDER !== 'undefined' ? SALE_HERO_UNLOCK_ORDER : Object.keys(SALE_HEROES))) {
      if (!this.isSaleHeroUnlocked(id)) continue;
      const hero = SALE_HEROES[id];
      if (!hero) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hub-card' + (this.selectedHeroId === hero.id ? ' sel' : '');
      el.innerHTML = `<div class="ttl">${hero.ico} ${hero.name}</div>
          <div class="desc">${hero.desc}</div>
          <div class="meta">${this.selectedHeroId === hero.id ? 'Выбран' : 'Выбрать'}</div>`;
      el.onclick = () => {
        this.selectedHeroId = hero.id;
        this.persist();
        this.renderHub();
        sfx.click();
      };
      heroBox.appendChild(el);
    }
  }

  const wepBox = document.getElementById('hub-sale-weapons');
  if (wepBox) {
    wepBox.innerHTML = '';
    const startP = this.saleStartPassives || {};
    const evoHint = (wid) => {
      const tips = [];
      for (const ev of SALE_EVOLUTIONS) {
        if (ev.from !== wid) continue;
        if (startP[ev.needPassive] > 0) tips.push('откроет «' + ev.name + '»');
      }
      return tips.length ? ' · ' + tips.join(' / ') : '';
    };
    for (const def of Object.values(SALE_WEAPONS)) {
      if (def.evolved) continue;
      const owned = (this.saleUnlockedWeapons || []).includes(def.id);
      const cost = SALE_HUB_WEAPON_COST[def.id];
      const role = SALE_ROLE_LABEL[def.type] || def.type;
      const hint = evoHint(def.id);
      const el = document.createElement('button');
      el.type = 'button';
      const heroLocked = typeof this.isSaleWeaponHeroUnlocked === 'function'
        && !this.isSaleWeaponHeroUnlocked(def.id);
      el.className = 'hub-card' + (owned && !heroLocked ? ' sel' : '') + (hint && !heroLocked ? ' hot' : '') + (heroLocked ? ' locked' : '');
      if (heroLocked) {
        const needId = (typeof SALE_WEAPON_NEED_HERO !== 'undefined') ? SALE_WEAPON_NEED_HERO[def.id] : null;
        const needHero = needId && SALE_HEROES[needId];
        const needName = needHero ? ((needHero.ico || '') + ' ' + needHero.name) : 'героем';
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc} · ${role}</div>
            <div class="meta">Откроется с ${needName}</div>`;
        el.disabled = true;
      } else if (def.id === 'receipt') {
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc} · ${role}${hint}</div>
            <div class="meta">Всегда в ассортименте</div>`;
        el.disabled = true;
      } else {
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name}</div>
            <div class="desc">${def.desc} · ${role}${hint}</div>
            <div class="meta">${owned ? 'В ассортименте забега' : ('Купить в ассортимент 🪙 ' + cost)}</div>`;
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
    this.ensureSaleArenaUnlocks();
    ar.innerHTML = '';
    for (const id of (typeof SALE_ARENA_UNLOCK_ORDER !== 'undefined' ? SALE_ARENA_UNLOCK_ORDER : Object.keys(ARENA_THEMES))) {
      if (!this.isSaleArenaUnlocked(id)) continue;
      const th = ARENA_THEMES[id];
      if (!th) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hub-card' + (this.selectedArena === th.id ? ' sel' : '');
      el.innerHTML = `<div class="ttl">${th.ico} ${th.name}</div><div class="desc">Арена распродажи</div>
          <div class="meta">${this.selectedArena === th.id ? 'Выбрана' : 'Выбрать'}</div>`;
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
  if (beatSport) this.grantSaleHeroUnlock('masha');
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

/** Вылазка: эвакуация с 3 этажа после босса → Лена. Возвращает новых героев. */
Game.prototype.unlockSaleHeroesForExtractFloor = function (floor) {
  this.ensureSaleHeroUnlocks();
  const bossOk = typeof this.isExtractExitBossCleared === 'function'
    ? this.isExtractExitBossCleared()
    : true;
  const f = floor | 0;
  const fresh = [];
  if (f >= 3 && bossOk && this.grantSaleHeroUnlock('lena')) fresh.push('lena');
  return fresh;
};

Game.prototype.isSaleWeaponHeroUnlocked = function (weaponId) {
  const need = (typeof SALE_WEAPON_NEED_HERO !== 'undefined') ? SALE_WEAPON_NEED_HERO[weaponId] : null;
  if (!need) return true;
  return typeof this.isSaleHeroUnlocked === 'function' ? this.isSaleHeroUnlocked(need) : true;
};

Game.prototype.buySaleWeaponUnlock = function (id) {
  if (id === 'receipt' || SALE_WEAPONS[id]?.evolved) return;
  if (!SALE_WEAPONS[id]) return;
  if (typeof this.isSaleWeaponHeroUnlocked === 'function' && !this.isSaleWeaponHeroUnlocked(id)) return;
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
