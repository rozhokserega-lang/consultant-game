/* Minimal offline shell for Sale — cache core assets (GitHub Pages /consultant-game/). */
const BASE = self.registration.scope; // e.g. https://…/consultant-game/
const CACHE = 'sale-v0.11.9-no-fodder-slow';
const ASSETS = [
  'index.html',
  'sale_mode.js',
  'gear_mode.js',
  'gear/badges/badge_t1_staff.png',
  'gear/badges/badge_t2_consultant.png',
  'gear/badges/badge_t3_senior.png',
  'gear/badges/badge_t4_kpi100.png',
  'gear/radios/radio_t1_basic.png',
  'gear/radios/radio_t2_sec.png',
  'gear/radios/radio_t3_warehouse.png',
  'gear/radios/radio_t4_dispatch.png',
  'anim_fx_data.js',
  'anim_fx_atlas.png',
  'mart_data.js',
  'mart_atlas.png',
  'skill_icon_data.js',
  'skill_icon_atlas.png',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'weapon_atlas.png',
  'player_anim_atlas.png',
  'enemy_mob_atlas.png',
  'vfx_atlas.png',
  'spell_atlas.png',
  'pickup_fx_atlas.png',
  'arena_props_atlas.png',
  'storefront_atlas.png',
  'wall_decor_atlas.png',
].map((p) => new URL(p, BASE).href);

function isAppShell(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    const path = u.pathname;
    return /\/(index\.html)?$/.test(path) || path.endsWith('/sale_mode.js') || path.endsWith('/gear_mode.js') || path.endsWith('/sw.js');
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
