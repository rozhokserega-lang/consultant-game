/** Иконки оружия в руках игрока — отдельные PNG, не атлас. */

const WEAPON_ICON_NAMES = [
  'wicon_fist', 'wicon_glove', 'wicon_bat', 'wicon_wrench', 'wicon_hammer',
  'wicon_mallet', 'wicon_sledge', 'wicon_crowbar', 'wicon_pan', 'wicon_cleaver',
  'wicon_axe', 'wicon_pipe', 'wicon_knife',
];

const weaponIconImgs = {};
(function loadWeaponIcons() {
  for (const name of WEAPON_ICON_NAMES) {
    const img = new Image();
    img.src = `assets/icons/weapons/${name}.png`;
    weaponIconImgs[name] = img;
  }
})();

function drawWeaponIcon(ctx, name, x, y, opts = {}) {
  const img = weaponIconImgs[name];
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = opts.scale || 0.55;
  const rot = opts.rotation || 0;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.save();
  ctx.translate(x, y);
  if (opts.flip) ctx.scale(-1, 1);
  if (rot) ctx.rotate(rot);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
  return true;
}
