/** Покупатели: кадры, позы и выбор анимации по поведению. */

// ── Покупатели: анимированный лист (52 кадра, 7 скинов) ──
const ENEMY_MOB_FRAMES = {"mob_tank_idle":{"x":2,"y":2,"w":71,"h":88},"mob_tank_walk_0":{"x":75,"y":2,"w":78,"h":88},"mob_tank_run_0":{"x":155,"y":2,"w":107,"h":88},"mob_tank_attack_windup":{"x":264,"y":2,"w":142,"h":88},"mob_tank_walk":{"x":408,"y":2,"w":70,"h":84},"mob_tank_run":{"x":480,"y":2,"w":99,"h":84},"mob_tank_attack":{"x":581,"y":2,"w":136,"h":83},"mob_purple_idle":{"x":719,"y":2,"w":73,"h":97},"mob_purple_walk_0":{"x":794,"y":2,"w":82,"h":97},"mob_purple_run_0":{"x":878,"y":2,"w":105,"h":97},"mob_purple_attack_windup":{"x":985,"y":2,"w":98,"h":97},"mob_purple_walk":{"x":1085,"y":2,"w":74,"h":93},"mob_purple_run":{"x":1161,"y":2,"w":97,"h":92},"mob_purple_attack":{"x":1260,"y":2,"w":123,"h":93},"mob_fast_walk_0":{"x":1385,"y":2,"w":63,"h":85},"mob_fast_walk_1":{"x":1450,"y":2,"w":75,"h":85},"mob_fast_run_0":{"x":1527,"y":2,"w":110,"h":85},"mob_fast_attack_windup":{"x":1639,"y":2,"w":121,"h":85},"mob_fast_idle":{"x":1762,"y":2,"w":57,"h":81},"mob_fast_walk":{"x":1821,"y":2,"w":67,"h":81},"mob_fast_run":{"x":1890,"y":2,"w":102,"h":81},"mob_fast_attack":{"x":1994,"y":2,"w":115,"h":81},"mob_elder_walk_0":{"x":2111,"y":2,"w":62,"h":86},"mob_elder_walk_1":{"x":2175,"y":2,"w":74,"h":86},"mob_elder_run_0":{"x":2251,"y":2,"w":92,"h":86},"mob_elder_attack_windup":{"x":2345,"y":2,"w":127,"h":86},"mob_elder_idle":{"x":2474,"y":2,"w":56,"h":82},"mob_elder_walk":{"x":2532,"y":2,"w":66,"h":82},"mob_elder_run":{"x":2600,"y":2,"w":84,"h":81},"mob_elder_attack":{"x":2686,"y":2,"w":121,"h":81},"mob_muscle_idle":{"x":2809,"y":2,"w":73,"h":87},"mob_muscle_walk_0":{"x":2884,"y":2,"w":78,"h":87},"mob_muscle_run_0":{"x":2964,"y":2,"w":112,"h":87},"mob_muscle_attack_windup":{"x":3078,"y":2,"w":115,"h":87},"mob_muscle_walk":{"x":3195,"y":2,"w":70,"h":83},"mob_muscle_run":{"x":3267,"y":2,"w":104,"h":82},"mob_muscle_attack":{"x":3373,"y":2,"w":109,"h":82},"mob_pink_idle":{"x":3484,"y":2,"w":59,"h":87},"mob_pink_walk_0":{"x":3545,"y":2,"w":73,"h":87},"mob_pink_run_0":{"x":3620,"y":2,"w":95,"h":87},"mob_pink_attack_windup":{"x":3717,"y":2,"w":137,"h":87},"mob_pink_walk":{"x":3856,"y":2,"w":65,"h":83},"mob_pink_run":{"x":3923,"y":2,"w":88,"h":83},"mob_pink_attack":{"x":4013,"y":2,"w":131,"h":83},"mob_cane_walk_0":{"x":4146,"y":2,"w":69,"h":78},"mob_cane_walk_1":{"x":4217,"y":2,"w":73,"h":78},"mob_cane_run_0":{"x":4292,"y":2,"w":100,"h":78},"mob_cane_attack_windup":{"x":4394,"y":2,"w":110,"h":78},"mob_cane_idle":{"x":4506,"y":2,"w":63,"h":74},"mob_cane_walk":{"x":4571,"y":2,"w":65,"h":74},"mob_cane_run":{"x":4638,"y":2,"w":92,"h":74},"mob_cane_attack":{"x":4732,"y":2,"w":104,"h":74}};
const ENEMY_MOB_ANIMS = {"mob_tank":{"idle":["mob_tank_idle"],"walk":["mob_tank_walk_0","mob_tank_walk"],"run":["mob_tank_run_0","mob_tank_run"],"attack":["mob_tank_attack_windup","mob_tank_attack"]},"mob_purple":{"idle":["mob_purple_idle"],"walk":["mob_purple_walk_0","mob_purple_walk"],"run":["mob_purple_run_0","mob_purple_run"],"attack":["mob_purple_attack_windup","mob_purple_attack"]},"mob_fast":{"idle":["mob_fast_idle"],"walk":["mob_fast_walk_0","mob_fast_walk_1","mob_fast_walk"],"run":["mob_fast_run_0","mob_fast_run"],"attack":["mob_fast_attack_windup","mob_fast_attack"]},"mob_elder":{"idle":["mob_elder_idle"],"walk":["mob_elder_walk_0","mob_elder_walk_1","mob_elder_walk"],"run":["mob_elder_run_0","mob_elder_run"],"attack":["mob_elder_attack_windup","mob_elder_attack"]},"mob_muscle":{"idle":["mob_muscle_idle"],"walk":["mob_muscle_walk_0","mob_muscle_walk"],"run":["mob_muscle_run_0","mob_muscle_run"],"attack":["mob_muscle_attack_windup","mob_muscle_attack"]},"mob_pink":{"idle":["mob_pink_idle"],"walk":["mob_pink_walk_0","mob_pink_walk"],"run":["mob_pink_run_0","mob_pink_run"],"attack":["mob_pink_attack_windup","mob_pink_attack"]},"mob_cane":{"idle":["mob_cane_idle"],"walk":["mob_cane_walk_0","mob_cane_walk_1","mob_cane_walk"],"run":["mob_cane_run_0","mob_cane_run"],"attack":["mob_cane_attack_windup","mob_cane_attack"]}};
const ENEMY_MOB_LEGACY = {"enemy_tank":"mob_tank","enemy_woman_purple":"mob_purple","enemy_fast":"mob_fast","enemy_elder":"mob_elder","enemy_boss":"mob_muscle","enemy_manager":"mob_pink","enemy_cane":"mob_cane"};
const ENEMY_MOB_REF_H = 82;

const enemyMobImg = new Image();
let enemyMobReady = false;
enemyMobImg.onload = () => {
  enemyMobReady = true;
  if (window.game && typeof window.game.renderComplaintBook === 'function' && window.game.isBoostersOpen && window.game.isBoostersOpen()) {
    window.game.renderComplaintBook();
  }
};
enemyMobImg.src = 'assets/atlases/enemy_mob_atlas.png';

function resolveEnemyMobId(spriteName) {
  if (ENEMY_MOB_ANIMS[spriteName]) return spriteName;
  return ENEMY_MOB_LEGACY[spriteName] || 'mob_tank';
}

function enemyMobFrameKey(enemy) {
  const mob = enemy.mobId || resolveEnemyMobId(enemy.sprite);
  const pack = ENEMY_MOB_ANIMS[mob];
  if (!pack) return null;
  const pose = enemy.mobPose || 'idle';
  const list = pack[pose] || pack.idle;
  if (!list || !list.length) return null;
  const idx = enemy._mobAnimFrame || 0;
  return list[idx % list.length];
}

/** Тик кадра анимации моба (как tickAnim у игрока). */
function tickEnemyMobAnim(enemy, dt) {
  const mob = enemy.mobId || resolveEnemyMobId(enemy.sprite);
  const pack = ENEMY_MOB_ANIMS[mob];
  if (!pack) return;
  const pose = enemy.mobPose || 'idle';
  const list = pack[pose] || pack.idle || [];
  if (!list.length) return;

  if (pose !== enemy._mobAnimPose) {
    enemy._mobAnimPose = pose;
    enemy._mobAnimFrame = 0;
    enemy._mobAnimPhase = 0;
  }

  let fps = 0;
  if (pose === 'attack') fps = 14;
  else if (pose === 'run') fps = 11;
  else if (pose === 'walk') fps = 8;

  if (fps <= 0) {
    enemy._mobAnimFrame = 0;
    enemy._mobAnimPhase = 0;
    return;
  }

  enemy._mobAnimPhase = (enemy._mobAnimPhase || 0) + dt * fps;
  while (enemy._mobAnimPhase >= 1) {
    enemy._mobAnimPhase -= 1;
    enemy._mobAnimFrame = ((enemy._mobAnimFrame || 0) + 1) % list.length;
  }
}

function refreshEnemyMobPose(enemy, player, isRush, fromX, fromY, dt) {
  const moved = Math.hypot(enemy.x - fromX, enemy.y - fromY);
  const d = dist(enemy.x, enemy.y, player.x, player.y);
  if (enemy.stunTimer > 0) {
    enemy.mobPose = 'idle';
    tickEnemyMobAnim(enemy, dt || 0);
    return;
  }
  if (enemy.type !== 'child' && d < 62 && d > 6) {
    enemy.mobPose = 'attack';
    tickEnemyMobAnim(enemy, dt || 0);
    return;
  }
  const kb = Math.hypot(enemy.knockback.x, enemy.knockback.y);
  if ((isRush && moved > 0.55) || moved > 1.5 || kb > 85) enemy.mobPose = 'run';
  else if (moved > 0.32 || kb > 20) enemy.mobPose = 'walk';
  else enemy.mobPose = 'idle';
  tickEnemyMobAnim(enemy, dt || 0);
}

function drawEnemyMob(ctx, frameKey, x, y, opts = {}) {
  if (!enemyMobReady) return false;
  const f = ENEMY_MOB_FRAMES[frameKey];
  if (!f) return false;
  const typeScale = opts.scale ?? 0.52;
  const scale = typeScale * (ENEMY_MOB_REF_H / f.h);
  const dw = f.w * scale;
  const dh = f.h * scale;
  const ax = opts.anchorX ?? 0.5;
  const ay = opts.anchorY ?? 1.0;
  ctx.save();
  ctx.translate(x, y);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(enemyMobImg, f.x, f.y, f.w, f.h, -dw * ax, -dh * ay, dw, dh);
  ctx.restore();
  return true;
}
