/**
 * Вылазка: HUD рюкзака, HP и кнопка взаимодействия.
 */
'use strict';

Object.assign(Game.prototype, {
  refreshExtractHud() {
    const bar = document.getElementById('extract-hud');
    if (!bar) return;
    const show = this.gameMode === 'extract' && !this.inMainMenu;
    bar.classList.toggle('show', !!show);
    if (!show) return;

    const meta = this.ensureExtractMeta();
    const coinsEl = document.getElementById('extract-hud-coins');
    if (coinsEl) coinsEl.textContent = String(meta.coins | 0);

    const phaseEl = document.getElementById('extract-hud-phase');
    if (phaseEl) {
      let phase = this.extractPhase === 'raid'
        ? (this.getExtractFloorDef(this.extractFloor || 1).label || 'Этаж ТЦ')
        : 'Парковка';
      if (this._extractModSetOn && this.extractPhase === 'raid') phase += ' · сет';
      phaseEl.textContent = phase;
    }

    const totEl = document.getElementById('extract-hud-total');
    if (totEl) totEl.textContent = String(meta.totalExtractedValue | 0);

    const evacEl = document.getElementById('extract-hud-evac');
    if (evacEl) {
      if (this.extractPhase === 'raid' && this._extractEvacT != null && this._extractEvacT > 0 && !this._extractEvacFired) {
        evacEl.textContent = '⏳' + Math.ceil(this._extractEvacT) + 'с';
        evacEl.style.display = '';
      } else if (this.extractPhase === 'raid' && this._extractEvacFired) {
        evacEl.textContent = '🚨 охрана';
        evacEl.style.display = '';
      } else {
        evacEl.textContent = '';
        evacEl.style.display = 'none';
      }
    }

    const heatEl = document.getElementById('extract-hud-heat');
    if (heatEl) {
      if (this.extractPhase === 'raid' && typeof this.getExtractHeatLevel === 'function') {
        const heat = this.getExtractHeatLevel();
        const t = Math.floor(this.extractRaidTime || 0);
        if (heat >= 2) {
          heatEl.textContent = '🔥 жар · ' + t + 'с';
          heatEl.classList.add('is-hard');
          heatEl.style.display = '';
        } else if (heat >= 1 || t >= 40) {
          heatEl.textContent = (heat >= 1 ? '⚠ груз · ' : '⏱ ') + t + 'с';
          heatEl.classList.remove('is-hard');
          heatEl.style.display = '';
        } else {
          heatEl.textContent = '';
          heatEl.style.display = 'none';
        }
      } else {
        heatEl.textContent = '';
        heatEl.style.display = 'none';
      }
    }

    const upgEl = document.getElementById('extract-hud-upg');
    if (upgEl) {
      if (this.extractPhase === 'raid') {
        const max = (typeof EXTRACT_RAID_UPGRADE_MAX !== 'undefined') ? EXTRACT_RAID_UPGRADE_MAX : 5;
        const done = this.extractRaidUpgrades | 0;
        const q = this._extractUpgradeQueue | 0;
        const card = (typeof this.hasExtractVipCard === 'function' && this.hasExtractVipCard()) ? ' 🪪' : '';
        if (done > 0 || q > 0 || card) {
          upgEl.textContent = '🎫' + done + '/' + max + (q ? ('+' + q) : '') + card;
          upgEl.style.display = '';
        } else {
          upgEl.textContent = '';
          upgEl.style.display = 'none';
        }
      } else {
        upgEl.textContent = '';
        upgEl.style.display = 'none';
      }
    }

    const hpEl = document.getElementById('extract-hud-hp');
    if (hpEl) {
      if (this.extractPhase === 'raid' && this.player) {
        const max = Math.max(1, this.player.maxHp | 0);
        const hp = Math.max(0, this.player.hp | 0);
        hpEl.textContent = '❤'.repeat(hp) + '♡'.repeat(Math.max(0, max - hp));
        hpEl.style.display = '';
      } else {
        hpEl.textContent = '';
        hpEl.style.display = 'none';
      }
    }

    const slotsEl = document.getElementById('extract-hud-slots');
    if (slotsEl) {
      const pack = this.extractBackpack || [];
      slotsEl.innerHTML = '';
      for (let i = 0; i < pack.length; i++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        const it = pack[i];
        cell.className = 'extract-slot'
          + (it ? ' filled' : '')
          + (it && it.kind === 'gear' ? ' is-gear' : '')
          + (it && it.kind === 'consumable' ? ' is-consumable' : '')
          + (it && it.kind === 'bulkPad' ? ' is-bulk-pad' : '')
          + (it && it.insured ? ' is-insured' : '')
          + (it && extractItemSlotSize(it) > 1 ? ' is-bulky' : '');
        if (it && it.kind === 'bulkPad') cell.textContent = '⋯';
        else cell.textContent = it ? (it.ico || '•') : '';
        cell.disabled = !it;
        if (it && it.kind === 'consumable') {
          cell.title = `${it.name} · клик: использовать / выбросить`;
        } else if (it && it.kind === 'gear') {
          cell.title = `${it.name} (мод) · клик: выбросить` + (it.insured ? ' 🛡️' : '');
        } else if (it && it.kind === 'bulkPad') {
          cell.title = 'Крупный предмет · клик: выбросить';
          cell.disabled = false;
        } else if (it) {
          const sz = extractItemSlotSize(it);
          cell.title = it.name + (sz > 1 ? ` · ${sz} слота` : '') + (it.insured ? ' 🛡️' : '') + ' · клик: выбросить';
        } else {
          cell.title = `Слот ${i + 1}`;
        }
        const idx = i;
        cell.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onExtractSlotClick(idx);
        });
        slotsEl.appendChild(cell);
      }
    }
    this.refreshExtractInteractBtn();
  },

  refreshExtractInteractBtn() {
    const btn = document.getElementById('extract-interact-btn');
    if (!btn) return;
    const focus = this.extractFocus;
    const show = this.gameMode === 'extract' && !this.shopping && !this.paused && !!focus;
    btn.classList.toggle('show', !!show);
    if (!show) return;

    const locked = (focus.role === 'loot' && focus.locked)
      || (focus.role === 'elevator_exit' && focus.locked);
    const label = btn.querySelector('.extract-interact-label');
    const hint = btn.querySelector('#extract-interact-hint') || btn.querySelector('.extract-interact-hint');
    if (label) label.textContent = 'Взаимодействовать';
    if (hint) {
      if (focus.role === 'elevator_exit' && focus.locked) hint.textContent = 'Охраняет босс';
      else if (locked) hint.textContent = 'Сначала убери охрану';
      else if (focus.role === 'elevator' || focus.role === 'elevator_exit') {
        const t = (this._extractEvacT != null && this._extractEvacT > 0 && !this._extractEvacFired)
          ? ` · ${Math.ceil(this._extractEvacT)}с`
          : '';
        hint.textContent = (focus.label || 'Лифт') + t;
      } else if (focus.name) hint.textContent = focus.name;
      else if (focus.loot && focus.loot.def) {
        const slots = (focus.loot.def.slots | 0) > 1 ? ` (${focus.loot.def.slots} сл.)` : '';
        hint.textContent = focus.loot.def.name + slots;
      } else hint.textContent = '';
    }
    btn.classList.toggle('is-locked', !!locked);
  },

  updateExtractHUD() {
    if (this.gameMode !== 'extract' || this.extractPhase !== 'raid' || !this.player) return;
    const hpEl = document.getElementById('extract-hud-hp');
    if (hpEl) {
      const max = Math.max(1, this.player.maxHp | 0);
      const hp = Math.max(0, this.player.hp | 0);
      const next = '❤'.repeat(hp) + '♡'.repeat(Math.max(0, max - hp));
      if (hpEl.textContent !== next) hpEl.textContent = next;
    }
    const evacEl = document.getElementById('extract-hud-evac');
    if (evacEl) {
      if (this._extractEvacT != null && this._extractEvacT > 0 && !this._extractEvacFired) {
        const next = '⏳' + Math.ceil(this._extractEvacT) + 'с';
        if (evacEl.textContent !== next) evacEl.textContent = next;
        evacEl.style.display = '';
      } else if (this._extractEvacFired) {
        if (evacEl.textContent !== '🚨 охрана') evacEl.textContent = '🚨 охрана';
        evacEl.style.display = '';
      }
    }
  },
});
