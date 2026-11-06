const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function runMobileNavBottomSheetTests() {
  console.log('Testing Mobile Navigation Consolidation, Bottom-Sheet Switcher & Clean Trips Dialog (#634)...');

  const server = await startStaticServer(path.resolve('.'));
  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------
    // 1. Mobile Viewport (390 x 844) Navigation & Clutter Elimination
    // -------------------------------------------------------------
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();
    await page.goto(server.baseUrl + '/index.html', { waitUntil: 'networkidle' });

    // Verify Persistent Top Bar is HIDDEN on Mobile (eliminating clutter)
    const mobileHeaderState = await page.evaluate(() => {
      const bar = document.querySelector('.app-menu-bar');
      const header = document.querySelector('header');
      const cityNav = document.getElementById('cityNav');
      const menuBtn = document.querySelector('.mobile-tabs-menu-btn');

      return {
        barDisplay: bar ? window.getComputedStyle(bar).display : 'none',
        headerDisplay: header ? window.getComputedStyle(header).display : 'none',
        cityNavTop: cityNav ? window.getComputedStyle(cityNav).top : null,
        hasMobileMenuTabBtn: !!menuBtn
      };
    });

    assert.strictEqual(
      mobileHeaderState.barDisplay,
      'none',
      'Persistent mobile top bar (.app-menu-bar) must be hidden on mobile to maximize screen real estate'
    );
    assert.strictEqual(
      mobileHeaderState.headerDisplay,
      'none',
      'Header element must be hidden on mobile app mode'
    );
    assert(
      mobileHeaderState.hasMobileMenuTabBtn,
      'Bottom navigation tab bar must provide the mobile menu access button'
    );
    console.log('  ✔ Mobile viewport: Persistent top bar is hidden (display: none), maximizing screen space');

    // -------------------------------------------------------------
    // 2. Mobile Menu Sheet & Action Controls
    // -------------------------------------------------------------
    await page.click('.mobile-tabs-menu-btn');
    await page.waitForTimeout(200);

    const menuStructure = await page.evaluate(() => {
      const sheet = document.getElementById('mobileMenuSheet');
      const shareSection = sheet.querySelector('[aria-labelledby="mobileMenuShareExport"]');
      const toolsSection = sheet.querySelector('[aria-labelledby="mobileMenuTools"]');
      const settingsSection = sheet.querySelector('[aria-labelledby="mobileMenuSettings"]');
      const advancedDetails = sheet.querySelector('details.mobile-menu-advanced');
      const switchBtn = document.getElementById('mobileTripSwitchBtn');
      const undoBtn = document.getElementById('mobileUndoBtn');
      const redoBtn = document.getElementById('mobileRedoBtn');

      return {
        isOpen: sheet && sheet.classList.contains('open'),
        hasShareSection: !!shareSection,
        hasToolsSection: !!toolsSection,
        hasSettingsSection: !!settingsSection,
        hasAdvancedAccordion: !!advancedDetails,
        advancedClosedByDefault: advancedDetails ? !advancedDetails.open : false,
        hasSwitchBtn: !!switchBtn,
        hasUndoBtn: !!undoBtn,
        hasRedoBtn: !!redoBtn,
        destructiveInAdvanced: advancedDetails ? !!advancedDetails.querySelector('.danger') : false
      };
    });

    assert(menuStructure.isOpen, 'Mobile menu drawer should open on menu button tap');
    assert(menuStructure.hasSwitchBtn, 'Mobile menu should feature a Switch trip button');
    assert(menuStructure.hasShareSection, 'Mobile menu should have Share & Export section');
    assert(menuStructure.hasToolsSection, 'Mobile menu should have Tools & Travel Assistants section');
    assert(menuStructure.hasSettingsSection, 'Mobile menu should have Settings & Appearance section');
    assert(menuStructure.hasAdvancedAccordion, 'Mobile menu should have Advanced & Troubleshooting accordion');
    assert(menuStructure.advancedClosedByDefault, 'Advanced section should be collapsed by default');
    assert(menuStructure.destructiveInAdvanced, 'Destructive actions must be tucked inside Advanced section');
    assert(menuStructure.hasUndoBtn && menuStructure.hasRedoBtn, 'Undo & Redo buttons should be in top status card');
    console.log('  ✔ Consolidated mobile menu structured into clean groups with collapsible advanced actions');

    // -------------------------------------------------------------
    // 3. Tapping Switch Opens Bottom-Sheet Trip Switcher
    // -------------------------------------------------------------
    await page.click('#mobileTripSwitchBtn');
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

    assert(sheetOpened.isOpen, 'Trip bottom sheet should open when Switch is tapped');
    assert.strictEqual(sheetOpened.ariaHidden, 'false', 'Bottom sheet aria-hidden should be false when open');
    assert(sheetOpened.recentItemsCount >= 1, 'Bottom sheet should populate recent trips list');
    assert(sheetOpened.recentItemsCount <= 3, 'Bottom sheet should display at most 3 recent trips');
    assert(sheetOpened.hasNewTripBtn, 'Bottom sheet should include a prominent Create New Trip button');
    assert(sheetOpened.hasAllTripsBtn, 'Bottom sheet should include a View All Trips link/button');
    console.log(`  ✔ Bottom-sheet trip switcher opened with ${sheetOpened.recentItemsCount} recent trip(s), New Trip and View All actions`);

    // -------------------------------------------------------------
    // 4. Opening Trips Dialog (#tripLibraryModal) - Simplified Consolidated View
    // -------------------------------------------------------------
    await page.evaluate(() => {
      window.closeTripBottomSheet();
      window.openTripLibraryModal();
    });
    await page.waitForTimeout(300);

    const dialogState = await page.evaluate(() => {
      const modal = document.getElementById('tripLibraryModal');
      const localTab = document.getElementById('tripLibraryTabLocal');
      const cloudTab = document.getElementById('tripLibraryTabCloud');
      const title = modal ? modal.querySelector('h2') : null;
      const newTripBtn = document.getElementById('tripLibraryNewTripBtn');
      const grid = document.getElementById('tripGalleryGrid');
      const cards = grid ? grid.querySelectorAll('.trip-gallery-card') : [];

      const firstCard = cards[0];
      let cardDetails = null;
      if (firstCard) {
        const cardTitle = firstCard.querySelector('h3');
        const icon = firstCard.querySelector('.text-3xl');
        const activeBadge = firstCard.querySelector('.bg-teal-100');
        const actionBtn = firstCard.querySelector('.action-btn, .trip-btn');
        cardDetails = {
          titleText: cardTitle ? cardTitle.textContent.trim() : '',
          hasIcon: !!icon,
          isActive: !!activeBadge || firstCard.classList.contains('active-card'),
          hasAction: !!actionBtn,
          innerHTML: firstCard.innerHTML
        };
      }

      return {
        isModalVisible: modal && window.getComputedStyle(modal).display !== 'none',
        titleText: title ? title.textContent.trim() : '',
        hasNewTripBtn: !!newTripBtn,
        localTabHidden: localTab ? (window.getComputedStyle(localTab).display === 'none' || localTab.offsetParent === null) : true,
        cloudTabHidden: cloudTab ? (window.getComputedStyle(cloudTab).display === 'none' || cloudTab.offsetParent === null) : true,
        cardCount: cards.length,
        firstCard: cardDetails
      };
    });

    assert(dialogState.isModalVisible, 'Trips dialog (#tripLibraryModal) should be visible');
    assert(dialogState.titleText.includes('My Trips'), `Dialog title should indicate 'My Trips', found '${dialogState.titleText}'`);
    assert(dialogState.hasNewTripBtn, 'Dialog should feature a prominent New Trip button in header');
    assert(dialogState.localTabHidden, 'Local tab button should be hidden to present a single consolidated view');
    assert(dialogState.cloudTabHidden, 'Cloud tab button should be hidden to eliminate confusing segregation');
    assert(dialogState.cardCount >= 1, `Trips dialog must show consolidated trip cards (found ${dialogState.cardCount})`);
    assert(dialogState.firstCard, 'Trip card should be rendered');
    assert(dialogState.firstCard.hasIcon, 'Trip card should display a spacious 3xl emoji icon');
    assert(dialogState.firstCard.titleText.length > 0, 'Trip card should display trip title');
    assert(dialogState.firstCard.innerHTML.includes('legs'), 'Trip card should display leg count stat');
    assert(dialogState.firstCard.innerHTML.includes('stays'), 'Trip card should display stay count stat');
    console.log(`  ✔ Consolidated Trips dialog: Clean spacious gallery with ${dialogState.cardCount} trip card(s), no confusing local/cloud tabs`);

    // Close Trips dialog
    await page.evaluate(() => window.closeTripLibraryModal());
    await page.waitForTimeout(150);

    const dialogClosed = await page.evaluate(() => {
      const modal = document.getElementById('tripLibraryModal');
      return !modal || window.getComputedStyle(modal).display === 'none';
    });
    assert(dialogClosed, 'Trips dialog should close cleanly');
    console.log('  ✔ Trips dialog closes cleanly');

    await context.close();

    // -------------------------------------------------------------
    // 5. Desktop Viewport (1440 x 900) Verification
    // -------------------------------------------------------------
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(server.baseUrl + '/index.html', { waitUntil: 'networkidle' });

    // On desktop, the persistent menu bar is visible
    const desktopBarDisplay = await desktopPage.evaluate(() => {
      const bar = document.querySelector('.app-menu-bar');
      return bar ? window.getComputedStyle(bar).display : 'none';
    });
    assert.strictEqual(desktopBarDisplay, 'flex', 'Desktop viewport should display top menu bar (.app-menu-bar)');

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
    console.log('  ✔ Desktop viewport preserves top bar and dropdown behavior without triggering bottom sheet');

    await desktopContext.close();
    console.log('✔ All Mobile Navigation Consolidation, Bottom-Sheet Switcher & Clean Trips Dialog tests passed!\n');
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
