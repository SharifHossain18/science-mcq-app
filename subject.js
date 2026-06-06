// ── Subject metadata (icons + colors + Bengali names) ──
const SUBJECT_META = {
    'Physics 1st Paper':  { bn: 'পদার্থবিজ্ঞান ১ম পত্র', icon: 'fa-solid fa-atom',                color: 'linear-gradient(135deg, #6ba5d6 0%, #3a75c4 100%)', shadow: 'rgba(58,117,196,0.35)' },
    'Physics 2nd Paper':  { bn: 'পদার্থবিজ্ঞান ২য় পত্র', icon: 'fa-solid fa-bolt',                color: 'linear-gradient(135deg, #9b86d9 0%, #684ca3 100%)', shadow: 'rgba(104,76,163,0.35)' },
    'Chemistry 1st Paper':{ bn: 'রসায়ন ১ম পত্র',         icon: 'fa-solid fa-flask',               color: 'linear-gradient(135deg, #64c2b2 0%, #308f80 100%)', shadow: 'rgba(48,143,128,0.35)' },
    'Chemistry 2nd Paper':{ bn: 'রসায়ন ২য় পত্র',         icon: 'fa-solid fa-vial',                color: 'linear-gradient(135deg, #e57c82 0%, #b84349 100%)', shadow: 'rgba(184,67,73,0.35)'  },
    'Math 1st Paper':     { bn: 'উচ্চতর গণিত ১ম পত্র',   icon: 'fa-solid fa-square-root-variable', color: 'linear-gradient(135deg, #f5a65d 0%, #c97322 100%)', shadow: 'rgba(201,115,34,0.35)' },
    'Math 2nd Paper':     { bn: 'উচ্চতর গণিত ২য় পত্র',   icon: 'fa-solid fa-infinity',            color: 'linear-gradient(135deg, #74b37d 0%, #44804c 100%)', shadow: 'rgba(68,128,76,0.35)'  },
};

let metaData = {};
let selectedMode = 'mcq'; // default MCQ selected
const subject = localStorage.getItem('selectedSubject') || 'Physics 1st Paper';

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('selectedSubject')) {
        window.location.href = 'index.html';
        return;
    }

    // Restore selected mode on load
    const storedMode = localStorage.getItem('boardSelectMode') || localStorage.getItem('practiceMode');
    if (storedMode === 'cq') {
        selectedMode = 'cq';
    } else {
        selectedMode = 'mcq';
    }

    // Set active class on mode toggle cards dynamically on load
    document.querySelectorAll('.subj-toggle-card').forEach(c => {
        if (c.getAttribute('data-mode') === selectedMode) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
    });

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => window.location.href = 'index.html');

    // Mobile sidebar
    const sidebar = document.getElementById('sidebar');
    document.getElementById('menu-toggle').addEventListener('click', () => sidebar.classList.toggle('open'));
    document.querySelector('.main-workspace').addEventListener('click', (e) => {
        if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar'))
            sidebar.classList.remove('open');
    });

    // Sidebar navigation mode links
    const handleSidebarNavigation = (targetMode, cqSubMode) => {
        localStorage.setItem('selectedSubject', subject);
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
                // Just toggle the view if already on subject.html
                selectedMode = 'cq';
                document.querySelectorAll('.subj-toggle-card').forEach(c => c.classList.remove('active'));
                const cqCard = document.getElementById('toggle-cq');
                if (cqCard) cqCard.classList.add('active');
            }
        } else {
            localStorage.setItem('practiceMode', targetMode);
            localStorage.setItem('boardSelectMode', 'mcq');
            if (targetMode === 'board') {
                window.location.href = 'board-select.html';
            } else {
                // Just toggle the view if already on subject.html
                selectedMode = 'mcq';
                document.querySelectorAll('.subj-toggle-card').forEach(c => c.classList.remove('active'));
                const mcqCard = document.getElementById('toggle-mcq');
                if (mcqCard) mcqCard.classList.add('active');
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

    // Render subject banner
    renderBanner();

    // Mode toggle cards (MCQ / CQ)
    document.querySelectorAll('.subj-toggle-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedMode = card.getAttribute('data-mode');
            document.querySelectorAll('.subj-toggle-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            localStorage.setItem('boardSelectMode', selectedMode);
            localStorage.setItem('practiceMode', selectedMode === 'cq' ? 'cq' : 'chapter');
        });
    });

    // Board big card → go to board-select page
    document.getElementById('card-board').addEventListener('click', () => {
        localStorage.setItem('selectedSubject', subject);
        localStorage.setItem('practiceMode', selectedMode === 'cq' ? 'cq' : 'board');
        // Store mode for board-select page
        localStorage.setItem('boardSelectMode', selectedMode);
        window.location.href = 'board-select.html';
    });

    // Load meta.json and render chapters
    fetch('data/meta.json?t=' + Date.now())
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => { metaData = data; renderChapterList(); })
        .catch(err => {
            console.error('meta.json error:', err);
            document.getElementById('subj-chapter-list').innerHTML = `
                <div style="padding:30px;text-align:center;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:2rem;color:#ef4444;"></i>
                    <p style="color:#ef4444;font-weight:700;margin-top:10px;">ডেটা লোড করতে ব্যর্থ — সার্ভার চলছে কিনা দেখুন।</p>
                </div>`;
        });
});

function renderBanner() {
    const meta = SUBJECT_META[subject] || SUBJECT_META['Physics 1st Paper'];
    const banner = document.getElementById('subj-hub-banner');
    banner.style.background = meta.color;
    banner.style.boxShadow = `0 12px 30px -8px ${meta.shadow}`;
    document.getElementById('subj-hub-icon').innerHTML = `<i class="${meta.icon}"></i>`;
    document.getElementById('subj-hub-name').textContent = subject;
    document.getElementById('subj-hub-bn').textContent = meta.bn;
    const bc = document.getElementById('breadcrumb-subject');
    if (bc) bc.textContent = subject;
    document.title = `LUMEN - ${subject}`;
}

function renderChapterList() {
    const listEl = document.getElementById('subj-chapter-list');
    const subjectMeta = metaData[subject];

    if (!subjectMeta || !subjectMeta.chapters || subjectMeta.chapters.length === 0) {
        listEl.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted);">কোনো অধ্যায় পাওয়া যায়নি।</div>`;
        return;
    }

    listEl.innerHTML = '';
    const chapters = subjectMeta.chapters.filter(ch => ch && ch.name && ch.id !== 'ch_1' && ch.name.toLowerCase() !== 'general');

    chapters.forEach(ch => {
        let chapterNum = 'Chapter';
        let chapterName = ch.name;
        if (ch.name.includes(':')) {
            const parts = ch.name.split(':');
            chapterNum = parts[0].trim();
            chapterName = parts.slice(1).join(':').trim();
        }

        const item = document.createElement('div');
        item.className = 'subj-chapter-item';
        item.innerHTML = `
            <div class="subj-chapter-item-left">
                <span class="subj-chapter-num">${chapterNum}</span>
                <span class="subj-chapter-name">${chapterName}</span>
            </div>
            <div class="subj-chapter-item-right">
                <i class="fa-solid fa-chevron-right"></i>
            </div>`;
        item.addEventListener('click', () => {
            // Go directly to MCQ or CQ using selected mode
            localStorage.setItem('selectedSubject', subject);
            localStorage.setItem('selectedChapter', ch.name);
            localStorage.setItem('selectedChapterId', ch.id);
            localStorage.removeItem('selectedYear');
            localStorage.removeItem('selectedBoard');

            if (selectedMode === 'cq') {
                localStorage.setItem('practiceMode', 'cq');
                localStorage.setItem('cqSubMode', 'chapter');
                window.location.href = 'cq.html';
            } else {
                localStorage.setItem('practiceMode', 'chapter');
                localStorage.removeItem('cqSubMode');
                window.location.href = 'mcq.html';
            }
        });
        listEl.appendChild(item);
    });
}


