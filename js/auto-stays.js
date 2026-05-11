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
  const skipList = ['Home', 'In transit', 'Between cities', 'TBC', ''];

  appData.forEach(leg => {
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

  Object.entries(expected).forEach(([city, expectedNights]) => {
    const existingNights = existing[city] || 0;
    const missingNights = Math.max(0, expectedNights - existingNights);

    if (missingNights > 0) {
      missing[city] = missingNights;
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
    checkIn: checkInDate.toISOString().split('T')[0],
    checkOut: checkOutDate.toISOString().split('T')[0],
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
  const skipList = ['Home', 'In transit', 'Between cities', 'TBC', ''];

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
      <div class="autopopulate-notice" style="background:#E8F5E9; border:1px solid #4CAF50; border-radius:4px; padding:12px; margin-bottom:16px;">
        <strong>🏨 Missing Accommodation!</strong><br>
        <span style="color:#2E7D32;">Found ${totalMissing} nights without accommodation: ${cities}</span>
        <button class="action-btn" style="background:#4CAF50; margin-left:12px;" onclick="autopopulateStays()">✨ Autopopulate Missing Stays</button>
      </div>
    `;
  }

  return '';
}