const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data_cq.json');
const metaPath = path.join(__dirname, 'data', 'meta.json');
const cqDir = path.join(__dirname, 'data', 'cq');
const boardsDir = path.join(cqDir, 'boards');
const chaptersDir = path.join(cqDir, 'chapters');

// Ensure directories exist
if (!fs.existsSync(cqDir)) fs.mkdirSync(cqDir, { recursive: true });
if (!fs.existsSync(boardsDir)) fs.mkdirSync(boardsDir, { recursive: true });
if (!fs.existsSync(chaptersDir)) fs.mkdirSync(chaptersDir, { recursive: true });

console.log("Loading metadata index (meta.json)...");
if (!fs.existsSync(metaPath)) {
    console.error("Error: meta.json not found at " + metaPath);
    process.exit(1);
}
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

console.log("Loading master CQ database (data_cq.json)... This may take a moment...");
if (!fs.existsSync(dataPath)) {
    console.error("Error: data_cq.json not found at " + dataPath);
    process.exit(1);
}
const allCQs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log(`Successfully loaded ${allCQs.length} Creative Questions!`);

// Helper to normalize chapter names for robust matching (e.g. strip emojis and extra spaces)
function normalizeName(name) {
    if (!name) return '';
    return name.replace(/ℹ️/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getSubjectFilePrefix(subject) {
    return subject.replace(/\s+/g, '_');
}

const boardGroups = {};
const chapterGroups = {};

console.log("Segmenting questions into chapters and board/year groups...");

allCQs.forEach(cq => {
    const subject = cq.subject;
    const year = String(cq.year);
    const board = cq.board;
    const chapterName = cq.chapter || 'General';

    const subjectPrefix = getSubjectFilePrefix(subject);

    // 1. Group by board and year: [subject]_[year]_[board]
    if (board && year) {
        const cleanBoard = board.replace(/\s+/g, '_');
        const boardKey = `${subjectPrefix}_${year}_${cleanBoard}`;
        if (!boardGroups[boardKey]) {
            boardGroups[boardKey] = [];
        }
        boardGroups[boardKey].push(cq);
    }

    // 2. Group by chapter (resolve ID from meta.json)
    let chapterId = 'ch_1'; // default to General
    const subjectMeta = meta[subject];
    if (subjectMeta && subjectMeta.chapters) {
        const normCqChapterName = normalizeName(chapterName);
        const match = subjectMeta.chapters.find(c => normalizeName(c.name) === normCqChapterName);
        if (match) {
            chapterId = match.id;
        } else {
            console.warn(`Warning: Could not match chapter "${chapterName}" in "${subject}". Defaulting to ${chapterId}.`);
        }
    }

    const chapterKey = `${subjectPrefix}_${chapterId}`;
    if (!chapterGroups[chapterKey]) {
        chapterGroups[chapterKey] = [];
    }
    chapterGroups[chapterKey].push(cq);
});

console.log("\nSaving board JSON files...");
let boardFileCount = 0;
Object.keys(boardGroups).forEach(key => {
    const filePath = path.join(boardsDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(boardGroups[key], null, 2), 'utf8');
    boardFileCount++;
});
console.log(`Saved ${boardFileCount} board files under data/cq/boards/.`);

console.log("\nSaving chapter JSON files...");
let chapterFileCount = 0;
Object.keys(chapterGroups).forEach(key => {
    const filePath = path.join(chaptersDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(chapterGroups[key], null, 2), 'utf8');
    chapterFileCount++;
});
console.log(`Saved ${chapterFileCount} chapter files under data/cq/chapters/.`);

console.log("\nDatabase split completed successfully!");
