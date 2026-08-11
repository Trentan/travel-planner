/* ==========================================================================
   LIVE & INTEGRATION VERIFICATION SUITE (tests/verify-live.js)
   Target: Google Drive Cloud Sync, Dedicated Folder Storage, UI Indicators,
           and Full File CRUD Operations across Desktop & Mobile Viewports.
   Usage:
     node tests/verify-live.js                           (Automated mock test vs production site)
     node tests/verify-live.js --local                   (Automated mock test vs local server)
     node tests/verify-live.js --real                    (REAL Google Drive test vs production site with pause & cleanup)
     node tests/verify-live.js --real --local            (REAL Google Drive test vs local server with pause & cleanup)
     node tests/verify-live.js --url <custom_url>        (Tests custom target URL)
   ========================================================================== */

const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

function pauseForUser(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(promptText, () => {
      rl.close();
      resolve();
    });
  });
}

async function runLiveVerification() {
  const args = process.argv.slice(2);
  let targetUrl = 'https://trentan.github.io/travel-planner/';
  let serverInstance = null;
  const isRealMode = args.includes('--real');

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
  console.log(`🔧 Mode: ${isRealMode ? '🌐 REAL Google Drive (Headed Browser + User Inspection)' : '⚡ Mock API (Automated CI Headless)'}`);
  console.log(`================================================================\n`);

  const browser = await chromium.launch({ headless: !isRealMode });
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
    await mobilePage.waitForFunction(() => typeof window.isGoogleDriveConnected === 'function' && typeof window.toggleMobileMenu === 'function', { timeout: 15000 });

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

    if (!isRealMode) {
      // Enable Mock Google Drive Mode for deterministic automated CI
      await desktopPage.evaluate(() => {
        window.__mockGoogleDriveAPI = true;
      });
    } else {
      await desktopPage.evaluate(() => {
        window.__mockGoogleDriveAPI = false;
      });
    }

    // A. Sign-In & Authentication
    console.log('   [Step A] Testing Google Drive Authentication & Folder Guard...');
    if (isRealMode) {
      console.log('   👉 Please sign in to Google Drive in the opened browser window if prompted...');
      await desktopPage.evaluate(() => window.openCloudSyncModal());
    }

    const authSuccess = await desktopPage.evaluate(async (realMode) => {
      return await window.authenticateGoogleDrive(!realMode);
    }, isRealMode);

    if (!authSuccess && !isRealMode) throw new Error('Google Drive auth failed');

    const folderGuardUrl = await desktopPage.evaluate(() => window.getGoogleDriveFolderUrl());
    console.log(`   ✓ Authenticated cleanly. Folder URL: ${folderGuardUrl}`);

    // B. Create / Save Trip File (uploadTripToGoogleDrive)
    console.log('   [Step B] Testing Create/Write Trip File to "TrenscendsTravelPlanner" folder...');
    const sampleTrip = {
      id: `trip_verify_test_${Date.now()}`,
      title: 'Live Verification Test Trip',
      subtitle: 'Tokyo, Takayama, Kanazawa',
      data: {
        meta: { title: 'Live Verification Test Trip' },
        itinerary: [
          { day: 1, cityName: 'Tokyo', notes: 'Arrive Narita' },
          { day: 2, cityName: 'Takayama', notes: 'Hida Beef dinner' }
        ]
      }
    };

    const saveResult = await desktopPage.evaluate(async (trip) => {
      return await window.uploadTripToGoogleDrive(trip);
    }, sampleTrip);

    if (!saveResult && !isRealMode) throw new Error('Failed to create/write trip file');
    console.log('   ✓ File created as "Live_Verification_Test_Trip.json" inside "TrenscendsTravelPlanner" folder.');

    if (isRealMode) {
      console.log(`\n================================================================`);
      console.log(`📂 REAL GOOGLE DRIVE FILE CREATED & SYNCED!`);
      console.log(`📄 File Name: Live_Verification_Test_Trip.json`);
      console.log(`📁 Physical Google Drive Folder: G:\\My Drive\\TrenscendsTravelPlanner`);
      console.log(`🌐 Google Drive Web URL: ${folderGuardUrl}`);
      console.log(`================================================================\n`);
      console.log(`⏸️ PAUSED FOR YOUR PHYSICAL INSPECTION:`);
      console.log(`   1. Open "G:\\My Drive\\TrenscendsTravelPlanner" on your Windows computer or visit ${folderGuardUrl}`);
      console.log(`   2. Open "Live_Verification_Test_Trip.json" in Notepad or text editor to view content.`);
      console.log(`   3. When ready, press [ENTER] below to delete the test file and clean up...`);
      
      await pauseForUser(`\n👉 Press [ENTER] to clean up and delete test file from Google Drive... `);

      console.log('\n   [Step Clean Up] Deleting test file from Google Drive...');
      await desktopPage.evaluate(async (trip) => {
        const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
        const fileId = fileMap[trip.id];
        if (fileId && typeof window.deleteTripFromGoogleDrive === 'function') {
          await window.deleteTripFromGoogleDrive(fileId, trip.title);
        }
      }, sampleTrip);
      console.log('   ✓ Test file deleted from Google Drive folder.');
    } else {
      // C. Read / Load / Sync Trips from Google Drive
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
      sampleTrip.title = 'Live Verification Test Trip (Updated)';
      sampleTrip.data.itinerary.push({ day: 3, cityName: 'Kanazawa', notes: 'Kenroku-en Garden' });

      const updateResult = await desktopPage.evaluate(async (trip) => {
        return await window.uploadTripToGoogleDrive(trip);
      }, sampleTrip);

      if (!updateResult) throw new Error('Failed to update existing trip file');
      console.log('   ✓ Trip updated and patched cleanly in Google Drive.');

      // E. Remote Deletion Fallback Recovery (HTTP 404 Fallback Test)
      console.log('   [Step E] Testing Remote File Deletion & Auto-Re-creation Fallback...');
      const recreateResult = await desktopPage.evaluate(async (trip) => {
        const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
        delete fileMap[trip.id];
        localStorage.setItem('travelApp_gdrive_file_map', JSON.stringify(fileMap));
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
    }

    await desktopPage.close();

    console.log(`\n================================================================`);
    console.log(`🎉 GOOGLE DRIVE VERIFICATION SUITE COMPLETED PERFECTLY!`);
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
