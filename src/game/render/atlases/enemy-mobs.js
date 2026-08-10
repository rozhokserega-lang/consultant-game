/** Покупатели: кадры, позы и выбор анимации по поведению. */

// ── Покупатели (анимированный лист 7×4) ──
const ENEMY_MOB_FRAMES = {"mob_tank_idle":{"x":37,"y":11,"w":65,"h":84},"mob_tank_walk":{"x":173,"y":11,"w":70,"h":84},"mob_tank_run":{"x":296,"y":11,"w":99,"h":84},"mob_tank_attack":{"x":416,"y":12,"w":136,"h":83},"mob_purple_idle":{"x":587,"y":2,"w":69,"h":93},"mob_purple_walk":{"x":723,"y":2,"w":74,"h":93},"mob_purple_run":{"x":849,"y":3,"w":97,"h":92},"mob_purple_attack":{"x":974,"y":2,"w":123,"h":93},"mob_fast_idle":{"x":1145,"y":14,"w":57,"h":81},"mob_fast_walk":{"x":1278,"y":14,"w":67,"h":81},"mob_fast_run":{"x":1399,"y":14,"w":102,"h":81},"mob_fast_attack":{"x":1530,"y":14,"w":115,"h":81},"mob_elder_idle":{"x":1698,"y":13,"w":56,"h":82},"mob_elder_walk":{"x":1831,"y":13,"w":66,"h":82},"mob_elder_run":{"x":1960,"y":14,"w":84,"h":81},"mob_elder_attack":{"x":2079,"y":14,"w":121,"h":81},"mob_muscle_idle":{"x":2244,"y":12,"w":67,"h":83},"mob_muscle_walk":{"x":2381,"y":12,"w":70,"h":83},"mob_muscle_run":{"x":2502,"y":13,"w":104,"h":82},"mob_muscle_attack":{"x":2637,"y":13,"w":109,"h":82},"mob_pink_idle":{"x":2803,"y":12,"w":53,"h":83},"mob_pink_walk":{"x":2935,"y":12,"w":65,"h":83},"mob_pink_run":{"x":3062,"y":12,"w":88,"h":83},"mob_pink_attack":{"x":3178,"y":12,"w":131,"h":83},"mob_cane_idle":{"x":3350,"y":21,"w":63,"h":74},"mob_cane_walk":{"x":3487,"y":21,"w":65,"h":74},"mob_cane_run":{"x":3612,"y":21,"w":92,"h":74},"mob_cane_attack":{"x":3744,"y":21,"w":104,"h":74}};
const ENEMY_MOB_ANIMS = {"mob_tank":{"idle":["mob_tank_idle"],"walk":["mob_tank_walk"],"run":["mob_tank_run"],"attack":["mob_tank_attack"]},"mob_purple":{"idle":["mob_purple_idle"],"walk":["mob_purple_walk"],"run":["mob_purple_run"],"attack":["mob_purple_attack"]},"mob_fast":{"idle":["mob_fast_idle"],"walk":["mob_fast_walk"],"run":["mob_fast_run"],"attack":["mob_fast_attack"]},"mob_elder":{"idle":["mob_elder_idle"],"walk":["mob_elder_walk"],"run":["mob_elder_run"],"attack":["mob_elder_attack"]},"mob_muscle":{"idle":["mob_muscle_idle"],"walk":["mob_muscle_walk"],"run":["mob_muscle_run"],"attack":["mob_muscle_attack"]},"mob_pink":{"idle":["mob_pink_idle"],"walk":["mob_pink_walk"],"run":["mob_pink_run"],"attack":["mob_pink_attack"]},"mob_cane":{"idle":["mob_cane_idle"],"walk":["mob_cane_walk"],"run":["mob_cane_run"],"attack":["mob_cane_attack"]}};
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
  return list && list[0];
}

function refreshEnemyMobPose(enemy, player, isRush, fromX, fromY) {
  const moved = Math.hypot(enemy.x - fromX, enemy.y - fromY);
  const d = dist(enemy.x, enemy.y, player.x, player.y);
  if (enemy.stunTimer > 0) {
    enemy.mobPose = 'idle';
    return;
  }
  if (enemy.type !== 'child' && d < 62 && d > 6) {
    enemy.mobPose = 'attack';
    return;
  }
  const kb = Math.hypot(enemy.knockback.x, enemy.knockback.y);
  if ((isRush && moved > 0.55) || moved > 1.5 || kb > 85) enemy.mobPose = 'run';
  else if (moved > 0.32 || kb > 20) enemy.mobPose = 'walk';
  else enemy.mobPose = 'idle';
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
