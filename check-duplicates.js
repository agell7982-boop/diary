const fs = require('fs');
const files = ['js/state.js','js/audio.js','js/alarm.js','js/today.js','js/calendar.js','js/diary.js','js/settings.js','js/sync.js','js/app.js'];

const map = new Map();
const duplicates = [];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  // Match top-level variable and function declarations
  // To be safe, scan statements at the top level
  const regex = /(?:^|\n)(?:export\s+)?(const|let|var|function\*?|class|async\s+function\*?)\s+([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const name = match[2];
    if (map.has(name)) {
      duplicates.push({ name, firstFile: map.get(name), secondFile: f });
    } else {
      map.set(name, f);
    }
  }
});

console.log('Total top-level names declared:', map.size);
if (duplicates.length > 0) {
  console.log('FOUND DUPLICATES:', duplicates);
} else {
  console.log('NO DUPLICATES FOUND! All files have unique top-level declarations.');
}
