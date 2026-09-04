const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runSecurityXssGdriveSuite() {
  console.log('--- Running Google Drive XSS Security Tests ---');
  let serverInstance;
  let browserInstance;

  try {
    const serverPort = 3299;
    serverInstance = await startStaticServer(path.resolve(__dirname, '..'), serverPort);
    console.log(`Static server running at http://localhost:${serverPort}`);

    browserInstance = await chromium.launch({ headless: true });
    const page = await browserInstance.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(`http://localhost:${serverPort}/index.html`, { waitUntil: 'domcontentloaded' });

    // Wait for cloud-storage.js initialization
    await page.waitForFunction(() => typeof window.isGoogleDriveConnected === 'function', { timeout: 10000 });

    // Enable mock mode
    await page.evaluate(() => {
      window.__mockGoogleDriveAPI = true;
      localStorage.setItem('travelApp_gdrive_connected', 'true');
    });

    console.log('1. Testing XSS payloads in cloudFiles and userProfile...');
    const xssTestResult = await page.evaluate(async () => {
      // Clear any global flag indicators
      delete window.__xssTriggeredName1;
      delete window.__xssTriggeredName2;
      delete window.__xssTriggeredId;
      delete window.__xssTriggeredPic;

      // Set malicious profile
      window.setUserProfile({
        name: 'Malicious <script>window.__xssTriggeredName1=true</script> User',
        email: 'attacker@example.com',
        picture: 'http://example.com/pic.jpg" onerror="window.__xssTriggeredPic=true'
      });

      // Malicious cloud files
      const maliciousFiles = [
        {
          id: `file_123'); window.__xssTriggeredId=true; //`,
          name: `Test' onclick="window.__xssTriggeredName2=true" <img src=x onerror="window.__xssTriggeredName1=true">.json`,
          size: '1024',
          modifiedTime: new Date().toISOString()
        }
      ];

      // Track call parameters received by loadTripFromGoogleDrive and deleteTripFromGoogleDrive
      window.__receivedLoadId = null;
      window.__receivedDeleteArgs = null;

      window.loadTripFromGoogleDrive = function(id) {
        window.__receivedLoadId = id;
      };
      window.deleteTripFromGoogleDrive = function(fileId, name) {
        window.__receivedDeleteArgs = { fileId, name };
      };

      // Open cloud sync modal and trigger render with malicious files
      window.openCloudSyncModal();
      window.updateCloudSyncModalState(maliciousFiles);

      // Give browser a moment to attempt loading image or executing scripts
      await new Promise(resolve => setTimeout(resolve, 300));

      const fileContainer = document.getElementById('gdriveFileListContainer');
      const loadButton = fileContainer ? fileContainer.querySelector('button[title*="Load"]') : null;
      const deleteButton = fileContainer ? fileContainer.querySelector('button[title*="Delete"]') : null;

      if (loadButton) loadButton.click();
      if (deleteButton) deleteButton.click();

      return {
        xssTriggeredName1: !!window.__xssTriggeredName1,
        xssTriggeredName2: !!window.__xssTriggeredName2,
        xssTriggeredId: !!window.__xssTriggeredId,
        xssTriggeredPic: !!window.__xssTriggeredPic,
        receivedLoadId: window.__receivedLoadId,
        receivedDeleteArgs: window.__receivedDeleteArgs,
        fileContainerHtml: fileContainer ? fileContainer.innerHTML : ''
      };
    });

    console.log('XSS Security Test Results:', {
      xssTriggeredName1: xssTestResult.xssTriggeredName1,
      xssTriggeredName2: xssTestResult.xssTriggeredName2,
      xssTriggeredId: xssTestResult.xssTriggeredId,
      xssTriggeredPic: xssTestResult.xssTriggeredPic,
      receivedLoadId: xssTestResult.receivedLoadId,
      receivedDeleteArgs: xssTestResult.receivedDeleteArgs
    });

    if (xssTestResult.xssTriggeredName1 || xssTestResult.xssTriggeredName2 || xssTestResult.xssTriggeredId || xssTestResult.xssTriggeredPic) {
      throw new Error('❌ SECURITY VULNERABILITY DETECTED: XSS script execution occurred!');
    }

    if (xssTestResult.receivedLoadId !== `file_123'); window.__xssTriggeredId=true; //`) {
      throw new Error(`❌ Parameter mismatch on loadTripFromGoogleDrive: expected raw ID, got "${xssTestResult.receivedLoadId}"`);
    }

    if (!xssTestResult.receivedDeleteArgs || xssTestResult.receivedDeleteArgs.name !== `Test' onclick="window.__xssTriggeredName2=true" <img src=x onerror="window.__xssTriggeredName1=true">.json`) {
      throw new Error(`❌ Parameter mismatch on deleteTripFromGoogleDrive: expected raw name, got "${xssTestResult.receivedDeleteArgs ? xssTestResult.receivedDeleteArgs.name : 'null'}"`);
    }

    console.log('✅ ALL GOOGLE DRIVE XSS SECURITY TESTS PASSED CLEANLY!');
  } catch (err) {
    console.error('❌ SECURITY XSS TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    if (browserInstance) await browserInstance.close();
    if (serverInstance && typeof serverInstance.close === 'function') serverInstance.close();
  }
}

if (require.main === module) {
  runSecurityXssGdriveSuite().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run: runSecurityXssGdriveSuite };
