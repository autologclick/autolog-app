/**
 * AutoLog Service Worker
 *
 * Strategy:
 * - Navigation requests: network-first (always get fresh HTML)
 * - API / auth: skip SW entirely (always network)
 * - /_next/data/ (Next.js RSC/JSON): network-first (must stay fresh)
 * - /_next/static/ (hashed bundles): cache-first (hash changes on new build)
 * - Static images/fonts: stale-while-revalidate
 * - Everything else: network-first with short-lived cache
 *
 * Cache versioning: bump CACHE_VERSION on every deploy so old caches are purged.
 * The client can also trigger a SW update by posting { type: 'SKIP_WAITING' }.
 */

const CACHE_VERSION = 3;
const CACHE_NAME = `autolog-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Only precache the offline fallback page and icons — NOT '/' (dynamic, becomes stale)
const PRECACHE_URLS = [
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// ── Install: precache offline shell only ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge ALL old caches, claim clients immediately ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Allow the client to force-activate a waiting SW ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch handler ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip API & auth — always go straight to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  // ── 1. Navigation (page loads & refreshes): network-first ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful HTML responses
          if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // ── 2. Next.js data routes (/_next/data/): network-first ──
  //    These carry page props and must stay fresh after deploys.
  if (url.pathname.startsWith('/_next/data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── 3. Hashed static bundles (/_next/static/): cache-first ──
  //    File names contain content hashes — a new build = new URL = cache miss → fetch.
  //    Safe to cache-first because the hash guarantees immutability.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── 4. Static assets (images, fonts, css, icons): stale-while-revalidate ──
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|css)$/)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // ── 5. Everything else: network-first ──
  event.respondWith(networkFirst(request));
});

// ── Strategy helpers ──

/** Network-first: try network, fall back to cache. */
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

/** Cache-first: serve from cache, fetch only on miss. */
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

/** Stale-while-revalidate: serve cache immediately, refresh in background. */
function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => cached);

    return cached || networkFetch;
  });
}

// ═══════════════════════════════════════
// Push & Notification handlers
// ═══════════════════════════════════════

self.addEventListener('push', (event) => {
  let data = { title: 'AutoLog', body: '\u05d4\u05ea\u05e8\u05d0\u05d4 \u05d7\u05d3\u05e9\u05d4', icon: '/icon-192.png' };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'he',
      tag: data.tag || 'autolog-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      vibrate: [200, 100, 200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.url || event.notification.data?.link || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
