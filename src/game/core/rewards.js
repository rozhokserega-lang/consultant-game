/** Награда за убийство: монеты, статистика, книга жалоб. */

Object.assign(Game.prototype, {
  recordKill(type) {
    if (!type) return;
    if (!this.killLog) this.killLog = {};
    this.killLog[type] = (this.killLog[type] || 0) + 1;
  },

  dropCoins(enemy) {
    let amount = enemy.coinDrop || 1;
    amount = Math.max(1, Math.round(amount * (this.coinMult || 1) * (this.waveCoinBonus || 1)));
    if (this.combo >= 8) amount += 1;
    if (this.blackFriday) amount += 1;
    this.pickups.push(new Pickup(enemy.x + rand(-10, 10), enemy.y + rand(-10, 10), 'coin', amount));
  },

  onEnemyKilled(enemy) {
    // Shift-волны удалены; Sale перехватывает через onSaleEnemyKilled.
    if (enemy) this.recordKill(enemy.type);
  },
});
