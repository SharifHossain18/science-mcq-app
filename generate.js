const SUBJECT_META = {
    'Physics 1st Paper':  { bn: 'পদার্থবিজ্ঞান ১ম পত্র', icon: 'fa-solid fa-atom',                color: 'linear-gradient(135deg, #6ba5d6 0%, #3a75c4 100%)' },
    'Physics 2nd Paper':  { bn: 'পদার্থবিজ্ঞান ২য় পত্র', icon: 'fa-solid fa-bolt',                color: 'linear-gradient(135deg, #9b86d9 0%, #684ca3 100%)' },
    'Chemistry 1st Paper':{ bn: 'রসায়ন ১ম পত্র',         icon: 'fa-solid fa-flask',               color: 'linear-gradient(135deg, #64c2b2 0%, #308f80 100%)' },
    'Chemistry 2nd Paper':{ bn: 'রসায়ন ২য় পত্র',         icon: 'fa-solid fa-vial',                color: 'linear-gradient(135deg, #e57c82 0%, #b84349 100%)' },
    'Math 1st Paper':     { bn: 'উচ্চতর গণিত ১ম পত্র',   icon: 'fa-solid fa-square-root-variable', color: 'linear-gradient(135deg, #f5a65d 0%, #c97322 100%)' },
    'Math 2nd Paper':     { bn: 'উচ্চতর গণিত ২য় পত্র',   icon: 'fa-solid fa-infinity',            color: 'linear-gradient(135deg, #74b37d 0%, #44804c 100%)' },
};

let metaData = null;
let selectedSubject = '';
let selectedChapterId = '';
let allMCQs = [];
let allCQs = [];

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

// ── DOM refs ──
const $subject = document.getElementById('gen-subject');
const $chapter = document.getElementById('gen-chapter');
const $mcqCount = document.getElementById('gen-mcq-count');
const $cqCount = document.getElementById('gen-cq-count');
const $mcqHint = document.getElementById('gen-mcq-hint');
const $cqHint = document.getElementById('gen-cq-hint');
const $generateBtn = document.getElementById('gen-generate-btn');
const $status = document.getElementById('gen-status');
const $results = document.getElementById('gen-results');
const $mcqSection = document.getElementById('gen-mcq-section');
const $cqSection = document.getElementById('gen-cq-section');
const $mcqList = document.getElementById('gen-mcq-list');
const $cqList = document.getElementById('gen-cq-list');
const $mcqBadge = document.getElementById('gen-mcq-badge');
const $cqBadge = document.getElementById('gen-cq-badge');
const $printArea = document.getElementById('gen-print-area');
const $regenerateBtn = document.getElementById('gen-regenerate-btn');

// ── Load meta ──
async function loadMeta() {
    try {
        const res = await fetch('data/meta.json');
        metaData = await res.json();
        populateSubjects();
    } catch {
        showStatus('error', 'মেটাডেটা লোড করতে ব্যর্থ!');
    }
}

function populateSubjects() {
    $subject.innerHTML = '<option value="">— বিষয় নির্বাচন করুন —</option>';
    Object.keys(metaData).forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        const meta = SUBJECT_META[sub];
        opt.textContent = meta ? `${meta.bn} (${sub})` : sub;
        $subject.appendChild(opt);
    });
}

// ── Chapter loading ──
$subject.addEventListener('change', () => {
    selectedSubject = $subject.value;
    $chapter.innerHTML = '<option value="">— অধ্যায় নির্বাচন করুন —</option>';
    $chapter.disabled = !selectedSubject;
    $mcqHint.textContent = 'সর্বোচ্চ: —';
    $cqHint.textContent = 'সর্বোচ্চ: —';
    resetResults();

    if (!selectedSubject) return;

    const chapters = (metaData[selectedSubject]?.chapters || [])
        .filter(ch => ch && ch.id !== 'ch_1' && ch.name && ch.name.toLowerCase() !== 'general');

    chapters.forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = stripChapterPrefix(ch.name);
        opt.dataset.chapterName = ch.name;
        $chapter.appendChild(opt);
    });
});

$chapter.addEventListener('change', () => {
    selectedChapterId = $chapter.value;
    $mcqHint.textContent = 'সর্বোচ্চ: —';
    $cqHint.textContent = 'সর্বোচ্চ: —';
    resetResults();
    if (!selectedChapterId) return;
    checkAvailability();
});

async function checkAvailability() {
    const cleanSub = clean(selectedSubject);
    try {
        const [mcqRes, cqRes] = await Promise.allSettled([
            fetch(`data/chapters/${cleanSub}_${selectedChapterId}.json`),
            fetch(`data/cq/chapters/${cleanSub}_${selectedChapterId}.json`)
        ]);

        if (mcqRes.status === 'fulfilled' && mcqRes.value.ok) {
            allMCQs = await mcqRes.value.json();
            $mcqHint.textContent = `সর্বোচ্চ: ${allMCQs.length}`;
            if (parseInt($mcqCount.value) > allMCQs.length) $mcqCount.value = allMCQs.length;
        } else {
            allMCQs = [];
            $mcqHint.textContent = 'কোনো MCQ নেই';
        }

        if (cqRes.status === 'fulfilled' && cqRes.value.ok) {
            allCQs = await cqRes.value.json();
            $cqHint.textContent = `সর্বোচ্চ: ${allCQs.length}`;
            if (parseInt($cqCount.value) > allCQs.length) $cqCount.value = allCQs.length;
        } else {
            allCQs = [];
            $cqHint.textContent = 'কোনো CQ নেই';
        }
    } catch {
        allMCQs = [];
        allCQs = [];
        $mcqHint.textContent = 'কোনো MCQ নেই';
        $cqHint.textContent = 'কোনো CQ নেই';
    }
}

// ── Generate ──
$generateBtn.addEventListener('click', generate);
$regenerateBtn.addEventListener('click', generate);

async function generate() {
    if (!selectedSubject || !selectedChapterId) {
        showStatus('error', 'বিষয় এবং অধ্যায় নির্বাচন করুন!');
        return;
    }

    const mcqWanted = parseInt($mcqCount.value) || 0;
    const cqWanted = parseInt($cqCount.value) || 0;
    if (mcqWanted === 0 && cqWanted === 0) {
        showStatus('error', 'অনুগ্রহ করে MCQ বা CQ এর সংখ্যা দিন!');
        return;
    }

    // Re-fetch if not already loaded
    if (allMCQs.length === 0 && mcqWanted > 0) {
        const cleanSub = clean(selectedSubject);
        try {
            const res = await fetch(`data/chapters/${cleanSub}_${selectedChapterId}.json`);
            if (res.ok) allMCQs = await res.json();
        } catch {}
    }
    if (allCQs.length === 0 && cqWanted > 0) {
        const cleanSub = clean(selectedSubject);
        try {
            const res = await fetch(`data/cq/chapters/${cleanSub}_${selectedChapterId}.json`);
            if (res.ok) allCQs = await res.json();
        } catch {}
    }

    if (mcqWanted > allMCQs.length) {
        showStatus('error', `শুধু ${allMCQs.length}টি MCQ পাওয়া গেছে। সংখ্যা কমিয়ে দিন।`);
        return;
    }
    if (cqWanted > allCQs.length) {
        showStatus('error', `শুধু ${allCQs.length}টি CQ পাওয়া গেছে। সংখ্যা কমিয়ে দিন।`);
        return;
    }

    const pickedMCQs = shuffle(allMCQs, mcqWanted);
    const pickedCQs = shuffle(allCQs, cqWanted);

    renderMCQs(pickedMCQs);
    renderCQs(pickedCQs);

    $mcqSection.style.display = mcqWanted > 0 ? 'block' : 'none';
    $cqSection.style.display = cqWanted > 0 ? 'block' : 'none';
    $printArea.style.display = (mcqWanted > 0 || cqWanted > 0) ? 'flex' : 'none';
    $results.style.display = 'block';
    $status.innerHTML = '';

    window.scrollTo({ top: $results.offsetTop - 80, behavior: 'smooth' });
}

// ── Render MCQ ──
function renderMCQs(questions) {
    $mcqList.innerHTML = '';
    $mcqBadge.textContent = questions.length;
    const chapterName = $chapter.selectedOptions[0]?.dataset.chapterName || $chapter.value;

    questions.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'gen-mcq-card';
        card.innerHTML = `
            <div class="gen-q-top">
                <span class="gen-q-num">${i + 1}</span>
                <span class="gen-q-meta">${chapterName}</span>
            </div>
            <div class="gen-q-text">${q.question}</div>
            <div class="gen-q-options">
                ${['ক', 'খ', 'গ', 'ঘ'].map((label, oi) => `
                    <div class="gen-opt ${q.options[oi] === q.answer ? 'gen-opt-correct' : ''}">
                        <span class="gen-opt-label">${label}</span>
                        <span class="gen-opt-text">${q.options[oi]}</span>
                        ${q.options[oi] === q.answer ? '<i class="fa-solid fa-check gen-opt-check"></i>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="gen-q-explanation">
                <strong><i class="fa-solid fa-circle-info"></i> ব্যাখ্যা:</strong>
                <div>${q.explanation || 'কোনো ব্যাখ্যা নেই।'}</div>
            </div>
        `;

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

        $mcqList.appendChild(card);
    });
}

// ── Render CQ ──
function renderCQs(questions) {
    $cqList.innerHTML = '';
    $cqBadge.textContent = questions.length;
    const chapterName = $chapter.selectedOptions[0]?.dataset.chapterName || $chapter.value;
    const subLabels = { a: 'ক', b: 'খ', c: 'গ', d: 'ঘ' };

    questions.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'gen-cq-card';
        card.innerHTML = `
            <div class="gen-q-top">
                <span class="gen-q-num">CQ ${i + 1}</span>
                <span class="gen-q-meta">${chapterName}</span>
            </div>
            <div class="gen-cq-context">
                <strong>উদ্দীপক:</strong>
                <div>${q.context}</div>
            </div>
            <div class="gen-cq-subs">
                ${q.questions.map(sub => `
                    <div class="gen-cq-sub">
                        <div class="gen-cq-sub-q">
                            <span class="gen-cq-sub-label">${subLabels[sub.type] || sub.type}.</span>
                            <span>${sub.question}</span>
                        </div>
                        <div class="gen-cq-sub-a">
                            <strong>উত্তর:</strong> ${sub.answer || '—'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

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

        $cqList.appendChild(card);
    });
}

// ── Utilities ──
function showStatus(type, msg) {
    $status.innerHTML = `<div class="gen-status gen-status-${type}"><i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-info'}"></i> ${msg}</div>`;
}

function resetResults() {
    $results.style.display = 'none';
    $mcqSection.style.display = 'none';
    $cqSection.style.display = 'none';
    $printArea.style.display = 'none';
    $mcqList.innerHTML = '';
    $cqList.innerHTML = '';
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    UTILS.initMobileMenu();
    loadMeta();
});
