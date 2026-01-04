// Simple cache-first service worker for offline play.
// Note: service workers require HTTPS (or localhost) and same-origin scope.

const CACHE_NAME = "uno-pnp-v1";
const ASSETS = [
  "./",
  "./uno_pass_and_play.html",
  "./UNO_HELP.html",
  "./card.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests.
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cache same-origin successful responses.
          try {
            const url = new URL(req.url);
            if (url.origin === self.location.origin && res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
          } catch {
            // ignore
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
