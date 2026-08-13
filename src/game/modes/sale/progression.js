/**
 * Распродажа: Убийства, набор опыта и доступность каталога оружия.
 */
'use strict';

Game.prototype.onSaleEnemyKilled = function (enemy) {
  this.recordKill(enemy.type);
  this.score++;
  this.waveKills++;
  if (this.recordSaleBalanceKill) this.recordSaleBalanceKill(enemy);
  this.dropSaleXp(enemy);
  this.dropSalePowerup(enemy);
  this.dropSaleHeart(enemy);
  if (this.dropGearMaterials) this.dropGearMaterials(enemy);
  if (enemy.saleBossId) {
    this.spawnAnimFx('afx_darkburst', enemy.x, enemy.y, { life: 0.9, scale: 2.0, scaleEnd: 2.8 });
    this.spawnAnimFx('afx_ring', enemy.x, enemy.y, { life: 0.6, scale: 1.4, scaleEnd: 4.5 });
    this.onSaleBossKilled(enemy);
  }
  this.spawnSpriteFx(Math.random() < 0.55 ? 'fx_blood' : 'fx_hit_blood', enemy.x, enemy.y, {
    scale: enemy.saleBossId ? 1.1 : enemy.type === 'fatty' ? 0.85 : 0.55,
    scaleEnd: enemy.saleBossId ? 1.5 : enemy.type === 'fatty' ? 1.2 : 0.9,
    life: 0.3,
    vy: -12,
  });
  if (enemy.type === 'fatty' || enemy.explodes) {
    this.spawnSpriteFx('fx_skull', enemy.x, enemy.y - 8, { scale: 0.75, life: 0.4, vy: -35 });
  }
  // монеты реже
  if (Math.random() < 0.22 || enemy.saleBossId || enemy._saleElite) this.dropCoins(enemy);
};

Game.prototype.gainSaleXp = function (amount) {
  let mul = (this.saleXpMul() || 1) * (this.saleXpEventMul || 1);
  if ((this.saleTime || 0) < 480) mul *= 1.12;
  const gained = Math.max(0, amount * mul);
  this.saleXp += gained;
  if (gained > 0 && this.recordSaleBalanceXp) this.recordSaleBalanceXp(gained);
  let leveled = 0;
  while (this.saleXp >= this.saleXpNext) {
    this.saleXp -= this.saleXpNext;
    this.saleLevel++;
    this.saleXpNext = saleXpToNext(this.saleLevel);
    leveled++;
    this.player.fillSkill(0.15);
  }
  if (leveled) {
    this.pendingUpgrades += leveled;
    sfx.level();
    this.spawnAnimFx('afx_levelup', this.player.x, this.player.y, {
      life: 1.0, scale: 1.35, scaleEnd: 1.85, anchorY: 0.9,
    });
    this.spawnParticles(this.player.x, this.player.y, 22, '#f1c40f', 200, 0.55);
    // попап после FX — иначе анимация под оверлеем и «не видно»
    this._saleLevelFxT = Math.max(this._saleLevelFxT || 0, 0.75);
  }
};

Game.prototype.migrateSaleWeaponId = function (id) {
  return SALE_WEAPON_MIGRATE[id] || id;
};

/** Оружие в пуле: хаб-ассортимент, стартер героя; после 6 мин / 12 ур. — весь зал. */
Game.prototype.saleWeaponInCatalog = function (id) {
  id = this.migrateSaleWeaponId(id);
  const def = SALE_WEAPONS[id];
  if (!def || def.evolved) return false;
  if (typeof this.isSaleWeaponHeroUnlocked === 'function' && !this.isSaleWeaponHeroUnlocked(id)) {
    return false;
  }
  const banTypes = (this.saleContract && this.saleContract.banTypes) || [];
  if (banTypes.includes(def.type)) return false;
  if (id === 'receipt') return true;
  const hero = getSaleHero(this.saleHeroId || this.selectedHeroId);
  if (hero.starterWeapon === id) return true;
  if ((this.saleRunUnlocks || []).includes(id)) return true;
  const unlocked = (this.saleUnlockedWeapons || ['receipt']).map((x) => this.migrateSaleWeaponId(x));
  if (unlocked.includes(id)) return true;
  if ((this.saleTime || 0) >= SALE_CATALOG_OPEN_SEC || (this.saleLevel || 0) >= SALE_CATALOG_OPEN_LV) {
    return true;
  }
  return false;
};
