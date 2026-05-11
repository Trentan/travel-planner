// Auto-populate missing stays from itinerary
// Scans itinerary and creates accommodation entries for missing nights

/**
 * Calculate expected nights per city from itinerary
 * For each day in itinerary, counts nights by destination city
 * Returns: {cityName: nightsCount}
 */
function calculateExpectedStays() {
  const expectedStays = {};

  appData.forEach(leg => {
    leg.days.forEach((day, dayIndex) => {
      // Count nights by destination city (where they're staying)
      // For travel days, look at the 'to' location
      // For multi-day stays, count each day
      const city = day.to;

      // Skip "Home" entries
      if (city && city !== 'Home') {
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

  // Group days by city and leg
  const citySegments = {};

  appData.forEach((leg, legIndex) => {
    let currentCity = null;
    let segmentStartDate = null;
    let segmentNights = 0;

    leg.days.forEach((day, dayIndex) => {
      if (day.to !== currentCity && day.to !== 'Home') {
        // New city starts here - save previous segment if exists
        if (segmentNights > 0 && currentCity && missing.missing[currentCity]) {
          // Create stay for the previous segment
          const stay = createStayFromItinerary(currentCity, leg.id, segmentStartDate, segmentNights);
          if (stay) {
            createdStays.push(stay);
            createdCount++;
          }
        }

        // Start new segment
        currentCity = day.to;
        segmentStartDate = day.date;
        segmentNights = 1;
      } else if (day.to === currentCity) {
        // Continue current segment
        segmentNights++;
      }
      // Note: "Home" entries are ignored (don't break segments, just don't count)
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