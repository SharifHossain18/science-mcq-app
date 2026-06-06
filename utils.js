const UTILS = {
  SUBJECT_META: {
    'Physics 1st Paper':  { bn: 'পদার্থবিজ্ঞান ১ম পত্র', icon: 'fa-solid fa-atom',                color: 'linear-gradient(135deg, #6ba5d6 0%, #3a75c4 100%)', shadow: 'rgba(58,117,196,0.35)' },
    'Physics 2nd Paper':  { bn: 'পদার্থবিজ্ঞান ২য় পত্র', icon: 'fa-solid fa-bolt',                color: 'linear-gradient(135deg, #9b86d9 0%, #684ca3 100%)', shadow: 'rgba(104,76,163,0.35)' },
    'Chemistry 1st Paper':{ bn: 'রসায়ন ১ম পত্র',         icon: 'fa-solid fa-flask',               color: 'linear-gradient(135deg, #64c2b2 0%, #308f80 100%)', shadow: 'rgba(48,143,128,0.35)' },
    'Chemistry 2nd Paper':{ bn: 'রসায়ন ২য় পত্র',         icon: 'fa-solid fa-vial',                color: 'linear-gradient(135deg, #e57c82 0%, #b84349 100%)', shadow: 'rgba(184,67,73,0.35)'  },
    'Math 1st Paper':     { bn: 'উচ্চতর গণিত ১ম পত্র',   icon: 'fa-solid fa-square-root-variable', color: 'linear-gradient(135deg, #f5a65d 0%, #c97322 100%)', shadow: 'rgba(201,115,34,0.35)' },
    'Math 2nd Paper':     { bn: 'উচ্চতর গণিত ২য় পত্র',   icon: 'fa-solid fa-infinity',            color: 'linear-gradient(135deg, #74b37d 0%, #44804c 100%)', shadow: 'rgba(68,128,76,0.35)'  },
  },

  // ── User Profile ──
  getProfile() {
    try { return JSON.parse(localStorage.getItem('lumen_profile')); } catch { return null; }
  },
  saveProfile(p) {
    try { localStorage.setItem('lumen_profile', JSON.stringify(p)); } catch {}
  },
  renderProfile() {
    const p = this.getProfile();
    if (!p) return;
    document.querySelectorAll('.profile-name').forEach(el => el.textContent = p.name);
    document.querySelectorAll('.profile-subtitle').forEach(el => el.textContent = p.education.toLowerCase());
    document.querySelectorAll('.profile-user-name').forEach(el => el.textContent = p.name);
    document.querySelectorAll('.profile-user-class').forEach(el => el.textContent = `${p.group} • ${p.education} ${p.year}`);
  },
  showSetupModal() {
    if (this.getProfile()) return;
    const overlay = document.createElement('div');
    overlay.id = 'lumen-setup-overlay';
    overlay.innerHTML = `
      <div class="setup-modal">
        <div class="setup-icon"><i class="fa-solid fa-user-astronaut"></i></div>
        <h2 class="setup-title">LUMEN-এ স্বাগতম!</h2>
        <p class="setup-subtitle">আপনার তথ্য দিন</p>
        <div class="setup-field">
          <label><i class="fa-solid fa-user"></i> আপনার নাম</label>
          <input class="setup-input" id="setup-name" placeholder="যেমন: Sujon" autocomplete="off">
        </div>
        <div class="setup-field">
          <label><i class="fa-solid fa-graduation-cap"></i> শিক্ষা স্তর</label>
          <div class="setup-radio-group" id="setup-edu">
            <label class="setup-radio"><input type="radio" name="setup-edu" value="SSC"><span>SSC</span></label>
            <label class="setup-radio"><input type="radio" name="setup-edu" value="HSC" checked><span>HSC</span></label>
          </div>
        </div>
        <div class="setup-field">
          <label><i class="fa-solid fa-calendar"></i> বছর</label>
          <select class="setup-input" id="setup-year"></select>
        </div>
        <div class="setup-field">
          <label><i class="fa-solid fa-flask"></i> গ্রুপ</label>
          <div class="setup-radio-group" id="setup-group">
            <label class="setup-radio"><input type="radio" name="setup-group" value="Science" checked><span>বিজ্ঞান</span></label>
            <label class="setup-radio"><input type="radio" name="setup-group" value="Arts"><span>মানবিক</span></label>
            <label class="setup-radio"><input type="radio" name="setup-group" value="Commerce"><span>বাণিজ্য</span></label>
          </div>
        </div>
        <button class="setup-btn" id="setup-save">শুরু করুন</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const yearSel = document.getElementById('setup-year');
    const cy = new Date().getFullYear();
    for (let y = cy + 1; y >= cy - 4; y--) {
      const opt = document.createElement('option');
      opt.value = String(y); opt.textContent = String(y);
      if (y === cy) opt.selected = true;
      yearSel.appendChild(opt);
    }
    document.getElementById('setup-save').addEventListener('click', () => {
      const name = document.getElementById('setup-name').value.trim();
      if (!name) { this.showToast('অনুগ্রহ করে আপনার নাম লিখুন', 'error'); return; }
      const edu = document.querySelector('input[name="setup-edu"]:checked')?.value || 'HSC';
      const year = document.getElementById('setup-year').value;
      const group = document.querySelector('input[name="setup-group"]:checked')?.value || 'Science';
      this.saveProfile({ name, education: edu, year, group });
      overlay.remove();
      this.renderProfile();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },
  showSettingsModal() {
    const p = this.getProfile() || { name: '', education: 'HSC', year: String(new Date().getFullYear()), group: 'Science' };
    const overlay = document.createElement('div');
    overlay.id = 'lumen-settings-overlay';
    overlay.innerHTML = `
      <div class="setup-modal">
        <div class="setup-icon"><i class="fa-solid fa-gear"></i></div>
        <h2 class="setup-title">সেটিংস</h2>
        <p class="setup-subtitle">আপনার প্রোফাইল তথ্য পরিবর্তন করুন</p>
        <div class="setup-field">
          <label><i class="fa-solid fa-user"></i> আপনার নাম</label>
          <input class="setup-input" id="settings-name" value="${p.name}" autocomplete="off">
        </div>
        <div class="setup-field">
          <label><i class="fa-solid fa-graduation-cap"></i> শিক্ষা স্তর</label>
          <div class="setup-radio-group" id="settings-edu">
            <label class="setup-radio"><input type="radio" name="settings-edu" value="SSC"${p.education === 'SSC' ? ' checked' : ''}><span>SSC</span></label>
            <label class="setup-radio"><input type="radio" name="settings-edu" value="HSC"${p.education === 'HSC' ? ' checked' : ''}><span>HSC</span></label>
          </div>
        </div>
        <div class="setup-field">
          <label><i class="fa-solid fa-calendar"></i> বছর</label>
          <select class="setup-input" id="settings-year"></select>
        </div>
        <div class="setup-field">
          <label><i class="fa-solid fa-flask"></i> গ্রুপ</label>
          <div class="setup-radio-group" id="settings-group">
            <label class="setup-radio"><input type="radio" name="settings-group" value="Science"${p.group === 'Science' ? ' checked' : ''}><span>বিজ্ঞান</span></label>
            <label class="setup-radio"><input type="radio" name="settings-group" value="Arts"${p.group === 'Arts' ? ' checked' : ''}><span>মানবিক</span></label>
            <label class="setup-radio"><input type="radio" name="settings-group" value="Commerce"${p.group === 'Commerce' ? ' checked' : ''}><span>বাণিজ্য</span></label>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:8px;">
          <button class="setup-btn" id="settings-save" style="flex:1;">সংরক্ষণ করুন</button>
          <button class="setup-btn setup-btn-secondary" id="settings-close" style="flex:1;">বাতিল</button>
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color);text-align:center;">
          <button class="setup-btn setup-btn-danger" id="settings-reset" style="padding:10px;font-size:0.85rem;">অ্যাপ রিসেট করুন</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const yearSel = document.getElementById('settings-year');
    const cy = new Date().getFullYear();
    for (let y = cy + 1; y >= cy - 4; y--) {
      const opt = document.createElement('option');
      opt.value = String(y); opt.textContent = String(y);
      if (String(y) === p.year) opt.selected = true;
      yearSel.appendChild(opt);
    }
    document.getElementById('settings-save').addEventListener('click', () => {
      const name = document.getElementById('settings-name').value.trim();
      if (!name) { this.showToast('অনুগ্রহ করে আপনার নাম লিখুন', 'error'); return; }
      const edu = document.querySelector('input[name="settings-edu"]:checked')?.value || 'HSC';
      const year = document.getElementById('settings-year').value;
      const group = document.querySelector('input[name="settings-group"]:checked')?.value || 'Science';
      this.saveProfile({ name, education: edu, year, group });
      overlay.remove();
      this.renderProfile();
      this.showToast('প্রোফাইল আপডেট করা হয়েছে', 'success');
    });
    document.getElementById('settings-close').addEventListener('click', () => overlay.remove());
    document.getElementById('settings-reset').addEventListener('click', () => {
      if (!confirm('সমস্ত ডেটা মুছে আবার শুরু করবেন? (All data will be cleared)')) return;
      localStorage.clear();
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
      window.location.reload();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  showToast(message, type = 'info', duration = 4000) {
    let toast = document.getElementById('lumen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lumen-toast';
      document.body.appendChild(toast);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.className = `toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), duration);
  },

  updateSidebarActive(mode) {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    const map = { chapter: 'side-chapter', board: 'side-board', cq: 'side-cq' };
    const el = document.getElementById(map[mode]);
    if (el) el.classList.add('active');
  },

  closeSidebar() {
    const s = document.getElementById('sidebar');
    if (s && s.classList.contains('open')) s.classList.remove('open');
  },

  clearSelections() {
    ['selectedSubject','selectedChapter','selectedChapterId','selectedYear','selectedBoard'].forEach(k => localStorage.removeItem(k));
  },

  initSidebarNav(handlers) {
    const links = {
      'side-chapter': () => { localStorage.setItem('practiceMode','chapter'); localStorage.setItem('boardSelectMode','mcq'); this.clearSelections(); },
      'side-board':   () => { localStorage.setItem('practiceMode','board'); localStorage.setItem('boardSelectMode','mcq'); this.clearSelections(); },
      'side-cq':      () => { localStorage.setItem('practiceMode','cq'); localStorage.setItem('boardSelectMode','cq'); localStorage.removeItem('cqSubMode'); this.clearSelections(); },
    };
    Object.entries(links).forEach(([id, action]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeSidebar();
          action();
          if (handlers && handlers[id]) handlers[id]();
        });
      }
    });
  },

  initMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menu-toggle');
    if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.querySelector('.main-workspace')?.addEventListener('click', (e) => {
      if (!e.target.closest('#menu-toggle') && !e.target.closest('#sidebar')) this.closeSidebar();
    });
  },

  initSwipeGestures() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    let startX = 0;
    document.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      const threshold = 80;
      if (diff > threshold && startX < 40) { sidebar.classList.add('open'); }
      if (diff < -threshold && sidebar.classList.contains('open')) { sidebar.classList.remove('open'); }
    }, { passive: true });
  },

  renderBreadcrumbs(items) {
    const container = document.getElementById('breadcrumb-path');
    if (!container) return;
    container.innerHTML = '';
    items.forEach((item, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.innerHTML = '<i class="fa-solid fa-chevron-right" style="font-size:0.7rem;"></i>';
        container.appendChild(sep);
      }
      const span = document.createElement('span');
      span.className = 'breadcrumb-item' + (item.active ? ' active' : '');
      span.textContent = item.label;
      if (!item.active && item.onClick) span.addEventListener('click', item.onClick);
      container.appendChild(span);
    });
  },

  goHome() { window.location.href = 'index.html'; },
  goTo(url) { window.location.href = url; },

  // ── Progress Tracking ──
  getProgress(subject, chapter) {
    try { return JSON.parse(localStorage.getItem('lumen_progress') || '{}'); } catch { return {}; }
  },
  saveProgress(data) {
    try { localStorage.setItem('lumen_progress', JSON.stringify(data)); } catch {}
  },
  recordAnswer(subject, chapter, correct, total) {
    const data = this.getProgress();
    const key = `${subject}|${chapter}`;
    if (!data[key]) data[key] = { correct: 0, total: 0 };
    data[key].correct += correct ? 1 : 0;
    data[key].total += total;
    this.saveProgress(data);
  },
  getChapterProgress(subject, chapter) {
    const data = this.getProgress();
    return data[`${subject}|${chapter}`] || { correct: 0, total: 0 };
  },

  // ── Bookmarks ──
  getBookmarks() {
    try { return JSON.parse(localStorage.getItem('lumen_bookmarks') || '[]'); } catch { return []; }
  },
  saveBookmarks(bookmarks) {
    try { localStorage.setItem('lumen_bookmarks', JSON.stringify(bookmarks)); } catch {}
  },
  toggleBookmark(questionId) {
    const bookmarks = this.getBookmarks();
    const idx = bookmarks.indexOf(questionId);
    if (idx === -1) bookmarks.push(questionId);
    else bookmarks.splice(idx, 1);
    this.saveBookmarks(bookmarks);
    return idx === -1;
  },
  isBookmarked(questionId) {
    return this.getBookmarks().includes(questionId);
  },

  // ── Install PWA Prompt ──
  initInstallPrompt() {
    let deferredPrompt = null;
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.innerHTML = `
      <div class="install-banner-content">
        <div class="install-banner-icon"><i class="fa-solid fa-mobile-screen-button"></i></div>
        <div class="install-banner-text">
          <strong>LUMEN অ্যাপ ইন্সটল করুন</strong>
          <span>অফলাইন ব্যবহারের জন্য আপনার হোম স্ক্রিনে যোগ করুন</span>
        </div>
        <button class="install-banner-btn" id="install-btn">ইন্সটল</button>
        <button class="install-banner-close" id="install-dismiss"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
    banner.style.display = 'none';
    document.body.appendChild(banner);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!localStorage.getItem('install_dismissed')) banner.style.display = 'block';
    });

    document.getElementById('install-btn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') { banner.style.display = 'none'; }
      deferredPrompt = null;
    });

    document.getElementById('install-dismiss').addEventListener('click', () => {
      banner.style.display = 'none';
      localStorage.setItem('install_dismissed', '1');
    });

    window.addEventListener('appinstalled', () => { banner.style.display = 'none'; });
  },

  // ── Render progress bar on chapter cards ──
  renderProgressBar(subject, chapter) {
    const prog = this.getChapterProgress(subject, chapter);
    if (prog.total === 0) return '';
    const pct = Math.round((prog.correct / prog.total) * 100);
    return `<div class="subj-progress-row">
      <div class="subj-progress-bar-wrap"><div class="subj-progress-bar-fill" style="width:${pct}%"></div></div>
      <span class="subj-progress-text">${prog.correct}/${prog.total}</span>
    </div>`;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const p = UTILS.getProfile();
  if (!p) {
    if (document.getElementById('lumen-setup-overlay')) return;
    UTILS.showSetupModal();
  } else {
    UTILS.renderProfile();
  }
  document.querySelectorAll('[data-action="settings"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      UTILS.showSettingsModal();
    });
  });
});
