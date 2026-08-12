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
    const box = document.getElementById('extract-confirm');
    if (box) box.hidden = true;
    if (root) root.classList.remove('show', 'extract-confirm-open');
    this._extractShopMode = null;
    this._extractConfirmOnOk = null;
    this._extractConfirmAlone = false;
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
    const insured = this.extractRunInsurance && this.extractRunInsurance.item;
    this._extractShopSetHeader(
      '🎒 Снаряжение Игоря',
      `Монеты: <b>${meta.coins | 0}</b> · Слоты: <b>${meta.backpackSlots | 0}</b>`
        + (insured ? ` · 🛡️ ${insured.name}` : ''),
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = '<p class="extract-shop-empty">Крупный лут = 2 слота. Страховка — 1 предмет на забег.</p>';
    }
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    for (const item of EXTRACT_VENDOR_STOCK) {
      let price = item.price | 0;
      let soldOut = false;
      let label = price + '🪙';
      if (item.kind === 'slot') {
        price = extractNextSlotPrice(meta.backpackSlots);
        soldOut = meta.backpackSlots >= EXTRACT_BACKPACK_MAX_SLOTS || price <= 0;
        label = soldOut ? 'макс' : (price + '🪙');
      } else if (item.kind === 'insurance') {
        price = (typeof EXTRACT_INSURANCE_PRICE !== 'undefined') ? EXTRACT_INSURANCE_PRICE : item.price;
        soldOut = !!this.extractRunInsurance;
        label = soldOut ? 'уже есть' : (price + '🪙');
      }
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item';
      row.disabled = !!soldOut;
      row.innerHTML = `<span class="extract-shop-ico">${item.ico}</span>
        <span class="extract-shop-body">
          <b>${item.name}</b>
          <small>${item.desc}</small>
        </span>
        <span class="extract-shop-price">${label}</span>`;
      if (!soldOut) row.addEventListener('click', () => this.buyExtractVendorItem(item.id));
      list.appendChild(row);
    }
  },

  renderExtractInsurancePanel() {
    const meta = this.ensureExtractMeta();
    this._extractShopMode = 'insurance';
    this._extractShopSetHeader(
      '🛡️ Страховка',
      `Выбери предмет · ${(typeof EXTRACT_INSURANCE_PRICE !== 'undefined') ? EXTRACT_INSURANCE_PRICE : 100}🪙 · Монеты: <b>${meta.coins | 0}</b>`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = '<p class="extract-shop-empty">При смерти этот предмет вернётся на парковку.</p>';
    }
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    const pack = this.extractBackpack || [];
    let any = false;
    pack.forEach((it, idx) => {
      if (!it || it.kind === 'bulkPad') return;
      any = true;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item';
      const slots = extractItemSlotSize(it);
      row.innerHTML = `<span class="extract-shop-ico">${it.ico || '📦'}</span>
        <span class="extract-shop-body">
          <b>${it.name || 'Предмет'}</b>
          <small>${it.kind === 'gear' ? 'Мод' : 'Лут'}${slots > 1 ? ' · ' + slots + ' слота' : ''}</small>
        </span>
        <span class="extract-shop-price">🛡️</span>`;
      row.addEventListener('click', () => this.buyExtractInsuranceAt(idx));
      list.appendChild(row);
    });
    if (!any) {
      const empty = document.createElement('p');
      empty.className = 'extract-shop-empty';
      empty.textContent = 'Рюкзак пуст — сначала положи лут или мод.';
      list.appendChild(empty);
    }
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'extract-shop-item';
    back.innerHTML = `<span class="extract-shop-ico">←</span>
      <span class="extract-shop-body"><b>Назад к Игорю</b><small>Без покупки</small></span>
      <span class="extract-shop-price"></span>`;
    back.addEventListener('click', () => {
      this._extractShopMode = 'vendor';
      this.renderExtractVendorPanel();
    });
    list.appendChild(back);
  },

  renderExtractBuyerPanel() {
    const meta = this.ensureExtractMeta();
    const pack = this.extractBackpack || [];
    let count = 0;
    let total = 0;
    for (const it of pack) {
      if (!it || it.kind === 'bulkPad') continue;
      count++;
      total += Math.round((it.value || 0) * EXTRACT_SELL_RATE);
    }
    this._extractShopSetHeader(
      '💵 Скупка Маши',
      `Монеты: <b>${meta.coins | 0}</b> · В рюкзаке: <b>${count}</b> (~${total}🪙, курс ${Math.round(EXTRACT_SELL_RATE * 100)}%)`,
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
        if (!it || it.kind === 'bulkPad') return;
        const price = Math.round((it.value || 0) * EXTRACT_SELL_RATE);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'extract-shop-item';
        const tip = it.kind === 'gear' ? 'Мод оружия · можно продать'
          : (extractItemSlotSize(it) > 1 ? 'Крупный лут · 2 слота' : 'Продать Маше');
        row.innerHTML = `<span class="extract-shop-ico">${it.ico || '📦'}</span>
          <span class="extract-shop-body">
            <b>${it.name || 'Лут'}${it.insured ? ' 🛡️' : ''}</b>
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
    const tot = meta.totalExtractedValue | 0;
    this._extractShopSetHeader(
      '📚 Навыки Семёна',
      `Стартер: <b>${(curDef && curDef.ico) || ''} ${(curDef && curDef.name) || cur}</b> · Вынос: <b>${tot}</b>🪙`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = '<p class="extract-shop-empty">2 этаж — после босса лифта · 3 VIP — 🪪 на 2-м. Клик по слоту — выбросить.</p>';
    }
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    for (const skill of EXTRACT_STARTER_SKILLS) {
      const unlocked = this.isExtractStarterUnlocked(skill.id);
      const need = (EXTRACT_STARTER_UNLOCKS && EXTRACT_STARTER_UNLOCKS[skill.id]) || 0;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item' + (skill.id === cur ? ' sel' : '');
      row.disabled = !unlocked;
      row.innerHTML = `<span class="extract-shop-ico">${skill.ico}</span>
        <span class="extract-shop-body">
          <b>${skill.name}</b>
          <small>${unlocked ? skill.desc : ('🔒 вынос ' + need + '🪙')}</small>
        </span>
        <span class="extract-shop-price">${!unlocked ? '🔒' : (skill.id === cur ? '✓' : 'Выбрать')}</span>`;
      if (unlocked) row.addEventListener('click', () => this.pickExtractStarterSkill(skill.id));
      list.appendChild(row);
    }
  },

  renderExtractTunerPanel() {
    const meta = this.ensureExtractMeta();
    const pack = this.extractBackpack || [];
    const free = pack.filter((s) => !s).length;
    const gearN = pack.filter((s) => s && s.kind === 'gear').length;
    const need = (typeof EXTRACT_MOD_SET_NEED !== 'undefined') ? EXTRACT_MOD_SET_NEED : 3;
    this._extractShopSetHeader(
      '🔧 Моды Коли',
      `Монеты: <b>${meta.coins | 0}</b> · Свободно: <b>${free}</b> · Модов: <b>${gearN}</b>/${need} сет`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = gearN >= need
        ? `<p class="extract-shop-empty">Сет ${need}+ активен в рейде: +урон и скорость.</p>`
        : `<p class="extract-shop-empty">Моды сгорают при смерти. Сет из ${need}+ даёт бонус в рейде.</p>`;
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
    const empty = this.findExtractPackSpace(1);
    if (empty < 0) {
      this.showExtractBanner('В рюкзаке нет места — купи карман у Игоря');
      sfx.hurt();
      return;
    }
    meta.coins -= item.price;
    this.placeExtractPackItem(empty, {
      id: item.id,
      name: item.name,
      ico: item.ico,
      kind: 'gear',
      passiveId: item.passiveId,
      passiveLv: item.passiveLv || 1,
      value: item.value != null ? item.value : Math.max(1, Math.floor(item.price * 0.5)),
      slots: 1,
    });
    this.showExtractBanner(`${item.ico} ${item.name} в рюкзаке · сработает в рейде`);
    sfx.coin();
    this.persistExtract();
    this.refreshExtractHud();
    this.renderExtractTunerPanel();
  },

  buyExtractVendorItem(id) {
    const meta = this.ensureExtractMeta();
    const item = EXTRACT_VENDOR_STOCK.find((x) => x.id === id);
    if (!item) return;

    if (item.kind === 'insurance') {
      if (this.extractRunInsurance) {
        this.showExtractBanner('Страховка уже куплена на этот забег');
        return;
      }
      this.renderExtractInsurancePanel();
      return;
    }

    if (item.kind === 'slot') {
      const price = extractNextSlotPrice(meta.backpackSlots);
      if (meta.backpackSlots >= EXTRACT_BACKPACK_MAX_SLOTS || price <= 0) {
        this.showExtractBanner('Рюкзак уже максимальный');
        return;
      }
      if ((meta.coins | 0) < price) {
        this.showExtractBanner('Не хватает монет вылазки');
        sfx.hurt();
        return;
      }
      meta.coins -= price;
      meta.backpackSlots += 1;
      this.syncExtractBackpackSize();
      this.showExtractBanner(`Рюкзак: ${meta.backpackSlots} слотов (−${price}🪙)`);
      sfx.coin();
      this.persistExtract();
      this.refreshExtractHud();
      this.renderExtractVendorPanel();
      return;
    }

    if ((meta.coins | 0) < item.price) {
      this.showExtractBanner('Не хватает монет вылазки');
      sfx.hurt();
      return;
    }
    const empty = this.findExtractPackSpace(1);
    if (empty < 0) {
      this.showExtractBanner('В рюкзаке нет места');
      sfx.hurt();
      return;
    }
    meta.coins -= item.price;
    const entry = {
      id: item.id,
      name: item.name,
      ico: item.ico,
      value: item.value != null ? item.value : Math.max(1, Math.floor(item.price * 0.5)),
      slots: 1,
    };
    if (item.kind === 'consumable') {
      entry.kind = 'consumable';
      entry.use = item.use || 'heal';
      entry.heal = item.heal != null ? item.heal : 1;
    }
    this.placeExtractPackItem(empty, entry);
    this.showExtractBanner(`${item.ico} ${item.name} в рюкзаке`);
    sfx.coin();
    this.persistExtract();
    this.refreshExtractHud();
    this.renderExtractVendorPanel();
  },

  buyExtractInsuranceAt(idx) {
    const meta = this.ensureExtractMeta();
    const price = (typeof EXTRACT_INSURANCE_PRICE !== 'undefined') ? EXTRACT_INSURANCE_PRICE : 100;
    if (this.extractRunInsurance) {
      this.showExtractBanner('Страховка уже активна');
      return;
    }
    const pack = this.extractBackpack || [];
    let it = pack[idx];
    if (it && it.kind === 'bulkPad') it = pack[it.link | 0];
    if (!it || it.kind === 'bulkPad') {
      this.showExtractBanner('Пустой слот');
      return;
    }
    if ((meta.coins | 0) < price) {
      this.showExtractBanner('Не хватает монет вылазки');
      sfx.hurt();
      return;
    }
    // снять старую пометку
    for (const x of pack) {
      if (x && x.insured) delete x.insured;
    }
    meta.coins -= price;
    it.insured = true;
    this.extractRunInsurance = {
      item: Object.assign({}, it),
    };
    delete this.extractRunInsurance.item.insured;
    this.showExtractBanner(`🛡️ Застраховано: ${it.ico || ''} ${it.name}`);
    sfx.coin();
    this.persistExtract();
    this.refreshExtractHud();
    this._extractShopMode = 'vendor';
    this.renderExtractVendorPanel();
  },

  sellExtractLootAt(idx) {
    const meta = this.ensureExtractMeta();
    const it = this.removeExtractPackAt(idx);
    if (!it) return;
    if (this.extractRunInsurance && this.extractRunInsurance.item
      && this.extractRunInsurance.item.id === it.id
      && this.extractRunInsurance.item.name === it.name) {
      this.extractRunInsurance = null;
    }
    const price = Math.round((it.value || 0) * EXTRACT_SELL_RATE);
    meta.coins = (meta.coins | 0) + price;
    this.showExtractBanner(`Маша купила ${it.ico || ''} ${it.name} за ${price}🪙`);
    sfx.coin();
    this.persistExtract();
    this.refreshExtractHud();
    this.renderExtractBuyerPanel();
  },

  sellAllExtractLoot() {
    const meta = this.ensureExtractMeta();
    let total = 0;
    let n = 0;
    for (;;) {
      const pack = this.extractBackpack || [];
      const idx = pack.findIndex((it) => it && it.kind !== 'bulkPad');
      if (idx < 0) break;
      const removed = this.removeExtractPackAt(idx);
      if (!removed) break;
      total += Math.round((removed.value || 0) * EXTRACT_SELL_RATE);
      n++;
    }
    this.extractRunInsurance = null;
    if (n === 0) return;
    meta.coins = (meta.coins | 0) + total;
    this.showExtractBanner(`Продано ${n} шт. · +${total}🪙 (комиссия Маши)`);
    sfx.coin();
    this.persistExtract();
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
    if (!this.isExtractStarterUnlocked(id)) {
      const need = (EXTRACT_STARTER_UNLOCKS && EXTRACT_STARTER_UNLOCKS[id]) || 0;
      this.showExtractBanner(`Нужен вынос ${need}🪙`);
      sfx.hurt();
      return;
    }
    const meta = this.ensureExtractMeta();
    meta.starterWeapon = id;
    this.showExtractBanner(`Стартовый навык: ${skill.ico} ${skill.name}`);
    sfx.click();
    this.persistExtract();
    this.renderExtractCoachPanel();
  },

  /** Диалог подтверждения поверх extract-shop overlay. */
  openExtractConfirm(opts) {
    opts = opts || {};
    const root = document.getElementById('extract-shop-overlay');
    const box = document.getElementById('extract-confirm');
    const textEl = document.getElementById('extract-confirm-text');
    const okBtn = document.getElementById('extract-confirm-ok');
    const cancelBtn = document.getElementById('extract-confirm-cancel');
    if (!root || !box || !textEl || !okBtn || !cancelBtn) return;

    this._extractConfirmAlone = !this.shopping;
    if (this._extractConfirmAlone) {
      this.shopping = true;
      this._extractShopMode = null;
    }

    this._extractConfirmOnOk = typeof opts.onOk === 'function' ? opts.onOk : null;
    textEl.textContent = opts.text || 'Подтвердить?';
    const setBtnText = (el, text) => {
      if (!el) return;
      if (typeof UiButton !== 'undefined' && UiButton.setText) UiButton.setText(el, text);
      else {
        const label = el.querySelector && el.querySelector('.button__label');
        if (label) label.textContent = text;
        else el.textContent = text;
      }
    };
    setBtnText(okBtn, opts.okLabel || 'Да');
    setBtnText(cancelBtn, opts.cancelLabel || 'Отмена');

    box.hidden = false;
    root.classList.add('show', 'extract-confirm-open');
    this.paused = true;
    this.refreshMusicState();
    sfx.click();
  },

  closeExtractConfirm(runOk) {
    const root = document.getElementById('extract-shop-overlay');
    const box = document.getElementById('extract-confirm');
    if (box) box.hidden = true;
    const onOk = this._extractConfirmOnOk;
    this._extractConfirmOnOk = null;
    if (root) root.classList.remove('extract-confirm-open');

    const alone = this._extractConfirmAlone;
    this._extractConfirmAlone = false;
    const shopOpen = this.shopping && this._extractShopMode;
    if (alone || !shopOpen) {
      if (root) root.classList.remove('show');
      if (this.gameMode === 'extract') {
        this.shopping = false;
        this.paused = false;
      }
    }
    this.refreshMusicState();
    if (runOk && onOk) onOk();
  },

  onExtractSlotClick(idx) {
    if (this.gameMode !== 'extract') return;
    if (this.shopping && this._extractShopMode && this._extractShopMode !== 'evac') return;
    const pack = this.extractBackpack || [];
    let i = idx | 0;
    let it = pack[i];
    if (!it) return;
    if (it.kind === 'bulkPad') {
      i = it.link | 0;
      it = pack[i];
      if (!it || it.kind === 'bulkPad') return;
    }

    const canHeal = it.kind === 'consumable' && it.use === 'heal'
      && this.extractPhase === 'raid' && this.player
      && this.player.hp < this.player.maxHp;

    if (canHeal) {
      const heal = Math.max(1, it.heal | 0 || 1);
      this.openExtractConfirm({
        text: `Использовать ${it.ico || ''} ${it.name}? +${heal}❤`,
        okLabel: 'Вылечиться',
        cancelLabel: 'Отмена',
        onOk: () => this.useExtractMedkitAt(i),
      });
      return;
    }

    const slots = extractItemSlotSize(it);
    const ins = it.insured ? ' (страховка снимется)' : '';
    this.openExtractConfirm({
      text: `Выбросить ${it.ico || ''} ${it.name}? Слоты освободятся${slots > 1 ? ` (${slots})` : ''}.${ins}`,
      okLabel: 'Уничтожить',
      cancelLabel: 'Оставить',
      onOk: () => this.discardExtractPackAt(i),
    });
  },

  discardExtractPackAt(idx) {
    const it = this.removeExtractPackAt(idx);
    if (!it) return;
    if (this.extractRunInsurance && this.extractRunInsurance.item
      && this.extractRunInsurance.item.id === it.id
      && this.extractRunInsurance.item.name === it.name) {
      this.extractRunInsurance = null;
    }
    this.showExtractBanner(`🗑️ ${it.ico || ''} ${it.name} выброшен`);
    sfx.hurt();
    this.persistExtract();
    this.refreshExtractHud();
  },

  useExtractMedkitAt(idx) {
    if (this.extractPhase !== 'raid' || !this.player) return;
    const pack = this.extractBackpack || [];
    let it = pack[idx];
    if (it && it.kind === 'bulkPad') it = pack[it.link | 0];
    if (!it || it.kind !== 'consumable' || it.use !== 'heal') return;
    if (this.player.hp >= this.player.maxHp) {
      this.showExtractBanner('HP полное');
      return;
    }
    const heal = Math.max(1, it.heal | 0 || 1);
    const removed = this.removeExtractPackAt(idx);
    if (!removed) return;
    this.player.hp = Math.min(this.player.maxHp, (this.player.hp | 0) + heal);
    this.showExtractBanner(`🩹 +${heal}❤`);
    if (typeof this.spawnAnimFx === 'function') {
      this.spawnAnimFx('afx_heal', this.player.x, this.player.y - 10, { life: 0.45, scale: 0.75, vy: -18 });
    }
    sfx.pickup();
    this.persistExtract();
    this.refreshExtractHud();
  },

  renderExtractEvacPanel() {
    const floor = this.extractFloor || 1;
    const maxFloor = (typeof EXTRACT_MAX_FLOOR !== 'undefined') ? EXTRACT_MAX_FLOOR : 1;
    const canGoUp = floor < maxFloor;
    const next = floor + 1;
    const unlockedUp = !canGoUp || this.canAscendExtractFloor(next);
    const lockHint = (typeof this.extractFloorLockHint === 'function')
      ? this.extractFloorLockHint(next)
      : '';
    const evacLeft = (this._extractEvacT != null && this._extractEvacT > 0)
      ? Math.ceil(this._extractEvacT)
      : null;
    this._extractShopSetHeader(
      'Лифт',
      (evacLeft != null ? `⏳ ${evacLeft}с до подкрепления · ` : '')
        + (canGoUp
          ? `Этаж ${floor}. Рюкзак и HP сохраняются при подъёме.`
          : `Этаж ${floor}. Дальше только вниз — в убежище.`),
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = canGoUp && !unlockedUp
        ? `<p class="extract-shop-empty">${lockHint || 'Этаж выше закрыт.'}</p>`
        : (canGoUp && next === 3 && this.hasExtractVipCard && this.hasExtractVipCard()
          ? '<p class="extract-shop-empty">🪪 VIP-карта активна — можно подняться.</p>'
          : '');
    }
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
      up.disabled = !unlockedUp;
      const nextDef = this.getExtractFloorDef(next);
      up.innerHTML = `<span class="extract-shop-ico">⬆️</span>
        <span class="extract-shop-body">
          <b>На этаж выше</b>
          <small>${unlockedUp
            ? (nextDef.label + ': мобы сильнее, лут дороже')
            : (next === 3
              ? '🔒 нужна VIP-карта на 2 этаже'
              : (next === 2 ? '🔒 победи босса лифта' : lockHint))}</small>
        </span>
        <span class="extract-shop-price">${unlockedUp ? '↑' : '🔒'}</span>`;
      if (unlockedUp) {
        up.addEventListener('click', () => {
          this.closeExtractShop();
          this.ascendExtractFloor();
        });
      }
      list.appendChild(up);
    }
  },
});
