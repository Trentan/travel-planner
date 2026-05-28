const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\\\/g, '/');
  await page.goto(fileUrl);
  
  await page.waitForTimeout(1000);
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('Found file input, uploading backup...');
    await fileInput.setInputFiles(path.resolve('backups/2026_June_July_Europe_Thailand.json'));
    await page.waitForTimeout(2000);
  } else {
    console.log('File input not found');
  }
  
  await browser.close();
})();
