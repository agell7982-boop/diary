const fs = require('fs');

const files = [
  'js/state.js',
  'js/audio.js',
  'js/alarm.js',
  'js/today.js',
  'js/calendar.js',
  'js/diary.js',
  'js/settings.js',
  'js/sync.js',
  'js/app.js'
];

const declared = new Set([
  'window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location',
  'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'Notification', 'Audio', 'AudioContext',
  'webkitAudioContext', 'indexedDB', 'crypto', 'TextEncoder', 'TextDecoder',
  'Intl', 'Date', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'RegExp', 'Set', 'Map', 'Promise', 'Error', 'Uint8Array', 'FileReader', 'Image',
  'FontFace', 'confirm', 'alert', 'prompt', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'fetch', 'firebase', 'TimestampTrigger'
]);

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  // top-level or function declarations
  const declMatches = code.matchAll(/(?:const|let|var|function)\s+([a-zA-Z0-9_$]+)/g);
  for (const m of declMatches) {
    declared.add(m[1]);
  }
  const asyncMatches = code.matchAll(/async\s+function\s+([a-zA-Z0-9_$]+)/g);
  for (const m of asyncMatches) {
    declared.add(m[1]);
  }
});

// Also collect properties assigned to A
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const aMatches = code.matchAll(/A\.([a-zA-Z0-9_$]+)\s*=/g);
  for (const m of aMatches) {
    declared.add(m[1]);
  }
});

console.log('Total declared in codebase:', declared.size);

// Check all data-a="..." in HTML templates across files to see if A[data-a] handler exists!
const missingActions = [];
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const actionMatches = code.matchAll(/data-a=["']([a-zA-Z0-9_$]+)["']/g);
  for (const m of actionMatches) {
    const act = m[1];
    if (!code.includes(`A.${act}`) && !declared.has(act)) {
      // check across all files
      let found = false;
      for (const f2 of files) {
        if (fs.readFileSync(f2, 'utf8').includes(`A.${act}`)) {
          found = true;
          break;
        }
      }
      if (!found) {
        missingActions.push({ file: f, action: act });
      }
    }
  }
});

console.log('Missing data-a handlers:', missingActions);
