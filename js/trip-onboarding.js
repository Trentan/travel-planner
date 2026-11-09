/* ==========================================================================
   MODULE: Trip Onboarding Wizard (js/trip-onboarding.js)
   Responsibilities: Progressive onboarding wizard, path selection, flight intake preview
   ========================================================================== */

// Resilient bindings from window/data.js
var getAllCountries = (typeof window !== 'undefined' && window.getAllCountries) ? window.getAllCountries : (() => []);
var getCountryName = (typeof window !== 'undefined' && window.getCountryName) ? window.getCountryName : ((c) => c);
var getCountryFlag = (typeof window !== 'undefined' && window.getCountryFlag) ? window.getCountryFlag : (() => '🌐');
var saveData = (typeof window !== 'undefined' && window.saveData) ? window.saveData : (() => Promise.resolve());
var openTripFile = (typeof window !== 'undefined' && window.openTripFile) ? window.openTripFile : (() => {});
var getCitiesByNameMap = () => (typeof window !== 'undefined' && window.ALL_CITIES_BY_NAME_MAP) || (typeof global !== 'undefined' && global.ALL_CITIES_BY_NAME_MAP) || new Map();
var getAllCitiesByNameCountryMap = () => (typeof window !== 'undefined' && window.ALL_CITIES_BY_NAME_COUNTRY_MAP) || (typeof global !== 'undefined' && global.ALL_CITIES_BY_NAME_COUNTRY_MAP) || (typeof ALL_CITIES_BY_NAME_COUNTRY_MAP !== 'undefined' ? ALL_CITIES_BY_NAME_COUNTRY_MAP : new Map());
var getCityColors = () => (typeof window !== 'undefined' && window.CITY_COLORS) || (typeof global !== 'undefined' && global.CITY_COLORS) || ['#2C3E50', '#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#9B59B6'];
var syncCurrentFileName = (typeof window !== 'undefined' && window.syncCurrentFileName) || (typeof global !== 'undefined' && global.syncCurrentFileName) || (() => {});
var resetAppStateToDefaults = (typeof window !== 'undefined' && window.resetAppStateToDefaults) || (typeof global !== 'undefined' && global.resetAppStateToDefaults) || (() => {});
var createFileOnDisk = (typeof window !== 'undefined' && window.createFileOnDisk) || (typeof global !== 'undefined' && global.createFileOnDisk) || (() => Promise.resolve());
var findFuzzyCityCandidate = (typeof window !== 'undefined' && window.findFuzzyCityCandidate) || (typeof global !== 'undefined' && global.findFuzzyCityCandidate) || (() => null);
var hasActiveFileHandle = (typeof window !== 'undefined' && window.hasActiveFileHandle) || (typeof global !== 'undefined' && global.hasActiveFileHandle) || (() => false);
var isFSASupported = (typeof window !== 'undefined' && window.isFSASupported) || (typeof global !== 'undefined' && global.isFSASupported) || (() => false);
var exportJSON = (typeof window !== 'undefined' && window.exportJSON) || (typeof global !== 'undefined' && global.exportJSON) || (() => {});


// -- File Setup Onboarding UX --
let tripStartStep = 0;
let tripStartAnswers = {
  saveLocationType: 'disk',
  name: '', 
  origin: '', 
  originCountryCode: '',
  city: '', 
  cityCountryCode: '',
  date: '', 
  nights: 3, 
  transport: 'flight', 
  stops: [], 
  returnDate: '', 
  returnTransport: 'flight',
  party: 'couple',
  pacing: 'balanced',
  interests: ['food', 'culture'],
  bookedItems: [],
  notes: '',
  planningPath: 'cities',
  flightRawText: '',
  extractedBookings: []
};

function selectTripStartPath(path) {
  tripStartAnswers.planningPath = path;
  if (path === 'cities') {
    tripStartStep = 1;
    renderTripStart();
  } else if (path === 'flights') {
    tripStartStep = 'flight_import';
    renderTripStart();
  }
}

function selectTripStartParty(party) {
  captureTripStartAnswer();
  tripStartAnswers.party = party;
  saveVibeProfileToStorage();
  renderTripStart();
}

function selectTripStartPacing(pacing) {
  captureTripStartAnswer();
  tripStartAnswers.pacing = pacing;
  saveVibeProfileToStorage();
  renderTripStart();
}

function toggleTripStartInterest(interest) {
  captureTripStartAnswer();
  const idx = tripStartAnswers.interests.indexOf(interest);
  if (idx > -1) {
    tripStartAnswers.interests.splice(idx, 1);
  } else {
    tripStartAnswers.interests.push(interest);
  }
  saveVibeProfileToStorage();
  renderTripStart();
}

function saveVibeProfileToStorage() {
  try {
    localStorage.setItem('travelApp_vibeProfile', JSON.stringify({
      party: tripStartAnswers.party,
      pacing: tripStartAnswers.pacing,
      interests: tripStartAnswers.interests
    }));
  } catch (e) {
    console.error('Failed to save vibe profile:', e);
  }
}

function addTripStartBookedItem() {
  captureTripStartAnswer();
  const defaultCity = tripStartAnswers.city || tripStartAnswers.stops[0]?.city || '';
  tripStartAnswers.bookedItems.push({
    type: 'flight',
    city: defaultCity,
    ref: '',
    date: tripStartAnswers.date || ''
  });
  renderTripStart();
}

function removeTripStartBookedItem(index) {
  captureTripStartAnswer();
  tripStartAnswers.bookedItems.splice(index, 1);
  renderTripStart();
}

function updateTripStartBookedItem(index, field, value) {
  captureTripStartAnswer();
  if (tripStartAnswers.bookedItems[index]) {
    tripStartAnswers.bookedItems[index][field] = value;
  }
}

function escapeTripStartText(value) {
  return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function calculateTripStartReturnDate() {
  if (!tripStartAnswers.date) return '';
  const firstNights = Number(tripStartAnswers.nights || 1);
  const stopNights = (tripStartAnswers.stops || []).reduce((sum, s) => sum + Math.max(1, Number(s.nights) || 1), 0);
  const totalNights = firstNights + stopNights;
  const start = new Date(`${tripStartAnswers.date}T12:00:00`);
  if (isNaN(start.getTime())) return '';
  start.setDate(start.getDate() + totalNights);
  return start.toISOString().slice(0, 10);
}

function buildCountryOptionsHtml(selectedCode = '') {
  return '<option value="">(Select Country...)</option>' +
    getAllCountries()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => `<option value="${c.code}" ${c.code === (selectedCode || '').toUpperCase() ? 'selected' : ''}>${c.flag} ${c.name}</option>`)
      .join('');
}

function handleTripStartCityTyping(inputEl, countrySelectId, targetField, targetCountryField) {
  const typedName = inputEl.value.trim();
  tripStartAnswers[targetField] = typedName;
  if (!typedName) return;

  const dbMatches = getCitiesByNameMap().get(typedName.toLowerCase()) || [];
  if (dbMatches.length === 1 && dbMatches[0].countryCode) {
    const matchedCode = dbMatches[0].countryCode;
    tripStartAnswers[targetCountryField] = matchedCode;
    const countrySelect = document.getElementById(countrySelectId);
    if (countrySelect) countrySelect.value = matchedCode;
  }
}

function handleTripStartStopCityTyping(index, inputEl, countrySelectId) {
  const typedName = inputEl.value.trim();
  if (tripStartAnswers.stops[index]) {
    tripStartAnswers.stops[index].city = typedName;
    if (typedName) {
      const dbMatches = getCitiesByNameMap().get(typedName.toLowerCase()) || [];
      if (dbMatches.length === 1 && dbMatches[0].countryCode) {
        const matchedCode = dbMatches[0].countryCode;
        tripStartAnswers.stops[index].countryCode = matchedCode;
        const countrySelect = document.getElementById(countrySelectId);
        if (countrySelect) countrySelect.value = matchedCode;
      }
    }
  }
}

function renderTripStartPathChoice() {
  const container = document.getElementById('trip-start-content');
  if (!container) return;
  document.querySelector?.('.trip-start-panel')?.classList?.add('trip-start-panel--wide');

  const back = `<button class="trip-start-back" type="button" onclick="previousTripStartStep()">Back</button>`;

  container.innerHTML = `
    <div id="trip-start-path-selection" class="trip-builder-step-0" data-step="0" data-testid="trip-builder-step-0">
      <div class="trip-start-progress">
        <span>Trip Builder</span>
        <span>Choose Path</span>
      </div>
      <div class="trip-start-question">
        <div class="trip-start-eyebrow">CHOOSE YOUR PLANNING PATH</div>
        <h2 id="trip-start-title" style="margin-top: 0.35rem;">How would you like to build your trip?</h2>
        <p class="trip-start-intro" style="margin-bottom: 1.5rem;">
          Whether starting from scratch with flexible ideas or anchoring your route around confirmed flight bookings, Trenscends structures your itinerary effortlessly.
        </p>

        <div class="trip-path-grid">
          <!-- Path A: City & Dates Explorer -->
          <div class="trip-path-card" onclick="selectTripStartPath('cities')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')selectTripStartPath('cities')">
            <div class="trip-path-header">
              <span class="trip-path-icon">🗺️</span>
              <span class="trip-path-badge trip-path-badge--explorer">Path A · Explorer</span>
            </div>
            <h3 class="trip-path-title">City & Dates Only</h3>
            <p class="trip-path-desc">
              Start with destinations, durations, and travel style. We’ll generate starter activities, pacing, and food recommendations.
            </p>
            <ul class="trip-path-features">
              <li>✓ Flexible destinations & night counts</li>
              <li>✓ Curated starter sights & dining ideas</li>
              <li>✓ Customized travel pacing & party size</li>
            </ul>
            <button type="button" class="trip-path-btn trip-path-btn--primary" onclick="event.stopPropagation(); selectTripStartPath('cities')">
              City & Dates Only <span aria-hidden="true">→</span>
            </button>
          </div>

          <!-- Path B: Booked Flights First -->
          <div class="trip-path-card trip-path-card--flight" onclick="selectTripStartPath('flights')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')selectTripStartPath('flights')">
            <div class="trip-path-header">
              <span class="trip-path-icon">✈️</span>
              <span class="trip-path-badge trip-path-badge--flight">Path B · Transport First</span>
            </div>
            <h3 class="trip-path-title">Import Existing Flights</h3>
            <p class="trip-path-desc">
              Already booked? Paste your flight or transit confirmations upfront to auto-extract junctions, dates, and destination stops.
            </p>
            <ul class="trip-path-features">
              <li>✓ Auto-extracts flight numbers & PNR codes</li>
              <li>✓ Automatically computes stay nights</li>
              <li>✓ Anchors itinerary skeleton around flights</li>
            </ul>
            <button type="button" class="trip-path-btn trip-path-btn--flight" onclick="event.stopPropagation(); selectTripStartPath('flights')">
              Import Existing Flights <span aria-hidden="true">→</span>
            </button>
          </div>

          <!-- Path C: Instant Blank Canvas -->
          <div class="trip-path-card trip-path-card--blank" onclick="startBlankTrip()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')startBlankTrip()">
            <div class="trip-path-header">
              <span class="trip-path-icon">⚡</span>
              <span class="trip-path-badge trip-path-badge--blank">Instant Canvas</span>
            </div>
            <h3 class="trip-path-title">Start Blank Trip</h3>
            <p class="trip-path-desc">
              Skip the questions. Start immediately with a clean blank itinerary and add your cities, stays, and activities directly.
            </p>
            <ul class="trip-path-features">
              <li>✓ Zero wizard steps required</li>
              <li>✓ Instant editable timeline</li>
              <li>✓ Auto-saves to your local device</li>
            </ul>
            <button type="button" class="trip-path-btn trip-path-btn--blank" onclick="event.stopPropagation(); startBlankTrip()">
              Start Blank Trip <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      <div class="trip-start-actions" style="margin-top: 1.5rem;">
        ${back}
        <button class="trip-start-quiet" type="button" onclick="dismissTripStart()" style="margin: 0; width: auto;">Cancel</button>
      </div>
    </div>
  `;
}

function insertSampleFlightConfirmation() {
  const sampleText = `Qantas Booking Reference: QF92B1
Flight QF1 from Sydney to London
Departure: 2026-06-01 14:00
Arrival: 2026-06-02 06:30

British Airways Booking Reference: BA44A2
Flight BA304 from London to Paris
Departure: 2026-06-06 09:15
Arrival: 2026-06-06 11:30

Air France Booking Reference: AF188X
Flight AF218 from Paris to Sydney
Departure: 2026-06-15 18:30
Arrival: 2026-06-16 20:45`;

  tripStartAnswers.flightRawText = sampleText;
  const textarea = document.getElementById('tripStartFlightRaw');
  if (textarea) textarea.value = sampleText;
  extractTripStartFlights();
}

function extractTripStartFlights() {
  const textEl = document.getElementById('tripStartFlightRaw');
  const text = (textEl ? textEl.value : tripStartAnswers.flightRawText) || '';
  if (!text.trim()) {
    showToast('Paste flight confirmation text to extract details.');
    return;
  }
  tripStartAnswers.flightRawText = text;
  
  const parseFn = typeof parseBookingConfirmationText === 'function'
    ? parseBookingConfirmationText
    : (typeof window !== 'undefined' && typeof window.parseBookingConfirmationText === 'function'
      ? window.parseBookingConfirmationText
      : null);

  if (!parseFn) {
    showToast('Booking parser is not available.');
    return;
  }

  const items = parseFn(text, 'Imported Flight Confirmation');
  tripStartAnswers.extractedBookings = items;
  
  const journeysCount = items.filter(i => i.kind === 'journey').length;
  if (journeysCount > 0) {
    showToast(`✓ Extracted ${journeysCount} flight/transit leg${journeysCount === 1 ? '' : 's'}!`);
  } else {
    showToast('No flight or transit details detected. Check your text and try again.');
  }
  renderTripStart();
}

async function handleTripStartFlightFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    tripStartAnswers.flightRawText = [tripStartAnswers.flightRawText, text].filter(Boolean).join('\n\n');
    const textarea = document.getElementById('tripStartFlightRaw');
    if (textarea) textarea.value = tripStartAnswers.flightRawText;
    extractTripStartFlights();
  } catch (err) {
    showToast('Could not read file. Please paste text directly.');
  }
}

function renderTripStartFlightImport() {
  const container = document.getElementById('trip-start-content');
  if (!container) return;

  const back = `<button class="trip-start-back" type="button" onclick="previousTripStartStep()">Back</button>`;
  const extracted = tripStartAnswers.extractedBookings || [];
  const journeyItems = extracted.filter(i => i.kind === 'journey');
  const stayItems = extracted.filter(i => i.kind === 'stay');

  const previewCardsHtml = extracted.length ? `
    <div class="trip-flight-preview-container">
      <div class="trip-flight-preview-header">
        <strong>Extracted Bookings (${extracted.length})</strong>
        <span class="trip-flight-count-badge">${journeyItems.length} Transport Leg${journeyItems.length === 1 ? '' : 's'}${stayItems.length ? `, ${stayItems.length} Stay${stayItems.length === 1 ? '' : 's'}` : ''}</span>
      </div>
      <div class="trip-flight-preview-list">
        ${extracted.map((item, idx) => {
          const isJourney = item.kind === 'journey';
          const icon = isJourney ? (item.transportType === 'train' ? '🚆' : '✈️') : (item.kind === 'stay' ? '🏨' : '🎟️');
          const title = isJourney ? `${item.fromLocation || 'Origin'} → ${item.toLocation || 'Destination'}` : (item.propertyName || item.title);
          const metaParts = [];
          if (isJourney) {
            if (item.departureDate) metaParts.push(`Depart: ${item.departureDate}${item.departureTime ? ' ' + item.departureTime : ''}`);
            if (item.arrivalDate && item.arrivalDate !== item.departureDate) metaParts.push(`Arrive: ${item.arrivalDate}${item.arrivalTime ? ' ' + item.arrivalTime : ''}`);
            if (item.routeCode) metaParts.push(`Flight/Code: ${item.routeCode}`);
            if (item.bookingReference) metaParts.push(`PNR: ${item.bookingReference}`);
          } else if (item.kind === 'stay') {
            if (item.checkIn) metaParts.push(`Check-in: ${item.checkIn}`);
            if (item.checkOut) metaParts.push(`Check-out: ${item.checkOut}`);
            if (item.city) metaParts.push(`City: ${item.city}`);
          }
          return `
            <div class="trip-flight-preview-item">
              <span class="trip-flight-preview-icon">${icon}</span>
              <div class="trip-flight-preview-details">
                <div class="trip-flight-preview-title">${escapeTripStartText(title)}</div>
                <div class="trip-flight-preview-meta">${escapeTripStartText(metaParts.join(' · '))}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  const partyOptions = [
    ['solo', '👤 Solo'],
    ['couple', '👥 Couple'],
    ['family', '👨‍👩‍👧 Family'],
    ['friends', '🍻 Friends']
  ];
  const partyBtns = partyOptions.map(([val, label]) => `
    <button type="button" class="trip-start-chip ${tripStartAnswers.party === val ? 'is-selected' : ''}" onclick="selectTripStartParty('${val}')">${label}</button>
  `).join('');

  const interestOptions = [
    ['food', '🍽️ Food & Dining'],
    ['culture', '🏛️ History & Culture'],
    ['nature', '🌲 Nature & Outdoors'],
    ['relaxation', '🏖️ Relaxation']
  ];
  const interestChips = interestOptions.map(([val, label]) => `
    <button type="button" class="trip-start-chip ${tripStartAnswers.interests.includes(val) ? 'is-selected' : ''}" onclick="toggleTripStartInterest('${val}')">${label}</button>
  `).join('');

  container.innerHTML = `
    <div class="trip-start-progress">
      <span>Path B · Flights First</span>
      <span>Step 1 of 1</span>
    </div>
    <div class="trip-start-question">
      <div class="trip-start-eyebrow">UPFRONT FLIGHT & TRANSIT INTAKE</div>
      <h2 id="trip-start-title">Import your booked flights & transit</h2>
      <p class="trip-start-intro">
        Paste your flight tickets, booking confirmations, or e-tickets below. We'll automatically extract junctions, dates, and destination cities.
      </p>

      <label for="tripStartFlightName">Trip Name (Optional)</label>
      <input id="tripStartFlightName" class="trip-start-input" maxlength="80" autocomplete="off" placeholder="e.g. Europe & Asia Explorer (or auto-generated)" value="${escapeTripStartText(tripStartAnswers.name)}" oninput="tripStartAnswers.name=this.value.trim()">

      <label for="tripStartFlightOrigin" style="margin-top: 1rem;">Starting Home City (Optional)</label>
      <input id="tripStartFlightOrigin" class="trip-start-input" maxlength="80" autocomplete="off" placeholder="e.g. Sydney or Brisbane (defaults to first departure)" value="${escapeTripStartText(tripStartAnswers.origin)}" oninput="tripStartAnswers.origin=this.value.trim()">

      <label for="tripStartFlightRaw" style="margin-top: 1rem;">Paste Flight or Transit Confirmation Text</label>
      <textarea id="tripStartFlightRaw" class="trip-start-input trip-start-textarea" rows="6" placeholder="Paste booking confirmation email, e-ticket, or flight itinerary text here...&#10;&#10;Example:&#10;Flight QF1 from Sydney to London&#10;Departure: 2026-06-01 14:00&#10;Arrival: 2026-06-02 06:30&#10;Booking reference: ABC123&#10;&#10;Flight BA304 from London to Paris&#10;Departure: 2026-06-06 09:15&#10;Arrival: 2026-06-06 11:30&#10;Booking reference: DEF456" oninput="tripStartAnswers.flightRawText=this.value">${escapeTripStartText(tripStartAnswers.flightRawText || '')}</textarea>

      <div class="trip-flight-quick-bar">
        <button type="button" class="trip-flight-quick-btn" onclick="insertSampleFlightConfirmation()">📋 Paste sample multi-city flights</button>
        <button type="button" class="trip-flight-quick-btn" onclick="document.getElementById('tripStartFlightFileInput').click()">📂 Load text file</button>
        <input type="file" id="tripStartFlightFileInput" accept=".txt,.json,.eml" style="display:none;" onchange="handleTripStartFlightFileUpload(event)">
      </div>

      <div style="margin-top: 1rem;">
        <button type="button" class="trip-flight-extract-btn" onclick="extractTripStartFlights()">✦ Extract Flights & Preview Itinerary</button>
      </div>

      ${previewCardsHtml}

      <label style="margin-top: 1.25rem;">Who is traveling?</label>
      <div class="trip-start-chip-group">${partyBtns}</div>

      <label style="margin-top: 1.25rem;">Travel interests for starter activities</label>
      <div class="trip-start-chip-group">${interestChips}</div>
    </div>

    <div class="trip-start-actions">
      ${back}
      <button class="trip-start-primary" type="button" onclick="createTripFromFlightBookings()">
        Create my trip from bookings <span aria-hidden="true">→</span>
      </button>
    </div>
    <button class="trip-start-quiet" type="button" onclick="dismissTripStart()">Finish this later</button>
  `;
}

async function createTripFromFlightBookings() {
  const nameEl = document.getElementById('tripStartFlightName');
  if (nameEl) tripStartAnswers.name = nameEl.value.trim();
  const originEl = document.getElementById('tripStartFlightOrigin');
  if (originEl) tripStartAnswers.origin = originEl.value.trim();

  const textEl = document.getElementById('tripStartFlightRaw');
  const text = (textEl ? textEl.value : tripStartAnswers.flightRawText) || '';
  tripStartAnswers.flightRawText = text;

  let items = tripStartAnswers.extractedBookings || [];
  if (!items.length && text.trim()) {
    const parseFn = typeof parseBookingConfirmationText === 'function' ? parseBookingConfirmationText : (typeof window !== 'undefined' ? window.parseBookingConfirmationText : null);
    if (parseFn) {
      items = parseFn(text, 'Imported Flight Confirmation');
      tripStartAnswers.extractedBookings = items;
    }
  }

  const journeyItems = items.filter(i => i.kind === 'journey' && (i.fromLocation || i.toLocation));
  if (!journeyItems.length) {
    showToast('Please paste valid flight confirmation text and extract flights first.');
    return;
  }

  // Sort journeys chronologically by departureDate and departureTime
  journeyItems.sort((a, b) => {
    const dateA = a.departureDate || '';
    const dateB = b.departureDate || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.departureTime || '').localeCompare(b.departureTime || '');
  });

  const originName = tripStartAnswers.origin || journeyItems[0].fromLocation || 'Home';
  
  // Find destination sequence:
  // If the last flight heads back to originName, treat that as return travel
  const hasReturnToOrigin = journeyItems.length > 1 &&
    journeyItems[journeyItems.length - 1].toLocation.toLowerCase() === originName.toLowerCase();

  const activeJourneys = hasReturnToOrigin ? journeyItems.slice(0, journeyItems.length - 1) : journeyItems;
  const returnJourney = hasReturnToOrigin ? journeyItems[journeyItems.length - 1] : null;

  // Build destination stops
  const destinationStops = [];
  for (let i = 0; i < activeJourneys.length; i++) {
    const j = activeJourneys[i];
    const destCity = j.toLocation;
    const arrDate = j.arrivalDate || j.departureDate;
    
    // Departure from this city is the departure date of the next journey
    let depDate = '';
    if (i < activeJourneys.length - 1) {
      depDate = activeJourneys[i + 1].departureDate;
    } else if (returnJourney) {
      depDate = returnJourney.departureDate;
    }

    let nights = 3;
    if (arrDate && depDate) {
      const d1 = new Date(`${arrDate}T12:00:00`);
      const d2 = new Date(`${depDate}T12:00:00`);
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      nights = Math.max(1, Math.min(60, diffDays));
    }

    destinationStops.push({
      city: destCity,
      dateFrom: arrDate,
      dateTo: depDate || arrDate,
      nights,
      transport: j.transportType || 'flight',
      incomingJourney: j
    });
  }

  citiesData = destinationStops.map((stop, index) => {
    const cityNameLower = stop.city.toLowerCase();
    const nameMatches = getCitiesByNameMap().get(cityNameLower);
    const dbMatch = (nameMatches && nameMatches.length > 0 ? nameMatches[0] : null) || (typeof findFuzzyCityCandidate === 'function' ? findFuzzyCityCandidate(cityNameLower)?.candidate : null) || null;
    const countryCode = dbMatch?.countryCode || 'ZZ';
    const cityId = `city-${Date.now()}-${index}`;
    const city = {
      id: cityId,
      name: dbMatch ? dbMatch.name : stop.city,
      code: dbMatch?.code || '',
      icaoCode: dbMatch?.icaoCode || dbMatch?.icao || '',
      countryCode,
      country: typeof getCountryName === 'function' ? getCountryName(countryCode) : (dbMatch?.country || ''),
      dateFrom: stop.dateFrom,
      dateTo: stop.dateTo,
      colour: getCityColors()[index % getCityColors().length]
    };
    if (dbMatch && dbMatch.lat !== undefined && dbMatch.lng !== undefined) {
      city.lat = dbMatch.lat;
      city.lng = dbMatch.lng;
    }
    return city;
  });

  // Build starter activities helper
  const starterContent = (cityId, cityName) => {
    const foodItems = [
      { text: `Find a local breakfast spot in ${cityName}`, done: false, cityId }
    ];
    if (tripStartAnswers.interests.includes('food')) {
      foodItems.push({ text: `Sample iconic local specialty & street food in ${cityName}`, done: false, cityId });
      foodItems.push({ text: `Explore ${cityName} central food market or night dining alley`, done: false, cityId });
    }
    const tips = [
      { text: `Save your ${cityName} accommodation address & offline map access.`, cityId },
      { text: `Check transit pass options and local currency requirements in ${cityName}.`, cityId }
    ];
    const activities = [
      { id: `activity-${cityId}-walk`, title: `Explore ${cityName} historic center & neighborhood streets`, category: 'sight', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId }
    ];
    if (tripStartAnswers.interests.includes('culture')) {
      activities.push({ id: `activity-${cityId}-culture`, title: `Visit top landmark museum / historic site in ${cityName}`, category: 'sight', estTime: '3 hrs', estCost: 'TBC', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId });
    }
    if (tripStartAnswers.interests.includes('nature')) {
      activities.push({ id: `activity-${cityId}-nature`, title: `Stroll through ${cityName} central park or scenic viewpoint`, category: 'fitness', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId });
    }
    return { cityFood: foodItems, legTips: tips, suggestedActivities: activities };
  };

  // Build appData legs
  appData = [];
  const firstDepDate = journeyItems[0].departureDate || '';
  appData.push({
    id: `leg-start-${Date.now()}`,
    label: `🏠 Start (${originName})`,
    cityId: 'city-home',
    colour: '#2C3E50',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [{
      id: `day-start-${Date.now()}`,
      date: firstDepDate,
      day: 'Travel Day',
      from: originName,
      to: citiesData[0]?.name || '',
      completed: false,
      desc: `Depart from ${originName}`,
      transportItems: [], accomItems: [], activityItems: []
    }]
  });

  const destinationLegs = destinationStops.map((stop, index) => {
    const city = citiesData[index];
    const content = starterContent(city.id, city.name);
    const startDateObj = new Date(`${stop.dateFrom}T12:00:00`);
    const hasValidStart = !isNaN(startDateObj.getTime());
    
    const days = Array.from({ length: stop.nights }, (_, dayIdx) => {
      const dayDate = hasValidStart
        ? new Date(startDateObj.getTime() + dayIdx * 86400000).toISOString().slice(0, 10)
        : '';
      return {
        id: `day-${Date.now()}-${index}-${dayIdx}`,
        date: dayDate,
        day: `Day ${dayIdx + 1}`,
        from: city.name,
        to: city.name,
        completed: false,
        desc: '',
        transportItems: [], accomItems: [], activityItems: []
      };
    });
    return {
      id: `leg-${Date.now()}-${index}`,
      label: city.name,
      cityId: city.id,
      colour: city.colour,
      ...content,
      days
    };
  });
  appData.push(...destinationLegs);

  if (returnJourney) {
    const retDepDate = returnJourney.departureDate || '';
    const lastCityName = citiesData[citiesData.length - 1]?.name || '';
    appData.push({
      id: `leg-return-${Date.now()}`,
      label: `🏡 Return (${originName})`,
      cityId: 'city-home',
      colour: '#2C3E50',
      cityFood: [],
      suggestedActivities: [],
      legTips: [],
      days: [{
        id: `day-return-${Date.now()}`,
        date: retDepDate,
        day: 'Return Travel',
        from: lastCityName,
        to: originName,
        completed: false,
        desc: `Return flight to ${originName}`,
        transportItems: [], accomItems: [], activityItems: []
      }]
    });
  }

  // Populate journeys
  journeys = journeyItems.map((j, idx) => {
    let targetLegId = '';
    if (idx < destinationLegs.length) {
      targetLegId = destinationLegs[idx].id;
    } else if (returnJourney && idx === journeyItems.length - 1) {
      targetLegId = appData[appData.length - 1].id;
    } else {
      targetLegId = destinationLegs[destinationLegs.length - 1]?.id || '';
    }

    const fromCityMatch = citiesData.find(c => c.name.toLowerCase() === (j.fromLocation || '').toLowerCase());
    const toCityMatch = citiesData.find(c => c.name.toLowerCase() === (j.toLocation || '').toLowerCase());

    return {
      id: `journey-${Date.now()}-${idx}`,
      journeyId: `journey-${Date.now()}-${idx}`,
      journeyName: `${j.fromLocation || 'Origin'} to ${j.toLocation || 'Destination'}`,
      legId: targetLegId,
      dayDate: j.departureDate || '',
      fromLocation: j.fromLocation || '',
      toLocation: j.toLocation || '',
      fromCityId: fromCityMatch?.id || (idx === 0 ? 'city-home' : ''),
      toCityId: toCityMatch?.id || (returnJourney && idx === journeyItems.length - 1 ? 'city-home' : ''),
      departureDate: j.departureDate || '',
      departureTime: j.departureTime || '',
      arrivalDate: j.arrivalDate || j.departureDate || '',
      arrivalTime: j.arrivalTime || '',
      transportType: j.transportType || 'flight',
      provider: j.provider || 'Airline',
      routeCode: j.routeCode || '',
      status: 'confirmed',
      cost: j.cost || '0',
      bookingReference: j.bookingReference || '',
      isMultiLeg: false,
      segmentOrder: idx + 1,
      notes: j.notes || 'Imported booking confirmation',
      fromAddress: '',
      toAddress: '',
      legs: [],
      attachments: []
    };
  });
  window.journeys = journeys;

  // Populate stays
  stays = destinationStops.map((stop, idx) => {
    const city = citiesData[idx];
    return {
      id: `stay-${Date.now()}-${idx}`,
      cityId: city.id,
      cityName: city.name,
      propertyName: `Accommodation in ${city.name}`,
      checkIn: stop.dateFrom,
      checkOut: stop.dateTo,
      checkInTime: '14:00',
      checkOutTime: '10:00',
      nights: stop.nights,
      status: 'confirmed',
      provider: 'TBD',
      bookingRef: '',
      totalCost: 0,
      notes: 'Reserved for flight dates',
      location: '',
      lat: '',
      lng: '',
      placeId: '',
      attachments: []
    };
  });

  // Include any extra hotel stays extracted from confirmation
  const extractedStays = items.filter(i => i.kind === 'stay');
  extractedStays.forEach((es, esIdx) => {
    const cityMatch = citiesData.find(c => (es.city || '').toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes((es.city || '').toLowerCase()));
    if (cityMatch) {
      stays.push({
        id: `stay-extracted-${Date.now()}-${esIdx}`,
        cityId: cityMatch.id,
        cityName: cityMatch.name,
        propertyName: es.propertyName || `Hotel in ${cityMatch.name}`,
        checkIn: es.checkIn || cityMatch.dateFrom,
        checkOut: es.checkOut || cityMatch.dateTo,
        checkInTime: '14:00',
        checkOutTime: '10:00',
        nights: typeof calculateNights === 'function' ? calculateNights(es.checkIn, es.checkOut) : 3,
        status: 'confirmed',
        provider: es.provider || 'Hotel',
        bookingRef: es.bookingRef || '',
        totalCost: es.totalCost || 0,
        notes: es.notes || '',
        location: '',
        lat: '',
        lng: '',
        placeId: '',
        attachments: []
      });
    }
  });
  window.stays = stays;
  window.citiesData = citiesData;
  window.appData = appData;

  // Title and subtitle
  const totalNights = destinationStops.reduce((sum, s) => sum + s.nights, 0);
  const titleText = tripStartAnswers.name || `${citiesData.map(c => c.name).join(' & ')} Journey`;
  const subtitleText = `${citiesData.map(c => c.name).join(' → ')} · ${totalNights} nights · ${journeyItems.length} confirmed flights`;
  titleData = { title: titleText, subtitle: subtitleText };

  localStorage.setItem('travelApp_vibeProfile', JSON.stringify(tripStartAnswers));
  const mainTitleEl = document.getElementById('mainTitle');
  const mainSubtitleEl = document.getElementById('mainSubtitle');
  if (mainTitleEl) mainTitleEl.innerText = titleData.title;
  if (mainSubtitleEl) mainSubtitleEl.innerText = titleData.subtitle;

  syncCurrentFileName(`${titleText.replace(/[^a-z0-9]+/gi, '_') || 'My_Trip'}.json`);
  dismissTripStart();
  saveData(true);

  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildTransportTab === 'function') buildTransportTab();
  if (typeof buildAccomTab === 'function') buildAccomTab();

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem("travelApp_file_setup_seen", "true");
  }
  await saveData(true);

  showToast(`✈️ Trip created! ${journeyItems.length} confirmed flights and ${citiesData.length} destinations scheduled.`);
}

function renderTripStart() {
  const container = document.getElementById('trip-start-content');
  if (!container) return;

  if (typeof window !== 'undefined' && !window.__tripStartViewportBound) {
    window.__tripStartViewportBound = true;
    const syncWizardViewport = () => {
      const panel = document.querySelector('.trip-start-panel');
      if (!panel) return;
      const vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      if (vvHeight && vvHeight < window.innerHeight - 60) {
        panel.style.maxHeight = `${Math.max(240, vvHeight - 24)}px`;
        if (document.activeElement && panel.contains(document.activeElement) && typeof document.activeElement.scrollIntoView === 'function') {
          document.activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else {
        panel.style.maxHeight = '';
      }
    };
    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
      window.visualViewport.addEventListener('resize', syncWizardViewport);
    }
    document.addEventListener('focusin', (e) => {
      const panel = document.querySelector('.trip-start-panel');
      if (panel && panel.contains(e.target)) {
        setTimeout(syncWizardViewport, 120);
      }
    });
  }

  if (tripStartStep === 'choose_path' || tripStartStep === 'builder_0') {
    renderTripStartPathChoice();
    return;
  }

  document.querySelector?.('.trip-start-panel')?.classList?.remove('trip-start-panel--wide');

  if (tripStartStep === 'flight_import') {
    renderTripStartFlightImport();
    return;
  }

  const progress = `<div class="trip-start-progress"><span>Getting started</span><span>${tripStartStep} of 7</span></div>`;
  const back = tripStartStep ? `<button class="trip-start-back" type="button" onclick="previousTripStartStep()">Back</button>` : '';

  if (tripStartStep === 0) {
    container.innerHTML = `
      <div class="trip-start-eyebrow">TRENSCENDS TRAVEL PLANNER</div>
      <h2 id="trip-start-title">Welcome to Trenscends Travel Planner</h2>
      <p class="trip-start-intro">Build a real trip in a minute, explore the example already loaded, load a pre-existing Trenscends trip, or sign in to sync with Google Drive.</p>
      <div class="trip-start-choices">
        <button class="trip-start-choice trip-start-choice--google" type="button" onclick="chooseTripStart('google_signin')">
          <span class="trip-start-choice-icon"><svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg></span>
          <span><strong>Sign in with Google</strong><small>Automatically restore & sync your cloud itineraries from Google Drive.</small></span>
          <b>→</b>
        </button>
        <button class="trip-start-choice trip-start-choice--primary" type="button" onclick="chooseTripStart('build')">
          <span class="trip-start-choice-icon">✦</span>
          <span><strong>Build my trip</strong><small>Answer a few simple questions. You can edit everything later.</small></span>
          <b>→</b>
        </button>
        <button class="trip-start-choice" type="button" onclick="chooseTripStart('load_existing')">
          <span class="trip-start-choice-icon">📂</span>
          <span><strong>Load a pre-existing Trenscends trip</strong><small>Open an existing .json trip file from your drive or device.</small></span>
          <b>→</b>
        </button>
        <button class="trip-start-choice" type="button" onclick="chooseTripStart('sample')">
          <span class="trip-start-choice-icon">🌍</span>
          <span><strong>Explore the sample trip</strong><small>See a complete itinerary first, with no data overwritten.</small></span>
          <b>→</b>
        </button>
        <button class="trip-start-choice" type="button" onclick="chooseTripStart('learn')">
          <span class="trip-start-choice-icon">?</span>
          <span><strong>Learn the essentials</strong><small>Open the guide and take the app at your own pace.</small></span>
          <b>→</b>
        </button>
      </div>
      <button class="trip-start-quiet" type="button" onclick="dismissTripStart()">I’ll explore on my own</button>`;
    return;
  }
  
  const stopRows = tripStartAnswers.stops.map((stop, index) => `
    <div class="trip-start-stop-row trip-start-stop-grid">
      <input class="trip-start-input" aria-label="Additional city ${index + 1}" maxlength="80" placeholder="City" value="${escapeTripStartText(stop.city)}" oninput="handleTripStartStopCityTyping(${index}, this, 'tripStartStopCountry_${index}')">
      <select id="tripStartStopCountry_${index}" class="trip-start-input" aria-label="Country for additional city ${index + 1}" style="padding: 0.4rem; font-size: 0.85rem;" onchange="updateTripStartStop(${index}, 'countryCode', this.value)">${buildCountryOptionsHtml(stop.countryCode || '')}</select>
      <input class="trip-start-stop-nights" aria-label="Nights in additional city ${index + 1}" type="number" min="1" max="60" value="${stop.nights}" oninput="updateTripStartStop(${index}, 'nights', this.value)">
      <select aria-label="Transport to additional city ${index + 1}" onchange="updateTripStartStop(${index}, 'transport', this.value)">${[['train','Train'],['flight','Flight'],['bus','Bus'],['ferry','Ferry'],['other','Other']].map(([value, label]) => `<option value="${value}" ${stop.transport === value ? 'selected' : ''}>${label}</option>`).join('')}</select>
      <button type="button" aria-label="Remove additional city ${index + 1}" onclick="removeTripStartStop(${index})">×</button>
    </div>`).join('');

  const partyOptions = [
    ['solo', '👤 Solo'],
    ['couple', '👥 Couple'],
    ['family', '👨‍👩‍👧 Family'],
    ['friends', '🍻 Friends'],
    ['business', '💼 Business']
  ];

  const pacingOptions = [
    ['relaxed', '☕ Relaxed'],
    ['balanced', '⚖️ Balanced'],
    ['packed', '⚡ Packed']
  ];

  const interestOptions = [
    ['food', '🍽️ Food & Dining'],
    ['culture', '🏛️ History & Culture'],
    ['nature', '🌲 Nature & Outdoors'],
    ['shopping', '🛍️ Shopping & Markets'],
    ['relaxation', '🏖️ Relaxation & Beaches']
  ];

  const partyBtns = partyOptions.map(([val, label]) => `
    <button type="button" class="trip-start-chip ${tripStartAnswers.party === val ? 'is-selected' : ''}" onclick="selectTripStartParty('${val}')">${label}</button>
  `).join('');

  const pacingBtns = pacingOptions.map(([val, label]) => `
    <button type="button" class="trip-start-chip ${tripStartAnswers.pacing === val ? 'is-selected' : ''}" onclick="selectTripStartPacing('${val}')">${label}</button>
  `).join('');

  const interestChips = interestOptions.map(([val, label]) => `
    <button type="button" class="trip-start-chip ${tripStartAnswers.interests.includes(val) ? 'is-selected' : ''}" onclick="toggleTripStartInterest('${val}')">${label}</button>
  `).join('');

  const calculatedReturn = calculateTripStartReturnDate();
  if (calculatedReturn) {
    tripStartAnswers.returnDate = calculatedReturn;
  }

  const allCityOptions = [tripStartAnswers.origin, tripStartAnswers.city].concat(tripStartAnswers.stops.map(s => s.city)).filter(c => c.trim());

  const bookedRows = tripStartAnswers.bookedItems.map((item, index) => `
    <div class="trip-start-stop-row" style="margin-bottom: 0.5rem;">
      <select aria-label="Booked item type ${index + 1}" onchange="updateTripStartBookedItem(${index}, 'type', this.value)">
        <option value="flight" ${item.type === 'flight' ? 'selected' : ''}>✈️ Flight</option>
        <option value="train" ${item.type === 'train' ? 'selected' : ''}>🚆 Train/Transport</option>
        <option value="stay" ${item.type === 'stay' ? 'selected' : ''}>🏨 Accommodation</option>
      </select>
      <select aria-label="Booked item city ${index + 1}" onchange="updateTripStartBookedItem(${index}, 'city', this.value)">
        <option value="">Pair with city...</option>
        ${allCityOptions.map(c => `<option value="${escapeTripStartText(c)}" ${item.city === c ? 'selected' : ''}>${escapeTripStartText(c)}</option>`).join('')}
      </select>
      <input class="trip-start-input" aria-label="Reference or notes ${index + 1}" placeholder="Ref / Name (e.g. QF1 or Grand Hotel)" value="${escapeTripStartText(item.ref)}" oninput="updateTripStartBookedItem(${index}, 'ref', this.value)">
      <button type="button" aria-label="Remove booked item ${index + 1}" onclick="removeTripStartBookedItem(${index})">×</button>
    </div>
  `).join('');

  const steps = [
    `<label for="tripStartName">What should we call this trip?</label><input id="tripStartName" class="trip-start-input" maxlength="80" autocomplete="off" placeholder="e.g. Japan in Spring" value="${escapeTripStartText(tripStartAnswers.name)}"><p>Keep it simple — you can rename it anytime.</p>`,
    
    `<label for="tripStartOrigin">Where does your journey begin?</label>
     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
       <input id="tripStartOrigin" class="trip-start-input" maxlength="80" autocomplete="off" placeholder="e.g. Brisbane" value="${escapeTripStartText(tripStartAnswers.origin)}" oninput="handleTripStartCityTyping(this, 'tripStartOriginCountry', 'origin', 'originCountryCode')">
       <select id="tripStartOriginCountry" class="trip-start-input" style="padding: 0.5rem; font-size: 0.9rem;" onchange="tripStartAnswers.originCountryCode=this.value">${buildCountryOptionsHtml(tripStartAnswers.originCountryCode)}</select>
     </div>
     <p>This sets your starting home city & country flag.</p>
     <label for="tripStartDate" style="margin-top: 1rem;">When do you depart/arrive?</label>
     <input id="tripStartDate" class="trip-start-input" type="date" value="${escapeTripStartText(tripStartAnswers.date)}">
     <p>An approximate start date is fine.</p>`,
    
    `<label for="tripStartCity">Where are you going first?</label>
     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
       <input id="tripStartCity" class="trip-start-input" maxlength="80" autocomplete="off" placeholder="e.g. Tokyo" value="${escapeTripStartText(tripStartAnswers.city)}" oninput="handleTripStartCityTyping(this, 'tripStartCityCountry', 'city', 'cityCountryCode')">
       <select id="tripStartCityCountry" class="trip-start-input" style="padding: 0.5rem; font-size: 0.9rem;" onchange="tripStartAnswers.cityCountryCode=this.value">${buildCountryOptionsHtml(tripStartAnswers.cityCountryCode)}</select>
     </div>
     <div class="trip-start-number-row" style="margin-top: 1rem;"><button type="button" aria-label="Decrease nights" onclick="adjustTripStartNights(-1)">−</button><input id="tripStartNights" type="number" min="1" max="60" value="${tripStartAnswers.nights}" oninput="tripStartAnswers.nights=Math.max(1, Math.min(60, Number(this.value)||1))"><span>nights</span><button type="button" aria-label="Increase nights" onclick="adjustTripStartNights(1)">+</button></div><fieldset class="trip-start-transport" style="margin-top: 1rem;"><legend>How are you getting there?</legend>${[['flight','Flight'],['train','Train'],['bus','Bus'],['ferry','Ferry'],['other','Other']].map(([value,label]) => `<button type="button" class="${tripStartAnswers.transport === value ? 'is-selected' : ''}" onclick="selectTripStartTransport('${value}')">${label}</button>`).join('')}</fieldset>`,
    
    `<label>Will you visit other cities?</label><p class="trip-start-list-help">Add each stop with city name, country, nights, and transport.</p><div class="trip-start-stops">${stopRows}</div><button type="button" class="trip-start-add-stop" onclick="addTripStartStop()">+ Add another city</button><label for="tripStartReturnDate" style="margin-top: 1.5rem;">When do you head home?</label><input id="tripStartReturnDate" class="trip-start-input" type="date" value="${escapeTripStartText(tripStartAnswers.returnDate)}">${calculatedReturn ? `<p style="font-size:0.8rem; color:#27AE60; font-weight:600; margin-top:0.25rem;">✓ Auto-calculated for ${calculatedReturn}</p>` : '<p>Leave blank if open-ended.</p>'}`,
    
    `<label>Who is traveling?</label><div class="trip-start-chip-group">${partyBtns}</div><label style="margin-top: 1.25rem;">What pacing do you prefer?</label><div class="trip-start-chip-group">${pacingBtns}</div>`,
    
    `<label>What are your main interests?</label><p class="trip-start-list-help">Select all that apply to seed starter activities and local food tips.</p><div class="trip-start-chip-group">${interestChips}</div>`,
    
    `<label>Pre-booked Flights, Transport & Accommodations</label><p class="trip-start-list-help">Pair your pre-booked items to a city so they are automatically integrated into your itinerary!</p><div class="trip-start-booked-items">${bookedRows}</div><button type="button" class="trip-start-add-stop" onclick="addTripStartBookedItem()">+ Add pre-booked item</button><label for="tripStartNotes" style="margin-top: 1.25rem;">Additional Notes for AI Builder</label><textarea id="tripStartNotes" class="trip-start-input" rows="2" placeholder="e.g. interested in hidden neighborhood izakayas, prefer train over flight when possible">${escapeTripStartText(tripStartAnswers.notes)}</textarea>`
  ];

  const isLast = tripStartStep === 7;
  const titles = [
    'Let’s give it a name.',
    'Where does your journey begin?',
    'Choose your first destination.',
    'Add route stops & return date.',
    'Select your travel style & pace.',
    'Choose your main interests.',
    'Final details & AI readiness.'
  ];

  container.innerHTML = `${progress}<div class="trip-start-question"><h2>${titles[tripStartStep - 1]}</h2>${steps[tripStartStep - 1]}</div><div class="trip-start-actions">${back}<button class="trip-start-primary" type="button" onclick="nextTripStartStep()">${isLast ? 'Create my trip' : 'Continue'} <span aria-hidden="true">→</span></button></div><button class="trip-start-quiet" type="button" onclick="dismissTripStart()">Finish this later</button>`;
}

function chooseTripStart(choice) {
  const hasSeenSetup = typeof localStorage !== 'undefined' ? localStorage.getItem("travelApp_file_setup_seen") : null;
  const isSetupConfigured = hasSeenSetup || hasActiveFileHandle();

  if (choice === 'google_signin') {
    dismissTripStart();
    localStorage.setItem('travelApp_trip_start_seen', 'true');
    if (typeof window.authenticateGoogleDrive === 'function') {
      window.authenticateGoogleDrive(true).then((ok) => {
        if (ok) {
          if (typeof window.showToast === 'function') window.showToast('☁️ Signed in! Syncing your itineraries from Google Drive...');
          if (typeof window.openTripLibraryModal === 'function') window.openTripLibraryModal();
        }
      });
    } else if (typeof window.openCloudSyncModal === 'function') {
      window.openCloudSyncModal();
    }
    return;
  }

  if (choice === 'build') {
    tripStartStep = 'choose_path';
    renderTripStart();
    return;
  }
  if (choice === 'load_existing') {
    onboardOpenExistingTrip();
    return;
  }
  dismissTripStart();
  if (choice === 'learn') {
    if (typeof openGuideDialog === 'function') openGuideDialog();
    return;
  }
  if (choice === 'sample') {
    resetAppStateToDefaults();
    saveData(true);
    if (typeof buildNav === 'function') buildNav();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildCityNav === 'function') buildCityNav();
    if (typeof buildTransportTab === 'function') buildTransportTab();
    if (typeof buildAccomTab === 'function') buildAccomTab();
    if (typeof buildTabs === 'function') buildTabs();
  }
  localStorage.setItem('travelApp_trip_start_seen', 'true');
  showToast('Sample trip is ready — open any day to see how it is put together.');
}

function captureTripStartAnswer() {
  const nameInput = document.getElementById('tripStartName');
  if (nameInput) tripStartAnswers.name = nameInput.value.trim();

  const originInput = document.getElementById('tripStartOrigin');
  if (originInput) tripStartAnswers.origin = originInput.value.trim();

  const originCountrySelect = document.getElementById('tripStartOriginCountry');
  if (originCountrySelect) tripStartAnswers.originCountryCode = originCountrySelect.value;

  const dateInput = document.getElementById('tripStartDate');
  if (dateInput) tripStartAnswers.date = dateInput.value.trim();

  const cityInput = document.getElementById('tripStartCity');
  if (cityInput) tripStartAnswers.city = cityInput.value.trim();

  const cityCountrySelect = document.getElementById('tripStartCityCountry');
  if (cityCountrySelect) tripStartAnswers.cityCountryCode = cityCountrySelect.value;

  const returnDateInput = document.getElementById('tripStartReturnDate');
  if (returnDateInput) tripStartAnswers.returnDate = returnDateInput.value.trim();

  const notesInput = document.getElementById('tripStartNotes');
  if (notesInput) tripStartAnswers.notes = notesInput.value.trim();
}

function nextTripStartStep() {
  captureTripStartAnswer();
  if (tripStartStep === 1 && !tripStartAnswers.name) { showToast('Give your trip a name to continue.'); return; }
  if (tripStartStep === 2 && !tripStartAnswers.origin) { showToast('Tell us where you are leaving from to continue.'); return; }
  if (tripStartStep === 3 && !tripStartAnswers.city) { showToast('Choose your first city to continue.'); return; }
  if (typeof tripStartStep === 'number' && tripStartStep < 7) { tripStartStep++; renderTripStart(); return; }
  createTripFromStartAnswers();
}

function previousTripStartStep() {
  captureTripStartAnswer();
  if (tripStartStep === 'flight_import' || tripStartStep === 1) {
    tripStartStep = 'choose_path';
    renderTripStart();
    return;
  }
  if (tripStartStep === 'choose_path' || tripStartStep === 'builder_0') {
    const hasSeenTripStart = typeof localStorage !== 'undefined' ? localStorage.getItem("travelApp_trip_start_seen") : null;
    if (!hasSeenTripStart) {
      tripStartStep = 0;
      renderTripStart();
    } else {
      dismissTripStart();
    }
    return;
  }
  if (typeof tripStartStep === 'number') {
    tripStartStep = Math.max(0, tripStartStep - 1);
    renderTripStart();
  }
}
function adjustTripStartNights(change) { captureTripStartAnswer(); tripStartAnswers.nights = Math.max(1, Math.min(60, Number(tripStartAnswers.nights) + change)); renderTripStart(); }
function selectTripStartTransport(type) { captureTripStartAnswer(); tripStartAnswers.transport = type; renderTripStart(); }
function addTripStartStop() { captureTripStartAnswer(); tripStartAnswers.stops.push({ city: '', nights: 2, transport: 'train' }); renderTripStart(); }
function removeTripStartStop(index) { captureTripStartAnswer(); tripStartAnswers.stops.splice(index, 1); renderTripStart(); }
function updateTripStartStop(index, field, value) {
  captureTripStartAnswer();
  if (tripStartAnswers.stops[index]) {
    tripStartAnswers.stops[index][field] = field === 'nights' ? Math.max(1, Math.min(60, Number(value) || 1)) : value;
  }
  const calc = calculateTripStartReturnDate();
  if (calc) {
    tripStartAnswers.returnDate = calc;
    const input = document.getElementById('tripStartReturnDate');
    if (input) input.value = calc;
  }
}
function dismissTripStart() {
  const modal = document.getElementById('trip-start-modal');
  if (modal) modal.style.display = 'none';
  localStorage.setItem('travelApp_trip_start_seen', 'true');
}

async function createTripFromStartAnswers() {
  const route = [{ city: tripStartAnswers.city, nights: tripStartAnswers.nights, transport: tripStartAnswers.transport }].concat(tripStartAnswers.stops.filter(stop => stop.city.trim()));
  const start = tripStartAnswers.date ? new Date(`${tripStartAnswers.date}T12:00:00`) : null;
  const dateAt = offset => start ? new Date(start.getTime() + offset * 86400000).toISOString().slice(0, 10) : '';
  
  let dayOffset = 0;
  
  const starterContent = (cityId, cityName) => {
    const foodItems = [
      { text: `Find a local breakfast spot in ${cityName}`, done: false, cityId }
    ];
    if (tripStartAnswers.interests.includes('food')) {
      foodItems.push({ text: `Sample iconic local specialty & street food in ${cityName}`, done: false, cityId });
      foodItems.push({ text: `Explore ${cityName} central food market or night dining alley`, done: false, cityId });
    } else {
      foodItems.push({ text: `Choose a recommended local restaurant for dinner in ${cityName}`, done: false, cityId });
    }

    const tips = [
      { text: `Save your ${cityName} accommodation address & offline map access.`, cityId },
      { text: `Check transit pass options and local currency requirements in ${cityName}.`, cityId }
    ];

    const isPacked = tripStartAnswers.pacing === 'packed';
    const isRelaxed = tripStartAnswers.pacing === 'relaxed';

    const activities = [
      { id: `activity-${cityId}-walk`, title: `Explore ${cityName} historic center & neighborhood streets`, category: 'sight', estTime: isRelaxed ? '1.5 hrs' : '2.5 hrs', estCost: '0', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId }
    ];

    if (tripStartAnswers.interests.includes('culture')) {
      activities.push({ id: `activity-${cityId}-culture`, title: `Visit top landmark museum / historic site in ${cityName}`, category: 'sight', estTime: '3 hrs', estCost: 'TBC', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId });
    }
    if (tripStartAnswers.interests.includes('nature')) {
      activities.push({ id: `activity-${cityId}-nature`, title: `Stroll through ${cityName} central park or scenic viewpoint`, category: 'fitness', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId });
    }
    if (tripStartAnswers.interests.includes('shopping')) {
      activities.push({ id: `activity-${cityId}-shop`, title: `Browse ${cityName} local artisan crafts & boutique shops`, category: 'attraction', estTime: '2 hrs', estCost: 'TBC', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId });
    }
    if (tripStartAnswers.interests.includes('relaxation')) {
      activities.push({ id: `activity-${cityId}-relax`, title: `Enjoy a relaxing cafe break or thermal spa in ${cityName}`, category: 'wellness', estTime: '1.5 hrs', estCost: '0', assignedDayIdx: null, assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '', cityId });
    }

    return { cityFood: foodItems, legTips: tips, suggestedActivities: activities };
  };

  citiesData = route.map((stop, index) => {
    const cityNameTrimmed = stop.city.trim();
    const cityNameLower = cityNameTrimmed.toLowerCase();
    const explicitCountryCode = index === 0 ? (tripStartAnswers.cityCountryCode || '') : (stop.countryCode || '');
    
    let dbMatch = null;
    if (explicitCountryCode) {
      dbMatch = getAllCitiesByNameCountryMap().get(`${cityNameLower}|${explicitCountryCode.toUpperCase()}`) || null;
    }
    if (!dbMatch) {
      const nameMatches = getCitiesByNameMap().get(cityNameLower);
      dbMatch = nameMatches && nameMatches.length > 0 ? nameMatches[0] : null;
    }

    const countryCode = explicitCountryCode || dbMatch?.countryCode || 'ZZ';
    const cityId = `city-${Date.now()}-${index}`;
    const city = {
      id: cityId,
      name: dbMatch ? dbMatch.name : cityNameTrimmed,
      code: dbMatch?.code || '',
      icaoCode: dbMatch?.icaoCode || dbMatch?.icao || '',
      countryCode: countryCode,
      country: getCountryName(countryCode),
      dateFrom: dateAt(dayOffset),
      dateTo: dateAt(dayOffset + Number(stop.nights) - 1),
      colour: getCityColors()[index % getCityColors().length]
    };

    if (dbMatch && dbMatch.lat !== undefined && dbMatch.lng !== undefined) {
      city.lat = dbMatch.lat;
      city.lng = dbMatch.lng;
    }

    dayOffset += Number(stop.nights);
    return city;
  });
  
  dayOffset = 0;
  appData = [];
  
  const originName = tripStartAnswers.origin || 'Home';
  appData.push({
    id: `leg-start-${Date.now()}`,
    label: `🏠 Start (${originName})`,
    cityId: 'city-home',
    colour: '#2C3E50',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [{
      id: `day-start-${Date.now()}`,
      date: dateAt(0),
      day: start ? 'Travel Day' : '',
      from: originName,
      to: citiesData[0]?.name || '',
      completed: false,
      desc: 'Travel to first destination',
      transportItems: [], accomItems: [], activityItems: []
    }]
  });

  const destinationLegs = route.map((stop, index) => { 
    const city = citiesData[index]; 
    const content = starterContent(city.id, city.name); 
    const days = Array.from({ length: Number(stop.nights) }, (_, dayIndex) => ({ 
      id: `day-${Date.now()}-${index}-${dayIndex}`, 
      date: dateAt(dayOffset + dayIndex), 
      day: start ? `Day ${dayOffset + dayIndex + 1}` : '', 
      from: city.name, 
      to: city.name, 
      completed: false, 
      desc: '', 
      transportItems: [], accomItems: [], activityItems: [] 
    })); 
    dayOffset += Number(stop.nights); 
    return { id: `leg-${Date.now()}-${index}`, label: city.name, cityId: city.id, colour: city.colour, ...content, days }; 
  });
  appData.push(...destinationLegs);
  
  if (tripStartAnswers.returnDate) {
    const returnDateObj = new Date(`${tripStartAnswers.returnDate}T12:00:00`);
    const returnIso = returnDateObj.toISOString().slice(0, 10);
    const lastCityName = citiesData[citiesData.length - 1]?.name || '';
    appData.push({
      id: `leg-return-${Date.now()}`,
      label: `🏡 Return (${originName})`,
      cityId: 'city-home',
      colour: '#2C3E50',
      cityFood: [],
      suggestedActivities: [],
      legTips: [],
      days: [{
        id: `day-return-${Date.now()}`,
        date: returnIso,
        day: 'Return Travel',
        from: lastCityName,
        to: originName,
        completed: false,
        desc: 'Heading back home',
        transportItems: [], accomItems: [], activityItems: []
      }]
    });
  }

  titleData = { title: tripStartAnswers.name, subtitle: `${route.map(stop => stop.city.trim()).join(' → ')} · ${dayOffset} nights (${tripStartAnswers.party})` };
  
  journeys = route.map((stop, index) => { 
    const city = citiesData[index]; 
    const from = index ? citiesData[index - 1].name : originName; 
    return { 
      id: `journey-${Date.now()}-${index}`, 
      journeyId: `journey-${Date.now()}-${index}`, 
      journeyName: `${from} to ${city.name}`, 
      legId: destinationLegs[index].id, 
      dayDate: city.dateFrom, 
      fromLocation: from, 
      toLocation: city.name, 
      fromCityId: index ? citiesData[index - 1].id : 'city-home', 
      toCityId: city.id, 
      departureDate: city.dateFrom, 
      departureTime: '', 
      arrivalDate: city.dateFrom, 
      arrivalTime: '', 
      transportType: stop.transport, 
      provider: 'TBD Transport', 
      routeCode: '', 
      status: 'planned', 
      cost: '0', 
      bookingReference: '', 
      isMultiLeg: false, 
      segmentOrder: 1, 
      notes: '', 
      fromAddress: '', 
      toAddress: '', 
      legs: [], 
      attachments: [] 
    }; 
  });
  
  if (tripStartAnswers.returnDate) {
    const lastCity = citiesData[citiesData.length - 1];
    const returnDateObj = new Date(`${tripStartAnswers.returnDate}T12:00:00`);
    const returnIso = returnDateObj.toISOString().slice(0, 10);
    journeys.push({
      id: `journey-return-${Date.now()}`,
      journeyId: `journey-return-${Date.now()}`,
      journeyName: `${lastCity.name} to ${originName}`,
      legId: appData[appData.length - 1].id,
      dayDate: returnIso,
      fromLocation: lastCity.name,
      toLocation: originName,
      fromCityId: lastCity.id,
      toCityId: 'city-home',
      departureDate: returnIso,
      departureTime: '',
      arrivalDate: returnIso,
      arrivalTime: '',
      transportType: tripStartAnswers.returnTransport || 'flight',
      provider: 'TBD Transport',
      routeCode: '',
      status: 'planned',
      cost: '0',
      bookingReference: '',
      isMultiLeg: false,
      segmentOrder: 1,
      notes: '', 
      fromAddress: '', 
      toAddress: '', 
      legs: [], 
      attachments: [] 
    });
  }
  
  window.journeys = journeys;

  stays = citiesData.map((city, index) => {
    return {
      id: `stay-${Date.now()}-${index}`,
      cityId: city.id,
      cityName: city.name,
      propertyName: `Accommodation in ${city.name}`,
      checkIn: city.dateFrom,
      checkOut: index < citiesData.length - 1 ? citiesData[index + 1].dateFrom : (tripStartAnswers.returnDate || dateAt(dayOffset)),
      checkInTime: '14:00',
      checkOutTime: '10:00',
      nights: Number(route[index].nights),
      status: 'planned',
      provider: 'TBD',
      bookingRef: '',
      totalCost: 0,
      notes: 'Find a great place to stay',
      location: '',
      lat: '',
      lng: '',
      placeId: '',
      attachments: []
    };
  });
  window.stays = stays;

  localStorage.setItem('travelApp_vibeProfile', JSON.stringify(tripStartAnswers));

  const title = document.getElementById('mainTitle'); 
  const subtitle = document.getElementById('mainSubtitle');
  if (title) title.innerText = titleData.title; 
  if (subtitle) subtitle.innerText = titleData.subtitle;
  
  syncCurrentFileName(`${tripStartAnswers.name.replace(/[^a-z0-9]+/gi, '_') || 'My_Trip'}.json`);
  dismissTripStart();
  saveData(true);
  
  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildTransportTab === 'function') buildTransportTab();
  if (typeof buildAccomTab === 'function') buildAccomTab();

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem("travelApp_file_setup_seen", "true");
  }
  await saveData(true);
  
  showToast(`Your ${route.length}-city plan is created! Click 🤖 AI Builder anytime to enrich it.`);
}

function dismissFileSetup() {
  document.getElementById("file-setup-modal").style.display = "none";
  localStorage.setItem("travelApp_file_setup_seen", "true");
}

function startBlankTrip() {
  appData = [];
  journeys = [];
  stays = [];
  citiesData = [];
  userCities = [];
  userCountries = [];
  hotelCheckoutData = typeof DEFAULT_HOTEL_CHECKOUT !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_HOTEL_CHECKOUT)) : [];
  window.journeys = journeys;
  window.stays = stays;
  titleData = { title: "My New Trip", subtitle: "0 cities · Add a city or leg to start" };
  const newTripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  if (typeof setActiveTripId === 'function') {
    setActiveTripId(newTripId);
  }
  const mainTitleEl = document.getElementById("mainTitle");
  if (mainTitleEl) mainTitleEl.innerText = titleData.title;
  const mainSubEl = document.getElementById("mainSubtitle");
  if (mainSubEl) mainSubEl.innerText = titleData.subtitle;
  syncCurrentFileName("New_Trip.json");
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem("travelApp_file_setup_seen", "true");
    localStorage.setItem("travelApp_trip_start_seen", "true");
  }
  saveData(true);
  dismissTripStart();
  if (typeof buildNav === "function") buildNav();
  if (typeof buildItinerary === "function") buildItinerary();
  if (typeof buildCityNav === "function") buildCityNav();
  if (typeof buildTransportTab === "function") buildTransportTab();
  if (typeof buildAccomTab === "function") buildAccomTab();
  if (typeof buildTabs === "function") buildTabs();
  if (typeof window.renderHeaderTripSwitcher === 'function') {
    window.renderHeaderTripSwitcher();
  }
  if (typeof showToast === 'function') {
    showToast('✨ Blank trip canvas ready! Auto-saved locally.');
  }
}

async function onboardCreateNewTrip() {
  dismissFileSetup();
  if (isFSASupported()) {
    try {
      await createFileOnDisk();
    } catch(e) {
      console.warn('File setup save skipped:', e);
    }
  } else {
    exportJSON();
  }
}

function openCreateNewTripWizard() {
  if (typeof closeMobileMenu === 'function') closeMobileMenu();
  if (typeof closeDesktopActionsMenu === 'function') closeDesktopActionsMenu();
  tripStartStep = 'choose_path';
  const modal = document.getElementById("trip-start-modal");
  if (modal) modal.style.display = "flex";
  renderTripStart();
}

function onboardOpenExistingTrip() {
  dismissFileSetup();
  openTripFile();
}

if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return; // skip for automated testing

    const isFactoryReset = typeof localStorage !== 'undefined' ? localStorage.getItem("travelApp_factory_reset_triggered") === "true" : false;
    if (isFactoryReset) {
      try { localStorage.removeItem("travelApp_factory_reset_triggered"); } catch(e){}
      startBlankTrip();
      setTimeout(() => {
        openCreateNewTripWizard();
      }, 300);
      return;
    }

    const hasSeenTripStart = typeof localStorage !== 'undefined' ? localStorage.getItem("travelApp_trip_start_seen") : null;
    // Launch Step 0 options dialog first
    if (!hasSeenTripStart && !hasActiveFileHandle()) {
      setTimeout(() => {
        tripStartStep = 0;
        const modal = document.getElementById("trip-start-modal");
        if (modal) modal.style.display = "flex";
        renderTripStart();
      }, 300);
    }
  });
}

window.startBlankTrip = startBlankTrip;
window.onboardCreateNewTrip = onboardCreateNewTrip;
window.openCreateNewTripWizard = openCreateNewTripWizard;
window.onboardOpenExistingTrip = onboardOpenExistingTrip;
window.chooseTripStart = chooseTripStart;
window.nextTripStartStep = nextTripStartStep;
window.previousTripStartStep = previousTripStartStep;
window.adjustTripStartNights = adjustTripStartNights;
window.selectTripStartTransport = selectTripStartTransport;
window.dismissTripStart = dismissTripStart;
window.addTripStartStop = addTripStartStop;
window.removeTripStartStop = removeTripStartStop;
window.updateTripStartStop = updateTripStartStop;
window.selectTripStartPath = selectTripStartPath;
window.renderTripStart = renderTripStart;
window.renderTripStartPathChoice = renderTripStartPathChoice;
window.renderTripStartFlightImport = renderTripStartFlightImport;
window.extractTripStartFlights = extractTripStartFlights;
window.createTripFromFlightBookings = createTripFromFlightBookings;
window.insertSampleFlightConfirmation = insertSampleFlightConfirmation;
window.handleTripStartFlightFileUpload = handleTripStartFlightFileUpload;
window.tripStartStep = tripStartStep;
window.tripStartAnswers = tripStartAnswers;

Object.defineProperty(window, 'tripStartStep', {
  get: () => tripStartStep,
  set: (val) => { tripStartStep = val; }
});
Object.defineProperty(window, 'tripStartAnswers', {
  get: () => tripStartAnswers,
  set: (val) => { tripStartAnswers = val; }
});
