const fs = require('fs');
const lines = fs.readFileSync('style.css', 'utf8').split('\n');

const css = lines.slice(1613, 2011).join('\n');
fs.writeFileSync('itinerary_css.txt', css);
console.log('Extracted lines 1614 to 2011');
