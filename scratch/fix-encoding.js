const fs = require('fs');
const path = 'js/itinerary.js';

// Read the file as latin1/binary
const bytes = fs.readFileSync(path, 'binary');

// Convert those bytes into a UTF-8 string
const decoded = Buffer.from(bytes, 'binary').toString('utf8');

// Write back as UTF-8
fs.writeFileSync(path, decoded, 'utf8');
console.log('Decoded file to UTF-8!');
