/**
 * Распродажа: Отрисовка emoji-иконок оружия и карточек выбора.
 */
'use strict';

/** visual id в атласе оружия (wp_<id>1/2/3) */
const SALE_VISUAL_ALIAS = {
  fire: 'extinguisher', sound: 'speaker', beam: 'flashlight',
  blood: 'bloody_price', blood_aura: 'bloody_aura', bat: 'bats',
};

function saleVisualKey(visual) {
  if (!visual) return null;
  return SALE_VISUAL_ALIAS[visual] || visual;
}

/** Оружие в бою и UI — системные emoji (🧾 🧹 📱), не атлас. */
function drawSaleIcon(ctx, ico, x, y, scale, rot) {
  const mul = Math.max(0.45, scale || 1);
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  const s = Math.max(14, Math.round(22 * mul));
  ctx.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(ico || '?', 0, 0);
  ctx.fillText(ico || '?', 0, 0);
  ctx.restore();
}

function paintSaleChoiceIcon(el, up) {
  if (!el) return;
  // оружие / эволюции / пассивки — системные emoji из ico, если есть
  let ico = up.ico;
  if (!ico && up.kind === 'passive' && SALE_PASSIVES[up.id]) ico = SALE_PASSIVES[up.id].ico;
  if (!ico && SALE_WEAPONS[up.id]) ico = SALE_WEAPONS[up.id].ico;
  el.textContent = ico || '?';
}

function saleChoiceToCard(up) {
  if (typeof LevelUpPopup === 'undefined') {
    return {
      title: up.ttl || '?',
      description: up.desc || '',
      icon: up.ico || '?',
      level: null,
      isUpgrade: false,
    };
  }
  const card = LevelUpPopup.formatChoice(up);
  if (!up.ico) {
    if (up.kind === 'passive' && SALE_PASSIVES[up.id]) card.icon = SALE_PASSIVES[up.id].ico;
    else if (SALE_WEAPONS[up.id]) card.icon = SALE_WEAPONS[up.id].ico;
  }
  return card;
}
