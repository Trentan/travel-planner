const fs = require('fs');
let code = fs.readFileSync('js/data.js', 'utf8');

// Insert into COUNTRY_FLAGS
code = code.replace(
  /'New York': '🇺🇸',/g,
  "'New York': '🇺🇸',\n  'Portugal': '🇵🇹',\n  'Lisbon': '🇵🇹',\n  'Turkey': '🇹🇷',\n  'Kuşadası': '🇹🇷',\n  'Kusadasi': '🇹🇷',"
);

// Insert into CITY_TO_CODE
code = code.replace(
  /'dubai': 'ae'/g,
  "'dubai': 'ae',\n  'portugal': 'pt', 'lisbon': 'pt',\n  'turkey': 'tr', 'kusadasi': 'tr', 'kuşadası': 'tr'"
);

// Insert into COUNTRY_TO_CODE
code = code.replace(
  /'United States': 'US'/g,
  "'United States': 'US',\n  'Portugal': 'PT',\n  'Turkey': 'TR'"
);

fs.writeFileSync('js/data.js', code);
console.log('Patched flags in data.js');
