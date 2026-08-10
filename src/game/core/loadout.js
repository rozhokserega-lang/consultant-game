/** Оружие игрока: текущий выбор, уровни, открытые варианты. */

Object.assign(Game.prototype, {
  getWeaponLevel(id) {
    const lv = this.weaponLevels[id] || 0;
    return Math.max(0, Math.min(WEAPON_MAX_LEVEL, lv | 0));
  },

  getWeapon() {
    const base = WEAPONS.find(w => w.id === this.weaponId) || WEAPONS[0];
    return scaleWeaponStats(base, this.getWeaponLevel(base.id));
  },

  getHammer() { return this.getWeapon(); },

  unlockedWeapons() {
    return WEAPONS.filter(w => this.ownedWeapons.includes(w.id)).map(w => scaleWeaponStats(w, this.getWeaponLevel(w.id)));
  },

  unlockedHammers() { return this.unlockedWeapons(); },

  refreshPlayerLoadoutWeapon() {
    const p = this.player;
    if (!p) return;
    const w = this.getWeapon();
    p.equippedWeaponId = w.id;
    p._loadoutWeapon = w;
    p.applyWeapon(w);
    const reach = this.metaPerks.reach || 0;
    p._metaReachBonus = reach * 5;
    if (p._metaReachBonus) {
      p.stickLength += p._metaReachBonus;
      p.baseStickLength += p._metaReachBonus;
    }
  },
});
