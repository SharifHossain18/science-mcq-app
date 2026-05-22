// Shared Service Worker registration — included on ALL pages
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('SW registered:', reg.scope);
                // Check for updates on every page load
                reg.update().catch(() => {});
            })
            .catch(err => console.error('SW registration failed:', err));
    });
}
