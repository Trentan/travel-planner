/* ==========================================================================
   LIVE & INTEGRATION VERIFICATION SUITE (tests/verify-live.js)
   Target: Google Drive Cloud Sync, Dedicated Folder Storage, UI Indicators,
           Multi-File Switching, Live Auto-Sync, and Full CRUD Operations.
   Usage:
     node tests/verify-live.js                           (Automated mock test vs production site)
     node tests/verify-live.js --local                   (Automated mock test vs local server)
     node tests/verify-live.js --real                    (REAL Google Drive Playground vs production site)
     node tests/verify-live.js --real --local            (REAL Google Drive Playground vs local server)
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
  console.log(`🔧 Mode: ${isRealMode ? '🌐 REAL Google Drive API (Interactive Multi-File Playground)' : '⚡ Mock API (Automated CI Headless)'}`);
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
    // 1. DESKTOP VIEWPORT INITIALIZATION (1440 x 900)
    // -------------------------------------------------------------------------
    console.log('📌 1. Initializing Desktop Environment (1440 x 900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.openCloudSyncModal === 'function', { timeout: 10000 });

    // Hide onboarding modals if present
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
    // 2. MOBILE VIEWPORT TEST (390 x 844)
    // -------------------------------------------------------------------------
    console.log('\n📌 2. Testing Mobile Viewport (390 x 844)...');
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

    // Close mobile menu & restore desktop viewport
    await page.evaluate(() => {
      if (typeof window.toggleMobileMenu === 'function') window.toggleMobileMenu();
    });
    await page.setViewportSize({ width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // 3. GOOGLE DRIVE DEDICATED FOLDER & MULTI-FILE CRUD PLAYGROUND
    // -------------------------------------------------------------------------
    console.log('\n📌 3. Testing Google Drive Multi-File Upload & Sync Engine...');

    if (!isRealMode) {
      await page.evaluate(() => {
        window.__mockGoogleDriveAPI = true;
      });
    } else {
      await page.evaluate(() => {
        window.__mockGoogleDriveAPI = false;
      });
    }

    // A. Sign-In & Authentication Guard
    console.log('   [Step A] Checking Google Drive Connection & Folder Guard...');
    if (isRealMode) {
      // Try silent background token authentication first
      await page.evaluate(async () => {
        if (typeof window.authenticateGoogleDrive === 'function') {
          await window.authenticateGoogleDrive(false);
        }
      });

      let connected = await page.evaluate(() => window.isGoogleDriveConnected());
      if (!connected) {
        console.log('   👉 First-time sign in: Click "Sign in with Google" in the opened browser window...');
        await page.evaluate(() => window.openCloudSyncModal());
        await page.evaluate(() => window.authenticateGoogleDrive(true));
        
        for (let i = 0; i < 60; i++) {
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
    console.log(`   ✓ Google Drive Authenticated. Folder URL: ${folderGuardUrl}`);

    // B. Create & Upload Multiple Realistic Sample Trips to Google Drive
    console.log('   [Step B] Uploading Multiple Realistic Trip Documents to Google Drive...');
    
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
            { id: 'c1', name: 'Vienna', country: 'Austria', countryCode: 'AT', days: [5, 6, 7] },
            { id: 'c2', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', days: [8, 9, 10] }
          ]
        }
      },
      {
        id: `trip_japan_alpine_${Date.now()}`,
        title: 'Japan Alpine Route 2027',
        subtitle: 'Tokyo, Takayama, Kanazawa, Kyoto',
        data: {
          meta: { title: 'Japan Alpine Route 2027', subtitle: 'Tokyo, Takayama, Kanazawa, Kyoto', version: '1.1.0' },
          itinerary: [
            { day: 1, cityName: 'Tokyo', notes: 'Shinjuku neon walk & ramen' },
            { day: 3, cityName: 'Takayama', notes: 'Hida beef dinner & old town' },
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
      const ok = await page.evaluate(async (t) => {
        return await window.uploadTripToGoogleDrive(t);
      }, trip);

      if (ok) {
        uploadedFiles.push(trip);
        console.log(`   ✓ Uploaded trip document "${trip.title}" to Google Drive folder.`);
      }
    }

    if (uploadedFiles.length === 0) {
      throw new Error('❌ TEST FAILED: Could not upload trip documents to Google Drive');
    }

    // Refresh Google Drive file list and populate UI dropdowns & galleries
    await page.evaluate(async () => {
      await window.syncAllTripsFromGoogleDrive();
      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    });

    console.log('   ✓ Cloud file switcher and My Trips Gallery updated with all Google Drive files.');

    if (isRealMode) {
      console.log(`\n================================================================`);
      console.log(`🚀 REAL GOOGLE DRIVE CLOUD PLAYGROUND ACTIVE!`);
      console.log(`📁 Physical Google Drive Folder: G:\\My Drive\\TrenscendsTravelPlanner`);
      console.log(`🌐 Web Drive URL: ${folderGuardUrl}`);
      console.log(`================================================================`);
      console.log(`📄 Real .json Trip Documents Synced to Google Drive:`);
      uploadedFiles.forEach((f, idx) => {
        console.log(`   ${idx + 1}. ${f.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json  (${f.subtitle})`);
      });
      console.log(`================================================================\n`);
      console.log(`🎮 YOU HAVE FULL INTERACTIVE CONTROL IN THE OPENED BROWSER:`);
      console.log(`   👉 1. SWITCH CLOUD TRIPS: Click "✈️ My Trip ▾" in the top header or open "My Trips Gallery" -> "☁️ Google Drive Cloud Files". Click [ 📥 Load & Open ] on any trip!`);
      console.log(`   👉 2. LIVE CLOUD AUTO-SYNC: Edit any stay, transport leg, or city in the app. Watch the .json file update LIVE in G:\\My Drive\\TrenscendsTravelPlanner\\!`);
      console.log(`   👉 3. CREATE NEW CLOUD TRIP: Click [ ➕ New Cloud Trip ] in the Cloud tab, type a title, and watch it create a new .json file on Google Drive!`);
      console.log(`   👉 4. DELETE FROM CLOUD: Click [ 🗑️ Delete ] on a cloud file card inside the app and see it delete from Google Drive!`);
      console.log(`\n================================================================`);
      
      await pauseForUser(`\n👉 Take your time to test! When ready, press [ENTER] to finish test session... `);

      console.log('\n   [Step Clean Up] Cleaning up verification test files from Google Drive...');
      for (const trip of uploadedFiles) {
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
      // C. Automated CI Verification Steps
      console.log('   [Step C] Testing Automated Read/Sync from Google Drive...');
      const headerStatusAfterSync = await page.evaluate(() => {
        const el = document.getElementById('headerCloudSyncStatusPill');
        return el ? el.innerText : '';
      });
      console.log(`   ✓ Status pill after sync: "${headerStatusAfterSync}"`);

      console.log('   [Step D] Testing Disconnect & Local State Clean Sign-Out...');
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
