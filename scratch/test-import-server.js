const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  console.log("Starting server...");
  const server = spawn('npx', ['http-server', '-p', '8080'], { stdio: 'ignore' });
  
  await new Promise(r => setTimeout(r, 2000)); // wait for server to start

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  const url = `http://localhost:8080`;
  await page.goto(url, { waitUntil: 'networkidle' });
  
  console.log("Page loaded. Injecting file upload...");
  
  const jsonPath = path.resolve('backups/2026_June_July_Europe_Thailand.json');
  
  try {
    await page.setInputFiles('#importFile', jsonPath);
    await page.waitForTimeout(3000); // wait for the import to process and render
    console.log("File uploaded via UI.");
  } catch (err) {
    console.error("Evaluation Error:", err.toString());
  }

  if (errors.length > 0) {
    console.log("Console Errors:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("No console errors.");
  }
  
  await browser.close();
  server.kill();
})();
