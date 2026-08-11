/** Вылазка: кнопка закрытия магазина. */

Object.assign(Game.prototype, {
  bindExtractShop() {
    const wrap = document.getElementById('extract-shop-close-wrap');
    if (!wrap || wrap._extractBound) return;
    wrap._extractBound = true;
    if (typeof UiButton === 'undefined') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Закрыть';
      btn.addEventListener('click', () => this.closeExtractShop());
      wrap.appendChild(btn);
      return;
    }
    wrap.appendChild(UiButton.create({
      text: 'Закрыть',
      variant: 'menu',
      size: 'md',
      full: true,
      onClick: () => this.closeExtractShop(),
    }));
  },
});
