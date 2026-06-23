const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const outputDir = path.join(__dirname, 'data');
const boardsDir = path.join(outputDir, 'boards');
const chaptersDir = path.join(outputDir, 'chapters');

// Create directories if they do not exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (!fs.existsSync(boardsDir)) fs.mkdirSync(boardsDir);
if (!fs.existsSync(chaptersDir)) fs.mkdirSync(chaptersDir);

console.log("Loading data.json...");
if (!fs.existsSync(dataPath)) {
    console.error("Error: data.json not found at " + dataPath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log(`Loaded ${data.length} questions.`);

const meta = {};
const boardGroups = {};

console.log("Processing questions...");

// First pass: build basic meta structure
data.forEach(q => {
    const subject = q.subject;
    const year = String(q.year);
    const board = q.board;
    const chapterName = q.chapter || 'General';

    // Initialize meta for subject
    if (!meta[subject]) {
        meta[subject] = {
            chapters: [],
            boards: {}
        };
    }

    // Handle boards mapping in meta
    if (!meta[subject].boards[year]) {
        meta[subject].boards[year] = [];
    }
    if (board && !meta[subject].boards[year].includes(board)) {
        meta[subject].boards[year].push(board);
    }

    // Handle chapters mapping in meta
    let chapterObj = meta[subject].chapters.find(c => c.name === chapterName);
    if (!chapterObj) {
        meta[subject].chapters.push({ id: '', name: chapterName });
    }

    // Group for boards: [subject]_[year]_[board]
    if (board) {
        const boardKey = `${subject.replace(/\s+/g, '_')}_${year}_${board.replace(/\s+/g, '_')}`;
        if (!boardGroups[boardKey]) boardGroups[boardKey] = [];
        boardGroups[boardKey].push(q);
    }
});

// Natural sorting of chapters and assigning IDs
Object.keys(meta).forEach(sub => {
    meta[sub].chapters.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.name.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });
    // Assign sorted IDs
    meta[sub].chapters.forEach((ch, index) => {
        ch.id = `ch_${index + 1}`;
    });
});

// Second pass: group by sorted chapter IDs
const chapterGroups = {};
data.forEach(q => {
    const subject = q.subject;
    const chapterName = q.chapter || 'General';
    const chapterObj = meta[subject].chapters.find(c => c.name === chapterName);
    const chapterKey = `${subject.replace(/\s+/g, '_')}_${chapterObj.id}`;
    if (!chapterGroups[chapterKey]) chapterGroups[chapterKey] = [];
    chapterGroups[chapterKey].push(q);
});

// Save meta.json
fs.writeFileSync(path.join(outputDir, 'meta.json'), JSON.stringify(meta, null, 2));
console.log("Saved meta.json");

// Save board groups
console.log("Saving board JSON files...");
let boardFileCount = 0;
Object.keys(boardGroups).forEach(key => {
    const filePath = path.join(boardsDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(boardGroups[key], null, 2));
    boardFileCount++;
});
console.log(`Saved ${boardFileCount} board files.`);

// Save chapter groups
console.log("Saving chapter JSON files...");
let chapterFileCount = 0;
Object.keys(chapterGroups).forEach(key => {
    const filePath = path.join(chaptersDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(chapterGroups[key], null, 2));
    chapterFileCount++;
});
console.log(`Saved ${chapterFileCount} chapter files.`);

// Rename data.json to data.json.bak
const backupPath = path.join(__dirname, 'data.json.bak');
if (fs.existsSync(dataPath)) {
    fs.renameSync(dataPath, backupPath);
    console.log("Renamed data.json to data.json.bak");
}

console.log("Database split complete successfully!");
