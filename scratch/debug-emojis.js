const fs = require('fs');
const content = fs.readFileSync('js/itinerary.js', 'utf8');
const lines = content.split('\n');
const line183 = lines[182]; // 0-indexed
console.log('Line 183:', line183);
for (let i = 0; i < line183.length; i++) {
  console.log(`char ${i}: ${line183[i]} (code: ${line183.charCodeAt(i)})`);
}
