/**
 * Распродажа: Экран уровня: пул предложений, баниш, применение выбора.
 */
'use strict';

Game.prototype.buildSaleUpgradeChoices = function () {
  const candidates = [];
  // слот занимает любое оружие, включая эволюции (evo заменяет базу, слот тот же)
  const slotCount = Object.keys(this.saleWeapons).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
  const ownedP = Object.keys(this.salePassives).filter((id) => (this.salePassives[id] || 0) > 0);
  const canNewWeapon = slotCount < this.saleMaxWeaponSlots();
  const banned = this.saleBanned || {};
  this.saleOverflow = this.saleOverflow || {};
  this.saleWeaponOver = this.saleWeaponOver || {};

  for (const def of Object.values(SALE_WEAPONS)) {
    if (def.evolved) continue;
    if (banned['w:' + def.id]) continue;
    const lv = this.saleWeapons[def.id] || 0;
    if (lv <= 0) {
      if (!canNewWeapon) continue;
      if (!this.saleWeaponInCatalog(def.id)) continue;
      const role = SALE_ROLE_LABEL[def.type] || def.type;
      candidates.push({
        kind: 'weapon_new', id: def.id, ico: def.ico,
        ttl: def.name, desc: `${def.desc} · ${role}`,
        weight: 2.2, role,
      });
    } else if (lv < def.max) {
      const role = SALE_ROLE_LABEL[def.type] || def.type;
      candidates.push({
        kind: 'weapon_up', id: def.id, ico: def.ico,
        ttl: `${def.name} ур.${lv + 1}`,
        desc: `Улучшить до ${lv + 1}/${def.max} · ${role}`,
        weight: 3, role,
      });
    } else {
      // поверх капа — мягкий оверлевел оружия
      const ov = this.saleWeaponOver[def.id] || 0;
      if (ov < 12) {
        candidates.push({
          kind: 'weapon_over', id: def.id, ico: def.ico,
          ttl: `${def.name} +${ov + 1}`, desc: '+7% урон этого оружия',
          weight: 1.6,
        });
      }
    }
  }
  // эволюции тоже можно «докрутить»
  for (const [wid, lv] of Object.entries(this.saleWeapons)) {
    const def = SALE_WEAPONS[wid];
    if (!def || !def.evolved || banned['w:' + wid]) continue;
    const ov = this.saleWeaponOver[wid] || 0;
    if (ov < 12) {
      candidates.push({
        kind: 'weapon_over', id: wid, ico: def.ico,
        ttl: `${def.name} +${ov + 1}`, desc: '+7% урон этого оружия',
        weight: 1.8,
      });
    }
  }

  const canNewPassive = ownedP.length < SALE_MAX_PASSIVES;
  const seenPassive = new Set();
  for (const def of Object.values(SALE_PASSIVES)) {
    if (seenPassive.has(def.id)) continue;
    seenPassive.add(def.id);
    if (banned['p:' + def.id]) continue;
    const lv = this.salePassives[def.id] || 0;
    if (lv <= 0 && !canNewPassive) continue;
    if (lv < def.max) {
      // ключ эво: если база уже на капе — чаще предлагаем пассивку, чтобы ветка открылась
      let weight = 2;
      for (const ev of SALE_EVOLUTIONS) {
        if (ev.needPassive !== def.id) continue;
        const fromMax = SALE_WEAPONS[ev.from]?.max || 5;
        if ((this.saleWeapons[ev.from] || 0) >= fromMax && !this.saleWeapons[ev.into]) {
          weight = 4.8;
          break;
        }
      }
      candidates.push({
        kind: 'passive', id: def.id, ico: def.ico,
        ttl: `${def.name} ур.${lv + 1}`, desc: def.desc,
        weight,
      });
    }
  }

  // оверфлоу-статы — всегда есть что взять до конца 20 мин
  for (const ov of SALE_OVERFLOW) {
    if (banned['o:' + ov.id]) continue;
    const lv = this.saleOverflow[ov.id] || 0;
    if (lv >= ov.max) continue;
    candidates.push({
      kind: 'overflow', id: ov.id, ico: ov.ico,
      ttl: `${ov.name} · ${lv + 1}`, desc: ov.desc,
      weight: 2.4,
    });
  }

  // эволюции — гарантированные слоты (как в LN)
  const guaranteed = [];
  for (const ev of SALE_EVOLUTIONS) {
    const haveFrom = (this.saleWeapons[ev.from] || 0) >= (SALE_WEAPONS[ev.from]?.max || 5);
    if (!haveFrom) continue;
    if (this.saleWeapons[ev.into]) continue;
    if (ev.needPassive && !(this.salePassives[ev.needPassive] > 0)) continue;
    if (ev.needWeapon && !(this.saleWeapons[ev.needWeapon] > 0)) continue;
    const into = SALE_WEAPONS[ev.into];
    const fromDef = SALE_WEAPONS[ev.from];
    const fromName = fromDef?.name || ev.from;
    const role = SALE_ROLE_LABEL[into.type] || into.type;
    const before = fromDef ? `${SALE_ROLE_LABEL[fromDef.type] || fromDef.type}` : '?';
    const after = `${role}`;
    const hint = ev.branchHint ? `${ev.branchHint} · ` : '';
    guaranteed.push({
      kind: 'evolve', id: ev.into, from: ev.from, ico: into.ico,
      ttl: ev.branch ? `✨ ${fromName} → ${ev.name}` : `✨ ${ev.name}`,
      desc: `${hint}${into.desc} · ${before} → ${after}`,
      branch: ev.branch || null,
      role,
    });
  }

  // две готовые ветки одной базы (сканер / карта) — только выбор ветки, без лишних карт
  const byFrom = {};
  for (const g of guaranteed) {
    (byFrom[g.from] = byFrom[g.from] || []).push(g);
  }
  const branchPick = Object.values(byFrom).find((arr) => arr.length >= 2);
  if (branchPick) {
    return branchPick.map((g) => ({
      ...g,
      ttl: `✨ Ветка «${g.branch || g.id}»: ${SALE_WEAPONS[g.id]?.name || g.id}`,
    }));
  }

  if (this.player.hp < this.player.maxHp) {
    candidates.push({ kind: 'heal', id: 'heal', ico: '❤️', ttl: 'Аптечка', desc: '+2 HP сейчас', weight: 1.2 });
  }

  const picked = [];
  const used = new Set();
  for (const g of guaranteed) {
    if (picked.length >= 3) break;
    picked.push(g);
    used.add(g.kind + ':' + g.id);
  }
  while (picked.length < 3 && candidates.length) {
    let total = 0;
    const avail = [];
    for (const c of candidates) {
      const key = c.kind + ':' + c.id;
      if (used.has(key)) continue;
      avail.push(c);
      total += c.weight || 1;
    }
    if (!avail.length || total <= 0) break;
    let r = Math.random() * total;
    let choice = avail[avail.length - 1];
    for (const c of avail) {
      r -= c.weight || 1;
      if (r <= 0) { choice = c; break; }
    }
    picked.push(choice);
    used.add(choice.kind + ':' + choice.id);
  }
  return picked;
};

/** Карточка закроет рецепт эво (недостающая пассивка / докачка базы до max) или сама является эво. */
Game.prototype.saleChoiceUnlocksEvo = function (up) {
  if (!up || typeof SALE_EVOLUTIONS === 'undefined') return null;
  if (up.kind === 'evolve') {
    const ev = SALE_EVOLUTIONS.find((e) => e.into === up.id);
    return { name: (ev && ev.name) || up.ttl, into: up.id };
  }
  for (const ev of SALE_EVOLUTIONS) {
    if (this.saleWeapons && this.saleWeapons[ev.into]) continue;
    const fromMax = (SALE_WEAPONS[ev.from] && SALE_WEAPONS[ev.from].max) || 5;
    const fromLv = (this.saleWeapons && this.saleWeapons[ev.from]) || 0;
    const havePass = ev.needPassive
      ? ((this.salePassives && this.salePassives[ev.needPassive]) || 0) > 0
      : true;
    if (fromLv >= fromMax && havePass) continue;
    let nextFrom = fromLv;
    let nextPass = havePass;
    if (up.kind === 'weapon_up' && up.id === ev.from) nextFrom = fromLv + 1;
    if (up.kind === 'passive' && up.id === ev.needPassive) nextPass = true;
    if (nextFrom >= fromMax && nextPass) {
      return { name: ev.name, into: ev.into };
    }
  }
  return null;
};

Game.prototype.openSaleUpgradeUI = function () {
  this.choosingUpgrade = true;
  this.paused = true;
  if (this.upgradeRerollsLeft == null) this.upgradeRerollsLeft = 3;
  if (!this._saleKeepBanishMode) this._saleBanishMode = false;
  this.upgradeChoices = this.buildSaleUpgradeChoices();
  if (!this.upgradeChoices.length) {
    // LN noChoices: слоты полны — тихий хил без баннера
    const n = Math.max(1, this.pendingUpgrades | 0);
    if (this.player) {
      this.player.maxHp += Math.min(3, n);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.min(3, n));
      this.spawnAnimFx('afx_heal', this.player.x, this.player.y - 10, { life: 0.45, scale: 0.75, vy: -18 });
    }
    this.choosingUpgrade = false;
    this.pendingUpgrades = 0;
    this.paused = false;
    this.updateUpgradeRerollBtn();
    sfx.pickup();
    this.refreshMusicState();
    return;
  }
  const branchOnly = this.upgradeChoices.length >= 2
    && this.upgradeChoices.every((u) => u.kind === 'evolve' && u.branch);
  const headerTitle = branchOnly
    ? 'Выбери ветку'
    : `Уровень ${this.saleLevel}`;
  if (typeof LevelUpPopup !== 'undefined') {
    LevelUpPopup.open({
      title: headerTitle,
      cards: this.upgradeChoices.map((up) => {
        const card = saleChoiceToCard(up);
        const evo = this.saleChoiceUnlocksEvo(up);
        if (evo) {
          card.evoReady = true;
          card.evoName = evo.name;
          card.isUpgrade = true;
        }
        return card;
      }),
      banishMode: !!this._saleBanishMode,
      onPick: (i) => (this._saleBanishMode ? this.banSaleUpgrade(i) : this.pickSaleUpgrade(i)),
    });
  }
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
  if (!this._saleRerolling && !this._saleKeepBanishMode) sfx.level();
};

Game.prototype.toggleSaleBanish = function () {
  if (!this.choosingUpgrade) return;
  if (!this._saleBanishMode && (this.saleBanishesLeft | 0) <= 0) { sfx.hurt(); return; }
  this._saleBanishMode = !this._saleBanishMode;
  sfx.click();
  // пересобираем UI, сохраняя режим бана
  this._saleKeepBanishMode = true;
  this._saleRerolling = true;
  this.openSaleUpgradeUI();
  this._saleRerolling = false;
  this._saleKeepBanishMode = false;
};

Game.prototype.banSaleUpgrade = function (i) {
  const up = this.upgradeChoices[i];
  if (!up) return;
  if (up.kind === 'evolve' || up.kind === 'heal') { sfx.hurt(); return; }
  if ((this.saleBanishesLeft | 0) <= 0) { sfx.hurt(); return; }
  this.saleBanned = this.saleBanned || {};
  const key = up.kind === 'passive' ? 'p:' + up.id
    : up.kind === 'overflow' ? 'o:' + up.id
    : 'w:' + up.id;
  this.saleBanned[key] = true;
  this.saleBanishesLeft -= 1;
  this._saleBanishMode = false;
  sfx.click();
  this.showEventBanner(`🚫 ${up.ttl} — забанено до конца забега`, 1.6);
  // пересобрать выбор без потраченного реролла
  this._saleRerolling = true;
  this.openSaleUpgradeUI();
  this._saleRerolling = false;
};

Game.prototype.skipSaleUpgrade = function () {
  if (!this.choosingUpgrade) return;
  sfx.click();
  if (typeof LevelUpPopup !== 'undefined') LevelUpPopup.close();
  this.choosingUpgrade = false;
  this._saleBanishMode = false;
  this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
  this.updateUpgradeRerollBtn();
  if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
  else {
    this.paused = false;
    this.refreshMusicState();
  }
};

Game.prototype.pickSaleUpgrade = function (i) {
  const up = this.upgradeChoices[i];
  if (!up) return;
  if (up.kind === 'weapon_new') {
    this.saleWeapons[up.id] = 1;
    this.saleWeaponCd[up.id] = 0.15;
  } else if (up.kind === 'weapon_up') {
    this.saleWeapons[up.id] = (this.saleWeapons[up.id] || 1) + 1;
  } else if (up.kind === 'evolve') {
    delete this.saleWeapons[up.from];
    this.saleWeapons[up.id] = 1;
    this.saleWeaponCd[up.id] = 0.1;
    this.spawnAnimFx('afx_levelup', this.player.x, this.player.y, {
      life: 1.15, scale: 1.7, scaleEnd: 2.2, anchorY: 0.9,
    });
    this.spawnParticles(this.player.x, this.player.y, 28, '#f1c40f', 240, 0.6);
    this.applySalePassivesToPlayer();
  } else if (up.kind === 'passive') {
    this.salePassives[up.id] = (this.salePassives[up.id] || 0) + 1;
    if (up.id === 'vitality' || up.id === 'mug') {
      this.player.maxHp += 1;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }
    this.applySalePassivesToPlayer();
  } else if (up.kind === 'overflow') {
    this.saleOverflow = this.saleOverflow || {};
    this.saleOverflow[up.id] = (this.saleOverflow[up.id] || 0) + 1;
    if (up.id === 'vital') {
      this.player.maxHp += 1;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }
    this.applySalePassivesToPlayer();
  } else if (up.kind === 'weapon_over') {
    this.saleWeaponOver = this.saleWeaponOver || {};
    this.saleWeaponOver[up.id] = (this.saleWeaponOver[up.id] || 0) + 1;
  } else if (up.kind === 'heal') {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
    this.spawnSpriteFx('fx_medkit', this.player.x, this.player.y - 20, { scale: 0.9, life: 0.45, vy: -30 });
    if (typeof drawSpell === 'function') {
      this.spawnSpriteFx('sp_heal2', this.player.x, this.player.y, { scale: 0.55, life: 0.4, vy: -10 });
    }
  }
  sfx.click();
  if (typeof LevelUpPopup !== 'undefined') LevelUpPopup.close();
  this.choosingUpgrade = false;
  this._saleBanishMode = false;
  this.updateUpgradeRerollBtn();
  this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
  if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
  else {
    this.paused = false;
    this.refreshMusicState();
  }
};
