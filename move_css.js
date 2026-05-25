const fs = require('fs');
let styleLines = fs.readFileSync('style.css', 'utf8').split('\n');

// Lines 1613 to 2011 (0-indexed: 1612 to 2010)
// Actually 1614 in line numbers is 1613 in 0-index.
const startIdx = 1613;
const endIdx = 2011;

const extracted = styleLines.slice(startIdx, endIdx);

// Remove the extracted lines from style.css
styleLines.splice(startIdx, endIdx - startIdx);
fs.writeFileSync('style.css', styleLines.join('\n'));

// Read tailwind.css and append the extracted lines inside @layer components
let tailwindLines = fs.readFileSync('src/tailwind.css', 'utf8').split('\n');

// Find the last closing brace of @layer components
let insertIdx = tailwindLines.length - 1;
for (let i = tailwindLines.length - 1; i >= 0; i--) {
  if (tailwindLines[i] === '}') {
    insertIdx = i;
    break;
  }
}

// Wrap the extracted CSS to ensure we can slowly convert it
const comment = '\n  /* --- MIGRATED FROM STYLE.CSS: ITINERARY (Batch C) --- */\n';

tailwindLines.splice(insertIdx, 0, comment + extracted.join('\n'));
fs.writeFileSync('src/tailwind.css', tailwindLines.join('\n'));

console.log('Moved ' + extracted.length + ' lines from style.css to src/tailwind.css');
