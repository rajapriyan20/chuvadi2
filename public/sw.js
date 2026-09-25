// Chuvadi Progressive Web App Service Worker
const CACHE_NAME = 'chuvadi-cache-v3';

const PRECACHE_FILES = [
  '',
  'index.html',
  'manifest.json',
  'favicon.png',
  'chuvadi-logo.svg',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-maskable-512x512.png',
  'apple-touch-icon.png'
];

// Install Event - Pre-cache core assets relative to scope & activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const urlsToCache = PRECACHE_FILES.map((file) => new URL(file, self.registration.scope).href);
      return Promise.allSettled(
        urlsToCache.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch((err) => {
              console.warn('Pre-cache skip for:', url, err);
            })
        )
      );
    })
  );
});

// Activate Event - Clean old caches & claim clients
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback for dynamic assets, Cache First for static images
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests and browser extensions / external analytics
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip Firebase auth, APIs, and Google accounts endpoints from cache
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('identitytoolkit') ||
    url.pathname.includes('securetoken') ||
    url.pathname.includes('googleapis.com')
  ) {
    return;
  }

  // Handle navigation requests (SPA fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const scopeUrl = self.registration.scope;
        const indexPath = new URL('index.html', scopeUrl).href;
        return (
          (await caches.match(indexPath)) ||
          (await caches.match(scopeUrl)) ||
          (await caches.match('/index.html')) ||
          (await caches.match('/'))
        );
      })
    );
    return;
  }

  // Handle static assets & media
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback if offline
          if (request.destination === 'image') {
            const logoUrl = new URL('chuvadi-logo.svg', self.registration.scope).href;
            return caches.match(logoUrl) || caches.match('/chuvadi-logo.svg');
          }
        });
    })
  );
});
