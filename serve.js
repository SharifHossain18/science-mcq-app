const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const mime = {
  '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
  '.json':'application/json','.png':'image/png','.jpeg':'image/jpeg',
  '.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'
};

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function writeJSON(p, data) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function resolveBoardIndex(subject, year, boardName) {
  const metaPath = path.join(root, 'data', 'meta.json');
  const meta = readJSON(metaPath);
  if (!meta || !meta[subject] || !meta[subject].boards || !meta[subject].boards[year]) return null;
  const boards = meta[subject].boards[year];
  const idx = boards.indexOf(boardName);
  if (idx === -1) return null;
  return String(idx + 1);
}

function getChapterName(subject, chapterId) {
  const meta = readJSON(path.join(root, 'data', 'meta.json'));
  if (!meta || !meta[subject]) return null;
  const ch = meta[subject].chapters.find(c => c.id === chapterId);
  return ch ? ch.name : null;
}

// Resolve source file path from mover payload
function resolveSourcePath(mode, srcSubject, srcVal) {
  const cleanSub = srcSubject.replace(/ /g, '_');
  if (mode === 'mcq') return path.join(root, 'data', 'chapters', `${cleanSub}_${srcVal}.json`);
  if (srcVal.startsWith('chapter_')) {
    const chId = srcVal.replace('chapter_', '');
    return path.join(root, 'data', 'cq', 'chapters', `${cleanSub}_${chId}.json`);
  }
  if (srcVal.startsWith('board_')) {
    const parts = srcVal.replace('board_', '').split('_');
    const year = parts[0];
    const boardName = parts.slice(1).join('_');
    const boardIdx = resolveBoardIndex(srcSubject, year, boardName);
    if (!boardIdx) return null;
    return path.join(root, 'data', 'cq', 'boards', `${cleanSub}_${year}_${boardIdx}.json`);
  }
  return null;
}

// Resolve destination file path from mover payload + update question fields
function resolveDestPathAndUpdate(mode, dstSubject, dstVal, dstChapterName, question) {
  const cleanSub = dstSubject.replace(/ /g, '_');
  // Update subject on question
  question.subject = dstSubject;

  if (mode === 'mcq') {
    const chName = getChapterName(dstSubject, dstVal);
    question.chapter = chName || dstChapterName || 'General';
    return path.join(root, 'data', 'chapters', `${cleanSub}_${dstVal}.json`);
  }

  if (dstVal.startsWith('chapter_')) {
    const chId = dstVal.replace('chapter_', '');
    const chName = getChapterName(dstSubject, chId);
    question.chapter = chName || dstChapterName || 'General';
    return path.join(root, 'data', 'cq', 'chapters', `${cleanSub}_${chId}.json`);
  }

  if (dstVal.startsWith('board_')) {
    const parts = dstVal.replace('board_', '').split('_');
    const year = parts[0];
    const boardName = parts.slice(1).join('_');
    const boardIdx = resolveBoardIndex(dstSubject, year, boardName);
    if (!boardIdx) return null;
    question.year = year;
    question.board = boardIdx;
    // Strip chapter field for board placement
    delete question.chapter;
    return path.join(root, 'data', 'cq', 'boards', `${cleanSub}_${year}_${boardIdx}.json`);
  }

  return null;
}

http.createServer((req, res) => {
  // ── API: Move Question ──
  if (req.method === 'POST' && req.url === '/api/move-any-question') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { mode, questionId, srcSubject, srcVal, dstSubject, dstVal, dstChapterName } = payload;

        // Resolve source file
        const srcPath = resolveSourcePath(mode, srcSubject, srcVal);
        if (!srcPath || !fs.existsSync(srcPath)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'উৎস ফাইল খুঁজে পাওয়া যায়নি' }));
          return;
        }

        // Read source, find and remove question
        const srcData = readJSON(srcPath);
        if (!Array.isArray(srcData)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'উৎস ফাইলের ডাটা ফরমেট সঠিক নয়' }));
          return;
        }

        const qIdx = srcData.findIndex(q => String(q.id) === String(questionId));
        if (qIdx === -1) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'প্রশ্নটি উৎস ফাইলে খুঁজে পাওয়া যায়নি' }));
          return;
        }

        const [question] = srcData.splice(qIdx, 1);
        writeJSON(srcPath, srcData);

        // Resolve destination and update question
        const dstPath = resolveDestPathAndUpdate(mode, dstSubject, dstVal, dstChapterName, question);
        if (!dstPath) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'গন্তব্য ফাইল পাথ নির্ধারণ করা যায়নি' }));
          return;
        }

        // Read or create destination file
        let dstData = readJSON(dstPath);
        if (!Array.isArray(dstData)) dstData = [];
        dstData.push(question);
        writeJSON(dstPath, dstData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'প্রশ্নটি সফলভাবে স্থানান্তরিত হয়েছে' }));
      } catch (err) {
        console.error('API Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ── Static file serving ──
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  let fp = path.join(root, urlPath);
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(d);
  });
}).listen(8080, '0.0.0.0', () => console.log('LUMEN on http://0.0.0.0:8080'));
