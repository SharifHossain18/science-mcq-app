const UTILS = {
  SUBJECT_META: {
    'Physics 1st Paper':  { bn: 'পদার্থবিজ্ঞান ১ম পত্র', icon: 'fa-solid fa-atom',                color: 'linear-gradient(135deg, #6ba5d6 0%, #3a75c4 100%)', shadow: 'rgba(58,117,196,0.35)' },
    'Physics 2nd Paper':  { bn: 'পদার্থবিজ্ঞান ২য় পত্র', icon: 'fa-solid fa-bolt',                color: 'linear-gradient(135deg, #9b86d9 0%, #684ca3 100%)', shadow: 'rgba(104,76,163,0.35)' },
    'Chemistry 1st Paper':{ bn: 'রসায়ন ১ম পত্র',         icon: 'fa-solid fa-flask',               color: 'linear-gradient(135deg, #64c2b2 0%, #308f80 100%)', shadow: 'rgba(48,143,128,0.35)' },
    'Chemistry 2nd Paper':{ bn: 'রসায়ন ২য় পত্র',         icon: 'fa-solid fa-vial',                color: 'linear-gradient(135deg, #e57c82 0%, #b84349 100%)', shadow: 'rgba(184,67,73,0.35)'  },
    'Math 1st Paper':     { bn: 'উচ্চতর গণিত ১ম পত্র',   icon: 'fa-solid fa-square-root-variable', color: 'linear-gradient(135deg, #f5a65d 0%, #c97322 100%)', shadow: 'rgba(201,115,34,0.35)' },
    'Math 2nd Paper':     { bn: 'উচ্চতর গণিত ২য় পত্র',   icon: 'fa-solid fa-infinity',            color: 'linear-gradient(135deg, #74b37d 0%, #44804c 100%)', shadow: 'rgba(68,128,76,0.35)'  },
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
};

async function checkCacheForSubject(subject) {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open('lumen-v45');
    const clean = subject.replace(/\s+/g, '_');
    const match = await cache.match(`data/chapters/${clean}_ch_2.json`);
    return !!match;
  } catch { return false; }
}
