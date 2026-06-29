if ('serviceWorker' in navigator) {

    // ── Register the service worker ──
    navigator.serviceWorker.register('./sw.js').then(reg => {

        // Check for updates every time the page loads
        reg.update();

        // When a new SW finishes installing, tell it to skip waiting immediately
        reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (!newSW) return;

            newSW.addEventListener('statechange', () => {
                if (newSW.state === 'installed') {
                    // New version ready — activate it right away
                    newSW.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        });

    }).catch(err => console.error('SW registration failed:', err));

    // When a new SW takes control, reload the page to load fresh files
    // This works for both browser tabs AND installed PWA (standalone mode)
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
    });
}

