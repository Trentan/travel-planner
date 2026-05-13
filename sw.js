const CACHE_NAME = 'travel-planner-v10';
const ASSETS = [
  './index.html',
  './manifest.json',
  './style.css',
  './js/utils.js',
  './js/data.js',
  './js/packing.js',
  './js/dragdrop.js',
  './js/crud.js',
  './js/tabs.js',
  './js/ai.js',
  './js/guide.js',
  './js/ui.js',
  './js/itinerary.js',
  './js/backup.js',
  './js/auto-stays.js',
  './js/transport.js',
  './js/map.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
