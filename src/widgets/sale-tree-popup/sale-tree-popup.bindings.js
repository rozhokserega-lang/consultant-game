/** Распродажа 2.0: попап дерева на левел-апе. */

Object.assign(Game.prototype, {
  buildSaleTreePopup() {
    const overlay = document.getElementById('sale-tree-overlay');
    if (!overlay || typeof SaleTreePopup === 'undefined') return;
    SaleTreePopup.mount(overlay);
  },
});
