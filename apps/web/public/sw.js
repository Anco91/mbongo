/**
 * Service worker — minimal, hand-written shell cache (design D2).
 *
 * - Navigation: network first, cached document or /offline as fallback.
 * - Static assets: cache first, network fill.
 * - API requests: never cached (financial data must stay fresh).
 *
 * Bump CACHE_VERSION whenever the cached shell changes.
 */

const CACHE_VERSION = 'mbongo-shell-v1';
const PRECACHE_URLS = ['/offline'];
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API responses: the UI must show live financial data.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? (await caches.match(OFFLINE_URL)) ?? Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached ?? fetch(request).then((response) => response))
  );
});
