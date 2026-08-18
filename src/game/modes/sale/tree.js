/**
 * Распродажа: дерево подготовки, готовые эволюции и сундук босса.
 */
'use strict';

Game.prototype.ensureSaleTreeState = function () {
  if (!Array.isArray(this.saleTreeUnlocked) || !this.saleTreeUnlocked.length) {
    this.saleTreeUnlocked = SALE_TREE_DEFAULT_UNLOCKED.slice();
  }
  this.saleTreeSelected = clampSaleTreeSelected(this.saleTreeSelected, this.saleTreeUnlocked);
  if (!this.saleTreeSelected.length) this.saleTreeSelected = SALE_TREE_DEFAULT_SELECTED.slice();
};

Game.prototype.buySaleTreeUnlock = function (id) {
  this.ensureSaleTreeState();
  const perk = getSaleTreePerk(id);
  if (!perk) return;
  if (this.saleTreeUnlocked.indexOf(id) >= 0) return;
  const cost = perk.cost | 0;
  if (cost > 0 && this.bankCoins < cost) { sfx.hurt(); return; }
  if (cost > 0) this.bankCoins -= cost;
  this.saleTreeUnlocked.push(id);
  if ((this.saleTreeSelected || []).length < SALE_TREE_MAX_SELECTED) {
    this.saleTreeSelected = clampSaleTreeSelected(this.saleTreeSelected.concat([id]), this.saleTreeUnlocked);
  }
  this.persist();
  this.renderBoosters();
  sfx.shop();
};

Game.prototype.toggleSaleTreePerk = function (id) {
  this.ensureSaleTreeState();
  if (this.saleTreeUnlocked.indexOf(id) < 0) {
    this.buySaleTreeUnlock(id);
    return;
  }
  const selected = this.saleTreeSelected.slice();
  const idx = selected.indexOf(id);
  if (idx >= 0) {
    selected.splice(idx, 1);
  } else {
    const perk = getSaleTreePerk(id);
    if (perk && perk.keystone && selected.some((sid) => {
      const other = getSaleTreePerk(sid);
      return other && other.keystone;
    })) {
      sfx.hurt();
      this.showEventBanner('Только один кейстоун', 1.4);
      return;
    }
    if (selected.length >= SALE_TREE_MAX_SELECTED) {
      sfx.hurt();
      this.showEventBanner('Активны уже 3 узла', 1.4);
      return;
    }
    selected.push(id);
  }
  this._saleTreeInspectId = id;
  this.saleTreeSelected = clampSaleTreeSelected(selected, this.saleTreeUnlocked);
  this.persist();
  this.renderBoosters();
  sfx.click();
};

Game.prototype.saleTreePerkStatus = function (perk) {
  const unlocked = (this.saleTreeUnlocked || []).indexOf(perk.id) >= 0;
  const selected = (this.saleTreeSelected || []).indexOf(perk.id) >= 0;
  const activeN = (this.saleTreeSelected || []).length;
  const cost = perk.cost | 0;
  let meta = '';
  if (!unlocked) meta = cost ? this.formatHubPrice(cost) : 'Открыть';
  else if (selected) {
    meta = perk.keystone
      ? `Кейстоун · ${activeN}/${SALE_TREE_MAX_SELECTED}`
      : `В забеге · ${activeN}/${SALE_TREE_MAX_SELECTED}`;
  } else meta = perk.keystone ? 'Кейстоун · взять' : 'Взять в забег';
  return { unlocked, selected, meta };
};

Game.prototype.fillSaleTreeInspect = function (root, perk) {
  if (!root || !perk) return;
  this._saleTreeInspectId = perk.id;
  const st = this.saleTreePerkStatus(perk);
  const nameEl = root.querySelector('.sale-tree__inspect-name');
  const descEl = root.querySelector('.sale-tree__inspect-desc');
  const metaEl = root.querySelector('.sale-tree__inspect-meta');
  if (nameEl) nameEl.textContent = (perk.keystone ? '◆ ' : '') + perk.name;
  if (descEl) descEl.textContent = perk.desc;
  if (metaEl) {
    metaEl.textContent = st.meta;
    metaEl.classList.toggle('is-on', st.selected);
    metaEl.classList.toggle('is-lock', !st.unlocked);
  }
};

Game.prototype.renderSaleTreePicker = function () {
  const box = document.getElementById('hub-prep-passives');
  if (!box) return;
  this.ensureSaleTreeState();

  const wrap = document.createElement('div');
  wrap.className = 'sale-tree';

  const activeN = (this.saleTreeSelected || []).length;
  const bar = document.createElement('div');
  bar.className = 'sale-tree__bar';
  const sockets = document.createElement('div');
  sockets.className = 'sale-tree__sockets';
  for (let i = 0; i < SALE_TREE_MAX_SELECTED; i++) {
    const sock = document.createElement('span');
    sock.className = 'sale-tree__socket' + (i < activeN ? ' is-on' : '');
    sockets.appendChild(sock);
  }
  const barTxt = document.createElement('span');
  barTxt.className = 'sale-tree__bar-text';
  barTxt.textContent = `${activeN}/${SALE_TREE_MAX_SELECTED} в забег · 1 кейстоун`;
  bar.appendChild(sockets);
  bar.appendChild(barTxt);
  wrap.appendChild(bar);

  const board = document.createElement('div');
  board.className = 'sale-tree__board';
  const branches = SALE_TREE_BRANCHES || [];
  for (const branch of branches) {
    const col = document.createElement('div');
    col.className = 'sale-tree__col sale-tree__col--' + branch.id;
    const title = document.createElement('div');
    title.className = 'sale-tree__col-title';
    title.textContent = branch.name;
    col.appendChild(title);

    const perks = SALE_TREE_PERKS.filter((perk) => perk.branch === branch.id);
    perks.forEach((perk, idx) => {
      if (idx > 0) {
        const prev = perks[idx - 1];
        const prevSt = this.saleTreePerkStatus(prev);
        const curSt = this.saleTreePerkStatus(perk);
        const link = document.createElement('div');
        link.className = 'sale-tree__link'
          + (curSt.selected || prevSt.selected ? ' is-on' : '')
          + (curSt.unlocked || prevSt.unlocked ? ' is-open' : '');
        col.appendChild(link);
      }
      const st = this.saleTreePerkStatus(perk);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sale-tree-node'
        + (perk.keystone ? ' is-keystone' : '')
        + (st.selected ? ' is-on' : '')
        + (st.unlocked && !st.selected ? ' is-ready' : '')
        + (!st.unlocked ? ' is-lock' : '');
      btn.setAttribute('aria-label', perk.name);
      const gem = document.createElement('span');
      gem.className = 'sale-tree-node__gem';
      const ico = document.createElement('span');
      ico.className = 'sale-tree-node__ico';
      ico.textContent = perk.ico;
      gem.appendChild(ico);
      btn.appendChild(gem);
      if (!st.unlocked && (perk.cost | 0) > 0) {
        const costEl = document.createElement('span');
        costEl.className = 'sale-tree-node__cost';
        costEl.textContent = String(perk.cost | 0);
        btn.appendChild(costEl);
      }
      btn.addEventListener('pointerenter', () => this.fillSaleTreeInspect(wrap, perk));
      btn.addEventListener('focus', () => this.fillSaleTreeInspect(wrap, perk));
      btn.addEventListener('click', () => {
        this._saleTreeInspectId = perk.id;
        this.toggleSaleTreePerk(perk.id);
      });
      col.appendChild(btn);
    });
    board.appendChild(col);
  }
  wrap.appendChild(board);

  const inspect = document.createElement('div');
  inspect.className = 'sale-tree__inspect';
  inspect.innerHTML = '<div class="sale-tree__inspect-name"></div>'
    + '<div class="sale-tree__inspect-desc"></div>'
    + '<div class="sale-tree__inspect-meta"></div>';
  wrap.appendChild(inspect);
  box.appendChild(wrap);

  const inspectId = this._saleTreeInspectId
    || (this.saleTreeSelected && this.saleTreeSelected[0])
    || SALE_TREE_DEFAULT_SELECTED[0];
  const inspectPerk = getSaleTreePerk(inspectId) || SALE_TREE_PERKS[0];
  this.fillSaleTreeInspect(wrap, inspectPerk);
};

Game.prototype.listSaleReadyEvolutions = function () {
  const ready = [];
  if (typeof SALE_EVOLUTIONS === 'undefined') return ready;
  for (const ev of SALE_EVOLUTIONS) {
    const fromMax = (SALE_WEAPONS[ev.from] && SALE_WEAPONS[ev.from].max) || 5;
    if ((this.saleWeapons[ev.from] || 0) < fromMax) continue;
    if (this.saleWeapons[ev.into]) continue;
    if (ev.v2Only && !this.saleV2) continue;
    if (ev.needPassive && !((this.salePassives[ev.needPassive] || 0) > 0)) continue;
    if (ev.needWeapon && !((this.saleWeapons[ev.needWeapon] || 0) > 0)) continue;
    ready.push(ev);
  }
  return ready;
};

Game.prototype.markSaleRecipeReady = function (fromId) {
  if (!fromId) return;
  this._saleRecipeReadyAt = this._saleRecipeReadyAt || {};
  if (this._saleRecipeReadyAt[fromId] != null) return;
  this._saleRecipeReadyAt[fromId] = Math.round((this.saleTime || 0) * 10) / 10;
  if (this._saleBal) {
    this._saleBal.recipeReadyAt = this._saleRecipeReadyAt;
  }
};

Game.prototype.refreshSaleRecipeReady = function () {
  for (const ev of this.listSaleReadyEvolutions()) this.markSaleRecipeReady(ev.from);
};

Game.prototype.applySaleEvolution = function (fromId, intoId) {
  if (!fromId || !intoId || !SALE_WEAPONS[intoId]) return false;
  delete this.saleWeapons[fromId];
  this.saleWeapons[intoId] = 1;
  this.saleWeaponCd = this.saleWeaponCd || {};
  this.saleWeaponCd[intoId] = 0.1;
  if (this.player) {
    this.spawnAnimFx('afx_levelup', this.player.x, this.player.y, {
      life: 1.15, scale: 1.7, scaleEnd: 2.2, anchorY: 0.9,
    });
    this.spawnParticles(this.player.x, this.player.y, 28, '#f1c40f', 240, 0.6);
  }
  this.applySalePassivesToPlayer();
  if (this._saleBal) {
    this._saleBal.evoTaken = this._saleBal.evoTaken || [];
    this._saleBal.evoTaken.push({ into: intoId, from: fromId, t: Math.round((this.saleTime || 0) * 10) / 10 });
  }
  if (this.saleV2 && typeof this.tryGrantSaleV2Meta === 'function') this.tryGrantSaleV2Meta();
  return true;
};

Game.prototype.saleEvolutionChoiceCard = function (ev) {
  const into = SALE_WEAPONS[ev.into];
  const fromDef = SALE_WEAPONS[ev.from];
  const fromName = (fromDef && fromDef.name) || ev.from;
  const role = SALE_ROLE_LABEL[into.type] || into.type;
  const before = fromDef ? (SALE_ROLE_LABEL[fromDef.type] || fromDef.type) : '?';
  const hint = ev.branchHint ? `${ev.branchHint} · ` : '';
  return {
    kind: 'evolve', id: ev.into, from: ev.from, ico: into.ico,
    ttl: ev.branch ? `✨ ${fromName} → ${ev.name}` : `✨ ${ev.name}`,
    desc: `${hint}${into.desc} · ${before} → ${role}`,
    branch: ev.branch || null,
    role,
  };
};

Game.prototype.openSaleChestEvolutionPick = function (ready, title) {
  this.choosingUpgrade = true;
  this.paused = true;
  this._saleChestEvoPick = true;
  this.upgradeChoices = ready.map((ev) => this.saleEvolutionChoiceCard(ev));
  if (typeof LevelUpPopup !== 'undefined') {
    LevelUpPopup.open({
      title: title || (this.saleV2 ? 'Эволюция · 6 ур.' : 'Эволюция из посылки'),
      cards: this.upgradeChoices.map((up) => {
        const card = saleChoiceToCard(up);
        card.evoReady = true;
        card.evoName = up.ttl;
        card.isUpgrade = true;
        return card;
      }),
      onPick: (i) => this.pickSaleUpgrade(i),
    });
  }
  this.updateUpgradeRerollBtn();
  this.refreshMusicState();
};

Game.prototype.tryGrantSaleChestEvolution = function () {
  const ready = this.listSaleReadyEvolutions();
  if (!ready.length) return false;
  const byFrom = {};
  for (const ev of ready) {
    (byFrom[ev.from] = byFrom[ev.from] || []).push(ev);
  }
  const branch = Object.keys(byFrom).map((k) => byFrom[k]).find((arr) => arr.length >= 2);
  if (branch) {
    this.openSaleChestEvolutionPick(branch);
    return true;
  }
  const ev = ready[0];
  this.applySaleEvolution(ev.from, ev.into);
  const into = SALE_WEAPONS[ev.into];
  this.showEventBanner(`✨ Посылка: ${into ? into.name : ev.name}!`, 2.2);
  sfx.level();
  return true;
};

Game.prototype.armSaleKeyPity = function (weaponId) {
  if (!weaponId) return;
  const keys = saleEvoKeysForWeapon(weaponId);
  if (!keys.length) return;
  if (keys.some((key) => (this.salePassives[key.id] || 0) > 0)) return;
  this._saleKeyPity = this._saleKeyPity || {};
  if (this._saleKeyPity[weaponId] != null) return;
  this._saleKeyPity[weaponId] = 2;
};

Game.prototype.saleOverflowUnlocked = function () {
  const n = typeof this.saleWeaponSlotCount === 'function'
    ? this.saleWeaponSlotCount()
    : Object.keys(this.saleWeapons || {}).filter((id) => (this.saleWeapons[id] || 0) > 0).length;
  const gate = typeof SALE_OVERFLOW_UNLOCK_SEC === 'number' ? SALE_OVERFLOW_UNLOCK_SEC : 720;
  return (this.saleTime || 0) >= gate || n >= this.saleMaxWeaponSlots();
};
