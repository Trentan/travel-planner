const fs = require('fs');

let js = fs.readFileSync('js/crud.js', 'utf8');

// Replace (Trip Finish) with (Trip End)
js = js.replace(/\(Trip Finish\)/g, '(Trip End)');

// Replace 'return' with 'end' in legType checks
js = js.replace(/legType === 'return'/g, "legType === 'end'");
js = js.replace(/leg\.label\.includes\('return'\)/g, "leg.label.includes('end')");
js = js.replace(/normalizedLabel\.includes\('return'\) \? 'return'/g, "normalizedLabel.includes('end') ? 'end'");
js = js.replace(/normalizedLabel\.includes\('return'\) legType = 'return'/g, "normalizedLabel.includes('end') legType = 'end'");
js = js.replace(/else if \(normalizedLabel\.includes\('return'\)\) legType = 'return';/g, "else if (normalizedLabel.includes('end')) legType = 'end';");

fs.writeFileSync('js/crud.js', js);
