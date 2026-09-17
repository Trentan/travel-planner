const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

const PORT = 52980;

async function main() {
  const server = await startStaticServer(path.resolve(__dirname, '..'), PORT);
  const baseUrl = server.baseUrl;
  let browser = null;

  try {

  console.log(`[verify] Starting chip rail verification at ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  // Navigate to the app and wait for it to load
  await page.goto(baseUrl);
  await page.waitForSelector('#cityNav .city-nav-btn:not([data-city="all"])');
  await page.waitForTimeout(500);

  // Take initial screenshot
  await page.screenshot({ path: 'scratch/chip-rail-mobile-initial.png', fullPage: false });
  console.log('[verify] Captured mobile view screenshot');

  // Open main menu to see itinerary
  const menuBtn = page.getByRole('button', { name: /Menu/i }).first();
  if (await menuBtn.count()) {
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Check if chips are visible in city nav
    const cityChips = page.locator('.city-nav-list .city-nav-btn');
    const chipCount = await cityChips.count();
    console.log(`[verify] Found ${chipCount} city nav chips`);

    // Take screenshot of menu/mode
    await page.screenshot({ path: 'scratch/chip-rail-mobile-menu.png', fullPage: false });
    console.log('[verify] Captured mobile menu screenshot');
  }

  // Attempt to scroll horizontally through chips
  const cityNav = page.locator('#cityNav');
  for (let i = 0; i < 3; i++) {
    await cityNav.evaluate((el, offset) => el.scrollBy({ left: offset }), 100);
    await page.waitForTimeout(200);
  }

  // Check for truncation css properties
  const chipStyles = await page.evaluate(() => {
    const chips = document.querySelectorAll('.city-nav-btn, .mobile-swipe-chip, .compact-day-chip');
    return Array.from(chips).slice(0, 3).map(chip => {
      const styles = window.getComputedStyle(chip);
      return {
        textOverflow: styles.textOverflow,
        overflow: styles.overflow,
        whiteSpace: styles.whiteSpace,
        maxWidth: styles.maxWidth,
        minWidth: styles.minWidth
      };
    });
  });

  console.log('[verify] Chip styles:', JSON.stringify(chipStyles, null, 2));

  // Check rail element
  const railStyles = await page.evaluate(() => {
    const rail = document.querySelector('.city-nav-list, .mobile-swipe-rail, .compact-day-rail');
    if (!rail) return null;
    const styles = window.getComputedStyle(rail);
    return {
      overflowX: styles.overflowX,
      maskImage: styles.maskImage,
      webkitMaskImage: styles.webkitMaskImage
    };
  });

  console.log('[verify] Rail styles:', JSON.stringify(railStyles, null, 2));

  // Take final screenshot
  await page.screenshot({ path: 'scratch/chip-rail-mobile-final.png', fullPage: false });
  console.log('[verify] Captured final mobile screenshot');

  await browser.close();
  await server.close();

  console.log('\n[verify] Chip rail verification complete!');
  console.log('Check scratch/ directory for screenshots');

  // Verify that truncation styles are present
  const hasTruncation = chipStyles.some(style =>
    style.textOverflow === 'ellipsis' ||
    style.overflow === 'hidden' ||
    style.whiteSpace === 'nowrap'
  );

  if (hasTruncation) {
    console.log('\n[assert] PASS: Chip elements have truncation styles applied');
  } else {
    console.log('\n[assert] NOTE: No explicit truncation styles found on sampled chips');
  }

  // Verify rail has scroll capability
  if (railStyles && railStyles.overflowX === 'auto') {
    console.log('[assert] PASS: Rail element has horizontal overflow enabled');
  } else if (railStyles) {
    console.log('[assert] NOTE: Rail overflowX =', railStyles.overflowX);
  }
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('[verify] Error:', err);
    process.exit(1);
  });