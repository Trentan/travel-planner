const fs = require('fs');

let js = fs.readFileSync('js/data.js', 'utf8');

js = js.replace("if (typeof buildNav === 'function') buildNav();", "if (typeof autoGenerateMissingTransitLegs === 'function') autoGenerateMissingTransitLegs(appData);\n      if (typeof buildNav === 'function') buildNav();");
js = js.replace("alert('Import successful! ' + appData.length + ' trip legs loaded.');", "alert('Import successful! ' + appData.length + ' trip legs loaded.');\n      event.target.value = '';");
js = js.replace("if (item.cityId && cityIdToName.has(item.cityId)) addName(cityIdToName.get(item.cityId));", "if (item.text === 'Add accommodation...' || item.text === '') return;\n          if (item.cityId && cityIdToName.has(item.cityId)) addName(cityIdToName.get(item.cityId));");

fs.writeFileSync('js/data.js', js);
