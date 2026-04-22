const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf-8');

// Remove the print button from controls-container
content = content.replace(
  /<div id="itinerary"><\/div>\s*<div class="controls-container">\s*<div class="print-group">\s*<button class="action-btn" onclick="openPrintPreview\(\)">🖨 Print Preview<\/button>\s*<\/div>\s*<\/div>/g,
  '<div id="itinerary"></div>'
);

// Rewrite the file with proper formatting
fs.writeFileSync(filePath, content);
console.log('Removed print button from bottom of itinerary');
