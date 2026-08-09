/* Minimal offline shell for Sale — cache core assets (GitHub Pages /consultant-game/). */
const BASE = self.registration.scope; // e.g. https://…/consultant-game/
const CACHE = 'sale-v0.8.0-tg';
const ASSETS = [
  'index.html',
  'sale_mode.js',
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
