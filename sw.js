// Service Worker – caches game assets (3D models, textures) in the
// browser Cache API so they persist across page reloads.  First load
// fetches from network; every subsequent load serves from disk cache.

const CACHE_NAME = 'spacerun-assets-v1';

// Only cache asset files (large binaries that rarely change)
function isAssetRequest(url) {
    const path = new URL(url).pathname;
    return path.includes('/assets/') &&
        (path.endsWith('.gltf') || path.endsWith('.glb') ||
         path.endsWith('.png')  || path.endsWith('.jpg') ||
         path.endsWith('.bin'));
}

// Strategy: cache-first for assets, network-first for everything else
self.addEventListener('fetch', event => {
    if (!isAssetRequest(event.request.url)) return; // Let browser handle non-assets

    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(cached => {
                if (cached) return cached; // Cache hit – instant

                // Cache miss – fetch, cache a clone, return original
                return fetch(event.request).then(response => {
                    if (response.ok) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                });
            })
        )
    );
});

// Clean up old cache versions on activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Take control immediately on install
self.addEventListener('install', () => {
    self.skipWaiting();
});
