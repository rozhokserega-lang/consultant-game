/**
 * Мета-экипировка: сейв, миграция и подсчёт бонусов надетого.
 */
'use strict';

function emptyGearHero() {
  return {
    badge: { tier: 1, quality: 'normal' },
    card: { tier: 1, quality: 'normal' },
    radio: { tier: 1, quality: 'normal' },
  };
}

function emptyGearMaterials() {
  return { badge_shard: 0, card_film: 0, radio_cell: 0, kpi_token: 0 };
}

Game.prototype.migrateGearSave = function () {
  if ((this.gearVersion || 0) >= GEAR_VERSION) return;
  const mats = emptyGearMaterials();
  if (Array.isArray(this.equipOwned) && this.equipOwned.length) {
    mats.badge_shard += Math.min(6, this.equipOwned.length);
    this.bankCoins = (this.bankCoins || 0) + this.equipOwned.length * 15;
  }
  this.gearVersion = GEAR_VERSION;
  this.kpiBalance = this.kpiBalance || 0;
  this.gearMaterials = Object.assign(emptyGearMaterials(), mats, this.gearMaterials || {});
  this.gearByHero = this.gearByHero || {};
  for (const hid of Object.keys(SALE_HEROES)) {
    if (!this.gearByHero[hid]) this.gearByHero[hid] = emptyGearHero();
  }
  delete this.equipOwned;
  delete this.equipLoadouts;
};

Game.prototype.ensureGearState = function () {
  this.migrateGearSave();
  if (!this.gearMaterials) this.gearMaterials = emptyGearMaterials();
  if (!this.gearByHero) this.gearByHero = {};
  for (const hid of Object.keys(SALE_HEROES)) {
    if (!this.gearByHero[hid]) this.gearByHero[hid] = emptyGearHero();
  }
  if (this.kpiBalance == null) this.kpiBalance = 0;
  if (this.gearBossKillsTotal == null) this.gearBossKillsTotal = 0;
  if (!this._gearSelectedSlot) this._gearSelectedSlot = 'badge';
};

Game.prototype.getHeroGear = function (heroId) {
  this.ensureGearState();
  const hid = heroId || this.selectedHeroId || 'lena';
  return this.gearByHero[hid] || emptyGearHero();
};

Game.prototype.getGearTierDef = function (slotId, tier) {
  const s = GEAR_SLOTS[slotId];
  if (!s) return null;
  return s.tiers.find((t) => t.tier === tier) || s.tiers[0];
};

Game.prototype.getGearQualityMul = function (quality) {
  return (GEAR_QUALITIES[quality] || GEAR_QUALITIES.normal).statMul;
};

Game.prototype.getGearBonuses = function () {
  this.ensureGearState();
  const g = this.getHeroGear(this.saleHeroId || this.selectedHeroId);
  const out = { xpMul: 1, coinStart: 0, magnet: 0 };
  for (const sid of GEAR_SLOT_IDS) {
    const slot = GEAR_SLOTS[sid];
    const worn = g[sid] || { tier: 1, quality: 'normal' };
    const td = this.getGearTierDef(sid, worn.tier || 1);
    const qm = this.getGearQualityMul(worn.quality);
    if (slot.statKey === 'xpMul' && td.xpMul) out.xpMul *= 1 + (td.xpMul - 1) * qm;
    else if (slot.statKey === 'coinStart' && td.coinStart) out.coinStart += Math.round(td.coinStart * qm);
    else if (slot.statKey === 'magnet' && td.magnet) out.magnet += Math.round(td.magnet * qm);
  }
  return out;
};
