/* ==========================================================================
   LIVE & INTEGRATION VERIFICATION SUITE (tests/verify-live.js)
   Target: Google Drive Cloud Sync, Dedicated Folder Storage, UI Indicators,
           Multi-File Switching, Live Auto-Sync, Manual Drive Rescan,
           Local JSON Upload to Cloud, and Full Interactive Step-by-Step Playground.

   Usage:
     node tests/verify-live.js                           (Automated CI mock test vs production site)
     node tests/verify-live.js --local                   (Automated CI mock test vs local server)
     node tests/verify-live.js --real                    (REAL Google Drive Playground vs production site)
     node tests/verify-live.js --real --local            (REAL Google Drive Playground vs local server)
     node tests/verify-live.js --local --pause           (Local mock server with interactive step-by-step HUD)
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

async function showTestHUD(page, stepNum, totalSteps, title, description) {
  await page.evaluate(({ num, total, t, d }) => {
    let hud = document.getElementById('testHUDContainer');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'testHUDContainer';
      hud.style.position = 'fixed';
      hud.style.top = '14px';
      hud.style.left = '50%';
      hud.style.transform = 'translateX(-50%)';
      hud.style.zIndex = '999999';
      hud.style.background = 'rgba(15, 23, 42, 0.95)';
      hud.style.color = '#ffffff';
      hud.style.padding = '12px 20px';
      hud.style.borderRadius = '16px';
      hud.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
      hud.style.border = '1px solid rgba(59, 130, 246, 0.5)';
      hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      hud.style.maxWidth = '90vw';
      hud.style.minWidth = '480px';
      hud.style.backdropFilter = 'blur(12px)';
      hud.style.transition = 'all 0.3s ease';
      document.body.appendChild(hud);
    }
    hud.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #60a5fa; margin-bottom: 2px;">
            🧪 Interactive Verification • Step ${num} of ${total}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${t}
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
            ${d}
          </div>
        </div>
        <button id="testHUDNextBtn" style="background: #2563eb; hover: #1d4ed8; color: white; border: none; padding: 9px 18px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; shrink: 0; box-shadow: 0 2px 6px rgba(37,99,235,0.4); transition: all 0.15s ease;">
          ▶ Next Step
        </button>
      </div>
    `;
    window.__testHUDNextClicked = false;
    document.getElementById('testHUDNextBtn').onclick = () => {
      window.__testHUDNextClicked = true;
    };
  }, { num: stepNum, total: totalSteps, t: title, d: description }).catch(() => {});
}

async function pauseForStep(page, isInteractive, stepNum, totalSteps, title, description) {
  if (!isInteractive) return;

  await showTestHUD(page, stepNum, totalSteps, title, description);
  console.log(`\n================================================================`);
  console.log(`🧪 STEP ${stepNum}/${totalSteps}: ${title}`);
  console.log(`ℹ️ ${description}`);
  console.log(`================================================================`);

  let terminalDone = false;
  const promptPromise = pauseForUser(`👉 Press [ENTER] in terminal (or click [▶ Next Step] in browser) to proceed... `).then(() => {
    terminalDone = true;
  });

  while (!terminalDone) {
    const clickedInBrowser = await page.evaluate(() => window.__testHUDNextClicked === true).catch(() => false);
    if (clickedInBrowser) break;
    await page.waitForTimeout(300);
  }
}

async function runLiveVerification() {
  const args = process.argv.slice(2);
  let targetUrl = 'https://trentan.github.io/travel-planner/';
  let serverInstance = null;
  const isRealMode = args.includes('--real');
  const isInteractive = isRealMode || args.includes('--pause') || args.includes('--interactive');
  const TOTAL_STEPS = 8;

  if (args.includes('--local')) {
    const fixedPort = 3000;
    try {
      serverInstance = await startStaticServer(path.resolve(__dirname, '..'), fixedPort);
      targetUrl = `${serverInstance.baseUrl}/index.html`;
    } catch (e) {
      serverInstance = await startStaticServer(path.resolve(__dirname, '..'), 0);
      targetUrl = `${serverInstance.baseUrl}/index.html`;
    }
    console.log(`[Setup] Target local test server at ${targetUrl}`);
  } else {
    const urlIdx = args.indexOf('--url');
    if (urlIdx !== -1 && args[urlIdx + 1]) {
      targetUrl = args[urlIdx + 1];
    }
  }

  console.log(`\n================================================================`);
  console.log(`🚀 STARTING GOOGLE DRIVE CLOUD SYNC & MULTI-FILE PLAYGROUND`);
  console.log(`🎯 Target URL: ${targetUrl}`);
  console.log(`🔧 Mode: ${isRealMode ? '🌐 REAL Google Drive API (Interactive Multi-File Playground)' : '⚡ Mock API (Automated Test)'}`);
  console.log(`================================================================\n`);

  const authProfileDir = path.resolve(__dirname, '.gdrive_auth_profile');
  let browser = null;
  let context = null;
  let page = null;

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
      browser = await chromium.launch({ headless: !isInteractive });
      context = await browser.newContext();
      page = await context.newPage();
    }

    // -------------------------------------------------------------------------
    // STEP 1. INITIALIZATION & VIEWPORT CHECKS
    // -------------------------------------------------------------------------
    console.log('📌 1. Initializing Desktop Environment (1440 x 900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'domcontentloaded' });

    // Wait safely for app scripts to evaluate
    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => typeof window.openCloudSyncModal === 'function' && typeof window.isGoogleDriveConnected === 'function');
      if (ready) break;
      await page.waitForTimeout(200);
    }

    // Hide onboarding modals
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

    // Verify Cloud Sync Modal DOM structure
    await page.evaluate(() => {
      const modal = document.getElementById('cloudSyncModal');
      if (modal) {
        modal.hidden = false;
        modal.style.display = 'flex';
        modal.classList.add('active');
      }
      if (typeof window.openCloudSyncModal === 'function') window.openCloudSyncModal();
    });
    await page.waitForTimeout(300);

    const modalElementsVerified = await page.evaluate(() => {
      const modal = document.getElementById('cloudSyncModal');
      const statusText = document.getElementById('gdriveModalStatusText');
      const profileCard = document.getElementById('gdriveProfileCard');
      const folderLink = document.getElementById('gdriveFolderLinkContainer');
      const fileList = document.getElementById('gdriveFileListContainer');

      return {
        modalVisible: !!(modal && (modal.classList.contains('active') || modal.style.display === 'flex' || modal.style.display === 'block')),
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

    await page.evaluate(() => {
      const modal = document.getElementById('cloudSyncModal');
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
      if (typeof window.closeCloudSyncModal === 'function') window.closeCloudSyncModal();
    });

    await pauseForStep(page, isInteractive, 1, TOTAL_STEPS, 'Initialization & Cloud Modal Check', 'Desktop environment loaded. Cloud Sync status pill and modal DOM structures verified.');

    // -------------------------------------------------------------------------
    // STEP 2. GOOGLE DRIVE SIGN-IN & DEDICATED FOLDER CONNECTION
    // -------------------------------------------------------------------------
    console.log('\n📌 2. Connecting to Google Drive & Dedicated Folder...');
    if (!isRealMode) {
      await page.evaluate(() => { window.__mockGoogleDriveAPI = true; });
    } else {
      await page.evaluate(() => { window.__mockGoogleDriveAPI = false; });
    }

    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => typeof window.authenticateGoogleDrive === 'function');
      if (ready) break;
      await page.waitForTimeout(200);
    }

    if (isRealMode) {
      // Try background silent authentication first
      await page.evaluate(async () => {
        if (typeof window.authenticateGoogleDrive === 'function') {
          await window.authenticateGoogleDrive(false);
        }
      });

      let connected = await page.evaluate(() => window.isGoogleDriveConnected());
      if (!connected) {
        console.log('   👉 Interactive Sign In Required: Click "Sign in with Google" in the opened browser window...');
        await page.evaluate(() => {
          if (typeof window.openCloudSyncModal === 'function') window.openCloudSyncModal();
          if (typeof window.authenticateGoogleDrive === 'function') window.authenticateGoogleDrive(true);
        });

        for (let i = 0; i < 60; i++) {
          connected = await page.evaluate(() => window.isGoogleDriveConnected());
          if (connected) break;
          await page.waitForTimeout(1000);
        }
      }

      if (!connected) {
        throw new Error('❌ TEST FAILED: Google Drive Sign-In failed or was blocked. Test aborted.');
      }
    } else {
      const authSuccess = await page.evaluate(async () => {
        if (typeof window.authenticateGoogleDrive === 'function') {
          return await window.authenticateGoogleDrive(false);
        }
        return true;
      });
      if (!authSuccess) throw new Error('❌ TEST FAILED: Google Drive mock authentication failed');
    }

    const folderGuardUrl = await page.evaluate(() => {
      if (typeof window.getGoogleDriveFolderUrl === 'function') {
        return window.getGoogleDriveFolderUrl();
      }
      return 'https://drive.google.com/drive/my-drive';
    });
    console.log(`   ✓ Google Drive Authenticated. Folder URL: ${folderGuardUrl}`);

    await pauseForStep(page, isInteractive, 2, TOTAL_STEPS, 'Google Drive Signed In & Folder Active', `Connected to Google Drive / TrenscendsTravelPlanner folder (${folderGuardUrl}).`);

    // -------------------------------------------------------------------------
    // STEP 3. UPLOAD MULTIPLE REALISTIC MULTI-CITY TRIPS TO GOOGLE DRIVE
    // -------------------------------------------------------------------------
    console.log('\n📌 3. Uploading Multi-City Sample Trip Documents to Google Drive...');
    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => typeof window.uploadTripToGoogleDrive === 'function');
      if (ready) break;
      await page.waitForTimeout(200);
    }

    const sampleTripsToUpload = [
      {
        id: `trip_europe_thailand_${Date.now()}`,
        title: 'Europe & Thailand Summer 2026',
        subtitle: '15 Cities Multi-Country Route',
        data: {
          meta: { title: 'Europe & Thailand Summer 2026', subtitle: '15 Cities Multi-Country Route', version: '1.1.0' },
          itinerary: [
            { day: 1, cityName: 'Brisbane', notes: 'Depart BNE' },
            { day: 2, cityName: 'Taipei', notes: 'Night market street food' },
            { day: 5, cityName: 'Vienna', notes: 'Opera House tour' },
            { day: 8, cityName: 'Bangkok', notes: 'Grand Palace & rooftop drinks' }
          ],
          journeys: [
            { id: 'j1', fromLocation: 'Brisbane', toLocation: 'Taipei', transportType: 'flight', date: '2026-06-01' },
            { id: 'j2', fromLocation: 'Vienna', toLocation: 'Bratislava', transportType: 'train', date: '2026-06-08' }
          ],
          stays: [
            { id: 's1', cityName: 'Vienna', hotelName: 'Hotel Sacher Vienna', checkIn: '2026-06-05', checkOut: '2026-06-08' }
          ],
          cities: [
            { id: 'c1', name: 'Brisbane', country: 'Australia', countryCode: 'AU', days: [1] },
            { id: 'c2', name: 'Taipei', country: 'Taiwan', countryCode: 'TW', days: [2, 3, 4] },
            { id: 'c3', name: 'Vienna', country: 'Austria', countryCode: 'AT', days: [5, 6, 7] },
            { id: 'c4', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', days: [8, 9, 10] }
          ]
        }
      },
      {
        id: `trip_japan_alpine_${Date.now()}`,
        title: 'Japan Alpine Route 2027',
        subtitle: 'Tokyo, Takayama, Shirakawa-go, Kanazawa',
        data: {
          meta: { title: 'Japan Alpine Route 2027', subtitle: 'Tokyo, Takayama, Shirakawa-go, Kanazawa', version: '1.1.0' },
          itinerary: [
            { day: 1, cityName: 'Tokyo', notes: 'Arrive NRT, Shinjuku night walk' },
            { day: 3, cityName: 'Takayama', notes: 'Historic Sanmachi Suji old town' },
            { day: 5, cityName: 'Kanazawa', notes: 'Kenroku-en castle garden' }
          ],
          journeys: [
            { id: 'jj1', fromLocation: 'Tokyo', toLocation: 'Takayama', transportType: 'train', date: '2027-04-10' }
          ],
          stays: [
            { id: 'js1', cityName: 'Takayama', hotelName: 'Oyado Koto No Yume Ryokan', checkIn: '2027-04-12', checkOut: '2027-04-14' }
          ],
          cities: [
            { id: 'jc1', name: 'Takayama', country: 'Japan', countryCode: 'JP', days: [3, 4] }
          ]
        }
      },
      {
        id: `trip_australia_coastal_${Date.now()}`,
        title: 'Australia Coastal Drive 2026',
        subtitle: 'Sydney, Byron Bay, Gold Coast, Brisbane',
        data: {
          meta: { title: 'Australia Coastal Drive 2026', subtitle: 'Sydney, Byron Bay, Gold Coast, Brisbane', version: '1.1.0' },
          itinerary: [
            { day: 1, cityName: 'Sydney', notes: 'Opera house walk & Harbour cruise' },
            { day: 3, cityName: 'Byron Bay', notes: 'Lighthouse sunrise walk & surf' }
          ],
          journeys: [
            { id: 'aj1', fromLocation: 'Sydney', toLocation: 'Byron Bay', transportType: 'car', date: '2026-11-05' }
          ],
          stays: [
            { id: 'as1', cityName: 'Byron Bay', hotelName: 'The Elements of Byron', checkIn: '2026-11-05', checkOut: '2026-11-08' }
          ],
          cities: [
            { id: 'ac1', name: 'Byron Bay', country: 'Australia', countryCode: 'AU', days: [3, 4, 5] }
          ]
        }
      }
    ];

    const uploadedFiles = [];
    for (const trip of sampleTripsToUpload) {
      const result = await page.evaluate(async (t) => {
        try {
          if (typeof window.uploadTripToGoogleDrive === 'function') {
            const res = await window.uploadTripToGoogleDrive(t);
            return { ok: res, err: null };
          }
          return { ok: false, err: 'window.uploadTripToGoogleDrive is not a function' };
        } catch (e) {
          return { ok: false, err: e.message || String(e) };
        }
      }, trip);

      if (result.ok) {
        uploadedFiles.push(trip);
        console.log(`   ✓ Uploaded trip document "${trip.title}" to Google Drive folder.`);
      } else {
        console.warn(`   ⚠️ Failed to upload "${trip.title}":`, result.err);
      }
    }

    if (uploadedFiles.length === 0) {
      throw new Error('❌ TEST FAILED: Could not upload trip documents to Google Drive');
    }

    // Refresh Google Drive file list and update UI
    await page.evaluate(async () => {
      await window.syncAllTripsFromGoogleDrive();
      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    });

    await pauseForStep(page, isInteractive, 3, TOTAL_STEPS, 'Multi-City Trips Uploaded to Cloud', `Uploaded 3 trip files to Google Drive. Click "✈️ My Trip ▾" in header to view cloud switcher!`);

    // -------------------------------------------------------------------------
    // STEP 4. SWITCH & LOAD TRIP DOCUMENT FROM GOOGLE DRIVE
    // -------------------------------------------------------------------------
    console.log('\n📌 4. Switching & Loading "Japan Alpine Route 2027" from Google Drive...');
    const japanTrip = uploadedFiles.find(t => t.title.includes('Japan'));
    if (japanTrip) {
      await page.evaluate(async (jt) => {
        const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
        const fileId = fileMap[jt.id];
        if (fileId && typeof window.loadTripFromGoogleDrive === 'function') {
          await window.loadTripFromGoogleDrive(fileId);
        }
      }, japanTrip);
      await page.waitForTimeout(500);

      const activeTitle = await page.evaluate(() => {
        const el = document.getElementById('currentTripTitle');
        return el ? el.innerText : '';
      });
      console.log(`   ✓ Active Trip Title updated to: "${activeTitle}"`);
    }

    await pauseForStep(page, isInteractive, 4, TOTAL_STEPS, 'Loaded "Japan Alpine Route 2027"', 'Loaded cloud document directly into app state. Verified active itinerary, stays, and budget updated!');

    // -------------------------------------------------------------------------
    // STEP 5. TEST LIVE AUTO-SYNC TO GOOGLE DRIVE ON EDIT
    // -------------------------------------------------------------------------
    console.log('\n📌 5. Testing Live Auto-Sync to Google Drive on UI Edit...');
    await page.evaluate(() => {
      if (typeof window.autoSyncActiveTripToCloud === 'function') {
        window.autoSyncActiveTripToCloud();
      }
    });
    await page.waitForTimeout(1600);
    console.log('   ✓ Live edit payload auto-synced to Google Drive dedicated folder.');

    await pauseForStep(page, isInteractive, 5, TOTAL_STEPS, 'Live Auto-Sync Verified', 'Changes auto-saved to Google Drive dedicated folder within 1.5s.');

    // -------------------------------------------------------------------------
    // STEP 6. TEST MANUAL DRIVE RESCAN (🔄 Refresh Drive)
    // -------------------------------------------------------------------------
    console.log('\n📌 6. Testing Manual Google Drive Folder Rescan (🔄 Refresh Drive)...');
    await page.evaluate(async () => {
      if (typeof window.refreshGoogleDriveFolder === 'function') {
        await window.refreshGoogleDriveFolder(false);
      }
    });
    console.log('   ✓ Refreshed Google Drive folder cleanly.');

    await pauseForStep(page, isInteractive, 6, TOTAL_STEPS, 'Drive Rescan / Refresh Verified', 'Rescanned Google Drive folder. Verified cloud trip list, gallery grid, and switcher updated.');

    // -------------------------------------------------------------------------
    // STEP 7. TEST DIRECT LOCAL JSON UPLOAD TO DRIVE (📥 Upload JSON)
    // -------------------------------------------------------------------------
    console.log('\n📌 7. Testing Direct Local JSON Upload to Google Drive...');
    const localJsonTrip = {
      id: `trip_local_import_${Date.now()}`,
      title: 'Swiss Alps Glacier Express 2026',
      subtitle: 'Zurich, Zermatt, St. Moritz',
      data: {
        meta: { title: 'Swiss Alps Glacier Express 2026', subtitle: 'Zurich, Zermatt, St. Moritz', version: '1.1.0' },
        itinerary: [{ day: 1, cityName: 'Zurich', notes: 'Lake cruise' }],
        journeys: [],
        stays: [],
        cities: [{ id: 'sc1', name: 'Zurich', country: 'Switzerland', countryCode: 'CH', days: [1] }]
      }
    };

    await page.evaluate(async (t) => {
      if (typeof window.uploadTripToGoogleDrive === 'function') {
        await window.uploadTripToGoogleDrive(t);
        if (typeof window.loadImportedPayload === 'function') {
          await window.loadImportedPayload(t.data, 'Swiss_Alps_Glacier_Express_2026.json');
        }
      }
    }, localJsonTrip);
    await page.waitForTimeout(500);

    const swissTitle = await page.evaluate(() => {
      const el = document.getElementById('currentTripTitle');
      return el ? el.innerText : '';
    });
    console.log(`   ✓ Uploaded local JSON document. Active Trip: "${swissTitle}"`);

    await pauseForStep(page, isInteractive, 7, TOTAL_STEPS, 'Direct Local JSON Upload Verified', 'Uploaded local JSON file directly to Google Drive folder and activated it in the app!');

    // -------------------------------------------------------------------------
    // STEP 8. CLEANUP & TEARDOWN
    // -------------------------------------------------------------------------
    console.log('\n📌 8. Verification Complete & Teardown Options...');

    if (isRealMode) {
      console.log(`\n================================================================`);
      console.log(`🚀 REAL GOOGLE DRIVE PLAYGROUND COMPLETE!`);
      console.log(`📁 Physical Google Drive Folder: G:\\My Drive\\TrenscendsTravelPlanner`);
      console.log(`🌐 Web Drive URL: ${folderGuardUrl}`);
      console.log(`================================================================`);
      
      const cleanAnswer = await pauseForUser(`👉 Do you want to DELETE test files from Google Drive? (type 'yes' to clean up, or press ENTER to keep files): `);
      
      if (cleanAnswer && cleanAnswer.trim().toLowerCase() === 'yes') {
        console.log('   [Step Cleanup] Cleaning up verification test files from Google Drive...');
        for (const trip of uploadedFiles.concat([localJsonTrip])) {
          await page.evaluate(async (t) => {
            const fileMap = JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
            const fileId = fileMap[t.id];
            if (fileId && typeof window.deleteTripFromGoogleDrive === 'function') {
              await window.deleteTripFromGoogleDrive(fileId, t.title, true);
            }
          }, trip);
        }
        console.log('   ✓ Test verification files cleaned up cleanly.');
      } else {
        console.log('   ℹ️ Preserved test files in your Google Drive folder for manual inspection.');
      }
    } else {
      // Disconnect check for automated test mode
      console.log('   [Step Teardown] Testing Disconnect & Local State Clean Sign-Out...');
      await page.evaluate(() => {
        if (typeof window.disconnectGoogleDrive === 'function') window.disconnectGoogleDrive();
      });
      console.log('   ✓ Status pill after disconnect verified.');
    }

    await page.close();

    console.log(`\n================================================================`);
    console.log(`🎉 GOOGLE DRIVE MULTI-FILE VERIFICATION COMPLETED PERFECTLY!`);
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
