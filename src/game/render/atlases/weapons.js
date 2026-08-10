/** Оружие, эволюции и пассивки: спрайты в бою и иконки в UI. */

const WEAPON_FRAMES = {"wp_phone1":{"x":46,"y":28,"w":27,"h":28},"wp_phone2":{"x":101,"y":28,"w":31,"h":24},"wp_phone3":{"x":162,"y":28,"w":30,"h":29},"wp_cart1":{"x":50,"y":78,"w":50,"h":22},"wp_cart2":{"x":107,"y":78,"w":48,"h":22},"wp_cart3":{"x":161,"y":78,"w":56,"h":25},"wp_mop1":{"x":38,"y":112,"w":27,"h":34},"wp_mop2":{"x":92,"y":112,"w":33,"h":34},"wp_mop3":{"x":154,"y":112,"w":55,"h":34},"wp_extinguisher1":{"x":32,"y":167,"w":30,"h":21},"wp_extinguisher2":{"x":79,"y":164,"w":54,"h":24},"wp_extinguisher3":{"x":136,"y":155,"w":81,"h":33},"wp_coffee1":{"x":34,"y":211,"w":27,"h":25},"wp_coffee2":{"x":88,"y":211,"w":48,"h":26},"wp_coffee3":{"x":149,"y":206,"w":63,"h":32},"wp_receipt1":{"x":4,"y":643,"w":50,"h":52},"wp_receipt2":{"x":58,"y":643,"w":52,"h":37},"wp_receipt3":{"x":114,"y":643,"w":52,"h":36},"wp_card1":{"x":36,"y":270,"w":20,"h":13},"wp_card2":{"x":92,"y":270,"w":18,"h":12},"wp_card3":{"x":161,"y":296,"w":54,"h":14},"wp_bag1":{"x":42,"y":310,"w":30,"h":19},"wp_bag2":{"x":91,"y":310,"w":40,"h":16},"wp_bag3":{"x":157,"y":310,"w":56,"h":15},"wp_speaker1":{"x":283,"y":28,"w":52,"h":32},"wp_speaker2":{"x":335,"y":28,"w":51,"h":32},"wp_speaker3":{"x":384,"y":28,"w":26,"h":29},"wp_flashlight1":{"x":260,"y":79,"w":44,"h":28},"wp_flashlight2":{"x":311,"y":80,"w":36,"h":27},"wp_flashlight3":{"x":347,"y":78,"w":31,"h":21},"wp_chair1":{"x":259,"y":125,"w":27,"h":25},"wp_chair2":{"x":305,"y":125,"w":61,"h":25},"wp_chair3":{"x":372,"y":124,"w":43,"h":26},"wp_axe1":{"x":279,"y":177,"w":23,"h":18},"wp_axe2":{"x":318,"y":174,"w":40,"h":21},"wp_axe3":{"x":370,"y":173,"w":45,"h":22},"wp_magnet1":{"x":317,"y":195,"w":17,"h":15},"wp_magnet2":{"x":366,"y":226,"w":35,"h":14},"wp_magnet3":{"x":392,"y":195,"w":23,"h":16},"wp_spray1":{"x":260,"y":240,"w":43,"h":27},"wp_spray2":{"x":331,"y":242,"w":15,"h":12},"wp_spray3":{"x":350,"y":240,"w":56,"h":32},"wp_box1":{"x":254,"y":287,"w":28,"h":35},"wp_box2":{"x":302,"y":285,"w":100,"h":37},"wp_box3":{"x":391,"y":301,"w":21,"h":19},"wp_bloody_price1":{"x":524,"y":61,"w":29,"h":28},"wp_bloody_price2":{"x":592,"y":60,"w":41,"h":30},"wp_bloody_price3":{"x":660,"y":60,"w":50,"h":30},"wp_bite1":{"x":502,"y":97,"w":71,"h":31},"wp_bite2":{"x":582,"y":97,"w":73,"h":32},"wp_bite3":{"x":666,"y":95,"w":44,"h":34},"wp_bloody_aura1":{"x":481,"y":149,"w":33,"h":12},"wp_bloody_aura2":{"x":514,"y":138,"w":26,"h":15},"wp_bloody_aura3":{"x":675,"y":135,"w":35,"h":27},"wp_bats1":{"x":504,"y":177,"w":37,"h":26},"wp_bats2":{"x":587,"y":177,"w":37,"h":26},"wp_bats3":{"x":668,"y":177,"w":42,"h":27},"wp_graveyard1":{"x":523,"y":264,"w":21,"h":24},"wp_graveyard2":{"x":586,"y":262,"w":34,"h":27},"wp_graveyard3":{"x":648,"y":232,"w":62,"h":58},"pas_mug":{"x":755,"y":58,"w":36,"h":17},"pas_badge":{"x":807,"y":58,"w":43,"h":18},"pas_radio":{"x":920,"y":60,"w":35,"h":16},"pas_key":{"x":757,"y":91,"w":34,"h":26},"pas_charger":{"x":811,"y":89,"w":35,"h":29},"pas_discount":{"x":867,"y":92,"w":34,"h":27},"pas_pouch":{"x":923,"y":87,"w":30,"h":32},"pas_shoes":{"x":977,"y":87,"w":32,"h":32},"pas_headphones":{"x":754,"y":122,"w":39,"h":16},"pas_gloves":{"x":813,"y":122,"w":31,"h":16},"pas_map":{"x":976,"y":122,"w":33,"h":16},"pas_scanner":{"x":761,"y":151,"w":28,"h":35},"pas_gold_badge":{"x":810,"y":153,"w":36,"h":32},"pas_energy":{"x":868,"y":156,"w":30,"h":28},"pas_medkit":{"x":923,"y":154,"w":30,"h":31},"pas_sandwich":{"x":984,"y":155,"w":22,"h":30},"pas_headlamp":{"x":759,"y":215,"w":27,"h":29},"pas_umbrella":{"x":811,"y":216,"w":30,"h":28},"pas_token":{"x":865,"y":217,"w":31,"h":24},"pas_icecream":{"x":921,"y":214,"w":32,"h":31},"pas_fidget":{"x":980,"y":215,"w":29,"h":30},"pas_scissors":{"x":865,"y":247,"w":34,"h":16},"pas_pen":{"x":762,"y":275,"w":21,"h":34},"pas_calc":{"x":812,"y":277,"w":31,"h":30},"pas_folder":{"x":868,"y":276,"w":31,"h":32},"pas_plane":{"x":925,"y":277,"w":27,"h":31},"pas_usb":{"x":977,"y":275,"w":33,"h":33},"pas_battery":{"x":807,"y":311,"w":42,"h":16},"pas_gum":{"x":760,"y":339,"w":25,"h":21},"pas_coffee_xl":{"x":813,"y":345,"w":28,"h":15},"evo_phone5g":{"x":139,"y":420,"w":35,"h":43},"evo_mag_cart":{"x":131,"y":477,"w":51,"h":40},"evo_cleaner":{"x":130,"y":535,"w":40,"h":35},"evo_caffeine":{"x":142,"y":592,"w":46,"h":40},"evo_black_card":{"x":420,"y":421,"w":47,"h":33},"evo_ultrasound":{"x":410,"y":475,"w":75,"h":36},"evo_endless_receipt":{"x":409,"y":535,"w":76,"h":29},"evo_logistics":{"x":400,"y":590,"w":71,"h":35},"evo_furniture_ram":{"x":625,"y":423,"w":48,"h":31},"evo_mall_fire":{"x":618,"y":475,"w":79,"h":43},"evo_consultant_call":{"x":627,"y":535,"w":67,"h":30},"evo_hunter":{"x":623,"y":593,"w":67,"h":37},"evo_black_friday":{"x":854,"y":421,"w":89,"h":40},"evo_vip":{"x":890,"y":481,"w":64,"h":41},"evo_sleepless":{"x":888,"y":536,"w":62,"h":42},"evo_night_consultant":{"x":882,"y":592,"w":61,"h":47}};
const weaponImg = new Image();
let weaponReady = false;
weaponImg.onload = () => { weaponReady = true; };
weaponImg.src = 'assets/atlases/weapon_atlas.png';

// Чистые UI-иконки пассивок / эволюций / аур (Pixel Mart + CC0 FX)
const skillIconImg = new Image();
let skillIconReady = false;
skillIconImg.onload = () => { skillIconReady = true; };
skillIconImg.src = 'assets/atlases/skill_icon_atlas.png';

function drawSkillIconFrame(ctx, key, x, y, opts = {}) {
  if (!skillIconReady || !window.SKILL_ICON_FRAMES?.[key]) return false;
  const f = window.SKILL_ICON_FRAMES[key];
  const target = opts.targetSize ?? 40;
  const base = Math.max(f.w, f.h) || 1;
  const scale = opts.scale != null ? opts.scale : (target / base);
  ctx.save();
  ctx.translate(x, y);
  if (opts.rot) ctx.rotate(opts.rot);
  ctx.imageSmoothingEnabled = false;
  const ok = drawAtlasFrame(ctx, skillIconImg, true, window.SKILL_ICON_FRAMES, key, 0, 0, {
    scale,
    anchorX: opts.anchorX ?? 0.5,
    anchorY: opts.anchorY ?? 0.5,
    alpha: opts.alpha,
  });
  ctx.restore();
  return ok;
}

/** Отрисовка кадра оружия: штатный weapon_atlas (чеки/тележки/…) → skill_icon fallback. */
function drawWeaponAtlas(ctx, visual, stage, x, y, opts = {}) {
  if (!visual) return false;
  let st = Math.max(1, Math.min(3, stage | 0 || 2));
  // 1) системный атлас оружия игры
  if (weaponReady) {
    let key = `wp_${visual}${st}`;
    if (!WEAPON_FRAMES[key]) {
      key = null;
      for (const alt of [2, 1, 3]) {
        const k = `wp_${visual}${alt}`;
        if (WEAPON_FRAMES[k]) { key = k; st = alt; break; }
      }
    }
    // эволюции иногда лежат как evo_* в том же атласе
    if (!key && WEAPON_FRAMES[`evo_${visual}`]) key = `evo_${visual}`;
    if (key) {
      const f = WEAPON_FRAMES[key];
      const target = opts.targetSize ?? 36;
      const base = Math.max(f.w, f.h) || 1;
      const scale = opts.scale != null ? opts.scale : (target / base);
      ctx.save();
      ctx.translate(x, y);
      if (opts.rot) ctx.rotate(opts.rot);
      const ok = drawAtlasFrame(ctx, weaponImg, true, WEAPON_FRAMES, key, 0, 0, {
        scale,
        anchorX: opts.anchorX ?? 0.5,
        anchorY: opts.anchorY ?? 0.5,
        alpha: opts.alpha,
      });
      ctx.restore();
      if (ok) return true;
    }
  }
  // 2) fallback: skill_icon_atlas (если кадра нет в weapon_atlas)
  const skillKey = `wp_${visual}${st}`;
  if (drawSkillIconFrame(ctx, skillKey, x, y, {
    targetSize: opts.targetSize ?? 36,
    scale: opts.scale,
    rot: opts.rot,
    alpha: opts.alpha,
    anchorX: opts.anchorX,
    anchorY: opts.anchorY,
  })) {
    return true;
  }
  return drawSkillIconFrame(ctx, `evo_${visual}`, x, y, {
    targetSize: opts.targetSize ?? 36,
    scale: opts.scale,
    rot: opts.rot,
    alpha: opts.alpha,
  });
}

function drawWeaponEvoIcon(ctx, evoId, x, y, opts = {}) {
  const key = `evo_${evoId}`;
  // штатный weapon_atlas первым — там уже есть эволюции оружия
  if (weaponReady && WEAPON_FRAMES[key]) {
    const f = WEAPON_FRAMES[key];
    const target = opts.targetSize ?? 40;
    const base = Math.max(f.w, f.h) || 1;
    const scale = opts.scale != null ? opts.scale : (target / base);
    ctx.save();
    ctx.translate(x, y);
    const ok = drawAtlasFrame(ctx, weaponImg, true, WEAPON_FRAMES, key, 0, 0, {
      scale,
      anchorX: 0.5,
      anchorY: 0.5,
      alpha: opts.alpha,
    });
    ctx.restore();
    if (ok) return true;
  }
  return drawSkillIconFrame(ctx, key, x, y, {
    targetSize: opts.targetSize ?? 40,
    scale: opts.scale,
    alpha: opts.alpha,
  });
}

function drawPassiveAtlas(ctx, id, x, y, opts = {}) {
  const key = `pas_${id}`;
  if (drawSkillIconFrame(ctx, key, x, y, {
    targetSize: opts.targetSize ?? 28,
    scale: opts.scale,
    alpha: opts.alpha,
  })) {
    return true;
  }
  if (!weaponReady || !WEAPON_FRAMES[key]) return false;
  const f = WEAPON_FRAMES[key];
  const target = opts.targetSize ?? 28;
  const base = Math.max(f.w, f.h) || 1;
  const scale = opts.scale != null ? opts.scale : (target / base);
  return drawAtlasFrame(ctx, weaponImg, true, WEAPON_FRAMES, key, x, y, {
    scale,
    anchorX: 0.5,
    anchorY: 0.5,
    alpha: opts.alpha,
  });
}
