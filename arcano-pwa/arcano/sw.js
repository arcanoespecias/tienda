// Arcano Service Worker v5 — PASSTHROUGH SIN CACHE
// No cachea NADA. Todos los requests van directo a la red.
// Esto garantiza que siempre se ejecuta el codigo mas reciente.
// El SW existe solo para que la PWA sea instalable.

self.addEventListener('install', e => {
  // Borrar todas las caches viejas al instalar
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
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// PASSTHROUGH: no interceptar nada, dejar que el navegador maneje todo
self.addEventListener('fetch', e => {
  // No llamamos e.respondWith() → el request se maneja normalmente
  // Esto significa: sin cache, siempre red fresca
});
