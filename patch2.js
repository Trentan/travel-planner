const fs = require('fs');
let js = fs.readFileSync('js/data.js', 'utf8');
js = js.replace('return destinationNames;', 'console.log("DESTINATIONS:", Array.from(destinationNames).filter(n => n.includes("verona"))); return destinationNames;');
fs.writeFileSync('js/data.js', js);
