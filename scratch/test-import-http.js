const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath = '.' + url;
  if (filePath === './') filePath = './index.html';
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
  };
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found: ' + filePath);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(8127, async () => {
  console.log("Server running on 8127");
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  const url = `http://127.0.0.1:8127`;
  await page.goto(url, { waitUntil: 'networkidle' });
  
  console.log("Page loaded. Uploading file...");
  
  const jsonPath = path.resolve('backups/2026_June_July_Europe_Thailand.json');
  
  try {
    await page.setInputFiles('#importFile', jsonPath);
    await page.waitForTimeout(3000); // wait for the import to process
    
    const html = await page.evaluate(() => document.querySelector('#itinerary').innerHTML);
    console.log("Itinerary HTML length:", html.length);
    if (html.length < 100) {
      console.log("HTML:", html);
    }
  } catch (err) {
    console.error("Upload Error:", err.toString());
  }

  if (errors.length > 0) {
    console.log("Console Errors:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("No console errors.");
  }
  
  await browser.close();
  server.close();
});
