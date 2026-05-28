const fs = require('fs');
let js = fs.readFileSync('js/data.js', 'utf8');
js = js.replace('const addName = (name) => {', 'const addName = (name) => { if (name && name.toLowerCase() === "verona") { console.log("VERONA ADDED BY:", new Error().stack); } ');
fs.writeFileSync('js/data.js', js);
