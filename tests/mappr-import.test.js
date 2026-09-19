const assert = require('assert');
const MapprImportModule = require('../js/mappr-import');

async function runMapprImportTests() {
  console.log('--- Running Mappr Import Unit Tests ---');

  const { inferSpotCategory, parseMapprPayload } = MapprImportModule;

  // 1. inferSpotCategory Tests
  assert.strictEqual(inferSpotCategory('Urban House Coffee', 'Specialty espresso and brunch', '').category, 'food');
  assert.strictEqual(inferSpotCategory('Urban House Coffee', '', '').icon, '☕');

  assert.strictEqual(inferSpotCategory('Slovak Restaurant', '', '').icon, '🍽️');
  assert.strictEqual(inferSpotCategory('Slovak Pub', '', '').icon, '🍸');

  assert.strictEqual(inferSpotCategory('Spin Cocktail Bar', 'Craft cocktails and local craft beer', '').category, 'food');
  assert.strictEqual(inferSpotCategory('Spin Cocktail Bar', '', '').icon, '🍸');

  assert.strictEqual(inferSpotCategory('Danubiana Meulensteen Art Museum', 'Modern art museum gallery', '').category, 'sight');
  assert.strictEqual(inferSpotCategory('Danubiana Meulensteen Art Museum', '', '').icon, '🎨');

  assert.strictEqual(inferSpotCategory('Bratislava Castle', 'Historic royal fortress overlooking Danube', '').category, 'sight');
  assert.strictEqual(inferSpotCategory('Bratislava Castle', '', '').icon, '🏛️');

  assert.strictEqual(inferSpotCategory('Sad Janka Kráľa Park', 'Oldest public garden in Central Europe with river views', '').category, 'run');
  assert.strictEqual(inferSpotCategory('Sad Janka Kráľa Park', '', '').icon, '🌿');

  assert.strictEqual(inferSpotCategory('Old Market Hall', 'Indoor farmers market and artisanal bazaar', '').category, 'sight');
  assert.strictEqual(inferSpotCategory('Old Market Hall', '', '').icon, '🛍️');

  assert.strictEqual(inferSpotCategory('Urban House Coffee', '', '').type, 'food');
  assert.strictEqual(inferSpotCategory('Bratislava Castle', '', '').type, 'sight');
  assert.strictEqual(inferSpotCategory('Transit Advice', 'Buy 72 hour tourist travel pass at airport station', '').type, 'tip');

  console.log('✓ inferSpotCategory heuristics passed');

  // 2. parseMapprPayload Tests with Nuxt 3 dereferencing
  const emptyRes = parseMapprPayload('');
  assert.deepStrictEqual(emptyRes.spots, []);

  const mockNuxtData = [
    'root',
    'Bratislava Castle', // 1
    48.1422, // 2
    17.1002, // 3
    'Historic castle overlooking the Danube river.', // 4
    'Visit the treasury museum and courtyard.', // 5
    'Stunning panoramic views of Bratislava.', // 6
    'Zámocká, 811 01 Bratislava', // 7
    'https://bratislava-castle.sk', // 8
    {
      name: 1,
      lat: 2,
      lon: 3,
      summary: 4,
      tips: 5,
      why_go: 6,
      formatted_address: 7,
      website: 8
    }, // 9
    'Cafe Mayer', // 10
    48.1430, // 11
    17.1080, // 12
    'Famous Viennese coffeehouse in central square.', // 13
    'Try the Sachertorte.', // 14
    {
      name: 10,
      lat: 11,
      lon: 12,
      summary: 13,
      tips: 14
    }, // 15
    'Bratislava Curated Highlights', // 16
    'Bratislava', // 17
    {
      title: 16,
      city_name: 17
    } // 18
  ];

  const parsedArray = parseMapprPayload(mockNuxtData);
  assert.strictEqual(parsedArray.title, 'Bratislava Curated Highlights');
  assert.strictEqual(parsedArray.city, 'Bratislava');
  assert.strictEqual(parsedArray.spots.length, 2);

  const castle = parsedArray.spots.find(s => s.name === 'Bratislava Castle');
  assert(castle, 'Should extract Bratislava Castle spot');
  assert.strictEqual(castle.lat, 48.1422);
  assert.strictEqual(castle.lng, 17.1002);
  assert.strictEqual(castle.summary, 'Historic castle overlooking the Danube river.');
  assert.strictEqual(castle.tips, 'Visit the treasury museum and courtyard.');
  assert.strictEqual(castle.whyGo, 'Stunning panoramic views of Bratislava.');
  assert.strictEqual(castle.formatted_address, 'Zámocká, 811 01 Bratislava');
  assert.strictEqual(castle.website, 'https://bratislava-castle.sk');
  assert.strictEqual(castle.category, 'sight');
  assert.strictEqual(castle.icon, '🏛️');
  assert.strictEqual(castle.type, 'sight');

  const cafe = parsedArray.spots.find(s => s.name === 'Cafe Mayer');
  assert(cafe, 'Should extract Cafe Mayer spot');
  assert.strictEqual(cafe.category, 'food');
  assert.strictEqual(cafe.icon, '☕');
  assert.strictEqual(cafe.type, 'food');

  console.log('✓ parseMapprPayload with Nuxt 3 dereferenced array passed');

  // 3. HTML parsing with __NUXT_DATA__ script tag
  const mockHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Slovakia Top Sights | Mappr</title>
      </head>
      <body>
        <div id="__nuxt"></div>
        <script id="__NUXT_DATA__" type="application/json">
          ${JSON.stringify(mockNuxtData)}
        </script>
      </body>
    </html>
  `;

  const parsedHtml = parseMapprPayload(mockHtml);
  assert.strictEqual(parsedHtml.title, 'Slovakia Top Sights');
  assert.strictEqual(parsedHtml.spots.length, 2);
  assert.strictEqual(parsedHtml.spots[0].name, 'Bratislava Castle');

  console.log('✓ parseMapprPayload with HTML extraction passed');

  console.log('All Mappr Import unit tests passed successfully!\n');
}

if (require.main === module) {
  runMapprImportTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMapprImportTests };
