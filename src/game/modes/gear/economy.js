/**
 * Мета-экипировка: апгрейд тиров, дроп материалов и KPI за боссов.
 */
'use strict';

Game.prototype.canUpgradeGearTier = function (slotId) {
  this.ensureGearState();
  const g = this.getHeroGear(this.saleHeroId || this.selectedHeroId);
  const worn = g[slotId] || { tier: 1, quality: 'normal' };
  const cur = worn.tier || 1;
  if (cur >= 4) return { ok: false, reason: 'Макс. тир' };
  const next = this.getGearTierDef(slotId, cur + 1);
  if (!next) return { ok: false, reason: 'Нет апгрейда' };
  if ((this.gearBossKillsTotal || 0) < (next.bossGate || 0)) {
    return { ok: false, reason: 'Боссов: ' + (this.gearBossKillsTotal || 0) + '/' + next.bossGate };
  }
  if ((this.bankCoins || 0) < (next.unlockCoins || 0)) {
    return { ok: false, reason: 'Мало монет банка' };
  }
  const mats = next.mats || {};
  for (const [mk, need] of Object.entries(mats)) {
    if (mk === 'kpi_token') {
      if ((this.kpiBalance || 0) < need) return { ok: false, reason: 'Нужны KPI-жетоны' };
    } else if ((this.gearMaterials[mk] || 0) < need) {
      const mi = GEAR_MATERIALS[mk];
      return { ok: false, reason: 'Нужно: ' + (mi ? mi.name : mk) };
    }
  }
  return { ok: true, next, cur };
};

Game.prototype.upgradeGearTier = function (slotId) {
  const chk = this.canUpgradeGearTier(slotId);
  if (!chk.ok) { sfx.hurt(); return; }
  const next = chk.next;
  this.bankCoins -= next.unlockCoins || 0;
  for (const [mk, need] of Object.entries(next.mats || {})) {
    if (mk === 'kpi_token') this.kpiBalance -= need;
    else this.gearMaterials[mk] = (this.gearMaterials[mk] || 0) - need;
  }
  const g = this.getHeroGear(this.saleHeroId || this.selectedHeroId);
  g[slotId].tier = next.tier;
  this.persist();
  sfx.shop();
  this.renderHub();
};

Game.prototype.addGearMaterial = function (matId, amount, quality) {
  if (!amount || amount <= 0) return;
  this.ensureGearState();
  const slot = Object.values(GEAR_SLOTS).find((s) => s.mat === matId);
  if (!slot) return;
  const g = this.getHeroGear(this.saleHeroId || this.selectedHeroId);
  const worn = g[slot.id] || { tier: 1, quality: 'normal' };
  const q = GEAR_QUALITIES[quality] || GEAR_QUALITIES.normal;
  const dropTier = quality === 'select' ? 3 : quality === 'sturdy' ? 2 : 1;
  if (dropTier < (worn.tier || 1)) {
    const mul = Math.max(1, Math.round(amount * q.matMul));
    this.gearMaterials[matId] = (this.gearMaterials[matId] || 0) + mul;
    this._gearRunMatGain = (this._gearRunMatGain || 0) + mul;
    return;
  }
  this.gearMaterials[matId] = (this.gearMaterials[matId] || 0) + amount;
  this._gearRunMatGain = (this._gearRunMatGain || 0) + amount;
};

Game.prototype.grantBossKpi = function () {
  this.ensureGearState();
  this.kpiBalance = (this.kpiBalance || 0) + GEAR_KPI.perBossKill;
  this.gearBossKillsTotal = (this.gearBossKillsTotal || 0) + 1;
  this._gearRunKpiGain = (this._gearRunKpiGain || 0) + GEAR_KPI.perBossKill;
};

Game.prototype.getEquipBonuses = function () {
  return this.getGearBonuses();
};

Game.prototype.rollGearDropQuality = function (isBoss) {
  const r = Math.random();
  if (isBoss) {
    if (r < 0.12) return 'select';
    if (r < 0.38) return 'sturdy';
    return 'normal';
  }
  if (r < 0.08) return 'sturdy';
  return 'normal';
};

Game.prototype.dropGearMaterials = function (enemy) {
  if (!enemy || enemy.hp > 0) return;
  const isBoss = !!enemy.saleBossId;
  const isElite = !!enemy._saleElite;
  if (!isBoss && !isElite) return;
  const kind = isBoss ? 'boss' : 'elite';
  const quality = this.rollGearDropQuality(isBoss);
  for (const slot of Object.values(GEAR_SLOTS)) {
    const d = slot.drops && slot.drops[kind];
    if (!d || Math.random() > d.chance) continue;
    const amt = d.amount[0] + Math.floor(Math.random() * (d.amount[1] - d.amount[0] + 1));
    this.addGearMaterial(slot.mat, amt, quality);
  }
};
