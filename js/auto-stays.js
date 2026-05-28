// Auto-populate missing stays from itinerary
// Scans itinerary and creates accommodation entries for missing nights

/**
 * Calculate expected nights per city from itinerary
 * Counts nights at destination cities (where you sleep)
 * Excludes transit days and placeholder destinations
 * Returns: {cityName: nightsCount}
 */
function calculateExpectedStays() {
  const expectedStays = {};

  // Skip list for destinations that don't represent actual stays
  const skipList = ['Home', 'In transit', 'Between cities', 'TBC', '', 'Return', 'Departure', 'Flight'];

  appData.forEach(leg => {
    // Skip Trip Start / Trip Finish legs — they are transit legs, not city stays
    const label = String(leg.label || '').toLowerCase();
    const legId = String(leg.id || '');
    if (legId === 'departure' || legId === 'return' ||
        label.includes('(trip start)') || label.includes('(trip finish)') || label.includes('(trip end)') ||
        legId.endsWith('-start') || legId.endsWith('-finish')) {
      return;
    }

    leg.days.forEach((day, dayIndex) => {
      const city = day.to;

      // Skip placeholder/transit destinations
      if (!city || skipList.includes(city)) {
        return;
      }

      // Count a night for each day you're at a city, except the day you leave
      // Night count = number of days at destination where you don't leave

      // Check if next day is leaving this city (different destination or skip list item)
      const nextDay = leg.days[dayIndex + 1];
      const isLastDay = !nextDay || skipList.includes(nextDay.to) || nextDay.to !== city;

      if (!isLastDay) {
        // Next day is same city, so tonight is a night here
        if (!expectedStays[city]) {
          expectedStays[city] = 0;
        }
        expectedStays[city]++;
      }
    });
  });

  return expectedStays;
}

/**
 * Get total nights from existing stays array
 * Returns: {cityName: nightsCount}
 */
function calculateExistingStays() {
  const existingStays = {};

  if (!stays) return existingStays;

  stays.forEach(stay => {
    const city = citiesData.find(c => c.id === stay.cityId);
    const cityName = city ? city.name : 'Unknown City';

    if (!existingStays[cityName]) {
      existingStays[cityName] = 0;
    }
    // For multi-night stays, count all nights
    const nights = stay.nights || calculateNights(stay.checkIn, stay.checkOut);
    existingStays[cityName] = (existingStays[cityName] || 0) + nights;
  });

  return existingStays;
}

/**
 * Compare expected vs existing stays and return missing nights per city
 * Returns: {cityName: missingNights}
 */
function getMissingStays() {
  const expected = calculateExpectedStays();
  const existing = calculateExistingStays();
  const missing = {};
  let totalMissing = 0;

  const cleanKey = k => {
    let c = String(k || '').trim();
    c = c.replace(/^[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\s]+/gu, '').trim();
    c = c.replace(/\s*\(Trip Start\)/gi, '');
    c = c.replace(/\s*\(Trip End\)/gi, '');
    c = c.replace(/\s*\(Trip Finish\)/gi, '');
    c = c.replace(/\s*\(\d+\)/g, '');
    return c.trim().toLowerCase();
  };

  const existingMap = {};
  Object.entries(existing).forEach(([city, count]) => {
    const k = cleanKey(city);
    existingMap[k] = (existingMap[k] || 0) + count;
  });

  const expectedMap = {};
  Object.entries(expected).forEach(([city, count]) => {
    const k = cleanKey(city);
    if (!expectedMap[k]) expectedMap[k] = { name: city, count: 0 };
    expectedMap[k].count += count;
  });

  Object.values(expectedMap).forEach(({ name, count }) => {
    const existingNights = existingMap[cleanKey(name)] || 0;
    const missingNights = Math.max(0, count - existingNights);

    if (missingNights > 0) {
      missing[name] = missingNights;
      totalMissing += missingNights;
    }
  });

  return { missing, totalMissing };
}

/**
 * Should show the "Autopopulate Stays" button?
 * Returns true if there are missing nights
 */
function shouldShowAutopopulateButton() {
  const { totalMissing } = getMissingStays();
  return totalMissing > 0;
}

/**
 * Create a stay entry from itinerary data
 * @param {string} cityName - City name
 * @param {string} legId - Leg ID
 * @param {number} startIndex - Starting day index for this city
 * @param {number} nights - Number of nights to stay
 */
function createStayFromItinerary(cityName, legId, startDate, nights) {
  // Find the city data
  const city = citiesData.find(c => c.name === cityName);
  if (!city) return null;

  // Calculate check-out date
  const checkInDate = new Date(startDate);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + nights);

  // Create stay object
  const stayId = 'stay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  return {
    id: stayId,
    cityId: city.id,
    propertyName: '', // User will need to fill this in
    checkIn: typeof toLocalIsoDate === 'function' ? toLocalIsoDate(checkInDate) : checkInDate.toISOString().split('T')[0],
    checkOut: typeof toLocalIsoDate === 'function' ? toLocalIsoDate(checkOutDate) : checkOutDate.toISOString().split('T')[0],
    nights: nights,
    status: 'pending',
    totalCost: '0',
    notes: `Auto-generated from ${nights} nights in ${cityName}`
  };
}

/**
 * Autopopulate stays from itinerary data
 * @returns {number} - Number of stays created
 */
function autopopulateStays() {
  const missing = getMissingStays();
  let createdCount = 0;
  const createdStays = [];

  // Skip list for destinations that don't represent actual stays
  const skipList = ['Home', 'In transit', 'Between cities', 'TBC', '', 'Return', 'Departure', 'Flight'];

  appData.forEach((leg, legIndex) => {
    let currentCity = null;
    let segmentStartDate = null;
    let segmentNights = 0;

    leg.days.forEach((day, dayIndex) => {
      const city = day.to;

      // Skip placeholder destinations
      if (!city || skipList.includes(city)) {
        return;
      }

      if (city !== currentCity) {
        // City changed - save previous segment if exists
        if (segmentNights > 0 && currentCity && missing.missing[currentCity]) {
          const stay = createStayFromItinerary(currentCity, leg.id, segmentStartDate, segmentNights);
          if (stay) {
            createdStays.push(stay);
            createdCount++;
          }
        }

        // Start new segment
        currentCity = city;
        segmentStartDate = day.date;
        segmentNights = 1;
      } else {
        // Same city - add another night
        segmentNights++;
      }
    });

    // Handle end of leg
    if (segmentNights > 0 && currentCity && missing.missing[currentCity]) {
      const stay = createStayFromItinerary(currentCity, leg.id, segmentStartDate, segmentNights);
      if (stay) {
        createdStays.push(stay);
        createdCount++;
      }
    }
  });

  // Add created stays to the stays array
  if (createdStays.length > 0) {
    if (!window.stays) {
      window.stays = [];
    }

    createdStays.forEach(stay => {
      if (!stays.find(s => s.cityId === stay.cityId && s.checkIn === stay.checkIn)) {
        stays.push(stay);
      }
    });

    // Save the data
    saveData();

    // Show confirmation
    alert(`✅ Created ${createdCount} accommodation stay(s) from itinerary data!`);
  }

  return createdCount;
}

/**
 * Initialize autopopulate feature - add button if needed
 */
function initAutopopulateButton() {
  // This will be called from buildAccomTab to add the button
  if (shouldShowAutopopulateButton()) {
    const { missing, totalMissing } = getMissingStays();
    const cities = Object.entries(missing)
      .map(([city, nights]) => `${city} (${nights} nights)`)
      .join(', ');

    return `
      <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <strong class="text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-1">🏨 Missing Accommodation!</strong>
          <span class="text-indigo-600 dark:text-indigo-400 text-sm">Found ${totalMissing} nights without accommodation: ${cities}</span>
        </div>
        <button class="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium shadow-sm transition-colors" onclick="autopopulateStays()">✨ Autopopulate Missing Stays</button>
      </div>
    `;
  }

  return '';
}
