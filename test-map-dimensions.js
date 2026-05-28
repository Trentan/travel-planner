const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'));
  await page.waitForTimeout(1000);
  
  await page.click('.app-tab-btn[data-tab="map"]');
  await page.waitForTimeout(2000);
  
  const dims = await page.evaluate(() => {
    const container = document.getElementById('journey-map-view');
    const leaflet = container.querySelector('.leaflet-container');
    const mapObj = window.mainMap;
    return {
      containerClientWidth: container.clientWidth,
      containerClientHeight: container.clientHeight,
      leafletClientWidth: leaflet ? leaflet.clientWidth : null,
      leafletClientHeight: leaflet ? leaflet.clientHeight : null,
      mapSize: mapObj ? mapObj.getSize() : null
    };
  });
  
  console.log(dims);
  
  await browser.close();
})();
