/* Minimal offline-first service worker for Live HTML Editor */

const VERSION = "v1";
const CACHE_NAME = `live-html-editor-${VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./live-html-editor.html",
  "./live-html-editor.webmanifest",
  "./live-html-editor-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("live-html-editor-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (err) {
        // Best-effort fallback to main page offline.
        return caches.match("./live-html-editor.html");
      }
    })()
  );
});
