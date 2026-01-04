const CACHE_NAME = 'link-manager-v1';
const APP_SHELL = [
  './link-manager.html',
  './link-manager.webmanifest',
  './link-manager-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests from our origin.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        // Best-effort runtime caching.
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        // If offline and not cached, fall back to app shell.
        const fallback = await cache.match('./link-manager.html');
        if (fallback) return fallback;
        throw err;
      }
    })()
  );
});
