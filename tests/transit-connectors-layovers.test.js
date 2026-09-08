const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function run() {
  const transportJs = loadSource(path.join('js', 'transport.js'));
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));

  const context = createVmContext({
    addEventListener: () => {},
    removeEventListener: () => {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    },
    appData: [],
    journeys: [],
    stays: [],
    citiesData: [],
    isEditMode: false,
    formatCurrency: v => '$' + v
  });
  context.window = context;
  context.addEventListener = () => {};
  context.removeEventListener = () => {};

  runScriptInContext(transportJs, context, 'js/transport.js');
  runScriptInContext(itineraryJs, context, 'js/itinerary.js');

  const {
    parseTimeToMinutes,
    formatLayoverBufferText,
    getLayoverWarningStatus,
    calculateLayoverBuffer,
    renderTimelineConnector
  } = context;

  assert(typeof parseTimeToMinutes === 'function', 'parseTimeToMinutes should be exported');
  assert(typeof formatLayoverBufferText === 'function', 'formatLayoverBufferText should be exported');
  assert(typeof getLayoverWarningStatus === 'function', 'getLayoverWarningStatus should be exported');
  assert(typeof calculateLayoverBuffer === 'function', 'calculateLayoverBuffer should be exported');
  assert(typeof renderTimelineConnector === 'function', 'renderTimelineConnector should be exported');

  // 1. parseTimeToMinutes
  assert(parseTimeToMinutes('10:30') === 630, '10:30 should parse to 630 minutes');
  assert(parseTimeToMinutes('00:00') === 0, '00:00 should parse to 0 minutes');
  assert(parseTimeToMinutes('23:59') === 1439, '23:59 should parse to 1439 minutes');
  assert(parseTimeToMinutes(null) === null, 'null time should return null');

  // 2. formatLayoverBufferText
  assert(formatLayoverBufferText(75) === '1h 15m', '75m buffer should format as "1h 15m"');
  assert(formatLayoverBufferText(45) === '45m', '45m buffer should format as "45m"');
  assert(formatLayoverBufferText(120) === '2h', '120m buffer should format as "2h"');
  assert(formatLayoverBufferText(-30) === '-30m', '-30m buffer should format as "-30m"');

  // 3. getLayoverWarningStatus
  assert(getLayoverWarningStatus(-15, 'flight') === 'clash', 'Negative buffer should be clash for flights');
  assert(getLayoverWarningStatus(-5, 'train') === 'clash', 'Negative buffer should be clash for trains');

  assert(getLayoverWarningStatus(45, 'flight') === 'tight', 'Flight buffer < 90m should be tight');
  assert(getLayoverWarningStatus(89, 'flight') === 'tight', 'Flight buffer 89m should be tight');
  assert(getLayoverWarningStatus(90, 'flight') === 'ok', 'Flight buffer >= 90m should be ok');

  assert(getLayoverWarningStatus(10, 'train') === 'tight', 'Train buffer < 20m should be tight');
  assert(getLayoverWarningStatus(19, 'train') === 'tight', 'Train buffer 19m should be tight');
  assert(getLayoverWarningStatus(20, 'train') === 'ok', 'Train buffer >= 20m should be ok');

  // 4. calculateLayoverBuffer
  const itemA = { type: 'transport', transportType: 'flight', startTime: '10:00', endTime: '12:00', sortValue: 600, provider: 'EVA Air', routeCode: 'BR316' };
  const itemB = { type: 'transport', transportType: 'flight', startTime: '13:15', sortValue: 795, provider: 'Emirates', routeCode: 'EK412' };
  const bufferAB = calculateLayoverBuffer(itemA, itemB);
  assert(bufferAB === 75, 'Buffer between 12:00 arrival and 13:15 departure should be 75 minutes');

  const itemClash = { type: 'transport', transportType: 'train', startTime: '11:45', sortValue: 705 };
  const bufferClash = calculateLayoverBuffer(itemA, itemClash);
  assert(bufferClash === -15, 'Buffer when departure 11:45 is before preceding arrival 12:00 should be -15 minutes');

  // 5. renderTimelineConnector
  const connectorHtml = renderTimelineConnector(itemA, itemB);
  assert(connectorHtml.includes('timeline-transit-connector'), 'Connector HTML should contain connector class');
  assert(connectorHtml.includes('connector-status-tight'), 'Flight layover of 75m should trigger tight status class');
  assert(connectorHtml.includes('Tight Layover: 1h 15m'), 'Connector HTML should display Tight Layover badge text');
  assert(connectorHtml.includes('EVA Air') || connectorHtml.includes('Emirates'), 'Connector HTML should include carrier detail');

  const clashHtml = renderTimelineConnector(itemA, itemClash);
  assert(clashHtml.includes('connector-status-clash'), 'Clash buffer should trigger clash status class');
  assert(clashHtml.includes('Schedule Clash'), 'Clash connector HTML should display Schedule Clash warning');

  console.log('✅ ALL TRANSIT CONNECTOR & LAYOVER BUFFER TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run();
}

module.exports = { run };
