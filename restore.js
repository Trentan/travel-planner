const fs = require('fs');
const diffLines = fs.readFileSync('deleted_styles.diff', 'utf16le').split('\n');

const deletedCode = [];
let inHunk = false;

for (let line of diffLines) {
  if (line.startsWith('@@ ')) {
    inHunk = true;
    continue;
  }
  if (line.startsWith('--- a/style.css')) continue;
  if (line.startsWith('+++ b/style.css')) continue;
  if (line.startsWith('diff --git')) continue;
  if (line.startsWith('index ')) continue;
  
  if (inHunk) {
    if (line.startsWith('-')) {
      deletedCode.push(line.substring(1));
    }
  }
}

let tailwindLines = fs.readFileSync('src/tailwind.css', 'utf8').split('\n');
let insertIdx = tailwindLines.length - 1;
for (let i = tailwindLines.length - 1; i >= 0; i--) {
  if (tailwindLines[i] === '}') {
    insertIdx = i;
    break;
  }
}

tailwindLines.splice(insertIdx, 0, '\n/* MIGRATED DELETED STYLES FROM PR */\n' + deletedCode.join('\n') + '\n');
fs.writeFileSync('src/tailwind.css', tailwindLines.join('\n'));
console.log('Migrated ' + deletedCode.length + ' lines.');
