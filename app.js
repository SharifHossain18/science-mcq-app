document.addEventListener('DOMContentLoaded', () => {
    // 1. Dashboard Mode Card Click Handler (Goes to Sub-mode page)
    document.querySelectorAll('.mode-gradient-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode'); // 'mcq' or 'cq'
            localStorage.setItem('tempPracticeMode', mode);
            
            // Clear previous selections to allow a fresh flow
            localStorage.removeItem('selectedSubject');
            localStorage.removeItem('selectedChapter');
            localStorage.removeItem('selectedChapterId');
            localStorage.removeItem('selectedYear');
            localStorage.removeItem('selectedBoard');
            localStorage.removeItem('cqSubMode');
            
            window.location.href = 'submode.html';
        });
    });

    // 2. Sidebar Navigation Links
    const sideChapter = document.getElementById('side-chapter');
    if (sideChapter) {
        sideChapter.addEventListener('click', () => {
            localStorage.setItem('tempPracticeMode', 'mcq');
            localStorage.setItem('practiceMode', 'chapter');
            localStorage.removeItem('selectedSubject');
        });
    }

    const sideBoard = document.getElementById('side-board');
    if (sideBoard) {
        sideBoard.addEventListener('click', () => {
            localStorage.setItem('tempPracticeMode', 'mcq');
            localStorage.setItem('practiceMode', 'board');
            localStorage.removeItem('selectedSubject');
        });
    }

    const sideCq = document.getElementById('side-cq');
    if (sideCq) {
        sideCq.addEventListener('click', () => {
            localStorage.setItem('tempPracticeMode', 'cq');
            localStorage.setItem('practiceMode', 'cq');
            localStorage.removeItem('cqSubMode');
            localStorage.removeItem('selectedSubject');
        });
    }

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

