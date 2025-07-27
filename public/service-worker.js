// Enhanced Service Worker for seamless navigation and caching
const CACHE_NAME = 'rawconverter-v2';
const STATIC_CACHE = 'rawconverter-static-v2';
const DYNAMIC_CACHE = 'rawconverter-dynamic-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/src/assets/images/newyork-night.jpg',
  '/src/assets/images/cheetah-hotirontal.jpg',
  '/src/assets/images/nature-horizontal.jpg',
  '/src/assets/images/northernlights.jpg'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.warn('[SW] Failed to cache static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
      event.respondWith(
        caches.match(request)
          .then(response => response || fetch(request))
      );
      return;
    }

    // Dynamic content - network first with cache fallback
    if (url.pathname.includes('/api/') || url.pathname.includes('.json')) {
      event.respondWith(
        fetch(request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
            return response;
          })
          .catch(() => caches.match(request))
      );
      return;
    }

    // Images and assets - cache with stale-while-revalidate
    if (request.destination === 'image' || url.pathname.includes('/assets/')) {
      event.respondWith(
        caches.open(DYNAMIC_CACHE)
          .then(cache => {
            return cache.match(request)
              .then(response => {
                const fetchPromise = fetch(request)
                  .then(networkResponse => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                  });
                
                return response || fetchPromise;
              });
          })
      );
      return;
    }

    // Default - network first with cache fallback
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
