/**
 * Вылазка: панели Игоря / Коли / Маши / Семёна на одном оверлее.
 */
'use strict';

Object.assign(Game.prototype, {
  _extractShopMode: null,

  openExtractPanel(mode) {
    this._extractShopMode = mode;
    this.shopping = true;
    this.paused = true;
    const root = document.getElementById('extract-shop-overlay');
    if (!root) return;
    if (mode === 'vendor') this.renderExtractVendorPanel();
    else if (mode === 'buyer') this.renderExtractBuyerPanel();
    else if (mode === 'coach') this.renderExtractCoachPanel();
    else if (mode === 'tuner') this.renderExtractTunerPanel();
    else if (mode === 'evac') this.renderExtractEvacPanel();
    root.classList.add('show');
    this.refreshMusicState();
  },

  openExtractShop() {
    this.openExtractPanel('vendor');
  },

  openExtractBuyer() {
    this.openExtractPanel('buyer');
  },

  openExtractCoach() {
    this.openExtractPanel('coach');
  },

  openExtractTuner() {
    this.openExtractPanel('tuner');
  },

  openExtractEvacChoice() {
    this.openExtractPanel('evac');
  },

  closeExtractShop() {
    const root = document.getElementById('extract-shop-overlay');
    if (root) root.classList.remove('show');
    this._extractShopMode = null;
    if (this.gameMode === 'extract') {
      this.shopping = false;
      this.paused = false;
    }
    this.refreshMusicState();
  },

  _extractShopSetHeader(title, metaHtml) {
    const titleEl = document.getElementById('extract-shop-title');
    if (titleEl) titleEl.textContent = title;
    const metaEl = document.getElementById('extract-shop-meta');
    if (metaEl) metaEl.innerHTML = metaHtml;
  },

  renderExtractVendorPanel() {
    const meta = this.ensureExtractMeta();
    this._extractShopSetHeader(
      '🎒 Снаряжение Игоря',
      `Монеты: <b id="extract-shop-bank">${meta.coins | 0}</b> · Слоты: <b id="extract-shop-slots">${meta.backpackSlots | 0}</b>`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) extra.innerHTML = '';
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    for (const item of EXTRACT_VENDOR_STOCK) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item';
      row.innerHTML = `<span class="extract-shop-ico">${item.ico}</span>
        <span class="extract-shop-body">
          <b>${item.name}</b>
          <small>${item.desc}</small>
        </span>
        <span class="extract-shop-price">${item.price}🪙</span>`;
      row.addEventListener('click', () => this.buyExtractVendorItem(item.id));
      list.appendChild(row);
    }
  },

  renderExtractBuyerPanel() {
    const meta = this.ensureExtractMeta();
    const pack = this.extractBackpack || [];
    let count = 0;
    let total = 0;
    for (const it of pack) {
      if (!it) continue;
      count++;
      total += Math.round((it.value || 0) * EXTRACT_SELL_RATE);
    }
    this._extractShopSetHeader(
      '💵 Скупка Маши',
      `Монеты: <b>${meta.coins | 0}</b> · В рюкзаке: <b>${count}</b> (~${total}🪙)`,
    );
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    if (count === 0) {
      const empty = document.createElement('p');
      empty.className = 'extract-shop-empty';
      empty.textContent = 'Рюкзак пуст — принеси лут с этажа ТЦ.';
      list.appendChild(empty);
    } else {
      pack.forEach((it, idx) => {
        if (!it) return;
        const price = Math.round((it.value || 0) * EXTRACT_SELL_RATE);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'extract-shop-item';
        const tip = it.kind === 'gear' ? 'Мод оружия · можно продать' : 'Продать Маше';
        row.innerHTML = `<span class="extract-shop-ico">${it.ico || '📦'}</span>
          <span class="extract-shop-body">
            <b>${it.name || 'Лут'}</b>
            <small>${tip}</small>
          </span>
          <span class="extract-shop-price">+${price}🪙</span>`;
        row.addEventListener('click', () => this.sellExtractLootAt(idx));
        list.appendChild(row);
      });
    }
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = '';
      if (count > 0) {
        const all = document.createElement('button');
        all.type = 'button';
        all.className = 'extract-shop-item extract-shop-sell-all';
        all.innerHTML = `<span class="extract-shop-ico">💸</span>
          <span class="extract-shop-body"><b>Продать всё</b><small>${count} шт. за ${total}🪙</small></span>
          <span class="extract-shop-price">+${total}🪙</span>`;
        all.addEventListener('click', () => this.sellAllExtractLoot());
        extra.appendChild(all);
      }
    }
  },

  renderExtractCoachPanel() {
    const meta = this.ensureExtractMeta();
    const cur = meta.starterWeapon || EXTRACT_DEFAULT_STARTER;
    const curDef = EXTRACT_STARTER_SKILLS.find((s) => s.id === cur);
    this._extractShopSetHeader(
      '📚 Навыки Семёна',
      `Стартовый навык вылазки: <b>${(curDef && curDef.ico) || ''} ${(curDef && curDef.name) || cur}</b>`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) extra.innerHTML = '';
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    for (const skill of EXTRACT_STARTER_SKILLS) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item' + (skill.id === cur ? ' sel' : '');
      row.innerHTML = `<span class="extract-shop-ico">${skill.ico}</span>
        <span class="extract-shop-body">
          <b>${skill.name}</b>
          <small>${skill.desc}</small>
        </span>
        <span class="extract-shop-price">${skill.id === cur ? '✓' : 'Выбрать'}</span>`;
      row.addEventListener('click', () => this.pickExtractStarterSkill(skill.id));
      list.appendChild(row);
    }
  },

  renderExtractTunerPanel() {
    const meta = this.ensureExtractMeta();
    const pack = this.extractBackpack || [];
    const free = pack.filter((s) => !s).length;
    const gearN = pack.filter((s) => s && s.kind === 'gear').length;
    this._extractShopSetHeader(
      '🔧 Моды Коли',
      `Монеты: <b>${meta.coins | 0}</b> · Свободно слотов: <b>${free}</b> · Модов в рюкзаке: <b>${gearN}</b>`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = '<p class="extract-shop-empty">Моды работают только в рейде и сгорают при смерти.</p>';
    }
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    const stock = (typeof EXTRACT_GEAR_STOCK !== 'undefined') ? EXTRACT_GEAR_STOCK : [];
    for (const item of stock) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item';
      row.innerHTML = `<span class="extract-shop-ico">${item.ico}</span>
        <span class="extract-shop-body">
          <b>${item.name}</b>
          <small>${item.desc}</small>
        </span>
        <span class="extract-shop-price">${item.price}🪙</span>`;
      row.addEventListener('click', () => this.buyExtractGearItem(item.id));
      list.appendChild(row);
    }
  },

  buyExtractGearItem(id) {
    const meta = this.ensureExtractMeta();
    const stock = (typeof EXTRACT_GEAR_STOCK !== 'undefined') ? EXTRACT_GEAR_STOCK : [];
    const item = stock.find((x) => x.id === id);
    if (!item) return;
    if ((meta.coins | 0) < item.price) {
      this.showExtractBanner('Не хватает монет вылазки');
      sfx.hurt();
      return;
    }
    const empty = (this.extractBackpack || []).findIndex((s) => !s);
    if (empty < 0) {
      this.showExtractBanner('В рюкзаке нет места — купи карман у Игоря');
      sfx.hurt();
      return;
    }
    meta.coins -= item.price;
    this.extractBackpack[empty] = {
      id: item.id,
      name: item.name,
      ico: item.ico,
      kind: 'gear',
      passiveId: item.passiveId,
      passiveLv: item.passiveLv || 1,
      value: item.value != null ? item.value : Math.max(1, Math.floor(item.price * 0.5)),
    };
    this.showExtractBanner(`${item.ico} ${item.name} в рюкзаке · сработает в рейде`);
    sfx.coin();
    this.refreshExtractHud();
    this.renderExtractTunerPanel();
  },

  buyExtractVendorItem(id) {
    const meta = this.ensureExtractMeta();
    const item = EXTRACT_VENDOR_STOCK.find((x) => x.id === id);
    if (!item) return;
    if ((meta.coins | 0) < item.price) {
      this.showExtractBanner('Не хватает монет вылазки');
      sfx.hurt();
      return;
    }
    if (item.kind === 'slot') {
      if (meta.backpackSlots >= EXTRACT_BACKPACK_MAX_SLOTS) {
        this.showExtractBanner('Рюкзак уже максимальный');
        return;
      }
      meta.coins -= item.price;
      meta.backpackSlots += 1;
      this.extractBackpack.push(null);
      this.showExtractBanner(`Рюкзак: ${meta.backpackSlots} слотов`);
      sfx.coin();
    } else if (item.kind === 'trinket') {
      const empty = this.extractBackpack.findIndex((s) => !s);
      if (empty < 0) {
        this.showExtractBanner('В рюкзаке нет места');
        return;
      }
      meta.coins -= item.price;
      this.extractBackpack[empty] = {
        id: item.id,
        name: item.name,
        ico: item.ico,
        value: Math.max(1, Math.floor(item.price * 0.5)),
      };
      this.showExtractBanner(`${item.ico} ${item.name} в рюкзаке`);
      sfx.coin();
    }
    this.refreshExtractHud();
    this.renderExtractVendorPanel();
  },

  sellExtractLootAt(idx) {
    const meta = this.ensureExtractMeta();
    const pack = this.extractBackpack || [];
    const it = pack[idx];
    if (!it) return;
    const price = Math.round((it.value || 0) * EXTRACT_SELL_RATE);
    pack[idx] = null;
    meta.coins = (meta.coins | 0) + price;
    this.showExtractBanner(`Маша купила ${it.ico || ''} ${it.name} за ${price}🪙`);
    sfx.coin();
    this.refreshExtractHud();
    this.renderExtractBuyerPanel();
  },

  sellAllExtractLoot() {
    const meta = this.ensureExtractMeta();
    const pack = this.extractBackpack || [];
    let total = 0;
    let n = 0;
    for (let i = 0; i < pack.length; i++) {
      const it = pack[i];
      if (!it) continue;
      total += Math.round((it.value || 0) * EXTRACT_SELL_RATE);
      pack[i] = null;
      n++;
    }
    if (n === 0) return;
    meta.coins = (meta.coins | 0) + total;
    this.showExtractBanner(`Продано ${n} шт. · +${total}🪙`);
    sfx.coin();
    this.refreshExtractHud();
    this.renderExtractBuyerPanel();
  },

  pickExtractStarterSkill(id) {
    const skill = EXTRACT_STARTER_SKILLS.find((s) => s.id === id);
    if (!skill) return;
    if (typeof SALE_WEAPONS !== 'undefined' && !SALE_WEAPONS[id]) {
      this.showExtractBanner('Этот навык недоступен');
      return;
    }
    const meta = this.ensureExtractMeta();
    meta.starterWeapon = id;
    this.showExtractBanner(`Стартовый навык: ${skill.ico} ${skill.name}`);
    sfx.click();
    this.renderExtractCoachPanel();
  },

  renderExtractEvacPanel() {
    const floor = this.extractFloor || 1;
    const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
    const canGoUp = floor < maxFloor;
    this._extractShopSetHeader(
      'Лифт',
      canGoUp
        ? `Этаж ${floor}. Куда едем? Рюкзак и HP сохраняются при подъёме.`
        : `Этаж ${floor}. Дальше только вниз — в убежище.`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) extra.innerHTML = '';
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';

    const shelter = document.createElement('button');
    shelter.type = 'button';
    shelter.className = 'extract-shop-item extract-evac-shelter';
    shelter.innerHTML = `<span class="extract-shop-ico">🅿️</span>
      <span class="extract-shop-body">
        <b>В убежище</b>
        <small>Вернуться на парковку с лутом</small>
      </span>
      <span class="extract-shop-price">↓</span>`;
    shelter.addEventListener('click', () => {
      this.closeExtractShop();
      this.succeedExtractRaid();
    });
    list.appendChild(shelter);

    if (canGoUp) {
      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'extract-shop-item extract-evac-up';
      const nextDef = this.getExtractFloorDef(floor + 1);
      up.innerHTML = `<span class="extract-shop-ico">⬆️</span>
        <span class="extract-shop-body">
          <b>На этаж выше</b>
          <small>${nextDef.label}: мобы сильнее, лут дороже</small>
        </span>
        <span class="extract-shop-price">↑</span>`;
      up.addEventListener('click', () => {
        this.closeExtractShop();
        this.ascendExtractFloor();
      });
      list.appendChild(up);
    }
  },
});
