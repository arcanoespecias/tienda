// Arcano Service Worker v5 — PASSTHROUGH SIN CACHE
// No cachea NADA. Todos los requests van directo a la red.
// Esto garantiza que siempre se ejecuta el codigo mas reciente.

self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// PASSTHROUGH: no interceptar nada
self.addEventListener('fetch', e => {
  // Sin e.respondWith() = el navegador maneja todo normalmente
});
