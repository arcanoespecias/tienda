const CACHE = 'arcano-v3';
const ASSETS = [
  '/especias/',
  '/especias/index.html',
  '/especias/css/style.css',
  '/especias/js/db.js',
  '/especias/js/github-sync.js',
  '/especias/js/modules1.js',
  '/especias/js/modules2.js',
  '/especias/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700;800&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Solo interceptar requests del mismo origen (no APIs externas como GitHub)
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/especias/')))
  );
});
