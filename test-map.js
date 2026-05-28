const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.url().includes('tile') && !response.ok()) {
      console.log(`Failed to load tile: ${response.url()} - ${response.status()}`);
    }
  });
  
  await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'));
  console.log('Page loaded');
  
  await page.waitForTimeout(1000);
  
  console.log('Clicking Map tab...');
  await page.click('.app-tab-btn[data-tab="map"]');
  
  console.log('Waiting for map to render...');
  await page.waitForTimeout(2000);
  
  const dims = await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    if (window.mainMap) window.mainMap.invalidateSize(false);
    
    const pane = document.querySelector('.leaflet-tile-pane');
    if (!pane) return { error: 'No pane' };
    
    const tiles = Array.from(pane.querySelectorAll('img'));
    return {
      tileCount: tiles.length,
      tiles: tiles.map(t => ({
        src: t.src,
        width: t.style.width,
        height: t.style.height,
        left: t.style.left,
        top: t.style.top,
        opacity: window.getComputedStyle(t).opacity,
        display: window.getComputedStyle(t).display,
        visibility: window.getComputedStyle(t).visibility,
        classList: t.className
      }))
    };
  });
  
  console.log(JSON.stringify(dims, null, 2));
  
  await page.waitForTimeout(1000);
  
  const artifactPath = 'C:/Users/trent/.gemini/antigravity/brain/bbeb5a3b-ba7d-4536-b38e-9705534b00ca/map-debug.png';
  await page.screenshot({ path: artifactPath });
  console.log('Screenshot saved to ' + artifactPath);
  
  await browser.close();
})();
