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

function buildJourneyMap() {
  const container = document.getElementById('journey-map-view');
  if (!container) return;

  // Clear placeholder
  container.innerHTML = '';
  container.classList.remove('map-placeholder');

  if (mainMap) {
    mainMap.remove();
    mainMap = null;
  }

  mainMap = L.map(container).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mainMap);

  mapMarkers = [];
  mapPolylines = [];

  const pathStops = [];

  // Get canonical city order from navigation menu source of truth
  const citiesInOrder = typeof getCitiesInTravelOrder === 'function' ? getCitiesInTravelOrder() : [];
  const cityToIndexMap = new Map();
  citiesInOrder.forEach((city, idx) => {
    cityToIndexMap.set(city.name.toLowerCase(), idx + 1);
  });

  if (typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData.forEach((leg, legIndex) => {
      const legBaseScore = typeof getLegDateScore === 'function' ? getLegDateScore(leg, legIndex) : legIndex * 10000;
      
      const labelCity = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(leg.label) : (leg.label ? leg.label.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim() : '');
      const labelAlreadyInDayRoute = labelCity && (leg.days || []).some(day =>
          (day.from && day.from.toLowerCase() === labelCity.toLowerCase()) ||
          (day.to && day.to.toLowerCase() === labelCity.toLowerCase())
      );

      // Add leg from/to cities
      (leg.days || []).forEach((day, dayIndex) => {
        const dayScore = typeof getTimelineScore === 'function' ? getTimelineScore(day.date, '', legBaseScore + dayIndex * 10) : legBaseScore + dayIndex * 10;
        
        if (day.from && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(day.from))) {
          pathStops.push({ id: `city-${day.from.toLowerCase()}`, name: day.from, score: dayScore, isTransit: false, color: leg.colour || '#3498DB' });
        }

        // Place label city (like Verona) at +0.5 between from and to
        if (labelCity && !labelAlreadyInDayRoute && dayIndex === 0) {
           pathStops.push({ id: `city-${labelCity.toLowerCase().replace(/\s+/g, '-')}`, name: labelCity, score: dayScore + 0.5, isTransit: true, color: leg.colour || '#95a5a6' });
        }

        if (day.to && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(day.to))) {
          pathStops.push({ id: `city-${day.to.toLowerCase()}`, name: day.to, score: dayScore + 1, isTransit: false, color: leg.colour || '#3498DB' });
        }
      });
    });
  }

  if (typeof journeys !== 'undefined' && Array.isArray(journeys)) {
    journeys.forEach((journey, journeyIndex) => {
      const depScore = typeof getTimelineScore === 'function' ? getTimelineScore(journey.departureDate || journey.dayDate, journey.departureTime, Number.MAX_SAFE_INTEGER - 20000 + journeyIndex) : Number.MAX_SAFE_INTEGER - 20000 + journeyIndex;
      const arrScore = typeof getTimelineScore === 'function' ? getTimelineScore(journey.arrivalDate || journey.dayDate || journey.departureDate, journey.arrivalTime, depScore + 1) : depScore + 1;

      if (journey.fromLocation && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(journey.fromLocation))) {
        pathStops.push({ id: `city-${journey.fromLocation.toLowerCase()}`, name: journey.fromLocation, score: depScore, isTransit: true, color: '#95a5a6' });
      }
      if (journey.toLocation && (typeof shouldSkipCityNavName !== 'function' || !shouldSkipCityNavName(journey.toLocation))) {
        pathStops.push({ id: `city-${journey.toLocation.toLowerCase()}`, name: journey.toLocation, score: arrScore, isTransit: true, color: '#95a5a6' });
      }
    });
  }

  // Sort by timeline score to get actual chronological travel order
  pathStops.sort((a, b) => a.score - b.score);

  // Collapse consecutive duplicates into a unique travel sequence
  const travelSequence = [];
  pathStops.forEach(stop => {
    if (travelSequence.length === 0) {
      travelSequence.push(stop);
    } else {
      const lastStop = travelSequence[travelSequence.length - 1];
      if (lastStop.name.toLowerCase() !== stop.name.toLowerCase()) {
        travelSequence.push(stop);
      } else {
        // Upgrade transit stop to real visit if they stay there
        if (!stop.isTransit && lastStop.isTransit) {
          lastStop.isTransit = false;
          lastStop.color = stop.color;
        }
      }
    }
  });

  const unmatchedCities = [];
  const destinations = [];
  const markerDataMap = new Map();

  travelSequence.forEach((stop, index) => {
    const coords = getCityCoords(stop.name);
    const seqNum = index + 1;

    if (coords) {
      const key = stop.name.toLowerCase();
      if (!markerDataMap.has(key)) {
        const markerInfo = {
          id: stop.id,
          name: stop.name,
          lat: coords.lat,
          lng: coords.lng,
          color: stop.color,
          isTransit: stop.isTransit,
          index: seqNum
        };
        markerDataMap.set(key, markerInfo);
        destinations.push(markerInfo);
      } else {
        const existing = markerDataMap.get(key);
        if (!stop.isTransit && existing.isTransit) {
          existing.isTransit = false;
          existing.color = stop.color;
        }
      }
    } else {
      if (!unmatchedCities.includes(stop.name)) unmatchedCities.push(stop.name);
    }
  });

  if (destinations.length === 0) {
    container.innerHTML = '<div style="padding:2rem; text-align:center;">No recognized cities found in your trip. Try adding major city names to trip legs.</div>';
    return;
  }

  const polylinePoints = [];
  travelSequence.forEach(stop => {
    const coords = getCityCoords(stop.name);
    if (coords) {
      polylinePoints.push([coords.lat, coords.lng]);
    }
  });

  destinations.forEach(d => {
    const isTransit = d.isTransit;
    const firstIndex = d.index;
    const fontSize = '13px';
    const letterSpacing = 'normal';
    
    const icon = L.divIcon({
      className: `numbered-map-marker ${isTransit ? 'is-transit-marker' : ''}`,
      html: `<div class="marker-dot" style="background-color: ${isTransit ? '#95a5a6' : d.color}; border-style: ${isTransit ? 'dashed' : 'solid'}; font-size: ${fontSize}; letter-spacing: ${letterSpacing};"><span>${firstIndex}</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([d.lat, d.lng], { icon: icon }).addTo(mainMap);
    
    let popupText = `<b>${firstIndex}. ${d.name}</b>`;
    if (isTransit) popupText += ' <span style="font-size:0.8rem; color:#666;">(Transit)</span>';
    marker.bindPopup(popupText);
    
    mapMarkers.push({ id: d.id, name: d.name, marker: marker });
  });

  if (polylinePoints.length > 1) {
    const polyline = L.polyline(polylinePoints, { color: '#FF6B6B', weight: 3, dashArray: '10, 10', opacity: 0.7 }).addTo(mainMap);
    mapPolylines.push(polyline);
    mainMap.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  } else if (polylinePoints.length === 1) {
    mainMap.setView(polylinePoints[0], 10);
  }

  // Update map legend passing original unique sequence order if we want it by first visit, destinations array is already ordered by first appearance
  updateMapLegend(destinations);
  updateMapStats(destinations, unmatchedCities);

  // If there's an active city filter, focus on it
  if (window.currentCityFilter && window.currentCityFilter !== 'all') {
    focusCityOnMap(window.currentCityFilter);
  }
}

function focusCityOnMap(cityId) {
  if (!mainMap || !mapMarkers.length) return;
  
  const entry = mapMarkers.find(m => m.id === cityId || m.name === cityId);
  if (entry) {
    mainMap.setView(entry.marker.getLatLng(), 12);
    entry.marker.openPopup();
  }
}

function updateMapLegend(destinations) {
  const legend = document.getElementById('map-legend-container');
  if (!legend) return;
  
  if (destinations.length === 0) {
    legend.innerHTML = '<div style="color:#999; font-size:0.8rem;">No cities mapped yet.</div>';
    return;
  }

  legend.innerHTML = destinations.map(d => {
    return `
      <div class="legend-item" 
           style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:0.9rem; cursor:pointer; padding:4px; border-radius:4px; transition:background 0.2s;"
           onclick="focusCityOnMap('${d.id}')"
           onmouseover="this.style.background='rgba(0,0,0,0.05)'"
           onmouseout="this.style.background='transparent'">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:${d.color}; color:#fff; font-size:13px; font-weight:700; border:1px solid #fff; box-shadow:0 0 2px rgba(0,0,0,0.2); flex-shrink:0;">${d.index}</span>
        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.name}</span>
      </div>
    `;
  }).join('');
}


function updateMapStats(destinations, unmatchedCities) {
  const stats = document.getElementById('journey-stats');
  if (!stats) return;
  
  let html = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:1rem;">
      <div style="background:#fff; padding:10px; border-radius:8px; text-align:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <div style="font-size:1.2rem; font-weight:700;">${destinations.length}</div>
        <div style="font-size:0.75rem; color:#666;">Mapped Cities</div>
      </div>
      <div style="background:#fff; padding:10px; border-radius:8px; text-align:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <div style="font-size:1.2rem; font-weight:700;">${appData.length}</div>
        <div style="font-size:0.75rem; color:#666;">Trip Legs</div>
      </div>
    </div>
  `;

  if (unmatchedCities.length > 0) {
    html += `
      <div style="background:#fff4e5; padding:10px; border-radius:8px; font-size:0.8rem; color:#664d03; border:1px solid #ffecb5;">
        <strong>⚠️ Unmapped:</strong> ${unmatchedCities.join(', ')}
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

// Watch for tab switch
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.target.id === 'tab-map' && mutation.target.classList.contains('active')) {
        setTimeout(buildJourneyMap, 100);
      }
    });
  });

  const mapTab = document.getElementById('tab-map');
  if (mapTab) {
    observer.observe(mapTab, { attributes: true, attributeFilter: ['class'] });
  }
});

window.buildJourneyMap = buildJourneyMap;
window.openAllInGoogleMaps = openAllInGoogleMaps;
