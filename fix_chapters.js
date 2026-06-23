/**
 * fix_chapters.js
 * Fixes 205 misplaced questions across MCQ and CQ data files:
 * 1. Strips trailing ℹ️ emoji from chapter names in all CQ chapter files
 * 2. Fixes stray "Chapter 1: Mechanics" → correct Bangla name in MCQ ch_1
 * 3. Removes stray Physics_1st_Paper_ch_2018.json CQ file
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MCQ_CHAPTERS = path.join(DATA_DIR, 'chapters');
const CQ_CHAPTERS  = path.join(DATA_DIR, 'cq', 'chapters');

let totalFixed = 0;

function fixFile(filePath, fixFn, label) {
    let raw;
    try { raw = fs.readFileSync(filePath, 'utf8'); } catch (e) { return; }
    if (!raw.trim() || raw.trim() === '[]' || raw.trim() === '{}') return;

    let data;
    try { data = JSON.parse(raw); } catch (e) {
        console.log(`  ⚠️  Could not parse ${label}, skipping`);
        return;
    }
    if (!Array.isArray(data) || data.length === 0) return;

    let changed = 0;
    const fixed = data.map(q => {
        const result = fixFn(q);
        if (result._changed) { changed++; delete result._changed; }
        return result;
    });

    if (changed > 0) {
        fs.writeFileSync(filePath, JSON.stringify(fixed), 'utf8');
        console.log(`  ✅ Fixed ${changed} questions in ${label}`);
        totalFixed += changed;
    } else {
        console.log(`  ✔️  No changes needed in ${label}`);
    }
}

// ── Fix 1: Strip ℹ️ from chapter names in all CQ chapter files ───────────────
console.log('\n🔧 Fix 1: Stripping ℹ️ from CQ chapter names...\n');
const cqFiles = fs.readdirSync(CQ_CHAPTERS).filter(f => f.endsWith('.json'));

for (const file of cqFiles) {
    // Skip stray ch_2018 file - will handle separately
    if (file.includes('ch_2018')) continue;
    
    fixFile(
        path.join(CQ_CHAPTERS, file),
        (q) => {
            const newQ = { ...q };
            if (newQ.chapter && newQ.chapter.includes('ℹ️')) {
                newQ.chapter = newQ.chapter.replace(/\s*ℹ️\s*/g, '').trim();
                newQ._changed = true;
            }
            return newQ;
        },
        `[CQ] ${file}`
    );
}

// ── Fix 2: Fix "Chapter 1: Mechanics" in MCQ Physics_1st_Paper_ch_1 ──────────
console.log('\n🔧 Fix 2: Fixing stray English chapter name in MCQ ch_1...\n');
fixFile(
    path.join(MCQ_CHAPTERS, 'Physics_1st_Paper_ch_1.json'),
    (q) => {
        const newQ = { ...q };
        if (newQ.chapter === 'Chapter 1: Mechanics') {
            newQ.chapter = 'Chapter 1: ভৌতজগত ও পরিমাপ';
            newQ._changed = true;
        }
        return newQ;
    },
    '[MCQ] Physics_1st_Paper_ch_1.json'
);

// Also move it to the correct file (ch_2 = Chapter 1)
console.log('\n🔧 Moving MCQ ch_1 question to correct ch_2 file...\n');
try {
    const ch1Path = path.join(MCQ_CHAPTERS, 'Physics_1st_Paper_ch_1.json');
    const ch2Path = path.join(MCQ_CHAPTERS, 'Physics_1st_Paper_ch_2.json');
    
    const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf8'));
    const ch2Data = JSON.parse(fs.readFileSync(ch2Path, 'utf8'));
    
    if (Array.isArray(ch1Data) && ch1Data.length > 0) {
        // Append ch_1 questions to ch_2 (correct chapter file)
        const merged = [...ch2Data, ...ch1Data];
        fs.writeFileSync(ch2Path, JSON.stringify(merged), 'utf8');
        // Clear ch_1
        fs.writeFileSync(ch1Path, '[]', 'utf8');
        console.log(`  ✅ Moved ${ch1Data.length} questions from ch_1 → ch_2`);
        totalFixed += ch1Data.length;
    }
} catch (e) {
    console.log(`  ⚠️  Could not move ch_1 questions: ${e.message}`);
}

// ── Fix 3: Remove stray Physics_1st_Paper_ch_2018.json ───────────────────────
console.log('\n🔧 Fix 3: Removing stray CQ file ch_2018...\n');
const strayPath = path.join(CQ_CHAPTERS, 'Physics_1st_Paper_ch_2018.json');
if (fs.existsSync(strayPath)) {
    fs.unlinkSync(strayPath);
    console.log('  ✅ Deleted Physics_1st_Paper_ch_2018.json');
} else {
    console.log('  ✔️  File does not exist, nothing to delete');
}

// ── Done ──────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log(`\n🎉 Done! Total questions fixed: ${totalFixed}`);
console.log('\n📌 Next step: re-run analyze_chapters.js to verify 0 mismatches.\n');
