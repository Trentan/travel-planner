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
const { runTripLibraryXssTests } = require('./trip-library-xss.test');
const { run: runAutoStaysSuite } = require('./auto-stays-suite');
const { run: runTimezoneSuite } = require('./timezone-suite.test');
const { run: runScreenWakeLockSuite } = require('./screen-wake-lock-suite');
const { run: runSmartRemindersSuite } = require('./smart-reminders-suite');
const { runCityFuzzyMatchingSuite } = require('./city-fuzzy-matching.test');
const { runFormatHumanFilenameTests } = require('./format-human-filename.test');
const { runParseCurrencyAmountTests } = require('./parse-currency-amount.test');
const { runFormatCurrencyTests } = require('./format-currency.test');
const { runCompactFoodQuestTitleTests } = require('./compact-food-quest-title.test');
const { run: runFormatCompactJourneyDurationSuite } = require('./format-compact-journey-duration.test');
const { runFormatJourneySubLocationTests } = require('./format-journey-sub-location.test');
const { run: runTransportDurationSuite } = require('./transport-duration.test');
const { run: runTransitConnectorsSuite } = require('./transit-connectors-layover.test');
const { runLegManagementWysiwygSuite } = require('./leg-management-wysiwyg.test');
const { runGoogleAuthRenewalTests } = require('./google-auth-renewal.test');

async function run() {
  await runCloudStorageXssTests();
  await runTripLibraryXssTests();
  if (typeof runGoogleAuthRenewalTests === 'function') await runGoogleAuthRenewalTests();
  if (typeof runFormatHumanFilenameTests === 'function') await runFormatHumanFilenameTests();
  if (typeof runParseCurrencyAmountTests === 'function') await runParseCurrencyAmountTests();
  if (typeof runFormatCurrencyTests === 'function') await runFormatCurrencyTests();
  if (typeof runCompactFoodQuestTitleTests === 'function') await runCompactFoodQuestTitleTests();
  if (typeof runFormatCompactJourneyDurationSuite === 'function') await runFormatCompactJourneyDurationSuite();
  if (typeof runFormatJourneySubLocationTests === 'function') await runFormatJourneySubLocationTests();
  if (typeof runTimezoneSuite === 'function') await runTimezoneSuite();
  if (typeof runCityFuzzyMatchingSuite === 'function') await runCityFuzzyMatchingSuite();
  if (typeof runTransportDurationSuite === 'function') await runTransportDurationSuite();
  if (typeof runTransitConnectorsSuite === 'function') await runTransitConnectorsSuite();
  if (typeof runLegManagementWysiwygSuite === 'function') await runLegManagementWysiwygSuite();
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
