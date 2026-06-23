const LABELS = ['ক', 'খ', 'গ', 'ঘ'];

let metaData = null;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let startTime = null;
let timerInterval = null;
let timeRemaining = 0;
let timeLimit = 0;
let isAnswering = false;
let selectedSubject = '';
let selectedChapters = [];

function clean(str) {
    return str.replace(/\s+/g, '_');
}

function shuffle(arr, n) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
}

function stripChapterPrefix(name) {
    const m = name.match(/^(?:Chapter\s*\d+)\s*:\s*(.+)$/i);
    return m ? m[1] : name;
}

const $setup = document.getElementById('exam-setup');
const $active = document.getElementById('exam-active');
const $result = document.getElementById('exam-result');
const $subject = document.getElementById('exam-subject');
const $chaptersContainer = document.getElementById('exam-chapters-container');
const $count = document.getElementById('exam-count');
const $time = document.getElementById('exam-time');
const $startBtn = document.getElementById('exam-start-btn');
const $setupStatus = document.getElementById('exam-setup-status');
const $timerDisplay = document.getElementById('exam-timer-display');
const $timerText = document.getElementById('exam-timer-text');
const $progressFill = document.getElementById('exam-progress-fill');
const $progressText = document.getElementById('exam-progress-text');
const $activeInfo = document.getElementById('exam-active-info');
const $questionArea = document.getElementById('exam-question-area');
const $finishBtn = document.getElementById('exam-finish-btn');
const $retryBtn = document.getElementById('exam-retry-btn');
const $homeBtn = document.getElementById('exam-home-btn');
const $resultScore = document.getElementById('exam-result-score');
const $resultLabel = document.getElementById('exam-result-label');
const $resultTime = document.getElementById('exam-result-time');
const $resultAccuracy = document.getElementById('exam-result-accuracy');
const $resultSpeed = document.getElementById('exam-result-speed');

async function loadMeta() {
    try {
        const res = await fetch('data/meta.json');
        metaData = await res.json();
        populateSubjects();
    } catch {
        showSetupStatus('error', 'মেটাডেটা লোড করতে ব্যর্থ!');
    }
}

function populateSubjects() {
    $subject.innerHTML = '<option value="">— বিষয় নির্বাচন করুন —</option>';
    Object.keys(metaData).forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        const meta = UTILS.SUBJECT_META[sub];
        opt.textContent = meta ? `${meta.bn} (${sub})` : sub;
        $subject.appendChild(opt);
    });
}

$subject.addEventListener('change', () => {
    selectedSubject = $subject.value;
    selectedChapters = [];
    renderChapterChips();
});

function getChaptersForSubject(subject) {
    return (metaData[subject]?.chapters || [])
        .filter(ch => ch && ch.id !== 'ch_1' && ch.name && ch.name.toLowerCase() !== 'general');
}

function renderChapterChips() {
    $chaptersContainer.innerHTML = '';
    if (!selectedSubject) {
        $chaptersContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">প্রথমে বিষয় নির্বাচন করুন</p>';
        return;
    }

    const chapters = getChaptersForSubject(selectedSubject);
    if (chapters.length === 0) {
        $chaptersContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">কোনো অধ্যায় পাওয়া যায়নি</p>';
        return;
    }

    const selectAll = document.createElement('button');
    selectAll.className = 'gen-select-all';
    selectAll.textContent = 'সবগুলি নির্বাচন করুন';
    selectAll.type = 'button';
    selectAll.addEventListener('click', () => {
        const allSelected = chapters.every(ch => selectedChapters.includes(ch.id));
        if (allSelected) {
            selectedChapters = [];
        } else {
            selectedChapters = chapters.map(ch => ch.id);
        }
        renderChapterChips();
    });
    $chaptersContainer.appendChild(selectAll);

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'gen-chips';

    chapters.forEach(ch => {
        const chip = document.createElement('span');
        chip.className = 'gen-chip' + (selectedChapters.includes(ch.id) ? ' selected' : '');
        chip.textContent = stripChapterPrefix(ch.name);
        chip.addEventListener('click', () => {
            const idx = selectedChapters.indexOf(ch.id);
            if (idx === -1) {
                selectedChapters.push(ch.id);
            } else {
                selectedChapters.splice(idx, 1);
            }
            renderChapterChips();
        });
        chipsWrap.appendChild(chip);
    });

    $chaptersContainer.appendChild(chipsWrap);
}

$startBtn.addEventListener('click', startExam);

async function startExam() {
    if (!selectedSubject) {
        showSetupStatus('error', 'বিষয় নির্বাচন করুন!');
        return;
    }
    if (selectedChapters.length === 0) {
        showSetupStatus('error', 'অন্তত একটি অধ্যায় নির্বাচন করুন!');
        return;
    }

    const count = parseInt($count.value) || 10;
    if (count < 1 || count > 50) {
        showSetupStatus('error', 'প্রশ্ন সংখ্যা ১ থেকে ৫০ এর মধ্যে দিন!');
        return;
    }

    timeLimit = parseInt($time.value) || 30;
    if (timeLimit < 1 || timeLimit > 180) {
        showSetupStatus('error', 'সময় ১ থেকে ১৮০ মিনিটের মধ্যে দিন!');
        return;
    }

    showSetupStatus('info', 'প্রশ্ন সংগ্রহ করা হচ্ছে...');

    try {
        const allQuestions = [];
        const cleanSub = clean(selectedSubject);

        const results = await Promise.allSettled(
            selectedChapters.map(chId =>
                fetch(`data/chapters/${cleanSub}_${chId}.json`).then(r => {
                    if (!r.ok) throw new Error('not found');
                    return r.json();
                })
            )
        );

        results.forEach(res => {
            if (res.status === 'fulfilled') {
                allQuestions.push(...res.value);
            }
        });

        if (allQuestions.length === 0) {
            showSetupStatus('error', 'কোনো MCQ প্রশ্ন পাওয়া যায়নি!');
            return;
        }

        if (count > allQuestions.length) {
            showSetupStatus('error', `শুধু ${allQuestions.length}টি MCQ পাওয়া গেছে। সংখ্যা কমিয়ে দিন।`);
            return;
        }

        questions = shuffle(allQuestions, count);
        currentIndex = 0;
        correctCount = 0;
        isAnswering = false;
        timeRemaining = timeLimit * 60;

        showSetupStatus('', '');
        enterActiveState();
    } catch {
        showSetupStatus('error', 'প্রশ্ন লোড করতে ব্যর্থ!');
    }
}

function enterActiveState() {
    $setup.style.display = 'none';
    $result.style.display = 'none';
    $active.style.display = 'block';

    const meta = UTILS.SUBJECT_META[selectedSubject];
    const bn = meta ? meta.bn : selectedSubject;
    $activeInfo.textContent = `${bn} • ${questions.length}টি প্রশ্ন • ${timeLimit} মিনিট`;

    startTime = Date.now();
    localStorage.setItem('examActive', '1');

    startTimer();
    showQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            finishExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    $timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    $timerDisplay.className = 'exam-timer';
    if (timeRemaining <= 60) {
        $timerDisplay.classList.add('danger');
    } else if (timeRemaining <= 300) {
        $timerDisplay.classList.add('warning');
    }
}

function showQuestion() {
    if (currentIndex >= questions.length) {
        finishExam();
        return;
    }

    const q = questions[currentIndex];
    const total = questions.length;

    $progressFill.style.width = `${((currentIndex) / total) * 100}%`;
    $progressText.textContent = `প্রশ্ন ${currentIndex + 1} এর ${total}`;

    isAnswering = false;

    const card = document.createElement('div');
    card.className = 'mcq-card';
    card.id = 'exam-current-card';

    const hasExplanation = q.explanation && q.explanation.trim().length > 0;

    card.innerHTML = `
        <div class="mcq-question-wrapper">
            <span class="q-number-badge">${currentIndex + 1}</span>
            <div class="q-text-content">${q.question}</div>
        </div>
        <div class="mcq-options" id="exam-options">
            ${q.options.map((opt, oi) => `
                <button class="option-btn" data-opt-index="${oi}">
                    <span class="option-letter">${LABELS[oi]}</span>
                    <span class="option-text">${opt}</span>
                </button>
            `).join('')}
        </div>
        ${hasExplanation ? `<div class="explanation" id="exam-explanation-${currentIndex}">
            <div class="explanation-title"><i class="fa-solid fa-lightbulb"></i> ব্যাখ্যা</div>
            ${q.explanation}
        </div>` : ''}
    `;

    $questionArea.innerHTML = '';
    $questionArea.appendChild(card);

    const buttons = card.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn, q));
    });

    if (window.renderMathInElement) {
        renderMathInElement(card, {
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

function handleAnswer(btn, q) {
    if (isAnswering) return;
    isAnswering = true;

    const optIndex = parseInt(btn.dataset.optIndex);
    const selectedText = q.options[optIndex];
    const isCorrect = selectedText === q.answer;

    if (isCorrect) correctCount++;

    const buttons = document.querySelectorAll('#exam-options .option-btn');
    buttons.forEach((b, i) => {
        b.style.pointerEvents = 'none';
        const text = q.options[i];
        if (text === q.answer) {
            b.classList.add('correct');
        } else if (i === optIndex && !isCorrect) {
            b.classList.add('incorrect');
        }
    });

    const explanationEl = document.getElementById(`exam-explanation-${currentIndex}`);
    if (explanationEl) {
        explanationEl.classList.add('show');
    }

    setTimeout(() => {
        currentIndex++;
        if (explanationEl) {
            explanationEl.classList.remove('show');
        }
        showQuestion();
    }, 800);
}

$finishBtn.addEventListener('click', () => {
    if (confirm('নিশ্চিতভাবে পরীক্ষা শেষ করতে চান?')) {
        finishExam();
    }
});

function finishExam() {
    clearInterval(timerInterval);
    localStorage.removeItem('examActive');

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const elapsedMin = Math.floor(elapsed / 60);
    const elapsedSec = elapsed % 60;
    const timeStr = elapsedMin > 0 ? `${elapsedMin} মিনিট ${elapsedSec} সেকেন্ড` : `${elapsedSec} সেকেন্ড`;

    const total = questions.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const speed = elapsed > 0 ? (total / (elapsed / 60)).toFixed(1) : '0';

    $active.style.display = 'none';
    $result.style.display = 'block';

    $resultScore.textContent = `${pct}%`;
    $resultLabel.textContent = `সঠিক: ${correctCount}/${total}`;
    $resultTime.textContent = timeStr;
    $resultAccuracy.textContent = `${accuracy}%`;
    $resultSpeed.textContent = speed;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

$retryBtn.addEventListener('click', () => {
    $result.style.display = 'none';
    $setup.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

$homeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

function showSetupStatus(type, msg) {
    if (!msg) {
        $setupStatus.innerHTML = '';
        return;
    }
    $setupStatus.innerHTML = `<div class="gen-status gen-status-${type}"><i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-info'}"></i> ${msg}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    UTILS.initMobileMenu();
    UTILS.initSwipeGestures();

    // Set active bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(a => {
      if (a.getAttribute('href') === 'exam.html') a.classList.add('active');
    });

    loadMeta();
});
