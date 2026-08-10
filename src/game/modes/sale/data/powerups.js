/**
 * Распродажа: Пауэрапы и лимит баншей.
 */
'use strict';

/** Пауэрапы (LN-style: chest / magnet / bomb / heart) */
const SALE_POWERUPS = {
  chest: { id: 'chest', ico: '📦', sprite: 'paper_bag', name: 'Посылка со склада', color: '#d35400' },
  magnet: { id: 'magnet', ico: '🧲', name: 'Промо-магнит', color: '#9b59b6' },
  bomb: { id: 'bomb', ico: '🧨', name: 'Хлопушка', color: '#e74c3c' },
  heart: { id: 'heart', ico: '❤️', name: 'Сердце', color: '#e11d48' },
};
const SALE_BANISH_LIMIT = 2;
