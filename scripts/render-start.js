const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const distPath = path.join(cwd, 'dist');
const mainPath = path.join(cwd, 'dist', 'main.js');

console.log('Render start: cwd =', cwd);
console.log('dist exists?', fs.existsSync(distPath));
if (fs.existsSync(distPath)) {
  try {
    console.log('dist contents:', fs.readdirSync(distPath).join(', '));
  } catch (e) {
    console.log('readdir error:', e.message);
  }
}
console.log('dist/main.js exists?', fs.existsSync(mainPath));

if (!fs.existsSync(mainPath)) {
  console.error('FATAL: dist/main.js not found. Run build first.');
  process.exit(1);
}

require(mainPath);
