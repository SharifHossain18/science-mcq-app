const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const CHAPTERS_DIR = path.join(DATA_DIR, 'chapters');

// Helper to format subject name into filename style (e.g., 'Physics 1st Paper' -> 'Physics_1st_Paper')
function getSubjectFilePrefix(subject) {
    return subject.replace(/ /g, '_');
}

const server = http.createServer((req, res) => {
    // Enable CORS just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = req.url.split('?')[0];

    // Serve HTML panels
    if (parsedUrl === '/' || parsedUrl === '/admin.html' || parsedUrl === '/mover.html') {
        const fileName = parsedUrl === '/' ? 'index.html' : (parsedUrl === '/admin.html' ? 'admin.html' : 'mover.html');
        fs.readFile(path.join(__dirname, fileName), 'utf-8', (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(fileName + ' not found. Please ensure it is created.');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(content);
            }
        });
        return;
    }

    // API: Get Subjects and Chapters metadata
    if (parsedUrl === '/api/metadata' && req.method === 'GET') {
        fs.readFile(path.join(DATA_DIR, 'meta.json'), 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to read meta.json' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    // API: Get General Questions for a selected Subject
    if (parsedUrl === '/api/general-questions' && req.method === 'GET') {
        const queryParams = new URLSearchParams(req.url.split('?')[1] || '');
        const subject = queryParams.get('subject');

        if (!subject) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Subject parameter is required' }));
            return;
        }

        const prefix = getSubjectFilePrefix(subject);
        const filePath = path.join(CHAPTERS_DIR, `${prefix}_ch_1.json`);

        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                // If file doesn't exist, return empty array
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify([]));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    // API: Move a question from ch_1 (General) to target chapter file
    if (parsedUrl === '/api/move-question' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { subject, questionId, targetChapterId, targetChapterName } = payload;

                if (!subject || !questionId || !targetChapterId || !targetChapterName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing parameters in body' }));
                    return;
                }

                const prefix = getSubjectFilePrefix(subject);
                const generalFilePath = path.join(CHAPTERS_DIR, `${prefix}_ch_1.json`);
                const targetFilePath = path.join(CHAPTERS_DIR, `${prefix}_${targetChapterId}.json`);

                // 1. Read General Questions
                fs.readFile(generalFilePath, 'utf-8', (err, genData) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read General questions file' }));
                        return;
                    }

                    let generalList = JSON.parse(genData);
                    const qIdx = generalList.findIndex(q => q.id === parseInt(questionId));

                    if (qIdx === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Question not found in General list' }));
                        return;
                    }

                    // Extract the question
                    const questionToMove = generalList[qIdx];
                    
                    // Update its chapter property to the new chapter name
                    questionToMove.chapter = targetChapterName;

                    // Remove it from general array
                    generalList.splice(qIdx, 1);

                    // 2. Read target chapter questions (or initialize empty array if file does not exist)
                    fs.readFile(targetFilePath, 'utf-8', (targetErr, targetData) => {
                        let targetList = [];
                        if (!targetErr && targetData) {
                            try {
                                targetList = JSON.parse(targetData);
                            } catch (parseE) {
                                targetList = [];
                            }
                        }

                        // Append the question
                        targetList.push(questionToMove);

                        // 3. Save both files back to filesystem
                        fs.writeFile(generalFilePath, JSON.stringify(generalList, null, 2), 'utf-8', err1 => {
                            if (err1) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to write updated General list' }));
                                return;
                            }

                            fs.writeFile(targetFilePath, JSON.stringify(targetList, null, 2), 'utf-8', err2 => {
                                if (err2) {
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Failed to write target list' }));
                                    return;
                                }

                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true, remainingCount: generalList.length }));
                            });
                        });
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
            }
        });
        return;
    }

    // API: Get General Creative Questions (CQs) for a selected Subject
    if (parsedUrl === '/api/cq/general-questions' && req.method === 'GET') {
        const queryParams = new URLSearchParams(req.url.split('?')[1] || '');
        const subject = queryParams.get('subject');

        if (!subject) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Subject parameter is required' }));
            return;
        }

        const prefix = getSubjectFilePrefix(subject);
        const filePath = path.join(DATA_DIR, 'cq', 'chapters', `${prefix}_ch_1.json`);

        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                // If file doesn't exist, return empty array
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify([]));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    // API: Move a CQ from ch_1 (General) to target chapter file
    if (parsedUrl === '/api/cq/move-question' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { subject, questionId, targetChapterId, targetChapterName } = payload;

                if (!subject || !questionId || !targetChapterId || !targetChapterName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing parameters in body' }));
                    return;
                }

                const prefix = getSubjectFilePrefix(subject);
                const generalFilePath = path.join(DATA_DIR, 'cq', 'chapters', `${prefix}_ch_1.json`);
                const targetFilePath = path.join(DATA_DIR, 'cq', 'chapters', `${prefix}_${targetChapterId}.json`);

                // 1. Read General CQs
                fs.readFile(generalFilePath, 'utf-8', (err, genData) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read General CQs file' }));
                        return;
                    }

                    let generalList = JSON.parse(genData);
                    // Match integer or string IDs robustly
                    const qIdx = generalList.findIndex(q => q.id.toString() === questionId.toString());

                    if (qIdx === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Question not found in General CQs list' }));
                        return;
                    }

                    // Extract the question
                    const questionToMove = generalList[qIdx];
                    
                    // Update its chapter property to the new chapter name
                    questionToMove.chapter = targetChapterName;

                    // Remove it from general array
                    generalList.splice(qIdx, 1);

                    // 2. Read target chapter questions (or initialize empty array if file does not exist)
                    fs.readFile(targetFilePath, 'utf-8', (targetErr, targetData) => {
                        let targetList = [];
                        if (!targetErr && targetData) {
                            try {
                                targetList = JSON.parse(targetData);
                            } catch (parseE) {
                                targetList = [];
                            }
                        }

                        // Append the question
                        targetList.push(questionToMove);

                        // 3. Save both files back to filesystem
                        fs.writeFile(generalFilePath, JSON.stringify(generalList, null, 2), 'utf-8', err1 => {
                            if (err1) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to write updated General CQs list' }));
                                return;
                            }

                            fs.writeFile(targetFilePath, JSON.stringify(targetList, null, 2), 'utf-8', err2 => {
                                if (err2) {
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Failed to write target CQs list' }));
                                    return;
                                }

                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true, remainingCount: generalList.length }));
                            });
                        });
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
            }
        });
        return;
    }

    // API: Move any question from any chapter/board to any other chapter/board
    if (parsedUrl === '/api/move-any-question' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { mode, questionId, srcSubject, srcVal, dstSubject, dstVal, dstChapterName } = payload;

                if (!mode || !questionId || !srcSubject || !srcVal || !dstSubject || !dstVal) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing parameters in body' }));
                    return;
                }

                const cleanSrcSub = srcSubject.replace(/ /g, '_');
                const cleanDstSub = dstSubject.replace(/ /g, '_');

                let srcPath = '';
                let dstPath = '';

                if (mode === 'mcq') {
                    srcPath = path.join(CHAPTERS_DIR, `${cleanSrcSub}_${srcVal}.json`);
                    dstPath = path.join(CHAPTERS_DIR, `${cleanDstSub}_${dstVal}.json`);
                } else {
                    // CQ
                    // Source path
                    if (srcVal.startsWith('chapter_')) {
                        const chId = srcVal.replace('chapter_', '');
                        srcPath = path.join(DATA_DIR, 'cq', 'chapters', `${cleanSrcSub}_${chId}.json`);
                    } else if (srcVal.startsWith('board_')) {
                        const parts = srcVal.replace('board_', '').split('_');
                        const year = parts[0];
                        const board = parts.slice(1).join('_');
                        srcPath = path.join(DATA_DIR, 'cq', 'boards', `${cleanSrcSub}_${year}_${board}.json`);
                    }

                    // Destination path
                    if (dstVal.startsWith('chapter_')) {
                        const chId = dstVal.replace('chapter_', '');
                        dstPath = path.join(DATA_DIR, 'cq', 'chapters', `${cleanDstSub}_${chId}.json`);
                    } else if (dstVal.startsWith('board_')) {
                        const parts = dstVal.replace('board_', '').split('_');
                        const year = parts[0];
                        const board = parts.slice(1).join('_');
                        dstPath = path.join(DATA_DIR, 'cq', 'boards', `${cleanDstSub}_${year}_${board}.json`);
                    }
                }

                // 1. Read Source File
                fs.readFile(srcPath, 'utf-8', (err, srcData) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Source file not found or failed to read' }));
                        return;
                    }

                    let srcList = JSON.parse(srcData);
                    // Match by string/integer/id comparison
                    const qIdx = srcList.findIndex(q => q.id && q.id.toString() === questionId.toString());

                    if (qIdx === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Question not found in source list' }));
                        return;
                    }

                    // Extract question
                    const questionToMove = srcList[qIdx];

                    // Update question metadata depending on mode
                    if (mode === 'mcq') {
                        if (dstChapterName) {
                            questionToMove.chapter = dstChapterName;
                        }
                        questionToMove.subject = dstSubject;
                    } else {
                        // CQ
                        if (dstVal.startsWith('chapter_')) {
                            if (dstChapterName) {
                                questionToMove.chapter = dstChapterName;
                            }
                        } else if (dstVal.startsWith('board_')) {
                            const parts = dstVal.replace('board_', '').split('_');
                            questionToMove.year = parseInt(parts[0]) || parts[0];
                            questionToMove.board = parts.slice(1).join('_').replace(/_/g, ' ');
                            questionToMove.chapter = 'General';
                        }
                        questionToMove.subject = dstSubject;
                    }

                    // Remove from source array
                    srcList.splice(qIdx, 1);

                    // 2. Read target file (or init empty array)
                    fs.readFile(dstPath, 'utf-8', (dstErr, dstData) => {
                        let dstList = [];
                        if (!dstErr && dstData) {
                            try {
                                dstList = JSON.parse(dstData);
                            } catch (parseE) {
                                dstList = [];
                            }
                        }

                        // Append the question
                        dstList.push(questionToMove);

                        // 3. Save both files
                        fs.writeFile(srcPath, JSON.stringify(srcList, null, 2), 'utf-8', err1 => {
                            if (err1) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to write updated source file' }));
                                return;
                            }

                            fs.writeFile(dstPath, JSON.stringify(dstList, null, 2), 'utf-8', err2 => {
                                if (err2) {
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: 'Failed to write destination file' }));
                                    return;
                                }

                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                            });
                        });
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
            }
        });
        return;
    }

    // Catch all other static assets (for style.css or web font requests to run locally if needed)
    let filePath = path.join(__dirname, parsedUrl);
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        } else {
            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.png': 'image/png'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`LUMEN MCQ Admin Question Organizer running locally!`);
    console.log(`Open your browser and go to: http://localhost:${PORT}/`);
    console.log(`======================================================\n`);
});
