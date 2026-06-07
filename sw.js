const CACHE_NAME = 'lumen-v51';
const DATA_CACHE = 'lumen-data-v1';

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
    './exam.html',
    './style.css',
    './app.js',
    './subjects.js',
    './subject.js',
    './mcq.js',
    './cq.js',
    './submode.js',
    './board-select.js',
    './generate.js',
    './exam.js',
    './sw-register.js',
    './manifest.json',
    './app-icon.jpeg',
    './icon-192.png',
    './icon-512.png',
    './data/meta.json',
    './utils.js'
];

const CDN_URLS = [
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js'
];

function stripQuery(urlStr) {
    try {
        return new URL(urlStr).origin + new URL(urlStr).pathname;
    } catch {
        const idx = urlStr.indexOf('?');
        return idx !== -1 ? urlStr.substring(0, idx) : urlStr;
    }
}

function isDataRequest(url) {
    return url.includes('/data/');
}

function isCDN(url) {
    return CDN_URLS.some(cdn => url.startsWith(cdn));
}

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME && n !== DATA_CACHE).map(n => caches.delete(n)))
        ).then(() => self.clients.claim()).then(() => {
            self.clients.matchAll().then(clients => {
                clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
            });
        })
    );
});

self.addEventListener('fetch', event => {
    const reqUrl = event.request.url;

    if (isDataRequest(reqUrl)) {
        const clean = stripQuery(reqUrl);
        event.respondWith(
            caches.open(DATA_CACHE).then(cache =>
                cache.match(clean).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(resp => {
                        if (resp.ok) cache.put(clean, resp.clone());
                        return resp;
                    }).catch(() =>
                        new Response(JSON.stringify([]), {
                            headers: { 'Content-Type': 'application/json' }
                        })
                    );
                })
            )
        );
        return;
    }

    if (isCDN(reqUrl)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(reqUrl).then(cached => {
                    if (cached) return cached;
                    return fetch(reqUrl).then(resp => {
                        if (resp.ok) cache.put(reqUrl, resp.clone());
                        return resp;
                    }).catch(() => new Response('', { status: 200 }));
                })
            )
        );
        return;
    }

    const clean = stripQuery(reqUrl);
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(clean).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(resp => {
                    if (resp.ok && event.request.method === 'GET') cache.put(clean, resp.clone());
                    return resp;
                }).catch(() => {
                    if (event.request.mode === 'navigate') return cache.match('./index.html');
                    return new Response('Offline', { status: 503 });
                });
            })
        )
    );
});
