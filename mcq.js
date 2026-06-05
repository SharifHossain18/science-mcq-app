let allData = [];

// Load selection parameters from localStorage
let state = {
    mode: localStorage.getItem('practiceMode') || 'chapter',
    subject: localStorage.getItem('selectedSubject') || null,
    year: localStorage.getItem('selectedYear') || null,
    board: localStorage.getItem('selectedBoard') || null,
    chapter: localStorage.getItem('selectedChapter') || null,
    chapterId: localStorage.getItem('selectedChapterId') || null,
    showAnswers: false // Checked ON/OFF status of global toggle
};

// Tracks user clicks during interactive quiz play
let userProgress = {};

document.addEventListener('DOMContentLoaded', () => {
    // Check if configuration parameters are present
    if (!state.subject || (state.mode === 'chapter' && !state.chapter) || (state.mode === 'board' && (!state.year || !state.board))) {
        // Missing parameters, redirect back to selection flow
        window.location.href = state.subject ? 'subject.html' : 'index.html';
        return;
    }

    // Set active sidebar item highlights
    updateSidebarActiveItem();

    // Render breadcrumbs pathway
    renderBreadcrumbs();

    // Set up dynamic loading path for the small targeted question file
    let fetchPromise;
    const cleanSubject = state.subject.replace(/\s+/g, '_');

    if (state.mode === 'board') {
        const cleanBoard = state.board.replace(/\s+/g, '_');
        const dataUrl = `data/boards/${cleanSubject}_${state.year}_${cleanBoard}.json?t=` + new Date().getTime();
        fetchPromise = fetch(dataUrl);
    } else {
        if (state.chapterId) {
            const dataUrl = `data/chapters/${cleanSubject}_${state.chapterId}.json?t=` + new Date().getTime();
            fetchPromise = fetch(dataUrl);
        } else {
            // Resolve chapterId dynamically from metadata if not present in storage
            fetchPromise = fetch('data/meta.json?t=' + new Date().getTime())
                .then(res => {
                    if (!res.ok) throw new Error("Metadata request failed");
                    return res.json();
                })
                .then(meta => {
                    const subjectMeta = meta[state.subject];
                    const chapterObj = subjectMeta ? subjectMeta.chapters.find(c => c.name === state.chapter) : null;
                    if (!chapterObj) throw new Error("Chapter not found in metadata");
                    state.chapterId = chapterObj.id;
                    localStorage.setItem('selectedChapterId', chapterObj.id);
                    return fetch(`data/chapters/${cleanSubject}_${state.chapterId}.json?t=` + new Date().getTime());
                });
        }
    }

    fetchPromise
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            allData = data;
            renderMCQs();
        })
        .catch(err => {
            console.error("Error loading questions database:", err);
            const container = document.getElementById('mcq-container');
            container.innerHTML = `<div class="loading-state"><p>Error loading database: ${err.message}</p></div>`;
        });

    // Back Button click
    document.getElementById('back-btn').addEventListener('click', () => {
        if (state.mode === 'board') {
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

    document.getElementById('side-chapter').addEventListener('click', (e) => {
        e.preventDefault();
        handleSidebarNavigation('chapter');
    });

    document.getElementById('side-board').addEventListener('click', (e) => {
        e.preventDefault();
        handleSidebarNavigation('board');
    });

    const sideCq = document.getElementById('side-cq');
    if (sideCq) {
        sideCq.addEventListener('click', (e) => {
            e.preventDefault();
            handleSidebarNavigation('cq', 'chapter');
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

    // Close mobile drawer when clicking main workspace pane
    document.querySelector('.main-workspace').addEventListener('click', (e) => {
        if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Show Answer Toggle checkbox change
    const showAnswerSwitch = document.getElementById('show-answer-switch');
    showAnswerSwitch.addEventListener('change', (e) => {
        state.showAnswers = e.target.checked;
        applyShowAnswersToggle();
    });
});

function clearSelections() {
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedChapterId');
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedBoard');
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

    // Subject link
    addBreadcrumb(state.subject, () => {
        localStorage.removeItem('selectedChapter');
        localStorage.removeItem('selectedChapterId');
        localStorage.removeItem('selectedYear');
        localStorage.removeItem('selectedBoard');
        window.location.href = 'subject.html';
    });

    if (state.mode === 'board') {
        // Board select link
        addBreadcrumb('বোর্ড প্রশ্ন', () => {
            window.location.href = 'board-select.html';
        });
    }

    addBreadcrumb('MCQ', null, true);
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

// Load and render MCQs list
function renderMCQs() {
    const container = document.getElementById('mcq-container');
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading Questions...</p>
        </div>
    `;

    userProgress = {};

    // Filter MCQ list based on local state configuration settings
    let filteredData = allData.filter(q => q.subject === state.subject);

    if (state.mode === 'chapter') {
        filteredData = filteredData.filter(q => q.chapter === state.chapter);
    } else {
        filteredData = filteredData.filter(q => String(q.year) === state.year && q.board === state.board);
    }

    if (filteredData.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fa-regular fa-face-frown" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                <p>No questions found for this board and year.</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">This board might have had zero questions or was missing in the E-Test database for this year.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    const letters = ['a', 'b', 'c', 'd'];

    // Update MCQ Title at the list top header
    const mcqTitleEl = document.getElementById('mcq-view-title');
    if (state.mode === 'chapter') {
        mcqTitleEl.textContent = state.chapter;
    } else {
        mcqTitleEl.textContent = `${state.board} Board - ${state.year}`;
    }

    const fragment = document.createDocumentFragment();

    filteredData.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'mcq-card';
        card.setAttribute('data-q-idx', idx);

        let questionHtml = normalizeQuestionHtml(q.question);

        let optionsHtml = '';
        q.options.forEach((opt, idxOpt) => {
            optionsHtml += `
                <button class="option-btn" data-opt-idx="${idxOpt}" data-answer="${opt === q.answer ? 'correct' : 'incorrect'}">
                    <span class="option-letter">${letters[idxOpt]}</span>
                    <span class="option-text">${opt}</span>
                </button>
            `;
        });

        card.innerHTML = `
            <div class="mcq-question-wrapper">
                <div class="q-number-badge">${idx + 1}</div>
                <div class="q-text-content">${questionHtml}</div>
            </div>
            <div class="mcq-meta-row">
                <div class="mcq-meta-left">${q.chapter || 'General'}</div>
                <div class="mcq-meta-right">
                    <span style="margin-right: 12px; font-weight: 600; color: var(--primary-blue);">${q.board} ${q.year}</span>
                    <i class="fa-regular fa-flag" title="Report"></i>
                    <i class="fa-regular fa-heart" title="Favorite"></i>
                </div>
            </div>
            <div class="mcq-options">
                ${optionsHtml}
            </div>
            <div class="explanation">
                <div class="explanation-title">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>ব্যাখ্যা (Explanation)</span>
                </div>
                <div>${q.explanation || 'এই প্রশ্নের কোনো ব্যাখ্যা নেই।'}</div>
            </div>
        `;
        
        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    // Bind option buttons click listeners
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionClick);
    });

    // Apply global showAnswers toggle state initially
    applyShowAnswersToggle();

    // Trigger KaTeX LaTeX rendering
    if (window.renderMathInElement) {
        renderMathInElement(container, {
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

// Option button click handler
function handleOptionClick(e) {
    const clickedBtn = e.currentTarget;
    const card = clickedBtn.closest('.mcq-card');
    const qIdx = card.getAttribute('data-q-idx');
    const allBtns = card.querySelectorAll('.option-btn');
    const explanation = card.querySelector('.explanation');

    // Ignore clicks if globally showing answers or already clicked
    if (state.showAnswers || card.classList.contains('answered')) return;

    card.classList.add('answered');

    const isCorrect = clickedBtn.getAttribute('data-answer') === 'correct';
    const selectedIdx = clickedBtn.getAttribute('data-opt-idx');

    // Save choice in local session tracker
    userProgress[qIdx] = {
        answered: true,
        correct: isCorrect,
        selectedIdx: parseInt(selectedIdx)
    };

    if (isCorrect) {
        clickedBtn.classList.add('correct');
    } else {
        clickedBtn.classList.add('incorrect');
        // Auto reveal correct option in green
        allBtns.forEach(btn => {
            if (btn.getAttribute('data-answer') === 'correct') {
                btn.classList.add('correct');
            }
        });
    }

    explanation.classList.add('show');
}

// Handles switching Show Answer switch toggle checked ON/OFF states
function applyShowAnswersToggle() {
    const cards = document.querySelectorAll('.mcq-card');
    cards.forEach(card => {
        const qIdx = card.getAttribute('data-q-idx');
        const allBtns = card.querySelectorAll('.option-btn');
        const explanation = card.querySelector('.explanation');

        if (state.showAnswers) {
            // Checked ON: Highlight correct options yellow, display explanation blocks immediately, disable interaction
            card.classList.add('answered');
            explanation.classList.add('show');
            
            allBtns.forEach(btn => {
                btn.classList.remove('correct', 'incorrect');
                if (btn.getAttribute('data-answer') === 'correct') {
                    btn.classList.add('show-correct');
                } else {
                    btn.classList.remove('show-correct');
                }
            });
        } else {
            // Checked OFF: Restore interactive state
            
            const progress = userProgress[qIdx];
            if (progress && progress.answered) {
                // If question was clicked previously by user, restore correct/incorrect feedback colors
                card.classList.add('answered');
                explanation.classList.add('show');
                
                allBtns.forEach(btn => {
                    btn.classList.remove('show-correct');
                    const btnOptIdx = parseInt(btn.getAttribute('data-opt-idx'));
                    
                    if (btn.getAttribute('data-answer') === 'correct') {
                        btn.classList.add('correct');
                    } else if (btnOptIdx === progress.selectedIdx) {
                        btn.classList.add('incorrect');
                    } else {
                        btn.classList.remove('correct', 'incorrect');
                    }
                });
            } else {
                // Otherwise, reset card back to unanswered clean visual state
                card.classList.remove('answered');
                explanation.classList.remove('show');
                
                allBtns.forEach(btn => {
                    btn.classList.remove('correct', 'incorrect', 'show-correct');
                });
            }
        }
    });
}
