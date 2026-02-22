// Ramadan Tracker — Service Worker
const CACHE_NAME = 'ramadan-tracker-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './quran.html',
    './tasbih.html',
    './sunnah.html',
    './radio.html',
    './shared.css',
    './manifest.json',
    './icon.png',
    './masbaha.png'
];

// Install — cache app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch — cache-first for local assets, network-first for external resources
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // FIX: Do NOT intercept streams (RadioJar, etc.)
    // Streaming responses cannot be cloned or cached by standard SW fetch logic
    if (url.origin.includes('radiojar.com') ||
        event.request.destination === 'audio' ||
        event.request.destination === 'video') {
        return; // Let the browser handle it directly
    }

    // For same-origin requests: cache-first
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    // Cache the new response for next time
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                });
            })
        );
    } else {
        // For external resources (fonts, CDN): network-first with cache fallback
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request))
        );
    }
});
