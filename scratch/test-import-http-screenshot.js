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

server.listen(8128, async () => {
  console.log("Server running on 8128");
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  const url = `http://127.0.0.1:8128`;
  await page.goto(url, { waitUntil: 'networkidle' });
  
  const jsonPath = path.resolve('backups/2026_June_July_Europe_Thailand.json');
  await page.setInputFiles('#importFile', jsonPath);
  await page.waitForTimeout(2000); // wait for the import to process
  
  await page.screenshot({ path: 'scratch/import_screenshot.png', fullPage: true });
  console.log("Screenshot saved to scratch/import_screenshot.png");
  
  await browser.close();
  server.close();
});
