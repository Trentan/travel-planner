const fs = require('fs');
let js = fs.readFileSync('js/data.js', 'utf8');
js = js.replace('if (day.from && day.to && day.from === day.to) addName(day.to);', 'if (day.from && day.to && day.from === day.to) { if (day.to.toLowerCase().includes("verona")) console.log("day.to is:", day.to); addName(day.to); }');
js = js.replace('if (labelMatchesDayCity) addName(directCityName);', 'if (labelMatchesDayCity) { if (directCityName.toLowerCase().includes("verona")) console.log("labelMatchesDayCity is true for:", directCityName); addName(directCityName); }');
fs.writeFileSync('js/data.js', js);
