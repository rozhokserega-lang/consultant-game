/**
 * Вылазка: подбор лута в рюкзак на этаже.
 */
'use strict';

Object.assign(Game.prototype, {
  isExtractLootUnlocked(loot) {
    if (!loot || loot.taken) return false;
    if (!loot.lockedBy) return true;
    // пока жив страж с этим lootId — закрыто
    if (loot.locked) return false;
    return true;
  },

  tryPickupExtractLoot(loot) {
    if (!this.isExtractLootUnlocked(loot) || loot.taken) return false;
    const pack = this.extractBackpack || [];
    const empty = pack.findIndex((s) => !s);
    if (empty < 0) {
      this.showExtractBanner('Рюкзак полон');
      sfx.hurt();
      return false;
    }
    pack[empty] = {
      id: loot.def.id,
      name: loot.def.name,
      ico: loot.def.ico,
      value: loot.def.value || 0,
      rarity: loot.def.rarity || 'common',
    };
    loot.taken = true;
    this.refreshExtractHud();
    this.showExtractBanner(`${loot.def.ico} ${loot.def.name} → рюкзак`);
    sfx.coin();
    return true;
  },

  getExtractLootFocus() {
    if (this.extractPhase !== 'raid' || !this.player) return null;
    let best = null;
    let bestD = EXTRACT_INTERACT_R;
    for (const loot of this.extractLoot || []) {
      if (loot.taken) continue;
      const d = dist(this.player.x, this.player.y, loot.x, loot.y);
      if (d < bestD) {
        bestD = d;
        best = loot;
      }
    }
    return best;
  },
});
