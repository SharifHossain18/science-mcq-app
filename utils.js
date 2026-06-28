const UTILS = {
  SUBJECT_META: {
    'Physics 1st Paper':  { bn: 'পদার্থবিজ্ঞান ১ম পত্র', icon: 'fa-solid fa-atom',                color: 'linear-gradient(135deg, #6ba5d6 0%, #3a75c4 100%)', shadow: 'rgba(58,117,196,0.35)' },
    'Physics 2nd Paper':  { bn: 'পদার্থবিজ্ঞান ২য় পত্র', icon: 'fa-solid fa-bolt',                color: 'linear-gradient(135deg, #9b86d9 0%, #684ca3 100%)', shadow: 'rgba(104,76,163,0.35)' },
    'Chemistry 1st Paper':{ bn: 'রসায়ন ১ম পত্র',         icon: 'fa-solid fa-flask',               color: 'linear-gradient(135deg, #64c2b2 0%, #308f80 100%)', shadow: 'rgba(48,143,128,0.35)' },
    'Chemistry 2nd Paper':{ bn: 'রসায়ন ২য় পত্র',         icon: 'fa-solid fa-vial',                color: 'linear-gradient(135deg, #e57c82 0%, #b84349 100%)', shadow: 'rgba(184,67,73,0.35)'  },
    'Math 1st Paper':     { bn: 'উচ্চতর গণিত ১ম পত্র',   icon: 'fa-solid fa-square-root-variable', color: 'linear-gradient(135deg, #f5a65d 0%, #c97322 100%)', shadow: 'rgba(201,115,34,0.35)' },
    'Math 2nd Paper':     { bn: 'উচ্চতর গণিত ২য় পত্র',   icon: 'fa-solid fa-infinity',            color: 'linear-gradient(135deg, #74b37d 0%, #44804c 100%)', shadow: 'rgba(68,128,76,0.35)'  },
    'Biology 1st Paper':  { bn: 'জীববিজ্ঞান ১ম পত্র',     icon: 'fa-solid fa-leaf',                color: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)', shadow: 'rgba(22,163,74,0.35)' },
    'Biology 2nd Paper':  { bn: 'জীববিজ্ঞান ২য় পত্র',     icon: 'fa-solid fa-leaf',                color: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)', shadow: 'rgba(13,148,136,0.35)' },
    'ICT':                { bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: 'fa-solid fa-microchip',            color: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', shadow: 'rgba(234,88,12,0.35)' },
    'Bangla 1st Paper':   { bn: 'বাংলা ১ম পত্র',           icon: 'fa-solid fa-book',                color: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', shadow: 'rgba(219,39,119,0.35)' },
    'Bangla 2nd Paper':   { bn: 'বাংলা ২য় পত্র',           icon: 'fa-solid fa-book-open',           color: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', shadow: 'rgba(124,58,237,0.35)' },
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
  getProfilePhoto() {
    try { return localStorage.getItem('lumen_profile_photo'); } catch { return null; }
  },
  saveProfilePhoto(dataUrl) {
    try { localStorage.setItem('lumen_profile_photo', dataUrl); } catch {}
  },
  renderProfilePhoto() {
    const photo = this.getProfilePhoto();
    document.querySelectorAll('.profile-avatar, .profile-avatar-circle').forEach(el => {
      if (photo) {
        el.innerHTML = `<img src="${photo}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
      } else {
        const p = this.getProfile();
        if (el.innerHTML.includes('<img')) el.innerHTML = p?.name?.charAt(0)?.toUpperCase() || '?';
      }
    });
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
          <label><i class="fa-solid fa-camera"></i> প্রোফাইল ছবি (ঐচ্ছিক)</label>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="profile-avatar-thumb" id="setup-photo-preview" style="width:48px;height:48px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:var(--primary-blue);flex-shrink:0;">?</div>
            <button type="button" class="setup-btn setup-btn-secondary" id="setup-photo-btn" style="flex:1;padding:8px;font-size:0.85rem;">ছবি আপলোড</button>
            <button type="button" class="setup-btn setup-btn-danger" id="setup-photo-remove" style="padding:8px;font-size:0.85rem;display:none;"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <input type="file" id="setup-photo-input" accept="image/*" style="display:none;">
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
    let setupPhotoData = null;
    document.getElementById('setup-photo-btn').addEventListener('click', () => document.getElementById('setup-photo-input').click());
    document.getElementById('setup-photo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setupPhotoData = ev.target.result;
        document.getElementById('setup-photo-preview').innerHTML = `<img src="${setupPhotoData}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        document.getElementById('setup-photo-remove').style.display = '';
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('setup-photo-remove').addEventListener('click', () => {
      setupPhotoData = null;
      document.getElementById('setup-photo-preview').innerHTML = (document.getElementById('setup-name').value.trim().charAt(0).toUpperCase() || '?');
      document.getElementById('setup-photo-remove').style.display = 'none';
      document.getElementById('setup-photo-input').value = '';
    });
    document.getElementById('setup-save').addEventListener('click', () => {
      const name = document.getElementById('setup-name').value.trim();
      if (!name) { this.showToast('অনুগ্রহ করে আপনার নাম লিখুন', 'error'); return; }
      const edu = document.querySelector('input[name="setup-edu"]:checked')?.value || 'HSC';
      const year = document.getElementById('setup-year').value;
      const group = document.querySelector('input[name="setup-group"]:checked')?.value || 'Science';
      this.saveProfile({ name, education: edu, year, group });
      if (setupPhotoData) this.saveProfilePhoto(setupPhotoData);
      else localStorage.removeItem('lumen_profile_photo');
      overlay.remove();
      this.renderProfile();
      this.renderProfilePhoto();
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
          <label><i class="fa-solid fa-camera"></i> প্রোফাইল ছবি (ঐচ্ছিক)</label>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="profile-avatar-thumb" id="settings-photo-preview" style="width:48px;height:48px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:var(--primary-blue);flex-shrink:0;">${(p.name||'?').charAt(0).toUpperCase()}</div>
            <button type="button" class="setup-btn setup-btn-secondary" id="settings-photo-btn" style="flex:1;padding:8px;font-size:0.85rem;">ছবি পরিবর্তন</button>
            <button type="button" class="setup-btn setup-btn-danger" id="settings-photo-remove" style="padding:8px;font-size:0.85rem;">সরান</button>
          </div>
          <input type="file" id="settings-photo-input" accept="image/*" style="display:none;">
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
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color);text-align:center;display:flex;flex-direction:column;gap:8px;">
          <button class="setup-btn setup-btn-secondary" id="settings-download" style="padding:10px;font-size:0.85rem;"><i class="fa-solid fa-circle-info"></i> অফলাইন ব্যবহার সম্পর্কে</button>
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
    const savedPhoto = this.getProfilePhoto();
    if (savedPhoto) {
      document.getElementById('settings-photo-preview').innerHTML = `<img src="${savedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
    document.getElementById('settings-photo-btn').addEventListener('click', () => document.getElementById('settings-photo-input').click());
    document.getElementById('settings-photo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.saveProfilePhoto(ev.target.result);
        document.getElementById('settings-photo-preview').innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        this.renderProfilePhoto();
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('settings-photo-remove').addEventListener('click', () => {
      localStorage.removeItem('lumen_profile_photo');
      document.getElementById('settings-photo-preview').innerHTML = (document.getElementById('settings-name').value.trim().charAt(0).toUpperCase() || '?');
      document.getElementById('settings-photo-input').value = '';
      this.renderProfilePhoto();
    });
    document.getElementById('settings-save').addEventListener('click', () => {
      const name = document.getElementById('settings-name').value.trim();
      if (!name) { this.showToast('অনুগ্রহ করে আপনার নাম লিখুন', 'error'); return; }
      const edu = document.querySelector('input[name="settings-edu"]:checked')?.value || 'HSC';
      const year = document.getElementById('settings-year').value;
      const group = document.querySelector('input[name="settings-group"]:checked')?.value || 'Science';
      this.saveProfile({ name, education: edu, year, group });
      overlay.remove();
      this.renderProfile();
      this.renderProfilePhoto();
      this.showToast('প্রোফাইল আপডেট করা হয়েছে', 'success');
    });
    document.getElementById('settings-download').addEventListener('click', () => {
      overlay.remove();
      this.showDataDownloadFlow();
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
    const icons = { success: '✅', error: '❌', info: '📌' };
    toast.className = `toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '📌'}</span><span>${message}</span>`;
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
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggle && sidebar) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('show', isOpen);
      });
    }

    // Backdrop click closes sidebar
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        backdrop.classList.remove('show');
      });
    }

    // Escape key closes sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
        sidebar.classList.remove('open');
        backdrop?.classList.remove('show');
      }
    });
  },

  closeSidebar() {
    const s = document.getElementById('sidebar');
    const b = document.getElementById('sidebar-backdrop');
    if (s) s.classList.remove('open');
    if (b) b.classList.remove('show');
  },

  initSwipeGestures() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;
    let startX = 0;
    document.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      const threshold = 60;
      if (diff > threshold && startX < 30) {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('show');
      }
      if (diff < -threshold && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
      }
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

  showDataDownloadFlow() {
    this.showToast('প্রতি অধ্যায়ের পাশে ডাউনলোড বাটন ব্যবহার করুন', 'info');
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

  // ── Per-Item Download Management ──
  DOWNLOADED_KEY: 'lumen_downloaded',

  getDownloadedMap() {
    try { return JSON.parse(localStorage.getItem(this.DOWNLOADED_KEY) || '{}'); } catch { return {}; }
  },

  saveDownloadedMap(map) {
    try { localStorage.setItem(this.DOWNLOADED_KEY, JSON.stringify(map)); } catch {}
  },

  isItemDownloaded(key) {
    return !!this.getDownloadedMap()[key];
  },

  markItemDownloaded(key) {
    const map = this.getDownloadedMap();
    map[key] = true;
    this.saveDownloadedMap(map);
  },

  unmarkItemDownloaded(key) {
    const map = this.getDownloadedMap();
    delete map[key];
    this.saveDownloadedMap(map);
  },

  async downloadAndCache(url) {
    const clean = url.split('?')[0];
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      if ('caches' in window) {
        const cache = await caches.open('lumen-data-v6');
        await cache.put(clean, resp.clone());
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CACHE_DATA', urls: [clean] });
        }
      }
      return true;
    } catch (e) {
      console.warn('Download failed:', url, e);
      return false;
    }
  },

  async removeCachedFile(url) {
    const clean = url.split('?')[0];
    if ('caches' in window) {
      const cache = await caches.open('lumen-data-v6');
      await cache.delete(clean);
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'DELETE_CACHED_DATA', url: clean });
      }
    }
  },

  isOnline() {
    return navigator.onLine;
  },

  // ── Install PWA Prompt ──
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
    UTILS.renderProfilePhoto();
  }
  document.querySelectorAll('[data-action="settings"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      UTILS.showSettingsModal();
    });
  });
});
