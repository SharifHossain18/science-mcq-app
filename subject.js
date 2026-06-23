let metaData = {};
let selectedMode = 'mcq';
let subject = localStorage.getItem('selectedSubject');

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam) {
        const modeMap = { chapter: 'chapter', board: 'board', cq: 'cq' };
        const resolved = modeMap[modeParam];
        if (resolved) {
            localStorage.setItem('practiceMode', resolved);
            localStorage.setItem('boardSelectMode', resolved === 'cq' ? 'cq' : 'mcq');
        }
    }

    const storedMode = localStorage.getItem('boardSelectMode') || localStorage.getItem('practiceMode');
    if (storedMode === 'cq') selectedMode = 'cq';
    else selectedMode = 'mcq';

    const pickerView = document.getElementById('subject-picker-view');
    const dashboardView = document.getElementById('subject-dashboard-view');

    if (subject) {
        pickerView.classList.remove('active');
        dashboardView.classList.add('active');
        document.getElementById('breadcrumb-subject').textContent = subject;
        document.title = `LUMEN - ${subject}`;
        initDashboard();
    } else {
        pickerView.classList.add('active');
        dashboardView.classList.remove('active');
        document.getElementById('breadcrumb-subject').textContent = 'Subject';
        document.title = 'LUMEN - Subject';
    }

    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            subject = card.getAttribute('data-subject');
            localStorage.setItem('selectedSubject', subject);
            pickerView.classList.remove('active');
            dashboardView.classList.add('active');
            document.getElementById('breadcrumb-subject').textContent = subject;
            document.title = `LUMEN - ${subject}`;
            initDashboard();
        });
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        if (subject) {
            subject = null;
            localStorage.removeItem('selectedSubject');
            dashboardView.classList.remove('active');
            pickerView.classList.add('active');
            document.getElementById('breadcrumb-subject').textContent = 'Subject';
            document.title = 'LUMEN - Subject';
        } else {
            window.location.href = 'index.html';
        }
    });

    UTILS.initMobileMenu();
    UTILS.initSwipeGestures();

    // Set active bottom nav
    const navMap = { chapter: 'chapter', board: 'board', cq: 'cq' };
    const activeNav = navMap[modeParam] || 'chapter';
    document.querySelectorAll('.bottom-nav .nav-item').forEach(a => {
      if (a.getAttribute('href') === `subject.html?mode=${activeNav}`) a.classList.add('active');
    });

    const handleSidebarNavigation = (targetMode, cqSubMode) => {
        if (subject) localStorage.setItem('selectedSubject', subject);
        if (targetMode === 'cq') {
            localStorage.setItem('practiceMode', 'cq');
            localStorage.setItem('cqSubMode', cqSubMode || 'chapter');
            localStorage.setItem('boardSelectMode', 'cq');
            if (cqSubMode === 'board') {
                window.location.href = 'board-select.html';
            } else {
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

    UTILS.initInstallPrompt();
});

function initDashboard() {
    renderBanner();

    document.querySelectorAll('.subj-toggle-card').forEach(c => {
        if (c.getAttribute('data-mode') === selectedMode) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
    });

    document.querySelectorAll('.subj-toggle-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedMode = card.getAttribute('data-mode');
            document.querySelectorAll('.subj-toggle-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            localStorage.setItem('boardSelectMode', selectedMode);
            localStorage.setItem('practiceMode', selectedMode === 'cq' ? 'cq' : 'chapter');
        });
    });

    document.getElementById('card-board').addEventListener('click', () => {
        localStorage.setItem('selectedSubject', subject);
        localStorage.setItem('practiceMode', selectedMode === 'cq' ? 'cq' : 'board');
        localStorage.setItem('boardSelectMode', selectedMode);
        window.location.href = 'board-select.html';
    });

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
}

function renderBanner() {
    const meta = UTILS.SUBJECT_META[subject] || UTILS.SUBJECT_META['Physics 1st Paper'];
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
    const chapters = subjectMeta.chapters.filter(ch => ch && ch.name);

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
        item.dataset.chapterId = ch.id;
        item.innerHTML = `
            <div class="subj-chapter-item-left">
                <span class="subj-chapter-num">${chapterNum}</span>
                <span class="subj-chapter-name">${chapterName}</span>
            </div>
            <div class="subj-chapter-item-right">
                <i class="fa-solid fa-chevron-right"></i>
            </div>`;
        item.addEventListener('click', () => {
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
    setTimeout(() => loadChapterCounts(), 100);
}

async function loadChapterCounts() {
    const items = document.querySelectorAll('.subj-chapter-item');
    if (!items.length) return;
    const cleanSub = subject.replace(/\s+/g, '_');
    const fetches = Array.from(items).map(async (item) => {
        const chId = item.dataset.chapterId;
        if (!chId) return;
        const nameEl = item.querySelector('.subj-chapter-name');
        if (!nameEl) return;
        const [mcqRes, cqRes] = await Promise.allSettled([
            fetch(`data/chapters/${cleanSub}_${chId}.json`),
            fetch(`data/cq/chapters/${cleanSub}_${chId}.json`)
        ]);
        let mcqCount = 0, cqCount = 0;
        if (mcqRes.status === 'fulfilled' && mcqRes.value.ok) {
            try { mcqCount = (await mcqRes.value.json()).length; } catch {}
        }
        if (cqRes.status === 'fulfilled' && cqRes.value.ok) {
            try { cqCount = (await cqRes.value.json()).length; } catch {}
        }
        const parts = [];
        if (mcqCount > 0) parts.push(`${mcqCount} MCQ`);
        if (cqCount > 0) parts.push(`${cqCount} CQ`);
        if (parts.length) {
            const badge = document.createElement('span');
            badge.className = 'subj-chapter-count';
            badge.textContent = parts.join(' | ');
            nameEl.appendChild(badge);
        }
        const leftEl = item.querySelector('.subj-chapter-item-left');
        if (leftEl && window.UTILS) {
            const progressHTML = window.UTILS.renderProgressBar(subject, nameEl.textContent.replace(badge?.textContent || '', '').trim());
            if (progressHTML) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = progressHTML;
                leftEl.after(wrapper.firstElementChild);
            }
        }
    });
    await Promise.allSettled(fetches);
}
