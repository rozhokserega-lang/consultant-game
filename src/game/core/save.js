/** Запись прогресса в сохранение. */

Object.assign(Game.prototype, {
  persist() {
    saveSave({
      highScore: this.highScore,
      highWaveLevel: this.highWaveLevel || 0,
      sound: sfx.enabled,
      music: music.enabled,
      vibro: this.vibro,
      dmgNumbers: this.showDmgNumbers,
      weaponId: this.weaponId,
      hammerId: this.weaponId,
      ownedWeapons: this.ownedWeapons,
      weaponLevels: this.weaponLevels,
      abilityLevels: this.abilityLevels,
      bankCoins: this.bankCoins,
      metaPerks: this.metaPerks,
      selectedArena: this.selectedArena,
      gameMode: this.gameMode,
      saleUnlockedWeapons: this.saleUnlockedWeapons,
      saleStartPassives: this.saleStartPassives,
      selectedFloorId: this.selectedFloorId || 'grocery',
      selectedContractId: this.selectedContractId || 'none',
      selectedHeroId: this.selectedHeroId || 'lena',
      gearVersion: this.gearVersion || 0,
      kpiBalance: this.kpiBalance || 0,
      gearBossKillsTotal: this.gearBossKillsTotal || 0,
      gearByHero: this.gearByHero || {},
      gearMaterials: this.gearMaterials || {},
      killLog: this.killLog,
    });
  },
});
