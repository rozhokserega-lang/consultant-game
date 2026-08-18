/**
 * Распродажа 2.0: чемодан оружия, дерево пассивок с развилками.
 */
'use strict';

Game.prototype.isSaleV2 = function () {
  return !!this.saleV2;
};

Game.prototype.saleV2Stat = function (key) {
  if (!this.saleV2) return 0;
  let total = 0;
  for (const [id, lv] of Object.entries(this.salePassives || {})) {
    const def = getSaleV2Passive(id);
    if (!def || !def.stat || def.stat[key] == null) continue;
    total += def.stat[key] * (lv | 0);
  }
  for (const id of this.saleUbers || []) {
    const def = typeof getSaleV2Uber === 'function' ? getSaleV2Uber(id) : null;
    if (!def || !def.stat || def.stat[key] == null) continue;
    total += def.stat[key];
  }
  return total;
};

Game.prototype.saleV2HasEffect = function (effect) {
  if (!this.saleV2 || !effect) return false;
  for (const [id, lv] of Object.entries(this.salePassives || {})) {
    const def = getSaleV2Passive(id);
    if (def && def.effect === effect && (lv | 0) >= (def.max || 1)) return true;
  }
  for (const id of this.saleUbers || []) {
    const def = typeof getSaleV2Uber === 'function' ? getSaleV2Uber(id) : null;
    if (def && def.effect === effect) return true;
  }
  return false;
};

Game.prototype.saleV2NodeLevel = function (id) {
  return (this.salePassives && this.salePassives[id]) || 0;
};

Game.prototype.saleV2PathComplete = function (optionId) {
  if (!optionId) return false;
  if (optionId === 'atk' || optionId === 'def') {
    return SALE_V2_LANES.some((lane) => lane.side === optionId && this.saleV2PathComplete(lane.id));
  }
  const nodes = Object.values(SALE_V2_PASSIVES).filter((d) => d.option === optionId || d.lane === optionId);
  if (!nodes.length) return false;
  const isLane = SALE_V2_LANES.some((l) => l.id === optionId);
  if (isLane) {
    const t1 = nodes.find((d) => d.tier === 1);
    if (!t1 || this.saleV2NodeLevel(t1.id) < t1.max) return false;
    const leaves = [...new Set(nodes.filter((d) => d.tier >= 2).map((d) => d.option))];
    return leaves.some((leaf) => this.saleV2PathComplete(leaf));
  }
  const t2 = nodes.find((d) => d.tier === 2);
  const cap = nodes.find((d) => d.tier === 3);
  if (t2 && this.saleV2NodeLevel(t2.id) < t2.max) return false;
  if (cap && this.saleV2NodeLevel(cap.id) < cap.max) return false;
  return !!(t2 || cap);
};

Game.prototype.saleV2ChoiceLocked = function (forkId, optionId) {
  if (!forkId || !optionId) return false;
  this._saleV2Picked = this._saleV2Picked || {};
  const picked = this._saleV2Picked[forkId];
  if (!picked || picked === optionId) return false;
  return !this.saleV2PathComplete(picked);
};

Game.prototype.saleV2NodeAvailable = function (def) {
  if (!def) return false;
  const lv = this.saleV2NodeLevel(def.id);
  if (lv >= (def.max || 1)) return false;
  if (def.tier >= 2) {
    if (this.saleV2ChoiceLocked('root', def.root)) return false;
    if (this.saleV2ChoiceLocked(def.fork, def.option)) return false;
  }
  if (def.requires && this.saleV2NodeLevel(def.requires.id) < (def.requires.lvl || 1)) return false;
  return true;
};

Game.prototype.listSaleV2Available = function () {
  return Object.values(SALE_V2_PASSIVES).filter((def) => this.saleV2NodeAvailable(def));
};

Game.prototype.listSaleV2EvolutionsFor = function (fromId) {
  if (!fromId || typeof SALE_EVOLUTIONS === 'undefined') return [];
  return SALE_EVOLUTIONS.filter((ev) => ev.from === fromId && !this.saleWeapons[ev.into]);
};

Game.prototype.grantSaleV2WeaponEvolution = function (fromId) {
  const ready = this.listSaleV2EvolutionsFor(fromId);
  if (!ready.length) return false;
  if (ready.length >= 2 && typeof this.openSaleChestEvolutionPick === 'function') {
    this.openSaleChestEvolutionPick(ready, 'Эволюция · 6 ур.');
    return true;
  }
  const ev = ready[0];
  this.applySaleEvolution(ev.from, ev.into);
  const into = SALE_WEAPONS[ev.into];
  this.showEventBanner('✨ 6 ур.: ' + ((into && into.name) || ev.name) + '!', 2.2);
  sfx.level();
  return true;
};

Game.prototype.investSaleV2Node = function (id, opts) {
  opts = opts || {};
  const def = getSaleV2Passive(id);
  const force = !!opts.force;
  if (!def || (!force && !this.saleV2NodeAvailable(def))) {
    if (!force) sfx.hurt();
    return false;
  }
  if (force && this.saleV2NodeLevel(id) >= (def.max || 1)) return false;
  this.salePassives[id] = this.saleV2NodeLevel(id) + 1;
  this._saleV2Picked = this._saleV2Picked || {};
  if (def.root && !this._saleV2Picked.root) this._saleV2Picked.root = def.root;
  if (def.tier >= 2 && def.fork && def.option && !this._saleV2Picked[def.fork]) {
    this._saleV2Picked[def.fork] = def.option;
  }
  if (def.stat && def.stat.hp) {
    this.player.maxHp += def.stat.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.stat.hp);
  }
  if (id === 'medkit' && this.player) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
  }
  this.applySalePassivesToPlayer();
  if (def.capstone && this.saleV2NodeLevel(id) >= (def.max || 1)) {
    this.queueSaleV2CapstoneEvo(def);
    this.tryGrantSaleV2PendingEvos();
    const evo = saleV2EvoName(def);
    this.showEventBanner('◆ ' + def.name + (evo ? ' · ' + evo : ''), 2.0);
    sfx.level();
  }
  return true;
};

Game.prototype.queueSaleV2CapstoneEvo = function (def) {
  if (!def || !def.evolves) return;
  this._saleV2PendingEvos = this._saleV2PendingEvos || [];
  const from = def.evolves.from;
  const into = def.evolves.into;
  if (this._saleV2PendingEvos.some((p) => p.into === into)) return;
  this._saleV2PendingEvos.push({
    from, into, name: saleV2EvoName(def) || def.name,
  });
};

Game.prototype.tryGrantSaleV2PendingEvos = function () {
  if (!this.saleV2) return;
  const list = this._saleV2PendingEvos || [];
  if (!list.length) return;
  const keep = [];
  for (const pend of list) {
    if (this.saleWeapons[pend.into]) continue;
    if (!(this.saleWeapons[pend.from] > 0)) {
      keep.push(pend);
      continue;
    }
    this.applySaleEvolution(pend.from, pend.into);
    this.showEventBanner('✨ ' + (pend.name || 'Эволюция') + '!', 2.2);
    sfx.level();
  }
  this._saleV2PendingEvos = keep;
};

Game.prototype.pickSaleV2Node = function (id) {
  if (!this.choosingUpgrade || !this.saleV2) return;
  if (!this.investSaleV2Node(id)) return;
  sfx.click();
  this.pendingUpgrades = Math.max(0, (this.pendingUpgrades | 0) - 1);
  if (this._saleBal && typeof this.recordSaleBalanceV2Event === 'function') {
    this.recordSaleBalanceV2Event('tree', { id, lv: this.saleV2NodeLevel(id) });
  }
  this._saleV2InspectId = id;
  if (this.pendingUpgrades > 0) this.openSaleV2TreeUI();
  else {
    if (typeof SaleTreePopup !== 'undefined') SaleTreePopup.close();
    this.openNextSaleV2Pick();
  }
};

Game.prototype.openNextSaleV2Pick = function () {
  if (this.gameOver || this.won) return;
  if ((this._saleV2UberQueue || []).length && typeof this.openSaleV2UberUI === 'function') {
    this.openSaleV2UberUI();
    return;
  }
  if ((this._saleV2WepPending || 0) > 0 && typeof this.openSaleV2WeaponCaseUI === 'function') {
    this.openSaleV2WeaponCaseUI();
    return;
  }
  if ((this.pendingUpgrades || 0) > 0) {
    this.openSaleV2TreeUI();
    return;
  }
  this.choosingUpgrade = false;
  this.paused = false;
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
  if (this._saleV2WinAfterUber) {
    this._saleV2WinAfterUber = false;
    this.endSaleGame(true);
  }
};

Game.prototype.closeSaleV2TreeUI = function () {
  if (typeof SaleTreePopup !== 'undefined') SaleTreePopup.close();
  this.choosingUpgrade = false;
  this.paused = false;
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
};

Game.prototype.openSaleV2TreeUI = function () {
  if (!this.saleV2) return;
  if (typeof LevelUpPopup !== 'undefined') LevelUpPopup.close();
  this.choosingUpgrade = true;
  this.paused = true;
  const available = this.listSaleV2Available();
  if (!available.length) {
    this.saleOverflow = this.saleOverflow || {};
    this.saleOverflow.power = (this.saleOverflow.power || 0) + 1;
    this.showEventBanner('💪 Дерево закрыто: +урон', 1.4);
    if (this._saleBal && typeof this.recordSaleBalanceV2Event === 'function') {
      this.recordSaleBalanceV2Event('overflow', { id: 'power', src: 'tree_cap' });
    }
    this.pendingUpgrades = Math.max(0, (this.pendingUpgrades | 0) - 1);
    if (this.pendingUpgrades > 0) {
      this.openSaleV2TreeUI();
      return;
    }
    if (typeof SaleTreePopup !== 'undefined') SaleTreePopup.close();
    this.openNextSaleV2Pick();
    return;
  }
  if (typeof SaleTreePopup !== 'undefined') {
    const board = this.buildSaleV2TreeBoard();
    let side = this._saleV2Side;
    const known = board.some((s) => s.id === side);
    if (!known) side = 'atk';
    const openSide = board.find((s) => !s.locked && s.lanes.some((l) => l.t1 && l.t1.state === 'open'));
    if (openSide && board.find((s) => s.id === side && s.locked)) side = openSide.id;
    this._saleV2Side = side;
    SaleTreePopup.open({
      title: 'Дерево смены',
      points: this.pendingUpgrades | 0,
      board,
      side,
      inspectId: this._saleV2InspectId || available[0].id,
      onSide: (id) => {
        this._saleV2Side = id;
        this.openSaleV2TreeUI();
      },
      onPick: (id) => this.pickSaleV2Node(id),
      onInspect: (id) => { this._saleV2InspectId = id; },
    });
  }
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
};

Game.prototype.saleV2NodeView = function (def) {
  const lv = this.saleV2NodeLevel(def.id);
  const available = this.saleV2NodeAvailable(def);
  let state = 'locked';
  if (lv >= def.max) state = 'max';
  else if (available) state = 'open';
  else if (lv > 0) state = 'owned';
  const evoName = saleV2EvoName(def);
  return {
    id: def.id,
    ico: def.ico,
    name: def.name,
    desc: def.desc + (evoName ? ' · эво: ' + evoName : ''),
    lv,
    max: def.max,
    tier: def.tier,
    requires: def.requires,
    state,
    capstone: !!def.capstone,
    evoName,
  };
};

Game.prototype.buildSaleV2TreeBoard = function () {
  return SALE_V2_SIDES.map((side) => ({
    id: side.id,
    name: side.name,
    ico: side.ico,
    locked: false,
    lanes: SALE_V2_LANES.filter((lane) => lane.side === side.id).map((lane) => {
      const t1 = Object.values(SALE_V2_PASSIVES).find((d) => d.lane === lane.id && d.tier === 1);
      const leafIds = [...new Set(
        Object.values(SALE_V2_PASSIVES)
          .filter((d) => d.lane === lane.id && d.tier >= 2)
          .map((d) => d.option),
      )];
      return {
        id: lane.id,
        name: lane.name,
        ico: lane.ico,
        locked: false,
        t1: t1 ? this.saleV2NodeView(t1) : null,
        leaves: leafIds.map((leafId) => {
          const t2 = Object.values(SALE_V2_PASSIVES).find((d) => d.option === leafId && d.tier === 2);
          const cap = Object.values(SALE_V2_PASSIVES).find((d) => d.option === leafId && d.tier === 3);
          return {
            id: leafId,
            locked: this.saleV2ChoiceLocked(lane.id, leafId),
            t2: t2 ? this.saleV2NodeView(t2) : null,
            cap: cap ? this.saleV2NodeView(cap) : null,
          };
        }),
      };
    }),
  }));
};

Game.prototype.buildSaleV2TreeView = function (branchId) {
  return saleV2PassivesInLane(branchId || 'tempo').map((def) => this.saleV2NodeView(def));
};

Game.prototype.listSaleV2SiblingBranches = function () {
  const out = [];
  if (typeof SALE_EVOLUTIONS === 'undefined') return out;
  const byFrom = {};
  for (const ev of SALE_EVOLUTIONS) {
    if (ev.v2Only && !this.saleV2) continue;
    (byFrom[ev.from] = byFrom[ev.from] || []).push(ev);
  }
  for (const evs of Object.values(byFrom)) {
    const owned = evs.filter((ev) => this.saleWeapons[ev.into]);
    const missing = evs.filter((ev) => !this.saleWeapons[ev.into]);
    if (owned.length < 1 || !missing.length) continue;
    for (const ev of missing) out.push(ev);
  }
  return out;
};

Game.prototype.tryGrantSaleV2Meta = function () {
  if (!this.saleV2 || typeof SALE_META_EVOS === 'undefined') return;
  for (const family of Object.keys(SALE_META_EVOS)) {
    const meta = SALE_META_EVOS[family];
    if (!meta || this.saleWeapons[meta.id]) continue;
    const ids = typeof saleEvoIdsForFamily === 'function' ? saleEvoIdsForFamily(family) : [];
    if (ids.length < 2) continue;
    if (!ids.every((id) => this.saleWeapons[id])) continue;
    if (!SALE_WEAPONS[meta.id]) continue;
    this.saleWeapons[meta.id] = 1;
    this.saleWeaponCd = this.saleWeaponCd || {};
    this.saleWeaponCd[meta.id] = 0.2;
    this.showEventBanner((meta.ico || '🧋') + ' Мета: ' + meta.name + '!', 2.4);
    sfx.level();
    if (this.player) {
      this.spawnAnimFx('afx_levelup', this.player.x, this.player.y, {
        life: 1.2, scale: 1.8, scaleEnd: 2.3, anchorY: 0.9,
      });
    }
    if (this._saleBal) {
      this._saleBal.metaTaken = this._saleBal.metaTaken || [];
      this._saleBal.metaTaken.push({
        id: meta.id, family, t: Math.round((this.saleTime || 0) * 10) / 10,
      });
    }
    if (typeof this.recordSaleBalanceV2Event === 'function') {
      this.recordSaleBalanceV2Event('meta', { id: meta.id, family });
    }
  }
};

Game.prototype.saleV2WeaponOffered = function (id) {
  const def = SALE_WEAPONS[id];
  if (!def || def.evolved) return false;
  const banTypes = (this.saleContract && this.saleContract.banTypes) || [];
  if (banTypes.includes(def.type)) return false;
  return true;
};

Game.prototype.buildSaleV2WeaponChoices = function () {
  const candidates = [];
  const slotCount = typeof this.saleWeaponSlotCount === 'function'
    ? this.saleWeaponSlotCount()
    : Object.keys(this.saleWeapons || {}).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
  const canNewWeapon = slotCount < this.saleMaxWeaponSlots();
  const banned = this.saleBanned || {};
  this.saleOverflow = this.saleOverflow || {};
  this.saleWeaponOver = this.saleWeaponOver || {};

  for (const def of Object.values(SALE_WEAPONS)) {
    if (!def || def.evolved) continue;
    if (banned['w:' + def.id]) continue;
    const lv = this.saleWeapons[def.id] || 0;
    if (lv <= 0) {
      if (!canNewWeapon) continue;
      if (typeof saleHasFamily === 'function' && saleHasFamily(this.saleWeapons, def.id)) continue;
      if (!this.saleV2WeaponOffered(def.id)) continue;
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
      const evos = this.listSaleV2EvolutionsFor(def.id);
      for (const ev of evos) {
        const card = this.saleEvolutionChoiceCard(ev);
        card.weight = 4.5;
        candidates.push(card);
      }
    }
  }

  if (canNewWeapon) {
    for (const ev of this.listSaleV2SiblingBranches()) {
      const into = SALE_WEAPONS[ev.into];
      if (!into || banned['w:' + ev.into]) continue;
      const fromDef = SALE_WEAPONS[ev.from];
      const role = SALE_ROLE_LABEL[into.type] || into.type;
      candidates.push({
        kind: 'branch2', id: ev.into, from: ev.from, ico: into.ico,
        ttl: `✨ 2-я ветка: ${ev.name}`,
        desc: `${(fromDef && fromDef.name) || ev.from}: ${into.desc} · ${role}`,
        weight: 3.8, role, branch: ev.branch || null,
      });
    }
  }

  // хвост оружия на капе — не глобальные «Час пик» / «Расширение зала»
  for (const [wid] of Object.entries(this.saleWeapons || {})) {
    const def = SALE_WEAPONS[wid];
    if (!def || banned['w:' + wid]) continue;
    if (def.meta) continue;
    const lv = this.saleWeapons[wid] || 0;
    const atCap = def.evolved || lv >= (def.max || 5);
    if (!atCap) continue;
    if (!def.evolved && this.listSaleV2EvolutionsFor(wid).length) continue;
    const ov = this.saleWeaponOver[wid] || 0;
    if (ov >= 12) continue;
    candidates.push({
      kind: 'weapon_over', id: wid, ico: def.ico,
      ttl: `${def.name} +${ov + 1}`, desc: '+7% урон этого оружия',
      weight: 1.6,
    });
  }

  return saleV2PickWeighted(candidates, 3);
};

function saleV2PickWeighted(candidates, n) {
  const picked = [];
  const used = new Set();
  const list = candidates || [];
  while (picked.length < n && list.length) {
    let total = 0;
    const avail = [];
    for (const c of list) {
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
}

Game.prototype.openSaleV2WeaponCaseUI = function () {
  if (!this.saleV2) return;
  if (typeof SaleTreePopup !== 'undefined') SaleTreePopup.close();
  this.choosingUpgrade = true;
  this.paused = true;
  this._saleV2WepPick = true;
  this.upgradeChoices = this.buildSaleV2WeaponChoices();
  if (!this.upgradeChoices.length) {
    this.saleOverflow = this.saleOverflow || {};
    this.saleOverflow.power = (this.saleOverflow.power || 0) + 1;
    this.showEventBanner('💪 Оружие на капе: +урон', 1.3);
    if (this._saleBal && typeof this.recordSaleBalanceV2Event === 'function') {
      this.recordSaleBalanceV2Event('overflow', { id: 'power', src: 'wep_cap' });
    }
    this._saleV2WepPick = false;
    this._saleV2WepPending = Math.max(0, (this._saleV2WepPending | 0) - 1);
    this.openNextSaleV2Pick();
    sfx.pickup();
    return;
  }
  if (typeof LevelUpPopup !== 'undefined') {
    LevelUpPopup.open({
      title: '🧳 Чемодан с оружием',
      cards: this.upgradeChoices.map((up) => {
        const card = saleChoiceToCard(up);
        if (up.kind === 'evolve' || up.kind === 'branch2') {
          card.evoReady = true;
          card.evoBadge = up.kind === 'branch2' ? '2-Я ВЕТКА' : 'ЭВО';
          card.evoName = up.ttl;
          card.isUpgrade = true;
        } else if (up.kind === 'weapon_up') {
          const def = SALE_WEAPONS[up.id];
          const next = (this.saleWeapons[up.id] || 0) + 1;
          if (def && next >= (def.max || 5)) card.evoName = 'Дальше — эволюция';
        }
        return card;
      }),
      onPick: (i) => this.pickSaleUpgrade(i),
    });
  }
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
  if (!this._saleRerolling) sfx.level();
};

Game.prototype.grantSaleV2BossCoupon = function (enemy) {
  const def = enemy && enemy.saleBossId && typeof SALE_BOSS_DEFS !== 'undefined'
    ? SALE_BOSS_DEFS[enemy.saleBossId]
    : null;
  const mythic = !!(def && def.mythicCoupon);
  this._saleV2UberQueue = this._saleV2UberQueue || [];
  this._saleV2UberQueue.push(mythic ? 'mythic' : 'normal');
  this._saleLevelFxT = Math.max(this._saleLevelFxT || 0, 0.55);
  this.showEventBanner(mythic ? '👑 Mythic-купон!' : '🏷 Чёрный купон!', 1.8);
  if (this._saleBal && typeof this.recordSaleBalanceV2Event === 'function') {
    this.recordSaleBalanceV2Event('coupon', {
      rarity: mythic ? 'mythic' : 'normal',
      bossId: (enemy && enemy.saleBossId) || '',
    });
  }
};

Game.prototype.buildSaleV2UberChoices = function (rarity) {
  const owned = new Set(this.saleUbers || []);
  const wantMythic = rarity === 'mythic';
  const pool = [];
  const mythics = typeof listSaleV2UbersByRarity === 'function'
    ? listSaleV2UbersByRarity('mythic') : [];
  const normals = typeof listSaleV2UbersByRarity === 'function'
    ? listSaleV2UbersByRarity('normal') : [];
  const unusedMythic = mythics.filter((u) => !owned.has(u.id));
  const unusedNormal = normals.filter((u) => !owned.has(u.id));
  if (wantMythic) {
    for (const u of unusedMythic) {
      pool.push(this.saleV2UberChoiceCard(u, 5));
    }
    for (const u of unusedNormal) {
      pool.push(this.saleV2UberChoiceCard(u, 1));
    }
  } else {
    for (const u of unusedNormal) {
      pool.push(this.saleV2UberChoiceCard(u, 1));
    }
  }
  return saleV2PickWeighted(pool, 3);
};

Game.prototype.saleV2UberChoiceCard = function (def, weight) {
  return {
    kind: 'uber',
    id: def.id,
    ico: def.ico,
    ttl: def.name,
    desc: def.desc,
    rarity: def.rarity,
    weight: weight || 1,
  };
};

Game.prototype.openSaleV2UberUI = function () {
  if (!this.saleV2) return;
  const queue = this._saleV2UberQueue || [];
  if (!queue.length) {
    this.openNextSaleV2Pick();
    return;
  }
  if (typeof SaleTreePopup !== 'undefined') SaleTreePopup.close();
  this.choosingUpgrade = true;
  this.paused = true;
  this._saleV2UberPick = true;
  this._saleV2WepPick = false;
  const rarity = queue[0];
  this.upgradeChoices = this.buildSaleV2UberChoices(rarity);
  if (!this.upgradeChoices.length) {
    this.saleOverflow = this.saleOverflow || {};
    this.saleOverflow.power = (this.saleOverflow.power || 0) + 1;
    this.showEventBanner('💪 Купоны кончились: +урон', 1.3);
    if (this._saleBal && typeof this.recordSaleBalanceV2Event === 'function') {
      this.recordSaleBalanceV2Event('overflow', { id: 'power', src: 'uber_empty' });
    }
    this._saleV2UberPick = false;
    this._saleV2UberQueue.shift();
    this.openNextSaleV2Pick();
    return;
  }
  const mythic = rarity === 'mythic';
  if (typeof LevelUpPopup !== 'undefined') {
    LevelUpPopup.open({
      title: mythic ? '👑 Mythic-купон' : '🏷 Чёрный купон',
      cards: this.upgradeChoices.map((up) => {
        const card = saleChoiceToCard(up);
        card.mythic = up.rarity === 'mythic';
        return card;
      }),
      onPick: (i) => this.pickSaleUpgrade(i),
    });
  }
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
  sfx.level();
};

Game.prototype.applySaleV2Uber = function (id) {
  const def = typeof getSaleV2Uber === 'function' ? getSaleV2Uber(id) : null;
  if (!def) return false;
  this.saleUbers = this.saleUbers || [];
  if (this.saleUbers.indexOf(id) >= 0) return false;
  this.saleUbers.push(id);
  if (def.stat && def.stat.hp) {
    this.player.maxHp += def.stat.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.stat.hp);
  }
  this.applySalePassivesToPlayer();
  this.showEventBanner((def.rarity === 'mythic' ? '👑 ' : '🏷 ') + def.name, 1.6);
  if (this._saleBal && typeof this.recordSaleBalanceV2Event === 'function') {
    this.recordSaleBalanceV2Event('uber', { id: def.id, rarity: def.rarity || 'normal' });
  }
  return true;
};

Game.prototype.applySaleV2WeaponTick = function () {
  const onField = (this.salePowerups || []).some((pu) => pu.kind === 'wepcase' && !pu.dead);
  if (onField || (this._saleV2WepPending | 0) > 0 || this._saleV2WepPick) return;
  const p = this.player;
  if (!p) return;
  const ang = Math.random() * Math.PI * 2;
  const distDrop = 80;
  this.spawnSalePowerup(
    p.x + Math.cos(ang) * distDrop,
    p.y + Math.sin(ang) * distDrop,
    'wepcase',
    { life: 90, r: 18, vx: rand(-18, 18), vy: rand(-24, -6) },
  );
  this.showEventBanner('🧳 Чемодан с оружием!', 1.4);
  sfx.pickup();
};

Game.prototype.tickSaleV2Weapons = function (dt) {
  if (!this.saleV2) return;
  const interval = typeof SALE_V2_WEAPON_TICK === 'number' ? SALE_V2_WEAPON_TICK : 30;
  this._saleV2WepT = (this._saleV2WepT == null ? interval : this._saleV2WepT) - dt;
  if (this._saleV2WepT > 0) return;
  this._saleV2WepT += interval;
  this.applySaleV2WeaponTick();
};

Game.prototype.tickSaleV2Capstones = function (dt) {
  if (!this.saleV2 || !this.player) return;
  const p = this.player;

  const regenLv = this.saleV2Stat('regen');
  if (regenLv > 0 && p.hp < p.maxHp) {
    this.saleRegenTimer = (this.saleRegenTimer || 0) + dt * regenLv;
    if (this.saleRegenTimer >= 12) {
      this.saleRegenTimer -= 12;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.spawnAnimFx('afx_heal', p.x, p.y - 10, { life: 0.3, scale: 0.55, vy: -14 });
    }
  }

  if (this.saleV2HasEffect('no_cd')) {
    this._saleV2FreeCdT = (this._saleV2FreeCdT || 0) - dt;
    if (this._saleV2FreeCdT <= 0 && !this._saleV2FreeShot) {
      this._saleV2FreeShot = true;
      this._saleV2FreeCdT = 12;
    }
  }

  if (this.saleV2HasEffect('aura_stun')) {
    this._saleV2AuraStunT = (this._saleV2AuraStunT || 0) - dt;
    if (this._saleV2AuraStunT <= 0) {
      this._saleV2AuraStunT = 8;
      const r = Math.max(this._saleAura && this._saleAura.r || 0, this._salePromoAuraR || 0, 90)
        * (this.saleAreaMul ? this.saleAreaMul() : 1);
      for (const e of this.enemies || []) {
        if (e.hp <= 0) continue;
        if (dist(p.x, p.y, e.x, e.y) > r + e.r) continue;
        e.stunTimer = Math.max(e.stunTimer || 0, 0.6);
      }
      this.spawnAnimFx('afx_ring', p.x, p.y, {
        life: 0.4, scale: 0.6, scaleEnd: Math.max(1.2, r / 80), tint: '#38bdf8',
      });
    }
  }

  if (this.saleV2HasEffect('loot_yank')) {
    this._saleV2YankT = (this._saleV2YankT || 0) - dt;
    if (this._saleV2YankT <= 0) {
      this._saleV2YankT = 15;
      this.saleVacuumT = Math.max(this.saleVacuumT || 0, 1.25);
      for (const pu of this.salePowerups || []) {
        if (!pu || pu.dead || pu.kind === 'wepcase') continue;
        pu.x = p.x + rand(-8, 8);
        pu.y = p.y + rand(-8, 8);
      }
      this.showEventBanner('🌀 Гравитация скидок', 1.1);
    }
  }

  if (this._saleV2TillCd > 0) this._saleV2TillCd -= dt;
};

Game.prototype.hookSaleV2PlayerDefense = function () {
  if (!this.saleV2 || !this.player || this.player._saleV2HurtHooked) return;
  const self = this;
  const orig = this.player.takeDamage.bind(this.player);
  this.player.takeDamage = function (fromX, fromY) {
    if (window.game && window.game.__god) return false;
    if (this.invincible > 0 || this.lunchTimer > 0) return orig(fromX, fromY);
    const armor = self.saleV2Stat('armor');
    if (armor > 0 && Math.random() < armor) {
      this.invincible = Math.max(this.invincible || 0, 0.2);
      self.spawnAnimFx('afx_ring', this.x, this.y, {
        life: 0.18, scale: 0.35, scaleEnd: 0.7, tint: '#94a3b8',
      });
      return false;
    }
    const lethal = this.hp <= 1 && !(this.extraLives > 0) && !(this.shieldCharges > 0);
    if (lethal && self.saleV2HasEffect('second_wind') && (self._saleV2TillCd || 0) <= 0) {
      this.hp = 1;
      this.invincible = 2;
      self._saleV2TillCd = 20;
      self.showEventBanner('🏦 Несокрушимая касса', 1.6);
      sfx.level();
      return false;
    }
    return orig(fromX, fromY);
  };
  this.player._saleV2HurtHooked = true;
};

Game.prototype.maxSaleV2Branch = function (branchId) {
  const nodes = saleV2PassivesInLane(branchId);
  for (const def of nodes) {
    while (this.saleV2NodeLevel(def.id) < (def.max || 1)) {
      if (!this.investSaleV2Node(def.id, { force: true })) break;
    }
  }
};
