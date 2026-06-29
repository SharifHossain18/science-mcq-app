// mover.js – client-side question mover logic
(() => {
    let metadata = {};
    let questions = [];
    let selectedQuestion = null;
    let mode = 'mcq'; // 'mcq' or 'cq'

    // DOM Elements
    const qtypeRadios = document.querySelectorAll('input[name="qtype"]');
    const srcSubject = document.getElementById('src-subject');
    const dstSubject = document.getElementById('dst-subject');
    
    const srcChapterGroup = document.getElementById('src-chapter-group');
    const srcChapter = document.getElementById('src-chapter');
    const srcBoardGroup = document.getElementById('src-board-group');
    const srcBoardYear = document.getElementById('src-board-year');
    
    const dstChapterGroup = document.getElementById('dst-chapter-group');
    const dstChapter = document.getElementById('dst-chapter');
    const dstBoardGroup = document.getElementById('dst-board-group');
    const dstBoardYear = document.getElementById('dst-board-year');
    
    const searchInput = document.getElementById('search-input');
    const qListDiv = document.getElementById('question-list');
    const moveBtn = document.getElementById('move-btn');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');

    // Show Toast
    function showToast(text, isError = false) {
        toastText.textContent = text;
        if (isError) {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    let boardIndexCache = {};

    function resolveBoardIndex(subject, year, boardName) {
        const key = `${subject}|${year}|${boardName}`;
        if (boardIndexCache[key]) return boardIndexCache[key];
        if (!metadata[subject] || !metadata[subject].boards || !metadata[subject].boards[year]) return null;
        const boards = metadata[subject].boards[year];
        const idx = boards.indexOf(boardName);
        if (idx === -1) return null;
        const result = boardName === 'Combined' ? 'Combined' : String(idx + 1);
        boardIndexCache[key] = result;
        return result;
    }

    // Load metadata from static meta.json
    async function loadMetadata() {
        try {
            const res = await fetch('./data/meta.json');
            if (!res.ok) throw new Error("Failed to load metadata");
            metadata = await res.json();
            
            // Populate subject dropdowns
            populateSubjects();
        } catch (err) {
            console.error(err);
            showToast("মেটাডাটা লোড হতে ব্যর্থ হয়েছে!", true);
        }
    }

    // Populate Subjects
    function populateSubjects() {
        const subjects = Object.keys(metadata);
        
        srcSubject.innerHTML = '';
        dstSubject.innerHTML = '';
        
        subjects.forEach(subject => {
            const opt1 = document.createElement('option');
            opt1.value = subject;
            opt1.textContent = subject;
            srcSubject.appendChild(opt1);
            
            const opt2 = document.createElement('option');
            opt2.value = subject;
            opt2.textContent = subject;
            dstSubject.appendChild(opt2);
        });

        // Trigger updates
        updateSourceSubOptions();
        updateDestinationSubOptions();
    }

    // Update source options based on subject selection
    function updateSourceSubOptions() {
        const subject = srcSubject.value;
        if (!subject || !metadata[subject]) return;

        const subMeta = metadata[subject];

        if (mode === 'mcq') {
            // MCQ uses chapters
            srcChapterGroup.style.display = 'flex';
            srcBoardGroup.style.display = 'none';
            
            srcChapter.innerHTML = '';
            subMeta.chapters.forEach(ch => {
                const opt = document.createElement('option');
                opt.value = ch.id;
                opt.textContent = ch.name;
                srcChapter.appendChild(opt);
            });
        } else {
            // CQ uses boards & years OR chapters depending on practice
            // For general migration, we show BOTH boards-years AND chapters, but let's look at what files exist.
            // Wait, we can list files in the folders, or build board/year and chapter listings.
            // Let's populate the board-years and chapters for CQs as well.
            // We can add a selector: Chapter-wise CQ or Board-wise CQ?
            // To make it super simple and robust, let's offer selection of both file sets:
            // Group by chapters and boards in the selector.
            srcChapterGroup.style.display = 'flex';
            srcBoardGroup.style.display = 'none';
            
            srcChapter.innerHTML = '';
            // CQ can reside in chapters or boards. Let's add them all to the source dropdown
            // Add chapters
            const optGroupCh = document.createElement('optgroup');
            optGroupCh.label = 'Chapters (অধ্যায়ভিত্তিক)';
            subMeta.chapters.forEach(ch => {
                const opt = document.createElement('option');
                opt.value = `chapter_${ch.id}`;
                opt.textContent = ch.name;
                optGroupCh.appendChild(opt);
            });
            srcChapter.appendChild(optGroupCh);

            // Add boards
            const optGroupBd = document.createElement('optgroup');
            optGroupBd.label = 'Boards (বোর্ডভিত্তিক)';
            const boards = subMeta.boards || {};
            Object.keys(boards).forEach(year => {
                boards[year].forEach(board => {
                    const opt = document.createElement('option');
                    opt.value = `board_${year}_${board}`;
                    opt.textContent = `${board} Board ${year}`;
                    optGroupBd.appendChild(opt);
                });
            });
            srcChapter.appendChild(optGroupBd);
        }

        loadQuestionsList();
    }

    // Update destination options
    function updateDestinationSubOptions() {
        const subject = dstSubject.value;
        if (!subject || !metadata[subject]) return;

        const subMeta = metadata[subject];

        if (mode === 'mcq') {
            dstChapterGroup.style.display = 'flex';
            dstBoardGroup.style.display = 'none';
            
            dstChapter.innerHTML = '';
            subMeta.chapters.forEach(ch => {
                const opt = document.createElement('option');
                opt.value = ch.id;
                opt.textContent = ch.name;
                dstChapter.appendChild(opt);
            });
        } else {
            dstChapterGroup.style.display = 'flex';
            dstBoardGroup.style.display = 'none';
            
            dstChapter.innerHTML = '';
            const optGroupCh = document.createElement('optgroup');
            optGroupCh.label = 'Chapters (অধ্যায়ভিত্তিক)';
            subMeta.chapters.forEach(ch => {
                const opt = document.createElement('option');
                opt.value = `chapter_${ch.id}`;
                opt.textContent = ch.name;
                optGroupCh.appendChild(opt);
            });
            dstChapter.appendChild(optGroupCh);

            const optGroupBd = document.createElement('optgroup');
            optGroupBd.label = 'Boards (বোর্ডভিত্তিক)';
            const boards = subMeta.boards || {};
            Object.keys(boards).forEach(year => {
                boards[year].forEach(board => {
                    const opt = document.createElement('option');
                    opt.value = `board_${year}_${board}`;
                    opt.textContent = `${board} Board ${year}`;
                    optGroupBd.appendChild(opt);
                });
            });
            dstChapter.appendChild(optGroupBd);
        }
    }

    // Load question data files
    async function loadQuestionsList() {
        const subject = srcSubject.value;
        const sourceVal = srcChapter.value;
        if (!subject || !sourceVal) return;

        qListDiv.innerHTML = '<div class="empty-state"><div class="spinner"></div><br><br>প্রশ্ন লোড হচ্ছে...</div>';
        selectedQuestion = null;
        moveBtn.disabled = true;

        let url = '';
        const cleanSub = subject.replace(/ /g, '_');

        if (mode === 'mcq') {
            // MCQ: load from data/chapters/<Subject>_<chapterId>.json
            url = `./data/chapters/${cleanSub}_${sourceVal}.json`;
        } else {
            // CQ: load from either chapters or boards
            if (sourceVal.startsWith('chapter_')) {
                const chId = sourceVal.replace('chapter_', '');
                url = `./data/cq/chapters/${cleanSub}_${chId}.json`;
            } else if (sourceVal.startsWith('board_')) {
                const parts = sourceVal.replace('board_', '').split('_');
                const year = parts[0];
                const boardName = parts.slice(1).join('_');
                const boardIdx = resolveBoardIndex(subject, year, boardName);
                if (boardIdx) {
                    url = `./data/cq/boards/${cleanSub}_${year}_${boardIdx}.json`;
                } else {
                    qListDiv.innerHTML = '<div class="empty-state">বোর্ড ইনডেক্স খুঁজে পাওয়া যায়নি।</div>';
                    return;
                }
            }
        }

        try {
            const res = await fetch(url + '?t=' + Date.now());
            if (!res.ok) {
                qListDiv.innerHTML = '<div class="empty-state">দুঃখিত! এই অধ্যায় বা বোর্ডে কোনো প্রশ্ন পাওয়া যায়নি।</div>';
                questions = [];
                return;
            }
            questions = await res.json();
            
            // Generate IDs if missing (backup)
            questions.forEach((q, idx) => {
                if (!q.id) {
                    q.id = `fallback-${idx}-${Date.now()}`;
                }
            });

            renderQuestions();
        } catch (err) {
            console.error(err);
            qListDiv.innerHTML = '<div class="empty-state">কোনো ডাটা পাওয়া যায়নি বা লোড করা যায়নি।</div>';
            questions = [];
        }
    }

    // Render questions to DOM
    function renderQuestions() {
        const filter = searchInput.value.toLowerCase().trim();
        const filtered = questions.filter(q => {
            if (!filter) return true;
            // Search question text
            if (q.question && q.question.toLowerCase().includes(filter)) return true;
            // Search explanation text
            if (q.explanation && q.explanation.toLowerCase().includes(filter)) return true;
            // Search context (for CQ)
            if (q.context && q.context.toLowerCase().includes(filter)) return true;
            return false;
        });

        qListDiv.innerHTML = '';

        if (filtered.length === 0) {
            qListDiv.innerHTML = '<div class="empty-state">কোনো ম্যাচিং প্রশ্ন পাওয়া যায়নি।</div>';
            return;
        }

        filtered.forEach(q => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.id = q.id;

            let bodyHtml = '';
            if (mode === 'mcq') {
                bodyHtml = `
                    <div><strong>${q.question}</strong></div>
                    <div style="margin-top: 8px; color: #34d399; font-size: 0.9rem;">
                        <strong>Ans:</strong> ${q.answer}
                    </div>
                `;
            } else {
                // CQ
                const subquestions = (q.questions || []).map(sq => `<li>(${sq.type || sq.letter}) ${sq.question}</li>`).join('');
                bodyHtml = `
                    <div style="border-left: 3px solid var(--primary); padding-left: 8px; margin-bottom: 8px; font-weight: 600;">
                        ${q.context}
                    </div>
                    <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-muted);">
                        ${subquestions}
                    </ul>
                `;
            }

            item.innerHTML = `
                ${bodyHtml}
                <div class="item-meta">
                    <span>ID: ${q.id}</span>
                    <span>${q.board || 'No Board'} ${q.year || ''}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedQuestion = q;
                moveBtn.disabled = false;
            });

            qListDiv.appendChild(item);
        });

        // Trigger math rendering
        if (window.renderMathInElement) {
            window.renderMathInElement(qListDiv, {
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

    // Post move action
    async function handleMove() {
        if (!selectedQuestion) return;

        const srcSub = srcSubject.value;
        const srcVal = srcChapter.value;

        const dstSub = dstSubject.value;
        const dstVal = dstChapter.value;

        const payload = {
            mode: mode,
            questionId: selectedQuestion.id,
            
            srcSubject: srcSub,
            srcVal: srcVal,
            
            dstSubject: dstSub,
            dstVal: dstVal
        };

        if (mode === 'mcq') {
            // For MCQ, target chapter name is needed
            const dstDropdown = document.getElementById('dst-chapter');
            payload.dstChapterName = dstDropdown.options[dstDropdown.selectedIndex].text;
        } else {
            // For CQ, target name is needed
            const dstDropdown = document.getElementById('dst-chapter');
            payload.dstChapterName = dstDropdown.options[dstDropdown.selectedIndex].text;
        }

        moveBtn.disabled = true;
        moveBtn.innerHTML = '<span class="spinner"></span> স্থানান্তর হচ্ছে...';

        try {
            const res = await fetch('/api/move-any-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (res.ok && result.success) {
                showToast("প্রশ্নটি সফলভাবে স্থানান্তরিত হয়েছে! 🎉");
                // Remove question from local list and re-render
                questions = questions.filter(q => q.id !== selectedQuestion.id);
                selectedQuestion = null;
                renderQuestions();
            } else {
                throw new Error(result.error || "Failed to move question");
            }
        } catch (err) {
            console.error(err);
            showToast("স্থানান্তর ব্যর্থ হয়েছে: " + err.message, true);
        } finally {
            moveBtn.disabled = true;
            moveBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> স্থানান্তর করুন (Move Question)';
        }
    }

    // Event Listeners
    qtypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            mode = e.target.value;
            updateSourceSubOptions();
            updateDestinationSubOptions();
        });
    });

    srcSubject.addEventListener('change', updateSourceSubOptions);
    srcChapter.addEventListener('change', loadQuestionsList);
    dstSubject.addEventListener('change', updateDestinationSubOptions);
    
    searchInput.addEventListener('input', renderQuestions);
    moveBtn.addEventListener('click', handleMove);

    // Init
    loadMetadata();
})();
