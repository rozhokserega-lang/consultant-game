/**
 * Распродажа: Хаб: витрина героев, оружия и стартовых пассивок.
 */
'use strict';

Game.prototype.renderSaleHubLoadout = function () {
  const heroBox = document.getElementById('hub-sale-heroes');
  if (heroBox) {
    heroBox.innerHTML = '';
    if (!this.selectedHeroId || !SALE_HEROES[this.selectedHeroId]) this.selectedHeroId = 'lena';
    for (const hero of Object.values(SALE_HEROES)) {
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

  const floorBox = document.getElementById('hub-sale-floors');
  if (floorBox) {
    floorBox.innerHTML = '';
    if (!this.selectedFloorId) this.selectedFloorId = 'grocery';
    for (const fl of SALE_FLOORS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hub-card' + (this.selectedFloorId === fl.id ? ' sel' : '');
      el.innerHTML = `<div class="ttl">${fl.ico} ${fl.name}</div>
          <div class="desc">${fl.desc}</div>
          <div class="meta">${this.selectedFloorId === fl.id ? 'Выбран' : 'Выбрать'}</div>`;
      el.onclick = () => {
        this.selectedFloorId = fl.id;
        this.persist();
        this.renderHub();
        sfx.click();
      };
      floorBox.appendChild(el);
    }
  }

  const contractBox = document.getElementById('hub-sale-contracts');
  if (contractBox) {
    contractBox.innerHTML = '';
    if (!this.selectedContractId) this.selectedContractId = 'none';
    for (const c of SALE_CONTRACTS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hub-card' + (this.selectedContractId === c.id ? ' sel' : '');
      el.innerHTML = `<div class="ttl">${c.ico} ${c.name}</div>
          <div class="desc">${c.desc}</div>
          <div class="meta">${this.selectedContractId === c.id ? 'Активен' : 'Выбрать'} · ×${c.coinMul}</div>`;
      el.onclick = () => {
        this.selectedContractId = c.id;
        this.persist();
        this.renderHub();
        sfx.click();
      };
      contractBox.appendChild(el);
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
      el.className = 'hub-card' + (owned ? ' sel' : '') + (hint ? ' hot' : '');
      if (def.id === 'receipt') {
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
