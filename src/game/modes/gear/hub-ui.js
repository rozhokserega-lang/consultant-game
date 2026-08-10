/**
 * Мета-экипировка: экран «Личное дело» в хабе.
 */
'use strict';

function gearPips(tier, max) {
  let h = '';
  for (let i = 0; i < max; i++) {
    h += '<span class="gear-pip' + (i < tier ? ' on' : '') + '"></span>';
  }
  return h;
}

function gearHero(id) {
  if (typeof getSaleHero === 'function') return getSaleHero(id);
  const H = typeof SALE_HEROES !== 'undefined' ? SALE_HEROES : {};
  return H[id] || H.lena || { id: 'lena', name: 'Лена', ico: '👩' };
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
    html += '<button type="button" class="button button--sm button--full gear-up-btn'
      + (chk.ok ? '' : ' locked') + '" data-gear-up="' + slotId + '">'
      + '<span class="button__label">' + (chk.ok ? 'Улучшить' : chk.reason)
      + '<span class="gear-up-cost">' + cost + '</span></span></button>';
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
  const hero = gearHero(this.selectedHeroId);
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
    for (const sid of GEAR_SLOT_IDS) {
      const slot = GEAR_SLOTS[sid];
      const worn = g[sid] || { tier: 1, quality: 'normal' };
      const td = this.getGearTierDef(sid, worn.tier || 1);
      const filled = (worn.tier || 1) > 0;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gear-slot-pin' + (filled ? ' filled' : '') + (this._gearSelectedSlot === sid ? ' sel' : '');
      btn.dataset.slot = sid;
      btn.style.top = (slot.pinTop || 0) + 'px';
      btn.style.left = (slot.pinLeft || 90) + 'px';
      btn.style.width = (slot.pinW || 40) + 'px';
      btn.style.height = (slot.pinH || 40) + 'px';
      if (slot.pinRot) btn.style.setProperty('--pin-rot', slot.pinRot + 'deg');
      btn.title = slot.name;
      if (td && td.img) {
        btn.innerHTML = gearTierImg(td, td.name, 'gear-pin-img');
      } else {
        btn.innerHTML = '<span class="gear-pin-ico">' + slot.ico + '</span>';
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
