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
      phaseEl.textContent = this.extractPhase === 'raid'
        ? (this.getExtractFloorDef(this.extractFloor || 1).label || 'Этаж ТЦ')
        : 'Парковка';
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
        const cell = document.createElement('div');
        const it = pack[i];
        cell.className = 'extract-slot'
          + (it ? ' filled' : '')
          + (it && it.kind === 'gear' ? ' is-gear' : '');
        cell.textContent = it ? (it.ico || '•') : '';
        cell.title = it
          ? (it.kind === 'gear' ? `${it.name} (мод · теряется при смерти)` : it.name)
          : `Слот ${i + 1}`;
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
      else if (focus.role === 'elevator' || focus.role === 'elevator_exit') hint.textContent = focus.label || 'Лифт';
      else if (focus.name) hint.textContent = focus.name;
      else if (focus.loot && focus.loot.def) hint.textContent = focus.loot.def.name;
      else hint.textContent = '';
    }
    btn.classList.toggle('is-locked', !!locked);
  },

  updateExtractHUD() {
    if (this.gameMode !== 'extract' || this.extractPhase !== 'raid' || !this.player) return;
    const hpEl = document.getElementById('extract-hud-hp');
    if (!hpEl) return;
    const max = Math.max(1, this.player.maxHp | 0);
    const hp = Math.max(0, this.player.hp | 0);
    const next = '❤'.repeat(hp) + '♡'.repeat(Math.max(0, max - hp));
    if (hpEl.textContent !== next) hpEl.textContent = next;
  },
});
