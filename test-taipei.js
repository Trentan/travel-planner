const fs = require('fs');
let crudJs = fs.readFileSync('js/crud.js', 'utf8');
const fixture = JSON.parse(fs.readFileSync('./backups/2026_June_July_Europe_Thailand.json', 'utf8'));

const getSyncEnv = new Function('window', `
  let appData = window.appData || [];
  let saveAppData = () => {};
  let getCurrentAppData = () => appData;
  let normalizeTripDateValue = (d) => d;
  function getBaseNameGlobal(v) { 
    if (!v) return '';
    let base = v.replace(/^[^\x00-\x7F]+\\s*/, '').trim();
    let strippedNum = base.replace(/\\s*\\d+$/, '');
    if (strippedNum.trim().length > 0) base = strippedNum;
    return base.trim().toLowerCase();
  }
  function formatShortDate(dStr) { return dStr; }
  let changelog = [];
  function confirm() { return true; }
  function closeAddLegDialog() {}
  let document = { getElementById: () => ({ classList: { remove: () => {} }, style: {} }) };
  function buildLegDaysWithNotes(opts) { 
    return [{date: opts.dateFrom}, {date: opts.dateTo}]; 
  }
  ${crudJs}
  return { syncAllLegDays };
`);

const window = { 
  journeys: fixture.journeys, 
  stays: fixture.stays, 
  appData: fixture.itinerary, 
  getBaseNameGlobal: (v) => {
    if (!v) return '';
    let base = v.replace(/^[^\x00-\x7F]+\s*/, '').trim();
    let strippedNum = base.replace(/\s*\d+$/, '');
    if (strippedNum.trim().length > 0) base = strippedNum;
    return base.trim().toLowerCase();
  }
};

const env = getSyncEnv(window);
env.syncAllLegDays();

const taipeiStart = window.appData.find(l => l.label === 'Taipei (Trip Start)');
console.log('Taipei (Trip Start) days:', taipeiStart ? taipeiStart.days : 'Not found');

const taipeiMain = window.appData.find(l => l.label === '🇹🇼 Taipei');
console.log('🇹🇼 Taipei days:', taipeiMain ? taipeiMain.days : 'Not found');

const brisbaneStart = window.appData.find(l => l.label.includes('Brisbane')); console.log('Brisbane Start days:', brisbaneStart ? brisbaneStart.days : 'Not found');
