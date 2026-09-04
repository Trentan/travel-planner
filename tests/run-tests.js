const { run: runCoreSmoke } = require('./core-smoke');
const { run: runCityNavRegression } = require('./city-nav-regression');
const { run: runItem15Suite } = require('./item15-suite');
const { run: runFileIoSuite } = require('./file-io-robustness-suite');
const { run: runSuggestedSchedulingRegression } = require('./suggested-scheduling-regression');
const { run: runItineraryExploratoryUx } = require('./itinerary-exploratory-ux');
const { run: runBrowserSuite } = require('./browser-suite');
const { run: runSharePresetsVerify } = require('./share-presets-verify');
const { run: runIosPwaNavVerify } = require('./ios-pwa-nav-verify');
const { run: runAutoStaysSuite } = require('./auto-stays-suite');

async function run() {
  await runCoreSmoke();
  await runAutoStaysSuite();
  await runCityNavRegression();
  await runItem15Suite();
  await runFileIoSuite();
  await runSuggestedSchedulingRegression();
  await runItineraryExploratoryUx();
  await runSharePresetsVerify();
  await runIosPwaNavVerify();
  await runBrowserSuite();
  console.log('All travel planner tests passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
