// CC System Service Worker - Minimal Offline Shell & Fallback Cache
const CACHE_NAME = 'cc-system-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and API/webhook routes from offline caching
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) {
    return;
  }

  // Network-first with cache fallback for pages and assets
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful response for next offline use
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // If offline, check cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          const fallbackPage = await caches.match('/dashboard');
          if (fallbackPage) return fallbackPage;
        }

        return new Response('Offline: ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบสัญญาณเน็ตของคุณ', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
