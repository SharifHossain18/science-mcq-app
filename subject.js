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

    // Check if this subject is already saved offline and update the download button
    checkAndMarkSavedSubject(subject);

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

    // Download button
    document.getElementById('subj-hub-download').addEventListener('click', () => {
        downloadSubjectOffline(subject, document.getElementById('subj-hub-download'));
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
                <button class="subj-pdf-btn" title="PDF প্রশ্নপত্র তৈরি করুন"><i class="fa-solid fa-file-pdf"></i></button>
                <i class="fa-solid fa-chevron-right"></i>
            </div>`;

        const pdfBtn = item.querySelector('.subj-pdf-btn');
        pdfBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.setItem('selectedSubject', subject);
            localStorage.setItem('selectedChapter', ch.name);
            localStorage.setItem('selectedChapterId', ch.id);
            localStorage.removeItem('selectedYear');
            localStorage.removeItem('selectedBoard');
            localStorage.setItem('autoGeneratePDF', 'true');
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
}

// ── Toast notification utility (mobile-friendly, replaces alert()) ──
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
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => { toast.classList.remove('show'); }, duration);
}

// Check if this subject is already cached and update the download button visually
async function checkAndMarkSavedSubject(subject) {
    if (!('caches' in window)) return; // Cache API not available in this context
    const btn = document.getElementById('subj-hub-download');
    if (!btn) return;
    try {
        const cache = await caches.open('lumen-v45');
        const cleanSubject = subject.replace(/\s+/g, '_');
        const url = `data/chapters/${cleanSubject}_ch_2.json`;
        const match = await cache.match(url);
        if (match) {
            btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #ffffff;"></i>`;
            btn.classList.add('saved');
            btn.title = "সংরক্ষিত (Saved)";
        }
    } catch (e) {
        console.error('Error checking cached subject:', e);
    }
}

// Offline download helper — shows a circular SVG progress ring during download
async function downloadSubjectOffline(subject, btn) {
    // Guard: Cache Storage API requires HTTPS or localhost
    if (!('caches' in window)) {
        showLumenToast('এই সংযোগে অফলাইন ডাউনলোড সমর্থিত নয়। HTTPS বা localhost ব্যবহার করুন।', 'error', 5000);
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

    // 1. MCQ chapter JSON files
    const chapters = metaData[subject].chapters || [];
    chapters.forEach(ch => {
        urlsToCache.push(`data/chapters/${cleanSubject}_${ch.id}.json`);
    });

    // 2. MCQ board JSON files
    const boards = metaData[subject].boards || {};
    Object.keys(boards).forEach(year => {
        boards[year].forEach(board => {
            const cleanBoard = board.replace(/\s+/g, '_');
            urlsToCache.push(`data/boards/${cleanSubject}_${year}_${cleanBoard}.json`);
        });
    });

    // 3. CQ chapter JSON files
    chapters.forEach(ch => {
        urlsToCache.push(`data/cq/chapters/${cleanSubject}_${ch.id}.json`);
    });

    // 4. CQ board JSON files
    Object.keys(boards).forEach(year => {
        boards[year].forEach((board, idx) => {
            urlsToCache.push(`data/cq/boards/${cleanSubject}_${year}_${idx + 1}.json`);
        });
    });

    const totalUrls = urlsToCache.length;
    if (totalUrls === 0) return;

    // Inject circular SVG progress ring into the button
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
        const cache = await caches.open('lumen-v45');

        let successCount = 0;
        let failCount = 0;

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

            // Update circular progress ring in real-time
            const percent = Math.round(((successCount + failCount) / totalUrls) * 100);
            const offset = circ - (percent / 100) * circ;
            if (bar) bar.style.strokeDashoffset = offset;
        }

        if (successCount > 0) {
            btn.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #ffffff;"></i>`;
            btn.classList.add('saved');
            btn.title = 'সংরক্ষিত (Saved)';
            btn.disabled = false;
            showLumenToast(`✔ "${subject}" — ${successCount}টি ফাইল সফলভাবে সংরক্ষিত!`, 'success', 4000);
        } else {
            btn.innerHTML = originalHtml;
            btn.classList.remove('saved');
            btn.disabled = false;
            showLumenToast('কোনো ফাইল ডাউনলোড হয়নি। ইন্টারনেট কানেকশন চেক করুন।', 'error');
        }
    } catch (err) {
        console.error(err);
        btn.innerHTML = originalHtml;
        btn.classList.remove('saved');
        btn.disabled = false;
        showLumenToast('ডাউনলোড ব্যর্থ: ' + (err.message || 'অজানা ত্রুটি'), 'error', 5000);
    }
}
