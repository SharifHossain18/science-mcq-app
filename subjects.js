let metaData = {};

// Local state representation synced with localStorage
let state = {
    mode: localStorage.getItem('practiceMode') || 'chapter',
    cqSubMode: localStorage.getItem('cqSubMode') || null,
    subject: localStorage.getItem('selectedSubject') || null,
    year: localStorage.getItem('selectedYear') || null,
    board: localStorage.getItem('selectedBoard') || null,
    chapter: localStorage.getItem('selectedChapter') || null
};

// ── Toast notification (replaces alert() for mobile-friendly UX) ──
function showLumenToast(message, type = 'info', duration = 4000) {
    let toast = document.getElementById('lumen-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lumen-toast';
        document.body.appendChild(toast);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.className = `toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    // Trigger show
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

async function checkAndMarkSavedSubjects() {
    if (!('caches' in window)) return; // Cache API not available
    const cards = document.querySelectorAll('.subject-card');
    try {
        const cache = await caches.open('lumen-v45');
        for (const card of cards) {
            const subject = card.getAttribute('data-subject');
            if (!subject) continue;
            
            const cleanSubject = subject.replace(/\s+/g, '_');
            const url = `data/chapters/${cleanSubject}_ch_2.json`;
            const match = await cache.match(url);
            
            const btn = card.querySelector('.download-offline-btn');
            if (btn && match) {
                btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #ffffff;"></i>`;
                btn.classList.add('saved');
                btn.title = "সংরক্ষিত (Saved)";
            }
        }
    } catch (e) {
        console.error("Error checking cached subjects:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check and update saved visual state of subjects
    checkAndMarkSavedSubjects();
    
    // Set active sidebar item highlight
    updateSidebarActiveItem();

    // Fetch lightweight subject metadata for instant loading
    fetch('data/meta.json?t=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            metaData = data;
            // Render initial screen based on localStorage state
            renderCurrentState();
        })
        .catch(err => {
            console.error("Error loading metadata database:", err);
            window.metaLoadError = err;
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
        localStorage.setItem('tempPracticeMode', 'mcq');
        localStorage.setItem('practiceMode', 'chapter');
        clearSelections();
        state.mode = 'chapter';
        renderCurrentState();
        updateSidebarActiveItem();
    });

    document.getElementById('side-board').addEventListener('click', (e) => {
        e.preventDefault();
        closeSidebarOnMobile();
        localStorage.setItem('tempPracticeMode', 'mcq');
        localStorage.setItem('practiceMode', 'board');
        clearSelections();
        state.mode = 'board';
        renderCurrentState();
        updateSidebarActiveItem();
    });

    const sideCq = document.getElementById('side-cq');
    if (sideCq) {
        sideCq.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebarOnMobile();
            localStorage.setItem('tempPracticeMode', 'cq');
            localStorage.setItem('practiceMode', 'cq');
            localStorage.removeItem('cqSubMode');
            clearSelections();
            window.location.href = 'submode.html';
        });
    }

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
    } else if (state.mode === 'cq') {
        const cqLink = document.getElementById('side-cq');
        if (cqLink) cqLink.classList.add('active');
    }
}

function clearSelections() {
    state.subject = null;
    state.chapter = null;
    state.year = null;
    state.board = null;
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedChapterId');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedBoard');
}

// Check state variables and show corresponding selector view
function renderCurrentState() {
    // Prevent blank screen when coming back from quiz/cq page by clearing leaf selections
    if (state.chapter) {
        state.chapter = null;
        localStorage.removeItem('selectedChapter');
    }
    if (state.board) {
        state.board = null;
        localStorage.removeItem('selectedBoard');
    }

    // Hide all selector views first
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });

    renderBreadcrumbs();

    if (state.mode === 'cq' && !state.cqSubMode) {
        renderCqSubModeSelector();
        document.getElementById('chapter-year-view').classList.add('active');
        return;
    }

    if (!state.subject) {
        // Show Subject selection grid
        document.getElementById('subject-view').classList.add('active');
        return;
    }

    if (state.mode === 'chapter' || (state.mode === 'cq' && state.cqSubMode === 'chapter')) {
        if (!state.chapter) {
            // Show Chapters Selection list
            renderChapterList();
            document.getElementById('chapter-year-view').classList.add('active');
        }
    } else {
        // Board mode or CQ Board-wise
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
    if (state.mode === 'board' || (state.mode === 'cq' && state.cqSubMode === 'board')) {
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
            window.location.href = 'submode.html';
            return;
        }
    } else if (state.mode === 'chapter' || (state.mode === 'cq' && state.cqSubMode === 'chapter')) {
        if (state.chapter) {
            state.chapter = null;
            localStorage.removeItem('selectedChapter');
        } else if (state.subject) {
            state.subject = null;
            localStorage.removeItem('selectedSubject');
        } else {
            window.location.href = 'submode.html';
            return;
        }
    } else {
        window.location.href = 'submode.html';
        return;
    }
    renderCurrentState();
}

// Render dynamic chapters list
function renderChapterList() {
    const listEl = document.getElementById('chapter-year-list');
    const titleEl = document.getElementById('chapter-year-title');
    
    titleEl.textContent = 'অধ্যায় নির্বাচন করুন (Select Chapter)';
    listEl.innerHTML = '';
    listEl.className = 'selection-list';

    const subjectMeta = metaData[state.subject];
    if (!subjectMeta || !subjectMeta.chapters || subjectMeta.chapters.length === 0) {
        showNoDataPlaceholder(listEl);
        return;
    }

    subjectMeta.chapters.forEach(ch => {
        if (!ch || !ch.name) return;
        // Skip empty "General" category from user-facing practice since all general questions are sorted
        if (ch.id === 'ch_1' || ch.name.toLowerCase() === 'general') return;

        const btn = document.createElement('div');
        btn.className = 'list-item';
        
        // Parse Chapter Number and Name dynamically
        let chapterNum = "Overview";
        let chapterName = ch.name;
        if (ch.name.includes(':')) {
            const parts = ch.name.split(':');
            chapterNum = parts[0].trim();
            chapterName = parts.slice(1).join(':').trim();
        }
        
        btn.innerHTML = `
            <div class="list-item-content">
                <span class="list-item-chapter-num">${chapterNum}</span>
                <span class="list-item-chapter-name">${chapterName}</span>
            </div>
            <div class="list-item-chevron">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        `;
        btn.addEventListener('click', () => {
            state.chapter = ch.name;
            localStorage.setItem('selectedChapter', ch.name);
            localStorage.setItem('selectedChapterId', ch.id);
            if (state.mode === 'cq') {
                window.location.href = 'cq.html';
            } else {
                window.location.href = 'mcq.html';
            }
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
    listEl.className = 'board-grid';

    const subjectMeta = metaData[state.subject];
    if (!subjectMeta || !subjectMeta.boards || Object.keys(subjectMeta.boards).length === 0) {
        showNoDataPlaceholder(listEl);
        return;
    }

    // Sort years descending dynamically
    const years = Object.keys(subjectMeta.boards).sort((a, b) => b.localeCompare(a));
    
    years.forEach(yr => {
        const btn = document.createElement('div');
        btn.className = 'list-item';
        btn.setAttribute('data-year', yr);
        
        btn.innerHTML = `
            <i class="fa-solid fa-calendar-days board-card-icon"></i>
            <span>${yr}</span>
        `;
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

    const subjectMeta = metaData[state.subject];
    if (!subjectMeta || !subjectMeta.boards || !subjectMeta.boards[state.year]) {
        showNoDataPlaceholder(listEl);
        return;
    }

    const boards = [...subjectMeta.boards[state.year]].sort((a, b) => {
        if (a === 'Combined') return -1;
        if (b === 'Combined') return 1;
        return a.localeCompare(b);
    });

    boards.forEach(bd => {
        if (!bd) return;
        const btn = document.createElement('div');
        btn.className = 'board-card';
        btn.setAttribute('data-board', bd);
        btn.innerHTML = `<i class="fa-solid fa-building-columns board-card-icon"></i>${bd}`;
        btn.addEventListener('click', () => {
            state.board = bd;
            localStorage.setItem('selectedBoard', bd);
            if (state.mode === 'cq') {
                window.location.href = 'cq.html';
            } else {
                window.location.href = 'mcq.html';
            }
        });
        listEl.appendChild(btn);
    });
}

// Render CQ Submode selection menu
function renderCqSubModeSelector() {
    const listEl = document.getElementById('chapter-year-list');
    const titleEl = document.getElementById('chapter-year-title');
    
    titleEl.textContent = 'সৃজনশীল প্রশ্নের ধরণ নির্বাচন করুন (Select CQ Type)';
    listEl.innerHTML = '';
    listEl.className = 'board-grid';

    const submodes = [
        { id: 'chapter', name: 'অধ্যায়ভিত্তিক প্রস্তুতি', icon: 'fa-regular fa-folder-open', desc: 'Chapter-wise CQs', bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
        { id: 'board', name: 'বোর্ড প্রশ্ন প্রস্তুতি', icon: 'fa-solid fa-building-columns', desc: 'Board-wise CQs', bg: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' }
    ];

    submodes.forEach(sub => {
        const btn = document.createElement('div');
        btn.className = 'board-card';
        btn.style.height = '120px';
        btn.style.flexDirection = 'column';
        btn.style.justifyContent = 'center';
        btn.style.gap = '10px';
        btn.style.background = sub.bg;
        btn.style.border = 'none';
        btn.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        btn.innerHTML = `
            <i class="${sub.icon} board-card-icon" style="font-size: 2.2rem; margin: 0; color: #ffffff !important; margin-bottom: 5px;"></i>
            <span style="font-weight: 800; font-size: 1.1rem; color: #ffffff !important;">${sub.name}</span>
            <span style="font-size: 0.8rem; color: rgba(255,255,255,0.85); font-weight: 600;">${sub.desc}</span>
        `;
        btn.addEventListener('click', () => {
            state.cqSubMode = sub.id;
            localStorage.setItem('cqSubMode', sub.id);
            renderCurrentState();
        });
        listEl.appendChild(btn);
    });
}

// Placeholder for empty datasets
function showNoDataPlaceholder(container) {
    let errorDetailsHtml = '';
    if (window.metaLoadError) {
        errorDetailsHtml = `
            <div style="margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px dashed #ef4444; font-family: monospace; font-size: 0.75rem; color: #ef4444; word-break: break-all;">
                <strong>Debug Info (Metadata Fetch Error):</strong><br>
                ${window.metaLoadError.message || window.metaLoadError}
            </div>
        `;
    }
    container.innerHTML = `
        <div class="loading-state" style="padding: 40px 15px;">
            <i class="fa-solid fa-hourglass-start" style="font-size: 2.5rem; color: var(--primary-blue); margin-bottom: 15px;"></i>
            <p style="color: var(--text-main); font-weight: 600; font-size: 1rem;">দুঃখিত! এই বিষয়ের প্রশ্নগুলো শীঘ্রই যোগ করা হবে।</p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Currently, no board question data loaded for this subject.</p>
            ${errorDetailsHtml}
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

    let modeLabel = 'প্রস্তুতি';
    if (state.mode === 'chapter') {
        modeLabel = 'অধ্যায়ভিত্তিক প্রস্তুতি';
    } else if (state.mode === 'board') {
        modeLabel = 'বোর্ড প্রশ্ন প্রস্তুতি';
    } else if (state.mode === 'cq') {
        modeLabel = 'সৃজনশীল প্রশ্ন প্রস্তুতি (CQ)';
    }
    
    if (state.mode === 'cq' && !state.cqSubMode) {
        addBreadcrumb(modeLabel, null, true);
        return;
    }

    addBreadcrumb(modeLabel, () => {
        const oldMode = state.mode;
        clearSelections();
        if (oldMode === 'cq') {
            state.cqSubMode = null;
            localStorage.removeItem('cqSubMode');
        }
        renderCurrentState();
    });

    if (state.mode === 'cq' && state.cqSubMode) {
        const subModeLabel = state.cqSubMode === 'chapter' ? 'অধ্যায়ভিত্তিক' : 'বোর্ড ভিত্তিক';
        if (!state.subject) {
            addBreadcrumb(subModeLabel, null, true);
            return;
        }
        addBreadcrumb(subModeLabel, () => {
            state.subject = null;
            localStorage.removeItem('selectedSubject');
            renderCurrentState();
        });
    }

    if (!state.subject) {
        return;
    }

    if (state.mode === 'chapter' || (state.mode === 'cq' && state.cqSubMode === 'chapter')) {
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

// Download entire subject for offline caching
async function downloadSubjectOffline(subject, btn) {
    // Guard: Cache Storage API requires HTTPS or localhost
    if (!('caches' in window)) {
        showLumenToast('এই ব্রাউজারে অফলাইন ডাউনলোড সমর্থিত নয়। HTTPS বা localhost ব্যবহার করুন।', 'error', 5000);
        return;
    }
    if (!window.isSecureContext) {
        showLumenToast('নিরাপদ কানেকশন প্রয়োজন। localhost ব্যবহার করুন: http://localhost:' + window.location.port, 'error', 5000);
        return;
    }

    if (!metaData || !metaData[subject]) {
        showLumenToast('মেটাডাটা লোড হচ্ছে, একটু অপেক্ষা করুন...', 'info');
        return;
    }

    const cleanSubject = subject.replace(/\s+/g, '_');
    const urlsToCache = [];

    // 1. Gather all MCQ chapters JSON
    const chapters = metaData[subject].chapters || [];
    chapters.forEach(ch => {
        urlsToCache.push(`data/chapters/${cleanSubject}_${ch.id}.json`);
    });

    // 2. Gather all MCQ boards JSON
    const boards = metaData[subject].boards || {};
    Object.keys(boards).forEach(year => {
        boards[year].forEach(board => {
            const cleanBoard = board.replace(/\s+/g, '_');
            urlsToCache.push(`data/boards/${cleanSubject}_${year}_${cleanBoard}.json`);
        });
    });

    // 3. Gather all CQ chapters JSON
    chapters.forEach(ch => {
        urlsToCache.push(`data/cq/chapters/${cleanSubject}_${ch.id}.json`);
    });

    // 4. Gather all CQ boards JSON
    Object.keys(boards).forEach(year => {
        boards[year].forEach((board, idx) => {
            const boardId = idx + 1; // 1-based index
            urlsToCache.push(`data/cq/boards/${cleanSubject}_${year}_${boardId}.json`);
        });
    });

    const totalUrls = urlsToCache.length;
    if (totalUrls === 0) return;

    // Change button state to circular progress ring (size 24px)
    btn.disabled = true;
    const originalHtml = `<i class="fa-solid fa-cloud-arrow-down"></i>`;
    
    const size = 24;
    const center = size / 2;
    const radius = (size - 4) / 2;
    const circ = 2 * Math.PI * radius;
    
    btn.innerHTML = `
        <svg class="progress-ring" width="${size}" height="${size}" style="transform: rotate(-90deg); display: block;">
            <circle stroke="rgba(255,255,255,0.2)" stroke-width="2.5" fill="transparent" r="${radius}" cx="${center}" cy="${center}"/>
            <circle class="progress-ring-bar" stroke="#10b981" stroke-width="2.5" fill="transparent" r="${radius}" cx="${center}" cy="${center}"
                    stroke-dasharray="${circ}" stroke-dashoffset="${circ}"/>
        </svg>
    `;
    btn.title = "ডাউনলোড হচ্ছে...";

    const bar = btn.querySelector('.progress-ring-bar');

    try {
        // Open service worker cache (matches CACHE_NAME 'lumen-v45' in sw.js)
        const cache = await caches.open('lumen-v45');
        
        let successCount = 0;
        let failCount = 0;

        // Download and cache each file in sequence
        for (const url of urlsToCache) {
            try {
                const response = await fetch(url + '?t=' + Date.now());
                if (response.ok) {
                    await cache.put(url, response.clone());
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                failCount++;
            }
            
            // Update circular progress ring
            const percent = Math.round(((successCount + failCount) / totalUrls) * 100);
            const offset = circ - (percent / 100) * circ;
            if (bar) {
                bar.style.strokeDashoffset = offset;
            }
        }

        if (successCount > 0) {
            btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #ffffff;"></i>`;
            btn.classList.add('saved');
            btn.title = "সংরক্ষিত (Saved)";
            btn.disabled = false;
            showLumenToast(`✔ "${subject}" — ${successCount}টি ফাইল সফলভাবে সংরক্ষিত হয়েছে!`, 'success', 4000);
        } else {
            btn.innerHTML = originalHtml;
            btn.classList.remove('saved');
            btn.disabled = false;
            showLumenToast("কোনো ফাইল ডাউনলোড হয়নি। ইন্টারনেট কানেকশন চেক করুন।", 'error');
        }
    } catch (err) {
        console.error(err);
        btn.innerHTML = originalHtml;
        btn.classList.remove('saved');
        btn.disabled = false;
        showLumenToast('ডাউনলোড ব্যর্থ: ' + (err.message || 'অজানা ত্রুটি'), 'error', 5000);
    }
}
