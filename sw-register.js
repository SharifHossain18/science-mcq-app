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
        <span>নতুন আপডেট উপলব্ধ! <button onclick="applyUpdate()">রিফ্রেশ করুন</button></span>
    `;
    Object.assign(banner.style, {
        position: 'fixed', top: '0', left: '0', right: '0', zIndex: '9999',
        background: '#1e40af', color: '#fff', textAlign: 'center',
        padding: '12px 16px', fontWeight: '600', fontSize: '0.95rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'slideDown 0.3s ease'
    });
    banner.querySelector('button').style.cssText = `
        margin-left: 12px; padding: 6px 18px; border: none; border-radius: 8px;
        background: #fff; color: #1e40af; font-weight: 700; cursor: pointer;
    `;
    document.body.prepend(banner);
}

function applyUpdate() {
    const banner = document.getElementById('sw-update-banner');
    if (banner) banner.remove();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => reg.unregister());
        });
    }
    window.location.reload();
}
