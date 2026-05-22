const CACHE_NAME = 'lumen-cq-v27';
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
    './icon-192.png',
    './icon-512.png',
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
                    if (cleanUrl.endsWith('meta.json')) {
                        return new Response(JSON.stringify({}), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    return new Response(JSON.stringify([{
                        id: "offline_fallback",
                        subject: "Offline Mode",
                        chapter: "No Data Available",
                        board: "Offline",
                        year: "Offline",
                        question: "You are currently offline. Please connect to the internet to download this chapter.",
                        options: ["Okay"],
                        answer: "Okay",
                        explanation: "Once you open a chapter while connected, it will be saved for offline use automatically.",
                        context: "You are currently offline, and this specific chapter/board has not been loaded before on this device. Please connect to the internet to download it.",
                        questions: [
                            { type: 'a', question: "What should you do?", answer: "Connect to the internet and reload this page to download the questions." }
                        ]
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
