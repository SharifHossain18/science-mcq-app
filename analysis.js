const COLORS = ['#0284c7','#7c3aed','#059669','#dc2626','#d97706','#db2777','#0891b2','#ea580c','#65a30d','#4f46e5','#be123c'];
const SUBJECTS = ['Physics 1st Paper','Physics 2nd Paper','Chemistry 1st Paper','Chemistry 2nd Paper','Math 1st Paper','Math 2nd Paper','Biology 1st Paper','Biology 2nd Paper','ICT','Bangla 1st Paper','Bangla 2nd Paper'];
const SUBJ_BN = {
  'Physics 1st Paper':'পদার্থ ১ম','Physics 2nd Paper':'পদার্থ ২য়','Chemistry 1st Paper':'রসায়ন ১ম','Chemistry 2nd Paper':'রসায়ন ২য়',
  'Math 1st Paper':'গণিত ১ম','Math 2nd Paper':'গণিত ২য়','Biology 1st Paper':'জীববিজ্ঞান ১ম','Biology 2nd Paper':'জীববিজ্ঞান ২য়',
  'ICT':'আইসিটি','Bangla 1st Paper':'বাংলা ১ম','Bangla 2nd Paper':'বাংলা ২য়'
};

let state = { subject: 'all' };
let meta = null;
let analysisResults = null;

document.addEventListener('DOMContentLoaded', () => {
  UTILS.initMobileMenu();
  UTILS.initSwipeGestures();
  initDarkMode();
  loadAndAnalyze();
});

function initDarkMode() {
  const saved = localStorage.getItem('lumenDarkMode');
  if (saved === 'true') document.documentElement.setAttribute('data-theme', 'dark');
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('lumenDarkMode', 'false');
        btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('lumenDarkMode', 'true');
        btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      }
    });
    if (localStorage.getItem('lumenDarkMode') === 'true') btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  });
}

async function loadAndAnalyze() {
  try {
    const metaResp = await fetch('data/meta.json?t=' + Date.now());
    meta = await metaResp.json();

    const allChapterData = {};
    const allBoardData = {};
    const results = {};

    for (const subject of SUBJECTS) {
      results[subject] = {
        total: 0,
        chapters: {},
        boards: {},
        years: {},
        answerDist: { a: 0, b: 0, c: 0, d: 0 },
        withExplanation: 0,
        withoutExplanation: 0,
        generalCount: 0,
        chapterCounts: {},
        boardYearCounts: {},
        questions: []
      };
    }

    const totalFiles = SUBJECTS.reduce((sum, s) => {
      const info = meta[s];
      return sum + (info ? info.chapters.length : 0);
    }, 0);
    let loaded = 0;

    for (const subject of SUBJECTS) {
      const info = meta[subject];
      if (!info) continue;
      const cleanSubject = subject.replace(/\s+/g, '_');

      for (const ch of info.chapters) {
        const filePath = `data/chapters/${cleanSubject}_${ch.id}.json`;
        try {
          const resp = await fetch(filePath + '?t=' + Date.now());
          if (!resp.ok) { loaded++; continue; }
          const data = await resp.json();
          loaded++;
          updateProgress(loaded, totalFiles);

          if (!Array.isArray(data)) continue;
          for (const q of data) {
            if (!q || !q.subject) continue;
            const sub = q.subject;
            if (!results[sub]) continue;
            results[sub].total++;
            results[sub].questions.push(q);

            const chName = q.chapter || 'Unknown';
            results[sub].chapters[chName] = (results[sub].chapters[chName] || 0) + 1;

            const yr = String(q.year || '?');
            const bd = q.board || '?';
            if (!results[sub].boards[yr]) results[sub].boards[yr] = {};
            results[sub].boards[yr][bd] = (results[sub].boards[yr][bd] || 0) + 1;
            results[sub].years[yr] = (results[sub].years[yr] || 0) + 1;

            if (q.answer) {
              const ans = q.answer.toString().trim().toLowerCase();
              if (['a','b','c','d'].includes(ans)) results[sub].answerDist[ans]++;
            }

            if (q.explanation && q.explanation.trim() && q.explanation !== '<p><br></p>') {
              results[sub].withExplanation++;
            } else {
              results[sub].withoutExplanation++;
            }
          }
        } catch (e) {
          loaded++;
          updateProgress(loaded, totalFiles);
        }
      }
    }

    results._meta = meta;
    results._subjects = SUBJECTS;
    analysisResults = results;
    render(results);
  } catch (err) {
    document.getElementById('analysis-loading').innerHTML = `
      <i class="fa-solid fa-circle-exclamation" style="font-size:2.5rem;color:#ef4444;margin-bottom:15px;"></i>
      <p style="font-weight:600;">ডাটা লোড করতে ব্যর্থ!</p>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-top:5px;">${err.message}</p>`;
  }
}

function updateProgress(current, total) {
  const el = document.getElementById('analysis-loading');
  if (!el) return;
  const pct = Math.round((current / total) * 100);
  el.innerHTML = `
    <div class="spinner"></div>
    <p>ডাটা লোড হচ্ছে... ${pct}%</p>
    <p style="font-size:0.8rem;margin-top:6px;">${current}/${total} ফাইল স্ক্যান করা হয়েছে</p>
    <div style="width:80%;max-width:400px;height:6px;background:var(--border-color);border-radius:8px;overflow:hidden;margin-top:12px;">
      <div style="width:${pct}%;height:100%;background:var(--primary-blue);border-radius:8px;transition:width 0.3s;"></div>
    </div>`;
}

function render(results) {
  document.getElementById('analysis-loading').style.display = 'none';
  const container = document.getElementById('analysis-content');
  container.style.display = 'block';

  const allSubjects = results._subjects;
  const grandTotal = allSubjects.reduce((s, sub) => s + (results[sub] ? results[sub].total : 0), 0);
  const totalChEx = allSubjects.reduce((s, sub) => s + (results[sub] ? Object.keys(results[sub].chapters).length : 0), 0);
  const totalExplained = allSubjects.reduce((s, sub) => s + (results[sub] ? results[sub].withExplanation : 0), 0);
  const totalNoExplain = allSubjects.reduce((s, sub) => s + (results[sub] ? results[sub].withoutExplanation : 0), 0);
  const totalGeneral = allSubjects.reduce((s, sub) => s + (results[sub] ? (results[sub].chapters['General'] || 0) : 0), 0);

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${grandTotal.toLocaleString()}</div><div class="stat-label">মোট MCQ প্রশ্ন</div><div class="stat-sub">${totalChEx} টি অধ্যায় জুড়ে</div></div>
      <div class="stat-card"><div class="stat-value">${allSubjects.length}</div><div class="stat-label">বিষয় (Subjects)</div><div class="stat-sub">${allSubjects.filter(s => results[s] && results[s].total > 0).length}টিতে প্রশ্ন আছে</div></div>
      <div class="stat-card"><div class="stat-value">${totalExplained.toLocaleString()}</div><div class="stat-label">ব্যাখ্যা সহ প্রশ্ন</div><div class="stat-sub">${grandTotal ? Math.round(totalExplained/grandTotal*100) : 0}% covered</div></div>
      <div class="stat-card"><div class="stat-value">${totalGeneral.toLocaleString()}</div><div class="stat-label">General অধ্যায়ে প্রশ্ন</div><div class="stat-sub">${grandTotal ? Math.round(totalGeneral/grandTotal*100) : 0}% uncategorized</div></div>
      <div class="stat-card"><div class="stat-value">${totalNoExplain.toLocaleString()}</div><div class="stat-label">ব্যাখ্যা নেই</div><div class="stat-sub">ম্যানুয়াল রিভিউ প্রয়োজন</div></div>
    </div>

    <div class="tab-bar" id="tab-bar">
      <button class="tab-btn active" data-tab="overview"><i class="fa-solid fa-gauge-high"></i> ওভারভিউ</button>
      <button class="tab-btn" data-tab="chapters"><i class="fa-regular fa-folder-open"></i> অধ্যায়</button>
      <button class="tab-btn" data-tab="boards"><i class="fa-solid fa-building-columns"></i> বোর্ড/বছর</button>
      <button class="tab-btn" data-tab="quality"><i class="fa-solid fa-check-double"></i> গুণগত মান</button>
      <button class="tab-btn" data-tab="coverage"><i class="fa-solid fa-table-cells-large"></i> কভারেজ</button>
    </div>

    <div id="tab-overview" class="tab-content active"></div>
    <div id="tab-chapters" class="tab-content"></div>
    <div id="tab-boards" class="tab-content"></div>
    <div id="tab-quality" class="tab-content"></div>
    <div id="tab-coverage" class="tab-content"></div>
  `;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  renderOverviewTab(results);
  renderChaptersTab(results);
  renderBoardsTab(results);
  renderQualityTab(results);
  renderCoverageTab(results);
}

function renderOverviewTab(results) {
  const el = document.getElementById('tab-overview');

  let html = `<div class="analysis-card"><h4><i class="fa-solid fa-chart-simple"></i>বিষয়ভিত্তিক প্রশ্ন সংখ্যা</h4><div class="bar-chart">`;
  const maxQ = Math.max(...results._subjects.map(s => results[s] ? results[s].total : 0));
  results._subjects.forEach((s, i) => {
    const r = results[s];
    if (!r) return;
    const pct = maxQ > 0 ? (r.total / maxQ * 100) : 0;
    html += `<div class="bar-row">
      <span class="bar-label"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${COLORS[i % COLORS.length]};margin-right:6px;"></span>${SUBJ_BN[s] || s}</span>
      <div class="bar-track"><div class="bar-fill color-bar-${i % 11}" style="width:${pct}%">${r.total > 0 && pct > 15 ? r.total.toLocaleString() : ''}</div></div>
      <span class="bar-count">${r.total.toLocaleString()}</span>
    </div>`;
  });
  html += `</div></div>`;

  html += `<div class="two-col">
    <div class="analysis-card"><h4><i class="fa-solid fa-chart-donut"></i>বিষয়ভিত্তিক শতাংশ</h4>`;
  const sorted = results._subjects.filter(s => results[s]).sort((a, b) => results[b].total - results[a].total);
  const gt = sorted.reduce((s, sub) => s + results[sub].total, 0);
  sorted.forEach((s, i) => {
    const r = results[s];
    const pct = gt > 0 ? (r.total / gt * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="width:10px;height:10px;border-radius:50%;background:${COLORS[i % COLORS.length]};flex-shrink:0;"></span>
      <span style="flex:1;font-size:0.8rem;">${SUBJ_BN[s] || s}</span>
      <span style="font-size:0.8rem;font-weight:600;">${pct.toFixed(1)}%</span>
      <span style="font-size:0.75rem;color:var(--text-muted);min-width:50px;text-align:right;">${r.total.toLocaleString()}</span>
    </div>`;
  });
  html += `</div>
    <div class="analysis-card"><h4><i class="fa-solid fa-lightbulb"></i>বোর্ড প্রশ্নের বছর</h4><div class="bar-chart">`;
  const yearCounts = {};
  for (const s of results._subjects) {
    const r = results[s];
    if (!r) continue;
    for (const [yr, cnt] of Object.entries(r.years)) {
      yearCounts[yr] = (yearCounts[yr] || 0) + cnt;
    }
  }
  const sortedYears = Object.entries(yearCounts).sort((a, b) => Number(b[0]) - Number(a[0]) || b[1] - a[1]);
  const maxYear = Math.max(...sortedYears.map(y => y[1]));
  sortedYears.forEach(([yr, cnt]) => {
    const pct = maxYear > 0 ? (cnt / maxYear * 100) : 0;
    html += `<div class="bar-row">
      <span class="bar-label">${yr}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,#059669,#34d399);">${pct > 15 ? cnt.toLocaleString() : ''}</div></div>
      <span class="bar-count">${cnt.toLocaleString()}</span>
    </div>`;
  });
  html += `</div></div></div>`;

  el.innerHTML = html;
}

function renderChaptersTab(results) {
  const el = document.getElementById('tab-chapters');
  let html = `<div class="subject-filter-bar" id="ch-filter-bar">
    <button class="active" data-subj="all">সব বিষয়</button>`;
  results._subjects.forEach(s => {
    html += `<button data-subj="${s}">${SUBJ_BN[s] || s}</button>`;
  });
  html += `</div><div id="ch-content">`;
  html += renderChapterContent(results, 'all');
  html += `</div>`;
  el.innerHTML = html;

  el.querySelectorAll('#ch-filter-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('#ch-filter-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('ch-content').innerHTML = renderChapterContent(results, btn.dataset.subj);
    });
  });
}

function renderChapterContent(results, filter) {
  const subjects = filter === 'all' ? results._subjects : [filter];
  let html = '';
  for (const s of subjects) {
    const r = results[s];
    if (!r || r.total === 0) continue;
    const chEntries = Object.entries(r.chapters).sort((a, b) => b[1] - a[1]);
    if (chEntries.length === 0) continue;

    const maxCh = Math.max(...chEntries.map(c => c[1]));
    html += `<div class="analysis-card"><h4><i class="fa-solid fa-book"></i>${SUBJ_BN[s] || s} — অধ্যায়ভিত্তিক বিতরণ (${r.total.toLocaleString()} টি প্রশ্ন)</h4><div class="bar-chart">`;
    chEntries.forEach(([ch, cnt]) => {
      const pct = maxCh > 0 ? (cnt / maxCh * 100) : 0;
      const isGeneral = ch === 'General';
      html += `<div class="bar-row">
        <span class="bar-label" title="${ch}">${isGeneral ? '📦' : ''} ${ch.length > 40 ? ch.substring(0, 40) + '…' : ch}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${isGeneral ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#0284c7,#38bdf8)'};">${pct > 15 ? cnt.toLocaleString() : ''}</div></div>
        <span class="bar-count">${cnt.toLocaleString()}</span>
      </div>`;
    });
    html += `<div class="insight-box"><strong>${r.total.toLocaleString()}</strong> টি প্রশ্ন, <strong>${chEntries.length}</strong> টি অধ্যায়ে বিন্যস্ত।${r.chapters['General'] ? ` General অধ্যায়ে <strong>${r.chapters['General'].toLocaleString()}</strong> টি অপ্রতিক্রিয়া প্রশ্ন আছে।` : ''}</div>`;
    html += `</div></div>`;
  }
  if (!html) html = `<div class="analysis-card"><p style="color:var(--text-muted);text-align:center;">এই বিষয়ে কোনো প্রশ্ন নেই</p></div>`;
  return html;
}

function renderBoardsTab(results) {
  const el = document.getElementById('tab-boards');
  let html = `<div class="subject-filter-bar" id="board-filter-bar">
    <button class="active" data-subj="all">সব বিষয়</button>`;
  results._subjects.forEach(s => {
    html += `<button data-subj="${s}">${SUBJ_BN[s] || s}</button>`;
  });
  html += `</div><div id="board-content">`;
  html += renderBoardContent(results, 'all');
  html += `</div>`;
  el.innerHTML = html;

  el.querySelectorAll('#board-filter-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('#board-filter-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('board-content').innerHTML = renderBoardContent(results, btn.dataset.subj);
    });
  });
}

function renderBoardContent(results, filter) {
  const subjects = filter === 'all' ? results._subjects : [filter];
  let html = '';
  for (const s of subjects) {
    const r = results[s];
    if (!r || r.total === 0) continue;
    const years = Object.keys(r.boards).sort((a, b) => Number(b) - Number(a));

    html += `<div class="analysis-card"><h4><i class="fa-solid fa-building-columns"></i>${SUBJ_BN[s] || s} — বোর্ড ও বছরভিত্তিক বিতরণ</h4><div class="analysis-table-wrap"><table class="meta-table"><thead><tr><th>বছর</th><th>বোর্ড</th><th>প্রশ্ন সংখ্যা</th></tr></thead><tbody>`;
    let totalBoardQ = 0;
    for (const yr of years) {
      const boards = r.boards[yr];
      const sortedBoards = Object.entries(boards).sort((a, b) => b[1] - a[1]);
      for (const [bd, cnt] of sortedBoards) {
        totalBoardQ += cnt;
        html += `<tr><td>${yr}</td><td>${bd}</td><td><span class="badge badge-blue">${cnt.toLocaleString()}</span></td></tr>`;
      }
    }
    html += `</tbody></table></div><div class="insight-box"><strong>${years.length}</strong> টি বছরের <strong>${totalBoardQ.toLocaleString()}</strong> টি বোর্ড প্রশ্ন উপলব্ধ।</div></div>`;
  }
  if (!html) html = `<div class="analysis-card"><p style="color:var(--text-muted);text-align:center;">কোনো তথ্য নেই</p></div>`;
  return html;
}

function renderQualityTab(results) {
  const el = document.getElementById('tab-quality');
  let html = `<div class="two-col">
    <div class="analysis-card"><h4><i class="fa-solid fa-check-circle"></i>ব্যাখ্যা কভারেজ</h4><div class="bar-chart">`;
  const subjectsWithData = results._subjects.filter(s => results[s] && results[s].total > 0);
  const maxExplain = Math.max(...subjectsWithData.map(s => results[s].total));
  subjectsWithData.forEach((s) => {
    const r = results[s];
    const total = r.total;
    const explained = r.withExplanation;
    const pct = total > 0 ? (explained / total * 100) : 0;
    const barPct = maxExplain > 0 ? (total / maxExplain * 100) : 0;
    html += `<div class="bar-row">
      <span class="bar-label">${SUBJ_BN[s] || s}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${barPct}%;background:${pct > 80 ? 'linear-gradient(90deg,#059669,#34d399)' : pct > 50 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)'};">${barPct > 15 ? `${pct.toFixed(0)}%` : ''}</div></div>
      <span class="bar-count">${explained}/${total}</span>
    </div>`;
  });
  html += `</div></div>
    <div class="analysis-card"><h4><i class="fa-solid fa-list-check"></i>গুণগত মান সূচক</h4>`;
  html += `<div style="margin-bottom:12px;"><strong>মোট প্রশ্ন:</strong> ${subjectsWithData.reduce((s, sub) => s + results[sub].total, 0).toLocaleString()}</div>`;
  html += `<div style="margin-bottom:12px;"><strong>ব্যাখ্যা আছে:</strong> ${subjectsWithData.reduce((s, sub) => s + results[sub].withExplanation, 0).toLocaleString()} (${subjectsWithData.length > 0 ? Math.round(subjectsWithData.reduce((s, sub) => s + results[sub].withExplanation, 0) / subjectsWithData.reduce((s, sub) => s + results[sub].total, 0) * 100) : 0}%)</div>`;
  html += `<div style="margin-bottom:12px;"><strong>ব্যাখ্যা নেই:</strong> ${subjectsWithData.reduce((s, sub) => s + results[sub].withoutExplanation, 0).toLocaleString()}</div>`;
  html += `<div style="margin-bottom:12px;"><strong>General (অপ্রতিক্রিয়া):</strong> ${subjectsWithData.reduce((s, sub) => s + (results[sub].chapters['General'] || 0), 0).toLocaleString()}</div>`;

  let ansTotal = { a: 0, b: 0, c: 0, d: 0 };
  for (const s of subjectsWithData) {
    for (const [k, v] of Object.entries(results[s].answerDist)) {
      ansTotal[k] += v;
    }
  }
  const ansGrand = Object.values(ansTotal).reduce((s, v) => s + v, 0);
  html += `<div style="margin-top:16px;"><strong>উত্তর বিতরণ (Answer Key)</strong></div>`;
  ['a', 'b', 'c', 'd'].forEach(k => {
    const pct = ansGrand > 0 ? (ansTotal[k] / ansGrand * 100) : 0;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
      <span style="font-weight:700;min-width:20px;">${k.toUpperCase()}</span>
      <div class="bar-track" style="flex:1;height:18px;"><div class="bar-fill" style="width:${pct}%;background:${['#0284c7','#059669','#d97706','#7c3aed'][['a','b','c','d'].indexOf(k)]};">${pct > 10 ? `${pct.toFixed(1)}%` : ''}</div></div>
      <span style="font-size:0.8rem;color:var(--text-muted);min-width:50px;text-align:right;">${ansTotal[k].toLocaleString()}</span>
    </div>`;
  });
  html += `</div></div>`;

  html += `<div class="analysis-card"><h4><i class="fa-solid fa-triangle-exclamation"></i>বিশেষ সতর্কতা</h4>`;
  const warnings = [];
  for (const s of subjectsWithData) {
    const r = results[s];
    const noExpPct = r.total > 0 ? (r.withoutExplanation / r.total * 100) : 0;
    if (noExpPct > 30) warnings.push(`${SUBJ_BN[s] || s}: ${r.withoutExplanation.toLocaleString()} টি প্রশ্নের ব্যাখ্যা নেই (${noExpPct.toFixed(0)}%)`);
    const genPct = r.total > 0 ? ((r.chapters['General'] || 0) / r.total * 100) : 0;
    if (genPct > 20) warnings.push(`${SUBJ_BN[s] || s}: ${(r.chapters['General'] || 0).toLocaleString()} টি প্রশ্ন General অধ্যায়ে পড়ে (${genPct.toFixed(0)}%) — এগুলোকে নির্দিষ্ট অধ্যায়ে সরানোর প্রয়োজন`);
  }
  if (warnings.length === 0) {
    html += `<p style="color:var(--text-muted);">কোনো সতর্কতা নেই — সব বিষয়ের ডাটা ভালো অবস্থায় আছে।</p>`;
  } else {
    warnings.forEach(w => html += `<div style="padding:8px 12px;margin-bottom:6px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:6px;font-size:0.85rem;">⚠️ ${w}</div>`);
  }
  html += `</div>`;

  html += `<div class="analysis-card"><h4><i class="fa-solid fa-database"></i>সমস্ত প্রশ্নের ডাটা (কাঁচা)</h4>
    <input class="search-input-analysis" id="raw-search" type="text" placeholder="🔍 প্রশ্ন সার্চ করুন (বিষয়, অধ্যায়, বোর্ড...)">
    <div class="tabular-data" id="raw-data-table"></div>
  </div>`;

  el.innerHTML = html;

  let allQuestions = [];
  for (const s of subjectsWithData) {
    for (const q of (results[s].questions || [])) {
      allQuestions.push(q);
    }
  }

  function renderRawTable(filterText) {
    const tbody = document.getElementById('raw-data-table');
    if (!tbody) return;
    const filtered = filterText ? allQuestions.filter(q => {
      const str = (q.subject + ' ' + (q.chapter || '') + ' ' + (q.board || '') + ' ' + (q.year || '') + ' ' + q.question).toLowerCase();
      return str.includes(filterText.toLowerCase());
    }) : allQuestions;

    let tableHtml = `<table class="meta-table"><thead><tr><th>ID</th><th>বিষয়</th><th>অধ্যায়</th><th>বোর্ড</th><th>বছর</th><th>ব্যাখ্যা</th></tr></thead><tbody>`;
    const chunk = filtered.slice(0, 200);
    chunk.forEach(q => {
      tableHtml += `<tr>
        <td>${q.id}</td>
        <td>${SUBJ_BN[q.subject] || q.subject}</td>
        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${q.chapter || ''}">${q.chapter || '-'}</td>
        <td>${q.board || '-'}</td>
        <td>${q.year || '-'}</td>
        <td>${q.explanation && q.explanation.trim() && q.explanation !== '<p><br></p>' ? '<span class="badge badge-green">✓</span>' : '<span class="badge badge-red">✗</span>'}</td>
      </tr>`;
    });
    if (filtered.length > 200) tableHtml += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">আরও ${filtered.length - 200} টি রেকর্ড আছে। সার্চ ব্যবহার করে সংকুচিত করুন।</td></tr>`;
    tableHtml += `</tbody></table>`;
    tbody.innerHTML = tableHtml;
  }

  renderRawTable('');
  const searchInput = document.getElementById('raw-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderRawTable(e.target.value));
  }
}

function renderCoverageTab(results) {
  const el = document.getElementById('tab-coverage');
  const subjectsWithData = results._subjects.filter(s => results[s] && results[s].total > 0);

  let html = `<div class="analysis-card"><h4><i class="fa-solid fa-table-cells-large"></i>বিষয় ও অধ্যায় কভারেজ ম্যাট্রিক্স</h4>
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:14px;">প্রতি বিষয়ের অধ্যায় অনুযায়ী প্রশ্নের সংখ্যা। <span class="badge badge-green">✓</span> = প্রশ্ন আছে, <span class="badge badge-red">✗</span> = প্রশ্ন নেই।</p>
    <div class="analysis-table-wrap"><table class="meta-table"><thead><tr><th>বিষয়</th><th>অধ্যায়</th><th>প্রশ্ন</th><th>স্থিতি</th></tr></thead><tbody>`;

  for (const s of subjectsWithData) {
    const r = results[s];
    const metaChapters = (meta[s] && meta[s].chapters) ? meta[s].chapters : [];
    let rowCount = 0;
    for (const ch of metaChapters) {
      const cnt = r.chapters[ch.name] || 0;
      const status = cnt > 0 ? '<span class="badge badge-green">✓</span>' : '<span class="badge badge-red">✗</span>';
      html += `<tr>
        <td>${rowCount === 0 ? (SUBJ_BN[s] || s) : ''}</td>
        <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ch.name}">${ch.name.length > 45 ? ch.name.substring(0, 45) + '…' : ch.name}</td>
        <td>${cnt > 0 ? cnt.toLocaleString() : '-'}</td>
        <td>${status}</td>
      </tr>`;
      rowCount++;
    }
  }
  html += `</tbody></table></div></div>`;

  html += `<div class="analysis-card"><h4><i class="fa-solid fa-calendar"></i>বছরভিত্তিক কভারেজ</h4>
    <div class="analysis-table-wrap"><table class="meta-table"><thead><tr><th>বিষয়</th>`;

  const allYearsSet = new Set();
  for (const s of subjectsWithData) {
    Object.keys(results[s].years).forEach(y => allYearsSet.add(y));
  }
  const allYears = [...allYearsSet].filter(y => y !== '?').sort((a, b) => Number(a) - Number(b));
  const allBoards = ['Dhaka','Rajshahi','Comilla','Jessore','Chittagong','Barisal','Sylhet','Dinajpur','Mymensingh'];
  allYears.forEach(y => { html += `<th>${y}</th>`; });
  html += `<th>মোট</th></tr></thead><tbody>`;

  for (const s of subjectsWithData) {
    const r = results[s];
    html += `<tr><td>${SUBJ_BN[s] || s}</td>`;
    let subjectYearTotal = 0;
    for (const yr of allYears) {
      const cnt = r.years[yr] || 0;
      subjectYearTotal += cnt;
      html += `<td>${cnt > 0 ? cnt.toLocaleString() : '<span style="color:var(--text-muted);">-</span>'}</td>`;
    }
    html += `<td><strong>${subjectYearTotal.toLocaleString()}</strong></td></tr>`;
  }
  html += `</tbody></table></div></div>`;

  el.innerHTML = html;
}
