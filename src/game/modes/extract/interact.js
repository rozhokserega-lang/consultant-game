/**
 * Вылазка: взаимодействие с NPC, лутом и лифтом.
 */
'use strict';

Object.assign(Game.prototype, {
  showExtractBanner(text, t) {
    this._extractBanner = { text: text || '', t: t == null ? 2.8 : t };
  },

  getExtractInteractables() {
    const list = [];
    if (this.extractElevator) {
      const el = this.extractElevator;
      list.push({
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        label: el.label,
        prompt: el.prompt,
        role: el.role,
        locked: !!el.locked,
        lockedBy: el.lockedBy,
      });
    }
    if (this.extractNpcs) {
      for (const npc of this.extractNpcs) list.push(npc);
    }
    if (this.extractPhase === 'raid') {
      for (const loot of this.extractLoot || []) {
        if (loot.taken) continue;
        if (typeof this.isExtractLootFocusable === 'function' && !this.isExtractLootFocusable(loot)) continue;
        list.push({
          x: loot.x,
          y: loot.y,
          role: 'loot',
          prompt: 'Взаимодействовать',
          loot,
          locked: !this.isExtractLootUnlocked(loot),
        });
      }
    }
    return list;
  },

  findExtractFocus() {
    if (!this.player) return null;
    let best = null;
    let bestD = EXTRACT_INTERACT_R;
    for (const it of this.getExtractInteractables()) {
      const d = dist(this.player.x, this.player.y, it.x, it.y);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  },

  tickExtractInteract(dt) {
    if (this._extractInteractCd > 0) this._extractInteractCd -= dt;
    this.extractFocus = this.findExtractFocus();
    this.refreshExtractInteractBtn();
  },

  tryExtractInteract() {
    if (this.paused || this.shopping || this.gameOver) return false;
    if (this._extractInteractCd > 0) return false;
    const focus = this.extractFocus || this.findExtractFocus();
    if (!focus) return false;
    this._extractInteractCd = 0.35;
    sfx.click();

    if (focus.role === 'elevator') {
      this.startExtractRaid({ floor: 1 });
      return true;
    }
    if (focus.role === 'elevator_exit') {
      if (focus.locked || (this.extractElevator && this.extractElevator.locked)) {
        this.showExtractBanner('Лифт охраняет босс — сначала победи его');
        return true;
      }
      this.openExtractEvacChoice();
      return true;
    }
    if (focus.role === 'loot') {
      if (!this.isExtractLootUnlocked(focus.loot)) {
        this.showExtractBanner('Сначала убери охрану');
        return true;
      }
      this.tryPickupExtractLoot(focus.loot);
      return true;
    }
    if (focus.role === 'vendor') {
      this.openExtractShop();
      return true;
    }
    if (focus.role === 'tuner') {
      this.openExtractTuner();
      return true;
    }
    if (focus.role === 'buyer') {
      this.openExtractBuyer();
      return true;
    }
    if (focus.role === 'coach') {
      this.openExtractCoach();
      return true;
    }
    if (focus.role === 'trainer') {
      this.openExtractCoach();
      return true;
    }
    return false;
  },
});
