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
        window.location.href = state.subject ? 'subject.html' : 'index.html';
        return;
    }

    UTILS.updateSidebarActive('cq');

    renderBreadcrumbs();

    const container = document.getElementById('cq-container');
    showSkeletons();

    const cleanSubject = state.subject.replace(/\s+/g, '_');
    const label = document.getElementById('loading-filename');
    const loadingLabel = document.getElementById('loading-label');

    async function resolveCqUrl() {
        let cqUrl = '';
        if (state.cqSubMode === 'board') {
            loadingLabel.textContent = 'মেটাডাটা লোড হচ্ছে...';
            const metaRes = await fetch('data/meta.json');
            if (!metaRes.ok) throw new Error("Metadata request failed");
            metaData = await metaRes.json();
            const subjectMeta = metaData[state.subject];
            if (!subjectMeta || !subjectMeta.boards || !subjectMeta.boards[state.year]) {
                throw new Error("Subject/Year not found in metadata");
            }
            const yearBoards = subjectMeta.boards[state.year];
            const boardIndex = yearBoards.indexOf(state.board);
            if (boardIndex === -1) {
                throw new Error(`Board ${state.board} not found in metadata for year ${state.year}`);
            }
            state.boardId = state.board === 'Combined' ? 'Combined' : String(boardIndex + 1);
            cqUrl = `data/cq/boards/${cleanSubject}_${state.year}_${state.boardId}.json`;
        } else {
            if (state.chapterId) {
                cqUrl = `data/cq/chapters/${cleanSubject}_${state.chapterId}.json`;
            } else {
                loadingLabel.textContent = 'মেটাডাটা লোড হচ্ছে...';
                const metaRes = await fetch('data/meta.json');
                if (!metaRes.ok) throw new Error("Metadata request failed");
                metaData = await metaRes.json();
                const subjectMeta = metaData[state.subject];
                const normChapterName = (state.chapter || 'General').replace(/\s+/g, ' ').trim().toLowerCase();
                const chapterObj = subjectMeta ? subjectMeta.chapters.find(c => c.name.replace(/\s+/g, ' ').trim().toLowerCase() === normChapterName) : null;
                if (!chapterObj) throw new Error("Chapter not found in metadata");
                state.chapterId = chapterObj.id;
                localStorage.setItem('selectedChapterId', chapterObj.id);
                cqUrl = `data/cq/chapters/${cleanSubject}_${state.chapterId}.json`;
            }
        }
        return cqUrl;
    }

    function getDlKey(cqUrl) {
        const parts = cqUrl.replace(/^data\//, '').replace(/\.json$/, '').replace(/\//g, '_');
        return `cq_${parts}`;
    }

    async function loadCqData() {
        try {
            let cqUrl = await resolveCqUrl();
            const dlKey = getDlKey(cqUrl);

            if (label) label.textContent = cqUrl.split('/').pop();
            loadingLabel.textContent = 'ডাউনলোড হচ্ছে...';

            let resp;
            try {
                resp = await fetch(cqUrl);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
            } catch (e) {
                const cached = await caches.open('lumen-data-v6').then(c => c.match(cqUrl));
                if (cached) {
                    resp = cached;
                } else if (!navigator.onLine) {
                    container.innerHTML = `
                        <div class="loading-state">
                            <i class="fa-solid fa-wifi-slash" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:15px;"></i>
                            <p style="font-weight:600;">আপনি অফলাইনে আছেন</p>
                            <p style="font-size:0.85rem;color:var(--text-muted);margin-top:5px;">এই অধ্যায়ের CQ অফলাইনে পড়ার জন্য আগে ডাউনলোড করুন।</p>
                            <button class="gen-btn gen-btn-primary" style="margin-top:16px;" id="offline-cq-dl-btn">
                                <i class="fa-solid fa-circle-down"></i> এখনই ডাউনলোড করুন
                            </button>
                        </div>`;
                    document.getElementById('offline-cq-dl-btn').addEventListener('click', async () => {
                        const btn = document.getElementById('offline-cq-dl-btn');
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ডাউনলোড হচ্ছে...';
                        btn.disabled = true;
                        const ok = await UTILS.downloadAndCache(cqUrl);
                        if (ok) {
                            UTILS.markItemDownloaded(dlKey);
                            UTILS.showToast('ডাউনলোড সম্পন্ন! আবার চেষ্টা করুন।', 'success');
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            btn.innerHTML = '<i class="fa-solid fa-circle-down"></i> এখনই ডাউনলোড করুন';
                            btn.disabled = false;
                            UTILS.showToast('ডাউনলোড ব্যর্থ!', 'error');
                        }
                    });
                    return;
                }
                throw e;
            }

            allCQs = await resp.json();

            loadingLabel.textContent = 'রেন্ডার হচ্ছে...';
            document.getElementById('loading-progress-wrapper').style.display = 'none';
            container.innerHTML = '';
            renderCQs();
        } catch (err) {
            console.error("Error:", err);
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 15px;"></i>
                    <p style="font-weight:600;">দুঃখিত! প্রশ্ন লোড করতে ব্যর্থ।</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।</p>
                </div>
            `;
        }
    }

    loadCqData();

    // Back Button click
    document.getElementById('back-btn').addEventListener('click', () => {
        if (state.cqSubMode === 'board') {
            window.location.href = 'board-select.html';
        } else {
            localStorage.removeItem('selectedChapter');
            localStorage.removeItem('selectedChapterId');
            window.location.href = 'subject.html';
        }
    });

    // Sidebar navigation mode links
    const handleSidebarNavigation = (targetMode, cqSubMode) => {
        if (!state.subject) {
            window.location.href = 'index.html';
            return;
        }
        localStorage.setItem('selectedSubject', state.subject);
        localStorage.removeItem('selectedChapter');
        localStorage.removeItem('selectedChapterId');
        localStorage.removeItem('selectedYear');
        localStorage.removeItem('selectedBoard');
        
        if (targetMode === 'cq') {
            localStorage.setItem('practiceMode', 'cq');
            localStorage.setItem('cqSubMode', cqSubMode || 'chapter');
            localStorage.setItem('boardSelectMode', 'cq');
            if (cqSubMode === 'board') {
                window.location.href = 'board-select.html';
            } else {
                window.location.href = 'subject.html';
            }
        } else {
            localStorage.setItem('practiceMode', targetMode);
            localStorage.setItem('boardSelectMode', 'mcq');
            if (targetMode === 'board') {
                window.location.href = 'board-select.html';
            } else {
                window.location.href = 'subject.html';
            }
        }
    };

    const sideChapter = document.getElementById('side-chapter');
    if (sideChapter) {
        sideChapter.addEventListener('click', (e) => {
            e.preventDefault();
            handleSidebarNavigation('chapter');
        });
    }

    const sideBoard = document.getElementById('side-board');
    if (sideBoard) {
        sideBoard.addEventListener('click', (e) => {
            e.preventDefault();
            handleSidebarNavigation('board');
        });
    }

    const sideCq = document.getElementById('side-cq');
    if (sideCq) {
        sideCq.addEventListener('click', (e) => {
            e.preventDefault();
            handleSidebarNavigation('cq', 'chapter');
        });
    }

    UTILS.initMobileMenu();
    UTILS.initSwipeGestures();

    // Set active bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(a => {
      if (a.getAttribute('href') === 'subject.html?mode=cq') a.classList.add('active');
    });
});

function renderBreadcrumbs() {
    const items = [
        { label: 'Home', onClick: () => window.location.href = 'index.html' },
        { label: state.subject, onClick: () => { localStorage.removeItem('selectedChapter'); localStorage.removeItem('selectedChapterId'); localStorage.removeItem('selectedYear'); localStorage.removeItem('selectedBoard'); window.location.href = 'subject.html'; } }
    ];
    if (state.cqSubMode === 'board') items.push({ label: 'বোর্ড প্রশ্ন', onClick: () => window.location.href = 'board-select.html' });
    items.push({ label: 'CQ', active: true });
    UTILS.renderBreadcrumbs(items);
}

function showSkeletons() {
    const container = document.getElementById('cq-container');
    container.innerHTML = `
        <div id="cq-loading-overlay" class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-label" id="loading-label">প্রস্তুতি নিচ্ছে...</div>
            <div class="loading-progress-wrapper" id="loading-progress-wrapper" style="display:none;">
                <div class="loading-progress-bar" id="loading-progress-bar"></div>
            </div>
            <div class="loading-filename" id="loading-filename"></div>
        </div>
    `;
}

function updateLoadingProgress(current, total) {
    const bar = document.getElementById('loading-progress-bar');
    const wrapper = document.getElementById('loading-progress-wrapper');
    const label = document.getElementById('loading-label');
    if (!bar || !wrapper || !label) return;
    wrapper.style.display = 'block';
    const pct = Math.min(100, Math.round((current / total) * 100));
    bar.style.width = pct + '%';
    const loadedMb = (current / (1024 * 1024)).toFixed(1);
    const totalMb = (total / (1024 * 1024)).toFixed(1);
    label.textContent = `ডাউনলোড হচ্ছে... ${loadedMb}MB / ${totalMb}MB (${pct}%)`;
}

function normalizeQuestionHtml(rawHtml) {
    const source = String(rawHtml || '').trim();
    if (!source) return '<p></p>';

    const holder = document.createElement('div');
    holder.innerHTML = source;

    if (!holder.children.length) {
        const p = document.createElement('p');
        p.textContent = source;
        holder.textContent = '';
        holder.appendChild(p);
    }

    holder.querySelectorAll('p').forEach(p => {
        while (p.firstChild && p.firstChild.nodeType === Node.ELEMENT_NODE && p.firstChild.tagName === 'BR') {
            p.firstChild.remove();
        }
        if (!p.textContent.trim() && !p.querySelector('img')) {
            p.remove();
        }
    });

    holder.querySelectorAll('span[style]').forEach(span => {
        span.removeAttribute('style');
    });

    const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || parent.closest('.katex, script, style')) {
                return NodeFilter.FILTER_REJECT;
            }
            return /(?:\d+(?:\.\d+)?)\s*[x×]\s*10\s*[+-]?\d+/.test(node.nodeValue)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const pattern = /(\d+(?:\.\d+)?)\s*([x×])\s*10\s*([+-]?\d+)/g;
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(node.nodeValue)) !== null) {
            fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex, match.index)));
            fragment.appendChild(document.createTextNode(`${match[1]} × 10`));
            const sup = document.createElement('sup');
            sup.textContent = match[3];
            fragment.appendChild(sup);
            lastIndex = pattern.lastIndex;
        }

        fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
    });

    if (!holder.children.length && holder.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = holder.textContent.trim();
        holder.textContent = '';
        holder.appendChild(p);
    }

    return holder.innerHTML;
}

// Filter and render Creative Questions
let searchFilter = '';

function renderCQs() {
    const container = document.getElementById('cq-container');
    const cqTitleEl = document.getElementById('cq-view-title');
    if (state.cqSubMode === 'chapter') cqTitleEl.textContent = state.chapter;
    else cqTitleEl.textContent = `${state.board} Board - ${state.year}`;

    let subjectMatch = state.subject;
    if (state.subject === 'Math 1st Paper') subjectMatch = 'Math 1st Paper';
    if (state.subject === 'Math 2nd Paper') subjectMatch = 'Math 2nd Paper';

    let filteredCQs = allCQs.filter(q => q.subject === subjectMatch);

    if (state.cqSubMode === 'chapter') {
        // File is already chapter-scoped; chapter field in CQ data is an ObjectId, not a name string
    } else {
        filteredCQs = filteredCQs.filter(q => String(q.year) === state.year && q.board === (state.boardId || state.board));
    }

    // Apply search filter
    if (searchFilter) {
        const q = searchFilter.toLowerCase();
        filteredCQs = filteredCQs.filter(cq => {
            const searchStr = (cq.context + ' ' + (cq.chapter || '') + ' ' + (cq.questions || []).map(sq => sq.question + ' ' + (sq.answer || '')).join(' ')).toLowerCase();
            return searchStr.includes(q);
        });
    }

    container.innerHTML = `<input class="quiz-search" id="cq-search" type="text" placeholder="🔍 সৃজনশীল প্রশ্ন সার্চ করুন..." value="${searchFilter}" autocomplete="off"><div id="cq-list"></div><div class="cq-pagination-wrapper" id="cq-pagination"></div>`;

    // Wire up search
    document.getElementById('cq-search').addEventListener('input', (e) => { searchFilter = e.target.value; currentPage = 1; renderCQs(); });

    const listEl = document.getElementById('cq-list');

    if (filteredCQs.length === 0) {
        listEl.innerHTML = `<div class="loading-state"><i class="fa-regular fa-face-frown" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:15px;"></i><p>${searchFilter ? 'সার্চে কোনো প্রশ্ন পাওয়া যায়নি।' : 'কোনো সৃজনশীল প্রশ্ন পাওয়া যায়নি।'}</p></div>`;
        return;
    }

    const totalCQs = filteredCQs.length;
    const totalPages = Math.ceil(totalCQs / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCQs);
    const pagedCQs = filteredCQs.slice(startIndex, endIndex);

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
            answerStore.set(answerKey, normalizeQuestionHtml(sub.answer || ''));
            
            subQuestionsHtml += `
                <div class="cq-subquestion-item" data-answer-key="${answerKey}">
                    <div class="cq-sub-header">
                        <div class="cq-sub-letter-badge">${letterLabel}</div>
                        <div class="cq-sub-text">${normalizeQuestionHtml(sub.question)}</div>
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

        const displayChapter = state.cqSubMode === 'chapter' ? state.chapter : (cq.chapter || 'General');
        const metaTagsHtml = `
            <span class="cq-meta-tag"><i class="fa-regular fa-folder-open"></i> ${displayChapter}</span>
            <span class="cq-meta-tag"><i class="fa-solid fa-building-columns"></i> ${displayBoard} ${cq.year}</span>
        `;

        card.innerHTML = `
            <div class="cq-question-wrapper">
                <div class="q-number-badge">${globalIdx + 1}</div>
                <div class="cq-stem-container">
                    <div class="cq-stem-title">উদ্দীপক (Context):</div>
                    <div class="cq-stem-content">${normalizeQuestionHtml(cq.context)}</div>
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

    listEl.appendChild(fragment);

    // Bind reveal button click handlers — inject answer HTML lazily on first open
    listEl.querySelectorAll('.cq-reveal-btn').forEach(btn => {
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
                    UTILS.recordAnswer(state.subject, state.chapter || state.board || 'General', true, 1);
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
    const paginationDiv = document.getElementById('cq-pagination');
    paginationDiv.innerHTML = '';
    if (totalPages > 1) {
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
        listEl.querySelectorAll('.cq-stem-content, .cq-sub-text').forEach(el => {
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
