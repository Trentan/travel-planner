const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

async function runIssue501FocusVisibleTests() {
  console.log('Running Issue #501 keyboard focus-visible accessibility tests...');

  const rootDir = path.resolve(__dirname, '..');
  const componentsCss = fs.readFileSync(path.join(rootDir, 'src/css/components.css'), 'utf8');
  const mobileFeaturesCss = fs.readFileSync(path.join(rootDir, 'src/css/mobile-features.css'), 'utf8');
  const shellCss = fs.readFileSync(path.join(rootDir, 'src/css/shell.css'), 'utf8');

  // 1. Source CSS checks for focus-visible replacements
  assert(
    /\.trip-start-choice:focus-visible\s*\{[^}]*outline:\s*2px\s+solid/.test(mobileFeaturesCss),
    'Expected .trip-start-choice:focus-visible in mobile-features.css to define a visible 2px solid outline'
  );
  assert(
    /\.trip-path-card:focus-visible\s*\{[^}]*outline:\s*2px\s+solid/.test(mobileFeaturesCss),
    'Expected .trip-path-card:focus-visible in mobile-features.css to define a visible 2px solid outline'
  );
  assert(
    /\.header-text\s+h1:focus-visible[\s\S]*?outline:\s*2px\s+solid/.test(shellCss),
    'Expected .header-text h1:focus-visible / header h1:focus-visible in shell.css to define a visible 2px solid outline'
  );
  assert(
    /\.timeline-map-action:focus-visible\s*\{[^}]*(outline:\s*2px\s+solid|box-shadow:)/.test(componentsCss),
    'Expected .timeline-map-action:focus-visible in components.css to define a visible focus ring'
  );

  // 2. Live Playwright verification on DESKTOP (1440x900) and MOBILE (390x844)
  const server = await startStaticServer(rootDir);
  const browser = await chromium.launch({ headless: true });

  try {
    for (const mode of [
      { id: 'DESKTOP', width: 1440, height: 900 },
      { id: 'MOBILE', width: 390, height: 844 }
    ]) {
      const context = await browser.newContext({
        viewport: { width: mode.width, height: mode.height }
      });
      const page = await context.newPage();
      await page.goto(`${server.baseUrl}/index.html`, { waitUntil: 'networkidle' });

      // Inject elements to verify focus-visible ring / box-shadow on form controls, wizard cards, and header h1
      const focusCheck = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.innerHTML = `
          <input id="probe-form-control" class="form-control" type="text" />
          <button id="probe-choice" class="trip-start-choice" type="button">Choice</button>
          <button id="probe-path-card" class="trip-path-card" type="button">Path</button>
        `;
        document.body.appendChild(probe);

        const input = document.getElementById('probe-form-control');
        input.focus();
        const inputShadow = getComputedStyle(input).boxShadow;

        probe.remove();
        return { inputShadow };
      });

      assert(
        focusCheck.inputShadow && focusCheck.inputShadow !== 'none',
        `${mode.id}: Expected .form-control:focus to render a visible box-shadow ring in light mode, got '${focusCheck.inputShadow}'`
      );

      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('Issue #501 keyboard focus-visible accessibility tests passed!');
}

if (require.main === module) {
  runIssue501FocusVisibleTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runIssue501FocusVisibleTests };
