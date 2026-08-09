/**
 * Pixel button — фабрика и хелперы.
 * Подключение: <script src="shared/ui/button/button.js"></script>
 *
 * @example
 * const btn = UiButton.create({ text: 'Продолжить', variant: 'primary', size: 'lg', full: true });
 * document.querySelector('.hub-footer').appendChild(btn);
 */
(function (global) {
  'use strict';

  const VARIANTS = ['primary', 'accent', 'ghost', 'danger', 'success', 'menu'];
  const SIZES = ['sm', 'md', 'lg'];

  /**
   * @param {HTMLElement} el
   * @param {string} className
   */
  function addClass(el, className) {
    if (className) el.classList.add(className);
  }

  /**
   * @param {Record<string, unknown>} options
   * @returns {HTMLButtonElement}
   */
  function createButton(options = {}) {
    const {
      text = '',
      variant = 'primary',
      size = 'md',
      full = false,
      disabled = false,
      type = 'button',
      id,
      className = '',
      icon,
      iconPosition = 'left',
      ariaLabel,
      onClick,
    } = options;

    const btn = document.createElement('button');
    btn.type = type;
    btn.className = 'button';

    if (variant && variant !== 'primary') {
      addClass(btn, `button--${variant}`);
    } else {
      addClass(btn, 'button--primary');
    }

    if (size && size !== 'md') addClass(btn, `button--${size}`);
    if (full) addClass(btn, 'button--full');
    if (disabled) {
      btn.disabled = true;
      addClass(btn, 'button--disabled');
    }
    if (className) btn.classList.add(...className.split(/\s+/).filter(Boolean));
    if (id) btn.id = id;
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);

    if (icon && !text) addClass(btn, 'button--icon-only');

    if (icon && iconPosition === 'left') {
      const iconEl = document.createElement('span');
      iconEl.className = 'button__icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.textContent = icon;
      btn.appendChild(iconEl);
    }

    if (text) {
      const label = document.createElement('span');
      label.className = 'button__label';
      label.textContent = text;
      btn.appendChild(label);
    }

    if (icon && iconPosition === 'right') {
      const iconEl = document.createElement('span');
      iconEl.className = 'button__icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.textContent = icon;
      btn.appendChild(iconEl);
    }

    if (typeof onClick === 'function') {
      btn.addEventListener('click', onClick);
    }

    return btn;
  }

  /**
   * Обновляет существующий <button> до pixel-стиля.
   * @param {HTMLButtonElement} el
   * @param {Record<string, unknown>} [options]
   * @returns {HTMLButtonElement}
   */
  function enhanceButton(el, options = {}) {
    if (!(el instanceof HTMLButtonElement)) {
      throw new TypeError('enhanceButton: expected HTMLButtonElement');
    }

    const {
      variant = 'primary',
      size = 'md',
      full = false,
    } = options;

    el.classList.add('button', `button--${variant}`);
    if (size !== 'md') el.classList.add(`button--${size}`);
    if (full) el.classList.add('button--full');

    const rawText = el.textContent.trim();
    el.textContent = '';

    const label = document.createElement('span');
    label.className = 'button__label';
    label.textContent = rawText;
    el.appendChild(label);

    return el;
  }

  /**
   * Программно зажать/отпустить кнопку (для тач-UI).
   * @param {HTMLButtonElement} el
   * @param {boolean} pressed
   */
  function setPressed(el, pressed) {
    el.classList.toggle('button--pressed', Boolean(pressed));
  }

  const UiButton = {
    VARIANTS,
    SIZES,
    create: createButton,
    enhance: enhanceButton,
    setPressed,
  };

  global.UiButton = UiButton;
})(typeof window !== 'undefined' ? window : globalThis);
