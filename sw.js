const CACHE = 'training-hub-v6';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try network, fall back to cache only if offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Skip non-http(s) and API calls
  if (!e.request.url.startsWith('http')) return;
  
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for offline fallback
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
