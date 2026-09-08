const { run: runCoreSmoke } = require('./core-smoke');
const { run: runCityNavRegression } = require('./city-nav-regression');
const { run: runItem15Suite } = require('./item15-suite');
const { run: runFileIoSuite } = require('./file-io-robustness-suite');
const { run: runSuggestedSchedulingRegression } = require('./suggested-scheduling-regression');
const { run: runItineraryExploratoryUx } = require('./itinerary-exploratory-ux');
const { run: runBrowserSuite } = require('./browser-suite');
const { run: runSharePresetsVerify } = require('./share-presets-verify');
const { run: runIosPwaNavVerify } = require('./ios-pwa-nav-verify');
const { run: runPwaShortcutsOfflineTests } = require('./pwa-shortcuts-offline.test');
const { runCloudStorageXssTests } = require('./cloud-storage-xss.test');
const { run: runAutoStaysSuite } = require('./auto-stays-suite');
const { run: runTimezoneSuite } = require('./timezone-suite.test');
const { run: runScreenWakeLockSuite } = require('./screen-wake-lock-suite');
const { run: runSmartRemindersSuite } = require('./smart-reminders-suite');
const { run: runCityFuzzyMatchingSuite } = require('./city-fuzzy-matching.test');
const { run: runTransitConnectorsSuite } = require('./transit-connectors-layovers.test');

async function run() {
  await runCloudStorageXssTests();
  if (typeof runTimezoneSuite === 'function') await runTimezoneSuite();
  if (typeof runCityFuzzyMatchingSuite === 'function') await runCityFuzzyMatchingSuite();
  if (typeof runTransitConnectorsSuite === 'function') await runTransitConnectorsSuite();
  await runCoreSmoke();
  await runPwaShortcutsOfflineTests();
  await runAutoStaysSuite();
  await runSmartRemindersSuite();
  await runScreenWakeLockSuite();
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
