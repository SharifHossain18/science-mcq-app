const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

if ('serviceWorker' in navigator) {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        if (!isStandalone) {
            window.location.reload();
        }
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('SW registered:', reg.scope);
                reg.onupdatefound = () => {
                    const installing = reg.installing;
                    if (installing) {
                        installing.onstatechange = () => {
                            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                                reg.update().then(() => {
                                    reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
                                });
                            }
                        };
                    }
                };
            })
            .catch(err => console.error('SW registration failed:', err));
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
            window.location.reload();
        }
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});
