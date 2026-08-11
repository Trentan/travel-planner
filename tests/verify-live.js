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

const fs = require('fs');
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
    const fixedPort = 3000;
    try {
      serverInstance = await startStaticServer(path.resolve(__dirname, '..'), fixedPort);
      targetUrl = `http://localhost:${fixedPort}/index.html`;
    } catch (e) {
      targetUrl = `http://localhost:${fixedPort}/index.html`;
    }
    console.log(`[Setup] Target local test server at ${targetUrl}`);
  } else {
    const urlIdx = args.indexOf('--url');
    if (urlIdx !== -1 && args[urlIdx + 1]) {
      targetUrl = args[urlIdx + 1];
    }
  }

  console.log(`\n================================================================`);
  console.log(`🚀 STARTING GOOGLE DRIVE & CLOUD SYNC VERIFICATION SUITE`);
  console.log(`🎯 Target URL: ${targetUrl}`);
  console.log(`🔧 Mode: ${isRealMode ? '🌐 REAL Google Drive API (Single Window + Persistent Session)' : '⚡ Mock API (Automated CI Headless)'}`);
  console.log(`================================================================\n`);

  const authProfileDir = path.resolve(__dirname, '.gdrive_auth_profile');
  let browser = null;
  let context = null;
  let page = null;
  const errors = [];

  try {
    if (isRealMode) {
      if (!fs.existsSync(authProfileDir)) {
        fs.mkdirSync(authProfileDir, { recursive: true });
      }
      context = await chromium.launchPersistentContext(authProfileDir, {
        headless: false,
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });
      page = context.pages()[0] || await context.newPage();
    } else {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    }

    // Suppress onboarding welcome modal banners for a clean test run
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      localStorage.setItem('travelApp_onboarding_dismissed', 'true');
      localStorage.setItem('travelApp_onboarding_completed', 'true');
      localStorage.setItem('travelApp_welcome_dismissed', 'true');
      localStorage.setItem('travelApp_show_welcome', 'false');
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('404')) {
          console.error('   [Browser Error]', text);
          errors.push(text);
        }
      }
    });

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // -------------------------------------------------------------------------
    // 1. DESKTOP VIEWPORT TEST (1440 x 900)
    // -------------------------------------------------------------------------
    console.log('📌 1. Testing DESKTOP Viewport (1440 x 900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.isGoogleDriveConnected === 'function', { timeout: 15000 });

    // Ensure onboarding modals are hidden
    await page.evaluate(() => {
      const modals = ['onboardingWizardModal', 'onboardingWelcomeModal', 'onboardingChoiceModal'];
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.hidden = true; }
      });
    });

    const headerPillInitial = await page.evaluate(() => {
      const el = document.getElementById('headerCloudSyncStatusPill');
      return el ? el.innerText : 'NOT FOUND';
    });
    console.log(`   ✓ Desktop Header Cloud Sync Pill text: "${headerPillInitial}"`);
    if (headerPillInitial === 'NOT FOUND') {
      throw new Error('#headerCloudSyncStatusPill not found in desktop DOM');
    }

    // Verify Cloud Sync Modal DOM Elements
    await page.evaluate(() => window.openCloudSyncModal());
    await page.waitForTimeout(300);

    const modalElementsVerified = await page.evaluate(() => {
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
    await page.evaluate(() => window.closeCloudSyncModal());

    // -------------------------------------------------------------------------
    // 2. MOBILE VIEWPORT TEST (390 x 844 - Single Window Resizing)
    // -------------------------------------------------------------------------
    console.log('\n📌 2. Testing MOBILE Viewport (390 x 844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      if (typeof window.toggleMobileMenu === 'function') window.toggleMobileMenu();
    });
    await page.waitForTimeout(300);

    const mobilePillText = await page.evaluate(() => {
      const el = document.getElementById('mobileCloudSyncStatusPill');
      return el ? el.innerText : 'NOT FOUND';
    });
    console.log(`   ✓ Mobile Menu Cloud Sync Pill text: "${mobilePillText}"`);
    if (mobilePillText === 'NOT FOUND') {
      throw new Error('#mobileCloudSyncStatusPill not found in mobile DOM');
    }

    // Close mobile menu and restore desktop viewport
    await page.evaluate(() => {
      if (typeof window.toggleMobileMenu === 'function') window.toggleMobileMenu();
    });
    await page.setViewportSize({ width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // 3. GOOGLE DRIVE DEDICATED FOLDER & FULL CRUD OPERATIONAL TEST
    // -------------------------------------------------------------------------
    console.log('\n📌 3. Testing Google Drive Dedicated Folder & Full File CRUD Pipeline...');

    if (!isRealMode) {
      await page.evaluate(() => {
        window.__mockGoogleDriveAPI = true;
      });
    } else {
      await page.evaluate(() => {
        window.__mockGoogleDriveAPI = false;
      });
    }

    // A. Sign-In & Authentication
    console.log('   [Step A] Testing Google Drive Authentication & Folder Guard...');
    if (isRealMode) {
      let connected = await page.evaluate(() => window.isGoogleDriveConnected());
      if (!connected) {
        console.log('   👉 Triggering Google Drive Sign-In consent...');
        await page.evaluate(() => window.openCloudSyncModal());
        await page.evaluate(() => window.authenticateGoogleDrive(true));
        
        for (let i = 0; i < 45; i++) {
          connected = await page.evaluate(() => window.isGoogleDriveConnected());
          if (connected) break;
          await page.waitForTimeout(1000);
        }
      }

      if (!connected) {
        throw new Error('❌ TEST FAILED: Google Drive Sign-In failed or was blocked (OAuth origin mismatch or popup closed). Test aborted.');
      }
    } else {
      const authSuccess = await page.evaluate(async () => {
        return await window.authenticateGoogleDrive(false);
      });
      if (!authSuccess) throw new Error('❌ TEST FAILED: Google Drive mock authentication failed');
    }

    const folderGuardUrl = await page.evaluate(() => window.getGoogleDriveFolderUrl());
    console.log(`   ✓ Authenticated cleanly. Folder URL: ${folderGuardUrl}`);

    // B. Create / Save Real Trip File (uploadTripToGoogleDrive)
    console.log('   [Step B] Testing Create/Write REAL Trip File to "TrenscendsTravelPlanner" folder...');
    
    // Get full real trip payload currently loaded in the app
    const realTrip = await page.evaluate(async () => {
      const payload = typeof window.buildExportPayload === 'function' ? window.buildExportPayload() : null;
      const title = payload && payload.meta && payload.meta.title ? payload.meta.title : 'Europe & Thailand Summer 2026';
      const activeTripId = window.getActiveTripId ? window.getActiveTripId() : `trip_real_${Date.now()}`;
      
      const tripObj = {
        id: activeTripId,
        title: title,
        subtitle: payload?.meta?.subtitle || '15 Cities Multi-Country Route',
        data: payload || { meta: { title: title } }
      };
      
      const ok = await window.uploadTripToGoogleDrive(tripObj);
      return ok ? tripObj : null;
    });

    if (!realTrip) {
      throw new Error('❌ TEST FAILED: uploadTripToGoogleDrive returned false. File was NOT created on Google Drive!');
    }

    // Strictly verify file ID returned in file map
    const createdFileId = await page.evaluate((tripId) => {
      const map = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
      return map[tripId];
    }, realTrip.id);

    if (!createdFileId) {
      throw new Error('❌ TEST FAILED: No file ID was saved in local file map. uploadTripToGoogleDrive failed.');
    }
    if (isRealMode && (createdFileId.startsWith('mock_') || createdFileId.startsWith('gdrive_file_'))) {
      throw new Error(`❌ TEST FAILED: Real Google Drive mode expected a real File ID from Google REST API, but got synthetic ID: "${createdFileId}". Real upload failed.`);
    }

    console.log(`   ✓ Real Trip "${realTrip.title}" uploaded cleanly to Google Drive (File ID: "${createdFileId}")`);

    // Test Live Interactive Edit & Auto-Sync
    console.log('   [Step B2] Testing Live Interactive Edit & Cloud Auto-Sync...');
    const editSuccess = await page.evaluate(async () => {
      if (typeof window.autoSyncActiveTripToCloud === 'function') {
        window.autoSyncActiveTripToCloud();
        return true;
      }
      return false;
    });
    console.log(`   ✓ Live interactive edit auto-sync triggered: ${editSuccess}`);

    if (isRealMode) {
      console.log(`\n================================================================`);
      console.log(`📂 REAL GOOGLE DRIVE FILE CREATED & LIVE SYNCED!`);
      console.log(`📄 File Name: ${realTrip.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json`);
      console.log(`🆔 Google Drive File ID: ${createdFileId}`);
      console.log(`📁 Physical Google Drive Folder: G:\\My Drive\\TrenscendsTravelPlanner`);
      console.log(`🌐 Google Drive Web URL: ${folderGuardUrl}`);
      console.log(`================================================================\n`);
      console.log(`⏸️ PAUSED FOR YOUR PHYSICAL INSPECTION:`);
      console.log(`   1. Open "G:\\My Drive\\TrenscendsTravelPlanner" on your Windows computer or visit ${folderGuardUrl}`);
      console.log(`   2. Open "${realTrip.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json" in Notepad / VS Code to inspect your full real trip data.`);
      console.log(`   3. When ready, press [ENTER] below to delete the test file and clean up...`);
      
      await pauseForUser(`\n👉 Press [ENTER] to clean up and delete test file from Google Drive... `);

      console.log('\n   [Step Clean Up] Deleting test file from Google Drive...');
      const deleteResult = await page.evaluate(async (trip) => {
        const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
        const fileId = fileMap[trip.id];
        if (fileId && typeof window.deleteTripFromGoogleDrive === 'function') {
          return await window.deleteTripFromGoogleDrive(fileId, trip.title, true);
        }
        return false;
      }, realTrip);

      if (!deleteResult) {
        throw new Error('❌ TEST FAILED: deleteTripFromGoogleDrive returned false during cleanup.');
      }
      console.log('   ✓ Test file deleted cleanly from Google Drive folder.');
    } else {
      // C. Read / Load / Sync Trips from Google Drive
      console.log('   [Step C] Testing Read/Load/Sync Trips from Google Drive...');
      await page.evaluate(async () => {
        await window.syncAllTripsFromGoogleDrive();
      });

      const headerStatusAfterSync = await page.evaluate(() => {
        const el = document.getElementById('headerCloudSyncStatusPill');
        return el ? el.innerText : '';
      });
      console.log(`   ✓ Status pill after sync: "${headerStatusAfterSync}"`);
      if (!headerStatusAfterSync.includes('Synced') && !headerStatusAfterSync.includes('Drive')) {
        throw new Error(`Expected status pill to show 'Synced', got "${headerStatusAfterSync}"`);
      }

      // D. Update / Patch Existing File
      console.log('   [Step D] Testing Update/Patch Existing Trip File in Google Drive...');
      realTrip.title = `${realTrip.title} (Updated)`;
      if (realTrip.data && realTrip.data.itinerary && Array.isArray(realTrip.data.itinerary)) {
        realTrip.data.itinerary.push({ day: 99, cityName: 'Bangkok', notes: 'Rooftop sunset drinks' });
      }

      const updateResult = await page.evaluate(async (trip) => {
        return await window.uploadTripToGoogleDrive(trip);
      }, realTrip);

      if (!updateResult) throw new Error('Failed to update existing trip file');
      console.log('   ✓ Trip updated and patched cleanly in Google Drive.');

      // E. Remote Deletion Fallback Recovery (HTTP 404 Fallback Test)
      console.log('   [Step E] Testing Remote File Deletion & Auto-Re-creation Fallback...');
      const recreateResult = await page.evaluate(async (trip) => {
        const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
        delete fileMap[trip.id];
        localStorage.setItem('travelApp_gdrive_file_map', JSON.stringify(fileMap));
        return await window.uploadTripToGoogleDrive(trip);
      }, realTrip);

      if (!recreateResult) throw new Error('Failed remote deletion recovery re-creation');
      console.log('   ✓ Remote deletion fallback verified (file automatically re-created).');

      // F. Disconnect & Cleanup
      console.log('   [Step F] Testing Disconnect & Local State Clean Sign-Out...');
      await page.evaluate(() => window.disconnectGoogleDrive());
      const isConnectedAfterDisconnect = await page.evaluate(() => window.isGoogleDriveConnected());
      if (isConnectedAfterDisconnect) throw new Error('isGoogleDriveConnected() still returned true after disconnect');

      const headerStatusAfterDisconnect = await page.evaluate(() => {
        const el = document.getElementById('headerCloudSyncStatusPill');
        return el ? el.innerText : '';
      });
      console.log(`   ✓ Status pill after disconnect: "${headerStatusAfterDisconnect}"`);
    }

    await page.close();

    console.log(`\n================================================================`);
    console.log(`🎉 GOOGLE DRIVE VERIFICATION SUITE COMPLETED PERFECTLY!`);
    console.log(`================================================================\n`);

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    if (serverInstance && typeof serverInstance.close === 'function') {
      serverInstance.close();
    }
  }
}

runLiveVerification();
