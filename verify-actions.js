const fs = require('fs');
const files = ['js/state.js','js/audio.js','js/alarm.js','js/today.js','js/calendar.js','js/diary.js','js/settings.js','js/sync.js','js/app.js'];
const allA = new Set();
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  for (const m of code.matchAll(/A\.([a-zA-Z0-9_$]+)\s*=/g)) {
    allA.add(m[1]);
  }
});

const usedA = new Set();
const missing = [];
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  for (const m of code.matchAll(/data-a=["']([a-zA-Z0-9_$]+)["']/g)) {
    usedA.add(m[1]);
    if (!allA.has(m[1])) {
      missing.push({ file: f, action: m[1] });
    }
  }
});

console.log('Total A handlers defined:', allA.size);
console.log('Total data-a used:', usedA.size);
if (missing.length === 0) {
  console.log('SUCCESS: All data-a actions have handlers!');
} else {
  console.error('MISSING HANDLERS:', missing);
}
