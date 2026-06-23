/**
 * analyze_chapters.js
 * Scans all MCQ chapter JSON files and CQ chapter JSON files,
 * and reports any questions whose stored "chapter" field does NOT match
 * the expected chapter name from meta.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const META_PATH = path.join(DATA_DIR, 'meta.json');

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));

// Build lookup: subject -> chapterId -> chapterName
const chapterMap = {};
for (const [subject, info] of Object.entries(meta)) {
    chapterMap[subject] = {};
    for (const ch of info.chapters) {
        chapterMap[subject][ch.id] = ch.name;
    }
}

// Build reverse lookup: subject -> chapterName -> chapterId
const reverseMap = {};
for (const [subject, ids] of Object.entries(chapterMap)) {
    reverseMap[subject] = {};
    for (const [id, name] of Object.entries(ids)) {
        reverseMap[subject][name] = id;
    }
}

let totalMisplaced = 0;
const report = [];

function analyzeFile(filePath, subject, expectedChapterId, expectedChapterName, type) {
    let data;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        if (raw.trim() === '' || raw.trim() === '[]' || raw.trim() === '{}') return;
        data = JSON.parse(raw);
    } catch (e) {
        return;
    }
    if (!Array.isArray(data) || data.length === 0) return;

    // Count chapter distribution inside this file
    const chapterCounts = {};
    for (const q of data) {
        const ch = q.chapter || '(none)';
        chapterCounts[ch] = (chapterCounts[ch] || 0) + 1;
    }

    // Find any chapter values that don't match the expected chapter name
    const mismatches = [];
    for (const [chName, count] of Object.entries(chapterCounts)) {
        if (chName !== expectedChapterName) {
            // Find where this chapter SHOULD be
            const correctId = reverseMap[subject] ? reverseMap[subject][chName] : null;
            mismatches.push({
                foundChapter: chName,
                count,
                shouldBeInFile: correctId 
                    ? `${subject.replace(/ /g,'_')}_${correctId}.json` 
                    : '(chapter not in meta — needs manual mapping)'
            });
        }
    }

    if (mismatches.length > 0) {
        totalMisplaced += mismatches.reduce((s, m) => s + m.count, 0);
        report.push({
            type,
            file: path.basename(filePath),
            subject,
            expectedChapter: expectedChapterName,
            expectedId: expectedChapterId,
            totalQuestionsInFile: data.length,
            misplacedGroups: mismatches
        });
    }
}

// ── Analyze MCQ Chapter Files ─────────────────────────────────────────────────
console.log('\n📊 Scanning MCQ chapter files...\n');
const mcqChaptersDir = path.join(DATA_DIR, 'chapters');
const mcqFiles = fs.readdirSync(mcqChaptersDir).filter(f => f.endsWith('.json'));

for (const file of mcqFiles) {
    // Parse subject and chapter id from filename e.g. Physics_1st_Paper_ch_3.json
    const match = file.match(/^(.+)_(ch_\d+)\.json$/);
    if (!match) continue;
    const subjectRaw = match[1].replace(/_/g, ' ');
    const chId = match[2];
    const subjectInfo = chapterMap[subjectRaw];
    if (!subjectInfo) continue;
    const expectedName = subjectInfo[chId] || '(unknown)';
    analyzeFile(path.join(mcqChaptersDir, file), subjectRaw, chId, expectedName, 'MCQ');
}

// ── Analyze CQ Chapter Files ──────────────────────────────────────────────────
console.log('📊 Scanning CQ chapter files...\n');
const cqChaptersDir = path.join(DATA_DIR, 'cq', 'chapters');
if (fs.existsSync(cqChaptersDir)) {
    const cqFiles = fs.readdirSync(cqChaptersDir).filter(f => f.endsWith('.json'));
    for (const file of cqFiles) {
        const match = file.match(/^(.+)_(ch_\d+)\.json$/);
        if (!match) continue;
        const subjectRaw = match[1].replace(/_/g, ' ');
        const chId = match[2];
        const subjectInfo = chapterMap[subjectRaw];
        if (!subjectInfo) continue;
        const expectedName = subjectInfo[chId] || '(unknown)';
        analyzeFile(path.join(cqChaptersDir, file), subjectRaw, chId, expectedName, 'CQ');
    }
}

// ── Print Report ──────────────────────────────────────────────────────────────
if (report.length === 0) {
    console.log('✅ No misplaced questions found! All chapters look correct.\n');
} else {
    console.log(`\n⚠️  Found ${totalMisplaced} misplaced questions across ${report.length} files:\n`);
    console.log('='.repeat(80));
    for (const entry of report) {
        console.log(`\n[${entry.type}] ${entry.file}`);
        console.log(`   Subject        : ${entry.subject}`);
        console.log(`   Expected Ch    : "${entry.expectedChapter}" (${entry.expectedId})`);
        console.log(`   Total in file  : ${entry.totalQuestionsInFile}`);
        console.log(`   Misplaced groups:`);
        for (const m of entry.misplacedGroups) {
            console.log(`     ❌ "${m.foundChapter}" — ${m.count} questions`);
            console.log(`        → Should be in: ${m.shouldBeInFile}`);
        }
    }
    console.log('\n' + '='.repeat(80));
    console.log(`\n📌 Total misplaced: ${totalMisplaced} questions\n`);
}
