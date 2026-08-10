/**
 * Мета-экипировка v2: тиры, материалы, KPI. Без dmg/cd — только экономика.
 */
(function () {
  'use strict';

  const GEAR_VERSION = 2;
  const GEAR_SLOT_IDS = ['badge', 'card', 'radio'];

  const GEAR_QUALITIES = {
    normal: { label: 'Обычная', statMul: 1, matMul: 1 },
    sturdy: { label: 'Крепкая', statMul: 1.08, matMul: 1.5 },
    select: { label: 'Отборная', statMul: 1.15, matMul: 2 },
  };

  const GEAR_MATERIALS = {
    badge_shard: { name: 'Осколок бейджа', ico: '🪪' },
    card_film: { name: 'Плёнка карты', ico: '💳' },
    radio_cell: { name: 'Элемент рации', ico: '🔋' },
    kpi_token: { name: 'KPI-жетон', ico: '🎫' },
  };

  const GEAR_KPI = { perBossKill: 3 };

  const GEAR_SLOTS = {
    badge: {
      id: 'badge', name: 'Бейдж', bodyPart: 'Шея', ico: '🪪', dotTop: 44, dotLeft: 78,
      statKey: 'xpMul', mat: 'badge_shard',
      tiers: [
        { tier: 1, name: 'STAFF', img: 'gear/badges/badge_t1_staff.png', xpMul: 1.05, unlockCoins: 0, mats: {}, bossGate: 0 },
        { tier: 2, name: 'Консультант', img: 'gear/badges/badge_t2_consultant.png', xpMul: 1.10, unlockCoins: 80, mats: { badge_shard: 4 }, bossGate: 1 },
        { tier: 3, name: 'Старший консультант', img: 'gear/badges/badge_t3_senior.png', xpMul: 1.15, unlockCoins: 140, mats: { badge_shard: 8, kpi_token: 3 }, bossGate: 3 },
        { tier: 4, name: 'KPI-100', img: 'gear/badges/badge_t4_kpi100.png', xpMul: 1.20, unlockCoins: 220, mats: { badge_shard: 12, kpi_token: 9 }, bossGate: 5 },
      ],
      drops: { elite: { chance: 0.35, amount: [1, 2] }, boss: { chance: 1, amount: [2, 4] } },
    },
    card: {
      id: 'card', name: 'Служебная карта', bodyPart: 'Нагрудный карман', ico: '💳', dotTop: 78, dotLeft: 78,
      statKey: 'coinStart', mat: 'card_film',
      tiers: [
        { tier: 1, name: 'Пропуск на смену', coinStart: 2, unlockCoins: 0, mats: {}, bossGate: 0 },
        { tier: 2, name: 'Карта сотрудника', coinStart: 5, unlockCoins: 60, mats: { card_film: 3 }, bossGate: 1 },
        { tier: 3, name: 'Карта отдела', coinStart: 8, unlockCoins: 120, mats: { card_film: 6, kpi_token: 2 }, bossGate: 2 },
        { tier: 4, name: 'Чёрная карта VIP', coinStart: 12, unlockCoins: 200, mats: { card_film: 10, kpi_token: 6 }, bossGate: 4 },
      ],
      drops: { elite: { chance: 0.25, amount: [1, 1] }, boss: { chance: 1, amount: [1, 3] } },
    },
    radio: {
      id: 'radio', name: 'Рация', bodyPart: 'На бедре', ico: '📻', dotTop: 96, dotLeft: 130,
      statKey: 'magnet', mat: 'radio_cell',
      tiers: [
        { tier: 1, name: 'Дешёвая рация', img: 'gear/radios/radio_t1_basic.png', magnet: 15, unlockCoins: 0, mats: {}, bossGate: 0 },
        { tier: 2, name: 'SEC', img: 'gear/radios/radio_t2_sec.png', magnet: 30, unlockCoins: 70, mats: { radio_cell: 3 }, bossGate: 1 },
        { tier: 3, name: 'Склад-12', img: 'gear/radios/radio_t3_warehouse.png', magnet: 50, unlockCoins: 130, mats: { radio_cell: 6, kpi_token: 3 }, bossGate: 3 },
        { tier: 4, name: 'Диспетчерская', img: 'gear/radios/radio_t4_dispatch.png', magnet: 70, unlockCoins: 210, mats: { radio_cell: 10, kpi_token: 9 }, bossGate: 6 },
      ],
      drops: { elite: { chance: 0.30, amount: [1, 2] }, boss: { chance: 1, amount: [2, 3] } },
    },
  };

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

  function gearPips(tier, max) {
    let h = '';
    for (let i = 0; i < max; i++) {
      h += '<span class="gear-pip' + (i < tier ? ' on' : '') + '"></span>';
    }
    return h;
  }

  function gearTierImg(tierDef, alt, cls) {
    if (!tierDef || !tierDef.img) return '';
    const c = cls || 'gear-tier-img';
    const a = alt || tierDef.name || '';
    return '<img class="' + c + '" src="' + tierDef.img + '" alt="' + a + '" loading="lazy">';
  }

  function gearStatText(slotDef, tierDef, qMul) {
    if (!tierDef) return '—';
    const m = qMul || 1;
    if (slotDef.statKey === 'xpMul') return '+' + Math.round((tierDef.xpMul - 1) * 100 * m) + '% XP';
    if (slotDef.statKey === 'coinStart') return '+' + Math.round(tierDef.coinStart * m) + ' монет на старт';
    if (slotDef.statKey === 'magnet') return '+' + Math.round(tierDef.magnet * m) + ' магнит';
    return '';
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

  Game.prototype.renderGearMaterialsBar = function () {
    const bar = document.getElementById('hub-gear-mats');
    if (!bar) return;
    this.ensureGearState();
    const parts = [];
    for (const [id, def] of Object.entries(GEAR_MATERIALS)) {
      parts.push(def.ico + ' ' + (this.gearMaterials[id] || 0));
    }
    parts.push('🎫 KPI ' + (this.kpiBalance || 0));
    bar.textContent = parts.join(' · ');
  };

  Game.prototype.renderGearDetail = function (slotId) {
    const panel = document.getElementById('hub-gear-detail');
    if (!panel) return;
    this.ensureGearState();
    const slot = GEAR_SLOTS[slotId];
    if (!slot) return;
    const g = this.getHeroGear(this.saleHeroId || this.selectedHeroId);
    const worn = g[slotId] || { tier: 1, quality: 'normal' };
    const td = this.getGearTierDef(slotId, worn.tier || 1);
    const q = GEAR_QUALITIES[worn.quality] || GEAR_QUALITIES.normal;
    const chk = this.canUpgradeGearTier(slotId);
    const art = td && td.img ? '<div class="gear-detail-art">' + gearTierImg(td, td.name, 'gear-detail-img') + '</div>' : '';
    let html = art + '<div class="gear-detail-head">'
      + (td && td.img ? '' : '<span class="gear-detail-ico">' + slot.ico + '</span>')
      + '<div><div class="gear-detail-name">' + (td ? td.name : slot.name) + '</div>'
      + '<div class="gear-detail-part">' + slot.name + ' · ' + slot.bodyPart + '</div></div></div>';
    html += '<div class="gear-pips-row">' + gearPips(worn.tier, 4) + '</div>';
    html += '<div class="gear-detail-stat">' + gearStatText(slot, td, q.statMul) + '</div>';
    html += '<div class="gear-detail-q">' + q.label + ' · тир ' + worn.tier + '</div>';
    if (worn.tier < 4) {
      const next = this.getGearTierDef(slotId, worn.tier + 1);
      let cost = 'Тир ' + next.tier + ' · 🪙' + (next.unlockCoins || 0);
      const mk = Object.entries(next.mats || {});
      if (mk.length) {
        cost += ' · ';
        cost += mk.map(([k, n]) => (GEAR_MATERIALS[k] ? GEAR_MATERIALS[k].ico : k) + n).join(' ');
      }
      html += '<button type="button" class="btn gear-up-btn' + (chk.ok ? '' : ' locked') + '" data-gear-up="' + slotId + '">'
        + (chk.ok ? 'Улучшить' : chk.reason) + '<br><span class="gear-up-cost">' + cost + '</span></button>';
    } else {
      html += '<div class="gear-maxed">Максимальный тир</div>';
    }
    panel.innerHTML = html;
    const btn = panel.querySelector('[data-gear-up]');
    if (btn && chk.ok) {
      btn.onclick = () => this.upgradeGearTier(slotId);
    }
  };

  Game.prototype.renderEquipHub = function () {
    this.ensureGearState();
    const doll = document.getElementById('hub-equip-doll');
    const heroHint = document.getElementById('hub-equip-hero');
    const heroPick = document.getElementById('hub-equip-heroes');
    const hero = getSaleHero(this.selectedHeroId);
    const g = this.getHeroGear(this.saleHeroId || this.selectedHeroId);
    if (heroHint) {
      heroHint.textContent = (hero.ico || '') + ' ' + hero.name + ' · Личное дело консультанта';
    }
    if (heroPick) {
      heroPick.innerHTML = '';
      for (const h of Object.values(SALE_HEROES)) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hub-card' + (this.selectedHeroId === h.id ? ' sel' : '');
        el.innerHTML = '<div class="ttl">' + h.ico + ' ' + h.name + '</div><div class="meta">'
          + (this.selectedHeroId === h.id ? 'Комплект' : 'Сменить') + '</div>';
        el.onclick = () => {
          this.selectedHeroId = h.id;
          this.persist();
          this.renderHub();
          sfx.click();
        };
        heroPick.appendChild(el);
      }
    }
    this.renderGearMaterialsBar();
    if (doll) {
      doll.innerHTML = ''
        + '<svg class="gear-silhouette" width="180" height="320" viewBox="0 0 180 320" aria-hidden="true">'
        + '<circle cx="90" cy="34" r="20" fill="#2e2b52" stroke="#4a4a6a" stroke-width="1.5"/>'
        + '<rect x="55" y="58" width="70" height="92" rx="18" fill="#2e2b52" stroke="#4a4a6a" stroke-width="1.5"/>'
        + '<rect x="30" y="64" width="20" height="76" rx="9" fill="#2e2b52" stroke="#4a4a6a" stroke-width="1.5"/>'
        + '<rect x="130" y="64" width="20" height="76" rx="9" fill="#2e2b52" stroke="#4a4a6a" stroke-width="1.5"/>'
        + '<rect x="60" y="148" width="26" height="120" rx="11" fill="#2e2b52" stroke="#4a4a6a" stroke-width="1.5"/>'
        + '<rect x="94" y="148" width="26" height="120" rx="11" fill="#2e2b52" stroke="#4a4a6a" stroke-width="1.5"/>'
        + '</svg>';
      const badgeTd = this.getGearTierDef('badge', (g.badge && g.badge.tier) || 1);
      if (badgeTd && badgeTd.img) {
        const prev = document.createElement('img');
        prev.className = 'gear-worn-badge';
        prev.src = badgeTd.img;
        prev.alt = badgeTd.name;
        prev.loading = 'lazy';
        doll.appendChild(prev);
      }
      const radioTd = this.getGearTierDef('radio', (g.radio && g.radio.tier) || 1);
      if (radioTd && radioTd.img) {
        const prev = document.createElement('img');
        prev.className = 'gear-worn-radio';
        prev.src = radioTd.img;
        prev.alt = radioTd.name;
        prev.loading = 'lazy';
        doll.appendChild(prev);
      }
      for (const sid of GEAR_SLOT_IDS) {
        const slot = GEAR_SLOTS[sid];
        const worn = g[sid] || { tier: 1, quality: 'normal' };
        const td = this.getGearTierDef(sid, worn.tier || 1);
        const filled = (worn.tier || 1) > 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gear-slot-dot' + (filled ? ' filled' : '') + (this._gearSelectedSlot === sid ? ' sel' : '');
        btn.style.top = slot.dotTop + 'px';
        btn.style.left = slot.dotLeft + 'px';
        btn.title = slot.name;
        if (td && td.img) {
          btn.innerHTML = gearTierImg(td, td.name, 'gear-dot-img');
        } else {
          btn.innerHTML = '<span class="ico">' + slot.ico + '</span>';
        }
        btn.onclick = () => {
          this._gearSelectedSlot = sid;
          this.renderEquipHub();
          sfx.click();
        };
        doll.appendChild(btn);
      }
    }
    this.renderGearDetail(this._gearSelectedSlot || 'badge');
    const shop = document.getElementById('hub-equip-shop');
    if (shop) shop.innerHTML = '';
  };

  window.GEAR_VERSION = GEAR_VERSION;
  window.GEAR_SLOTS = GEAR_SLOTS;
  window.GEAR_MATERIALS = GEAR_MATERIALS;
})();
