const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'cq', 'chapters', 'Physics_1st_Paper_ch_3.json');
fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const cqs = JSON.parse(data);
    console.log("Total questions in ch_3:", cqs.length);
    if (cqs.length > 0) {
        console.log("First question example:");
        console.log("id:", cqs[0].id);
        console.log("subject:", cqs[0].subject);
        console.log("chapter:", cqs[0].chapter);
        console.log("year:", cqs[0].year);
        console.log("board:", cqs[0].board);
    }
});
