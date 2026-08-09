const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const iconsDirectory = path.join(root, 'icons');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#1A242F"/><path d="M110 288l292-94-132 132 40 104-52 24-42-100-106-66z" fill="#F7F5F0"/></svg>`;

async function generateIcon(size) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body,img{display:block;margin:0;width:100%;height:100%;}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
    await page.screenshot({ path: path.join(iconsDirectory, `icon-${size}.png`), type: 'png' });
  } finally {
    await browser.close();
  }
}

async function main() {
  fs.mkdirSync(iconsDirectory, { recursive: true });
  await Promise.all([192, 512, 1024].map(generateIcon));

  const iosIcon = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
  if (fs.existsSync(path.dirname(iosIcon))) {
    fs.copyFileSync(path.join(iconsDirectory, 'icon-1024.png'), iosIcon);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
