const fs = require('fs');
const testHelpers = require('./tests/lib/test-helpers');
let crudJs = testHelpers.loadSource('js/crud.js');
const fixture = JSON.parse(fs.readFileSync('./backups/2026_June_July_Europe_Thailand.json', 'utf8'));

crudJs = crudJs.replace('newDays.sort((a, b) => a.date.localeCompare(b.date));', 'if (leg.id === "city-brisbane-start") { console.log("BNE EARLIEST:", earliestDate, "DEP:", departingJourneys.length, "J_DEP_DATE:", departingJourneys.length > 0 ? departingJourneys[0].id + "|" + departingJourneys[0].departureDate : null, "NEWDAYS:", newDays.map(d=>d.date)); } newDays.sort((a, b) => a.date.localeCompare(b.date));');

const getSyncEnv = new Function('window', `
  let appData = window.appData || [];
  let saveAppData = () => {};
  let getCurrentAppData = () => appData;
  let normalizeTripDateValue = (d) => d;
  function getBaseNameGlobal(v) { return (v||'').toLowerCase(); }
  function confirm() { return true; }
  function alert() {}
  function closeAddLegDialog() {}
  function getLegCityName(leg) {
    if (leg.label) {
      if (leg.label.includes('(')) return leg.label.split('(')[0].trim();
      return leg.label.replace(/\\s*\\d+$/, '').trim();
    }
    return '';
  }
  let document = { getElementById: () => null, querySelector: () => null };

  ${crudJs}
  
  return { syncAllLegDays };
`);
const window = { journeys: fixture.journeys, stays: fixture.stays, appData: fixture.itinerary, document: { getElementById: () => null, querySelector: () => null }, getBaseNameGlobal: (v) => (v||'').toLowerCase() };
const env = getSyncEnv(window);

env.syncAllLegDays();

const bne = window.appData.find(l => l.id && l.id.includes('brisbane'));
console.log('Brisbane dates AFTER sync:', bne.days.map(d => d.date));
