/** Хаб подготовки: усилители, мета-перки, лоадаут. */

Object.assign(Game.prototype, {
  isBoostersOpen() {
    return document.getElementById('boosters-overlay')?.classList.contains('show');
  },

  formatHubGold(amount) {
    return (amount | 0).toLocaleString('ru-RU');
  },

  formatHubPrice(amount) {
    return 'ЦЕНА: ' + this.formatHubGold(amount) + ' ЗОЛОТА';
  },

  createHubShopCard({ ico, name, desc, priceText, extraClass, disabled, onClick }) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hub-shop-item' + (extraClass ? ' ' + extraClass : '');
    el.innerHTML = `<div class="hub-shop-item__top">`
      + `<div class="hub-shop-item__icon">${ico || '◆'}</div>`
      + `<div class="hub-shop-item__info">`
      + `<div class="hub-shop-item__name">${name || ''}</div>`
      + `<div class="hub-shop-item__desc">${desc || ''}</div>`
      + `</div></div>`
      + `<div class="hub-shop-item__price">${priceText || ''}</div>`;
    if (disabled) {
      el.disabled = true;
      el.classList.add('is-locked');
    } else if (onClick) {
      el.onclick = onClick;
    }
    return el;
  },

  openBoosters(opts = {}) {
    this.hideOverlays();
    this.inMainMenu = false;
    this.inHub = false;
    this.paused = true;
    const tab = opts.tab === 'gear' || opts.tab === 'book' ? opts.tab : 'prep';
    this.hubScreen = tab;
    this.hubTab = tab;
    if (tab === 'prep' && !this.hubPrepTab) this.hubPrepTab = 'passives';
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
    if (bankEl) bankEl.textContent = this.formatHubGold(this.bankCoins);
    if (recordEl) recordEl.textContent = this.formatHubGold(this.highScore);

    this.renderPrepPassives();
    this.renderHub();
  },

  renderPrepPassives() {
    const box = document.getElementById('hub-prep-passives');
    if (!box) return;
    box.innerHTML = '';

    for (const def of META_PERKS) {
      const lv = this.metaPerks[def.id] || 0;
      const nextCost = lv >= def.max ? null : def.cost[lv];
      const maxed = nextCost == null;
      const extraClass = (lv > 0 ? 'is-owned' : '') + (maxed ? ' is-locked' : '');
      const priceText = maxed
        ? `КУПЛЕНО · ${lv}/${def.max}`
        : this.formatHubPrice(nextCost);
      const desc = def.desc + (lv > 0 ? ` · уровень ${lv}/${def.max}` : '');
      box.appendChild(this.createHubShopCard({
        ico: def.ico,
        name: def.name,
        desc,
        priceText,
        extraClass,
        disabled: maxed,
        onClick: maxed ? null : () => this.buyMetaPerk(def.id),
      }));
    }

    for (const pk of SALE_HUB_PASSIVES) {
      const lv = (this.saleStartPassives && this.saleStartPassives[pk.id]) || 0;
      const nextCost = lv >= pk.max ? null : pk.cost[lv];
      const maxed = nextCost == null;
      const extraClass = (lv > 0 ? 'is-owned' : '') + (maxed ? ' is-locked' : '');
      const priceText = maxed
        ? `КУПЛЕНО · ${lv}/${pk.max}`
        : this.formatHubPrice(nextCost);
      const desc = pk.desc + (lv > 0 ? ` · уровень ${lv}/${pk.max}` : '');
      box.appendChild(this.createHubShopCard({
        ico: pk.ico,
        name: pk.name,
        desc,
        priceText,
        extraClass,
        disabled: maxed,
        onClick: maxed ? null : () => this.buySaleStartPassive(pk.id),
      }));
    }
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

  setHubPrepTab(tab) {
    if (tab !== 'passives' && tab !== 'weapons') return;
    this.hubPrepTab = tab;
    this.applyHubPrepTab();
    sfx.click();
  },

  applyHubPrepTab() {
    const tab = this.hubPrepTab || 'passives';
    const onPass = tab === 'passives';
    document.getElementById('hub-tab-passives')?.classList.toggle('on', onPass);
    document.getElementById('hub-tab-weapons')?.classList.toggle('on', !onPass);
    document.getElementById('hub-prep-passives')?.classList.toggle('on', onPass);
    document.getElementById('hub-sale-weapons')?.classList.toggle('on', !onPass);
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
    if (bankEl) bankEl.textContent = this.formatHubGold(this.bankCoins);
    if (recordEl) recordEl.textContent = this.formatHubGold(this.highScore);
    const verEl = document.getElementById('hub-version');
    if (verEl) verEl.textContent = typeof SALE_VERSION !== 'undefined' ? 'v' + SALE_VERSION : '';
    this.gameMode = 'sale';
    if (!this.hubScreen || this.hubScreen === 'modes') this.hubScreen = 'prep';
    if (!this.hubTab) this.hubTab = 'prep';
    if (!this.hubPrepTab) this.hubPrepTab = 'passives';

    const onPrep = this.hubScreen === 'prep';
    const onGear = this.hubScreen === 'gear';
    const onBook = this.hubScreen === 'book';

    const titleEl = document.getElementById('hub-header-title');
    if (titleEl) {
      titleEl.textContent = onGear ? 'ГАРДЕРОБ' : (onBook ? 'ЖАЛОБЫ' : 'УСИЛИТЕЛИ');
    }

    document.getElementById('hub-pane-prep').classList.toggle('on', onPrep);
    const paneGear = document.getElementById('hub-pane-gear');
    if (paneGear) paneGear.classList.toggle('on', onGear);
    document.getElementById('hub-pane-book').classList.toggle('on', onBook);

    const shopTabs = document.querySelector('.hub-shop-tabs');
    if (shopTabs) shopTabs.style.display = onPrep ? '' : 'none';

    if (onPrep) this.applyHubPrepTab();

    if (onBook) this.renderComplaintBook();
    if (onGear && this.renderEquipHub) this.renderEquipHub();
    if (!onPrep) return;

    this.renderSaleHubLoadout();
  },
});
