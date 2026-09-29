// Service Worker for StreamHub PWA (v4 - Network-First for HTML to prevent stale white screen)
const CACHE_NAME = 'streamhub-cache-v4';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge all old caches immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Let stream media pass straight through
  if (
    url.includes('.m3u8') ||
    url.includes('.ts') ||
    url.includes('stream') ||
    url.includes('allorigins') ||
    url.includes('corsproxy')
  ) {
    return;
  }

  // HTML page navigations: ALWAYS NETWORK-FIRST!
  // This guarantees mobile devices always receive the latest bundle hashes after any push/deploy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static assets (CSS, JS, Fonts): Fetch from network first or fallback to cache
  if (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other assets (images, manifest): Cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => null)
      );
    })
  );
});
