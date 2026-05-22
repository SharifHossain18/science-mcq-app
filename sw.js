const CACHE_NAME = 'lumen-cq-v26';
const urlsToCache = [
    './',
    './index.html',
    './subjects.html',
    './mcq.html',
    './cq.html',
    './submode.html',
    './admin.html',
    './style.css',
    './app.js',
    './subjects.js',
    './mcq.js',
    './cq.js',
    './submode.js',
    './manifest.json',
    './app-icon.jpeg',
    './data/meta.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Helper to strip query parameters from data URLs to avoid caching duplicates and mismatching
function getCleanUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        url.search = '';
        return url.toString();
    } catch (e) {
        const index = urlStr.indexOf('?');
        if (index !== -1) {
            return urlStr.substring(0, index);
        }
        return urlStr;
    }
}

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Cache split JSON data files dynamically (stale-while-revalidate strategy)
    if (event.request.url.includes('/data/')) {
        const cleanUrl = getCleanUrl(event.request.url);
        event.respondWith(
            caches.match(cleanUrl).then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached data, but fetch and update cache in background
                    fetch(event.request).then(networkResponse => {
                        if (networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(cleanUrl, networkResponse);
                            });
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(cleanUrl, responseClone);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback for JSON data
                    return new Response(JSON.stringify([{
                        subject: "Offline Mode",
                        chapter: "No Data Available",
                        board: "Offline",
                        year: "Offline",
                        question: "You are currently offline, and this specific chapter/board has not been loaded before on this device. Please connect to the internet to download it.",
                        options: ["Okay"],
                        answer: "Okay",
                        explanation: "Once you open a chapter while connected, it will be saved for offline use automatically."
                    }]), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
