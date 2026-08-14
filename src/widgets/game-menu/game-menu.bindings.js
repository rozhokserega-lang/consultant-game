/** Игровое меню паузы: сборка, открытие, обновление. */

Object.assign(Game.prototype, {
  buildGameMenu() {
    const root = document.getElementById('game-menu-root');
    if (!root || typeof GameMenu === 'undefined') return;

    GameMenu.mount(root, {
      resume: () => this.closeGameMenu(),
      restart: () => {
        this.hideOverlays();
        if (this.gameMode === 'extract') this.startExtractHub({ resetPack: true });
        else this.startGame();
      },
      abilities: () => {
        this.renderPauseLoadout('game-menu-loadout');
        GameMenu.showView(root, 'abilities');
        sfx.click();
      },
      exit: () => {
        this.hideOverlays();
        if (this.gameMode === 'extract') this.endExtractToMenu();
        else this.openMainMenu();
      },
      toggleSound: () => {
        sfx.enabled = !sfx.enabled;
        this.persist();
        this.refreshGameMenuUI();
        this.refreshSettingsUI();
        sfx.click();
      },
      toggleMusic: () => {
        music.setEnabled(!music.enabled);
        this.persist();
        this.refreshGameMenuUI();
        this.refreshSettingsUI();
        sfx.click();
      },
      toggleVibro: () => {
        this.vibro = !this.vibro;
        this.persist();
        this.refreshGameMenuUI();
        this.refreshSettingsUI();
      },
    });
    this.refreshGameMenuUI();
  },

  openGameMenu() {
    if (this.isBoostersOpen() || this.inMainMenu || this.gameOver || this.won || this.choosingUpgrade || this.shopping) return;
    this.refreshGameMenuUI();
    const root = document.getElementById('game-menu-root');
    if (root && typeof GameMenu !== 'undefined') GameMenu.showView(root, 'main');
    document.getElementById('game-menu-overlay').classList.add('show');
    document.getElementById('settings-overlay')?.classList.remove('show');
    this.paused = true;
    this.refreshPauseUI();
    this.refreshMusicState();
    sfx.click();
  },

  closeGameMenu() {
    document.getElementById('game-menu-overlay').classList.remove('show');
    const root = document.getElementById('game-menu-root');
    if (root && typeof GameMenu !== 'undefined') GameMenu.showView(root, 'main');
    if (!this.gameOver && !this.won) this.paused = false;
    this.refreshPauseUI();
    this.refreshMusicState();
    sfx.click();
  },

  refreshGameMenuUI() {
    const root = document.getElementById('game-menu-root');
    if (!root || typeof GameMenu === 'undefined') return;
    GameMenu.refreshToggles(root, {
      sound: sfx.enabled,
      music: music.enabled,
      vibro: this.vibro,
    });
  },

  renderPauseLoadout(containerId = 'game-menu-loadout') {
    const box = document.getElementById(containerId);
    if (!box) return;
    const wepMax = typeof this.saleMaxWeaponSlots === 'function'
      ? this.saleMaxWeaponSlots()
      : (typeof SALE_MAX_WEAPONS !== 'undefined' ? SALE_MAX_WEAPONS : 4);
    const passMax = typeof SALE_MAX_PASSIVES !== 'undefined' ? SALE_MAX_PASSIVES : 8;
    const weps = Object.entries(this.saleWeapons || {})
      .filter(([, lv]) => lv > 0)
      .map(([id, lv]) => {
        const def = (typeof SALE_WEAPONS !== 'undefined' && SALE_WEAPONS[id]) || { ico: '⚔', name: id, max: 5 };
        return `<button type="button" class="pause-chip pause-chip--wep" data-wep="${id}" aria-label="${def.name || id}">`
          + `<span>${def.ico || '⚔'}</span>`
          + `<span class="nm">${def.name || id}</span>`
          + `<span class="lv">Lv${lv}${def.max ? '/' + def.max : ''}</span>`
          + `</button>`;
      });
    const pass = Object.entries(this.salePassives || {})
      .filter(([, lv]) => lv > 0)
      .map(([id, lv]) => {
        const def = (typeof SALE_PASSIVES !== 'undefined' && SALE_PASSIVES[id]) || { ico: '◆', name: id, max: 5 };
        return `<span class="pause-chip"><span>${def.ico || '◆'}</span><span class="nm">${def.name || id}</span><span class="lv">Lv${lv}${def.max ? '/' + def.max : ''}</span></span>`;
      });
    // Мета-перки из Подготовки не занимают слот забега, но должны быть видны в паузе.
    const meta = (typeof META_PERKS !== 'undefined' ? META_PERKS : [])
      .filter((def) => ((this.metaPerks && this.metaPerks[def.id]) || 0) > 0)
      .map((def) => {
        const lv = this.metaPerks[def.id] || 0;
        return `<span class="pause-chip"><span>${def.ico || '◆'}</span><span class="nm">${def.name}</span><span class="lv">Lv${lv}/${def.max}</span></span>`;
      });
    const passChips = meta.concat(pass);
    box.innerHTML = `
      <div class="sec">Оружие · ${weps.length}/${wepMax}</div>
      <div class="pause-chips">${weps.length ? weps.join('') : '<span class="pause-empty">Пока только кулаки…</span>'}</div>
      <div class="pause-wep-detail" id="pause-wep-detail" hidden></div>
      <div class="sec">Пассивки · ${pass.length}/${passMax}</div>
      <div class="pause-chips">${passChips.length ? passChips.join('') : '<span class="pause-empty">Пассивок ещё нет</span>'}</div>
    `;
    if (!box._saleWepClickBound) {
      box._saleWepClickBound = true;
      box.addEventListener('click', (ev) => {
        const chip = ev.target.closest && ev.target.closest('.pause-chip--wep');
        if (!chip || !box.contains(chip)) return;
        const id = chip.getAttribute('data-wep');
        if (!id) return;
        box.querySelectorAll('.pause-chip--wep.is-active').forEach((el) => el.classList.remove('is-active'));
        chip.classList.add('is-active');
        this.showPauseWeaponDetail(id);
        if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
      });
    }
  },

  /** Теоретический ST DPS текущего оружия с учётом пассивок/героя/SCALE. */
  estimateSaleWeaponStDps(weaponId) {
    const def = typeof SALE_WEAPONS !== 'undefined' ? SALE_WEAPONS[weaponId] : null;
    const lv = (this.saleWeapons && this.saleWeapons[weaponId]) || 0;
    if (!def || lv <= 0) return { dps: 0, hit: 0, count: 0, cd: 0, note: '' };
    const level = Math.min(def.max || 5, Math.max(1, lv)) - 1;
    const dmgM = this.saleDmgMul ? this.saleDmgMul() : 1;
    const cdM = this.saleCdMul ? this.saleCdMul() : 1;
    const overW = (this.saleWeaponOver && this.saleWeaponOver[weaponId]) || 0;
    let dmg = Math.max(1, Math.round((def.dmg[level] || def.dmg[0] || 1) * dmgM * (1 + overW * 0.07)));
    if (def.type === 'aura' && this.saleAuraDmgMul) {
      dmg = Math.max(1, Math.round(dmg * this.saleAuraDmgMul()));
    }
    if (def.type === 'sword') {
      const sprayLv = (this.salePassives && this.salePassives.spray) || 0;
      dmg = Math.max(1, Math.round(dmg * (1 + sprayLv * 0.12)));
    }
    const count = (def.count && (def.count[level] != null ? def.count[level] : def.count[0])) || 1;
    const cd = Math.max(0.05, (def.baseCd || 1) * cdM);
    const t = def.type;
    let dps = 0;
    let note = 'по одной цели';
    if (t === 'orbit') {
      const orbCd = ((typeof SALE_DIFFICULTY !== 'undefined' && SALE_DIFFICULTY.orbHitCd) || 0.42) * cdM;
      dps = dmg / Math.max(0.05, orbCd);
      note = 'орбита · общий КД на враге';
    } else if (t === 'aura' || t === 'radio') {
      dps = dmg / cd;
    } else if (t === 'beam') {
      dps = dmg / 0.1;
      note = 'луч · тик 0.1с';
    } else if (t === 'sword') {
      dps = (dmg * count) / 0.35;
      note = 'швабра · оценка касаний';
    } else if (t === 'puddle') {
      const flat = this.saleFlatDmg ? this.saleFlatDmg(1) : 1;
      dps = (dmg * count) / cd + flat / 0.35;
      note = 'удар + лужа DoT';
    } else {
      dps = (dmg * count) / cd;
    }
    return {
      dps: Math.round(dps * 10) / 10,
      hit: dmg,
      count,
      cd: Math.round(cd * 100) / 100,
      note,
    };
  },

  getSaleWeaponEvoTips(weaponId) {
    const def = typeof SALE_WEAPONS !== 'undefined' ? SALE_WEAPONS[weaponId] : null;
    if (!def) return [];
    if (def.evolved) {
      return [{ done: true, text: 'Уже эволюция — дальше не качается' }];
    }
    if (typeof SALE_EVOLUTIONS === 'undefined') return [];
    const tips = [];
    for (const ev of SALE_EVOLUTIONS) {
      if (ev.from !== weaponId) continue;
      const into = SALE_WEAPONS[ev.into];
      const pass = typeof SALE_PASSIVES !== 'undefined' ? SALE_PASSIVES[ev.needPassive] : null;
      const havePass = ev.needPassive ? ((this.salePassives && this.salePassives[ev.needPassive]) || 0) > 0 : true;
      const fromMax = def.max || 5;
      const curLv = (this.saleWeapons && this.saleWeapons[weaponId]) || 0;
      const haveMax = curLv >= fromMax;
      const already = !!(this.saleWeapons && this.saleWeapons[ev.into]);
      tips.push({
        name: ev.name || (into && into.name) || ev.into,
        ico: (into && into.ico) || '✨',
        passLabel: pass ? `${pass.ico || ''} ${pass.name}`.trim() : (ev.needPassive || '—'),
        havePass,
        haveMax,
        fromMax,
        curLv,
        ready: havePass && haveMax && !already,
        already,
        branch: ev.branch || null,
        hint: ev.branchHint || (into && into.desc) || '',
      });
    }
    return tips;
  },

  showPauseWeaponDetail(weaponId) {
    const el = document.getElementById('pause-wep-detail');
    if (!el) return;
    const def = typeof SALE_WEAPONS !== 'undefined' ? SALE_WEAPONS[weaponId] : null;
    const lv = (this.saleWeapons && this.saleWeapons[weaponId]) || 0;
    if (!def || lv <= 0) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    const st = this.estimateSaleWeaponStDps(weaponId);
    const tips = this.getSaleWeaponEvoTips(weaponId);
    let evoHtml = '';
    if (!tips.length) {
      evoHtml = '<div class="pause-wep-detail__muted">Эволюций нет</div>';
    } else {
      evoHtml = tips.map((t) => {
        if (t.done) return `<div class="pause-wep-detail__evo is-done">${t.text}</div>`;
        if (t.already) {
          return `<div class="pause-wep-detail__evo is-done">${t.ico} ${t.name} — уже есть</div>`;
        }
        const maxMark = t.haveMax ? '✓' : `✗ нужно Lv${t.fromMax} (сейчас ${t.curLv})`;
        const passMark = t.havePass ? '✓' : '✗ нет в билде';
        const status = t.ready
          ? '<span class="pause-wep-detail__ready">готово к эво</span>'
          : '<span class="pause-wep-detail__wait">ещё не готово</span>';
        const branch = t.branch ? `«${t.branch}» · ` : '';
        return `<div class="pause-wep-detail__evo ${t.ready ? 'is-ready' : ''}">`
          + `<div class="pause-wep-detail__evo-title">${t.ico} ${t.name} ${status}</div>`
          + `<div class="pause-wep-detail__evo-need">Оружие max: ${maxMark}</div>`
          + `<div class="pause-wep-detail__evo-need">Пассивка: ${t.passLabel} — ${passMark}</div>`
          + (t.hint ? `<div class="pause-wep-detail__muted">${branch}${t.hint}</div>` : '')
          + `</div>`;
      }).join('');
    }
    el.hidden = false;
    el.innerHTML = `
      <div class="pause-wep-detail__head">${def.ico || ''} <b>${def.name || weaponId}</b> · Lv${lv}/${def.max || 1}</div>
      <div class="pause-wep-detail__stats">
        Удар: <b>${st.hit}</b>
        ${st.count > 1 ? ` · ×${st.count}` : ''}
        ${st.cd ? ` · КД ${st.cd}с` : ''}
        · ST DPS ≈ <b>${st.dps}</b>
      </div>
      <div class="pause-wep-detail__muted">${st.note} · без учёта AoE/оверкилла</div>
      <div class="pause-wep-detail__sec">Эволюция</div>
      ${evoHtml}
    `;
  },
});
