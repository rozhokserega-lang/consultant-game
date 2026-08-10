/* Minimal offline shell for Sale — cache core assets (GitHub Pages /consultant-game/). */
const BASE = self.registration.scope; // e.g. https://…/consultant-game/
const CACHE = 'sale-v0.12.0-structure';
const ASSETS = [
  'index.html',
  'manifest.webmanifest',

  'src/game/data/atlas-frames/anim-fx.js',
  'src/game/data/atlas-frames/mart.js',
  'src/game/data/atlas-frames/skill-icons.js',
  'src/game/modes/sale/sale-mode.js',
  'src/game/modes/gear/gear-mode.js',
  'src/shared/ui/button/button.js',
  'src/widgets/level-up-popup/level-up-popup.js',
  'src/widgets/game-menu/game-menu.js',

  'src/shared/ui/button/button.css',
  'src/shared/ui/battle-bar/battle-bar.css',
  'src/widgets/game-menu/game-menu.css',
  'src/widgets/level-up-popup/level-up-popup.css',
  'src/widgets/end-popup/end-popup.css',

  'assets/app-icons/icon-192.png',
  'assets/app-icons/icon-512.png',
  'assets/images/start_screen.jpg',

  'assets/atlases/main_atlas.png',
  'assets/atlases/anim_fx_atlas.png',
  'assets/atlases/mart_atlas.png',
  'assets/atlases/skill_icon_atlas.png',
  'assets/atlases/weapon_atlas.png',
  'assets/atlases/player_anim_atlas.png',
  'assets/atlases/enemy_mob_atlas.png',
  'assets/atlases/vfx_atlas.png',
  'assets/atlases/spell_atlas.png',
  'assets/atlases/pickup_fx_atlas.png',
  'assets/atlases/arena_props_atlas.png',
  'assets/atlases/storefront_atlas.png',
  'assets/atlases/wall_decor_atlas.png',

  'assets/icons/weapons/wicon_fist.png',
  'assets/icons/weapons/wicon_glove.png',
  'assets/icons/weapons/wicon_bat.png',
  'assets/icons/weapons/wicon_wrench.png',
  'assets/icons/weapons/wicon_hammer.png',
  'assets/icons/weapons/wicon_mallet.png',
  'assets/icons/weapons/wicon_sledge.png',
  'assets/icons/weapons/wicon_crowbar.png',
  'assets/icons/weapons/wicon_pan.png',
  'assets/icons/weapons/wicon_cleaver.png',
  'assets/icons/weapons/wicon_axe.png',
  'assets/icons/weapons/wicon_pipe.png',
  'assets/icons/weapons/wicon_knife.png',

  'assets/gear/badges/badge_t1_staff.png',
  'assets/gear/badges/badge_t2_consultant.png',
  'assets/gear/badges/badge_t3_senior.png',
  'assets/gear/badges/badge_t4_kpi100.png',
  'assets/gear/radios/radio_t1_basic.png',
  'assets/gear/radios/radio_t2_sec.png',
  'assets/gear/radios/radio_t3_warehouse.png',
  'assets/gear/radios/radio_t4_dispatch.png',
].map((p) => new URL(p, BASE).href);

function isAppShell(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    const path = u.pathname;
    // Код раздаётся десятками мелких файлов — одного залипшего хватит,
    // чтобы собрать нерабочую смесь старой и новой сборки.
    return /\/(index\.html)?$/.test(path) || /\.(js|mjs|css)$/.test(path);
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // HTML/JS: сеть первой, иначе меню залипает на старой сборке
  if (isAppShell(req.url) || req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match(new URL('index.html', BASE).href))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(new URL('index.html', BASE).href));
    }),
  );
});
