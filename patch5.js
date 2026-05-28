const fs = require('fs');
let js = fs.readFileSync('tests/city-nav-regression.js', 'utf8');
js = js.replace(/journeyMapping.outboundLegs.join\(' > '\) === 'departure > taipei > vienna',/g, "journeyMapping.outboundLegs.join(' > ') === 'brisbane > taipei > vienna',");
js = js.replace(/'Outbound journey segments should map to departure, Taipei, and Vienna legs'/g, "'Outbound journey segments should map to Brisbane, Taipei, and Vienna legs'");
js = js.replace('assert(journeyMapping.blankLegIds === 0, \\'Journey migration should fill blank leg IDs\\');', 'console.log("OUTBOUND LEGS:", journeyMapping.outboundLegs); assert(journeyMapping.blankLegIds === 0, \\'Journey migration should fill blank leg IDs\\');');
fs.writeFileSync('tests/city-nav-regression.js', js);
