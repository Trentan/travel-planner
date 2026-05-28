const fs = require('fs');
const path = 'js/itinerary.js';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['â ³', '⏳'],
  ['Â·', '·'],
  ['âœ“', '✓'],
  ['â€”', '—'],
  ['â€“', '–'],
  ['â–¼', '▼'],
  ['â†’', '→']
];

for (const [pattern, replacement] of replacements) {
  content = content.split(pattern).join(replacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully fixed remaining symbols!');
