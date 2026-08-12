/** Вылазка: кнопка закрытия магазина и диалог подтверждения. */

Object.assign(Game.prototype, {
  bindExtractShop() {
    const wrap = document.getElementById('extract-shop-close-wrap');
    if (wrap && !wrap._extractBound) {
      wrap._extractBound = true;
      if (typeof UiButton === 'undefined') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Закрыть';
        btn.addEventListener('click', () => this.closeExtractShop());
        wrap.appendChild(btn);
      } else {
        wrap.appendChild(UiButton.create({
          text: 'Закрыть',
          variant: 'menu',
          size: 'md',
          full: true,
          onClick: () => this.closeExtractShop(),
        }));
      }
    }

    const actions = document.getElementById('extract-confirm-actions');
    if (actions && !actions._extractBound) {
      actions._extractBound = true;
      actions.innerHTML = '';
      const mk = (id, text, variant, fn) => {
        if (typeof UiButton !== 'undefined') {
          const b = UiButton.create({
            text,
            variant: variant || 'menu',
            size: 'md',
            full: true,
            onClick: fn,
          });
          b.id = id;
          actions.appendChild(b);
          return b;
        }
        const b = document.createElement('button');
        b.type = 'button';
        b.id = id;
        b.textContent = text;
        b.addEventListener('click', fn);
        actions.appendChild(b);
        return b;
      };
      // id нужны openExtractConfirm для подписи
      const ok = mk('extract-confirm-ok', 'Да', 'menu', () => this.closeExtractConfirm(true));
      const cancel = mk('extract-confirm-cancel', 'Отмена', 'menu', () => this.closeExtractConfirm(false));
      ok.classList.add('extract-confirm-ok');
      cancel.classList.add('extract-confirm-cancel');
    }
  },
});
