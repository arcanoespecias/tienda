const CACHE_NAME = 'arcano-v4-3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isStatic = STATIC_ASSETS.some(p => url.pathname.endsWith(p));
  if (isStatic) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const cl = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, cl));
      return resp;
    })));
    return;
  }
  if (/\.(js|css|html|svg)$/i.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then(resp => {
        const cl = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, cl));
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(fetch(e.request));
});
