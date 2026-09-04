const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runMultiTripLibrarySuite() {
  console.log('--- Starting Multi-Trip Library & Switcher Integration Tests ---');
  let serverInstance;
  let browserInstance;

  try {
    const serverPort = 3199;
    serverInstance = await startStaticServer(path.resolve(__dirname, '..'), serverPort);
    console.log(`Static server running at http://localhost:${serverPort}`);

    browserInstance = await chromium.launch({ headless: true });
    const page = await browserInstance.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('Navigating to app...');
    await page.goto(`http://localhost:${serverPort}/index.html`, { waitUntil: 'domcontentloaded' });

    // Wait for app initialization
    await page.waitForFunction(() => typeof window.getAllTripsFromIndexedDB === 'function', { timeout: 10000 });

    console.log('1. Verifying default active trip and IndexedDB persistence...');
    const initialTrips = await page.evaluate(async () => {
      if (typeof window.saveActiveTripToStore === 'function') {
        await window.saveActiveTripToStore();
      }
      return await window.getAllTripsFromIndexedDB();
    });

    console.log(`Initial trips in library: ${initialTrips.length}`);
    if (initialTrips.length === 0) {
      throw new Error('Expected at least 1 trip in IndexedDB library after init');
    }

    console.log('2. Creating a new trip ("Japan Autumn 2026")...');
    await page.evaluate(async () => {
      await window.createNewTripDocument('Japan Autumn 2026', 'Tokyo, Kyoto & Osaka');
    });

    let updatedTrips = await page.evaluate(async () => {
      return await window.getAllTripsFromIndexedDB();
    });

    console.log(`Trips after creation: ${updatedTrips.length}`);
    const japanTrip = updatedTrips.find(t => t.title.includes('Japan'));
    if (!japanTrip) {
      throw new Error('Failed to find "Japan Autumn 2026" trip in IndexedDB library');
    }

    console.log('3. Verifying active trip switching to "Japan Autumn 2026"...');
    const activeTripId = await page.evaluate(() => window.getActiveTripId());
    if (activeTripId !== japanTrip.id) {
      throw new Error(`Active trip ID mismatch. Expected ${japanTrip.id}, got ${activeTripId}`);
    }

    console.log('4. Duplicating "Japan Autumn 2026"...');
    await page.evaluate(async (id) => {
      await window.duplicateTripDocument(id);
    }, japanTrip.id);

    updatedTrips = await page.evaluate(async () => {
      return await window.getAllTripsFromIndexedDB();
    });

    const copyTrip = updatedTrips.find(t => t.title.includes('Copy'));
    if (!copyTrip) {
      throw new Error('Failed to find duplicated trip in IndexedDB library');
    }
    console.log(`Successfully created duplicated trip: "${copyTrip.title}"`);

    console.log('5. Deleting duplicated trip...');
    await page.evaluate(async (id) => {
      await window.deleteTripDocument(id);
    }, copyTrip.id);

    updatedTrips = await page.evaluate(async () => {
      return await window.getAllTripsFromIndexedDB();
    });

    if (updatedTrips.some(t => t.id === copyTrip.id)) {
      throw new Error('Failed to delete trip from IndexedDB library');
    }

    console.log('6. Testing Header Switcher UI elements...');
    const headerTitle = await page.evaluate(() => {
      const el = document.getElementById('currentTripTitle');
      return el ? el.innerText : '';
    });
    console.log(`Current Header Trip Title: "${headerTitle}"`);
    if (!headerTitle) {
      throw new Error('Header trip title element is empty or missing');
    }

    console.log('7. Testing Trip Library Gallery Modal opening...');
    await page.evaluate(async () => {
      await window.openTripLibraryModal();
    });

    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('tripLibraryModal');
      return modal && !modal.hidden;
    });

    if (!modalVisible) {
      throw new Error('Trip Library modal failed to open');
    }
    console.log('Trip Library Modal successfully opened!');

    console.log('8. Testing JSON file import registration in Trips Gallery...');
    const countBeforeImport = (await page.evaluate(async () => await window.getAllTripsFromIndexedDB())).length;

    await page.evaluate(async () => {
      const sampleImport = {
        meta: { title: 'Thailand Explorer 2026', subtitle: 'Bangkok & Phuket' },
        itinerary: [{ cityName: 'Bangkok', days: [{ date: '2026-11-01', from: 'Bangkok', to: 'Bangkok' }] }]
      };
      const newTripId = 'trip_' + Date.now() + '_test';
      window.setActiveTripId(newTripId);
      await window.loadImportedPayload(sampleImport, 'Thailand_Explorer.json');
      await window.saveActiveTripToStore();
    });

    const tripsAfterImport = await page.evaluate(async () => await window.getAllTripsFromIndexedDB());
    console.log(`Trips count after import: ${tripsAfterImport.length}`);
    const importedTrip = tripsAfterImport.find(t => t.title && t.title.includes('Thailand'));
    if (!importedTrip) {
      throw new Error('Failed to auto-register imported JSON file into Trips Gallery');
    }
    console.log(`Successfully registered imported trip in gallery: "${importedTrip.title}"`);

    console.log('9. Testing loading an existing trip without meta (root array payload)...');
    await page.evaluate(async () => {
      const rootArrayImport = [
        { label: 'Paris', days: [{ date: '2026-12-01', from: 'Paris', to: 'Paris' }] }
      ];
      const rootTripId = 'trip_' + Date.now() + '_root';
      window.setActiveTripId(rootTripId);
      await window.loadImportedPayload(rootArrayImport, 'winter_paris_trip.json');
      await window.saveActiveTripToStore();
    });

    const titleAfterRootImport = await page.evaluate(() => {
      const el = document.getElementById('mainTitle');
      return el ? el.innerText : '';
    });
    console.log(`Loaded Root Array Trip Title: "${titleAfterRootImport}"`);
    if (!titleAfterRootImport || !titleAfterRootImport.toLowerCase().includes('paris')) {
      throw new Error(`Expected fallback title "Winter paris trip", got "${titleAfterRootImport}"`);
    }

    console.log('10. Testing XSS security fix in rendering trip metadata in Trip Library gallery and dropdown...');
    const xssDetected = await page.evaluate(async () => {
      window.__xssTriggered = false;
      const maliciousTrip = {
        id: 'trip_xss_<img src=x onerror=window.__xssTriggered=true>',
        title: 'XSS Test Trip <script>window.__xssTriggered=true</script>',
        subtitle: 'Sub <img src=x onerror=window.__xssTriggered=true>',
        flags: '<img src=x onerror=window.__xssTriggered=true>',
        dateRange: '2026-01-01 <script>window.__xssTriggered=true</script>',
        legCount: '1<img src=x onerror=window.__xssTriggered=true>',
        stayCount: '2<img src=x onerror=window.__xssTriggered=true>',
        updatedAt: '2026-01-01T00:00:00.000Z"<script>window.__xssTriggered=true</script>',
        data: { meta: { title: 'XSS Test' } }
      };

      if (typeof window.saveTripToIndexedDB === 'function') {
        await window.saveTripToIndexedDB(maliciousTrip);
      }

      await window.renderHeaderTripSwitcher();
      await window.renderTripGalleryGrid();

      return window.__xssTriggered;
    });

    if (xssDetected) {
      throw new Error('XSS payload was executed when rendering trip metadata in Trip Library!');
    }
    console.log('XSS test passed: no script payload executed during rendering.');

    console.log('✅ ALL MULTI-TRIP LIBRARY INTEGRATION TESTS PASSED CLEANLY!');
  } catch (err) {
    console.error('❌ MULTI-TRIP LIBRARY SUITE FAILED:', err);
    process.exit(1);
  } finally {
    if (browserInstance) await browserInstance.close();
    if (serverInstance && typeof serverInstance.close === 'function') serverInstance.close();
  }
}

runMultiTripLibrarySuite();
