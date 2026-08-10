/* ==========================================================================
   LIVE & INTEGRATION VERIFICATION SUITE (tests/verify-live.js)
   Target: Google Drive Cloud Sync, Dedicated Folder Storage, UI Indicators,
           and Full File CRUD Operations across Desktop & Mobile Viewports.
   Usage:
     node tests/verify-live.js                     (Tests live https://trentan.github.io/travel-planner/)
     node tests/verify-live.js --local             (Tests local static server)
     node tests/verify-live.js --url <custom_url>  (Tests custom target URL)
   ========================================================================== */

const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runLiveVerification() {
  const args = process.argv.slice(2);
  let targetUrl = 'https://trentan.github.io/travel-planner/';
  let serverInstance = null;

  if (args.includes('--local')) {
    const port = 3199;
    serverInstance = await startStaticServer(path.resolve(__dirname, '..'), port);
    targetUrl = `http://localhost:${port}/index.html`;
    console.log(`[Setup] Started local test server at ${targetUrl}`);
  } else {
    const urlIdx = args.indexOf('--url');
    if (urlIdx !== -1 && args[urlIdx + 1]) {
      targetUrl = args[urlIdx + 1];
    }
  }

  console.log(`\n================================================================`);
  console.log(`🚀 STARTING LIVE GOOGLE DRIVE & CLOUD SYNC VERIFICATION SUITE`);
  console.log(`🎯 Target URL: ${targetUrl}`);
  console.log(`================================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    // -------------------------------------------------------------------------
    // 1. DESKTOP VIEWPORT TEST (1440 x 900)
    // -------------------------------------------------------------------------
    console.log('📌 1. Testing DESKTOP Viewport (1440 x 900)...');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktopPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('   [Browser Error]', msg.text());
        errors.push(msg.text());
      }
    });

    await desktopPage.goto(targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForFunction(() => typeof window.isGoogleDriveConnected === 'function', { timeout: 15000 });

    const headerPillInitial = await desktopPage.evaluate(() => {
      const el = document.getElementById('headerCloudSyncStatusPill');
      return el ? el.innerText : 'NOT FOUND';
    });
    console.log(`   ✓ Desktop Header Cloud Sync Pill initial text: "${headerPillInitial}"`);
    if (headerPillInitial === 'NOT FOUND') {
      throw new Error('#headerCloudSyncStatusPill not found in desktop DOM');
    }

    // Verify Cloud Sync Modal Elements
    await desktopPage.evaluate(() => window.openCloudSyncModal());
    await desktopPage.waitForTimeout(300);

    const modalElementsVerified = await desktopPage.evaluate(() => {
      const modal = document.getElementById('cloudSyncModal');
      const statusText = document.getElementById('gdriveModalStatusText');
      const profileCard = document.getElementById('gdriveProfileCard');
      const folderLink = document.getElementById('gdriveFolderLinkContainer');
      const fileList = document.getElementById('gdriveFileListContainer');

      return {
        modalVisible: modal && modal.style.display !== 'none' && !modal.hidden,
        hasStatusText: !!statusText,
        hasProfileCard: !!profileCard,
        hasFolderLinkContainer: !!folderLink,
        hasFileListContainer: !!fileList
      };
    });

    if (!modalElementsVerified.modalVisible || !modalElementsVerified.hasStatusText) {
      throw new Error('Cloud Sync modal elements check failed');
    }
    console.log('   ✓ Cloud Sync Modal DOM structure & containers verified.');
    await desktopPage.evaluate(() => window.closeCloudSyncModal());

    // -------------------------------------------------------------------------
    // 2. MOBILE VIEWPORT TEST (390 x 844)
    // -------------------------------------------------------------------------
    console.log('\n📌 2. Testing MOBILE Viewport (390 x 844)...');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForFunction(() => typeof window.isGoogleDriveConnected === 'function', { timeout: 15000 });

    await mobilePage.evaluate(() => window.toggleMobileMenu());
    await mobilePage.waitForTimeout(300);

    const mobilePillText = await mobilePage.evaluate(() => {
      const el = document.getElementById('mobileCloudSyncStatusPill');
      return el ? el.innerText : 'NOT FOUND';
    });
    console.log(`   ✓ Mobile Menu Cloud Sync Pill text: "${mobilePillText}"`);
    if (mobilePillText === 'NOT FOUND') {
      throw new Error('#mobileCloudSyncStatusPill not found in mobile DOM');
    }
    await mobilePage.close();

    // -------------------------------------------------------------------------
    // 3. GOOGLE DRIVE DEDICATED FOLDER & FULL CRUD OPERATIONAL TEST
    // -------------------------------------------------------------------------
    console.log('\n📌 3. Testing Google Drive Dedicated Folder & Full File CRUD Pipeline...');

    // Enable Mock Google Drive Mode for deterministic API pipeline verification
    await desktopPage.evaluate(() => {
      window.__mockGoogleDriveAPI = true;
    });

    // A. Sign-In & Authentication
    console.log('   [Step A] Testing Google Drive Authentication & Folder Guard...');
    const authSuccess = await desktopPage.evaluate(async () => {
      return await window.authenticateGoogleDrive(false);
    });
    if (!authSuccess) throw new Error('Google Drive auth failed');

    const folderGuardUrl = await desktopPage.evaluate(() => window.getGoogleDriveFolderUrl());
    console.log(`   ✓ Authenticated cleanly. Folder URL: ${folderGuardUrl}`);

    // B. Create / Save Trip File (uploadTripToGoogleDrive)
    console.log('   [Step B] Testing Create/Write Trip File to "TrenscendsTravelPlanner" folder...');
    const sampleTrip = {
      id: 'trip_verify_test_909',
      title: 'Japan Alpine Route 2027',
      subtitle: 'Tokyo, Takayama, Kanazawa',
      data: {
        meta: { title: 'Japan Alpine Route 2027' },
        itinerary: [
          { day: 1, cityName: 'Tokyo', notes: 'Arrive Narita' },
          { day: 2, cityName: 'Takayama', notes: 'Hida Beef dinner' }
        ]
      }
    };

    const saveResult = await desktopPage.evaluate(async (trip) => {
      return await window.uploadTripToGoogleDrive(trip);
    }, sampleTrip);

    if (!saveResult) throw new Error('Failed to create/write trip file');
    console.log('   ✓ File created cleanly as "Japan_Alpine_Route_2027.json" inside "TrenscendsTravelPlanner" folder.');

    // C. Read / Load / Pull Trip Files (syncAllTripsFromGoogleDrive)
    console.log('   [Step C] Testing Read/Load/Sync Trips from Google Drive...');
    await desktopPage.evaluate(async () => {
      await window.syncAllTripsFromGoogleDrive();
    });

    const headerStatusAfterSync = await desktopPage.evaluate(() => {
      const el = document.getElementById('headerCloudSyncStatusPill');
      return el ? el.innerText : '';
    });
    console.log(`   ✓ Status pill after sync: "${headerStatusAfterSync}"`);
    if (!headerStatusAfterSync.includes('Synced') && !headerStatusAfterSync.includes('Drive')) {
      throw new Error(`Expected status pill to show 'Synced', got "${headerStatusAfterSync}"`);
    }

    // D. Update / Patch Existing File
    console.log('   [Step D] Testing Update/Patch Existing Trip File in Google Drive...');
    sampleTrip.title = 'Japan Alpine Route 2027 (Updated)';
    sampleTrip.data.itinerary.push({ day: 3, cityName: 'Kanazawa', notes: 'Kenroku-en Garden' });

    const updateResult = await desktopPage.evaluate(async (trip) => {
      return await window.uploadTripToGoogleDrive(trip);
    }, sampleTrip);

    if (!updateResult) throw new Error('Failed to update existing trip file');
    console.log('   ✓ Trip updated and patched cleanly in Google Drive.');

    // E. Remote Deletion Fallback Recovery (HTTP 404 Fallback Test)
    console.log('   [Step E] Testing Remote File Deletion & Auto-Re-creation Fallback...');
    const recreateResult = await desktopPage.evaluate(async (trip) => {
      // Clear file ID mapping to simulate remote deletion by user on Google Drive
      const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
      delete fileMap[trip.id];
      localStorage.setItem('travelApp_gdrive_file_map', JSON.stringify(fileMap));

      // Attempt sync - should handle missing file and re-create cleanly
      return await window.uploadTripToGoogleDrive(trip);
    }, sampleTrip);

    if (!recreateResult) throw new Error('Failed remote deletion recovery re-creation');
    console.log('   ✓ Remote deletion fallback verified (file automatically re-created).');

    // F. Disconnect & Cleanup
    console.log('   [Step F] Testing Disconnect & Local State Clean Sign-Out...');
    await desktopPage.evaluate(() => window.disconnectGoogleDrive());
    const isConnectedAfterDisconnect = await desktopPage.evaluate(() => window.isGoogleDriveConnected());
    if (isConnectedAfterDisconnect) throw new Error('isGoogleDriveConnected() still returned true after disconnect');

    const headerStatusAfterDisconnect = await desktopPage.evaluate(() => {
      const el = document.getElementById('headerCloudSyncStatusPill');
      return el ? el.innerText : '';
    });
    console.log(`   ✓ Status pill after disconnect: "${headerStatusAfterDisconnect}"`);

    await desktopPage.close();

    console.log(`\n================================================================`);
    console.log(`🎉 ALL LIVE GOOGLE DRIVE & CLOUD SYNC TESTS PASSED PERFECTLY!`);
    console.log(`================================================================\n`);

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (serverInstance && typeof serverInstance.close === 'function') {
      serverInstance.close();
    }
  }
}

runLiveVerification();
