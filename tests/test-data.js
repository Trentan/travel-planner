const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const data = JSON.parse(fs.readFileSync('backups/2026_June_July_Europe_Thailand.json', 'utf8'));

const dom = new JSDOM(`
  <!DOCTYPE html>
  <body>
    <div id="transport-table-container"></div>
  </body>
`, { runScripts: 'dangerously' });
const window = dom.window;
global.window = window;
global.document = window.document;

global.appData = data.appData || data.legs || [];
global.journeys = data.journeys || [];
global.citiesData = [];
global.CITY_DATABASE = [];

// Stub all functions needed
global.formatJourneyDate = d => d;
global.formatCurrency = c => c;
global.getTransportIcon = () => 'Icon';
global.getLocationCodeDisplay = l => l || '—';
global.isTransportGroupExpanded = () => false;
global.renderJourneyMobileSummary = () => '';
global.renderTransportScheduleMobile = () => '';
global.renderTransportCarrierMobile = () => '';
global.renderTransportStatusCostMobile = () => '';
global.renderMobileStat = () => '';
global.calculateDuration = () => '2h';
global.calculateJourneyDuration = () => '2h';
global.escapeHtmlText = t => String(t || '');
global.parseCost = c => Number(c || 0);
global.isTransportMobileCardLayout = () => false;
global.formatJourneyNameDisplay = () => 'Name';
global.getSortedJourneys = () => global.journeys;
window.isEditMode = false;

const transportJs = fs.readFileSync('js/transport.js', 'utf8');
try {
  eval(transportJs);
  buildTransportTab();
  const html = document.getElementById('transport-table-container').innerHTML;
  console.log('HTML OUT LENGTH:', html.length);
  if (html.length === 0) console.log('ERROR: Empty HTML generated');
} catch(e) {
  console.log('ERROR:', e.stack);
}
