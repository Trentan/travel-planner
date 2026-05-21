const { run: runCoreSmoke } = require('./core-smoke');
const { run: runCityNavRegression } = require('./city-nav-regression');
const { run: runItem15Suite } = require('./item15-suite');
const { run: runSuggestedSchedulingRegression } = require('./suggested-scheduling-regression');
const { run: runItineraryExploratoryUx } = require('./itinerary-exploratory-ux');
const { run: runBrowserSuite } = require('./browser-suite');

async function run() {
  await runCoreSmoke();
  await runCityNavRegression();
  await runItem15Suite();
  await runSuggestedSchedulingRegression();
  await runItineraryExploratoryUx();
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
