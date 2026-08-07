const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runCloudSyncSuite() {
  console.log('--- Starting Google Drive AppData Cloud Sync Integration Tests ---');
  let serverInstance;
  let browserInstance;

  try {
    const serverPort = 3198;
    serverInstance = await startStaticServer(path.resolve(__dirname, '..'), serverPort);
    console.log(`Static server running at http://localhost:${serverPort}`);

    browserInstance = await chromium.launch({ headless: true });
    const page = await browserInstance.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('Navigating to app...');
    await page.goto(`http://localhost:${serverPort}/index.html`, { waitUntil: 'domcontentloaded' });

    // Wait for cloud-storage.js initialization
    await page.waitForFunction(() => typeof window.isGoogleDriveConnected === 'function', { timeout: 10000 });

    console.log('1. Verifying initial offline/disconnected cloud status pill...');
    const initialStatus = await page.evaluate(() => {
      const pill = document.getElementById('cloudSyncStatusPill');
      return pill ? pill.innerText : '';
    });
    console.log(`Initial Status Pill Text: "${initialStatus}"`);

    console.log('2. Enabling Mock Google Drive API Mode...');
    await page.evaluate(() => {
      window.__mockGoogleDriveAPI = true;
    });

    console.log('3. Authenticating Google Drive Mock connection...');
    const authResult = await page.evaluate(async () => {
      return await window.authenticateGoogleDrive(false);
    });
    if (!authResult) {
      throw new Error('Google Drive mock authentication failed');
    }

    const isConnected = await page.evaluate(() => window.isGoogleDriveConnected());
    if (!isConnected) {
      throw new Error('isGoogleDriveConnected() returned false after auth');
    }
    console.log('Google Drive mock connection verified successfully!');

    console.log('4. Testing uploading trip document to Google Drive appDataFolder...');
    const uploadResult = await page.evaluate(async () => {
      const sampleTrip = {
        id: 'trip_cloud_test_101',
        title: 'Cloud Europe 2026',
        subtitle: 'Paris & Vienna',
        data: { meta: { title: 'Cloud Europe 2026' }, itinerary: [] }
      };
      return await window.uploadTripToGoogleDrive(sampleTrip);
    });

    if (!uploadResult) {
      throw new Error('Failed to upload trip document to Google Drive');
    }
    console.log('Successfully uploaded trip to Google Drive appDataFolder!');

    console.log('5. Testing pulling trips from Google Drive appDataFolder...');
    await page.evaluate(async () => {
      await window.syncAllTripsFromGoogleDrive();
    });

    const statusPillAfterSync = await page.evaluate(() => {
      const pill = document.getElementById('cloudSyncStatusPill');
      return pill ? pill.innerText : '';
    });
    console.log(`Cloud Status Pill after sync: "${statusPillAfterSync}"`);
    if (!statusPillAfterSync.includes('Synced')) {
      throw new Error(`Expected status pill to indicate 'Synced', got "${statusPillAfterSync}"`);
    }

    console.log('6. Testing Cloud Sync Modal opening and closing...');
    await page.evaluate(() => {
      window.openCloudSyncModal();
    });

    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('cloudSyncModal');
      return modal && !modal.hidden;
    });

    if (!modalVisible) {
      throw new Error('Cloud Sync modal failed to open');
    }
    console.log('Cloud Sync Modal successfully opened!');

    await page.evaluate(() => {
      window.closeCloudSyncModal();
    });

    console.log('✅ ALL GOOGLE DRIVE CLOUD SYNC INTEGRATION TESTS PASSED CLEANLY!');
  } catch (err) {
    console.error('❌ GOOGLE DRIVE CLOUD SYNC SUITE FAILED:', err);
    process.exit(1);
  } finally {
    if (browserInstance) await browserInstance.close();
    if (serverInstance && typeof serverInstance.close === 'function') serverInstance.close();
  }
}

runCloudSyncSuite();
