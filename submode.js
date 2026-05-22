document.addEventListener('DOMContentLoaded', () => {
    const tempPracticeMode = localStorage.getItem('tempPracticeMode') || 'mcq';

    // 1. Render Breadcrumbs dynamically
    const breadcrumbContainer = document.getElementById('breadcrumb-path');
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = `
            <span class="breadcrumb-item" onclick="window.location.href='index.html'">Home</span>
            <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i></span>
            <span class="breadcrumb-item active">${tempPracticeMode === 'cq' ? 'CQ Practice' : 'MCQ Practice'}</span>
        `;
    }

    // 2. Customize cards and page details based on mode (MCQ vs CQ)
    const titleEl = document.getElementById('submode-title');
    const chBadge = document.getElementById('chapter-badge');
    const chTitle = document.getElementById('chapter-title');
    const chDesc = document.getElementById('chapter-desc');
    const bdBadge = document.getElementById('board-badge');
    const bdTitle = document.getElementById('board-title');
    const bdDesc = document.getElementById('board-desc');

    if (tempPracticeMode === 'cq') {
        if (titleEl) titleEl.textContent = 'সৃজনশীল প্রশ্নের প্রস্তুতি (CQ Preparation Type)';
        if (chBadge) chBadge.textContent = 'Chapter-wise CQ';
        if (chTitle) chTitle.textContent = 'অধ্যায়ভিত্তিক CQ প্রস্তুতি';
        if (chDesc) chDesc.textContent = 'অধ্যায় অনুসারে সৃজনশীল প্রশ্ন (CQ) অনুশীলন করুন';
        if (bdBadge) bdBadge.textContent = 'Board-wise CQ';
        if (bdTitle) bdTitle.textContent = 'বোর্ড CQ প্রস্তুতি';
        if (bdDesc) bdDesc.textContent = 'বিগত বছরের সকল বোর্ডের সৃজনশীল প্রশ্ন (CQ) অনুশীলন করুন';
    } else {
        if (titleEl) titleEl.textContent = 'বহুনির্বাচনি প্রশ্নের প্রস্তুতি (MCQ Preparation Type)';
        if (chBadge) chBadge.textContent = 'Chapter-wise MCQ';
        if (chTitle) chTitle.textContent = 'অধ্যায়ভিত্তিক MCQ প্রস্তুতি';
        if (chDesc) chDesc.textContent = 'অধ্যায় অনুসারে প্রতিটি টপিকের MCQ প্র্যাকটিস করুন';
        if (bdBadge) bdBadge.textContent = 'Board-wise MCQ';
        if (bdTitle) bdTitle.textContent = 'বোর্ড MCQ প্রস্তুতি';
        if (bdDesc) bdDesc.textContent = 'বিগত বছরের সকল বোর্ডের MCQ সমাধান করুন';
    }

    // Highlight active sidebar items
    updateSidebarActiveItem(tempPracticeMode);

    // 3. Card click event handlers
    document.querySelectorAll('.mode-gradient-card').forEach(card => {
        card.addEventListener('click', () => {
            const submode = card.getAttribute('data-mode'); // 'chapter' or 'board'
            
            if (tempPracticeMode === 'cq') {
                localStorage.setItem('practiceMode', 'cq');
                localStorage.setItem('cqSubMode', submode);
            } else {
                localStorage.setItem('practiceMode', submode);
                localStorage.removeItem('cqSubMode');
            }

            // Clear previous selections for a clean start
            clearSelections();
            window.location.href = 'subjects.html';
        });
    });

    // 4. Back button click handler
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // 5. Sidebar Navigation Links handlers
    const sideHome = document.getElementById('side-home');
    if (sideHome) {
        sideHome.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    const sideChapter = document.getElementById('side-chapter');
    if (sideChapter) {
        sideChapter.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('tempPracticeMode', 'mcq');
            localStorage.setItem('practiceMode', 'chapter');
            clearSelections();
            window.location.href = 'subjects.html';
        });
    }

    const sideBoard = document.getElementById('side-board');
    if (sideBoard) {
        sideBoard.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('tempPracticeMode', 'mcq');
            localStorage.setItem('practiceMode', 'board');
            clearSelections();
            window.location.href = 'subjects.html';
        });
    }

    const sideCq = document.getElementById('side-cq');
    if (sideCq) {
        sideCq.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('tempPracticeMode', 'cq');
            localStorage.setItem('practiceMode', 'cq');
            localStorage.removeItem('cqSubMode');
            clearSelections();
            window.location.href = 'subjects.html';
        });
    }

    // 6. Mobile Sidebar Hamburger Menu Toggle
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking main-workspace area on mobile
    const mainWorkspace = document.querySelector('.main-workspace');
    if (mainWorkspace && sidebar) {
        mainWorkspace.addEventListener('click', (e) => {
            if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) {
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
});

function clearSelections() {
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedChapterId');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedBoard');
}

function updateSidebarActiveItem(tempPracticeMode) {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Highlight based on tempPracticeMode
    if (tempPracticeMode === 'cq') {
        const cqLink = document.getElementById('side-cq');
        if (cqLink) cqLink.classList.add('active');
    } else {
        // Highlight home or leave unselected
        const homeLink = document.getElementById('side-home');
        if (homeLink) homeLink.classList.add('active');
    }
}
