// ── Subject metadata ──
const SUBJECT_META = {
    'Physics 1st Paper':  { bn: 'পদার্থবিজ্ঞান ১ম পত্র', icon: 'fa-solid fa-atom',                color: 'linear-gradient(135deg, #6ba5d6 0%, #3a75c4 100%)' },
    'Physics 2nd Paper':  { bn: 'পদার্থবিজ্ঞান ২য় পত্র', icon: 'fa-solid fa-bolt',                color: 'linear-gradient(135deg, #9b86d9 0%, #684ca3 100%)' },
    'Chemistry 1st Paper':{ bn: 'রসায়ন ১ম পত্র',         icon: 'fa-solid fa-flask',               color: 'linear-gradient(135deg, #64c2b2 0%, #308f80 100%)' },
    'Chemistry 2nd Paper':{ bn: 'রসায়ন ২য় পত্র',         icon: 'fa-solid fa-vial',                color: 'linear-gradient(135deg, #e57c82 0%, #b84349 100%)' },
    'Math 1st Paper':     { bn: 'উচ্চতর গণিত ১ম পত্র',   icon: 'fa-solid fa-square-root-variable', color: 'linear-gradient(135deg, #f5a65d 0%, #c97322 100%)' },
    'Math 2nd Paper':     { bn: 'উচ্চতর গণিত ২য় পত্র',   icon: 'fa-solid fa-infinity',            color: 'linear-gradient(135deg, #74b37d 0%, #44804c 100%)' },
    'Biology 1st Paper':  { bn: 'জীববিজ্ঞান ১ম পত্র',     icon: 'fa-solid fa-leaf',                color: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)' },
    'Biology 2nd Paper':  { bn: 'জীববিজ্ঞান ২য় পত্র',     icon: 'fa-solid fa-leaf',                color: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)' },
};

const subject   = localStorage.getItem('selectedSubject') || 'Physics 1st Paper';
const mode      = localStorage.getItem('boardSelectMode') || 'mcq'; // 'mcq' or 'cq'

let metaData       = {};
let selectedYear   = null;
let selectedBoard  = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('selectedSubject')) {
        window.location.href = 'index.html';
        return;
    }

    // Back → subject.html
    document.getElementById('back-btn').addEventListener('click', () => window.location.href = 'subject.html');

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
                window.location.reload();
            } else {
                window.location.href = 'subject.html';
            }
        } else {
            localStorage.setItem('practiceMode', targetMode);
            localStorage.setItem('boardSelectMode', 'mcq');
            if (targetMode === 'board') {
                window.location.reload();
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

    // Render subject strip
    renderStrip();

    // Load meta + render year/board
    fetch('data/meta.json?t=' + Date.now())
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => {
            metaData = data;
            renderYearSlider();
            renderBoardGrid(null); // show all boards initially
        })
        .catch(err => {
            console.error('meta.json error:', err);
            document.getElementById('bs-year-slider').innerHTML =
                `<p style="color:#ef4444;font-size:0.85rem;padding:10px 0;">ডেটা লোড ব্যর্থ — সার্ভার চলছে কিনা দেখুন।</p>`;
        });
});

// Render the colored subject strip
function renderStrip() {
    const meta = SUBJECT_META[subject] || SUBJECT_META['Physics 1st Paper'];
    const strip = document.getElementById('bs-subject-strip');
    strip.style.background = meta.color;
    document.getElementById('bs-strip-icon').innerHTML = `<i class="${meta.icon}"></i>`;
    document.getElementById('bs-strip-name').textContent = subject;
    document.getElementById('bs-strip-mode').textContent =
        (mode === 'cq' ? 'CQ — সৃজনশীল' : 'MCQ — বহুনির্বাচনি') + ' • Board Questions';
    const bc = document.getElementById('bc-subject');
    if (bc) bc.textContent = subject;
    document.title = `LUMEN - Board | ${subject}`;
}

// Render horizontal year chips (newest → oldest)
function renderYearSlider() {
    const slider = document.getElementById('bs-year-slider');
    slider.innerHTML = '';

    const subjectMeta = metaData[subject];
    if (!subjectMeta || !subjectMeta.boards) {
        slider.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">কোনো বোর্ড ডেটা পাওয়া যায়নি।</p>`;
        return;
    }

    // Sort years descending (newest first)
    const years = Object.keys(subjectMeta.boards).sort((a, b) => b.localeCompare(a));

    years.forEach(yr => {
        const chip = document.createElement('div');
        chip.className = 'bs-year-chip';
        chip.textContent = yr;
        chip.setAttribute('data-year', yr);
        chip.addEventListener('click', () => {
            // Deselect old year
            document.querySelectorAll('.bs-year-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            selectedYear = yr;
            selectedBoard = null; // reset board on new year
            renderBoardGrid(yr);
        });
        slider.appendChild(chip);
    });
}

// Render board grid (2 per row) — filtered by year or show union of all
function renderBoardGrid(year) {
    const grid = document.getElementById('bs-board-grid');
    grid.innerHTML = '';

    const subjectMeta = metaData[subject];
    if (!subjectMeta || !subjectMeta.boards) return;

    let boards = [];
    if (year) {
        boards = subjectMeta.boards[year] || [];
    } else {
        // All unique boards across all years
        const allBoards = new Set();
        Object.values(subjectMeta.boards).forEach(bList => bList.forEach(b => allBoards.add(b)));
        boards = Array.from(allBoards).sort((a, b) => {
            if (a === 'Combined') return -1;
            if (b === 'Combined') return 1;
            return a.localeCompare(b);
        });
    }

    if (boards.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;grid-column:span 2;padding:10px;">এই বছরের কোনো বোর্ড নেই।</p>`;
        return;
    }

    boards.forEach(bd => {
        const card = document.createElement('div');
        card.className = 'bs-board-card';
        if (bd === selectedBoard) card.classList.add('selected');
        card.setAttribute('data-board', bd);
        card.innerHTML = `
            <div class="bs-board-icon"><i class="fa-solid fa-building-columns"></i></div>
            <span class="bs-board-name">${bd}</span>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.bs-board-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedBoard = bd;
            startPractice();
        });
        grid.appendChild(card);
    });
}

// Navigate to quiz page
function startPractice() {
    if (!selectedYear || !selectedBoard) return;

    localStorage.setItem('selectedSubject', subject);
    localStorage.setItem('selectedYear', selectedYear);
    localStorage.setItem('selectedBoard', selectedBoard);
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedChapterId');

    if (mode === 'cq') {
        localStorage.setItem('practiceMode', 'cq');
        localStorage.setItem('cqSubMode', 'board');
        window.location.href = 'cq.html';
    } else {
        localStorage.setItem('practiceMode', 'board');
        localStorage.removeItem('cqSubMode');
        window.location.href = 'mcq.html';
    }
}
