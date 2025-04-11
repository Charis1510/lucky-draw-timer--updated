// Simple service worker for offline functionality
const CACHE_NAME = 'luckydraw-timer-cache-v2';

// Install event
self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Installing');
  // Skip waiting so the new service worker activates immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activating');
  
  // Claim clients so the page is immediately controlled by this service worker
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          console.log('[ServiceWorker] Removing old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    // First try to fetch the resource from the network
    fetch(event.request)
      .then(function(response) {
        // Make a copy of the response
        const responseToCache = response.clone();
        
        // Open the cache and store the response
        caches.open(CACHE_NAME)
          .then(function(cache) {
            // Only cache same-origin requests to avoid CORS issues
            if (event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, responseToCache);
            }
          })
          .catch(function(error) {
            console.log('[ServiceWorker] Cache error:', error);
          });
        
        return response;
      })
      .catch(function() {
        // If network fetch fails, try to get from cache
        return caches.match(event.request)
          .then(function(response) {
            // Return the cached response if we have one
            if (response) {
              console.log('[ServiceWorker] Serving from cache:', event.request.url);
              return response;
            }
            
            // If we don't have a cached response, just return
            console.log('[ServiceWorker] No cache for:', event.request.url);
            return new Response('Offline and not cached');
          });
      })
  );
}); 