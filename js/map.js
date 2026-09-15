// Journey Map Module - Visualizes trip route using Leaflet.js
let mainMap = null;
let mapMarkers = [];
let mapPolylines = [];

function getCityCoords(cityName) {
  if (!cityName) return null;
  const clean = cityName.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim();
  
  // Try to find the city in citiesData (the source of truth)
  if (typeof citiesData !== 'undefined') {
    const city = citiesData.find(c => c.name.toLowerCase() === clean.toLowerCase());
    if (city && city.lat !== undefined && city.lng !== undefined && city.lat !== null) {
      return { lat: city.lat, lng: city.lng };
    }
  }
  
  // Fallback: Check built-in database (defined in data.js)
  if (typeof ALL_CITIES !== 'undefined') {
    const match = ALL_CITIES.find(c => c.name.toLowerCase() === clean.toLowerCase());
    if (match && match.lat) return { lat: match.lat, lng: match.lng };
  }

  return null;
}

function getMapCityKey(cityName) {
  return String(cityName || '').trim().toLowerCase();
}

function getMapCityId(cityName) {
  if (typeof getCityByName === 'function') {
    const city = getCityByName(cityName);
    if (city && city.id) return city.id;
  }
  return 'city-' + String(cityName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * Collects all path stops from trip legs (appData) and journeys.
 */
function collectPathStops() {
  const pathStops = [];

  if (typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData.forEach((leg, legIndex) => {
      const legBaseScore = typeof getLegDateScore === 'function' ? getLegDateScore(leg, legIndex) : legIndex * 10000;

      const labelCity = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(leg.label) : (leg.label ? leg.label.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim() : '');
      const labelAlreadyInDayRoute = labelCity && (leg.days || []).some(day =>
          (day.from && day.from.toLowerCase() === labelCity.toLowerCase()) ||
          (day.to && day.to.toLowerCase() === labelCity.toLowerCase())
      );

      (leg.days || []).forEach((day, dayIndex) => {
        const dayScore = typeof getTimelineScore === 'function' ? getTimelineScore(day.date, '', legBaseScore + dayIndex * 10) : legBaseScore + dayIndex * 10;

        if (day.from && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(day.from))) {
          pathStops.push({ id: getMapCityId(day.from), name: day.from, score: dayScore, isTransit: false, color: leg.colour || '#3498DB' });
        }

        if (labelCity && !labelAlreadyInDayRoute && dayIndex === 0) {
           pathStops.push({ id: getMapCityId(labelCity), name: labelCity, score: dayScore + 0.5, isTransit: true, color: leg.colour || '#95a5a6' });
        }

        if (day.to && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(day.to))) {
          pathStops.push({ id: getMapCityId(day.to), name: day.to, score: dayScore + 1, isTransit: false, color: leg.colour || '#3498DB' });
        }
      });
    });
  }

  if (typeof journeys !== 'undefined' && Array.isArray(journeys)) {
    journeys.forEach((journey, journeyIndex) => {
      const depScore = typeof getTimelineScore === 'function' ? getTimelineScore(journey.departureDate || journey.dayDate, journey.departureTime, Number.MAX_SAFE_INTEGER - 20000 + journeyIndex) : Number.MAX_SAFE_INTEGER - 20000 + journeyIndex;
      const arrScore = typeof getTimelineScore === 'function' ? getTimelineScore(journey.arrivalDate || journey.dayDate || journey.departureDate, journey.arrivalTime, depScore + 1) : depScore + 1;
      const fromCity = typeof getCityByName === 'function' ? getCityByName(journey.fromLocation) : null;
      const toCity = typeof getCityByName === 'function' ? getCityByName(journey.toLocation) : null;

      if (fromCity?.isTransit === true && journey.fromLocation && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(journey.fromLocation))) {
        pathStops.push({ id: getMapCityId(journey.fromLocation), name: journey.fromLocation, score: depScore, isTransit: true, color: '#95a5a6' });
      }
      if (toCity?.isTransit === true && journey.toLocation && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(journey.toLocation))) {
        pathStops.push({ id: getMapCityId(journey.toLocation), name: journey.toLocation, score: arrScore, isTransit: true, color: '#95a5a6' });
      }
    });
  }

  pathStops.sort((a, b) => a.score - b.score);
  return pathStops;
}

/**
 * Deduplicates adjacent path stops into a sequential travel route.
 */
function buildTravelSequence(pathStops) {
  const travelSequence = [];
  pathStops.forEach(stop => {
    if (travelSequence.length === 0) {
      travelSequence.push(stop);
    } else {
      const lastStop = travelSequence[travelSequence.length - 1];
      if (lastStop.name.toLowerCase() !== stop.name.toLowerCase()) {
        travelSequence.push(stop);
      } else {
        if (!stop.isTransit && lastStop.isTransit) {
          lastStop.isTransit = false;
          lastStop.color = stop.color;
        }
      }
    }
  });
  return travelSequence;
}

/**
 * Builds mapped destinations and identifies unmatched cities based on travel sequence and city data.
 */
function buildMapDestinations(travelSequence) {
  const unmatchedCities = [];
  const destinations = [];
  const stopDataMap = new Map();

  travelSequence.forEach((stop, index) => {
    const key = getMapCityKey(stop.name);
    if (!key) return;

    if (!stopDataMap.has(key)) {
      stopDataMap.set(key, {
        id: stop.id,
        name: stop.name,
        color: stop.color,
        isTransit: stop.isTransit,
        visitIndexes: [index + 1]
      });
    } else {
      const existing = stopDataMap.get(key);
      existing.visitIndexes.push(index + 1);
      if (!stop.isTransit && existing.isTransit) {
        existing.isTransit = false;
        existing.color = stop.color;
      }
    }
  });

  const citiesInOrder = typeof getCitiesInTravelOrder === 'function' ? getCitiesInTravelOrder() : [];
  const orderedCities = citiesInOrder.length > 0
      ? citiesInOrder
      : Array.from(stopDataMap.values()).map(stop => ({ id: stop.id, name: stop.name, colour: stop.color, isTransit: stop.isTransit }));

  orderedCities.forEach(city => {
    const key = getMapCityKey(city.name);
    const stopInfo = stopDataMap.get(key);
    if (!stopInfo) return;

    const coords = getCityCoords(city.name);
    if (!coords) {
      if (!unmatchedCities.includes(city.name)) unmatchedCities.push(city.name);
      return;
    }

    destinations.push({
      id: city.id || stopInfo.id,
      name: city.name,
      lat: coords.lat,
      lng: coords.lng,
      color: city.colour || stopInfo.color,
      isTransit: city.isTransit === true || stopInfo.isTransit,
      index: destinations.length + 1,
      visitIndexes: stopInfo.visitIndexes
    });
  });

  return { destinations, unmatchedCities };
}

/**
 * Draws transport-aware polyline segments on the Leaflet map between sequential stops.
 */
function drawMapPolylines(travelSequence) {
  const polylinePoints = [];

  for (let i = 0; i < travelSequence.length - 1; i++) {
    const fromStop = travelSequence[i];
    const toStop = travelSequence[i + 1];

    const fromCoords = getCityCoords(fromStop.name);
    const toCoords = getCityCoords(toStop.name);

    if (fromCoords && toCoords) {
      if (i === 0) polylinePoints.push([fromCoords.lat, fromCoords.lng]);
      polylinePoints.push([toCoords.lat, toCoords.lng]);

      // Find transport linking these two
      let matchedJourney = null;
      if (typeof journeys !== 'undefined' && Array.isArray(journeys)) {
         matchedJourney = journeys.find(j => {
           const jFrom = getMapCityKey(j.fromLocation || j.from);
           const jTo = getMapCityKey(j.toLocation || j.to);
           const sFrom = getMapCityKey(fromStop.name);
           const sTo = getMapCityKey(toStop.name);
           return jFrom === sFrom && jTo === sTo;
         });
      }

      let lineColor = '#FF6B6B'; // default
      let dashArray = '10, 10';
      let weight = 3;

      if (matchedJourney) {
         const method = String(matchedJourney.transportType || '').toLowerCase();
         if (method === 'flight') {
            lineColor = '#3b82f6'; // blue
            dashArray = '8, 8';
         } else if (method === 'train') {
            lineColor = '#22c55e'; // green
            dashArray = null;
         } else if (method === 'bus' || method === 'coach') {
            lineColor = '#f97316'; // orange
            dashArray = null;
         } else if (method === 'car' || method === 'drive') {
            lineColor = '#64748b'; // slate
            dashArray = null;
         } else {
            lineColor = '#8b5cf6'; // purple fallback
            dashArray = '5, 5';
         }
      }

      const polyline = L.polyline([
        [fromCoords.lat, fromCoords.lng],
        [toCoords.lat, toCoords.lng]
      ], {
        color: lineColor,
        weight: weight,
        dashArray: dashArray,
        opacity: 0.8
      }).addTo(mainMap);

      let popupHtml = '<div style="font-family: inherit; padding: 2px;">';
      if (matchedJourney) {
         const method = matchedJourney.transportType || 'Transport';
         const mCap = method.charAt(0).toUpperCase() + method.slice(1);
         popupHtml += '<strong>' + mCap + '</strong> from ' + fromStop.name + ' to ' + toStop.name;
         if (matchedJourney.provider) popupHtml += '<br><span style="color:#666;">' + matchedJourney.provider + '</span>';
         if (matchedJourney.departureTime || matchedJourney.arrivalTime) {
           popupHtml += '<br><span style="color:#666; font-size:0.9em;">';
           if (matchedJourney.departureTime) popupHtml += 'Dep: ' + matchedJourney.departureTime + ' ';
           if (matchedJourney.arrivalTime) popupHtml += 'Arr: ' + matchedJourney.arrivalTime;
           popupHtml += '</span>';
         }
      } else {
         popupHtml += '<strong>' + fromStop.name + ' &rarr; ' + toStop.name + '</strong><br><span style="color:#666;">No linked transport</span>';
      }
      popupHtml += '</div>';

      polyline.bindPopup(popupHtml);

      polyline.on('mouseover', function(e) {
        this.setStyle({ weight: 5, opacity: 1 });
      });
      polyline.on('mouseout', function(e) {
        this.setStyle({ weight: weight, opacity: 0.8 });
      });

      mapPolylines.push(polyline);
    }
  }

  return polylinePoints;
}

/**
 * Renders destination markers on the Leaflet map.
 */
function drawMapMarkers(destinations) {
  destinations.forEach(d => {
    const isTransit = d.isTransit;
    const firstIndex = d.index;

    const icon = L.divIcon({
      className: `numbered-map-marker ${isTransit ? 'is-transit-marker' : ''}`,
      html: `<div class="marker-dot" style="background-color: ${isTransit ? '#95a5a6' : d.color}; border-style: ${isTransit ? 'dashed' : 'solid'};"><span>${firstIndex}</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([d.lat, d.lng], { icon: icon }).addTo(mainMap);

    let popupText = `<b>${firstIndex}. ${d.name}</b>`;
    if (isTransit) popupText += ' <span style="font-size:0.8rem; color:#666;">(Transit)</span>';
    if (Array.isArray(d.visitIndexes) && d.visitIndexes.length > 1) {
      popupText += `<br><span style="font-size:0.8rem; color:#666;">Route visits: ${d.visitIndexes.join(', ')}</span>`;
    }
    marker.bindPopup(popupText);

    mapMarkers.push({ id: d.id, name: d.name, marker: marker });
  });
}

/**
 * Adjusts the map view or bounds based on active filter or polyline bounds.
 */
function adjustMapView(polylinePoints) {
  if (!mainMap) return;

  if (window.currentCityFilter && window.currentCityFilter !== 'all') {
    focusCityOnMap(window.currentCityFilter);
  } else if (polylinePoints.length > 1 && mapPolylines.length > 0) {
    mainMap.fitBounds(L.polyline(polylinePoints).getBounds(), { padding: [50, 50], animate: false });
  } else if (polylinePoints.length === 1) {
    mainMap.setView(polylinePoints[0], 10, { animate: false });
  } else {
    mainMap.setView([20, 0], 2, { animate: false });
  }
}

function buildJourneyMap() {
  const container = document.getElementById('journey-map-view');
  if (!container) return;

  if (window.mapBuildTimeout) clearTimeout(window.mapBuildTimeout);

  window.mapBuildTimeout = setTimeout(() => {
    // Abort if the user clicked away before the map could build
    if (!document.getElementById('tab-map').classList.contains('active')) return;

    if (mainMap) {
      mainMap.remove();
      mainMap = null;
    }

    // Clear placeholder and recreate fresh map
    container.innerHTML = '';
    container.classList.remove('map-placeholder');

    mainMap = L.map(container, { trackResize: true }).setView([20, 0], 2);

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const tileUrl = isDarkMode
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

    const tileAttribution = isDarkMode
      ? 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
      : 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom';

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19
    }).addTo(mainMap);

    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        if (mainMap) mainMap.invalidateSize();
      }).observe(container);
    }

    mapMarkers = [];
    mapPolylines = [];

    const pathStops = collectPathStops();
    const travelSequence = buildTravelSequence(pathStops);
    const { destinations, unmatchedCities } = buildMapDestinations(travelSequence);

    if (destinations.length === 0) {
      container.innerHTML = '<div style="padding:2rem; text-align:center;">No recognized cities found in your trip. Try adding major city names to trip legs.</div>';
      return;
    }

    const polylinePoints = drawMapPolylines(travelSequence);
    drawMapMarkers(destinations);

    updateMapLegend(destinations);
    updateMapStats(destinations, unmatchedCities);

    if (mainMap) {
      setTimeout(() => {
        if (!mainMap) return;
        mainMap.invalidateSize(false);
        adjustMapView(polylinePoints);
      }, 50);
    }
  }, 400);
}

function focusCityOnMap(cityId) {
  if (!mainMap || !mapMarkers.length) return;
  
  const entry = mapMarkers.find(m => m.id === cityId || m.name === cityId);
  if (entry) {
    mainMap.setView(entry.marker.getLatLng(), 12);
    entry.marker.openPopup();
  }
}

function highlightCityOnMap(cityId) {
  if (!mapMarkers.length) return;
  const entry = mapMarkers.find(m => m.id === cityId || m.name === cityId);
  if (entry && entry.marker) {
    const el = entry.marker.getElement();
    if (el) el.classList.add('marker-flared');
  }
}

function unhighlightCityOnMap(cityId) {
  if (!mapMarkers.length) return;
  const entry = mapMarkers.find(m => m.id === cityId || m.name === cityId);
  if (entry && entry.marker) {
    const el = entry.marker.getElement();
    if (el) el.classList.remove('marker-flared');
  }
}

function updateMapLegend(destinations) {
  const legend = document.getElementById('map-legend-container');
  if (!legend) return;
  
  if (destinations.length === 0) {
    legend.innerHTML = '<div class="text-slate-400 text-xs">No cities mapped yet.</div>';
    return;
  }

  legend.innerHTML = destinations.map(d => {
    return `
      <div class="legend-item" onclick="focusCityOnMap('${d.id}')" onmouseenter="highlightCityOnMap('${d.id}')" onmouseleave="unhighlightCityOnMap('${d.id}')">
        <span class="legend-item-index" style="background:${d.color};">${d.index}</span>
        <span class="legend-item-name">${d.name}</span>
      </div>
    `;
  }).join('');
}

function updateMapStats(destinations, unmatchedCities) {
  const stats = document.getElementById('journey-stats');
  if (!stats) return;
  
  let html = `
    <div class="map-stats-grid">
      <div class="map-stat-card">
        <div class="map-stat-value">${destinations.length}</div>
        <div class="map-stat-label">Mapped Cities</div>
      </div>
      <div class="map-stat-card">
        <div class="map-stat-value">${appData.length}</div>
        <div class="map-stat-label">Trip Legs</div>
      </div>
    </div>
  `;

  if (unmatchedCities.length > 0) {
    html += `
      <div class="map-unmatched">
        <strong>Unmapped:</strong> ${unmatchedCities.join(', ')}
      </div>
    `;
  }
  
  stats.innerHTML = html;
}

function openAllInGoogleMaps() {
  const cities = [];
  appData.forEach(leg => {
    const fromCity = leg.days[0]?.from;
    const toCity = leg.days[leg.days.length - 1]?.to;
    if (fromCity && !cities.includes(fromCity)) cities.push(fromCity);
    if (toCity && !cities.includes(toCity)) cities.push(toCity);
  });

  if (cities.length === 0) return;

  let url = "https://www.google.com/maps/dir/";
  cities.forEach(c => url += encodeURIComponent(c) + "/");
  window.open(url, '_blank');
}

function updateMapTiles() {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const tileUrl = isDarkMode
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

  const tileAttribution = isDarkMode
    ? 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    : 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom';

  if (mainMap) {
    mainMap.eachLayer(layer => {
      if (layer._url) mainMap.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 19 }).addTo(mainMap);
  }

  if (desktopSplitMap) {
    desktopSplitMap.eachLayer(layer => {
      if (layer._url) desktopSplitMap.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 19 }).addTo(desktopSplitMap);
  }
}

// Desktop Split-Pane Map (Milestone 6 / Issues #286, #299)
let desktopSplitMap = null;
let splitMapMarkers = [];
let splitMapPolylines = [];

function buildDesktopSplitMap() {
  if (typeof window === 'undefined' || typeof L === 'undefined') return;
  const container = document.getElementById('desktop-split-map-view');
  if (!container) return;

  const shell = document.getElementById('desktopSplitShell');
  if (shell && shell.classList.contains('is-full-itinerary')) return;
  if (window.innerWidth < 1024) return;

  if (desktopSplitMap) {
    try {
      desktopSplitMap.remove();
    } catch (e) {}
    desktopSplitMap = null;
  }

  container.innerHTML = '';
  splitMapMarkers = [];
  splitMapPolylines = [];

  try {
    desktopSplitMap = L.map(container, { trackResize: true, zoomControl: true }).setView([20, 0], 2);
  } catch (err) {
    console.warn('Failed to initialize desktop split map:', err);
    return;
  }

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const tileUrl = isDarkMode
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

  const tileAttribution = isDarkMode
    ? 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    : 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom';

  L.tileLayer(tileUrl, {
    attribution: tileAttribution,
    maxZoom: 19
  }).addTo(desktopSplitMap);

  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (desktopSplitMap) desktopSplitMap.invalidateSize();
    }).observe(container);
  }

  const pathStops = collectPathStops();
  const travelSequence = buildTravelSequence(pathStops);
  const { destinations } = buildMapDestinations(travelSequence);

  if (destinations.length === 0) {
    container.innerHTML = '<div class="p-4 text-xs text-center text-slate-500">No destinations mapped yet.</div>';
    return;
  }

  // Draw Polylines on split map
  const polylinePoints = [];
  for (let i = 0; i < travelSequence.length - 1; i++) {
    const fromStop = travelSequence[i];
    const toStop = travelSequence[i + 1];
    const fromCoords = getCityCoords(fromStop.name);
    const toCoords = getCityCoords(toStop.name);
    if (fromCoords && toCoords) {
      if (i === 0) polylinePoints.push([fromCoords.lat, fromCoords.lng]);
      polylinePoints.push([toCoords.lat, toCoords.lng]);

      let matchedJourney = null;
      if (typeof journeys !== 'undefined' && Array.isArray(journeys)) {
        matchedJourney = journeys.find(j => {
          const jFrom = getMapCityKey(j.fromLocation || j.from);
          const jTo = getMapCityKey(j.toLocation || j.to);
          const sFrom = getMapCityKey(fromStop.name);
          const sTo = getMapCityKey(toStop.name);
          return jFrom === sFrom && jTo === sTo;
        });
      }

      let lineColor = '#0f766e';
      let dashArray = '8, 8';
      let weight = 3;

      if (matchedJourney) {
        const method = String(matchedJourney.transportType || '').toLowerCase();
        if (method === 'flight') {
          lineColor = '#3b82f6';
          dashArray = '6, 6';
        } else if (method === 'train') {
          lineColor = '#16a34a';
          dashArray = null;
        } else if (method === 'bus') {
          lineColor = '#ea580c';
          dashArray = null;
        } else {
          lineColor = '#64748b';
          dashArray = null;
        }
      }

      const polyline = L.polyline([
        [fromCoords.lat, fromCoords.lng],
        [toCoords.lat, toCoords.lng]
      ], {
        color: lineColor,
        weight: weight,
        dashArray: dashArray,
        opacity: 0.8
      }).addTo(desktopSplitMap);

      splitMapPolylines.push(polyline);
    }
  }

  // Draw Markers on split map
  destinations.forEach(d => {
    const isTransit = d.isTransit;
    const firstIndex = d.index;

    const icon = L.divIcon({
      className: `numbered-map-marker ${isTransit ? 'is-transit-marker' : ''}`,
      html: `<div class="marker-dot" style="background-color: ${isTransit ? '#95a5a6' : d.color}; border-style: ${isTransit ? 'dashed' : 'solid'};"><span>${firstIndex}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([d.lat, d.lng], { icon: icon }).addTo(desktopSplitMap);
    let popupText = `<b>${firstIndex}. ${d.name}</b>`;
    if (marker && typeof marker.bindPopup === 'function') {
      marker.bindPopup(popupText);
    }

    if (marker && typeof marker.on === 'function') {
      marker.on('click', () => {
        focusCityInItineraryList(d.name);
        if (typeof renderSplitDrawerContent === 'function') {
          renderSplitDrawerContent({
            type: 'city',
            title: d.name,
            location: d.name,
            color: d.color,
            index: d.index,
            isTransit: d.isTransit
          });
        }
      });
    }

    splitMapMarkers.push({ id: d.id, name: d.name, marker: marker, lat: d.lat, lng: d.lng });
  });

  setTimeout(() => {
    if (!desktopSplitMap) return;
    desktopSplitMap.invalidateSize(false);
    if (polylinePoints.length > 1) {
      desktopSplitMap.fitBounds(L.polyline(polylinePoints).getBounds(), { padding: [30, 30], animate: false });
    } else if (polylinePoints.length === 1) {
      desktopSplitMap.setView(polylinePoints[0], 10, { animate: false });
    } else {
      desktopSplitMap.setView([20, 0], 2, { animate: false });
    }
  }, 100);
}

function focusStopOnSplitMap(targetLocation, itemData = null) {
  if (!desktopSplitMap || splitMapMarkers.length === 0) return;
  if (!targetLocation && itemData && itemData.location) targetLocation = itemData.location;

  const title = String((itemData && (itemData.title || itemData.name || itemData.text)) || '').toLowerCase().trim();
  const cleanTarget = String(targetLocation || '')
    .replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '')
    .toLowerCase()
    .trim();

  // 1. Try finding marker in splitMapMarkers
  let entry = splitMapMarkers.find(m => {
    if (itemData && itemData.activityId && m.id === `act-${itemData.activityId}`) return true;
    if (itemData && itemData.id && m.id === itemData.id) return true;
    const cleanName = String(m.name || '').toLowerCase().trim();
    if (title && (cleanName.includes(title) || title.includes(cleanName))) return true;
    if (cleanTarget && (cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName))) return true;
    return false;
  });

  let coords = null;
  if (entry) {
    coords = typeof entry.marker.getLatLng === 'function' ? entry.marker.getLatLng() : { lat: entry.lat, lng: entry.lng };
  } else if (itemData && itemData.lat && itemData.lng && !isNaN(Number(itemData.lat))) {
    coords = { lat: Number(itemData.lat), lng: Number(itemData.lng) };
  } else if (cleanTarget) {
    coords = getCityCoords(cleanTarget);
  }

  if (coords) {
    const zoomLevel = entry && entry.id && (entry.id.startsWith('day-') || entry.id === 'city-center') ? 13 : 15;
    if (typeof desktopSplitMap.flyTo === 'function') {
      desktopSplitMap.flyTo([coords.lat, coords.lng], zoomLevel, { duration: 0.5 });
    } else if (typeof desktopSplitMap.setView === 'function') {
      desktopSplitMap.setView([coords.lat, coords.lng], zoomLevel);
    }

    if (entry && entry.marker) {
      if (typeof entry.marker.openPopup === 'function') entry.marker.openPopup();
      if (typeof entry.marker.getElement === 'function') {
        const el = entry.marker.getElement();
        if (el) {
          el.classList.add('marker-flared');
          setTimeout(() => el.classList.remove('marker-flared'), 2200);
        }
      }
    }
  }
}

function clearSplitMapLayers() {
  if (!desktopSplitMap) return;
  if (Array.isArray(splitMapMarkers)) {
    splitMapMarkers.forEach(m => {
      try {
        if (m && m.marker && typeof desktopSplitMap.removeLayer === 'function') {
          desktopSplitMap.removeLayer(m.marker);
        }
      } catch (e) {}
    });
  }
  splitMapMarkers = [];

  if (Array.isArray(splitMapPolylines)) {
    splitMapPolylines.forEach(p => {
      try {
        if (p && typeof desktopSplitMap.removeLayer === 'function') {
          desktopSplitMap.removeLayer(p);
        }
      } catch (e) {}
    });
  }
  splitMapPolylines = [];
}

function getDeterministicActivityCoords(baseCoords, act, index, total) {
  if (!baseCoords) return null;
  if (act && act.lat !== undefined && act.lng !== undefined && act.lat !== null && !isNaN(Number(act.lat))) {
    return { lat: Number(act.lat), lng: Number(act.lng) };
  }
  const actLoc = String((act && act.location) || '').trim();
  if (actLoc) {
    const direct = getCityCoords(actLoc);
    if (direct) {
      const dLat = Math.abs(direct.lat - baseCoords.lat);
      const dLng = Math.abs(direct.lng - baseCoords.lng);
      if (dLat < 1.2 && dLng < 1.5) return direct;
    }
  }
  if (actLoc && typeof ALL_CITIES !== 'undefined') {
    const words = actLoc.split(/[\s,/·-]+/).filter(w => w.length > 2);
    for (const w of words) {
      const match = getCityCoords(w);
      if (match) {
        const dLat = Math.abs(match.lat - baseCoords.lat);
        const dLng = Math.abs(match.lng - baseCoords.lng);
        if (dLat < 1.2 && dLng < 1.5) return match;
      }
    }
  }

  // Deterministically distribute around the base city coordinates in an urban radius (800m - 2.4km)
  const count = Math.max(1, total || 1);
  const angle = (index / count) * 2 * Math.PI + 0.35;
  const str = String((act && (act.title || act.text || act.name)) || index);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i) * (i + 1)) % 100;
  }
  const jitter = 0.007 + (hash / 100) * 0.015;
  const latCos = Math.max(0.2, Math.cos(baseCoords.lat * Math.PI / 180));
  return {
    lat: baseCoords.lat + jitter * Math.sin(angle),
    lng: baseCoords.lng + (jitter * Math.cos(angle)) / latCos
  };
}

function renderDesktopSplitDayMap(dayData, options = {}) {
  if (typeof window === 'undefined' || window.innerWidth < 1024) return;
  if (!dayData) return;

  const container = document.getElementById('desktop-split-map-view');
  if (!container) return;

  if (!desktopSplitMap) {
    buildDesktopSplitMap();
  }
  if (!desktopSplitMap) return;

  // Invalidate size so Leaflet takes full vertical height
  if (typeof desktopSplitMap.invalidateSize === 'function') {
    desktopSplitMap.invalidateSize();
    setTimeout(() => {
      if (desktopSplitMap && typeof desktopSplitMap.invalidateSize === 'function') {
        desktopSplitMap.invalidateSize();
      }
    }, 60);
  }

  clearSplitMapLayers();

  const fromCity = String(dayData.from || '').trim();
  const toCity = String(dayData.to || dayData.from || '').trim();
  const cleanFrom = fromCity.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').replace(/\s*\(\d+\)$/, '').trim();
  const cleanTo = toCity.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').replace(/\s*\(\d+\)$/, '').trim();
  const isTravelDay = cleanFrom.toLowerCase() !== cleanTo.toLowerCase() && cleanFrom.length > 0 && cleanTo.length > 0;
  const legColour = (dayData.leg && dayData.leg.colour) || '#0f766e';
  const dayNumLabel = dayData.dayNumber ? `Day ${dayData.dayNumber}` : '';

  const activities = Array.isArray(dayData.activities) ? dayData.activities : [];
  const stays = Array.isArray(dayData.stays) ? dayData.stays : [];
  const totalStops = (isTravelDay ? 2 : 1) + stays.length + activities.length;

  // Update Split Map Header Title
  const headingEl = document.getElementById('splitMapHeading');
  if (headingEl) {
    const stopsSuffix = totalStops > 1 ? ` · ${totalStops} stops` : '';
    if (isTravelDay) {
      headingEl.textContent = `✈️ ${cleanFrom} → ${cleanTo}${dayNumLabel ? ' · ' + dayNumLabel : ''}${stopsSuffix}`;
    } else {
      headingEl.textContent = `📍 ${cleanTo || cleanFrom}${dayNumLabel ? ' · ' + dayNumLabel : ''}${stopsSuffix}`;
    }
  }

  // Update Split Map Header Google Maps multi-stop link
  const gBtn = document.getElementById('splitMapGoogleMapsBtn');
  if (gBtn) {
    if (dayData.mapRoute && dayData.mapRoute.url) {
      gBtn.href = dayData.mapRoute.url;
      gBtn.style.display = 'inline-flex';
    } else {
      gBtn.style.display = 'none';
    }
  }

  const points = [];

  const targetCity = cleanTo || cleanFrom || (dayData.leg && dayData.leg.label);
  const cityCoords = getCityCoords(targetCity);
  const fromCoords = isTravelDay ? getCityCoords(cleanFrom) : null;
  const toCoords = isTravelDay ? getCityCoords(cleanTo) : cityCoords;

  if (isTravelDay) {
    if (fromCoords && toCoords) {
      const fromIcon = L.divIcon({
        className: 'numbered-map-marker is-departure-marker',
        html: `<div class="marker-dot" style="background-color: ${legColour}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span>🛫</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const fromMarker = L.marker([fromCoords.lat, fromCoords.lng], { icon: fromIcon }).addTo(desktopSplitMap);
      if (fromMarker && typeof fromMarker.bindPopup === 'function') {
        fromMarker.bindPopup(`<b>🛫 Departure: ${cleanFrom}</b><br><span style="font-size:0.75rem; color:#64748b;">${dayData.date || ''}</span>`);
      }
      splitMapMarkers.push({ id: 'day-from', name: cleanFrom, marker: fromMarker, lat: fromCoords.lat, lng: fromCoords.lng });
      points.push([fromCoords.lat, fromCoords.lng]);

      const toIcon = L.divIcon({
        className: 'numbered-map-marker is-arrival-marker',
        html: `<div class="marker-dot" style="background-color: #0f766e; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span>🛬</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const toMarker = L.marker([toCoords.lat, toCoords.lng], { icon: toIcon }).addTo(desktopSplitMap);
      if (toMarker && typeof toMarker.bindPopup === 'function') {
        toMarker.bindPopup(`<b>🛬 Destination: ${cleanTo}</b><br><span style="font-size:0.75rem; color:#64748b;">${dayData.date || ''}</span>`);
      }
      splitMapMarkers.push({ id: 'day-to', name: cleanTo, marker: toMarker, lat: toCoords.lat, lng: toCoords.lng });
      points.push([toCoords.lat, toCoords.lng]);

      const polyline = L.polyline([[fromCoords.lat, fromCoords.lng], [toCoords.lat, toCoords.lng]], {
        color: '#3b82f6',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }).addTo(desktopSplitMap);
      splitMapPolylines.push(polyline);
    } else if (toCoords || fromCoords) {
      const single = toCoords || fromCoords;
      const name = toCoords ? cleanTo : cleanFrom;
      const marker = L.marker([single.lat, single.lng]).addTo(desktopSplitMap);
      splitMapMarkers.push({ id: 'day-city', name: name, marker: marker, lat: single.lat, lng: single.lng });
      points.push([single.lat, single.lng]);
    }
  } else if (cityCoords) {
    const cityIcon = L.divIcon({
      className: 'numbered-map-marker is-city-center-marker',
      html: `<div class="marker-dot" style="background-color: ${legColour}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span>📍</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const cityMarker = L.marker([cityCoords.lat, cityCoords.lng], { icon: cityIcon }).addTo(desktopSplitMap);
    if (cityMarker && typeof cityMarker.bindPopup === 'function') {
      cityMarker.bindPopup(`<b>📍 ${targetCity}</b><br><span style="font-size:0.75rem; color:#64748b;">${dayData.dayName || ''} ${dayData.date || ''}</span>`);
    }
    splitMapMarkers.push({ id: 'day-city', name: targetCity, marker: cityMarker, lat: cityCoords.lat, lng: cityCoords.lng });
    points.push([cityCoords.lat, cityCoords.lng]);
  }

  const baseCoords = toCoords || cityCoords || fromCoords;
  const stayCoordsList = [];
  const activityCoordsList = [];

  // Stays
  stays.forEach((stay, sIdx) => {
    const stayName = stay.name || stay.propertyName || 'Accommodation';
    const stayLoc = stay.location || stay.city || targetCity;
    let directStayCoords = null;
    if (stay && stay.lat !== undefined && stay.lng !== undefined && stay.lat !== null && !isNaN(Number(stay.lat)) && !isNaN(Number(stay.lng))) {
      directStayCoords = { lat: Number(stay.lat), lng: Number(stay.lng) };
    } else {
      directStayCoords = getCityCoords(stayLoc);
      if (directStayCoords && baseCoords) {
        const dLat = Math.abs(directStayCoords.lat - baseCoords.lat);
        const dLng = Math.abs(directStayCoords.lng - baseCoords.lng);
        if (dLat >= 1.2 || dLng >= 1.5) directStayCoords = null;
      }
    }
    const stayCoords = directStayCoords || (baseCoords ? {
      lat: baseCoords.lat + (sIdx === 0 ? 0.007 : -0.007),
      lng: baseCoords.lng + (sIdx === 0 ? 0.007 : -0.007)
    } : null);

    if (stayCoords) {
      stayCoordsList.push({ ...stayCoords, name: stayName, stay });
      const stayIcon = L.divIcon({
        className: 'numbered-map-marker is-stay-marker',
        html: `<div class="marker-dot" style="background-color: #be185d; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span>🏨</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const stayMarker = L.marker([stayCoords.lat, stayCoords.lng], { icon: stayIcon }).addTo(desktopSplitMap);
      if (stayMarker && typeof stayMarker.bindPopup === 'function') {
        stayMarker.bindPopup(`<b>🏨 ${stayName}</b><br><span style="font-size:0.75rem; color:#0f766e; font-weight:600;">🚩 Accommodation · Day Start & Return</span><br><span style="font-size:0.75rem;">${stay.bookingRef ? '#' + stay.bookingRef : (stay.location || '')}</span>`);
      }
      if (stayMarker && typeof stayMarker.on === 'function') {
        stayMarker.on('click', () => {
          if (typeof selectSplitPaneItem === 'function') {
            selectSplitPaneItem({
              title: stayName,
              type: 'stay',
              location: stay.location || stay.city || targetCity,
              bookingRef: stay.bookingRef || '',
              cost: stay.cost || '',
              notes: stay.notes || ''
            });
          }
        });
      }
      splitMapMarkers.push({ id: `stay-${sIdx}`, name: stayName, marker: stayMarker, lat: stayCoords.lat, lng: stayCoords.lng });
      points.push([stayCoords.lat, stayCoords.lng]);
    }
  });

  // Activities (reflect ALL activities!)
  activities.forEach((act, aIdx) => {
    const actTitle = act.title || act.text || 'Activity';
    const actLoc = act.location || '';
    const actCoords = getDeterministicActivityCoords(baseCoords, act, aIdx, activities.length);

    if (actCoords) {
      activityCoordsList.push({ ...actCoords, title: actTitle });
      const numLabel = aIdx + 1;
      const actIcon = L.divIcon({
        className: 'numbered-map-marker is-activity-marker',
        html: `<div class="marker-dot" style="background-color: #7c3aed; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="font-size: 11px; font-weight: 800; color: white;">${numLabel}</span></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      const actMarker = L.marker([actCoords.lat, actCoords.lng], { icon: actIcon }).addTo(desktopSplitMap);
      if (actMarker && typeof actMarker.bindPopup === 'function') {
        const metaLine = [act.time || act.estTime, act.cost ? '$' + act.cost : ''].filter(Boolean).join(' · ');
        actMarker.bindPopup(`<b>🎯 ${numLabel}. ${actTitle}</b><br><span style="font-size:0.75rem; color:#64748b;">${actLoc || targetCity}</span>${metaLine ? `<br><span style="font-size:0.75rem;">${metaLine}</span>` : ''}`);
      }
      if (actMarker && typeof actMarker.on === 'function') {
        actMarker.on('click', () => {
          if (typeof selectSplitPaneItem === 'function') {
            selectSplitPaneItem({
              title: actTitle,
              type: 'activity',
              location: actLoc || targetCity,
              time: act.time || act.estTime || '',
              cost: act.cost || act.estCost || '',
              notes: act.notes || ''
            });
          }
        });
      }
      splitMapMarkers.push({ id: `act-${act.activityId || aIdx}`, name: actTitle, marker: actMarker, lat: actCoords.lat, lng: actCoords.lng });
      points.push([actCoords.lat, actCoords.lng]);
    }
  });

  // Construct connecting itinerary route (starts and finishes at accommodation where staying the night)
  const routePoints = [];

  if (isTravelDay) {
    if (fromCoords && toCoords) {
      routePoints.push([fromCoords.lat, fromCoords.lng]);
      if (stayCoordsList.length > 0) {
        routePoints.push([stayCoordsList[0].lat, stayCoordsList[0].lng]);
      }
      activityCoordsList.forEach(act => routePoints.push([act.lat, act.lng]));
      if (stayCoordsList.length > 0 && activityCoordsList.length > 0) {
        routePoints.push([stayCoordsList[0].lat, stayCoordsList[0].lng]);
      } else {
        routePoints.push([toCoords.lat, toCoords.lng]);
      }
    } else if (toCoords || fromCoords) {
      const single = toCoords || fromCoords;
      routePoints.push([single.lat, single.lng]);
      activityCoordsList.forEach(act => routePoints.push([act.lat, act.lng]));
    }
  } else {
    // In-town city day:
    const primaryStay = stayCoordsList[0] || null;
    const overnightStay = stayCoordsList.find(s => !s.stay || !s.stay.checkOut || (dayData.date && dayData.date < s.stay.checkOut)) || primaryStay;

    const hasOutbound = Array.isArray(dayData.journeys) && dayData.journeys.some(j => {
      const fromLoc = String(j.fromLocation || '').toLowerCase();
      const toLoc = String(j.toLocation || '').toLowerCase();
      const target = String(targetCity).toLowerCase();
      return fromLoc && toLoc && (fromLoc.includes(target) || target.includes(fromLoc)) && !toLoc.includes(target);
    });

    if (primaryStay) {
      // 1. Start at accommodation!
      routePoints.push([primaryStay.lat, primaryStay.lng]);

      // 2. Visit each scheduled activity in order
      activityCoordsList.forEach(act => routePoints.push([act.lat, act.lng]));

      // 3. Return to accommodation for the night (unless departing to another city tonight)!
      if (!hasOutbound && overnightStay && activityCoordsList.length > 0) {
        routePoints.push([overnightStay.lat, overnightStay.lng]);
      }
    } else if (cityCoords) {
      // Fallback if no specific hotel is entered yet
      routePoints.push([cityCoords.lat, cityCoords.lng]);
      activityCoordsList.forEach(act => routePoints.push([act.lat, act.lng]));
      if (!hasOutbound && activityCoordsList.length > 0) {
        routePoints.push([cityCoords.lat, cityCoords.lng]);
      }
    } else {
      activityCoordsList.forEach(act => routePoints.push([act.lat, act.lng]));
    }
  }

  // If there are multiple stops on this day route, draw the connecting route polyline
  if (!isTravelDay && routePoints.length > 1) {
    const dayPolyline = L.polyline(routePoints, {
      color: '#0d9488',
      weight: 3.5,
      dashArray: '6, 8',
      opacity: 0.85
    }).addTo(desktopSplitMap);
    splitMapPolylines.push(dayPolyline);
  }

  // Camera: zoom in tightly to the locations needed
  if (points.length === 0 && baseCoords) {
    points.push([baseCoords.lat, baseCoords.lng]);
  }

  if (isTravelDay && points.length > 1) {
    if (typeof desktopSplitMap.flyToBounds === 'function') {
      desktopSplitMap.flyToBounds(points, { padding: [50, 50], maxZoom: 13, duration: 0.5 });
    } else if (typeof desktopSplitMap.fitBounds === 'function') {
      desktopSplitMap.fitBounds(points, { padding: [50, 50], maxZoom: 13 });
    }
  } else if (points.length > 1) {
    if (typeof desktopSplitMap.flyToBounds === 'function') {
      desktopSplitMap.flyToBounds(points, { padding: [40, 40], maxZoom: 15, duration: 0.5 });
    } else if (typeof desktopSplitMap.fitBounds === 'function') {
      desktopSplitMap.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
  } else if (points.length === 1) {
    if (typeof desktopSplitMap.flyTo === 'function') {
      desktopSplitMap.flyTo(points[0], 14, { duration: 0.5 });
    } else if (typeof desktopSplitMap.setView === 'function') {
      desktopSplitMap.setView(points[0], 14);
    }
  }
}

function resetSplitMapView() {
  if (typeof window !== 'undefined') {
    window.__lastSplitDayKey = null;
  }
  buildDesktopSplitMap();
  const headingEl = document.getElementById('splitMapHeading');
  if (headingEl) {
    headingEl.textContent = 'Interactive Map · Full Route';
  }
  if (typeof clearSplitDrawer === 'function') {
    clearSplitDrawer();
  }
}

function focusCityInItineraryList(cityName) {
  if (!cityName) return;
  const cleanTarget = String(cityName).toLowerCase().trim();
  const legs = document.querySelectorAll('#itinerary .leg, #itinerary .compact-desktop-leg');
  for (const legEl of legs) {
    const text = (legEl.textContent || '').toLowerCase();
    if (text.includes(cleanTarget)) {
      legEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      legEl.classList.add('split-active-item');
      setTimeout(() => legEl.classList.remove('split-active-item'), 2000);
      break;
    }
  }
}

// Watch for tab switch and theme changes
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      // Watch for theme changes
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        updateMapTiles();
      }
    });
  });

  const mapTab = document.getElementById('tab-map');
  if (mapTab) {
    observer.observe(mapTab, { attributes: true, attributeFilter: ['class'] });
  }

  const itinTab = document.getElementById('tab-itinerary');
  if (itinTab) {
    observer.observe(itinTab, { attributes: true, attributeFilter: ['class'] });
  }

  // Watch for theme changes on html element
  const htmlEl = document.documentElement;
  if (htmlEl) {
    observer.observe(htmlEl, { attributes: true, attributeFilter: ['data-theme'] });
  }
});

window.buildJourneyMap = buildJourneyMap;
window.openAllInGoogleMaps = openAllInGoogleMaps;
window.buildDesktopSplitMap = buildDesktopSplitMap;
window.renderDesktopSplitDayMap = renderDesktopSplitDayMap;
window.clearSplitMapLayers = clearSplitMapLayers;
window.focusStopOnSplitMap = focusStopOnSplitMap;
window.resetSplitMapView = resetSplitMapView;
window.getDeterministicActivityCoords = getDeterministicActivityCoords;


