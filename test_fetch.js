const http = require('http');

http.get('http://localhost:8086/api/metadata', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status Code:", res.statusCode);
        console.log("Data Length:", data.length);
        try {
            const parsed = JSON.parse(data);
            console.log("Subjects available:", Object.keys(parsed));
        } catch (e) {
            console.log("Parse error:", e.message);
        }
    });
}).on('error', err => {
    console.error("Request failed:", err.message);
});
