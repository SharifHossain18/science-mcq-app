let allCQs = [];
let metaData = {};
let currentPage = 1;
const pageSize = 5;

// Load selection parameters from localStorage
let state = {
    mode: localStorage.getItem('practiceMode') || 'cq',
    cqSubMode: localStorage.getItem('cqSubMode') || 'chapter',
    subject: localStorage.getItem('selectedSubject') || null,
    year: localStorage.getItem('selectedYear') || null,
    board: localStorage.getItem('selectedBoard') || null,
    chapter: localStorage.getItem('selectedChapter') || null,
    chapterId: localStorage.getItem('selectedChapterId') || null
};

document.addEventListener('DOMContentLoaded', () => {
    // Validate that required state parameters are present
    if (!state.subject || (state.cqSubMode === 'chapter' && !state.chapter) || (state.cqSubMode === 'board' && (!state.year || !state.board))) {
        // Missing parameters, redirect back to selection flow
        window.location.href = 'subjects.html';
        return;
    }

    // Set active sidebar item highlights
    updateSidebarActiveItem();

    // Render breadcrumbs pathway
    renderBreadcrumbs();

    // Fetch the specific split Creative Questions file instead of the 265MB master database
    const container = document.getElementById('cq-container');
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading Creative Questions...</p>
        </div>
    `;

    let fetchPromise;
    const cleanSubject = state.subject.replace(/\s+/g, '_');

    // Always fetch meta.json first to resolve board index or chapter ID dynamically
    fetchPromise = fetch('data/meta.json')
        .then(res => {
            if (!res.ok) throw new Error("Metadata request failed");
            return res.json();
        })
        .then(meta => {
            metaData = meta;
            let cqUrl = '';
            if (state.cqSubMode === 'board') {
                const subjectMeta = meta[state.subject];
                if (!subjectMeta || !subjectMeta.boards || !subjectMeta.boards[state.year]) {
                    throw new Error("Subject/Year not found in metadata");
                }
                const yearBoards = subjectMeta.boards[state.year];
                const boardIndex = yearBoards.indexOf(state.board);
                if (boardIndex === -1) {
                    throw new Error(`Board ${state.board} not found in metadata for year ${state.year}`);
                }
                
                let boardId = '';
                if (state.board === 'Combined') {
                    boardId = 'Combined';
                } else {
                    boardId = String(boardIndex + 1);
                }
                
                // Store resolved board index string for filtering CQs
                state.boardId = boardId;
                
                cqUrl = `data/cq/boards/${cleanSubject}_${state.year}_${boardId}.json`;
            } else {
                if (state.chapterId) {
                    cqUrl = `data/cq/chapters/${cleanSubject}_${state.chapterId}.json`;
                } else {
                    const subjectMeta = meta[state.subject];
                    const normChapterName = (state.chapter || 'General').replace(/ℹ️/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
                    const chapterObj = subjectMeta ? subjectMeta.chapters.find(c => c.name.replace(/ℹ️/g, '').replace(/\s+/g, ' ').trim().toLowerCase() === normChapterName) : null;
                    if (!chapterObj) throw new Error("Chapter not found in metadata");
                    state.chapterId = chapterObj.id;
                    localStorage.setItem('selectedChapterId', chapterObj.id);
                    cqUrl = `data/cq/chapters/${cleanSubject}_${state.chapterId}.json`;
                }
            }
            return fetch(cqUrl);
        });

    fetchPromise
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            allCQs = data;
            renderCQs();
        })
        .catch(err => {
            console.error("Error loading creative questions database:", err);
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 15px;"></i>
                    <p>সৃজনশীল প্রশ্ন ডাটাবেজ লোড করা যাচ্ছে না।</p>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Error: ${err.message}</p>
                </div>
            `;
        });

    // Back Button click
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'subjects.html';
    });

    // Sidebar navigation mode links
    document.getElementById('side-chapter').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('tempPracticeMode', 'mcq');
        localStorage.setItem('practiceMode', 'chapter');
        clearSelections();
        window.location.href = 'subjects.html';
    });

    document.getElementById('side-board').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('tempPracticeMode', 'mcq');
        localStorage.setItem('practiceMode', 'board');
        clearSelections();
        window.location.href = 'subjects.html';
    });

    document.getElementById('side-cq').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('tempPracticeMode', 'cq');
        localStorage.setItem('practiceMode', 'cq');
        localStorage.removeItem('cqSubMode');
        clearSelections();
        window.location.href = 'submode.html';
    });

    // Mobile Sidebar Drawer Toggles
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close mobile drawer when clicking main workspace pane
    document.querySelector('.main-workspace').addEventListener('click', (e) => {
        if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
});

function clearSelections() {
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedChapterId');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedBoard');
    localStorage.removeItem('cqSubMode');
}

function updateSidebarActiveItem() {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const cqLink = document.getElementById('side-cq');
    if (cqLink) cqLink.classList.add('active');
}

// Clickable breadcrumbs path renderer
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

    // Home link
    addBreadcrumb('Home', () => {
        window.location.href = 'index.html';
    });

    const modeLabel = state.cqSubMode === 'chapter' ? 'অধ্যায়ভিত্তিক CQ প্রস্তুতি' : 'বোর্ড CQ প্রস্তুতি';
    
    // Mode link
    addBreadcrumb(modeLabel, () => {
        clearSelections();
        window.location.href = 'subjects.html';
    });

    // Subject link
    addBreadcrumb(state.subject, () => {
        localStorage.removeItem('selectedChapter');
        localStorage.removeItem('selectedYear');
        localStorage.removeItem('selectedBoard');
        window.location.href = 'subjects.html';
    });

    if (state.cqSubMode === 'board' && state.year) {
        addBreadcrumb(state.year, () => {
            localStorage.removeItem('selectedBoard');
            window.location.href = 'subjects.html';
        });
    }

    addBreadcrumb('CQ', null, true);
}

// Filter and render Creative Questions
function renderCQs() {
    const container = document.getElementById('cq-container');
    
    // Clean subject name mappings
    let subjectMatch = state.subject;
    // Map Higher Math to Match scraped title
    if (state.subject === 'Math 1st Paper') subjectMatch = 'Math 1st Paper';
    if (state.subject === 'Math 2nd Paper') subjectMatch = 'Math 2nd Paper';

    let filteredCQs = allCQs.filter(q => q.subject === subjectMatch);

    if (state.cqSubMode === 'chapter') {
        filteredCQs = filteredCQs.filter(q => q.chapter === state.chapter);
    } else {
        filteredCQs = filteredCQs.filter(q => String(q.year) === state.year && q.board === (state.boardId || state.board));
    }

    if (filteredCQs.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fa-regular fa-face-frown" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                <p>কোনো সৃজনশীল প্রশ্ন পাওয়া যায়নি।</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">দুঃখিত, এই ক্যাটাগরিতে কোনো সৃজনশীল প্রশ্ন আপলোড করা হয়নি।</p>
            </div>
        `;
        return;
    }

    // Pagination logic
    const totalCQs = filteredCQs.length;
    const totalPages = Math.ceil(totalCQs / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCQs);
    const pagedCQs = filteredCQs.slice(startIndex, endIndex);

    container.innerHTML = '';

    // Update CQ Title at header
    const cqTitleEl = document.getElementById('cq-view-title');
    if (state.cqSubMode === 'chapter') {
        cqTitleEl.textContent = state.chapter;
    } else {
        cqTitleEl.textContent = `${state.board} Board - ${state.year}`;
    }

    const subQuestionLabels = { 'a': 'ক', 'b': 'খ', 'c': 'গ', 'd': 'ঘ' };
    const subQuestionMarks = { 'a': '১', 'b': '২', 'c': '৩', 'd': '৪' };

    // Deferred answer store: map of unique key → answer HTML
    // Answers (which contain large base64 images) are NOT injected into the DOM
    // until the user explicitly clicks "Show Answer", preventing huge render cost.
    const answerStore = new Map();

    const fragment = document.createDocumentFragment();

    pagedCQs.forEach((cq, idx) => {
        const globalIdx = startIndex + idx;
        const card = document.createElement('div');
        card.className = 'cq-card';
        card.setAttribute('data-cq-id', cq.id);

        let subQuestionsHtml = '';
        (cq.questions || []).forEach((sub, subIdx) => {
            const letterLabel = subQuestionLabels[sub.type] || sub.type.toUpperCase();
            const answerKey = `ans_${globalIdx}_${subIdx}`;

            // Store answer content in memory — not in DOM
            answerStore.set(answerKey, sub.answer || '');
            
            subQuestionsHtml += `
                <div class="cq-subquestion-item" data-answer-key="${answerKey}">
                    <div class="cq-sub-header">
                        <div class="cq-sub-letter-badge">${letterLabel}</div>
                        <div class="cq-sub-text">${sub.question}</div>
                        <button class="cq-reveal-btn" title="উত্তর দেখুন">
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="cq-answer-panel">
                        <div class="cq-answer-inner">
                            <div class="cq-answer-badge">সমাধান (Solution)</div>
                            <div class="cq-answer-content"></div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Parse meta row tags
        let displayBoard = cq.board;
        if (metaData[cq.subject] && metaData[cq.subject].boards && metaData[cq.subject].boards[cq.year]) {
            const yearBoards = metaData[cq.subject].boards[cq.year];
            if (cq.board !== 'Combined') {
                const boardIdx = parseInt(cq.board) - 1;
                if (boardIdx >= 0 && boardIdx < yearBoards.length) {
                    displayBoard = yearBoards[boardIdx];
                }
            }
        }

        const metaTagsHtml = `
            <span class="cq-meta-tag"><i class="fa-regular fa-folder-open"></i> ${cq.chapter || 'General'}</span>
            <span class="cq-meta-tag"><i class="fa-solid fa-building-columns"></i> ${displayBoard} ${cq.year}</span>
        `;

        card.innerHTML = `
            <div class="cq-question-wrapper">
                <div class="q-number-badge">${globalIdx + 1}</div>
                <div class="cq-stem-container">
                    <div class="cq-stem-title">উদ্দীপক (Context):</div>
                    <div class="cq-stem-content">${cq.context}</div>
                </div>
            </div>
            
            <div class="cq-meta-row">
                <div class="cq-meta-tags-wrapper">
                    ${metaTagsHtml}
                </div>
            </div>

            <div class="cq-subquestions-list">
                ${subQuestionsHtml}
            </div>
        `;

        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    // Bind reveal button click handlers — inject answer HTML lazily on first open
    container.querySelectorAll('.cq-reveal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentBtn = e.currentTarget;
            const item = currentBtn.closest('.cq-subquestion-item');
            const answerPanel = item.querySelector('.cq-answer-panel');
            const answerContentEl = item.querySelector('.cq-answer-content');
            const icon = currentBtn.querySelector('i');

            item.classList.toggle('active');
            answerPanel.classList.toggle('show');

            if (answerPanel.classList.contains('show')) {
                // Lazy inject: only add answer HTML to DOM when first revealed
                if (!item.dataset.answerLoaded) {
                    const key = item.dataset.answerKey;
                    const answerHtml = answerStore.get(key) || '<em>উত্তর পাওয়া যায়নি।</em>';
                    answerContentEl.innerHTML = answerHtml;
                    item.dataset.answerLoaded = '1';
                    // Re-render any LaTeX inside this answer
                    if (window.renderMathInElement) {
                        renderMathInElement(answerContentEl, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\(', right: '\\)', display: false},
                                {left: '\\[', right: '\\]', display: true}
                            ],
                            throwOnError: false
                        });
                    }
                }
                icon.className = 'fa-solid fa-chevron-up';
                // Compute height after content is injected
                const inner = answerPanel.querySelector('.cq-answer-inner');
                answerPanel.style.maxHeight = inner.scrollHeight + 'px';
                answerPanel.style.opacity = '1';
            } else {
                icon.className = 'fa-solid fa-chevron-down';
                answerPanel.style.maxHeight = '0px';
                answerPanel.style.opacity = '0';
            }
        });
    });

    // Build Premium Glassmorphic Pagination Controls
    if (totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'cq-pagination-wrapper glass-panel';

        let pagesHtml = '';
        pagesHtml += `
            <button class="page-nav-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        `;

        let lastWasDots = false;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pagesHtml += `
                    <button class="page-num-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
                lastWasDots = false;
            } else {
                if (!lastWasDots) {
                    pagesHtml += `<span class="page-dots">...</span>`;
                    lastWasDots = true;
                }
            }
        }

        pagesHtml += `
            <button class="page-nav-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        paginationDiv.innerHTML = `
            <div class="pagination-info">Showing ${startIndex + 1}-${endIndex} of ${totalCQs} Creative Questions</div>
            <div class="pagination-buttons">${pagesHtml}</div>
        `;

        container.appendChild(paginationDiv);

        // Bind Pagination Clicks
        const prevBtn = paginationDiv.querySelector('.prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderCQs();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        const nextBtn = paginationDiv.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderCQs();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        paginationDiv.querySelectorAll('.page-num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const p = parseInt(e.currentTarget.getAttribute('data-page'));
                if (p !== currentPage) {
                    currentPage = p;
                    renderCQs();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    // Only render LaTeX on question stems (not answers — they render lazily on reveal)
    if (window.renderMathInElement) {
        container.querySelectorAll('.cq-stem-content, .cq-sub-text').forEach(el => {
            renderMathInElement(el, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        });
    }
}
