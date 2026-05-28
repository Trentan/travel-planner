const fs = require('fs');
let js = fs.readFileSync('js/crud.js', 'utf8');
const fixture = JSON.parse(fs.readFileSync('./backups/2026_June_July_Europe_Thailand.json', 'utf8'));

const getEnv = new Function('window', `
  let appData = window.appData || [];
  function cleanCityNavLabel(v) { return v; }
  ${js}
  return { autoGenerateMissingTransitLegs };
`);
const window = { journeys: fixture.journeys };
const env = getEnv(window);
try {
  env.autoGenerateMissingTransitLegs(fixture.itinerary);
  console.log('Success!');
} catch (e) {
  console.error('Error:', e);
}
