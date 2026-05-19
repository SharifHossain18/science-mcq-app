let allData = [];

// Local state representation synced with localStorage
let state = {
    mode: localStorage.getItem('practiceMode') || 'chapter',
    subject: localStorage.getItem('selectedSubject') || null,
    year: localStorage.getItem('selectedYear') || null,
    board: localStorage.getItem('selectedBoard') || null,
    chapter: localStorage.getItem('selectedChapter') || null
};

document.addEventListener('DOMContentLoaded', () => {
    // Set active sidebar item highlight
    updateSidebarActiveItem();

    // Fetch question bank JSON for dynamic sorting/rendering
    fetch('data.json?t=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            allData = data;
            // Render initial screen based on localStorage state
            renderCurrentState();
        })
        .catch(err => {
            console.error("Error loading questions database:", err);
            renderCurrentState(); // Try to render anyway
        });

    // Subject Card click handlers
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const sub = card.getAttribute('data-subject');
            state.subject = sub;
            localStorage.setItem('selectedSubject', sub);
            renderCurrentState();
        });
    });

    // Header Back button click
    document.getElementById('back-btn').addEventListener('click', handleBackAction);

    // Sidebar navigation mode switches
    document.getElementById('side-chapter').addEventListener('click', (e) => {
        e.preventDefault();
        closeSidebarOnMobile();
        localStorage.setItem('practiceMode', 'chapter');
        clearSelections();
        state.mode = 'chapter';
        renderCurrentState();
        updateSidebarActiveItem();
    });

    document.getElementById('side-board').addEventListener('click', (e) => {
        e.preventDefault();
        closeSidebarOnMobile();
        localStorage.setItem('practiceMode', 'board');
        clearSelections();
        state.mode = 'board';
        renderCurrentState();
        updateSidebarActiveItem();
    });

    // Mobile Sidebar Drawer Toggles
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close mobile drawer when clicking workspace area
    document.querySelector('.main-workspace').addEventListener('click', (e) => {
        if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) {
            closeSidebarOnMobile();
        }
    });
});

function closeSidebarOnMobile() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
}

function updateSidebarActiveItem() {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (state.mode === 'chapter') {
        const chLink = document.getElementById('side-chapter');
        if (chLink) chLink.classList.add('active');
    } else if (state.mode === 'board') {
        const bdLink = document.getElementById('side-board');
        if (bdLink) bdLink.classList.add('active');
    }
}

function clearSelections() {
    state.subject = null;
    state.chapter = null;
    state.year = null;
    state.board = null;
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedBoard');
}

// Check state variables and show corresponding selector view
function renderCurrentState() {
    // Hide all selector views first
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });

    renderBreadcrumbs();

    if (!state.subject) {
        // Show Subject selection grid
        document.getElementById('subject-view').classList.add('active');
        return;
    }

    if (state.mode === 'chapter') {
        if (!state.chapter) {
            // Show Chapters Selection list
            renderChapterList();
            document.getElementById('chapter-year-view').classList.add('active');
        }
    } else {
        // Board mode
        if (!state.year) {
            // Show Years Selection list
            renderYearList();
            document.getElementById('chapter-year-view').classList.add('active');
        } else if (!state.board) {
            // Show Boards Selection grid
            renderBoardList();
            document.getElementById('board-view').classList.add('active');
        }
    }
}

// Back action handler
function handleBackAction() {
    if (state.mode === 'board') {
        if (state.board) {
            state.board = null;
            localStorage.removeItem('selectedBoard');
        } else if (state.year) {
            state.year = null;
            localStorage.removeItem('selectedYear');
        } else if (state.subject) {
            state.subject = null;
            localStorage.removeItem('selectedSubject');
        } else {
            window.location.href = 'index.html';
            return;
        }
    } else {
        // Chapter mode
        if (state.chapter) {
            state.chapter = null;
            localStorage.removeItem('selectedChapter');
        } else if (state.subject) {
            state.subject = null;
            localStorage.removeItem('selectedSubject');
        } else {
            window.location.href = 'index.html';
            return;
        }
    }
    renderCurrentState();
}

// Render dynamic chapters list
function renderChapterList() {
    const listEl = document.getElementById('chapter-year-list');
    const titleEl = document.getElementById('chapter-year-title');
    
    titleEl.textContent = 'অধ্যায় নির্বাচন করুন (Select Chapter)';
    listEl.innerHTML = '';

    const subjectData = allData.filter(q => q.subject === state.subject);
    if (subjectData.length === 0) {
        showNoDataPlaceholder(listEl);
        return;
    }

    // Filter unique chapters and sort numerically
    const chapters = [...new Set(subjectData.map(q => q.chapter))].sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });

    chapters.forEach(ch => {
        if (!ch) return;
        const btn = document.createElement('div');
        btn.className = 'list-item';
        btn.innerHTML = `<span>${ch}</span><i class="fa-solid fa-chevron-right"></i>`;
        btn.addEventListener('click', () => {
            state.chapter = ch;
            localStorage.setItem('selectedChapter', ch);
            window.location.href = 'mcq.html';
        });
        listEl.appendChild(btn);
    });
}

// Render static board years list
function renderYearList() {
    const listEl = document.getElementById('chapter-year-list');
    const titleEl = document.getElementById('chapter-year-title');
    
    titleEl.textContent = 'বছর নির্বাচন করুন (Select Year)';
    listEl.innerHTML = '';

    const subjectData = allData.filter(q => q.subject === state.subject);
    if (subjectData.length === 0) {
        showNoDataPlaceholder(listEl);
        return;
    }

    const years = ['2025', '2024', '2023', '2022', '2021', '2019', '2018', '2017'];
    
    years.forEach(yr => {
        const btn = document.createElement('div');
        btn.className = 'list-item';
        btn.innerHTML = `<span>${yr} Board Questions</span><i class="fa-solid fa-chevron-right"></i>`;
        btn.addEventListener('click', () => {
            state.year = yr;
            localStorage.setItem('selectedYear', yr);
            renderCurrentState();
        });
        listEl.appendChild(btn);
    });
}

// Render board names selection card grid
function renderBoardList() {
    const listEl = document.getElementById('board-list');
    listEl.innerHTML = '';

    const subjectYearData = allData.filter(q => q.subject === state.subject && String(q.year) === String(state.year));
    if (subjectYearData.length === 0) {
        showNoDataPlaceholder(listEl);
        return;
    }

    const boards = [...new Set(subjectYearData.map(q => q.board))].sort((a, b) => {
        if (a === 'Combined') return -1;
        if (b === 'Combined') return 1;
        return a.localeCompare(b);
    });

    boards.forEach(bd => {
        if (!bd) return;
        const btn = document.createElement('div');
        btn.className = 'board-card';
        btn.textContent = bd;
        btn.addEventListener('click', () => {
            state.board = bd;
            localStorage.setItem('selectedBoard', bd);
            window.location.href = 'mcq.html';
        });
        listEl.appendChild(btn);
    });
}

// Placeholder for empty datasets
function showNoDataPlaceholder(container) {
    container.innerHTML = `
        <div class="loading-state" style="padding: 40px 15px;">
            <i class="fa-solid fa-hourglass-start" style="font-size: 2.5rem; color: var(--primary-blue); margin-bottom: 15px;"></i>
            <p style="color: var(--text-main); font-weight: 600; font-size: 1rem;">দুঃখিত! এই বিষয়ের প্রশ্নগুলো শীঘ্রই যোগ করা হবে।</p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Currently, no board question data loaded for this subject.</p>
        </div>
    `;
}

// Clickable breadcrumbs rendering
function renderBreadcrumbs() {
    const breadcrumbContainer = document.getElementById('breadcrumb-path');
    if (!breadcrumbContainer) return;
    breadcrumbContainer.innerHTML = '';

    function addBreadcrumb(label, clickHandler, isActive = false) {
        if (breadcrumbContainer.children.length > 0) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '<i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>';
            breadcrumbContainer.appendChild(separator);
        }
        const item = document.createElement('span');
        item.className = 'breadcrumb-item' + (isActive ? ' active' : '');
        item.textContent = label;
        if (!isActive && clickHandler) {
            item.addEventListener('click', clickHandler);
        }
        breadcrumbContainer.appendChild(item);
    }

    // Always start with Home
    addBreadcrumb('Home', () => {
        window.location.href = 'index.html';
    });

    const modeLabel = state.mode === 'chapter' ? 'অধ্যায়ভিত্তিক প্রস্তুতি' : 'বোর্ড প্রশ্ন প্রস্তুতি';
    
    if (!state.subject) {
        addBreadcrumb(modeLabel, null, true);
        return;
    }

    addBreadcrumb(modeLabel, () => {
        clearSelections();
        renderCurrentState();
    });

    if (state.mode === 'chapter') {
        addBreadcrumb(state.subject, null, true);
    } else {
        // Board mode
        if (!state.year) {
            addBreadcrumb(state.subject, null, true);
        } else {
            addBreadcrumb(state.subject, () => {
                state.year = null;
                state.board = null;
                localStorage.removeItem('selectedYear');
                localStorage.removeItem('selectedBoard');
                renderCurrentState();
            });
            addBreadcrumb(state.year, null, true);
        }
    }
}
