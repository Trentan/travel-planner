const fs = require('fs');
let js = fs.readFileSync('js/data.js', 'utf8');

js = js.replace(/\(Trip Finish\)/g, '(Trip End)');
js = js.replace(/legType === 'return'/g, "legType === 'end'");
js = js.replace(/leg\.label\.includes\('return'\)/g, "leg.label.includes('end')");

fs.writeFileSync('js/data.js', js);
