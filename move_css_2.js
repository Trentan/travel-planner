const fs = require('fs');

let styleLines = fs.readFileSync('style.css', 'utf8').split('\n');
const startIdx = 3534; // /* DATA TABLES (FOR EXTRA TABS) */
const endIdx = 9717;   // just past the } of body.hide-money-figures ...

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

const comment = '\n  /* --- MIGRATED FROM STYLE.CSS: BATCH C/D TABS --- */\n';

tailwindLines.splice(insertIdx, 0, comment + extracted.join('\n'));
fs.writeFileSync('src/tailwind.css', tailwindLines.join('\n'));

console.log('Moved ' + extracted.length + ' lines from style.css to src/tailwind.css');
