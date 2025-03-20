const CACHE_NAME = 'uttt-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
  // Add icon files if needed, e.g., '/icon-192.png', '/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});