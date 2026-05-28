const testHelpers = require('./tests/lib/test-helpers');
const crudJs = testHelpers.loadSource('js/crud.js');

const getSyncEnv = new Function('window', `
  let appData = window.appData || [];
  let saveAppData = () => {};
  let getCurrentAppData = () => appData;
  let normalizeTripDateValue = (d) => d; let confirm = () => true; let alert = () => {}; let console = { log: () => {} };
  function getBaseNameGlobal(v) { return (v||'').toLowerCase(); }

  ${crudJs}
  
  return { syncAllLegDays };
`);

const fixture = require('./backups/2026_June_July_Europe_Thailand.json');
const window = { journeys: fixture.journeys, stays: fixture.stays, appData: fixture.itinerary };
const env = getSyncEnv(window);
env.syncAllLegDays();

const bne = window.appData.find(l => l.id === 'departure');
console.log('Brisbane dates:', bne.days.map(d => d.date));
const tpe = window.appData.find(l => l.id === 'taipei');
console.log('Taipei dates:', tpe.days.map(d => d.date));
