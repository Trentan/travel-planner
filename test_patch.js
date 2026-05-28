const fs = require('fs');
let js = fs.readFileSync('tests/city-nav-regression.js', 'utf8');
js = js.replace('const importedCityNames = importedCities.map(city => city.name);', 'const importedCityNames = importedCities.map(city => city.name); console.log("VERONA ON MAIN:", importedCities.find(c => c.name === "Verona"));');
fs.writeFileSync('tests/city-nav-regression.js', js);
