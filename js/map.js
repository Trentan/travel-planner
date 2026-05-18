// Journey Map Module - Visualizes trip route using Leaflet.js
let mainMap = null;
let mapMarkers = [];
let mapPolylines = [];

const cityCoordinates = {
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Seoul': { lat: 37.5665, lng: 126.9780 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Melbourne': { lat: -37.8136, lng: 144.9631 },
  'Brisbane': { lat: -27.4698, lng: 153.0251 },
  'Perth': { lat: -31.9505, lng: 115.8605 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Istanbul': { lat: 41.0082, lng: 28.9784 },
  'Athens': { lat: 37.9838, lng: 23.7275 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Lisbon': { lat: 38.7223, lng: -9.1393 },
  'Vienna': { lat: 48.2082, lng: 16.3738 },
  'Prague': { lat: 50.0755, lng: 14.4378 },
  'Budapest': { lat: 47.4979, lng: 19.0402 },
  'Taipei': { lat: 25.0330, lng: 121.5654 }
};

function getCityCoords(cityName) {
  if (!cityName) return null;
  const clean = cityName.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim();
  if (cityCoordinates[clean]) return cityCoordinates[clean];
  for (const [name, coords] of Object.entries(cityCoordinates)) {
    if (clean.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(clean.toLowerCase())) return coords;
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

  const destinations = [];
  const unmatchedCities = [];

  appData.forEach((leg, index) => {
    const fromCity = leg.days[0]?.from;
    const toCity = leg.days[leg.days.length - 1]?.to;
    const legColor = leg.colour || '#3498DB';

    if (fromCity) {
      const coords = getCityCoords(fromCity) || getCityCoords(leg.label);
      if (coords && !destinations.find(d => d.name === fromCity)) {
        destinations.push({ name: fromCity, lat: coords.lat, lng: coords.lng, color: legColor });
      } else if (!coords && !unmatchedCities.includes(fromCity)) {
        unmatchedCities.push(fromCity);
      }
    }

    if (toCity && toCity !== fromCity) {
      const coords = getCityCoords(toCity) || getCityCoords(leg.label);
      if (coords && !destinations.find(d => d.name === toCity)) {
        destinations.push({ name: toCity, lat: coords.lat, lng: coords.lng, color: legColor });
      } else if (!coords && !unmatchedCities.includes(toCity)) {
        unmatchedCities.push(toCity);
      }
    }
  });

  if (destinations.length === 0) {
    container.innerHTML = '<div style="padding:2rem; text-align:center;">No recognized cities found in your trip. Try adding major city names to trip legs.</div>';
    return;
  }

  const points = destinations.map(d => {
    const marker = L.circleMarker([d.lat, d.lng], {
      radius: 8,
      fillColor: d.color,
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(mainMap).bindPopup(`<b>${d.name}</b>`);
    return [d.lat, d.lng];
  });

  if (points.length > 1) {
    L.polyline(points, { color: '#FF6B6B', weight: 3, dashArray: '10, 10', opacity: 0.7 }).addTo(mainMap);
    mainMap.fitBounds(L.polyline(points).getBounds(), { padding: [50, 50] });
  } else if (points.length === 1) {
    mainMap.setView(points[0], 10);
  }

  updateMapLegend(destinations);
  updateMapStats(destinations, unmatchedCities);
}

function updateMapLegend(destinations) {
  const legend = document.getElementById('map-legend-container');
  if (!legend) return;
  legend.innerHTML = destinations.map(d => `
    <div class="legend-item" style="display:flex; align-items:center; gap:8px; margin-bottom:4px; font-size:0.9rem;">
      <span style="width:12px; height:12px; border-radius:50%; background:${d.color}; border:1px solid #fff; box-shadow:0 0 2px rgba(0,0,0,0.2);"></span>
      <span>${d.name}</span>
    </div>
  `).join('');
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
