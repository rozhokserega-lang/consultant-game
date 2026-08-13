/** Спрайт-лист консультанта и выбор анимации по направлению. */

// ── Анимации консультанта (новый спрайт-лист) ──
const PLAYER_ANIM = {"frames":{"walk_up_0":{"x":2,"y":2,"w":40,"h":85},"walk_up_1":{"x":44,"y":2,"w":39,"h":85},"walk_up_2":{"x":85,"y":2,"w":39,"h":85},"walk_up_3":{"x":126,"y":2,"w":38,"h":85},"walk_up_4":{"x":166,"y":2,"w":39,"h":85},"walk_up_5":{"x":207,"y":2,"w":40,"h":85},"walk_down_0":{"x":249,"y":2,"w":41,"h":85},"walk_down_1":{"x":292,"y":2,"w":41,"h":85},"walk_down_2":{"x":335,"y":2,"w":40,"h":85},"walk_down_3":{"x":377,"y":2,"w":41,"h":85},"walk_down_4":{"x":420,"y":2,"w":41,"h":85},"walk_down_5":{"x":463,"y":2,"w":39,"h":85},"walk_left_0":{"x":504,"y":2,"w":34,"h":86},"walk_left_1":{"x":540,"y":2,"w":37,"h":85},"walk_left_2":{"x":579,"y":2,"w":39,"h":86},"walk_left_3":{"x":620,"y":2,"w":39,"h":85},"walk_left_4":{"x":661,"y":2,"w":38,"h":85},"walk_left_5":{"x":701,"y":2,"w":34,"h":86},"walk_right_0":{"x":737,"y":2,"w":35,"h":86},"walk_right_1":{"x":774,"y":2,"w":38,"h":85},"walk_right_2":{"x":814,"y":2,"w":39,"h":85},"walk_right_3":{"x":855,"y":2,"w":38,"h":85},"walk_right_4":{"x":895,"y":2,"w":38,"h":85},"walk_right_5":{"x":935,"y":2,"w":35,"h":85},"diag_ul_0":{"x":972,"y":2,"w":48,"h":86},"diag_ul_1":{"x":2,"y":90,"w":46,"h":85},"diag_ul_2":{"x":50,"y":90,"w":51,"h":85},"diag_ul_3":{"x":103,"y":90,"w":51,"h":84},"diag_ul_4":{"x":156,"y":90,"w":56,"h":84},"diag_ur_0":{"x":214,"y":90,"w":48,"h":84},"diag_ur_1":{"x":264,"y":90,"w":55,"h":84},"diag_ur_2":{"x":321,"y":90,"w":52,"h":85},"diag_ur_3":{"x":375,"y":90,"w":51,"h":84},"diag_ur_4":{"x":428,"y":90,"w":56,"h":83},"atk_punch_0":{"x":486,"y":90,"w":46,"h":79},"atk_punch_1":{"x":534,"y":90,"w":51,"h":79},"atk_punch_2":{"x":587,"y":90,"w":59,"h":79},"atk_punch_3":{"x":648,"y":90,"w":47,"h":79},"atk_radio_0":{"x":697,"y":90,"w":49,"h":79},"atk_radio_1":{"x":748,"y":90,"w":58,"h":79},"atk_radio_2":{"x":808,"y":90,"w":68,"h":79},"atk_radio_3":{"x":878,"y":90,"w":50,"h":79},"atk_radio_4":{"x":930,"y":90,"w":42,"h":79},"run_0":{"x":2,"y":177,"w":65,"h":71},"run_1":{"x":69,"y":177,"w":60,"h":72},"run_2":{"x":131,"y":177,"w":54,"h":73},"run_3":{"x":187,"y":177,"w":57,"h":73},"run_4":{"x":246,"y":177,"w":53,"h":73},"sprint_0":{"x":301,"y":177,"w":64,"h":70},"sprint_1":{"x":367,"y":177,"w":57,"h":72},"sprint_2":{"x":426,"y":177,"w":56,"h":71},"sprint_3":{"x":484,"y":177,"w":61,"h":71},"sprint_4":{"x":547,"y":177,"w":55,"h":70}},"anims":{"walk_up":["walk_up_0","walk_up_1","walk_up_2","walk_up_3","walk_up_4","walk_up_5"],"walk_down":["walk_down_0","walk_down_1","walk_down_2","walk_down_3","walk_down_4","walk_down_5"],"walk_left":["walk_left_0","walk_left_1","walk_left_2","walk_left_3","walk_left_4","walk_left_5"],"walk_right":["walk_right_0","walk_right_1","walk_right_2","walk_right_3","walk_right_4","walk_right_5"],"diag_ul":["diag_ul_0","diag_ul_1","diag_ul_2","diag_ul_3","diag_ul_4"],"diag_ur":["diag_ur_0","diag_ur_1","diag_ur_2","diag_ur_3","diag_ur_4"],"atk_punch":["atk_punch_0","atk_punch_1","atk_punch_2","atk_punch_3"],"atk_radio":["atk_radio_0","atk_radio_1","atk_radio_2","atk_radio_3","atk_radio_4"],"run":["run_0","run_1","run_2","run_3","run_4"],"sprint":["sprint_0","sprint_1","sprint_2","sprint_3","sprint_4"]}};

const playerAnimImg = new Image();
let playerAnimReady = false;
playerAnimImg.onload = () => { playerAnimReady = true; };
playerAnimImg.src = 'assets/atlases/player_anim_atlas.png';

/** Масштаб спрайта героя — подогнан под врагов (~0.55 в старом атласе). */
const PLAYER_SPRITE_SCALE = 0.54;

/** Герои со своим атласом регистрируются в hero-*.js после этого файла. */
const HERO_ANIM_PACKS = {};
const HERO_ANIM_FALLBACK = {
  sprint: 'run',
  diag_ul: 'walk_up',
  diag_ur: 'walk_right',
  walk_left: 'walk_right',
  atk_radio: 'atk_punch',
};

function playerAnimData(heroId) {
  const pack = heroId && HERO_ANIM_PACKS[heroId];
  if (pack) return pack;
  return {
    id: 'default',
    frames: PLAYER_ANIM.frames,
    anims: PLAYER_ANIM.anims,
    img: playerAnimImg,
    ready() { return playerAnimReady; },
  };
}

function resolvePlayerAnimName(anims, name) {
  if (anims[name] && anims[name].length) return name;
  const fb = HERO_ANIM_FALLBACK[name];
  if (fb && anims[fb] && anims[fb].length) return fb;
  if (anims.walk_down && anims.walk_down.length) return 'walk_down';
  return name;
}

function playerAnimKeys(heroId, name) {
  const pack = playerAnimData(heroId);
  const resolved = resolvePlayerAnimName(pack.anims, name);
  return pack.anims[resolved] || [];
}

function drawPlayerAnimFrame(ctx, frameKey, x, y, opts = {}) {
  const pack = playerAnimData(opts.heroId);
  if (!pack.ready()) return false;
  const f = pack.frames[frameKey];
  if (!f) return false;
  const scale = opts.scale ?? PLAYER_SPRITE_SCALE;
  const dw = f.w * scale;
  const dh = f.h * scale;
  const ax = opts.anchorX ?? 0.5;
  const ay = opts.anchorY ?? 1.0;
  ctx.save();
  ctx.translate(x, y);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pack.img, f.x, f.y, f.w, f.h, -dw * ax, -dh * ay, dw, dh);
  ctx.restore();
  return true;
}

/** 8 направлений по углу (0 = вправо, π/2 = вниз). */
function playerFacing8(ang) {
  const a = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const sector = Math.round(a / (Math.PI / 4)) % 8;
  // 0:R 1:DR 2:D 3:DL 4:L 5:UL 6:U 7:UR
  return sector;
}

/** Боковой профиль: в листе оба ряда смотрят вправо — для влево включаем flip. */
function pickPlayerLocomotionAnim(ang, moving, dashing) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const absC = Math.abs(cos);
  const absS = Math.abs(sin);
  if (dashing) return { anim: 'sprint', flip: cos < 0 };
  if (moving && absC > 0.55 && absS < 0.55) return { anim: 'run', flip: cos < 0 };
  if (absC > absS && absC > 0.42) return { anim: 'walk_right', flip: cos < 0 };
  if (sin < -0.45) return { anim: 'walk_up', flip: false };
  if (sin > 0.45) return { anim: 'walk_down', flip: false };
  const face = playerFacing8(ang);
  if (face === 5 || face === 3) return { anim: 'diag_ul', flip: false };
  if (face === 7 || face === 1) return { anim: 'diag_ur', flip: false };
  return { anim: 'walk_down', flip: false };
}
