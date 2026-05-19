document.addEventListener('DOMContentLoaded', () => {
    // 1. Dashboard Mode Selectors
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode');
            localStorage.setItem('practiceMode', mode);
            // Clear previous selections
            localStorage.removeItem('selectedSubject');
            localStorage.removeItem('selectedChapter');
            localStorage.removeItem('selectedYear');
            localStorage.removeItem('selectedBoard');
            
            window.location.href = 'subjects.html';
        });
    });

    // 2. Sidebar Navigation Links
    document.getElementById('side-chapter').addEventListener('click', () => {
        localStorage.setItem('practiceMode', 'chapter');
        localStorage.removeItem('selectedSubject');
    });

    document.getElementById('side-board').addEventListener('click', () => {
        localStorage.setItem('practiceMode', 'board');
        localStorage.removeItem('selectedSubject');
    });

    // 3. Mobile Sidebar Hamburger Menu Toggle
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking main-workspace area on mobile
    document.querySelector('.main-workspace').addEventListener('click', (e) => {
        if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}

