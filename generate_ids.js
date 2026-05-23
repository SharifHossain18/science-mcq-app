// generate_ids.js – run once to ensure every question has a unique `id`
const fs = require('fs').promises;
const path = require('path');

async function addIds(dir) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const data = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    data.forEach((q, i) => {
      if (!q.id) {
        const base = path.basename(file, '.json');
        q.id = `${base}-${i}-${Date.now()}`;
      }
    });
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
  }
}

(async () => {
  await addIds(path.join(__dirname, 'data', 'chapters'));
  await addIds(path.join(__dirname, 'data', 'boards'));
  console.log('✅ All questions now have a unique `id`');
})();
