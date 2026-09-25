const { run: runCoreSmoke } = require('./core-smoke');
const { stopAllServers } = require('./lib/static-server');
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
const { runTripLibraryGDriveSyncTests } = require('./trip-library-gdrive-sync.test');
const { runTripSummaryXssTests } = require('./trip-summary-xss.test');
const { runTransportModalXssTests } = require('./transport-modal-xss.test');
const { runLegReorderXssTests } = require('./leg-reorder-xss.test');
const { run: runAutoStaysSuite } = require('./auto-stays-suite');
const { run: runTimezoneSuite } = require('./timezone-suite.test');
const { run: runScreenWakeLockSuite } = require('./screen-wake-lock-suite');
const { run: runSmartRemindersSuite } = require('./smart-reminders-suite');
const { runCityFuzzyMatchingSuite } = require('./city-fuzzy-matching.test');
const { runFormatHumanFilenameTests } = require('./format-human-filename.test');
const { runGetActivityEmojiTests } = require('./get-activity-emoji.test');
const { runParseCurrencyAmountTests } = require('./parse-currency-amount.test');
const { runFormatCurrencyTests } = require('./format-currency.test');
const { runCompactFoodQuestTitleTests } = require('./compact-food-quest-title.test');
const { run: runFormatCompactJourneyDurationSuite } = require('./format-compact-journey-duration.test');
const { runFormatJourneySubLocationTests } = require('./format-journey-sub-location.test');
const { run: runTransportDurationSuite } = require('./transport-duration.test');
const { run: runTransitConnectorsSuite } = require('./transit-connectors-layover.test');
const { runLegManagementWysiwygSuite } = require('./leg-management-wysiwyg.test');
const { runGoogleAuthRenewalTests } = require('./google-auth-renewal.test');
const { runDualPathWizardSuite } = require('./dual-path-wizard.test');
const { runStorageEngineSuite } = require('./storage-engine-suite');
const { runDesktopSplitPrintUnitTests } = require('./desktop-split-print.test');
const { runUploadAllLocalTripsBenchmarkAndTest } = require('./upload-all-local-trips.test');
const { runWeatherNotesSuite } = require('./weather-notes-test');
const { runMapprImportTests } = require('./mappr-import.test');
const { runIssuesVerification } = require('./issues-89-91-95-96-verify');
const { runTripDayMetricsTests } = require('./trip-day-metrics.test');
const { runAiBuilderImportTests } = require('./ai-builder-import.test');
const { runRebuildAndAirportCodesTests } = require('./rebuild-itinerary-airport-codes.test');

async function run() {
  try {
    if (typeof runRebuildAndAirportCodesTests === 'function') await runRebuildAndAirportCodesTests();
    if (typeof runAiBuilderImportTests === 'function') await runAiBuilderImportTests();
    if (typeof runTripDayMetricsTests === 'function') runTripDayMetricsTests();
    if (typeof runIssuesVerification === 'function') await runIssuesVerification();
    if (typeof runMapprImportTests === 'function') await runMapprImportTests();
    if (typeof runWeatherNotesSuite === 'function') runWeatherNotesSuite();
    if (typeof runDesktopSplitPrintUnitTests === 'function') await runDesktopSplitPrintUnitTests();
    await runCloudStorageXssTests();
    await runTripLibraryXssTests();
    if (typeof runTripLibraryGDriveSyncTests === 'function') await runTripLibraryGDriveSyncTests();
    if (typeof runTripSummaryXssTests === 'function') await runTripSummaryXssTests();
    if (typeof runTransportModalXssTests === 'function') await runTransportModalXssTests();
    if (typeof runLegReorderXssTests === 'function') await runLegReorderXssTests();
    if (typeof runStorageEngineSuite === 'function') await runStorageEngineSuite();
    if (typeof runUploadAllLocalTripsBenchmarkAndTest === 'function') await runUploadAllLocalTripsBenchmarkAndTest();
    if (typeof runGoogleAuthRenewalTests === 'function') await runGoogleAuthRenewalTests();
    if (typeof runDualPathWizardSuite === 'function') await runDualPathWizardSuite();
    if (typeof runFormatHumanFilenameTests === 'function') await runFormatHumanFilenameTests();
    if (typeof runGetActivityEmojiTests === 'function') await runGetActivityEmojiTests();
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
  } finally {
    if (typeof stopAllServers === 'function') {
      await stopAllServers();
    }
  }
}

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error.stack || error.message);
      process.exit(1);
    });
}

module.exports = { run };
