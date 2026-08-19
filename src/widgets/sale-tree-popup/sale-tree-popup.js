/**
 * Распродажа 2.0: дерево пассивок на паузе левел-апа.
 * Подключение:
 *   <link rel="stylesheet" href="src/widgets/sale-tree-popup/sale-tree-popup.css">
 *   <script src="src/widgets/sale-tree-popup/sale-tree-popup.js"></script>
 *   <div id="sale-tree-overlay"></div>
 */
(function (global) {
  'use strict';

  let overlayEl = null;
  let handlers = {};

  const TEMPLATE = `
    <div class="sale-v2-tree" id="sale-v2-tree-root">
      <header class="sale-v2-tree__head">
        <h2 class="sale-v2-tree__title" id="sale-v2-tree-title">Дерево смены</h2>
        <p class="sale-v2-tree__points" id="sale-v2-tree-points">Очки 0</p>
      </header>
      <p class="sale-v2-tree__hint">Все ветки открыты. Сначала корень ветки, потом её листья.</p>
      <div class="sale-v2-tree__tabs" id="sale-v2-tree-tabs"></div>
      <div class="sale-v2-tree__board" id="sale-v2-tree-board"></div>
      <div class="sale-v2-tree__inspect" id="sale-v2-tree-inspect">
        <div class="sale-v2-tree__inspect-name" id="sale-v2-tree-iname"></div>
        <div class="sale-v2-tree__inspect-desc" id="sale-v2-tree-idesc"></div>
        <div class="sale-v2-tree__inspect-meta" id="sale-v2-tree-imeta"></div>
      </div>
    </div>`;

  function fillInspect(node) {
    const nameEl = document.getElementById('sale-v2-tree-iname');
    const descEl = document.getElementById('sale-v2-tree-idesc');
    const metaEl = document.getElementById('sale-v2-tree-imeta');
    if (!node || !nameEl) return;
    nameEl.textContent = (node.capstone ? '◆ ' : '') + node.name;
    descEl.textContent = node.desc;
    let meta = node.lv + '/' + node.max;
    if (node.evoName) meta += ' · эво: ' + node.evoName;
    if (node.state === 'open') meta += ' · доступен';
    else if (node.state === 'max') meta += ' · максимум';
    else if (node.state === 'locked') meta += ' · закрыт';
    metaEl.textContent = meta;
  }

  function nodeBtn(node, inspectId) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sale-v2-node is-' + node.state
      + (node.capstone ? ' is-capstone' : '')
      + (node.tier === 1 ? ' is-t1' : '')
      + (node.id === inspectId ? ' is-inspect' : '');
    const capMark = node.capstone ? '<span class="sale-v2-node__mark">◆</span>' : '';
    btn.innerHTML = '<span class="sale-v2-node__ico">' + (node.ico || '') + '</span>'
      + '<span class="sale-v2-node__name">' + node.name + '</span>'
      + capMark
      + '<span class="sale-v2-node__lv">' + node.lv + '/' + node.max + '</span>';
    const inspect = () => {
      handlers.onInspect?.(node.id);
      fillInspect(node);
      const board = document.getElementById('sale-v2-tree-board');
      if (board) {
        board.querySelectorAll('.sale-v2-node.is-inspect').forEach((el) => {
          el.classList.remove('is-inspect');
        });
        btn.classList.add('is-inspect');
      }
    };
    btn.addEventListener('pointerenter', inspect);
    btn.addEventListener('click', () => {
      inspect();
      if (node.state === 'open') handlers.onPick?.(node.id);
    });
    return btn;
  }

  function render(opts) {
    const title = document.getElementById('sale-v2-tree-title');
    const points = document.getElementById('sale-v2-tree-points');
    const tabs = document.getElementById('sale-v2-tree-tabs');
    const board = document.getElementById('sale-v2-tree-board');
    if (title) title.textContent = opts.title || 'Дерево смены';
    if (points) points.textContent = 'Очки ' + (opts.points | 0);

    const sides = opts.board || [];
    const sideId = opts.side || (sides[0] && sides[0].id);
    const side = sides.find((s) => s.id === sideId) || sides[0];

    if (tabs) {
      tabs.innerHTML = '';
      sides.forEach((s) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sale-v2-tree__tab'
          + (s.id === sideId ? ' is-on' : '')
          + (s.locked ? ' is-locked' : '');
        btn.textContent = (s.ico ? s.ico + ' ' : '') + s.name;
        btn.onclick = () => handlers.onSide?.(s.id);
        tabs.appendChild(btn);
      });
    }

    if (!board) return;
    board.innerHTML = '';
    if (!side) return;

    let inspectNode = null;
    (side.lanes || []).forEach((lane) => {
      const laneEl = document.createElement('section');
      laneEl.className = 'sale-v2-lane' + (lane.locked ? ' is-locked' : '');
      const laneHead = document.createElement('div');
      laneHead.className = 'sale-v2-lane__head';
      laneHead.textContent = (lane.ico ? lane.ico + ' ' : '') + lane.name
        + (lane.locked ? ' · закрыто' : '');
      laneEl.appendChild(laneHead);
      if (lane.t1) {
        if (lane.t1.id === opts.inspectId) inspectNode = lane.t1;
        laneEl.appendChild(nodeBtn(lane.t1, opts.inspectId));
      }
      const fork = document.createElement('div');
      fork.className = 'sale-v2-fork';
      fork.setAttribute('aria-hidden', 'true');
      fork.innerHTML = '<span class="sale-v2-fork__stem"></span>'
        + '<span class="sale-v2-fork__bar"></span>'
        + '<span class="sale-v2-fork__legs">'
        + '<span class="sale-v2-fork__leg"></span>'
        + '<span class="sale-v2-fork__leg"></span>'
        + '</span>';
      laneEl.appendChild(fork);
      const split = document.createElement('div');
      split.className = 'sale-v2-split';
      (lane.leaves || []).forEach((leaf) => {
        const leafEl = document.createElement('div');
        leafEl.className = 'sale-v2-leaf' + (leaf.locked ? ' is-locked' : '');
        if (leaf.t2) {
          if (leaf.t2.id === opts.inspectId) inspectNode = leaf.t2;
          leafEl.appendChild(nodeBtn(leaf.t2, opts.inspectId));
        }
        const arrow = document.createElement('div');
        arrow.className = 'sale-v2-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        leafEl.appendChild(arrow);
        if (leaf.cap) {
          if (leaf.cap.id === opts.inspectId) inspectNode = leaf.cap;
          leafEl.appendChild(nodeBtn(leaf.cap, opts.inspectId));
        }
        split.appendChild(leafEl);
      });
      laneEl.appendChild(split);
      board.appendChild(laneEl);
    });

    if (!inspectNode) {
      const firstOpen = [];
      (side.lanes || []).forEach((lane) => {
        if (lane.t1) firstOpen.push(lane.t1);
        (lane.leaves || []).forEach((leaf) => {
          if (leaf.t2) firstOpen.push(leaf.t2);
          if (leaf.cap) firstOpen.push(leaf.cap);
        });
      });
      inspectNode = firstOpen.find((n) => n.state === 'open') || firstOpen[0];
    }
    fillInspect(inspectNode);
  }

  const SaleTreePopup = {
    mount(root) {
      if (!root) return;
      overlayEl = root;
      overlayEl.classList.add('overlay', 'sale-tree-overlay');
      overlayEl.innerHTML = TEMPLATE;
    },
    open(opts) {
      if (!overlayEl) return;
      handlers = {
        onPick: opts.onPick,
        onInspect: opts.onInspect,
        onSide: opts.onSide,
      };
      render(opts || {});
      overlayEl.classList.add('show');
    },
    close() {
      overlayEl?.classList.remove('show');
    },
  };

  global.SaleTreePopup = SaleTreePopup;
})(typeof window !== 'undefined' ? window : globalThis);
