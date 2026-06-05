document.addEventListener('DOMContentLoaded', () => {

    // 1. Home Subject Card Click Handler → Go to subject hub page
    document.querySelectorAll('.home-subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subject = card.getAttribute('data-subject');
            // Save the selected subject and clear old state
            localStorage.setItem('selectedSubject', subject);
            localStorage.removeItem('selectedChapter');
            localStorage.removeItem('selectedChapterId');
            localStorage.removeItem('selectedYear');
            localStorage.removeItem('selectedBoard');
            localStorage.removeItem('cqSubMode');

            // Keep practiceMode and boardSelectMode if they were set by sidebar
            if (!localStorage.getItem('boardSelectMode')) {
                localStorage.setItem('boardSelectMode', 'mcq');
            }
            if (!localStorage.getItem('practiceMode')) {
                localStorage.setItem('practiceMode', 'chapter');
            }

            window.location.href = 'subject.html';
        });
    });

    // 2. Sidebar Navigation Links
    const sideChapter = document.getElementById('side-chapter');
    if (sideChapter) {
        sideChapter.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('practiceMode', 'chapter');
            localStorage.setItem('boardSelectMode', 'mcq');
            localStorage.removeItem('selectedSubject');
            alert('অনুগ্রহ করে নিচে থেকে একটি বিষয় নির্বাচন করুন।');
        });
    }

    const sideBoard = document.getElementById('side-board');
    if (sideBoard) {
        sideBoard.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('practiceMode', 'board');
            localStorage.setItem('boardSelectMode', 'mcq');
            localStorage.removeItem('selectedSubject');
            alert('অনুগ্রহ করে নিচে থেকে একটি বিষয় নির্বাচন করুন।');
        });
    }

    const sideCq = document.getElementById('side-cq');
    if (sideCq) {
        sideCq.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('practiceMode', 'cq');
            localStorage.setItem('boardSelectMode', 'cq');
            localStorage.removeItem('selectedSubject');
            alert('অনুগ্রহ করে নিচে থেকে একটি বিষয় নির্বাচন করুন।');
        });
    }

    // 3. Mobile Sidebar Hamburger Menu Toggle
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking main-workspace area on mobile
    document.querySelector('.main-workspace').addEventListener('click', (e) => {
        if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) {
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
});

// Service Worker registration is handled via sw-register.js globally
