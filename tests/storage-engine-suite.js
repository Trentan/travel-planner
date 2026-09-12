const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runStorageEngineSuite() {
  console.log('--- Starting Storage Engine & Cloud Sync Overhaul Suite (Milestone 10) ---');
  let serverInstance;
  let browserInstance;

  try {
    const serverPort = 3197;
    serverInstance = await startStaticServer(path.resolve(__dirname, '..'), serverPort);
    console.log(`Static server running at http://localhost:${serverPort}`);

    browserInstance = await chromium.launch({ headless: true });
    const page = await browserInstance.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('Navigating to app...');
    await page.goto(`http://localhost:${serverPort}/index.html`, { waitUntil: 'domcontentloaded' });

    // Wait for data.js and storage functions to be defined
    await page.waitForFunction(() => typeof window.getAllTripsFromIndexedDB === 'function', { timeout: 10000 });

    console.log('1. Testing Storage Quota & Persistence Telemetry APIs (Issues #288 & #301)...');
    const telemetry = await page.evaluate(async () => {
      const isPersisted = typeof window.isStoragePersisted === 'function' ? await window.isStoragePersisted() : false;
      const tel = typeof window.getStorageTelemetry === 'function' ? await window.getStorageTelemetry() : null;
      const formatted = typeof window.formatBytes === 'function' ? window.formatBytes(15728640) : '';
      return { isPersisted, tel, formatted };
    });

    console.log('Storage telemetry result:', telemetry);
    if (!telemetry.tel || typeof telemetry.tel.usageFormatted !== 'string') {
      throw new Error('getStorageTelemetry() did not return expected object structure');
    }
    if (telemetry.formatted !== '15 MB') {
      throw new Error(`formatBytes calculation mismatch. Expected '15 MB', got '${telemetry.formatted}'`);
    }

    console.log('2. Testing BroadcastChannel trips cache invalidation (Issue #296)...');
    const cacheTest = await page.evaluate(async () => {
      if (typeof window.saveActiveTripToStore === 'function') {
        await window.saveActiveTripToStore();
      }
      // First fetch to populate cache
      const trips1 = await window.getAllTripsFromIndexedDB();
      // Broadcast invalidation
      if (typeof window.broadcastTripsCacheInvalidation === 'function') {
        window.broadcastTripsCacheInvalidation('INVALIDATE_CACHE');
      }
      // Second fetch after invalidation
      const trips2 = await window.getAllTripsFromIndexedDB();
      return { count1: trips1.length, count2: trips2.length };
    });
    console.log('Cache invalidation test result:', cacheTest);
    if (cacheTest.count1 === 0 || cacheTest.count2 === 0) {
      throw new Error('Trips returned 0 records after cache invalidation');
    }

    console.log('3. Testing Persistent IndexedDB Offline Mutation Queue (Issue #297)...');
    const queueResults = await page.evaluate(async () => {
      if (typeof window.clearOfflineSyncQueue === 'function') {
        await window.clearOfflineSyncQueue();
      }

      // Enqueue mutations
      await window.enqueueOfflineSyncMutation({
        tripId: 'trip_offline_test_1',
        action: 'UPSERT',
        data: { meta: { title: 'Offline Test Trip 1' } }
      });

      await window.enqueueOfflineSyncMutation({
        tripId: 'trip_offline_test_2',
        action: 'DELETE'
      });

      const count = await window.getOfflineSyncQueueCount();
      const items = await window.getOfflineSyncQueue();

      // Remove one item
      if (items.length > 0) {
        await window.removeOfflineSyncMutation(items[0].id);
      }

      const countAfterRemove = await window.getOfflineSyncQueueCount();
      const remainingItems = await window.getOfflineSyncQueue();

      return { count, countAfterRemove, remainingAction: remainingItems[0]?.action };
    });

    console.log('Offline queue test result:', queueResults);
    if (queueResults.count !== 2) {
      throw new Error(`Expected queue count 2, got ${queueResults.count}`);
    }
    if (queueResults.countAfterRemove !== 1 || queueResults.remainingAction !== 'DELETE') {
      throw new Error('Failed to remove mutation from offline queue correctly');
    }

    console.log('4. Testing Pre-Load Safety Snapshot before loading external hash trips (Issues #285 & #298)...');
    const safetySnapshotResult = await page.evaluate(async () => {
      // Setup current trip data
      if (typeof window.createNewTripDocument === 'function') {
        await window.createNewTripDocument('Safety Snapshot Source Trip', 'Paris & Rome');
      }

      const activeTripIdBefore = window.getActiveTripId ? window.getActiveTripId() : '';

      // Create a compressed share payload
      const dummyTrip = {
        meta: { title: 'External Shared Trip 2026', subtitle: 'Imported from URL' },
        itinerary: [{ cityName: 'London', days: [{ date: '2026-08-01', dayNumber: 1, sights: [] }] }],
        stays: [],
        cities: [{ name: 'London', country: 'United Kingdom', countryCode: 'GB' }]
      };

      let shareUrl = '';
      if (typeof window.generateShareLink === 'function') {
        shareUrl = await window.generateShareLink(dummyTrip);
      }

      // Set URL hash to simulate receiving share link
      const hashPart = shareUrl.split('#')[1] || '';
      window.location.hash = hashPart;

      // Trigger checkUrlForImportedTrip
      await window.checkUrlForImportedTrip();

      const preHashBackup = localStorage.getItem('travelApp_pre_hash_backup');
      const allTrips = await window.getAllTripsFromIndexedDB(true);
      const preservedTrip = allTrips.find(t => t.title.includes('Safety Snapshot Source Trip'));

      return {
        hasPreHashBackup: !!preHashBackup,
        hasPreservedTrip: !!preservedTrip,
        newActiveTripTitle: document.getElementById('tripTitle')?.innerText || ''
      };
    });

    console.log('Pre-load safety snapshot result:', safetySnapshotResult);
    if (!safetySnapshotResult.hasPreHashBackup) {
      throw new Error('travelApp_pre_hash_backup was not saved to localStorage');
    }
    if (!safetySnapshotResult.hasPreservedTrip) {
      throw new Error('Pre-existing trip was not preserved in IndexedDB trip library');
    }

    console.log('5. Testing Trip Library UI storage telemetry & persistent storage chip...');
    await page.evaluate(async () => {
      window.openTripLibraryModal();
      if (typeof window.renderStorageTelemetry === 'function') {
        await window.renderStorageTelemetry();
      }
    });

    const uiChecks = await page.evaluate(() => {
      const quotaText = document.getElementById('storageQuotaText');
      const persistBtn = document.getElementById('requestPersistStorageBtn');
      const modal = document.getElementById('tripLibraryModal');
      return {
        modalVisible: modal && !modal.hidden,
        quotaText: quotaText ? quotaText.innerText : '',
        persistBtnExists: !!persistBtn
      };
    });

    console.log('UI checks result:', uiChecks);
    if (!uiChecks.modalVisible) {
      throw new Error('Trip Library modal failed to open');
    }
    if (!uiChecks.quotaText.includes('Storage:')) {
      throw new Error(`Expected storage quota text to contain 'Storage:', got '${uiChecks.quotaText}'`);
    }

    console.log('✅ ALL STORAGE ENGINE & CLOUD SYNC OVERHAUL TESTS PASSED CLEANLY!');
    return true;
  } finally {
    if (browserInstance) await browserInstance.close();
    if (serverInstance) serverInstance.close();
  }
}

if (require.main === module) {
  runStorageEngineSuite().catch(err => {
    console.error('❌ Storage Engine suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runStorageEngineSuite };
