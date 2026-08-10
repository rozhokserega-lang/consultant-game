/** Основной атлас: плитка пола, вывески, препятствия, пикапы. */

const ATLAS_DATA = {"frames":{"player_front":{"x":693,"y":2,"w":39,"h":86},"player_side":{"x":910,"y":2,"w":42,"h":83},"player_back":{"x":734,"y":2,"w":39,"h":86},"player_run1":{"x":186,"y":104,"w":53,"h":80},"player_run2":{"x":954,"y":2,"w":57,"h":83},"player_attack":{"x":891,"y":104,"w":52,"h":75},"enemy_tank":{"x":2,"y":104,"w":74,"h":83},"enemy_woman_purple":{"x":78,"y":104,"w":73,"h":82},"enemy_fast":{"x":843,"y":2,"w":65,"h":84},"enemy_elder":{"x":479,"y":104,"w":57,"h":79},"enemy_boss":{"x":611,"y":2,"w":80,"h":87},"enemy_manager":{"x":775,"y":2,"w":66,"h":86},"enemy_cane":{"x":538,"y":104,"w":63,"h":79},"tile_beige":{"x":679,"y":189,"w":72,"h":65},"tile_dark":{"x":753,"y":189,"w":67,"h":65},"tile_gloss":{"x":822,"y":189,"w":73,"h":63},"tile_diamond":{"x":606,"y":189,"w":71,"h":66},"tile_stone":{"x":459,"y":189,"w":71,"h":68},"tile_wood":{"x":170,"y":189,"w":71,"h":73},"tile_black":{"x":780,"y":104,"w":69,"h":76},"tile_check":{"x":945,"y":104,"w":75,"h":74},"tile_speckle":{"x":2,"y":189,"w":70,"h":74},"tile_crack":{"x":243,"y":189,"w":72,"h":72},"plant":{"x":532,"y":189,"w":39,"h":68},"plant_cone":{"x":573,"y":189,"w":31,"h":68},"bench":{"x":295,"y":265,"w":79,"h":54},"trash":{"x":2,"y":265,"w":39,"h":60},"sale_pillar":{"x":329,"y":2,"w":54,"h":96},"fire_box":{"x":377,"y":189,"w":35,"h":69},"map_board":{"x":463,"y":265,"w":70,"h":52},"sign_dir":{"x":74,"y":189,"w":56,"h":74},"escalator":{"x":500,"y":2,"w":109,"h":94},"cart":{"x":43,"y":265,"w":69,"h":60},"clothes_rack":{"x":603,"y":104,"w":175,"h":77},"mannequin":{"x":153,"y":104,"w":31,"h":82},"mirror":{"x":414,"y":189,"w":43,"h":69},"sale_banner":{"x":851,"y":104,"w":38,"h":76},"fold_table":{"x":535,"y":265,"w":74,"h":52},"store_tech":{"x":2,"y":2,"w":105,"h":100},"store_clothes":{"x":219,"y":2,"w":108,"h":97},"store_food":{"x":109,"y":2,"w":108,"h":99},"store_sport":{"x":385,"y":2,"w":113,"h":96},"sign_sale":{"x":611,"y":265,"w":60,"h":52},"sign_burger":{"x":2,"y":327,"w":49,"h":45},"sign_exit":{"x":673,"y":265,"w":38,"h":52},"sign_floor":{"x":376,"y":265,"w":39,"h":54},"sign_nosmoke":{"x":162,"y":265,"w":40,"h":56},"plant_small":{"x":713,"y":265,"w":43,"h":52},"planter":{"x":53,"y":327,"w":44,"h":43},"plant_tall":{"x":317,"y":189,"w":58,"h":72},"box_stack":{"x":290,"y":327,"w":67,"h":33},"crate":{"x":165,"y":327,"w":55,"h":36},"barrel_blue":{"x":359,"y":327,"w":49,"h":33},"barrel_red":{"x":204,"y":265,"w":89,"h":56},"barrel_green":{"x":943,"y":189,"w":46,"h":61},"wet_floor":{"x":99,"y":327,"w":64,"h":43},"camera":{"x":758,"y":265,"w":35,"h":52},"metal_detector":{"x":132,"y":189,"w":36,"h":74},"checkout":{"x":897,"y":189,"w":44,"h":62},"vending":{"x":114,"y":265,"w":46,"h":60},"atm":{"x":795,"y":265,"w":44,"h":51},"medkit_wall":{"x":417,"y":265,"w":44,"h":54},"pickup_heart":{"x":518,"y":327,"w":33,"h":28},"pickup_bolt":{"x":410,"y":327,"w":24,"h":33},"pickup_coin":{"x":553,"y":327,"w":29,"h":28},"pickup_key":{"x":584,"y":327,"w":27,"h":28},"pickup_medkit":{"x":613,"y":327,"w":34,"h":28},"pickup_shield":{"x":222,"y":327,"w":30,"h":34},"pickup_shoe":{"x":679,"y":327,"w":31,"h":27},"pickup_glove":{"x":649,"y":327,"w":28,"h":28},"fx_boom":{"x":436,"y":327,"w":35,"h":33},"fx_smoke":{"x":473,"y":327,"w":43,"h":33},"fx_dust":{"x":254,"y":327,"w":34,"h":34},"dmg_10":{"x":712,"y":327,"w":24,"h":22},"dmg_25":{"x":738,"y":327,"w":35,"h":22},"btn_pause":{"x":893,"y":265,"w":46,"h":47},"btn_settings":{"x":941,"y":265,"w":47,"h":47},"ui_hud":{"x":241,"y":104,"w":236,"h":80},"portrait":{"x":841,"y":265,"w":50,"h":48}}};

// ── Атлас спрайтов ──
const atlasImg = new Image();
let atlasReady = false;
atlasImg.onload = () => { atlasReady = true; };
atlasImg.src = 'assets/atlases/main_atlas.png';

function spr(name) {
  return ATLAS_DATA.frames[name] || null;
}

function drawSprite(ctx, name, x, y, opts = {}) {
  const f = spr(name);
  if (!f || !atlasReady) return false;
  const scale = opts.scale ?? 1;
  const dw = (opts.w ?? f.w) * scale;
  const dh = (opts.h ?? f.h) * scale;
  const ax = opts.anchorX ?? 0.5;
  const ay = opts.anchorY ?? 1.0;
  const flip = !!opts.flip;
  ctx.save();
  ctx.translate(x, y);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (flip) ctx.scale(-1, 1);
  if (opts.rotation) ctx.rotate(opts.rotation);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlasImg, f.x, f.y, f.w, f.h, -dw * ax, -dh * ay, dw, dh);
  ctx.restore();
  return true;
}
