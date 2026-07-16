const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '.capacitor-web');
const copies = ['index.html', 'manifest.json', 'sw.js', 'favicon.svg', 'js', 'dist', 'icons'];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const item of copies) {
  const source = path.join(root, item);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing mobile web asset: ${item}. Run the required build step first.`);
  }
  fs.cpSync(source, path.join(output, item), { recursive: true });
}
