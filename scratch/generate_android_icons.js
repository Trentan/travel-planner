const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = process.cwd();
const srcIconPath = path.join(root, 'docs', 'play-store', 'app_icon.png');
const base64Icon = fs.readFileSync(srcIconPath).toString('base64');

const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const m of mipmaps) {
      const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res', m.dir);
      
      // Ensure the directory exists
      if (!fs.existsSync(resDir)) {
        fs.mkdirSync(resDir, { recursive: true });
      }

      // 1. Square Launcher Icon (ic_launcher.png)
      let page = await browser.newPage({ viewport: { width: m.size, height: m.size }, deviceScaleFactor: 1 });
      await page.setContent(`
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
          img { display: block; width: 100%; height: 100%; object-fit: cover; }
        </style>
        <img src="data:image/png;base64,${base64Icon}">
      `);
      await page.screenshot({ path: path.join(resDir, 'ic_launcher.png'), omitBackground: true });
      await page.close();

      // 2. Round Launcher Icon (ic_launcher_round.png)
      page = await browser.newPage({ viewport: { width: m.size, height: m.size }, deviceScaleFactor: 1 });
      await page.setContent(`
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
          img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        </style>
        <img src="data:image/png;base64,${base64Icon}">
      `);
      await page.screenshot({ path: path.join(resDir, 'ic_launcher_round.png'), omitBackground: true });
      await page.close();

      // 3. Adaptive Foreground Icon (ic_launcher_foreground.png)
      // We scale the icon down inside a transparent viewport (standard safe zone is 65%)
      page = await browser.newPage({ viewport: { width: m.fgSize, height: m.fgSize }, deviceScaleFactor: 1 });
      await page.setContent(`
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; display: grid; place-items: center; }
          img { display: block; width: 66%; height: 66%; object-fit: contain; border-radius: 12px; }
        </style>
        <img src="data:image/png;base64,${base64Icon}">
      `);
      await page.screenshot({ path: path.join(resDir, 'ic_launcher_foreground.png'), omitBackground: true });
      await page.close();

      console.log(`Generated launcher, round, and foreground icons for ${m.dir}`);
    }
    console.log('All Android icons generated successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
