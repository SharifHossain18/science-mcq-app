document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.home-subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subject = card.getAttribute('data-subject');
            localStorage.setItem('selectedSubject', subject);
            localStorage.removeItem('selectedChapter');
            localStorage.removeItem('selectedChapterId');
            localStorage.removeItem('selectedYear');
            localStorage.removeItem('selectedBoard');
            localStorage.removeItem('cqSubMode');
            if (!localStorage.getItem('boardSelectMode')) localStorage.setItem('boardSelectMode', 'mcq');
            if (!localStorage.getItem('practiceMode')) localStorage.setItem('practiceMode', 'chapter');
            window.location.href = 'subject.html';
        });
    });

    UTILS.initMobileMenu();
    UTILS.initSwipeGestures();
    UTILS.initInstallPrompt();
    initDarkMode();

    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (href && href !== '#') return;
            e.preventDefault();
            UTILS.closeSidebar();
            const id = item.id;
            if (id === 'side-chapter' || id === 'side-board' || id === 'side-cq') {
                const isCq = id === 'side-cq';
                localStorage.setItem('practiceMode', isCq ? 'cq' : (id === 'side-chapter' ? 'chapter' : 'board'));
                localStorage.setItem('boardSelectMode', isCq ? 'cq' : 'mcq');
                if (isCq) localStorage.removeItem('cqSubMode');
                localStorage.removeItem('selectedSubject');
                UTILS.showToast('নিচে থেকে একটি বিষয় নির্বাচন করুন।', 'info');
            }
        });
    });
});

function initDarkMode() {
    const saved = localStorage.getItem('lumenDarkMode');
    if (saved === 'true') document.documentElement.setAttribute('data-theme', 'dark');

    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('lumenDarkMode', 'false');
                btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('lumenDarkMode', 'true');
                btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            }
        });
        if (localStorage.getItem('lumenDarkMode') === 'true') {
            btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    });
}
