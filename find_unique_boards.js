const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'cq', 'chapters', 'Physics_1st_Paper_ch_3.json');
const cqs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const uniqueBoards = new Set(cqs.map(q => q.board));
console.log("Unique board values in ch_3:", Array.from(uniqueBoards));
