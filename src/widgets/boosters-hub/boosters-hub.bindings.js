/** Хаб подготовки: вкладки, мета-перки, способности, лоадаут. */

Object.assign(Game.prototype, {
  isBoostersOpen() {
    return document.getElementById('boosters-overlay')?.classList.contains('show');
  },

  openBoosters(opts = {}) {
    this.hideOverlays();
    this.inMainMenu = false;
    this.inHub = false;
    this.paused = true;
    const tab = opts.tab === 'gear' || opts.tab === 'book' ? opts.tab : 'prep';
    this.hubScreen = tab;
    this.hubTab = tab;
    document.body.classList.remove('hub-mode', 'sale-mode');
    document.body.classList.add('main-menu-mode');
    document.getElementById('boosters-overlay').classList.add('show');
    try {
      this.renderBoosters();
    } catch (err) {
      console.error('renderBoosters failed:', err);
    }
    this.refreshMusicState();
    sfx.click();
  },

  openWardrobe() {
    this.openBoosters({ tab: 'gear' });
  },

  renderBoosters() {
    const bankEl = document.getElementById('boosters-bank');
    const recordEl = document.getElementById('boosters-record');
    if (bankEl) bankEl.textContent = this.bankCoins;
    if (recordEl) recordEl.textContent = this.highScore;

    const metaBox = document.getElementById('boosters-meta');
    if (metaBox) {
      metaBox.innerHTML = '';
      for (const def of META_PERKS) {
        const lv = this.metaPerks[def.id] || 0;
        const nextCost = lv >= def.max ? null : def.cost[lv];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (lv > 0 ? ' sel' : '') + (nextCost == null ? ' locked' : '');
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name} · ${lv}/${def.max}</div>
          <div class="desc">${def.desc}</div>
          <div class="meta">${nextCost == null ? 'Макс' : 'Купить 🪙 ' + nextCost}</div>`;
        if (nextCost != null) el.onclick = () => this.buyMetaPerk(def.id);
        metaBox.appendChild(el);
      }
    }

    const abBox = document.getElementById('boosters-abilities');
    if (abBox) {
      abBox.innerHTML = '';
      for (const def of ABILITY_DEFS) {
        const lv = this.abilityLevels[def.id] || 0;
        const nextCost = abilityUpgradeCost(lv);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (lv > 0 ? ' sel' : '') + (nextCost == null ? ' locked' : '');
        el.innerHTML = `<div class="ttl">${def.ico} ${def.name} · ${lv}/${ABILITY_MAX_LEVEL}</div>
          <div class="desc">${def.desc}</div>
          <div class="meta">${nextCost == null ? 'Макс' : 'Купить 🪙 ' + nextCost}</div>`;
        if (nextCost != null) el.onclick = () => this.buyAbilityUpgrade(def.id);
        abBox.appendChild(el);
      }
    }

    this.renderHub();
  },

  buyMetaPerk(id) {
    const def = META_PERKS.find((p) => p.id === id);
    if (!def) return;
    const lv = this.metaPerks[id] || 0;
    if (lv >= def.max) return;
    const cost = def.cost[lv];
    if (this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.metaPerks[id] = lv + 1;
    this.persist();
    this.renderBoosters();
    sfx.shop();
  },

  buyAbilityUpgrade(id) {
    const lv = this.abilityLevels[id] || 0;
    if (lv >= ABILITY_MAX_LEVEL) return;
    const cost = abilityUpgradeCost(lv);
    if (cost == null || this.bankCoins < cost) { sfx.hurt(); return; }
    this.bankCoins -= cost;
    this.abilityLevels[id] = lv + 1;
    this.persist();
    this.renderBoosters();
    sfx.shop();
  },

  setHubTab(tab) {
    if (tab === 'book') {
      this.hubTab = 'book';
      this.hubScreen = 'book';
    } else if (tab === 'gear') {
      this.hubTab = 'gear';
      this.hubScreen = 'gear';
    } else {
      this.hubTab = 'prep';
      this.hubScreen = 'prep';
    }
    this.renderHub();
    sfx.click();
  },

  renderHub() {
    const bankEl = document.getElementById('boosters-bank');
    const recordEl = document.getElementById('boosters-record');
    if (bankEl) bankEl.textContent = this.bankCoins;
    if (recordEl) recordEl.textContent = this.highScore;
    const verEl = document.getElementById('hub-version');
    if (verEl) verEl.textContent = typeof SALE_VERSION !== 'undefined' ? 'v' + SALE_VERSION : '';
    this.gameMode = 'sale';
    if (!this.hubScreen || this.hubScreen === 'modes') this.hubScreen = 'prep';
    if (!this.hubTab) this.hubTab = 'prep';

    const onPrep = this.hubScreen === 'prep';
    const onGear = this.hubScreen === 'gear';
    const onBook = this.hubScreen === 'book';

    document.getElementById('hub-pane-prep').classList.toggle('on', onPrep);
    const paneGear = document.getElementById('hub-pane-gear');
    if (paneGear) paneGear.classList.toggle('on', onGear);
    document.getElementById('hub-pane-book').classList.toggle('on', onBook);

    const tabPrep = document.getElementById('hub-tab-prep');
    const tabGear = document.getElementById('hub-tab-gear');
    const tabBook = document.getElementById('hub-tab-book');
    if (tabPrep) {
      tabPrep.classList.toggle('on', onPrep);
      tabPrep.textContent = 'Подготовка · Распродажа';
    }
    if (tabGear) tabGear.classList.toggle('on', onGear);
    if (tabBook) tabBook.classList.toggle('on', onBook);

    const saleBox = document.getElementById('hub-sale-loadout');
    if (saleBox) saleBox.style.display = '';

    if (onBook) this.renderComplaintBook();
    if (onGear && this.renderEquipHub) this.renderEquipHub();
    if (!onPrep) return;

    this.renderSaleHubLoadout();
  },
});
