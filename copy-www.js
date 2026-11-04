const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'www');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const itemsToCopy = [
  'index.html',
  'manifest.json',
  'sw.js',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  'css',
  'js'
];

itemsToCopy.forEach(item => {
  const src = path.join(__dirname, item);
  const dest = path.join(targetDir, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
  }
});

console.log('www directory synced successfully.');
