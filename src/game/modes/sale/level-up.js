/**
 * Распродажа: Экран уровня: пул предложений, баниш, применение выбора.
 */
'use strict';

Game.prototype.buildSaleUpgradeChoices = function () {
  const candidates = [];
  const slotCount = typeof this.saleWeaponSlotCount === 'function'
    ? this.saleWeaponSlotCount()
    : Object.keys(this.saleWeapons).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
  const ownedP = Object.keys(this.salePassives).filter((id) => (this.salePassives[id] || 0) > 0);
  const canNewWeapon = slotCount < this.saleMaxWeaponSlots();
  const banned = this.saleBanned || {};
  this.saleOverflow = this.saleOverflow || {};
  this.saleWeaponOver = this.saleWeaponOver || {};
  const keyWeight = 1 + (this.saleTreeBonus('keyWeight') || 0);

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
    } else if (this.saleOverflowUnlocked()) {
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
  if (this.saleOverflowUnlocked()) {
    for (const [wid] of Object.entries(this.saleWeapons)) {
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
  }

  const canNewPassive = ownedP.length < SALE_MAX_PASSIVES;
  const seenPassive = new Set();
  const keyCandidates = [];
  const readyEvos = this.listSaleReadyEvolutions();
  for (const def of SALE_EVO_KEYS) {
    if (seenPassive.has(def.id)) continue;
    seenPassive.add(def.id);
    if (banned['p:' + def.id]) continue;
    const baseLv = (this.saleWeapons[def.weapon] || 0);
    if (baseLv <= 0) continue;
    const lv = this.salePassives[def.id] || 0;
    if (lv <= 0 && !canNewPassive) continue;
    if (lv >= def.max) continue;
    const fromMax = (SALE_WEAPONS[def.weapon] && SALE_WEAPONS[def.weapon].max) || 5;
    let weight = 2 * keyWeight;
    if (baseLv >= fromMax && !readyEvos.some((ev) => ev.needPassive === def.id)) {
      weight = 4.8 * keyWeight;
    }
    const card = {
      kind: 'passive', id: def.id, ico: def.ico,
      ttl: def.name, desc: def.desc,
      weight,
    };
    candidates.push(card);
    keyCandidates.push(card);
  }

  if (this.saleOverflowUnlocked()) {
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
  }

  const picked = [];
  const used = new Set();
  const forceKeys = [];
  if (!this._saleRerolling) {
    this._saleKeyPity = this._saleKeyPity || {};
    for (const wid of Object.keys(this._saleKeyPity)) {
      const keys = saleEvoKeysForWeapon(wid);
      if (!keys.length || keys.some((key) => (this.salePassives[key.id] || 0) > 0)) {
        delete this._saleKeyPity[wid];
        continue;
      }
      this._saleKeyPity[wid] -= 1;
      if (this._saleKeyPity[wid] <= 0) {
        const missing = keys.filter((key) => !banned['p:' + key.id] && !(this.salePassives[key.id] > 0));
        if (missing.length) forceKeys.push(missing[randi(0, missing.length - 1)].id);
        delete this._saleKeyPity[wid];
      }
    }
  }
  for (const keyId of forceKeys) {
    const card = keyCandidates.find((c) => c.id === keyId) || candidates.find((c) => c.kind === 'passive' && c.id === keyId);
    if (!card || picked.length >= 3) continue;
    picked.push(card);
    used.add(card.kind + ':' + card.id);
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
  if (this._saleBal) {
    this._saleBal.keysOffered = (this._saleBal.keysOffered || 0) + picked.filter((c) => c.kind === 'passive').length;
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
  if (this.saleV2) return this.openSaleV2TreeUI();
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
          card.evoBadge = up.kind === 'evolve' ? 'ЭВО' : 'РЕЦЕПТ';
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
  if (!this.choosingUpgrade || this._saleChestEvoPick || this.saleV2) return;
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
  if (up.kind === 'evolve' || up.kind === 'branch2' || up.kind === 'heal') { sfx.hurt(); return; }
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
  if (!this.choosingUpgrade || this._saleChestEvoPick || this.saleV2) return;
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
  const chestPick = !!this._saleChestEvoPick;
  if (up.kind === 'weapon_new') {
    this.saleWeapons[up.id] = 1;
    this.saleWeaponCd[up.id] = 0.15;
  } else if (up.kind === 'weapon_up') {
    this.saleWeapons[up.id] = (this.saleWeapons[up.id] || 1) + 1;
    if (!this.saleV2 && this.saleWeapons[up.id] >= 3) this.armSaleKeyPity(up.id);
  } else if (up.kind === 'evolve') {
    this.applySaleEvolution(up.from, up.id);
  } else if (up.kind === 'branch2') {
    this.saleWeapons[up.id] = 1;
    this.saleWeaponCd = this.saleWeaponCd || {};
    this.saleWeaponCd[up.id] = 0.15;
    if (this._saleBal) {
      this._saleBal.evoTaken = this._saleBal.evoTaken || [];
      this._saleBal.evoTaken.push({
        into: up.id, from: up.from, t: Math.round((this.saleTime || 0) * 10) / 10, branch2: true,
      });
    }
    if (typeof this.tryGrantSaleV2Meta === 'function') this.tryGrantSaleV2Meta();
  } else if (up.kind === 'passive') {
    this.salePassives[up.id] = (this.salePassives[up.id] || 0) + 1;
    if (up.id === 'mug') {
      this.player.maxHp += 1;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }
    this.applySalePassivesToPlayer();
    if (this._saleBal) {
      this._saleBal.keysTaken = this._saleBal.keysTaken || [];
      this._saleBal.keysTaken.push({ id: up.id, t: Math.round((this.saleTime || 0) * 10) / 10 });
    }
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
  } else if (up.kind === 'uber') {
    this.applySaleV2Uber(up.id);
  }
  if (this.saleV2 && typeof this.tryGrantSaleV2PendingEvos === 'function') {
    this.tryGrantSaleV2PendingEvos();
  }
  this.refreshSaleRecipeReady();
  sfx.click();
  if (typeof LevelUpPopup !== 'undefined') LevelUpPopup.close();
  this.choosingUpgrade = false;
  this._saleBanishMode = false;
  this.updateUpgradeRerollBtn();
  if (chestPick) {
    this._saleChestEvoPick = false;
    if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
    else {
      this.paused = false;
      this.refreshMusicState();
    }
    return;
  }
  if (this._saleV2UberPick) {
    this._saleV2UberPick = false;
    if ((this._saleV2UberQueue || []).length) this._saleV2UberQueue.shift();
    this.openNextSaleV2Pick();
    return;
  }
  if (this._saleV2WepPick) {
    this._saleV2WepPick = false;
    this._saleV2WepPending = Math.max(0, (this._saleV2WepPending | 0) - 1);
    this.openNextSaleV2Pick();
    return;
  }
  this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1);
  if (this.pendingUpgrades > 0) this.openSaleUpgradeUI();
  else {
    this.paused = false;
    this.refreshMusicState();
  }
};
