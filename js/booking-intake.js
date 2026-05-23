let bookingIntakePreviewItems = [];
let bookingIntakeLastFile = null;

function getBookingIntakeModal() {
  return document.getElementById('booking-intake-modal');
}

function openBookingIntakeDialog() {
  const modal = getBookingIntakeModal();
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => document.getElementById('bookingIntakeText')?.focus());
}

function closeBookingIntakeDialog() {
  const modal = getBookingIntakeModal();
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

function clearBookingIntakeDialog() {
  const textEl = document.getElementById('bookingIntakeText');
  const fileEl = document.getElementById('bookingIntakeFile');
  const statusEl = document.getElementById('bookingIntakeSourceStatus');
  if (textEl) textEl.value = '';
  if (fileEl) fileEl.value = '';
  if (statusEl) statusEl.textContent = '';
  bookingIntakeLastFile = null;
  bookingIntakePreviewItems = [];
  getBookingIntakeModal()?.classList.remove('booking-intake-has-preview');
  renderBookingIntakeReview([]);
}

function bookingIntakeEscape(value) {
  if (typeof escapeHtmlText === 'function') return escapeHtmlText(value);
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function normalizeBookingWhitespace(value) {
  return String(value || '').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function parseBookingDate(value) {
  const raw = String(value || '').trim().replace(/,/g, '');
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const months = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  let match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?$/);
  if (match) {
    const month = months[match[2].toLowerCase()];
    if (month) return `${match[3] || '2026'}-${month}-${match[1].padStart(2, '0')}`;
  }

  match = raw.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (match) {
    const month = months[match[1].toLowerCase()];
    if (month) return `${match[3] || '2026'}-${month}-${match[2].padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return typeof toLocalIsoDate === 'function'
      ? toLocalIsoDate(parsed)
      : parsed.toISOString().slice(0, 10);
  }

  return '';
}

function getBookingDateCandidates(text) {
  const matches = [
    ...String(text || '').matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g),
    ...String(text || '').matchAll(/\b(\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)(?:\s+20\d{2})?)\b/gi),
    ...String(text || '').matchAll(/\b((?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+\d{1,2}(?:,\s*20\d{2}|\s+20\d{2})?)\b/gi)
  ];
  return matches.map(match => parseBookingDate(match[1])).filter(Boolean);
}

function getBookingTimeCandidates(text) {
  return [...String(text || '').matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*([AP]M))?\b/gi)]
    .map(match => {
      let hour = Number(match[1]);
      const minute = match[2];
      const period = (match[3] || '').toUpperCase();
      if (period === 'PM' && hour < 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${minute}`;
    });
}

function getBookingReference(text) {
  const lines = String(text || '').split('\n');
  for (const line of lines) {
    const match = line.match(/\b(?:booking reference|confirmation number|reservation number|record locator|booking ref|pnr|ref)\b\s*(?:no\.?|number|#|:)?\s*([A-Z0-9][A-Z0-9-]{4,})\b/i);
    if (match && !/confirmation|reference|reservation|booking/i.test(match[1])) {
      return match[1].toUpperCase();
    }
  }
  const fallback = String(text || '').match(/\b(?:PNR|REF)\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{4,})\b/i)
    || String(text || '').match(/\b([A-Z0-9]{5,8})\b/);
  if (fallback) return fallback[1].toUpperCase();
  return '';
}

function cleanBookingPlace(value) {
  return String(value || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:airport|station|terminal|hotel|city)\b/gi, '')
    .replace(/[^A-Za-z\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBookingRoute(text) {
  const value = String(text || '');
  const explicit = value.match(/\bfrom\s+([A-Za-z][A-Za-z\s.'-]{2,40})\s+to\s+([A-Za-z][A-Za-z\s.'-]{2,40})(?:\n|$)/i)
    || value.match(/\bdeparture\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,40})\s+(?:arrival|arrive|to)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,40})(?:\n|$)/i);
  if (explicit) {
    return {
      fromLocation: cleanBookingPlace(explicit[1]),
      toLocation: cleanBookingPlace(explicit[2])
    };
  }

  const arrow = value.match(/\b([A-Za-z][A-Za-z\s.'-]{2,30})\s*(?:->|to)\s*([A-Za-z][A-Za-z\s.'-]{2,30})(?:\n|$)/i);
  if (arrow) {
    return {
      fromLocation: cleanBookingPlace(arrow[1]),
      toLocation: cleanBookingPlace(arrow[2])
    };
  }

  return { fromLocation: '', toLocation: '' };
}

function getProviderCandidate(text, fallback = '') {
  const lines = String(text || '').split('\n').map(line => line.trim()).filter(Boolean);
  const providerLine = lines.find(line => /\b(air|airways|airlines|rail|train|hotel|booking\.com|expedia|agoda|viator|getyourguide|eurostar|railjet)\b/i.test(line));
  if (!providerLine) return fallback;
  return providerLine.replace(/(?:confirmation|itinerary|receipt|booking).*/i, '').trim().slice(0, 60) || fallback;
}

function findCityByBookingName(name) {
  const normalized = String(name || '').trim().toLowerCase();
  if (!normalized) return null;
  const cityLists = [
    Array.isArray(citiesData) ? citiesData : [],
    typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES) ? ALL_CITIES : [],
    typeof CITY_DATABASE !== 'undefined' && Array.isArray(CITY_DATABASE) ? CITY_DATABASE : []
  ];
  for (const list of cityLists) {
    const found = list.find(city => city.name && (
      city.name.toLowerCase() === normalized ||
      normalized.includes(city.name.toLowerCase()) ||
      city.name.toLowerCase().includes(normalized)
    ));
    if (found) return found;
  }
  return null;
}

function ensureBookingCity(name, sourceDate = '') {
  const cleaned = cleanBookingPlace(name);
  if (!cleaned) return '';
  const existing = Array.isArray(citiesData)
    ? citiesData.find(city => city.name && city.name.toLowerCase() === cleaned.toLowerCase())
    : null;
  if (existing) return existing.id;

  const dbMatch = findCityByBookingName(cleaned);
  const cityId = 'city-' + cleaned.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const newCity = {
    id: cityId,
    name: dbMatch?.name || cleaned,
    code: dbMatch?.code || '',
    countryCode: dbMatch?.countryCode || '',
    country: dbMatch?.country || (typeof getCountryName === 'function' && dbMatch?.countryCode ? getCountryName(dbMatch.countryCode) : ''),
    dateFrom: sourceDate,
    dateTo: sourceDate,
    colour: typeof getRandomCityColor === 'function' ? getRandomCityColor() : '#2C3E50'
  };
  citiesData.push(newCity);
  return newCity.id;
}

function findBestBookingLeg(date, fromLocation = '', toLocation = '') {
  if (!Array.isArray(appData)) return null;
  const normalizedFrom = cleanBookingPlace(fromLocation).toLowerCase();
  const normalizedTo = cleanBookingPlace(toLocation).toLowerCase();
  return appData.find(leg => (leg.days || []).some(day => {
    const dayDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(day.date) : day.date;
    if (date && dayDate !== date) return false;
    const dayFrom = cleanBookingPlace(day.from).toLowerCase();
    const dayTo = cleanBookingPlace(day.to).toLowerCase();
    return !normalizedFrom && !normalizedTo
      ? true
      : [dayFrom, dayTo].some(dayCity => dayCity && (dayCity === normalizedFrom || dayCity === normalizedTo));
  })) || null;
}

function detectBookingDuplicates(item) {
  const duplicates = [];
  const ref = (item.bookingReference || item.bookingRef || '').toLowerCase();
  if (item.kind === 'journey' && Array.isArray(journeys)) {
    const found = journeys.find(j => (
      (ref && String(j.bookingReference || '').toLowerCase() === ref) ||
      (j.departureDate === item.departureDate && cleanBookingPlace(j.fromLocation).toLowerCase() === cleanBookingPlace(item.fromLocation).toLowerCase() && cleanBookingPlace(j.toLocation).toLowerCase() === cleanBookingPlace(item.toLocation).toLowerCase())
    ));
    if (found) duplicates.push('Possible duplicate transport');
  }
  if (item.kind === 'stay' && Array.isArray(stays)) {
    const found = stays.find(stay => (
      (ref && String(stay.bookingRef || '').toLowerCase() === ref) ||
      (stay.checkIn === item.checkIn && stay.checkOut === item.checkOut && String(stay.propertyName || '').toLowerCase() === String(item.propertyName || '').toLowerCase())
    ));
    if (found) duplicates.push('Possible duplicate stay');
  }
  if (item.kind === 'activity' && Array.isArray(appData)) {
    const found = appData.some(leg => (leg.days || []).some(day => (
      (typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(day.date) : day.date) === item.date &&
      (day.activityItems || []).some(activity => String(activity.text || '').toLowerCase().includes(String(item.title || '').toLowerCase()))
    )));
    if (found) duplicates.push('Possible duplicate activity');
  }
  return duplicates;
}

function parseBookingConfirmationText(text, sourceName = 'Pasted text') {
  const normalized = normalizeBookingWhitespace(text);
  if (!normalized) return [];

  const lower = normalized.toLowerCase();
  const dates = getBookingDateCandidates(normalized);
  const times = getBookingTimeCandidates(normalized);
  const bookingRef = getBookingReference(normalized);
  const provider = getProviderCandidate(normalized);
  const route = getBookingRoute(normalized);
  const items = [];

  if (/\b(flight|airline|boarding|pnr|depart|arrival|train|rail|eurostar|station|bus|ferry)\b/i.test(normalized)) {
    const routeCodeMatch = normalized.match(/\b(?:flight|train|service|route)\s*(?:no\.?|number|#|:)?\s*([A-Z]{1,3}\s?\d{1,5}[A-Z]?)\b/i)
      || normalized.match(/\b([A-Z]{2,3}\s?\d{2,5}[A-Z]?)\b/);
    const type = lower.includes('train') || lower.includes('rail') || lower.includes('eurostar')
      ? 'train'
      : lower.includes('bus')
        ? 'bus'
        : lower.includes('ferry')
          ? 'ferry'
          : 'flight';
    items.push({
      id: `booking-preview-${Date.now()}-${items.length}`,
      kind: 'journey',
      sourceName,
      transportType: type,
      provider: provider || (type === 'flight' ? 'Airline' : 'Transport provider'),
      routeCode: routeCodeMatch ? routeCodeMatch[1].replace(/\s+/g, '') : '',
      bookingReference: bookingRef,
      fromLocation: route.fromLocation,
      toLocation: route.toLocation,
      departureDate: dates[0] || '',
      departureTime: times[0] || '',
      arrivalDate: dates[1] || dates[0] || '',
      arrivalTime: times[1] || '',
      cost: '',
      status: 'confirmed',
      notes: sourceName
    });
  }

  if (/\b(hotel|accommodation|check-?in|check-?out|room|reservation)\b/i.test(normalized)) {
    const propertyMatch = normalized.match(/\b(?:hotel|property|accommodation|stay)\s*:?\s*([A-Za-z0-9][A-Za-z0-9\s.'&-]{2,80})(?:\n|$)/i)
      || normalized.split('\n').find(line => /\b(hotel|inn|resort|hostel|suites|apartment|airbnb)\b/i.test(line));
    const checkInMatch = normalized.match(/\bcheck-?in\s*:?\s*([A-Za-z0-9,\s-]{6,24})(?:\n|$)/i);
    const checkOutMatch = normalized.match(/\bcheck-?out\s*:?\s*([A-Za-z0-9,\s-]{6,24})(?:\n|$)/i);
    const locationMatch = normalized.match(/\b(?:city|location|address)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,45})(?:\n|$)/i);
    const checkIn = checkInMatch ? parseBookingDate(checkInMatch[1]) : (dates[0] || '');
    const checkOut = checkOutMatch ? parseBookingDate(checkOutMatch[1]) : (dates[1] || '');
    const city = cleanBookingPlace(locationMatch ? locationMatch[1] : route.toLocation || route.fromLocation);
    items.push({
      id: `booking-preview-${Date.now()}-${items.length}`,
      kind: 'stay',
      sourceName,
      propertyName: String(Array.isArray(propertyMatch) ? propertyMatch[1] : (propertyMatch || 'Imported stay')).trim().slice(0, 90),
      provider: /\b(hotel|booking\.com|expedia|agoda|airbnb)\b/i.test(provider) ? provider : '',
      city,
      checkIn,
      checkOut,
      bookingRef,
      totalCost: '',
      status: 'confirmed',
      notes: sourceName
    });
  }

  if (/\b(tour|ticket|activity|reservation|admission|experience|museum|dinner|restaurant)\b/i.test(normalized)) {
    const titleMatch = normalized.match(/\b(?:tour|activity|experience|reservation|ticket)\s*:?\s*([A-Za-z0-9][A-Za-z0-9\s.'&-]{3,90})(?:\n|$)/i);
    const locationMatch = normalized.match(/\b(?:location|venue|address)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,60})(?:\n|$)/i);
    items.push({
      id: `booking-preview-${Date.now()}-${items.length}`,
      kind: 'activity',
      sourceName,
      title: String(titleMatch?.[1] || 'Imported reservation').trim().slice(0, 90),
      date: dates[0] || '',
      time: times[0] || '',
      location: cleanBookingPlace(locationMatch?.[1] || route.toLocation || ''),
      bookingRef,
      cost: '',
      notes: sourceName
    });
  }

  if (items.length === 0 && bookingIntakeLastFile) {
    items.push({
      id: `booking-preview-${Date.now()}-file`,
      kind: 'activity',
      sourceName,
      title: `Review uploaded file: ${bookingIntakeLastFile.name}`,
      date: dates[0] || '',
      time: '',
      location: '',
      bookingRef,
      cost: '',
      notes: 'File uploaded for manual review; no structured details were detected.'
    });
  }

  return items.map(item => ({
    ...item,
    duplicateWarnings: detectBookingDuplicates(item)
  }));
}

function renderBookingIntakeReview(items) {
  const reviewEl = document.getElementById('bookingIntakeReview');
  const countEl = document.getElementById('bookingIntakeReviewCount');
  const mergeBtn = document.getElementById('bookingIntakeMergeBtn');
  if (!reviewEl) return;
  getBookingIntakeModal()?.classList.toggle('booking-intake-has-preview', items.length > 0);

  if (countEl) countEl.textContent = items.length ? `${items.length} item${items.length === 1 ? '' : 's'} found` : 'No items yet';
  if (mergeBtn) mergeBtn.disabled = items.length === 0;

  if (!items.length) {
    reviewEl.innerHTML = '<p class="booking-intake-empty">Paste or upload a booking confirmation, then extract it to preview proposed trip changes.</p>';
    return;
  }

  reviewEl.innerHTML = items.map((item, index) => {
    const label = item.kind === 'journey'
      ? `${item.fromLocation || 'Unknown origin'} to ${item.toLocation || 'Unknown destination'}`
      : item.kind === 'stay'
        ? item.propertyName
        : item.title;
    const dateLine = item.kind === 'journey'
      ? [item.departureDate, item.departureTime, item.arrivalDate, item.arrivalTime].filter(Boolean).join(' / ')
      : item.kind === 'stay'
        ? [item.checkIn, item.checkOut].filter(Boolean).join(' to ')
        : [item.date, item.time].filter(Boolean).join(' ');
    const ref = item.bookingReference || item.bookingRef || '';
    const warnings = item.duplicateWarnings?.length
      ? `<div class="booking-intake-warning">${item.duplicateWarnings.map(bookingIntakeEscape).join(', ')}</div>`
      : '';
    return `
      <label class="booking-intake-card ${item.duplicateWarnings?.length ? 'has-warning' : ''}">
        <input type="checkbox" class="booking-intake-select" data-index="${index}" ${item.duplicateWarnings?.length ? '' : 'checked'}>
        <span class="booking-intake-card-body">
          <span class="booking-intake-card-kind">${bookingIntakeEscape(item.kind)}</span>
          <strong>${bookingIntakeEscape(label)}</strong>
          <span>${bookingIntakeEscape(dateLine || 'Date not detected')}</span>
          <span>${bookingIntakeEscape([item.provider, item.routeCode, ref ? `Ref ${ref}` : ''].filter(Boolean).join(' - ') || item.sourceName)}</span>
          ${warnings}
        </span>
      </label>
    `;
  }).join('');
}

async function handleBookingIntakeFile(event) {
  const file = event.target.files?.[0];
  const statusEl = document.getElementById('bookingIntakeSourceStatus');
  if (!file) return;
  bookingIntakeLastFile = file;
  const lowerName = file.name.toLowerCase();
  if (/\.(png|jpg|jpeg)$/.test(lowerName)) {
    if (statusEl) statusEl.textContent = `${file.name} attached. Image OCR is not available locally, so paste any visible confirmation text before extracting.`;
    return;
  }
  try {
    const text = await file.text();
    const textEl = document.getElementById('bookingIntakeText');
    if (textEl) textEl.value = [textEl.value.trim(), text.trim()].filter(Boolean).join('\n\n');
    if (statusEl) statusEl.textContent = `${file.name} loaded for local extraction.`;
  } catch (error) {
    if (statusEl) statusEl.textContent = `Could not read ${file.name}. Paste the confirmation text instead.`;
  }
}

function previewBookingIntake() {
  const text = document.getElementById('bookingIntakeText')?.value || '';
  const sourceName = bookingIntakeLastFile?.name || 'Pasted confirmation';
  
  const reviewEl = document.getElementById('bookingIntakeReview');
  if (reviewEl) {
    reviewEl.innerHTML = `
      <div class="shimmer-card">
        <div class="shimmer-line shimmer-title"></div>
        <div class="shimmer-line shimmer-text"></div>
        <div class="shimmer-line shimmer-meta"></div>
      </div>
      <div class="shimmer-card">
        <div class="shimmer-line shimmer-title"></div>
        <div class="shimmer-line shimmer-text"></div>
        <div class="shimmer-line shimmer-meta"></div>
      </div>
    `;
    const countEl = document.getElementById('bookingIntakeReviewCount');
    if (countEl) countEl.textContent = 'Extracting booking details...';
    const mergeBtn = document.getElementById('bookingIntakeMergeBtn');
    if (mergeBtn) mergeBtn.disabled = true;
    getBookingIntakeModal()?.classList.add('booking-intake-has-preview');
  }

  setTimeout(() => {
    bookingIntakePreviewItems = parseBookingConfirmationText(text, sourceName);
    renderBookingIntakeReview(bookingIntakePreviewItems);
  }, 500);
}

function createJourneyFromBookingItem(item) {
  const departureDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(item.departureDate) : item.departureDate;
  const arrivalDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(item.arrivalDate || item.departureDate) : (item.arrivalDate || item.departureDate);
  const fromCityId = ensureBookingCity(item.fromLocation, departureDate);
  const toCityId = ensureBookingCity(item.toLocation, arrivalDate);
  const bestLeg = findBestBookingLeg(departureDate, item.fromLocation, item.toLocation);
  const journeyId = `booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: `${journeyId}_1`,
    journeyId,
    journeyName: `${item.fromLocation || 'Origin'} -> ${item.toLocation || 'Destination'}`,
    legId: bestLeg?.id || '',
    dayDate: departureDate,
    fromLocation: item.fromLocation || '',
    toLocation: item.toLocation || '',
    fromCityId,
    toCityId,
    departureDate,
    departureTime: item.departureTime || '',
    arrivalDate,
    arrivalTime: item.arrivalTime || '',
    transportType: item.transportType || 'other',
    provider: item.provider || '',
    routeCode: item.routeCode || '',
    status: item.status || 'confirmed',
    cost: item.cost || '0',
    bookingReference: item.bookingReference || '',
    isMultiLeg: false,
    segmentOrder: 1,
    notes: item.notes || item.sourceName || '',
    legs: []
  };
}

function createStayFromBookingItem(item) {
  const checkIn = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(item.checkIn) : item.checkIn;
  const checkOut = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(item.checkOut) : item.checkOut;
  const cityId = ensureBookingCity(item.city, checkIn);
  const nights = typeof calculateNights === 'function'
    ? calculateNights(checkIn, checkOut)
    : (typeof calculateNightsBetween === 'function' ? calculateNightsBetween(checkIn, checkOut) : 0);
  return {
    id: `stay_booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cityId,
    propertyName: item.propertyName || 'Imported stay',
    checkIn,
    checkOut,
    nights,
    status: item.status || 'confirmed',
    provider: item.provider || '',
    bookingRef: item.bookingRef || '',
    totalCost: item.totalCost || '0',
    notes: item.notes || item.sourceName || ''
  };
}

function mergeActivityFromBookingItem(item) {
  const date = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(item.date) : item.date;
  const targetLeg = findBestBookingLeg(date, item.location, item.location);
  if (!targetLeg) return false;
  const dayIndex = (targetLeg.days || []).findIndex(day => {
    const dayDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(day.date) : day.date;
    return dayDate === date;
  });
  if (dayIndex === -1) return false;

  const title = [item.title, item.location].filter(Boolean).join(' - ');
  targetLeg.suggestedActivities = Array.isArray(targetLeg.suggestedActivities) ? targetLeg.suggestedActivities : [];
  targetLeg.suggestedActivities.push({
    title,
    category: 'tour',
    estTime: item.time || '1 hr',
    estCost: item.cost || '0',
    assignedDayIdx: dayIndex
  });
  targetLeg.days[dayIndex].activityItems = Array.isArray(targetLeg.days[dayIndex].activityItems) ? targetLeg.days[dayIndex].activityItems : [];
  targetLeg.days[dayIndex].activityItems.push({
    text: title,
    cost: item.cost || '0',
    done: false,
    bookingRef: item.bookingRef || ''
  });
  return true;
}

async function mergeBookingIntakePreview() {
  const selectedIndexes = [...document.querySelectorAll('.booking-intake-select:checked')]
    .map(input => Number(input.dataset.index))
    .filter(index => Number.isInteger(index));
  if (!selectedIndexes.length) {
    alert('Select at least one extracted item to merge.');
    return;
  }

  const selectedItems = selectedIndexes.map(index => bookingIntakePreviewItems[index]).filter(Boolean);
  let merged = 0;
  selectedItems.forEach(item => {
    if (item.duplicateWarnings?.length) return;
    if (item.kind === 'journey') {
      journeys.push(createJourneyFromBookingItem(item));
      merged++;
    } else if (item.kind === 'stay') {
      stays.push(createStayFromBookingItem(item));
      merged++;
    } else if (item.kind === 'activity') {
      if (mergeActivityFromBookingItem(item)) merged++;
    }
  });

  window.journeys = journeys;
  window.stays = stays;
  if (typeof saveData === 'function') await saveData();
  if (typeof buildNav === 'function') buildNav();
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
  if (typeof buildTransportTab === 'function') buildTransportTab(typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all');
  if (typeof buildAccomTab === 'function') buildAccomTab(typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all');

  const statusEl = document.getElementById('bookingIntakeSourceStatus');
  if (statusEl) statusEl.textContent = `${merged} item${merged === 1 ? '' : 's'} merged into this trip.`;
  bookingIntakePreviewItems = [];
  renderBookingIntakeReview([]);
}

if (typeof window !== 'undefined') {
  window.openBookingIntakeDialog = openBookingIntakeDialog;
  window.closeBookingIntakeDialog = closeBookingIntakeDialog;
  window.clearBookingIntakeDialog = clearBookingIntakeDialog;
  window.handleBookingIntakeFile = handleBookingIntakeFile;
  window.previewBookingIntake = previewBookingIntake;
  window.mergeBookingIntakePreview = mergeBookingIntakePreview;
  window.parseBookingConfirmationText = parseBookingConfirmationText;
}
