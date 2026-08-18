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
  return total;
};

Game.prototype.saleV2HasEffect = function (effect) {
  if (!this.saleV2 || !effect) return false;
  for (const [id, lv] of Object.entries(this.salePassives || {})) {
    const def = getSaleV2Passive(id);
    if (def && def.effect === effect && (lv | 0) >= (def.max || 1)) return true;
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
  if (this.saleV2ChoiceLocked('root', def.root)) return false;
  if (this.saleV2ChoiceLocked(def.fork, def.option)) return false;
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
  if (def.fork && def.option && !this._saleV2Picked[def.fork]) {
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
  this._saleV2InspectId = id;
  if (this.pendingUpgrades > 0) this.openSaleV2TreeUI();
  else this.closeSaleV2TreeUI();
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
    this.pendingUpgrades = Math.max(0, (this.pendingUpgrades | 0) - 1);
    if (this.pendingUpgrades > 0) {
      this.openSaleV2TreeUI();
      return;
    }
    this.closeSaleV2TreeUI();
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
    locked: this.saleV2ChoiceLocked('root', side.id),
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
        locked: this.saleV2ChoiceLocked(lane.fork || side.id, lane.id),
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

Game.prototype.saleV2WeaponOffered = function (id) {
  const def = SALE_WEAPONS[id];
  if (!def || def.evolved) return false;
  const banTypes = (this.saleContract && this.saleContract.banTypes) || [];
  if (banTypes.includes(def.type)) return false;
  if (typeof this.isSaleWeaponHeroUnlocked === 'function' && !this.isSaleWeaponHeroUnlocked(id)) {
    return false;
  }
  return true;
};

Game.prototype.buildSaleV2WeaponChoices = function () {
  const candidates = [];
  const slotCount = Object.keys(this.saleWeapons || {}).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
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

  if (this.saleOverflowUnlocked()) {
    for (const [wid] of Object.entries(this.saleWeapons || {})) {
      const def = SALE_WEAPONS[wid];
      if (!def || banned['w:' + wid]) continue;
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
  const fillers = [
    { kind: 'overflow', id: 'power', ico: '💪', ttl: 'Сверхурочные', desc: '+8% урона всему' },
    { kind: 'heal', id: 'heal', ico: '❤️', ttl: 'Перерыв', desc: '+2 HP' },
    { kind: 'overflow', id: 'tempo', ico: '⏱️', ttl: 'Час пик', desc: '−6% перезарядка оружия' },
  ];
  for (const f of fillers) {
    if (picked.length >= 3) break;
    const key = f.kind + ':' + f.id;
    if (used.has(key)) continue;
    picked.push(f);
    used.add(key);
  }
  return picked;
};

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
    this._saleV2WepPick = false;
    this._saleV2WepPending = Math.max(0, (this._saleV2WepPending | 0) - 1);
    if ((this._saleV2WepPending || 0) > 0) {
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
    sfx.pickup();
    return;
  }
  if (typeof LevelUpPopup !== 'undefined') {
    LevelUpPopup.open({
      title: '🧳 Чемодан с оружием',
      cards: this.upgradeChoices.map((up) => {
        const card = saleChoiceToCard(up);
        if (up.kind === 'evolve') {
          card.evoReady = true;
          card.evoBadge = 'ЭВО';
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
