const CACHE_NAME = 'lumen-v45';

// App shell files — these are precached on install and served cache-first
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
    './style.css',
    './app.js',
    './subjects.js',
    './subject.js',
    './mcq.js',
    './cq.js',
    './submode.js',
    './board-select.js',
    './sw-register.js',
    './manifest.json',
    './app-icon.jpeg',
    './icon-192.png',
    './icon-512.png',
    './data/meta.json'
];

// External CDN resources to try to precache (non-blocking if they fail)
const CDN_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Helper: strip query parameters from a URL for consistent cache keys
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

// Helper: check if a URL is part of the app shell
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

// Helper: check if a URL is a data JSON request
function isDataRequest(url) {
    return url.includes('/data/');
}

// Helper: check if a URL is an external CDN resource
function isCDNResource(url) {
    return url.includes('fonts.googleapis.com') ||
           url.includes('fonts.gstatic.com') ||
           url.includes('cdnjs.cloudflare.com');
}

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Cache app shell (required — fail install if any are missing)
            const shellPromise = cache.addAll(APP_SHELL);
            // Try to cache CDN resources but don't block install if they fail
            const cdnPromise = Promise.allSettled(
                CDN_RESOURCES.map(url =>
                    fetch(url, { mode: 'cors' })
                        .then(resp => {
                            if (resp.ok) return cache.put(url, resp);
                        })
                        .catch(() => {})
                )
            );
            return Promise.all([shellPromise, cdnPromise]);
        })
    );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// ─── FETCH ──────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    // Strategy 1: DATA JSON FILES — Cache-first (stale-while-revalidate)
    // Serve instantly from cache if available, then refresh cache in background.
    // Falls back to network if not cached. This makes repeat CQ visits instant.
    if (isDataRequest(requestUrl)) {
        const cleanUrl = stripQuery(requestUrl);

        // Offline placeholder helper
        function offlinePlaceholder(url) {
            if (url.endsWith('meta.json')) {
                return new Response(JSON.stringify({}), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return new Response(JSON.stringify([{
                id: "offline_fallback",
                subject: "Offline Mode",
                chapter: "No Data Available",
                board: "Offline",
                year: "—",
                question: "আপনি বর্তমানে অফলাইনে আছেন। এই অধ্যায়টি আগে ডাউনলোড হয়নি। ইন্টারনেট সংযোগ দিন এবং পুনরায় লোড করুন।",
                options: ["ঠিক আছে"],
                answer: "ঠিক আছে",
                explanation: "একবার ইন্টারনেটে সংযুক্ত থাকাকালীন একটি অধ্যায় খুললে, এটি স্বয়ংক্রিয়ভাবে অফলাইন ব্যবহারের জন্য সংরক্ষিত হবে।",
                context: "আপনি বর্তমানে অফলাইনে আছেন। এই অধ্যায়/বোর্ডটি আগে এই ডিভাইসে লোড করা হয়নি। প্রশ্নগুলো ডাউনলোড করতে ইন্টারনেটে সংযুক্ত হন।",
                questions: [
                    { type: 'a', question: "কী করবেন?", answer: "ইন্টারনেটে সংযুক্ত হন এবং প্রশ্নগুলো ডাউনলোড করতে এই পৃষ্ঠাটি পুনরায় লোড করুন।" }
                ]
            }]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(cleanUrl).then(cached => {
                    // Background revalidation — always refresh the cache silently
                    const networkFetch = fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse.ok) {
                                cache.put(cleanUrl, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => null);

                    if (cached) {
                        // Serve immediately from cache (instant!), update in background
                        return cached;
                    }
                    // Not cached yet — wait for network
                    return networkFetch.then(resp => {
                        if (resp) return resp;
                        return offlinePlaceholder(cleanUrl);
                    });
                });
            })
        );
        return;
    }

    // Strategy 2: CDN RESOURCES — Cache-first, fallback to network
    if (isCDNResource(requestUrl)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) {
                    // Refresh in background
                    fetch(event.request).then(resp => {
                        if (resp.ok) {
                            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp));
                        }
                    }).catch(() => {});
                    return cached;
                }
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

    // Strategy 3: APP SHELL & OTHER — Stale-While-Revalidate
    // Serve instantly from cache if available, then refresh cache in background.
    const cleanUrl = stripQuery(requestUrl);
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(cleanUrl).then(cached => {
                // Background revalidation — always update cache from server
                const networkFetch = fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse.ok && event.request.method === 'GET') {
                            cache.put(cleanUrl, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => null);

                if (cached) {
                    // Serve immediately from cache, update in background
                    return cached;
                }
                // Not in cache, wait for network
                return networkFetch.then(resp => {
                    if (resp) return resp;
                    // Secondary check for original request
                    return cache.match(event.request).then(cached2 => {
                        if (cached2) return cached2;
                        // Offline navigation fallback
                        if (event.request.mode === 'navigate') {
                            return cache.match('./index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
                });
            });
        })
    );
});
