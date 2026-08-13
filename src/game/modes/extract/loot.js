/**
 * Вылазка: подбор лута в рюкзак на этаже (слоты, крупногабарит, баффы редкости).
 */
'use strict';

Object.assign(Game.prototype, {
  isExtractLootUnlocked(loot) {
    if (!loot || loot.taken) return false;
    if (!loot.lockedBy) return true;
    if (loot.locked) return false;
    return true;
  },

  /** Спрятанный лут (VIP-карта) виден только вблизи. */
  isExtractLootVisible(loot) {
    if (!loot || loot.taken) return false;
    if (!loot.hidden || !this.player) return true;
    const r = (typeof EXTRACT_HIDDEN_LOOT_REVEAL !== 'undefined') ? EXTRACT_HIDDEN_LOOT_REVEAL : 140;
    return dist(this.player.x, this.player.y, loot.x, loot.y) <= r;
  },

  isExtractLootFocusable(loot) {
    if (!this.isExtractLootVisible(loot)) return false;
    if (!loot.hidden || !this.player) return true;
    const r = (typeof EXTRACT_HIDDEN_LOOT_FOCUS !== 'undefined') ? EXTRACT_HIDDEN_LOOT_FOCUS : 110;
    return dist(this.player.x, this.player.y, loot.x, loot.y) <= r;
  },

  hasExtractVipCard() {
    for (const it of this.extractBackpack || []) {
      if (!it || it.kind === 'bulkPad') continue;
      if (it.id === 'vip_access_card' || it.key === 'floor3') return true;
    }
    return false;
  },

  /** Снять VIP-карту из рюкзака при подъёме 2→3. */
  consumeExtractVipCard() {
    const pack = this.extractBackpack || [];
    for (let i = 0; i < pack.length; i++) {
      const it = pack[i];
      if (!it || it.kind === 'bulkPad') continue;
      if (it.id === 'vip_access_card' || it.key === 'floor3') {
        this.removeExtractPackAt(i);
        this.refreshExtractHud();
        return true;
      }
    }
    return false;
  },

  /** Индекс свободного непрерывного ряда из need ячеек, или -1. */
  findExtractPackSpace(need) {
    need = Math.max(1, need | 0);
    const pack = this.extractBackpack || [];
    for (let i = 0; i <= pack.length - need; i++) {
      let ok = true;
      for (let k = 0; k < need; k++) {
        if (pack[i + k]) { ok = false; break; }
      }
      if (ok) return i;
    }
    return -1;
  },

  /** Положить предмет в pack[at], при slots>1 заполнить bulkPad. */
  placeExtractPackItem(at, item) {
    const pack = this.extractBackpack || [];
    const size = extractItemSlotSize(item);
    if (at < 0 || at + size > pack.length) return false;
    for (let k = 0; k < size; k++) {
      if (pack[at + k]) return false;
    }
    const entry = Object.assign({}, item, { slots: size });
    pack[at] = entry;
    for (let k = 1; k < size; k++) {
      pack[at + k] = { kind: 'bulkPad', link: at, ico: '⋯', name: entry.name };
    }
    return true;
  },

  /** Убрать предмет и его pad-ячейки. Возвращает копию предмета. */
  removeExtractPackAt(idx) {
    const pack = this.extractBackpack || [];
    let i = idx | 0;
    if (i < 0 || i >= pack.length) return null;
    let it = pack[i];
    if (!it) return null;
    if (it.kind === 'bulkPad') {
      i = it.link | 0;
      it = pack[i];
      if (!it || it.kind === 'bulkPad') return null;
    }
    const size = extractItemSlotSize(it);
    const copy = Object.assign({}, it);
    for (let k = 0; k < size; k++) pack[i + k] = null;
    return copy;
  },

  tryPickupExtractLoot(loot) {
    if (!this.isExtractLootUnlocked(loot) || loot.taken) return false;
    const need = Math.max(1, (loot.def && loot.def.slots) | 0 || 1);
    const at = this.findExtractPackSpace(need);
    if (at < 0) {
      this.showExtractBanner(need > 1
        ? `Нужно ${need} свободных слота подряд`
        : 'Рюкзак полон');
      sfx.hurt();
      return false;
    }
    const item = {
      id: loot.def.id,
      name: loot.def.name,
      ico: loot.def.ico,
      value: loot.def.value || 0,
      rarity: loot.def.rarity || 'common',
      slots: need,
    };
    if (loot.def.key) item.key = loot.def.key;
    if (loot.def.unlockWeapon) item.unlockWeapon = loot.def.unlockWeapon;
    if (!this.placeExtractPackItem(at, item)) {
      this.showExtractBanner('Рюкзак полон');
      sfx.hurt();
      return false;
    }
    loot.taken = true;
    if (loot.def.key === 'floor3') {
      this.refreshExtractHud();
      this.showExtractBanner('🪪 VIP-карта в рюкзаке — открыт 3 этаж', 3.2);
      sfx.win();
      return true;
    }
    if (loot.def.unlockWeapon) {
      this.refreshExtractHud();
      this.showExtractBanner(`${loot.def.ico} ${loot.def.name} — вынеси с этажа, чтобы открыть в распродаже`, 3.2);
      sfx.coin();
      return true;
    }
    this.applyExtractLootRarityBuff(item.rarity);
    this.refreshExtractHud();
    const bulky = need > 1 ? ` · ${need} слота` : '';
    let msg = `${loot.def.ico} ${loot.def.name} → рюкзак${bulky}`;
    if (this._extractLootBuff && this._extractLootBuff.label) {
      msg += ` · ${this._extractLootBuff.label}`;
    }
    this.showExtractBanner(msg);
    sfx.coin();
    return true;
  },

  applyExtractLootRarityBuff(rarity) {
    const table = (typeof EXTRACT_RARITY_BUFFS !== 'undefined') ? EXTRACT_RARITY_BUFFS : null;
    const buff = table && table[rarity];
    if (!buff) return;
    this._extractLootBuff = {
      speedMul: buff.speedMul || 1,
      t: buff.t || 15,
      label: buff.label || '',
    };
    if (buff.heal && this.player && this.extractPhase === 'raid') {
      this.player.hp = Math.min(this.player.maxHp, (this.player.hp | 0) + (buff.heal | 0));
    }
  },

  tickExtractLootBuff(dt) {
    const b = this._extractLootBuff;
    if (!b) return 1;
    b.t -= dt;
    if (b.t <= 0) {
      this._extractLootBuff = null;
      return 1;
    }
    return b.speedMul || 1;
  },

  getExtractLootFocus() {
    if (this.extractPhase !== 'raid' || !this.player) return null;
    let best = null;
    let bestD = EXTRACT_INTERACT_R;
    for (const loot of this.extractLoot || []) {
      if (loot.taken) continue;
      if (!this.isExtractLootFocusable(loot)) continue;
      const d = dist(this.player.x, this.player.y, loot.x, loot.y);
      if (d < bestD) {
        bestD = d;
        best = loot;
      }
    }
    return best;
  },
});
