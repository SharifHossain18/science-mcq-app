if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('SW registered:', reg.scope);
                reg.onupdatefound = () => {
                    const installing = reg.installing;
                    if (installing) {
                        installing.onstatechange = () => {
                            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateBanner();
                            }
                        };
                    }
                };
                reg.update().catch(() => {});
            })
            .catch(err => console.error('SW registration failed:', err));
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
            showUpdateBanner();
        }
    });
}

function showUpdateBanner() {
    const existing = document.getElementById('sw-update-banner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.innerHTML = `
        <span>🚀 নতুন আপডেট উপলব্ধ!</span>
        <button onclick="applyUpdate()">রিফ্রেশ করুন</button>
    `;
    document.body.prepend(banner);
}

function applyUpdate() {
    const banner = document.getElementById('sw-update-banner');
    if (banner) banner.remove();
    window.location.reload();
}
