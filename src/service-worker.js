// service-worker.js
// Service worker for offline/PWA support
// Workbox caching stub
self.addEventListener('install', event => {
  // Cache shell assets, WASM, UI
  event.waitUntil(
    caches.open('raw-editor-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        // Add more assets as needed
      ]);
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
