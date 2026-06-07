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
          <button class="setup-btn setup-btn-secondary" id="settings-download" style="padding:10px;font-size:0.85rem;"><i class="fa-solid fa-download"></i> সব ডাটা ডাউনলোড করুন</button>
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

  showDataDownloadFlow() {
    if (this._downloading) return;
    this._downloading = true;
    const overlay = this.showDownloadOverlay();
    this.startDataDownload((progress) => {
      this.updateDownloadOverlay(progress);
      if (progress.done) {
        setTimeout(() => overlay.remove(), 2000);
        this._downloading = false;
        const banner = document.getElementById('data-download-banner');
        if (banner) banner.style.display = 'none';
        this.showToast('সমস্ত ডাটা ডাউনলোড সম্পন্ন!', 'success', 5000);
      }
      if (progress.error) {
        this._downloading = false;
      }
    }).catch(() => {
      this._downloading = false;
    });
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

  // ── Offline Data Pre-cache ──
  DATA_PRECACHE_FLAG: 'lumen_data_precached',
  DATA_RESUME_KEY: 'lumen_dl_index',

  isDataFullyCached() {
    return localStorage.getItem(this.DATA_PRECACHE_FLAG) === 'true';
  },

  markDataCached() {
    localStorage.setItem(this.DATA_PRECACHE_FLAG, 'true');
    localStorage.removeItem(this.DATA_RESUME_KEY);
  },

  clearDataCacheFlag() {
    localStorage.removeItem(this.DATA_PRECACHE_FLAG);
    localStorage.removeItem(this.DATA_RESUME_KEY);
  },

  async startDataDownload(onProgress) {
    const resp = await fetch('./data/precache.json');
    const files = await resp.json();
    const total = files.length;
    let startIdx = 0;
    const saved = localStorage.getItem(this.DATA_RESUME_KEY);
    if (saved) startIdx = parseInt(saved, 10);

    for (let i = startIdx; i < total; i++) {
      const file = files[i];
      try {
        const r = await fetch(file);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        localStorage.setItem(this.DATA_RESUME_KEY, String(i + 1));
        onProgress({ percent: Math.round(((i + 1) / total) * 100), file, current: i + 1, total });
      } catch (e) {
        console.warn('Download failed, will retry:', file, e);
        onProgress({ percent: Math.round((i / total) * 100), file, current: i, total, error: true });
        await new Promise(r => setTimeout(r, 1000));
        i--;
        continue;
      }
    }
    this.markDataCached();
    onProgress({ percent: 100, file: '', current: total, total, done: true });
  },

  showDownloadOverlay() {
    const existing = document.getElementById('lumen-dl-overlay');
    if (existing) return existing;

    const overlay = document.createElement('div');
    overlay.id = 'lumen-dl-overlay';
    overlay.innerHTML = `
      <div class="loading-overlay" style="display:flex;position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:var(--bg-main,#0f172a);flex-direction:column;align-items:center;justify-content:center;padding:24px;">
        <div class="loading-spinner" style="width:48px;height:48px;border:4px solid var(--border-color,#334155);border-top-color:var(--primary,#3b82f6);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:20px;"></div>
        <div style="font-size:1.2rem;font-weight:700;color:var(--text-main,#f8fafc);margin-bottom:6px;">ডাটা ডাউনলোড হচ্ছে...</div>
        <div style="font-size:0.85rem;color:var(--text-muted,#94a3b8);margin-bottom:20px;text-align:center;padding:0 16px;" id="dl-subtitle">প্রথমবার ব্যবহারের জন্য সমস্ত ডাটা ডাউনলোড হচ্ছে। এটি কিছু সময় নিতে পারে। অনুগ্রহ করে সংযোগ চালু রাখুন।</div>
        <div class="loading-progress-bar" style="width:80%;max-width:400px;height:10px;background:var(--border-color,#334155);border-radius:8px;overflow:hidden;margin-bottom:10px;">
          <div id="dl-progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg,var(--primary,#3b82f6),var(--primary-hover,#2563eb));border-radius:8px;transition:width 0.3s;"></div>
        </div>
        <div style="font-size:0.85rem;color:var(--text-muted,#94a3b8);" id="dl-status">০%</div>
        <div style="font-size:0.75rem;color:var(--text-muted,#94a3b8);margin-top:4px;" id="dl-filename"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  },

  updateDownloadOverlay(progress) {
    const fill = document.getElementById('dl-progress-fill');
    const status = document.getElementById('dl-status');
    const fn = document.getElementById('dl-filename');
    const sub = document.getElementById('dl-subtitle');
    if (fill) fill.style.width = progress.percent + '%';
    if (status) status.textContent = progress.percent + '% (' + progress.current + '/' + progress.total + ')';
    if (fn) {
      const parts = progress.file.split('/');
      fn.textContent = progress.done ? 'সম্পন্ন!' : (parts.pop() || '');
    }
    if (sub && progress.done) sub.textContent = 'সমস্ত ডাটা ডাউনলোড সম্পন্ন! আপনি এখন অফলাইনে ব্যবহার করতে পারেন।';
    if (progress.error && fn) fn.textContent = 'পুনরায় চেষ্টা করা হচ্ছে: ' + (progress.file.split('/').pop() || '');
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
