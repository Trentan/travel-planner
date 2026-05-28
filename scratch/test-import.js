const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  const url = `file://${path.resolve('index.html').replace(/\\/g, '/')}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  
  console.log("Page loaded. Injecting file upload...");
  
  const jsonPath = path.resolve('backups/2026_June_July_Europe_Thailand.json');
  
  try {
    await page.setInputFiles('#importFile', jsonPath);
    // Wait for the import to process and render
    await page.waitForTimeout(2000);
    console.log("File uploaded via UI.");
  } catch (err) {
    console.error("Evaluation Error:", err.toString());
  }

  if (errors.length > 0) {
    console.log("Console Errors:", errors);
  } else {
    console.log("No console errors.");
  }
  
  await browser.close();
})();
