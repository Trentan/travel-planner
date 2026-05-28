const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium, devices } = require('playwright');

const PORT = 52985;

function startStaticServer(rootDir, port = PORT) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(rootDir, req.url === '/' ? '/index.html' : req.url);
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml'
      };
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`[server] start - http://127.0.0.1:${port}`);
      resolve({ port, close: () => server.close() });
    });

    server.on('error', reject);
  });
}

async function main() {
  const server = await startStaticServer(path.resolve(__dirname, '..'));
  const baseUrl = `http://127.0.0.1:${server.port}`;

  console.log(`[screenshot] Launching browser to take mobile itinerary screenshot`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  // Navigate to the app and wait for it to load
  await page.goto(baseUrl);
  await page.waitForSelector('.day-card');
  await page.waitForTimeout(500);

  // Click on the first day-bar to expand it
  const firstDayBar = page.locator('.day-bar').first();
  await firstDayBar.click();
  await page.waitForTimeout(500);

  // Take screenshot of the expanded day card
  const dayCard = page.locator('.day-card').first();
  await dayCard.screenshot({ path: 'scratch/mobile-expanded-day.png' });
  console.log('[screenshot] Captured scratch/mobile-expanded-day.png');

  await browser.close();
  await server.close();
  process.exit(0);
}

main().catch(err => {
  console.error('[screenshot] Error:', err);
  process.exit(1);
});
