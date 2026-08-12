/**
 * Вылазка: мини-левел-ап в рейде за рабочие жетоны.
 */
'use strict';

Object.assign(Game.prototype, {
  grantExtractRaidTokens(n) {
    n = Math.max(0, n | 0);
    if (!n) return;
    const max = (typeof EXTRACT_RAID_UPGRADE_MAX !== 'undefined') ? EXTRACT_RAID_UPGRADE_MAX : 5;
    const have = this.extractRaidUpgrades | 0;
    const room = Math.max(0, max - have - (this._extractUpgradeQueue || 0));
    const add = Math.min(room, n);
    if (add <= 0) {
      this.showExtractBanner('Жетон: лимит апгрейдов забега', 1.8);
      return;
    }
    this._extractUpgradeQueue = (this._extractUpgradeQueue || 0) + add;
    this.showExtractBanner(`🎫 Рабочий жетон ×${add} — выбери усиление`, 2.4);
    this.tryOpenExtractRaidUpgrade();
  },

  tryOpenExtractRaidUpgrade() {
    if ((this._extractUpgradeQueue || 0) <= 0) return;
    if (this.shopping || this.paused || this.gameOver) return;
    if (this.extractPhase !== 'raid') return;
    this.openExtractRaidUpgradePanel();
  },

  openExtractRaidUpgradePanel() {
    const pool = (typeof EXTRACT_RAID_UPGRADE_POOL !== 'undefined')
      ? EXTRACT_RAID_UPGRADE_POOL.slice()
      : [];
    if (!pool.length) return;
    // 3 случайных уникальных
    const picks = [];
    while (picks.length < 3 && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(i, 1)[0]);
    }
    this._extractShopMode = 'raid_upgrade';
    this.shopping = true;
    this.paused = true;
    const root = document.getElementById('extract-shop-overlay');
    if (!root) return;
    const left = this._extractUpgradeQueue | 0;
    const done = this.extractRaidUpgrades | 0;
    const max = (typeof EXTRACT_RAID_UPGRADE_MAX !== 'undefined') ? EXTRACT_RAID_UPGRADE_MAX : 5;
    this._extractShopSetHeader(
      '🎫 Жетон смены',
      `Усиление забега ${done + 1}/${max} · осталось жетонов: <b>${left}</b>`,
    );
    const extra = document.getElementById('extract-shop-extra');
    if (extra) {
      extra.innerHTML = '<p class="extract-shop-empty">Работает до эвакуации или смерти. Не копится в хаб.</p>';
    }
    const list = document.getElementById('extract-shop-list');
    if (!list) return;
    list.innerHTML = '';
    for (const up of picks) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'extract-shop-item';
      row.innerHTML = `<span class="extract-shop-ico">${up.ico || '✦'}</span>
        <span class="extract-shop-body">
          <b>${up.name}</b>
          <small>${up.desc}</small>
        </span>
        <span class="extract-shop-price">Взять</span>`;
      row.addEventListener('click', () => this.pickExtractRaidUpgrade(up.id));
      list.appendChild(row);
    }
    root.classList.add('show');
    this.refreshMusicState();
  },

  pickExtractRaidUpgrade(id) {
    if (!this.applyExtractRaidUpgrade(id)) return;
    this.extractRaidUpgrades = (this.extractRaidUpgrades || 0) + 1;
    this._extractUpgradeQueue = Math.max(0, (this._extractUpgradeQueue || 0) - 1);
    sfx.level();
    if ((this._extractUpgradeQueue || 0) > 0) {
      this.openExtractRaidUpgradePanel();
      return;
    }
    this.closeExtractShop();
    this.showExtractBanner('Усиление принято', 1.6);
  },

  applyExtractRaidUpgrade(id) {
    this.extractRaidMods = this.extractRaidMods || { dmg: 1, speed: 1, haste: 0, area: 0, hp: 0 };
    const m = this.extractRaidMods;
    const p = this.player;
    if (id === 'might') {
      m.dmg *= 1.12;
      this.saleWeaponDmgMul = (this.saleWeaponDmgMul || 1) * 1.12;
      this.showExtractBanner('⚔️ +12% урон');
      return true;
    }
    if (id === 'tempo') {
      m.haste += 1;
      this.salePassives = this.salePassives || {};
      this.salePassives.haste = (this.salePassives.haste || 0) + 1;
      if (typeof this.applySalePassivesToPlayer === 'function') this.applySalePassivesToPlayer();
      this.showExtractBanner('⚡ быстрее КД');
      return true;
    }
    if (id === 'boots') {
      m.speed *= 1.1;
      if (p) p._extractRaidSpeed = (p._extractRaidSpeed || 1) * 1.1;
      this.showExtractBanner('👟 +10% скорость');
      return true;
    }
    if (id === 'reach') {
      m.area += 1;
      this.salePassives = this.salePassives || {};
      this.salePassives.area = (this.salePassives.area || 0) + 1;
      this.showExtractBanner('📐 +размер атак');
      return true;
    }
    if (id === 'patch') {
      m.hp += 1;
      if (p) {
        p.maxHp += 1;
        p.hp = Math.min(p.maxHp, (p.hp | 0) + 1);
      }
      this.showExtractBanner('🩹 +1❤');
      return true;
    }
    return false;
  },

  /** Восстановить баффы забега после rebuild игрока (подъём этажа). */
  reapplyExtractRaidMods(opts) {
    opts = opts || {};
    const m = this.extractRaidMods;
    if (!m || !this.player) return;
    if (m.dmg && m.dmg !== 1) {
      this.saleWeaponDmgMul = (this.saleWeaponDmgMul || 1) * m.dmg;
    }
    if (m.haste) {
      this.salePassives = this.salePassives || {};
      this.salePassives.haste = (this.salePassives.haste || 0) + m.haste;
    }
    if (m.area) {
      this.salePassives = this.salePassives || {};
      this.salePassives.area = (this.salePassives.area || 0) + m.area;
    }
    if (m.speed && m.speed !== 1) {
      this.player._extractRaidSpeed = m.speed;
    }
    // HP уже в snap при continueRun — не удваивать
    if (m.hp && !opts.skipHp) {
      this.player.maxHp += m.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + m.hp);
    }
    if (typeof this.applySalePassivesToPlayer === 'function') this.applySalePassivesToPlayer();
  },
});
