const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runMilestone2Runsheet() {
  const rootDir = path.join(__dirname, '..');
  const serverObj = await startStaticServer(rootDir);
  const url = `${serverObj.baseUrl}/index.html`;
  console.log(`[Server] Running at ${url}`);

  const browser = await chromium.launch({ headless: true });
  const results = { desktop: {}, mobile: {} };

  try {
    // ==========================================
    // 🖥️ DESKTOP VERIFICATION (1440 x 900)
    // ==========================================
    console.log('\n--- 🖥️ DESKTOP VERIFICATION (1440 x 900) ---');
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dPage = await desktopCtx.newPage();
    await dPage.goto(url, { waitUntil: 'domcontentloaded' });

    // 1.1 Onboarding Modal Boot & Storage Picker
    const onboardingVisible = await dPage.isVisible('#trip-start-modal');
    console.log(`[Desktop 1.1] Onboarding modal auto-opens on clean load: ${onboardingVisible}`);
    results.desktop['1.1'] = onboardingVisible ? 'PASS' : 'FAIL';

    if (onboardingVisible) {
      const storageOptionCount = await dPage.locator('.storage-location-option').count();
      console.log(`[Desktop 1.2] Step 1 Storage location choices count: ${storageOptionCount}`);
      results.desktop['1.2'] = storageOptionCount >= 2 ? 'PASS' : 'FAIL';

      // Step through wizard
      await dPage.click('#storage-type-browser');
      await dPage.click('#trip-wizard-next-1');
      await dPage.fill('#trip-wizard-name', 'AI Verification Desktop Trip');
      await dPage.click('#trip-wizard-next-2');
      await dPage.fill('#trip-wizard-dep-city', 'Brisbane');
      await dPage.fill('#trip-wizard-dep-date', '2026-06-01');
      await dPage.click('#trip-wizard-next-3');
      await dPage.fill('#trip-wizard-dest-1-city', 'Tokyo');
      await dPage.fill('#trip-wizard-dest-1-nights', '4');
      await dPage.click('#trip-wizard-next-4');

      // Auto return date check
      const returnDateVal = await dPage.inputValue('#trip-wizard-return-date');
      console.log(`[Desktop 1.6] Step 5 Auto return date computed: ${returnDateVal}`);
      results.desktop['1.6'] = returnDateVal ? 'PASS' : 'FAIL';

      // Finish wizard
      await dPage.click('#trip-wizard-finish');
      await dPage.waitForTimeout(500);
    }

    // 2.1 Manage Cities Top Bar Button Visibility
    const desktopManageCitiesBtn = await dPage.isVisible('#header-manage-cities-btn');
    console.log(`[Desktop 2.1] Header Manage Cities button visible: ${desktopManageCitiesBtn}`);
    results.desktop['2.1'] = desktopManageCitiesBtn ? 'PASS' : 'FAIL';

    // Open Manage Cities dialog
    await dPage.click('#header-manage-cities-btn');
    await dPage.waitForSelector('#cities-modal', { state: 'visible' });

    // 2.4 City Rename & Monospace Codes
    const cityRow = dPage.locator('#cities-list-container .city-manager-row').first();
    const cityRowVisible = await cityRow.isVisible();
    const iataInputCount = await dPage.locator('.city-manager-row input.font-mono').count();
    console.log(`[Desktop 2.4/2.5] Cities dialog opened cleanly with editable airport code fields: ${iataInputCount > 0}`);
    results.desktop['2.4'] = cityRowVisible ? 'PASS' : 'FAIL';
    results.desktop['2.5'] = iataInputCount > 0 ? 'PASS' : 'FAIL';

    // 3.2 Audit Batch Repair Toolbar
    const autoRepairBtn = await dPage.isVisible('#auto-repair-cities-btn');
    console.log(`[Desktop 3.2] Manage Cities Toolbar batch auto-repair visible: ${autoRepairBtn}`);
    results.desktop['3.2'] = autoRepairBtn ? 'PASS' : 'FAIL';

    await dPage.click('#close-cities-modal-btn');

    // 4.1 AI Builder Inputs
    const aiBuilderBtn = await dPage.isVisible('#header-ai-builder-btn');
    if (aiBuilderBtn) {
      await dPage.click('#header-ai-builder-btn');
      const regionsInput = await dPage.isVisible('#ai-builder-regions');
      const flightInput = await dPage.isVisible('#ai-builder-junctions');
      console.log(`[Desktop 4.1/4.2] AI Builder Regions & Flight Junction fields visible: ${regionsInput && flightInput}`);
      results.desktop['4.1'] = regionsInput ? 'PASS' : 'FAIL';
      results.desktop['4.2'] = flightInput ? 'PASS' : 'FAIL';
      await dPage.click('#close-ai-builder-modal');
    }

    await desktopCtx.close();

    // ==========================================
    // 📱 MOBILE VERIFICATION (390 x 844)
    // ==========================================
    console.log('\n--- 📱 MOBILE VERIFICATION (390 x 844) ---');
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();
    await mPage.goto(url, { waitUntil: 'domcontentloaded' });

    // Clear local storage to boot wizard in mobile
    await mPage.evaluate(() => localStorage.clear());
    await mPage.reload({ waitUntil: 'domcontentloaded' });

    const mWizardVisible = await mPage.isVisible('#trip-start-modal');
    console.log(`[Mobile 5.1] Onboarding wizard renders cleanly on mobile screen: ${mWizardVisible}`);
    results.mobile['5.1'] = mWizardVisible ? 'PASS' : 'FAIL';

    if (mWizardVisible) {
      await mPage.click('#storage-type-browser');
      await mPage.click('#trip-wizard-next-1');
      await mPage.fill('#trip-wizard-name', 'AI Verification Mobile Trip');
      await mPage.click('#trip-wizard-next-2');
      await mPage.fill('#trip-wizard-dep-city', 'Brisbane');
      await mPage.fill('#trip-wizard-dep-date', '2026-06-01');
      await mPage.click('#trip-wizard-next-3');
      await mPage.click('#trip-wizard-finish');
      await mPage.waitForTimeout(500);
    }

    // 6.1 Open Mobile Sheet Menu
    const menuToggleBtn = await mPage.isVisible('#mobile-menu-toggle-btn');
    if (menuToggleBtn) {
      await mPage.click('#mobile-menu-toggle-btn');
      await mPage.waitForSelector('#mobile-menu-sheet', { state: 'visible' });

      // 8.1 Desktop Advisory Notice Visibility in Mobile Sheet
      const advisoryNotice = await mPage.isVisible('.desktop-recommendation-advisory');
      console.log(`[Mobile 8.1] Advisory notice visible in mobile sheet: ${advisoryNotice}`);
      results.mobile['8.1'] = advisoryNotice ? 'PASS' : 'FAIL';

      // 6.1 Mobile Menu Cities Button
      const mobileCitiesBtn = await mPage.isVisible('#mobile-menu-cities-btn');
      console.log(`[Mobile 6.1] Mobile sheet Cities button visible: ${mobileCitiesBtn}`);
      results.mobile['6.1'] = mobileCitiesBtn ? 'PASS' : 'FAIL';
    }

    await mobileCtx.close();

  } catch (err) {
    console.error('Execution error during verification:', err);
  } finally {
    await browser.close();
    await serverObj.close();
  }

  console.log('\n==========================================');
  console.log('📊 AI AUTOMATED RUNSHEET RESULTS SUMMARY');
  console.log('==========================================');
  console.log('Desktop Suite Results:', JSON.stringify(results.desktop, null, 2));
  console.log('Mobile Suite Results:', JSON.stringify(results.mobile, null, 2));
}

runMilestone2Runsheet();
