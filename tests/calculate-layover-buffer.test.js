const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function runCalculateLayoverBufferTests() {
  console.log('Running calculateLayoverBuffer unit tests...');

  const transportCode = fs.readFileSync(path.join(__dirname, '../js/transport.js'), 'utf8');

  const documentMock = {
    body: { classList: { contains: () => false } },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const windowMock = {
    document: documentMock,
    addEventListener: () => {}
  };

  const evalFn = new Function('windowMock', `
    const window = windowMock;
    const document = windowMock.document;
    ${transportCode}
    return { calculateLayoverBuffer, evaluateLayoverBuffer, parseDateTimeToTs };
  `);

  const { calculateLayoverBuffer } = evalFn(windowMock);

  // 1. Null / Invalid parameter inputs
  assert(calculateLayoverBuffer(null, null) === null, 'null inputs should return null');
  assert(calculateLayoverBuffer({}, null) === null, 'null itemB should return null');
  assert(calculateLayoverBuffer(null, {}) === null, 'null itemA should return null');
  assert(calculateLayoverBuffer({}, {}) === null, 'items without time properties should return null');
  assert(
    calculateLayoverBuffer({ arrivalTime: '10:00' }, {}) === null,
    'missing timeB should return null'
  );
  assert(
    calculateLayoverBuffer({}, { departureTime: '12:00' }) === null,
    'missing timeA should return null'
  );

  // 2. Time-only fallback parsing (when date is missing or invalid)
  {
    const itemA = { arrivalTime: '10:00' };
    const itemB = { departureTime: '11:45' };
    const res = calculateLayoverBuffer(itemA, itemB);
    assert(res !== null, 'time-only items should return layover object');
    assert(res.bufferMinutes === 105, 'time-only buffer calculation should equal 105 minutes');
    assert(res.formattedBuffer === '1h 45m', 'formatted time should be 1h 45m');

    const invalidTimeA = { arrivalTime: 'invalid' };
    const invalidTimeB = { departureTime: '12:00' };
    assert(
      calculateLayoverBuffer(invalidTimeA, invalidTimeB) === null,
      'unparseable time should return null'
    );
  }

  // 3. Property Key Fallbacks for itemA and itemB
  {
    // itemA fallbacks for date: arrivalDate, departureDate, dayDate, dateStr, date
    // itemA fallbacks for time: arrivalTime, endTime, departureTime, startTime
    // itemB fallbacks for date: departureDate, dayDate, dateStr, date
    // itemB fallbacks for time: departureTime, startTime

    const itemA = {
      date: '2026-06-10',
      startTime: '08:00'
    };
    const itemB = {
      dayDate: '2026-06-10',
      startTime: '09:30'
    };

    const res = calculateLayoverBuffer(itemA, itemB);
    assert(res !== null, 'property key fallbacks should be recognized');
    assert(res.bufferMinutes === 90, 'buffer minutes should be 90');
  }

  // 4. Flight Layover Thresholds & Classification
  {
    // Flight thresholds: tight = 90m, critical = 60m
    const itemA = {
      transportType: 'flight',
      arrivalDate: '2026-07-01',
      arrivalTime: '10:00'
    };

    // 4a. Normal Flight Layover (120m >= 90m)
    const itemB1 = {
      transportType: 'flight',
      departureDate: '2026-07-01',
      departureTime: '12:00'
    };
    const res1 = calculateLayoverBuffer(itemA, itemB1);
    assert(res1.bufferMinutes === 120, 'bufferMinutes should be 120');
    assert(res1.level === 'normal', 'level should be normal');
    assert(res1.isClash === false, 'isClash should be false');
    assert(res1.formattedBuffer === '2h', 'formattedBuffer should be 2h');

    // 4b. Advisory Flight Layover (75m: < 90m tight, >= 60m critical)
    const itemB2 = {
      transportType: 'flight',
      departureDate: '2026-07-01',
      departureTime: '11:15'
    };
    const res2 = calculateLayoverBuffer(itemA, itemB2);
    assert(res2.bufferMinutes === 75, 'bufferMinutes should be 75');
    assert(res2.level === 'advisory', 'level should be advisory');
    assert(res2.isClash === false, 'isClash should be false');

    // 4c. Alert Flight Layover (45m: < 60m critical, >= 0m)
    const itemB3 = {
      transportType: 'flight',
      departureDate: '2026-07-01',
      departureTime: '10:45'
    };
    const res3 = calculateLayoverBuffer(itemA, itemB3);
    assert(res3.bufferMinutes === 45, 'bufferMinutes should be 45');
    assert(res3.level === 'alert', 'level should be alert');
    assert(res3.isClash === false, 'isClash should be false');

    // 4d. Schedule Clash (-30m < 0)
    const itemB4 = {
      transportType: 'flight',
      departureDate: '2026-07-01',
      departureTime: '09:30'
    };
    const res4 = calculateLayoverBuffer(itemA, itemB4);
    assert(res4.bufferMinutes === -30, 'bufferMinutes should be -30');
    assert(res4.level === 'alert', 'level should be alert');
    assert(res4.isClash === true, 'isClash should be true');
    assert(res4.formattedBuffer === '-30m', 'formattedBuffer should be -30m');
  }

  // 5. Non-Flight Transport Modes & Thresholds
  {
    // Non-flight thresholds: tight = 20m, critical = 15m
    const itemA = {
      transportType: 'train',
      arrivalDate: '2026-07-01',
      arrivalTime: '14:00'
    };

    // 5a. Normal Train Transfer (30m >= 20m)
    const itemB1 = {
      transportType: 'train',
      departureDate: '2026-07-01',
      departureTime: '14:30'
    };
    const res1 = calculateLayoverBuffer(itemA, itemB1);
    assert(res1.level === 'normal', 'train transfer >= 20m should be normal');

    // 5b. Advisory Train Transfer (18m: < 20m tight, >= 15m critical)
    const itemB2 = {
      transportType: 'train',
      departureDate: '2026-07-01',
      departureTime: '14:18'
    };
    const res2 = calculateLayoverBuffer(itemA, itemB2);
    assert(res2.level === 'advisory', 'train transfer < 20m should be advisory');

    // 5c. Alert Train Transfer (10m: < 15m critical)
    const itemB3 = {
      transportType: 'train',
      departureDate: '2026-07-01',
      departureTime: '14:10'
    };
    const res3 = calculateLayoverBuffer(itemA, itemB3);
    assert(res3.level === 'alert', 'train transfer < 15m should be alert');
  }

  // 6. Transport Mode Inference
  {
    // Test mode inference from type strings, transportType strings, and keyword regex
    const modesToTest = [
      { item: { transportType: 'plane' }, expectedMode: 'flight' },
      { item: { type: 'rail' }, expectedMode: 'train' },
      { item: { transportType: 'bus' }, expectedMode: 'bus' },
      { item: { transportType: 'boat' }, expectedMode: 'ferry' },
      { item: { transportType: 'walking' }, expectedMode: 'walk' },
      { item: { transportType: 'car' }, expectedMode: 'car' },
      { item: { provider: 'Swiss Air Airline' }, expectedMode: 'flight' },
      { item: { notes: 'Taking Trenitalia metro' }, expectedMode: 'train' },
      { item: { journeyName: 'Catamaran Ferry Cruise' }, expectedMode: 'ferry' },
      { item: { title: 'Coach Transfer' }, expectedMode: 'bus' },
      { item: { title: 'Unknown' }, expectedMode: 'other' }
    ];

    const dummyItemA = { arrivalTime: '10:00' };

    modesToTest.forEach(({ item, expectedMode }) => {
      const itemB = { ...item, departureTime: '12:00' };
      const res = calculateLayoverBuffer(dummyItemA, itemB);
      assert(
        res.mode === expectedMode,
        `expected inferred mode ${expectedMode} for item ${JSON.stringify(item)}, got ${res.mode}`
      );
    });
  }

  // 7. Metadata Assembly
  {
    const itemA = {
      arrivalTime: '10:00',
      provider: 'Lufthansa',
      routeCode: 'LH100',
      toAddress: 'Terminal 1',
      notes: 'Check luggage'
    };

    const itemB = {
      departureTime: '12:00',
      provider: 'Swiss',
      routeCode: 'LX200',
      fromAddress: 'Gate B2',
      notes: 'Bring passport'
    };

    const res = calculateLayoverBuffer(itemA, itemB);
    assert(res.carrier === 'Lufthansa → Swiss', 'carrier should join providers');
    assert(res.routeCode === 'LH100 → LX200', 'routeCode should join route codes');
    assert(res.terminalPlatform === 'Terminal 1 → Gate B2', 'terminalPlatform should join addresses');
    assert(res.notes === 'Check luggage | Bring passport', 'notes should join notes with pipe');
  }

  console.log('✅ ALL calculateLayoverBuffer UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runCalculateLayoverBufferTests().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { runCalculateLayoverBufferTests };
