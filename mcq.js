let allData = [];
let state = {
    mode: localStorage.getItem('practiceMode') || 'chapter',
    subject: localStorage.getItem('selectedSubject') || null,
    year: localStorage.getItem('selectedYear') || null,
    board: localStorage.getItem('selectedBoard') || null,
    chapter: localStorage.getItem('selectedChapter') || null,
    chapterId: localStorage.getItem('selectedChapterId') || null,
    showAnswers: false
};
let userProgress = {};
let timerInterval = null;
let secondsElapsed = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (!state.subject || (state.mode === 'chapter' && !state.chapter) || (state.mode === 'board' && (!state.year || !state.board))) {
        window.location.href = state.subject ? 'subject.html' : 'index.html';
        return;
    }
    UTILS.updateSidebarActive(state.mode);
    renderBreadcrumbs();
    showSkeletons();

    let fetchPromise;
    const cleanSubject = state.subject.replace(/\s+/g, '_');
    if (state.mode === 'board') {
        const cleanBoard = state.board.replace(/\s+/g, '_');
        fetchPromise = fetch(`data/boards/${cleanSubject}_${state.year}_${cleanBoard}.json?t=` + Date.now());
    } else {
        if (state.chapterId) {
            fetchPromise = fetch(`data/chapters/${cleanSubject}_${state.chapterId}.json?t=` + Date.now());
        } else {
            fetchPromise = fetch('data/meta.json?t=' + Date.now())
                .then(res => { if (!res.ok) throw new Error('মেটাডাটা লোড ব্যর্থ'); return res.json(); })
                .then(meta => {
                    const subjectMeta = meta[state.subject];
                    const chapterObj = subjectMeta ? subjectMeta.chapters.find(c => c.name === state.chapter) : null;
                    if (!chapterObj) throw new Error('অধ্যায় পাওয়া যায়নি');
                    state.chapterId = chapterObj.id;
                    localStorage.setItem('selectedChapterId', chapterObj.id);
                    return fetch(`data/chapters/${cleanSubject}_${state.chapterId}.json?t=` + Date.now());
                });
        }
    }

    fetchPromise
        .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
        .then(data => { allData = data; renderMCQs(); })
        .catch(err => {
            console.error('Error:', err);
            const container = document.getElementById('mcq-container');
            container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-circle-exclamation" style="font-size:2.5rem;color:#ef4444;margin-bottom:15px;"></i><p style="font-weight:600;">দুঃখিত! প্রশ্ন লোড করতে ব্যর্থ।</p><p style="font-size:0.85rem;color:var(--text-muted);margin-top:5px;">${err.message} — ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।</p></div>`;
        });

    document.getElementById('back-btn').addEventListener('click', () => {
        stopTimer();
        if (state.mode === 'board') window.location.href = 'board-select.html';
        else { localStorage.removeItem('selectedChapter'); localStorage.removeItem('selectedChapterId'); window.location.href = 'subject.html'; }
    });

    UTILS.initMobileMenu();

    const showAnswerSwitch = document.getElementById('show-answer-switch');
    showAnswerSwitch.addEventListener('change', (e) => { state.showAnswers = e.target.checked; applyShowAnswersToggle(); });

    document.getElementById('pdf-btn').addEventListener('click', generatePDF);

    if (localStorage.getItem('autoGeneratePDF') === 'true') {
        localStorage.removeItem('autoGeneratePDF');
        setTimeout(() => generatePDF(), 800);
    }
});

function showSkeletons() {
    const container = document.getElementById('mcq-container');
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += `<div class="skeleton-card"><div class="skeleton-line wide"></div><div class="skeleton-line medium"></div><div class="skeleton-line narrow"></div><div class="skeleton-option"></div><div class="skeleton-option"></div><div class="skeleton-option"></div><div class="skeleton-option"></div></div>`;
    }
    container.innerHTML = html;
}

function renderBreadcrumbs() {
    const items = [
        { label: 'Home', onClick: () => window.location.href = 'index.html' },
        { label: state.subject, onClick: () => { localStorage.removeItem('selectedChapter'); localStorage.removeItem('selectedChapterId'); localStorage.removeItem('selectedYear'); localStorage.removeItem('selectedBoard'); window.location.href = 'subject.html'; } }
    ];
    if (state.mode === 'board') items.push({ label: 'বোর্ড প্রশ্ন', onClick: () => window.location.href = 'board-select.html' });
    items.push({ label: 'MCQ', active: true });
    UTILS.renderBreadcrumbs(items);
}

function normalizeQuestionHtml(rawHtml) {
    const source = String(rawHtml || '').trim();
    if (!source) return '<p></p>';
    const holder = document.createElement('div');
    holder.innerHTML = source;
    holder.querySelectorAll('p').forEach(p => {
        while (p.firstChild && p.firstChild.nodeType === Node.ELEMENT_NODE && p.firstChild.tagName === 'BR') p.firstChild.remove();
        if (!p.textContent.trim() && !p.querySelector('img')) p.remove();
    });
    holder.querySelectorAll('span[style]').forEach(span => span.removeAttribute('style'));
    const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || parent.closest('.katex, script, style')) return NodeFilter.FILTER_REJECT;
            return /(?:\d+(?:\.\d+)?)\s*[x×]\s*10\s*[+-]?\d+/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const pattern = /(\d+(?:\.\d+)?)\s*([x×])\s*10\s*([+-]?\d+)/g;
        let lastIndex = 0, match;
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

function renderMCQs() {
    let filteredData = allData.filter(q => q.subject === state.subject);
    if (state.mode === 'chapter') filteredData = filteredData.filter(q => q.chapter === state.chapter);
    else filteredData = filteredData.filter(q => String(q.year) === state.year && q.board === state.board);

    const container = document.getElementById('mcq-container');
    const mcqTitleEl = document.getElementById('mcq-view-title');
    if (state.mode === 'chapter') mcqTitleEl.textContent = state.chapter;
    else mcqTitleEl.textContent = `${state.board} Board - ${state.year}`;

    if (filteredData.length === 0) {
        container.innerHTML = `<div class="loading-state"><i class="fa-regular fa-face-frown" style="font-size:2.5rem;color:var(--text-muted);margin-bottom:15px;"></i><p>কোনো প্রশ্ন পাওয়া যায়নি।</p></div>`;
        return;
    }

    userProgress = {};
    secondsElapsed = 0;
    startTimer();

    const totalQ = filteredData.length;
    const letters = ['a', 'b', 'c', 'd'];

    container.innerHTML = `
        <div class="score-card" id="score-card" style="display:none;">
            <div class="score-value" id="score-value">0/${totalQ}</div>
            <div class="score-label">সঠিক উত্তর</div>
            <div class="score-detail" id="score-detail"></div>
        </div>
        <div class="quiz-timer" id="quiz-timer"><i class="fa-solid fa-clock"></i> <span id="timer-display">00:00</span></div>
        <input class="quiz-search" id="quiz-search" type="text" placeholder="🔍 প্রশ্ন সার্চ করুন..." autocomplete="off">
        <div id="mcq-list" class="mcq-list"></div>
    `;

    const listEl = document.getElementById('mcq-list');
    const searchInput = document.getElementById('quiz-search');

    function renderQuestions(filter) {
        listEl.innerHTML = '';
        const filtered = filter ? filteredData.filter((q, i) => {
            const searchStr = (q.question + ' ' + q.options.join(' ') + ' ' + (q.explanation || '')).toLowerCase();
            return searchStr.includes(filter.toLowerCase());
        }) : filteredData;

        if (filtered.length === 0) {
            listEl.innerHTML = `<div class="loading-state"><p>সার্চে কোনো প্রশ্ন পাওয়া যায়নি।</p></div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        filtered.forEach((q, idx) => {
            const card = document.createElement('div');
            card.className = 'mcq-card';
            const realIdx = filteredData.indexOf(q);
            card.setAttribute('data-q-idx', realIdx);

            let questionHtml = normalizeQuestionHtml(q.question);
            let optionsHtml = '';
            q.options.forEach((opt, optIdx) => {
                optionsHtml += `<button class="option-btn" data-opt-idx="${optIdx}" data-answer="${opt === q.answer ? 'correct' : 'incorrect'}"><span class="option-letter">${letters[optIdx]}</span><span class="option-text">${opt}</span></button>`;
            });

            card.innerHTML = `
                <div class="mcq-question-wrapper"><div class="q-number-badge">${realIdx + 1}</div><div class="q-text-content">${questionHtml}</div></div>
                <div class="mcq-meta-row"><div class="mcq-meta-left">${q.chapter || 'General'}</div><div class="mcq-meta-right"><span style="margin-right:12px;font-weight:600;color:var(--primary-blue);">${q.board} ${q.year}</span><i class="fa-regular fa-flag" title="Report"></i><i class="fa-regular fa-heart" title="Favorite"></i></div></div>
                <div class="mcq-options">${optionsHtml}</div>
                <div class="explanation"><div class="explanation-title"><i class="fa-solid fa-circle-info"></i><span>ব্যাখ্যা (Explanation)</span></div><div>${q.explanation || 'এই প্রশ্নের কোনো ব্যাখ্যা নেই।'}</div></div>
            `;
            fragment.appendChild(card);
        });
        listEl.appendChild(fragment);

        listEl.querySelectorAll('.option-btn').forEach(btn => btn.addEventListener('click', handleOptionClick));
        applyShowAnswersToggle();

        if (window.renderMathInElement) {
            renderMathInElement(container, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}], throwOnError: false });
        }
    }

    renderQuestions('');
    searchInput.addEventListener('input', (e) => renderQuestions(e.target.value));
}

function handleOptionClick(e) {
    const clickedBtn = e.currentTarget;
    const card = clickedBtn.closest('.mcq-card');
    const qIdx = card.getAttribute('data-q-idx');
    const allBtns = card.querySelectorAll('.option-btn');
    const explanation = card.querySelector('.explanation');

    if (state.showAnswers || card.classList.contains('answered')) return;
    card.classList.add('answered');

    const isCorrect = clickedBtn.getAttribute('data-answer') === 'correct';
    const selectedIdx = parseInt(clickedBtn.getAttribute('data-opt-idx'));

    userProgress[qIdx] = { answered: true, correct: isCorrect, selectedIdx };

    if (isCorrect) clickedBtn.classList.add('correct');
    else {
        clickedBtn.classList.add('incorrect');
        allBtns.forEach(btn => { if (btn.getAttribute('data-answer') === 'correct') btn.classList.add('correct'); });
    }
    explanation.classList.add('show');
    updateScoreCard();
}

function updateScoreCard() {
    const total = allData.filter(q => q.subject === state.subject).length;
    const answered = Object.values(userProgress).filter(p => p.answered).length;
    const correct = Object.values(userProgress).filter(p => p.correct).length;
    const scoreCard = document.getElementById('score-card');
    const scoreValue = document.getElementById('score-value');
    const scoreDetail = document.getElementById('score-detail');
    if (scoreCard && scoreValue) {
        scoreCard.style.display = 'block';
        scoreValue.textContent = `${correct}/${total}`;
        if (scoreDetail) scoreDetail.textContent = `উত্তর দিয়েছেন ${answered}টি, বাকি ${total - answered}টি`;
        if (answered === total) {
            const pct = Math.round((correct / total) * 100);
            scoreDetail.textContent = `সম্পন্ন! ${correct}/${total} (${pct}%)`;
            stopTimer();
        }
    }
}

function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
    const el = document.getElementById('timer-display');
    if (!el) return;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');
    el.textContent = `${mins}:${secs}`;
    const timer = document.getElementById('quiz-timer');
    if (timer) {
        if (secondsElapsed > 600) timer.className = 'quiz-timer danger';
        else if (secondsElapsed > 300) timer.className = 'quiz-timer warning';
        else timer.className = 'quiz-timer';
    }
}

function generatePDF() {
    const btn = document.getElementById('pdf-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> প্রস্তুত...';

    const title = document.getElementById('mcq-view-title')?.textContent || 'MCQ Questions';
    const cards = document.querySelectorAll('.mcq-card');
    if (!cards.length) { UTILS.showToast('কোনো প্রশ্ন নেই!', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF'; return; }

    const printWrapper = document.createElement('div');
    printWrapper.style.cssText = 'padding:20px;font-family:Outfit,sans-serif;background:#fff;';
    printWrapper.innerHTML = `<h2 style="text-align:center;margin-bottom:20px;color:#1e3a8a;">${title}</h2><hr style="margin-bottom:20px;border-color:#ddd;">`;

    const letters = ['a', 'b', 'c', 'd'];
    cards.forEach((card, i) => {
        const qNum = card.querySelector('.q-number-badge')?.textContent || (i + 1);
        const qText = card.querySelector('.q-text-content')?.innerHTML || '';
        const options = card.querySelectorAll('.option-btn');

        let html = `<div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #eee;page-break-inside:avoid;">
            <div style="font-weight:700;margin-bottom:8px;color:#333;">${qNum}. ${qText}</div>
            <div style="padding-left:24px;">`;

        options.forEach((opt, oi) => {
            const optText = opt.querySelector('.option-text')?.textContent || '';
            const isCorrect = opt.getAttribute('data-answer') === 'correct';
            html += `<div style="padding:6px 10px;margin:4px 0;border:1px solid #ddd;border-radius:6px;${isCorrect ? 'background:#f0fdf4;border-color:#86efac;' : ''}">
                <span style="font-weight:700;">${letters[oi]}.</span> ${optText}
                ${isCorrect ? '<span style="float:right;color:#16a34a;font-size:0.8rem;">✓ উত্তর</span>' : ''}
            </div>`;
        });

        const explanation = card.querySelector('.explanation div:last-child')?.innerHTML || '';
        if (explanation) html += `<div style="margin-top:8px;padding:10px;background:#eff6ff;border-radius:8px;font-size:0.9rem;color:#1e3a8a;"><strong>ব্যাখ্যা:</strong> ${explanation}</div>`;

        html += `</div></div>`;
        printWrapper.innerHTML += html;
    });

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printWrapper).save().then(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF';
    }).catch(() => {
        UTILS.showToast('PDF জেনারেট করতে ব্যর্থ!', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF';
    });
}

function applyShowAnswersToggle() {
    const cards = document.querySelectorAll('.mcq-card');
    cards.forEach(card => {
        const qIdx = card.getAttribute('data-q-idx');
        const allBtns = card.querySelectorAll('.option-btn');
        const explanation = card.querySelector('.explanation');

        if (state.showAnswers) {
            card.classList.add('answered');
            explanation.classList.add('show');
            allBtns.forEach(btn => {
                btn.classList.remove('correct', 'incorrect');
                if (btn.getAttribute('data-answer') === 'correct') btn.classList.add('show-correct');
                else btn.classList.remove('show-correct');
            });
        } else {
            const progress = userProgress[qIdx];
            if (progress && progress.answered) {
                card.classList.add('answered');
                explanation.classList.add('show');
                allBtns.forEach(btn => {
                    btn.classList.remove('show-correct');
                    const btnOptIdx = parseInt(btn.getAttribute('data-opt-idx'));
                    if (btn.getAttribute('data-answer') === 'correct') btn.classList.add('correct');
                    else if (btnOptIdx === progress.selectedIdx) btn.classList.add('incorrect');
                    else btn.classList.remove('correct', 'incorrect');
                });
            } else {
                card.classList.remove('answered');
                explanation.classList.remove('show');
                allBtns.forEach(btn => btn.classList.remove('correct', 'incorrect', 'show-correct'));
            }
        }
    });
}
