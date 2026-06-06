const CACHE_NAME = 'lumen-v46';

const APP_SHELL = [
    './',
    './index.html',
    './subjects.html',
    './subject.html',
    './mcq.html',
    './cq.html',
    './submode.html',
    './board-select.html',
    './admin.html',
    './generate.html',
    './style.css',
    './app.js',
    './subjects.js',
    './subject.js',
    './mcq.js',
    './cq.js',
    './submode.js',
    './board-select.js',
    './generate.js',
    './sw-register.js',
    './manifest.json',
    './app-icon.jpeg',
    './icon-192.png',
    './icon-512.png',
    './data/meta.json',
    './utils.js',
    './data-files.json'
];

const CDN_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

function stripQuery(urlStr) {
    try {
        const url = new URL(urlStr);
        url.search = '';
        return url.toString();
    } catch (e) {
        const idx = urlStr.indexOf('?');
        return idx !== -1 ? urlStr.substring(0, idx) : urlStr;
    }
}

function isAppShell(url) {
    const cleaned = stripQuery(url);
    return APP_SHELL.some(shell => {
        try {
            const resolved = new URL(shell, self.location).toString();
            return cleaned === resolved;
        } catch (e) {
            return false;
        }
    });
}

function isDataRequest(url) {
    return url.includes('/data/');
}

function isCDNResource(url) {
    return url.includes('fonts.googleapis.com') ||
           url.includes('fonts.gstatic.com') ||
           url.includes('cdnjs.cloudflare.com');
}

const BATCH_SIZE = 100;
const BATCH_DELAY = 1000;
let _cachingPaused = false;

async function cacheDataBatch(cache, files, start) {
    const end = Math.min(start + BATCH_SIZE, files.length);
    const batch = files.slice(start, end);
    const results = await Promise.allSettled(batch.map(url => cache.add(url)));
    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'CACHE_PROGRESS', cached: end, total: files.length });
        });
    });
    return { success, failed, next: end };
}

async function cacheAllData() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const resp = await fetch('./data-files.json');
        const files = await resp.json();
        let start = 0;
        while (start < files.length) {
            const result = await cacheDataBatch(cache, files, start);
            start = result.next;
            if (start < files.length) {
                await new Promise(r => setTimeout(r, BATCH_DELAY));
            }
        }
    } catch (e) {
        console.error('Background caching error:', e);
    }
}

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_SHELL);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
            .then(() => {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
                });
                cacheAllData();
            })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    if (isDataRequest(requestUrl)) {
        const cleanUrl = stripQuery(requestUrl);
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(cleanUrl).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(networkResponse => {
                        if (networkResponse.ok) {
                            cache.put(cleanUrl, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        return new Response(JSON.stringify([]), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                });
            })
        );
        return;
    }

    if (isCDNResource(requestUrl)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(resp => {
                    if (resp.ok) {
                        const clone = resp.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return resp;
                }).catch(() => new Response('', { status: 200 }));
            })
        );
        return;
    }

    const cleanUrl = stripQuery(requestUrl);
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(cleanUrl).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok && event.request.method === 'GET') {
                        cache.put(cleanUrl, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    if (event.request.mode === 'navigate') {
                        return cache.match('./index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
            });
        })
    );
});
