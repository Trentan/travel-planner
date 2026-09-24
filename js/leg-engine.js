// ============================================================================
// MODULE: Leg Routing & Itinerary Engine (js/leg-engine.js)
// Pure data reconciliation, date cascading, routing algorithms, and itinerary sync.
// ============================================================================

function regenerateItineraryFromJourneys(linkedJourneys, legId) {
  if (!linkedJourneys || !linkedJourneys.length || !legId) return false;
  
  const leg = appData.find(l => String(l.id) === String(legId));
  if (!leg) return false;

  const toSortable = (val) => {
    if (!val) return '';
    if (typeof normalizeTripDateValue === 'function') {
      const normalized = normalizeTripDateValue(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized || '')) return normalized;
    }
    return String(val);
  };
  const getDepDate = (j) => toSortable(j.departureDate || j.dayDate || '');
  const getArrDate = (j) => toSortable(j.arrivalDate || j.departureDate || j.dayDate || '');
  const getDepTime = (j) => String(j.departureTime || '').padStart(5, '0');
  const getArrTime = (j) => String(j.arrivalTime || '').padStart(5, '0');

  const sorted = [...linkedJourneys].sort((a, b) => {
    const dateCmp = getDepDate(a).localeCompare(getDepDate(b));
    if (dateCmp !== 0) return dateCmp;
    return getDepTime(a).localeCompare(getDepTime(b));
  });

  const first = sorted[0];
  const last = [...sorted].sort((a, b) => {
    const dateCmp = getArrDate(a).localeCompare(getArrDate(b));
    if (dateCmp !== 0) return dateCmp;
    return getArrTime(a).localeCompare(getArrTime(b));
  }).slice(-1)[0];

  const dateFrom = getDepDate(first);
  const dateTo = getArrDate(last) || dateFrom;
  
  if (!dateFrom) return false;

  // We simply regenerate the days array for this leg using buildLegDaysWithNotes
  const newDays = buildLegDaysWithNotes({
    dateFrom,
    dateTo,
    fromCity: first.fromLocation || '',
    toCity: last.toLocation || '',
    legType: leg.type || 'city',
    dayNotes: []
  });
  
  // Merge notes from old days if they match by date
  newDays.forEach(nd => {
    const oldDay = leg.days.find(od => od.date === nd.date);
    if (oldDay) {
      if (oldDay.desc) nd.desc = oldDay.desc;
      if (oldDay.notes) nd.notes = oldDay.notes;
    }
  });

  leg.days = newDays;
  return true;
}


function isTerminalLeg(leg) {
  if (!leg) return false;
  // Prefer stored leg.type field (set by normalizeTripLegsData)
  if (leg.type === 'start' || leg.type === 'return') return true;
  const lid = String(leg.id || '').toLowerCase();
  const lbl = String(leg.label || '').toLowerCase();
  return lid === 'departure' || lid === 'return' || lid.endsWith('-start') || lid.endsWith('-finish') ||
    lbl.includes('(trip start)') || lbl.includes('(trip finish)');
}


function getLegBaseCityName(leg) {
  if (!leg) return '';
  const homeCity = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : 'Home';
  
  if (leg.type === 'start' || (typeof isTerminalLeg === 'function' && isTerminalLeg(leg) && (String(leg.id || '').endsWith('-start') || String(leg.label || '').toLowerCase().includes('start')))) {
    const cleanLbl = String(leg.label || '').replace(/\s*\(trip\s*start\)/i, '').replace(/[^\x00-\x7F]/g, '').trim();
    return cleanLbl || homeCity;
  }
  if (leg.type === 'return' || (typeof isTerminalLeg === 'function' && isTerminalLeg(leg) && (String(leg.id || '').endsWith('-finish') || String(leg.label || '').toLowerCase().includes('finish') || String(leg.label || '').toLowerCase().includes('return')))) {
    const cleanLbl = String(leg.label || '').replace(/\s*\(trip\s*(finish|end)\)/i, '').replace(/\s*return\s*home/i, '').replace(/[^\x00-\x7F]/g, '').trim();
    return cleanLbl || homeCity;
  }

  if (leg.cityId && typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    const cityObj = citiesData.find(c => c && c.id === leg.cityId);
    if (cityObj && cityObj.name) return cityObj.name;
  }

  const cleanLbl = typeof cleanCityNavLabel === 'function'
    ? cleanCityNavLabel(leg.label)
    : String(leg.label || '').replace(/\s*\([^)]*\)/g, '').replace(/[^\x00-\x7F]/g, '').trim();

  const namedCity = typeof getCityByName === 'function' ? (getCityByName(cleanLbl) || getCityByName(leg.label)) : null;
  if (namedCity && namedCity.name) return namedCity.name;

  return cleanLbl || leg.label || '';
}


function getPriorLegCity(legs, targetIdx, fallbackHome = 'Home') {
  if (!Array.isArray(legs) || targetIdx <= 0) return fallbackHome;
  // Use titleData.homeCity as the canonical home name if available
  const homeCity = (typeof titleData !== 'undefined' && titleData && titleData.homeCity)
    ? String(titleData.homeCity).trim()
    : fallbackHome;
  for (let i = targetIdx - 1; i >= 0; i--) {
    const prev = legs[i];
    if (!prev) continue;
    if (isTerminalLeg(prev)) {
      const lid = String(prev.id || '').toLowerCase();
      const lbl = String(prev.label || '').toLowerCase();
      // For start-type legs, always return canonical home city (never read firstDay.from which may be corrupted)
      if (prev.type === 'start' || lid.endsWith('-start') || lbl.includes('(trip start)') || lid === 'departure') {
        return homeCity;
      }
      continue;
    }
    const cityName = getLegBaseCityName(prev);
    if (cityName && cityName !== 'Home') return cityName;
  }
  return homeCity;
}


function enforceTerminalLegs(legs) {
  if (!Array.isArray(legs) || legs.length === 0) return;
  const homeCity = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : 'Home';
  const tripStart = typeof getTripStartDate === 'function' ? getTripStartDate() : legs[0]?.days?.[0]?.date || '';
  const tripEnd = legs[legs.length - 1]?.days?.slice(-1)?.[0]?.date || tripStart;
  
  const first = legs[0];
  const startHome = (typeof getLegBaseCityName === 'function' ? getLegBaseCityName(first) : '') || homeCity;
  if (first.type !== 'start' && !isTerminalLeg(first)) {
    legs.unshift({
      id: 'leg_start_' + Date.now(),
      type: 'start',
      label: `${homeCity} (Trip Start)`,
      colour: '#2C3E50',
      cityFood: [], cityRun: [], suggestedActivities: [], legTips: [],
      days: [{ date: tripStart, day: typeof getWeekdayLabelForTripDate === 'function' ? getWeekdayLabelForTripDate(tripStart) : 'Mon',
               from: homeCity, to: getLegBaseCityName(legs[1]) || homeCity,
               completed: false, desc: 'Departure day', transportItems: [], accomItems: [], activityItems: [] }]
    });
  } else {
    first.type = 'start';
    if (first.days?.[0]) {
      first.days[0].from = startHome;
      if (legs.length > 1 && (!first.days[0].to || first.days[0].to === 'Home')) {
        first.days[0].to = getLegBaseCityName(legs[1]) || homeCity;
      }
    }
  }
  
  if (legs.length > 1) {
    const last = legs[legs.length - 1];
    const returnHome = (typeof getLegBaseCityName === 'function' ? getLegBaseCityName(last) : '') || homeCity;
    if (last.type !== 'return' && !isTerminalLeg(last)) {
      legs.push({
        id: 'leg_return_' + Date.now(),
        type: 'return',
        label: `${homeCity} (Trip Finish)`,
        colour: '#2C3E50',
        cityFood: [], cityRun: [], suggestedActivities: [], legTips: [],
        days: [{ date: tripEnd, day: typeof getWeekdayLabelForTripDate === 'function' ? getWeekdayLabelForTripDate(tripEnd) : 'Mon',
                 from: getLegBaseCityName(legs[legs.length - 2]) || homeCity, to: homeCity,
                 completed: false, desc: 'Return home', transportItems: [], accomItems: [], activityItems: [] }]
      });
    } else {
      last.type = 'return';
      if (last.days?.length > 0) {
        last.days[last.days.length - 1].to = returnHome;
        if (legs.length > 1 && (!last.days[0].from || last.days[0].from === 'Home')) {
          last.days[0].from = getLegBaseCityName(legs[legs.length - 2]) || homeCity;
        }
      }
    }
  }
}
if (typeof window !== 'undefined') window.enforceTerminalLegs = enforceTerminalLegs;

/**
 * Rebuilds the from/to routing on every day card based on leg sequence.
 * Does NOT touch dates, notes, or items — only the city routing direction.
 * Call this after any leg reorder or when routing is known to be corrupt.
 */

function rebuildLegRouting(legs) {
  if (!Array.isArray(legs) || legs.length === 0) return;
  const homeCity = (typeof titleData !== 'undefined' && titleData && titleData.homeCity)
    ? String(titleData.homeCity).trim()
    : ((typeof getLegBaseCityName === 'function' && legs.length > 0) ? getLegBaseCityName(legs[0]) : '') || 'Home';
  
  legs.forEach((leg, i) => {
    if (!Array.isArray(leg.days) || leg.days.length === 0) return;
    
    const prevCity = i > 0 ? (getLegBaseCityName(legs[i - 1]) || homeCity) : homeCity;
    const thisCity = getLegBaseCityName(leg) || leg.label || homeCity;
    const nextCity = i < legs.length - 1 ? (getLegBaseCityName(legs[i + 1]) || homeCity) : homeCity;
    
    const cleanCity = (c) => String(c || '').replace(/\s*\(trip\s*(start|finish|end)\)/i,'').replace(/\s*\(\d+\)$/,'').trim() || homeCity;
    
    leg.days.forEach((day, di) => {
      const isFirst = di === 0;
      const isLast = di === leg.days.length - 1;
      
      if (leg.type === 'start') {
        day.from = cleanCity(homeCity);
        day.to = cleanCity(nextCity);
      } else if (leg.type === 'return') {
        day.from = cleanCity(prevCity);
        day.to = cleanCity(homeCity);
      } else if (leg.type === 'transit') {
        day.from = cleanCity(prevCity);
        day.to = cleanCity(nextCity);
      } else {
        // city leg
        if (isFirst) {
          day.from = cleanCity(prevCity);
          day.to = cleanCity(thisCity);
        } else if (isLast && leg.days.length > 1) {
          day.from = cleanCity(thisCity);
          day.to = cleanCity(nextCity);
        } else {
          day.from = cleanCity(thisCity);
          day.to = cleanCity(thisCity);
        }
      }
    });
  });
}
if (typeof window !== 'undefined') window.rebuildLegRouting = rebuildLegRouting;



function autoGenerateMissingTransitLegs(legsList) {
  if (!window.journeys || window.journeys.length === 0) return 0;
  
  const sortedJourneys = window.journeys.filter(j => j.fromLocation && j.toLocation && j.fromLocation.toLowerCase() !== j.toLocation.toLowerCase()).sort((a,b) => {
    const aTime = (a.departureDate||a.date||'') + 'T' + (a.departureTime||'00:00');
    const bTime = (b.departureDate||b.date||'') + 'T' + (b.departureTime||'00:00');
    return aTime.localeCompare(bTime);
  });
  const routeCities = [];
  if (sortedJourneys.length > 0) {
    routeCities.push(sortedJourneys[0].fromLocation);
    sortedJourneys.forEach(j => {
       if (routeCities[routeCities.length - 1].toLowerCase() !== j.fromLocation.toLowerCase()) {
          routeCities.push(j.fromLocation);
       }
       if (routeCities[routeCities.length - 1].toLowerCase() !== j.toLocation.toLowerCase()) {
          routeCities.push(j.toLocation);
       }
    });
  }

  function getBaseName(name) {
    if (!name) return '';
    let base = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(name) : name.replace(/[^\x00-\x7F]/g, '').trim();
    base = base.replace(/\s*\(.*?\)$/, ''); 
    let strippedNum = base.replace(/\s*\d+$/, '');
    if (strippedNum.trim().length > 0) base = strippedNum;
    return base.trim().toLowerCase();
  }

  let routeIndex = 0;
  let i = 0;
  let legsAdded = 0;

  while (i < legsList.length - 1) {
    const currentLeg = legsList[i];
    const nextLeg = legsList[i + 1];
    
    if (isTerminalLeg(currentLeg) || (currentLeg.label && (currentLeg.label.includes('Departure') || currentLeg.label.includes('Start')))) { i++; continue; }
    if (isTerminalLeg(nextLeg) || (nextLeg.label && (nextLeg.label.includes('Return') || nextLeg.label.includes('Finish')))) break; 
    
    const currentBase = getBaseName(currentLeg.label);
    const nextBase = getBaseName(nextLeg.label);
    
    let foundCurrent = -1;
    for (let r = routeIndex; r < routeCities.length; r++) {
      if (routeCities[r].toLowerCase() === currentBase) {
        foundCurrent = r;
        break;
      }
    }
    
    if (foundCurrent !== -1) {
      let foundNext = -1;
      for (let r = foundCurrent + 1; r < routeCities.length; r++) {
        if (routeCities[r].toLowerCase() === nextBase) {
          foundNext = r;
          break;
        }
      }
      
      if (foundNext !== -1) {
        const missingCount = foundNext - foundCurrent - 1;
        if (missingCount > 0) {
          for (let m = 0; m < missingCount; m++) {
            const missingCity = routeCities[foundCurrent + 1 + m];
            legsList.splice(i + 1 + m, 0, {
              id: 'leg-' + Date.now() + Math.floor(Math.random()*1000) + m,
              label: missingCity,
              colour: '#808080',
              days: []
            });
            legsAdded++;
          }
          i += missingCount;
        }
        routeIndex = foundNext;
      }
    }
    i++;
  }

  // Check gap before Return
  const lastLeg = legsList[legsList.length - 2];
  if (lastLeg) {
    const lastBase = getBaseName(lastLeg.label);
    let foundLast = -1;
    for (let r = routeIndex; r < routeCities.length; r++) {
      if (routeCities[r].toLowerCase() === lastBase) {
        foundLast = r;
        break;
      }
    }
    if (foundLast !== -1 && foundLast < routeCities.length - 2) {
      const missingCount = routeCities.length - 2 - foundLast;
      if (missingCount > 0) {
        for (let m = 0; m < missingCount; m++) {
          const missingCity = routeCities[foundLast + 1 + m];
          legsList.splice(legsList.length - 1, 0, {
            id: 'leg-' + Date.now() + Math.floor(Math.random()*1000) + m + 'ret',
            label: missingCity,
            colour: '#808080',
            days: []
          });
          legsAdded++;
        }
      }
    }
  }

  // Numbering phase
  const cityCounts = {};
  legsList.forEach(leg => {
    if (leg.label && !isTerminalLeg(leg)) {
      const base = getBaseName(leg.label);
      cityCounts[base] = (cityCounts[base] || 0) + 1;
    }
  });

  const currentIndices = {};
  legsList.forEach(leg => {
    if (leg.label && !isTerminalLeg(leg)) {
      const base = getBaseName(leg.label);
      if (cityCounts[base] > 1) {
        currentIndices[base] = (currentIndices[base] || 0) + 1;
        // Check if there's an emoji to preserve
        const emojiMatch = leg.label.match(/^([^\x00-\x7F]+\s*)/);
        const prefix = emojiMatch ? emojiMatch[1] : '';
        const cleanLabel = leg.label.replace(/^([^\x00-\x7F]+\s*)/, '').replace(/\s*\(\d+\)$/, '').replace(/\s*\d+$/, '').trim();
        leg.label = `${prefix}${cleanLabel} (${currentIndices[base]})`;
      }
    }
  });

  return legsAdded;
}


function syncAllLegDays(silent = false, forceRebuild = false) {
  if (!silent) {
    if (!confirm('This will autonomously recalculate day cards for all legs based on your saved journeys and stays. Proceed?')) {
      return;
    }
  }
  
  const legsInjected = autoGenerateMissingTransitLegs(appData);
  if (legsInjected > 0 && typeof saveAppData === 'function') {
    // Force a render of the sidebar before continuing if it's the UI
    if (typeof renderSidebar === 'function') renderSidebar();
  }

  let changesMade = 0;
  const changelog = [];
  
  const formatShortDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch(e) {
      return String(d);
    }
  };

  function getBaseNameGlobal(name) {
    if (!name) return '';
    let base = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(name) : name.replace(/[^\x00-\x7F]/g, '').trim();
    base = base.replace(/\s*\(.*?\)$/, ''); 
    let strippedNum = base.replace(/\s*\d+$/, '');
    if (strippedNum.trim().length > 0) base = strippedNum;
    return base.trim().toLowerCase();
  }

  // Pre-calculate leg inferred mappings for journeys
  const sortedJourneysForMapping = (window.journeys || []).slice().sort((a,b) => {
    const aTime = (a.departureDate||a.date||'') + 'T' + (a.departureTime||'00:00');
    const bTime = (b.departureDate||b.date||'') + 'T' + (b.departureTime||'00:00');
    return aTime.localeCompare(bTime);
  });

  const homeCityName = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim().toLowerCase() : '';

  function legMatchesLocation(leg, locationStr, isArrival = false) {
    if (!leg || !locationStr) return false;
    const locNorm = String(locationStr).trim().toLowerCase();
    const isHomeLoc = locNorm === 'home' || locNorm === 'home city' || (homeCityName && locNorm === homeCityName);
    const legLabelNorm = String(leg.label || '').toLowerCase();
    const isStartLeg = leg.id === 'departure' || String(leg.id || '').endsWith('-start') || legLabelNorm.includes('(trip start)') || legLabelNorm.includes('start');
    const isFinishLeg = leg.id === 'return' || String(leg.id || '').endsWith('-finish') || legLabelNorm.includes('(trip finish)') || legLabelNorm.includes('finish') || legLabelNorm.includes('return');

    if (isHomeLoc) {
      if (isArrival && isFinishLeg) return true;
      if (!isArrival && isStartLeg) return true;
      return false;
    }

    const cityObj = typeof getCityByName === 'function' ? getCityByName(locationStr) : null;
    if (cityObj && leg.cityId && leg.cityId === cityObj.id) return true;

    const legCityObj = typeof getCityByName === 'function' ? getCityByName(leg.label) : null;
    if (cityObj && legCityObj && cityObj.id === legCityObj.id) return true;

    const locBase = getBaseNameGlobal(locationStr);
    const legBase = getBaseNameGlobal(leg.label);
    if (locBase && legBase && (locBase === legBase || legBase.includes(locBase) || locBase.includes(legBase))) return true;

    return false;
  }

  let currentToIdx = 0;
  sortedJourneysForMapping.forEach(j => {
    if (!j.toLocation) return;
    let foundTo = -1;
    for (let i = currentToIdx; i < appData.length; i++) {
      if (legMatchesLocation(appData[i], j.toLocation, true)) {
        foundTo = i;
        break;
      }
    }
    if (foundTo !== -1) {
      j._inferredToLegId = appData[foundTo].id;
      currentToIdx = foundTo;
    }
  });

  let currentFromIdx = 0;
  sortedJourneysForMapping.forEach(j => {
    if (!j.fromLocation) return;
    let foundFrom = -1;
    for (let i = currentFromIdx; i < appData.length; i++) {
      if (legMatchesLocation(appData[i], j.fromLocation, false)) {
        foundFrom = i;
        break;
      }
    }
    if (foundFrom !== -1) {
      j._inferredFromLegId = appData[foundFrom].id;
      currentFromIdx = foundFrom;
    }
  });

  // Pre-calculate leg inferred mappings for stays
  const sortedStaysForMapping = (window.stays || []).slice().sort((a,b) => (a.checkIn||'').localeCompare(b.checkIn||''));
  let currentStayIdx = 0;
  sortedStaysForMapping.forEach(s => {
    if (!s.city && !s.cityId) return;
    const stayCity = s.city || s.cityId.replace('city-', '');
    const stayBase = getBaseNameGlobal(stayCity);
    let foundStay = -1;
    for (let i = currentStayIdx; i < appData.length; i++) {
      if (appData[i].cityId === s.cityId || getBaseNameGlobal(appData[i].label) === stayBase || (typeof getCityByName === 'function' && getCityByName(appData[i].label)?.id === s.cityId)) {
        foundStay = i;
        break;
      }
    }
    if (foundStay !== -1) {
      s._inferredLegId = appData[foundStay].id;
      currentStayIdx = foundStay;
    }
  });

  appData.forEach(leg => {
    const rawCityName = leg.label;
    if (!rawCityName) return;
    const cleanCityName = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(rawCityName) : rawCityName.replace(/[^\x00-\x7F]/g, '').trim();
    const cityName = cleanCityName || rawCityName;
    
    const baseCityName = getBaseNameGlobal(rawCityName);
    const cityId = leg.cityId || ('city-' + baseCityName.replace(/[^a-z0-9]/g, '-'));

    const isTerminal = (typeof isTerminalLeg === 'function' && isTerminalLeg(leg)) || leg.type === 'start' || leg.type === 'return';
    const legStays = isTerminal ? [] : (window.stays || []).filter(s => 
      s._inferredLegId === leg.id || 
      (!s._inferredLegId && (
        (s.cityId && leg.cityId && s.cityId === leg.cityId) ||
        (s.cityId === cityId || (s.city && getBaseNameGlobal(s.city) === baseCityName)) ||
        (s.city && legMatchesLocation(leg, s.city, false))
      ))
    );
    
    // Ignore local intra-city transport by ensuring fromLocation !== toLocation
    const arrivingJourneys = (window.journeys || []).filter(j => 
      (j.fromLocation && j.toLocation && j.fromLocation.toLowerCase() !== j.toLocation.toLowerCase()) &&
      (j._inferredToLegId === leg.id || (!j._inferredToLegId && (j.legId === leg.id || !j.legId) && legMatchesLocation(leg, j.toLocation, true)))
    );
    const departingJourneys = (window.journeys || []).filter(j => 
      (j.fromLocation && j.toLocation && j.fromLocation.toLowerCase() !== j.toLocation.toLowerCase()) &&
      (j._inferredFromLegId === leg.id || (!j._inferredFromLegId && (j.legId === leg.id || !j.legId) && legMatchesLocation(leg, j.fromLocation, false)))
    );
    
    // Calculate precise date bounds: prioritize configured leg days if already present
    let earliestDate = null;
    let latestDate = null;

    const considerDate = (d) => {
      if (!d) return;
      const normalized = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(d) : d;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return;
      if (!earliestDate || normalized < earliestDate) earliestDate = normalized;
      if (!latestDate || normalized > latestDate) latestDate = normalized;
    };

    const existingStart = (Array.isArray(leg.days) && leg.days.length > 0) ? leg.days[0].date : null;
    const existingEnd = (Array.isArray(leg.days) && leg.days.length > 0) ? leg.days[leg.days.length - 1].date : null;

    const hasExistingDays = !forceRebuild && Boolean(existingStart);
    if (hasExistingDays) {
      // Retain the established leg date boundaries
      considerDate(existingStart);
      considerDate(existingEnd);
    } else {
      // For newly generated transit legs, empty legs, or when forceRebuild is requested:
      legStays.forEach(s => {
        considerDate(s.checkIn);
        if (s.checkOut) considerDate(s.checkOut);
      });
      arrivingJourneys.forEach(j => considerDate(j.arrivalDate || j.dayDate));
      departingJourneys.forEach(j => considerDate(j.departureDate || j.dayDate));

      // Fallback 1: if no journeys or stays found for this leg, retain existing days' bounds
      if (!earliestDate && existingStart) {
        considerDate(existingStart);
        considerDate(existingEnd);
      } else if (earliestDate && existingEnd && (!latestDate || latestDate < existingEnd)) {
        // If arriving journey established start date, but no departing journey/stay checkout was found,
        // preserve the leg's established duration/end date rather than collapsing to a single day
        if (departingJourneys.length === 0 && !legStays.some(s => s.checkOut)) {
          considerDate(existingEnd);
        }
      }

      // Fallback 2: For destination legs (city), check if next leg has an established start/departure date
      const legIdx = appData.indexOf(leg);
      if (leg.type === 'city' || (!leg.type && !isTerminalLeg(leg))) {
        if ((!latestDate || latestDate === earliestDate) && legIdx >= 0 && legIdx < appData.length - 1) {
          const nextLeg = appData[legIdx + 1];
          if (nextLeg && Array.isArray(nextLeg.days) && nextLeg.days.length > 0 && nextLeg.days[0].date) {
            const nextStart = nextLeg.days[0].date;
            if (nextStart >= (earliestDate || '')) {
              considerDate(nextStart);
            }
          }
        }
      }
    }

    if (!earliestDate) return;
    if (!latestDate) latestDate = earliestDate;

    let newDays = [];
    if (typeof buildLegDaysWithNotes === 'function') {
      const legIdx = appData.indexOf(leg);
      const prevLeg = legIdx > 0 ? appData[legIdx - 1] : null;
      const nextLeg = legIdx < appData.length - 1 ? appData[legIdx + 1] : null;
      const homeCity = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : 'Home';

      const arrivalFromCity = prevLeg
        ? (typeof getLegBaseCityName === 'function' ? getLegBaseCityName(prevLeg) : prevLeg.label) || homeCity
        : homeCity;
      const departureToCity = nextLeg
        ? (typeof getLegBaseCityName === 'function' ? getLegBaseCityName(nextLeg) : nextLeg.label) || homeCity
        : homeCity;

      newDays = buildLegDaysWithNotes({
        dateFrom: earliestDate,
        dateTo: latestDate,
        fromCity: (leg.type === 'start') ? homeCity : (arrivalFromCity || cityName),
        toCity: (leg.type === 'return') ? homeCity : (departureToCity || cityName),
        legType: leg.type || 'city',
        dayNotes: []
      });

      // Update departure direction on last day of multi-day city stay
      if (newDays.length > 1 && (!leg.type || leg.type === 'city')) {
        newDays[newDays.length - 1].to = departureToCity;
      }
    }

    const formatShortDate = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // 1. Handle Arrival Overlaps
    arrivingJourneys.forEach(j => {
      const arrDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(j.arrivalDate || j.dayDate) : (j.arrivalDate || j.dayDate);
      if (!arrDate) return;
      
      const fromCity = j.fromLocation || 'Previous Destination';
      
      let dayIndex = newDays.findIndex(d => d.date === arrDate);
      if (dayIndex !== -1) {
        newDays[dayIndex].from = fromCity; // Sets "Paris -> Rome" travel indicator in header
        newDays[dayIndex].desc = `Arrive from ${fromCity}` + (j.provider ? ` via ${j.provider}` : '');
        changelog.push(`Updated arrival day (${formatShortDate(arrDate)}) in ${cityName} with travel from ${fromCity}`);
      } else if (!hasExistingDays) {
        newDays.push({
          date: arrDate,
          day: new Date(arrDate).toLocaleDateString('en-US', { weekday: 'short' }),
          from: fromCity,
          to: cityName,
          accom: '—',
          desc: `Arrive from ${fromCity}` + (j.provider ? ` via ${j.provider}` : ''),
          completed: false,
          accomCost: '0',
          activityCost: '0',
          accomItems: [{ text: '—', cost: '0', status: 'pending', bookingRef: '', cityId: cityId }],
          activityItems: []
        });
        changelog.push(`Added arrival day (${formatShortDate(arrDate)}) in ${cityName} from ${fromCity}`);
      }
    });

    // 2. Handle Departure Overlaps
    departingJourneys.forEach(j => {
      const depDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(j.departureDate || j.dayDate) : (j.departureDate || j.dayDate);
      if (!depDate) return;
      
      const toCity = j.toLocation || 'Next Destination';
      
      let dayIndex = newDays.findIndex(d => d.date === depDate);
      if (dayIndex !== -1) {
        newDays[dayIndex].to = toCity;
        newDays[dayIndex].desc = `Depart for ${toCity}` + (j.provider ? ` via ${j.provider}` : '');
        changelog.push(`Updated departure day (${formatShortDate(depDate)}) in ${cityName} with travel to ${toCity}`);
      } else if (!hasExistingDays) {
        newDays.push({
          date: depDate,
          day: new Date(depDate).toLocaleDateString('en-US', { weekday: 'short' }),
          from: cityName,
          to: toCity,
          accom: '—',
          desc: `Depart for ${toCity}` + (j.provider ? ` via ${j.provider}` : ''),
          completed: false,
          accomCost: '0',
          activityCost: '0',
          accomItems: [{ text: '—', cost: '0', status: 'pending', bookingRef: '', cityId: cityId }],
          activityItems: []
        });
        changelog.push(`Added departure day (${formatShortDate(depDate)}) to ${cityName} for travel to ${toCity}`);
      }
    });

    newDays.sort((a, b) => a.date.localeCompare(b.date));

    // Preserve existing notes
    if (Array.isArray(leg.days)) {
      newDays.forEach(nd => {
        const oldDay = leg.days.find(od => od.date === nd.date);
        if (oldDay) {
          // Preserve custom day routing (from / to) unless forceRebuild is active
          if (oldDay.from && !forceRebuild) {
            const cleanFrom = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(oldDay.from) : oldDay.from;
            nd.from = cleanFrom || oldDay.from;
          }
          if (oldDay.to && !forceRebuild) {
            const cleanTo = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(oldDay.to) : oldDay.to;
            nd.to = cleanTo || oldDay.to;
          }
          // Keep old notes if user had custom text, except if it was just an old travel generic string
          if (oldDay.desc && !nd.desc.startsWith('Depart for') && !nd.desc.startsWith('Arrive from') && !oldDay.desc.startsWith('Depart for') && !oldDay.desc.startsWith('Arrive from')) {
            nd.desc = oldDay.desc;
          }
          if (oldDay.accomItems) nd.accomItems = oldDay.accomItems;
          if (oldDay.activityItems) nd.activityItems = oldDay.activityItems;
          if (oldDay.transportItems) nd.transportItems = oldDay.transportItems;
          if (oldDay.notes) nd.notes = oldDay.notes;
          if (typeof oldDay.completed !== 'undefined') nd.completed = oldDay.completed;
        }
      });
    }

    // Check if lengths differ
    if (!leg.days || leg.days.length !== newDays.length) {
      if (!changelog.some(log => log.includes(`Added`) && log.includes(cityName))) {
         changelog.push(`Rebuilt ${newDays.length} day(s) for ${cityName}`);
      }
      changesMade++;
    } else {
      // Check for structural changes
      const structuralChange = leg.days.some((od, i) => od.from !== newDays[i].from || od.to !== newDays[i].to || od.date !== newDays[i].date);
      if (structuralChange) changesMade++;
    }

    leg.days = newDays;
  });

  if (changesMade > 0 || changelog.length > 0) {
    if (typeof saveData === 'function') saveData();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof closeAddLegDialog === 'function') closeAddLegDialog();
    
    if (!silent) {
      // Display Modal
      const modal = document.getElementById('sync-results-modal');
      if (modal) {
        document.getElementById('sync-results-summary').textContent = `Successfully synced days based on your latest journeys.`;
        const logContainer = document.getElementById('sync-results-log');
        if (changelog.length > 0) {
          logContainer.textContent = changelog.map(line => '• ' + line).join('\n');
        } else {
          logContainer.textContent = 'Dates re-aligned properly. No major day overrides needed.';
        }
        modal.style.display = 'flex';
      } else {
        alert('Successfully synced legs!\n\n' + changelog.map(line => '• ' + line).join('\n'));
      }
    }
  } else {
    if (!silent) {
      alert('No changes were needed. Day cards are already in sync with journeys and stays.');
    }
  }
}

// Comprehensive rebuild of itinerary, mappings, dates, airport codes, and views

function rebuildItineraryAndDataMappings(options = {}) {
  const showToastNotification = options.showToast !== false;

  // 1. Normalize trip data mappings
  if (typeof normalizeTripCitiesDateData === 'function' && typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    citiesData = normalizeTripCitiesDateData(citiesData);
  }
  if (typeof normalizeTripLegsData === 'function' && typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData = normalizeTripLegsData(appData);
  }
  if (typeof normalizeTripJourneysData === 'function' && typeof journeys !== 'undefined' && Array.isArray(journeys)) {
    journeys = normalizeTripJourneysData(journeys);
  }
  if (typeof normalizeTripStaysData === 'function' && typeof stays !== 'undefined' && Array.isArray(stays)) {
    stays = normalizeTripStaysData(stays);
  }

  // 2. Ensure airport codes (IATA & ICAO) and countries are populated for all cities
  if (typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    citiesData.forEach(city => {
      if (city && city.name) {
        if (!city.code && typeof getCityIataCode === 'function') {
          const iata = getCityIataCode(city.name);
          if (iata) city.code = iata;
        }
        if (!city.icaoCode && typeof getCityIcaoCode === 'function') {
          const icao = getCityIcaoCode(city.name);
          if (icao) city.icaoCode = icao;
        }
      }
    });
  }

  // 2.5 Ensure terminal legs and routing are valid
  if (typeof enforceTerminalLegs === 'function' && Array.isArray(appData)) {
    enforceTerminalLegs(appData);
  }
  if (options.forceRebuild === true && typeof rebuildLegRouting === 'function' && Array.isArray(appData)) {
    rebuildLegRouting(appData);
  }

  // 3. Sync all leg days with latest journeys and stays
  if (typeof syncAllLegDays === 'function') {
    syncAllLegDays(true, options.forceRebuild === true); // silent sync
  }

  // 4. Persist data
  if (typeof saveData === 'function') {
    saveData(false);
  }

  // 5. Re-render UI components and dropdowns
  if (typeof populateCityList === 'function') {
    populateCityList();
  }
  if (typeof _populateAddLegCityDropdowns === 'function') {
    _populateAddLegCityDropdowns();
  }
  if (typeof _populateJourneyCityDropdowns === 'function') {
    _populateJourneyCityDropdowns();
  }
  if (typeof buildNav === 'function') {
    buildNav();
  }
  if (typeof buildCityNav === 'function') {
    buildCityNav();
  }
  if (typeof rebuildItineraryPreservingScroll === 'function') {
    rebuildItineraryPreservingScroll();
  } else if (typeof buildItinerary === 'function') {
    buildItinerary();
  }
  if (typeof buildTransportTab === 'function') {
    buildTransportTab();
  }
  if (typeof buildAccomTab === 'function') {
    buildAccomTab();
  }
  if (typeof buildJourneyMap === 'function') {
    buildJourneyMap();
  }
  if (typeof buildDesktopSplitMap === 'function') {
    buildDesktopSplitMap();
  }

  if (showToastNotification && typeof showToast === 'function') {
    showToast(options.message || 'Itinerary & mappings rebuilt successfully');
  }

  return true;
}

if (typeof window !== 'undefined') window.rebuildItineraryAndDataMappings = rebuildItineraryAndDataMappings;

/**
 * Full trip rebuild pipeline. Fixes routing, re-syncs days from transport/stays,
 * normalizes all data, and re-renders.
 * @param {Object} options
 * @param {boolean} options.showToast
 * @param {string} options.message
 * @param {boolean} options.forceRebuildDays - If true, forces day card rebuild from transport/stays
 */

function rebuildTripFromLegs(options = {}) {
  const { showToast: doToast = true, message, forceRebuildDays = false } = options;
  
  if (typeof normalizeTripLegsData === 'function' && Array.isArray(appData)) appData = normalizeTripLegsData(appData);
  if (typeof normalizeTripJourneysData === 'function' && typeof journeys !== 'undefined' && Array.isArray(journeys)) journeys = normalizeTripJourneysData(journeys);
  if (typeof normalizeTripStaysData === 'function' && typeof stays !== 'undefined' && Array.isArray(stays)) stays = normalizeTripStaysData(stays);
  
  if (typeof enforceTerminalLegs === 'function' && Array.isArray(appData)) enforceTerminalLegs(appData);
  if (typeof rebuildLegRouting === 'function' && Array.isArray(appData)) rebuildLegRouting(appData);
  
  if (typeof syncAllLegDays === 'function') syncAllLegDays(true, forceRebuildDays);
  if (typeof rebuildLegRouting === 'function' && Array.isArray(appData)) rebuildLegRouting(appData);
  
  if (typeof migrateJourneyCityIds === 'function') migrateJourneyCityIds();
  if (typeof sortLegs === 'function') sortLegs();
  if (typeof saveData === 'function') saveData(false);
  
  if (typeof populateCityList === 'function') populateCityList();
  if (typeof _populateAddLegCityDropdowns === 'function') _populateAddLegCityDropdowns();
  if (typeof buildNav === 'function') buildNav();
  if (typeof buildCityNav === 'function') buildCityNav();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
  if (typeof buildTransportTab === 'function') buildTransportTab();
  if (typeof buildAccomTab === 'function') buildAccomTab();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
  if (typeof buildDesktopSplitMap === 'function') buildDesktopSplitMap();
  
  if (doToast && typeof showToast === 'function') {
    showToast(message || 'Trip route & itinerary rebuilt successfully!');
  }
  return true;
}
if (typeof window !== 'undefined') window.rebuildTripFromLegs = rebuildTripFromLegs;



function cascadeStagedLegDates(fromIdx = 1) {
  const legState = getLegDialogState();
  if (!legState || !Array.isArray(legState.stagedLegs) || legState.stagedLegs.length === 0) return;
  const legs = legState.stagedLegs;

  const start = Math.max(1, fromIdx);
  for (let i = start; i < legs.length; i++) {
    const prevLeg = legs[i - 1];
    if (!prevLeg || !prevLeg.days || prevLeg.days.length === 0) continue;
    const currentStart = prevLeg.days[prevLeg.days.length - 1].date;
    const leg = legs[i];
    const duration = Math.max(1, Array.isArray(leg.days) ? leg.days.length : 1);
    const currentEnd = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(currentStart, duration - 1) : currentStart;

    if (!Array.isArray(leg.days) || leg.days.length === 0) {
      leg.days = buildLegDaysWithNotes({
        dateFrom: currentStart,
        dateTo: currentEnd,
        fromCity: leg.label || 'Home',
        toCity: leg.label || 'Home',
        legType: 'city',
        dayNotes: []
      });
    } else {
      leg.days.forEach((day, dIdx) => {
        const dDate = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(currentStart, dIdx) : currentStart;
        day.date = dDate;
        day.day = getWeekdayLabelForTripDate(dDate);
      });
    }
  }
}


function checkLegDateClash(s1, e1, s2, e2) {
  if (!s1 || !e1 || !s2 || !e2) return false;
  if (s1 === s2 && e1 === e2) {
    return s1 !== e1; // Same-day legs on the same date do not clash; exact duplicate multi-day ranges clash
  }
  if (s1 < e2 && e1 > s2) {
    if (e1 === s2 || e2 === s1) {
      return false;
    }
    return true;
  }
  return false;
}


function parseLegDayNotes() {
  const raw = document.getElementById('legDayNotesInput')?.value || '';
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}


function buildLegDaysWithNotes({ dateFrom, dateTo, fromCity, toCity, legType, dayNotes }) {
  const normalizedFrom = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateFrom) : dateFrom;
  const normalizedTo = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateTo) : dateTo;
  const validFrom = /^\d{4}-\d{2}-\d{2}$/.test(normalizedFrom || '');
  const validTo = /^\d{4}-\d{2}-\d{2}$/.test(normalizedTo || '');
  const cleanFromCity = (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(fromCity) : fromCity) || 'Home';
  const cleanToCity = (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(toCity) : toCity) || 'Home';
  const defaultFirstDesc = legType === 'start' ? 'Departure day' : (legType === 'return' ? 'Return home' : (legType === 'transit' ? `Transit stop in ${cleanToCity}` : 'Travel and arrival day'));

  if (!validFrom || !validTo) {
    return [
      {
        date: validFrom ? normalizedFrom : (typeof getTripStartDate === 'function' ? getTripStartDate() : '2026-06-08'),
        day: typeof getWeekdayLabelForTripDate === 'function' ? getWeekdayLabelForTripDate(validFrom ? normalizedFrom : '2026-06-08') : 'Mon',
        from: cleanFromCity,
        to: cleanToCity,
        completed: false,
        desc: (dayNotes && dayNotes[0]) || defaultFirstDesc,
        transportItems: [{ text: "Add transport...", cost: "0" }],
        accomItems: [{ text: "—", cost: "0", status: "pending", bookingRef: "" }],
        activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
      }
    ];
  }

  const days = [];
  let cur = normalizedFrom;
  let dayIdx = 0;

  while (cur <= normalizedTo) {
    const isFirstDay = dayIdx === 0;
    const isLastDay = cur === normalizedTo;
    let desc = (dayNotes && dayNotes[dayIdx]) ? dayNotes[dayIdx] : '';
    if (!desc) {
      if (isFirstDay) desc = defaultFirstDesc;
      else if (isLastDay && legType === 'city') desc = 'Final day and departure prep';
      else if (legType === 'transit') desc = `Transit stop in ${cleanToCity}`;
      else desc = `Explore ${cleanToCity || 'city'}`;
    }

    days.push({
      date: cur,
      day: typeof getWeekdayLabelForTripDate === 'function' ? getWeekdayLabelForTripDate(cur) : 'Mon',
      from: ((legType === 'start' || legType === 'city' || legType === 'transit') && !isFirstDay) ? cleanToCity : cleanFromCity,
      to: cleanToCity,
      completed: false,
      desc: desc,
      transportItems: isFirstDay ? [{ text: "Add transport...", cost: "0" }] : [],
      accomItems: [{ text: "—", cost: "0", status: "pending", bookingRef: "" }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
    });

    if (cur === normalizedTo) break;
    cur = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(cur, 1) : cur;
    dayIdx++;
  }

  return days;
}


function checkDateConflict(dateStr, excludeLegIdx) {
  // Check for date conflicts across all legs
  const targetAppData = (typeof global !== 'undefined' && Array.isArray(global.appData) && global.appData.length > 0)
    ? global.appData
    : ((typeof appData !== 'undefined' && Array.isArray(appData) && appData.length > 0)
      ? appData
      : ((typeof window !== 'undefined' && Array.isArray(window.appData)) ? window.appData : (typeof appData !== 'undefined' ? appData : [])));

  for (let i = 0; i < targetAppData.length; i++) {
    if (excludeLegIdx !== undefined && i === excludeLegIdx) continue;
    const leg = targetAppData[i];
    if (!leg || !leg.days || leg.days.length === 0) continue;
    for (const day of leg.days) {
      if (day.date === dateStr) {
        return { legIndex: i, legLabel: leg.label, day: day };
      }
    }
  }
  return null;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


function getWeekdayLabelForTripDate(dateStr) {
  const normalized = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateStr) : dateStr;
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return 'Mon';

  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Mon';
  return WEEKDAY_LABELS[date.getDay()];
}


function cloneDayItems(items) {
  return Array.isArray(items) ? JSON.parse(JSON.stringify(items)) : [];
}


function createLegDayTemplate(sourceDay, dateStr) {
  const anchorCity = sourceDay?.to || sourceDay?.from || 'Home';
  const isStayDay = sourceDay?.from === sourceDay?.to;
  const day = {
    date: dateStr,
    day: getWeekdayLabelForTripDate(dateStr),
    from: anchorCity,
    to: anchorCity,
    completed: false,
    desc: isStayDay
      ? `Additional day in ${anchorCity}`
      : `Additional day in ${anchorCity}`,
    transportItems: [],
    accomItems: cloneDayItems(sourceDay?.accomItems),
    activityItems: []
  };

  if (day.accomItems.length === 0) {
    day.accomItems = [{ text: 'Add accommodation...', cost: '0', status: 'pending', bookingRef: '', done: false }];
  }

  if (isStayDay && Array.isArray(sourceDay?.activityItems) && sourceDay.activityItems.length > 0) {
    day.activityItems = cloneDayItems(sourceDay.activityItems);
  } else {
    day.activityItems = [{ text: 'Explore local area', cost: '0', time: '1 hr', done: false }];
  }

  return day;
}


function adjustLegDays(legIdx, delta) {
  const leg = appData[legIdx];
  if (!leg || !Array.isArray(leg.days) || leg.days.length === 0) return;

  if (delta === 0) return;

  // Capture original dates of all legs before mutation
  const origDates = {};
  appData.forEach((l, idx) => {
    if (l && Array.isArray(l.days) && l.days.length > 0) {
      if (!l.id) l.id = 'leg_' + (idx + 1);
      origDates[l.id] = {
        startDate: l.days[0].date,
        endDate: l.days[l.days.length - 1].date
      };
    }
  });

  if (delta > 0) {
    const lastDay = leg.days[leg.days.length - 1];
    const lastDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(lastDay.date) : lastDay.date;
    const nextDate = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(lastDate, delta) : '';

    if (!nextDate) {
      alert('Could not calculate the next day for this leg.');
      return;
    }

    const conflict = checkDateConflict(nextDate, legIdx);
    if (conflict) {
      const conflictDate = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(nextDate) : nextDate;
      const confirmFn = typeof confirm === 'function' ? confirm : (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm : () => true);
      const proceed = confirmFn(
        `Adding a day to ${leg.label} creates a date overlap on ${conflictDate} with ${conflict.legLabel}. Subsequent legs will be readjusted. Continue anyway?`
      );
      if (!proceed) return;
    }

    for (let s = 0; s < delta; s++) {
      const curLastDay = leg.days[leg.days.length - 1];
      const curLastDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(curLastDay.date) : curLastDay.date;
      const curNextDate = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(curLastDate, 1) : '';
      if (!curNextDate) break;
      leg.days.push(createLegDayTemplate(curLastDay, curNextDate));
    }

    // Cascade all subsequent legs forward by delta days
    for (let i = legIdx + 1; i < appData.length; i++) {
      const nextLeg = appData[i];
      if (!nextLeg || !Array.isArray(nextLeg.days)) continue;
      nextLeg.days.forEach(day => {
        if (day.date && typeof addDaysToIsoDate === 'function') {
          day.date = addDaysToIsoDate(day.date, delta);
          day.day = getWeekdayLabelForTripDate(day.date);
        }
      });
    }

    syncStaysAndJourneysFromDateChanges(origDates, appData);
    saveData();
    if (typeof sortLegs === 'function') sortLegs();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildCityNav === 'function') buildCityNav();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
    return;
  }

  // delta < 0
  if (leg.days.length <= Math.abs(delta)) {
    const confirmFn = typeof confirm === 'function' ? confirm : (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm : () => true);
    const proceed = confirmFn(`Removing the only day from ${leg.label} will delete the entire leg. Continue?`);
    if (!proceed) return;
    deleteLeg(legIdx);
    return;
  }

  const removeCount = Math.min(Math.abs(delta), leg.days.length - 1);
  for (let s = 0; s < removeCount; s++) {
    leg.days.pop();
  }

  // Cascade all subsequent legs backward by delta days (delta is negative)
  for (let i = legIdx + 1; i < appData.length; i++) {
    const nextLeg = appData[i];
    if (!nextLeg || !Array.isArray(nextLeg.days)) continue;
    nextLeg.days.forEach(day => {
      if (day.date && typeof addDaysToIsoDate === 'function') {
        day.date = addDaysToIsoDate(day.date, delta);
        day.day = getWeekdayLabelForTripDate(day.date);
      }
    });
  }

  syncStaysAndJourneysFromDateChanges(origDates, appData);
  saveData();
  if (typeof sortLegs === 'function') sortLegs();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildCityNav === 'function') buildCityNav();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
}


function syncStaysAndJourneysFromDateChanges(origLegDates, targetLegs) {
  if (!origLegDates || !Array.isArray(targetLegs)) return;

  const getDaysDiff = (d1, d2) => {
    if (!d1 || !d2) return 0;
    const t1 = new Date(`${d1}T00:00:00`).getTime();
    const t2 = new Date(`${d2}T00:00:00`).getTime();
    return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  };

  const getBaseName = (name) => {
    if (!name) return '';
    let base = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(name) : name.replace(/[^\x00-\x7F]/g, '').trim();
    base = base.replace(/\s*\(.*?\)$/, '');
    let strippedNum = base.replace(/\s*\d+$/, '');
    if (strippedNum.trim().length > 0) base = strippedNum;
    return base.trim().toLowerCase();
  };

  const shiftedStays = new Set();
  const shiftedJourneys = new Set();

  targetLegs.forEach(leg => {
    if (!leg || !leg.id || !Array.isArray(leg.days) || leg.days.length === 0) return;
    const original = origLegDates[leg.id];
    if (!original || !original.startDate) return;

    const newStart = leg.days[0].date;
    const deltaDays = getDaysDiff(original.startDate, newStart);
    if (deltaDays === 0) return;

    const baseCityName = getBaseName(leg.label);
    const cityId = 'city-' + baseCityName.replace(/[^a-z0-9]/g, '-');

    // 1. Remap Stays
    if (typeof window !== 'undefined' && Array.isArray(window.stays)) {
      window.stays.forEach(s => {
        if (shiftedStays.has(s)) return;
        const matchesLeg = s._inferredLegId === leg.id ||
          s.legId === leg.id ||
          (!s._inferredLegId && !s.legId && (s.cityId === cityId || (s.city && getBaseName(s.city) === baseCityName)));
        if (matchesLeg) {
          shiftedStays.add(s);
          if (s.checkIn && typeof addDaysToIsoDate === 'function') s.checkIn = addDaysToIsoDate(s.checkIn, deltaDays);
          if (s.checkOut && typeof addDaysToIsoDate === 'function') s.checkOut = addDaysToIsoDate(s.checkOut, deltaDays);
          if (s.startDate && typeof addDaysToIsoDate === 'function') s.startDate = addDaysToIsoDate(s.startDate, deltaDays);
          if (s.endDate && typeof addDaysToIsoDate === 'function') s.endDate = addDaysToIsoDate(s.endDate, deltaDays);
        }
      });
    }

    // 2. Remap Journeys (both departing journeys and inbound transition journeys)
    if (typeof window !== 'undefined' && Array.isArray(window.journeys)) {
      window.journeys.forEach(j => {
        if (shiftedJourneys.has(j)) return;
        const matchesLeg = j.legId === leg.id ||
          j._inferredFromLegId === leg.id ||
          j._inferredToLegId === leg.id ||
          (!j._inferredFromLegId && (j.fromCityId === cityId || (j.fromLocation && getBaseName(j.fromLocation) === baseCityName))) ||
          (!j._inferredToLegId && (j.toCityId === cityId || (j.toLocation && getBaseName(j.toLocation) === baseCityName)));
        if (matchesLeg) {
          shiftedJourneys.add(j);
          if (j.departureDate && typeof addDaysToIsoDate === 'function') j.departureDate = addDaysToIsoDate(j.departureDate, deltaDays);
          if (j.arrivalDate && typeof addDaysToIsoDate === 'function') j.arrivalDate = addDaysToIsoDate(j.arrivalDate, deltaDays);
          if (j.dayDate && typeof addDaysToIsoDate === 'function') j.dayDate = addDaysToIsoDate(j.dayDate, deltaDays);
          if (j.startDate && typeof addDaysToIsoDate === 'function') j.startDate = addDaysToIsoDate(j.startDate, deltaDays);
          if (j.endDate && typeof addDaysToIsoDate === 'function') j.endDate = addDaysToIsoDate(j.endDate, deltaDays);
        }
      });
    }

    // 3. Remap Activity Items inside the shifted leg's days
    leg.days.forEach(day => {
      if (Array.isArray(day.activityItems)) {
        day.activityItems.forEach(act => {
          act.startDate = day.date;
          act.endDate = day.date;
          act.assignedDate = day.date;
        });
      }
    });
    if (Array.isArray(leg.suggestedActivities)) {
      leg.suggestedActivities.forEach(act => {
        if (Number.isFinite(act.assignedDayIdx) && leg.days[act.assignedDayIdx]) {
          act.assignedDate = leg.days[act.assignedDayIdx].date;
          act.startDate = act.assignedDate;
          act.endDate = act.assignedDate;
        }
      });
    }
  });
}


// Global & CommonJS Export Bridge
const _legEngineExports = {
  WEEKDAY_LABELS,
  regenerateItineraryFromJourneys,
  isTerminalLeg,
  getLegBaseCityName,
  getPriorLegCity,
  enforceTerminalLegs,
  rebuildLegRouting,
  autoGenerateMissingTransitLegs,
  syncAllLegDays,
  rebuildItineraryAndDataMappings,
  rebuildTripFromLegs,
  cascadeStagedLegDates,
  checkLegDateClash,
  parseLegDayNotes,
  buildLegDaysWithNotes,
  checkDateConflict,
  getWeekdayLabelForTripDate,
  cloneDayItems,
  createLegDayTemplate,
  adjustLegDays,
  syncStaysAndJourneysFromDateChanges
};

if (typeof window !== 'undefined') {
  Object.assign(window, _legEngineExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _legEngineExports;
}
