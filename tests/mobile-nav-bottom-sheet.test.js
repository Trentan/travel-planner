const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runMobileNavBottomSheetTests() {
  console.log('Testing Mobile Navigation Consolidation & Bottom-Sheet Switcher (#634)...');

  const server = await startStaticServer(path.resolve('.'));
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Mobile Viewport (390 x 844) Verification
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();
    await page.goto(server.baseUrl + '/index.html', { waitUntil: 'networkidle' });

    // Verify Mobile Top Bar exists and height <= 56px
    const topBarMetrics = await page.evaluate(() => {
      const bar = document.querySelector('.app-menu-bar');
      const tripBtn = document.getElementById('currentTripBtn');
      const syncPill = document.getElementById('headerCloudSyncStatusPill');
      const moreBtn = document.querySelector('.mobile-menu-btn');
      const saveStatus = document.getElementById('saveStatus');
      const editBtn = document.getElementById('editToggleBtn');

      return {
        barDisplay: window.getComputedStyle(bar).display,
        barHeight: bar.offsetHeight,
        tripBtnVisible: window.getComputedStyle(tripBtn).display !== 'none',
        syncPillVisible: window.getComputedStyle(syncPill).display !== 'none',
        moreBtnVisible: window.getComputedStyle(moreBtn).display !== 'none',
        saveStatusHidden: window.getComputedStyle(saveStatus).display === 'none',
        editBtnHidden: window.getComputedStyle(editBtn).display === 'none'
      };
    });

    assert.strictEqual(topBarMetrics.barDisplay, 'flex', 'Mobile top bar should be display: flex');
    assert(topBarMetrics.barHeight <= 56, `Mobile top bar height (${topBarMetrics.barHeight}px) must be <= 56px`);
    assert(topBarMetrics.tripBtnVisible, 'Trip switcher button should be visible in mobile top bar');
    assert(topBarMetrics.syncPillVisible, 'Cloud sync pill should be visible in mobile top bar');
    assert(topBarMetrics.moreBtnVisible, 'More/Menu button should be visible in mobile top bar');
    assert(topBarMetrics.saveStatusHidden, 'Save status should be hidden on mobile top bar');
    assert(topBarMetrics.editBtnHidden, 'Edit toggle should be hidden on mobile top bar');
    console.log(`  ✔ Mobile top bar height is ${topBarMetrics.barHeight}px (<= 56px) with clean streamlined controls`);

    // 2. Tapping trip title on mobile opens Bottom Sheet Trip Switcher
    const sheetInitiallyClosed = await page.evaluate(() => {
      const sheet = document.getElementById('tripBottomSheet');
      return sheet && !sheet.classList.contains('open');
    });
    assert(sheetInitiallyClosed, 'Trip bottom sheet should be closed initially');

    await page.click('#currentTripBtn');
    await page.waitForTimeout(200);

    const sheetOpened = await page.evaluate(() => {
      const sheet = document.getElementById('tripBottomSheet');
      const recentList = document.getElementById('tripBottomSheetRecentList');
      const items = recentList ? recentList.querySelectorAll('.trip-bottom-sheet-item') : [];
      const buttons = sheet ? Array.from(sheet.querySelectorAll('button')) : [];
      const newTripBtn = buttons.find(b => b.textContent.includes('Create New Trip'));
      const allTripsBtn = buttons.find(b => b.textContent.includes('View All Trips'));

      return {
        isOpen: sheet && sheet.classList.contains('open'),
        ariaHidden: sheet ? sheet.getAttribute('aria-hidden') : null,
        recentItemsCount: items.length,
        hasNewTripBtn: !!newTripBtn,
        hasAllTripsBtn: !!allTripsBtn
      };
    });

    assert(sheetOpened.isOpen, 'Trip bottom sheet should open when #currentTripBtn is tapped on mobile');
    assert.strictEqual(sheetOpened.ariaHidden, 'false', 'Bottom sheet aria-hidden should be false when open');
    assert(sheetOpened.recentItemsCount >= 1, 'Bottom sheet should populate recent trips list');
    assert(sheetOpened.recentItemsCount <= 3, 'Bottom sheet should display at most 3 recent trips');
    assert(sheetOpened.hasNewTripBtn, 'Bottom sheet should include a prominent Create New Trip button');
    assert(sheetOpened.hasAllTripsBtn, 'Bottom sheet should include a View All Trips link/button');
    console.log(`  ✔ Bottom-sheet trip switcher opened with ${sheetOpened.recentItemsCount} recent trip(s), New Trip and View All actions`);

    // 3. Close bottom sheet
    await page.evaluate(() => window.closeTripBottomSheet());
    await page.waitForTimeout(150);
    const sheetClosed = await page.evaluate(() => {
      const sheet = document.getElementById('tripBottomSheet');
      return !sheet.classList.contains('open') && sheet.getAttribute('aria-hidden') === 'true';
    });
    assert(sheetClosed, 'Bottom sheet should close cleanly');
    console.log('  ✔ Bottom sheet closes cleanly');

    // 4. Verify Mobile Menu Sheet organization
    await page.evaluate(() => window.toggleMobileMenu());
    await page.waitForTimeout(200);

    const menuStructure = await page.evaluate(() => {
      const sheet = document.getElementById('mobileMenuSheet');
      const shareSection = sheet.querySelector('[aria-labelledby="mobileMenuShareExport"]');
      const toolsSection = sheet.querySelector('[aria-labelledby="mobileMenuTools"]');
      const settingsSection = sheet.querySelector('[aria-labelledby="mobileMenuSettings"]');
      const advancedDetails = sheet.querySelector('details.mobile-menu-advanced');
      const undoBtn = document.getElementById('mobileUndoBtn');
      const redoBtn = document.getElementById('mobileRedoBtn');

      return {
        isOpen: sheet && sheet.classList.contains('open'),
        hasShareSection: !!shareSection,
        hasToolsSection: !!toolsSection,
        hasSettingsSection: !!settingsSection,
        hasAdvancedAccordion: !!advancedDetails,
        advancedClosedByDefault: advancedDetails ? !advancedDetails.open : false,
        hasUndoBtn: !!undoBtn,
        hasRedoBtn: !!redoBtn,
        destructiveInAdvanced: advancedDetails ? !!advancedDetails.querySelector('.danger') : false
      };
    });

    assert(menuStructure.isOpen, 'Mobile menu should open');
    assert(menuStructure.hasShareSection, 'Mobile menu should have Share & Export section');
    assert(menuStructure.hasToolsSection, 'Mobile menu should have Tools & Travel Assistants section');
    assert(menuStructure.hasSettingsSection, 'Mobile menu should have Settings & Appearance section');
    assert(menuStructure.hasAdvancedAccordion, 'Mobile menu should have Advanced & Troubleshooting accordion');
    assert(menuStructure.advancedClosedByDefault, 'Advanced section should be closed by default');
    assert(menuStructure.destructiveInAdvanced, 'Destructive actions (Factory Reset) should be nested inside Advanced accordion');
    assert(menuStructure.hasUndoBtn && menuStructure.hasRedoBtn, 'Undo & Redo buttons should be present in top status card');
    console.log('  ✔ Consolidated mobile menu structured into 3 clean groups + collapsible advanced section');

    await page.evaluate(() => window.closeMobileMenu());
    await context.close();

    // 5. Desktop Viewport (1440 x 900) Verification
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(server.baseUrl + '/index.html', { waitUntil: 'networkidle' });

    // On desktop, clicking trip switcher opens the dropdown menu, not the mobile bottom sheet
    await desktopPage.click('#currentTripBtn');
    await desktopPage.waitForTimeout(150);

    const desktopDropdownState = await desktopPage.evaluate(() => {
      const dropdown = document.getElementById('tripDropdownMenu');
      const sheet = document.getElementById('tripBottomSheet');
      return {
        dropdownVisible: dropdown && !dropdown.hidden,
        sheetOpen: sheet && sheet.classList.contains('open')
      };
    });

    assert(desktopDropdownState.dropdownVisible, 'On desktop, clicking #currentTripBtn should open #tripDropdownMenu');
    assert(!desktopDropdownState.sheetOpen, 'On desktop, mobile bottom sheet should remain closed');
    console.log('  ✔ Desktop viewport preserves header dropdown behavior without triggering bottom sheet');

    await desktopContext.close();
    console.log('✔ All Mobile Navigation Consolidation & Bottom-Sheet Switcher tests passed!\n');
  } finally {
    await browser.close();
    await server.stop();
  }
}

if (require.main === module) {
  runMobileNavBottomSheetTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMobileNavBottomSheetTests };
