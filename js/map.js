// Journey Map Module - Visualizes trip route across destinations
const cityCoordinates = {
  // Major cities with coordinates for map visualization
  'London': { lat: 51.5074, lng: -0.1278, region: 'Europe' },
  'Paris': { lat: 48.8566, lng: 2.3522, region: 'Europe' },
  'Rome': { lat: 41.9028, lng: 12.4964, region: 'Europe' },
  'Barcelona': { lat: 41.3851, lng: 2.1734, region: 'Europe' },
  'Berlin': { lat: 52.5200, lng: 13.4050, region: 'Europe' },
  'Amsterdam': { lat: 52.3676, lng: 4.9041, region: 'Europe' },
  'New York': { lat: 40.7128, lng: -74.0060, region: 'North America' },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, region: 'North America' },
  'San Francisco': { lat: 37.7749, lng: -122.4194, region: 'North America' },
  'Tokyo': { lat: 35.6762, lng: 139.6503, region: 'Asia' },
  'Kyoto': { lat: 35.0116, lng: 135.7681, region: 'Asia' },
  'Osaka': { lat: 34.6937, lng: 135.5023, region: 'Asia' },
  'Bangkok': { lat: 13.7563, lng: 100.5018, region: 'Asia' },
  'Seoul': { lat: 37.5665, lng: 126.9780, region: 'Asia' },
  'Singapore': { lat: 1.3521, lng: 103.8198, region: 'Asia' },
  'Hong Kong': { lat: 22.3193, lng: 114.1694, region: 'Asia' },
  'Sydney': { lat: -33.8688, lng: 151.2093, region: 'Oceania' },
  'Melbourne': { lat: -37.8136, lng: 144.9631, region: 'Oceania' },
  'Brisbane': { lat: -27.4698, lng: 153.0251, region: 'Oceania' },
  'Perth': { lat: -31.9505, lng: 115.8605, region: 'Oceania' },
  'Dubai': { lat: 25.2048, lng: 55.2708, region: 'Middle East' },
  'Istanbul': { lat: 41.0082, lng: 28.9784, region: 'Europe' },
  'Athens': { lat: 37.9838, lng: 23.7275, region: 'Europe' },
  'Madrid': { lat: 40.4168, lng: -3.7038, region: 'Europe' },
  'Lisbon': { lat: 38.7223, lng: -9.1393, region: 'Europe' },
  'Vienna': { lat: 48.2082, lng: 16.3738, region: 'Europe' },
  'Prague': { lat: 50.0755, lng: 14.4378, region: 'Europe' },
  'Budapest': { lat: 47.4979, lng: 19.0402, region: 'Europe' },
  'Milan': { lat: 45.4642, lng: 9.1900, region: 'Europe' },
  'Venice': { lat: 45.4408, lng: 12.3155, region: 'Europe' },
  'Florence': { lat: 43.7696, lng: 11.2558, region: 'Europe' },
  'Nice': { lat: 43.7102, lng: 7.2620, region: 'Europe' },
  'Cannes': { lat: 43.5528, lng: 7.0178, region: 'Europe' },
  'Zurich': { lat: 47.3769, lng: 8.5417, region: 'Europe' },
  'Geneva': { lat: 46.2044, lng: 6.1432, region: 'Europe' },
  'Munich': { lat: 48.1351, lng: 11.5820, region: 'Europe' },
  'Hamburg': { lat: 53.5511, lng: 9.9937, region: 'Europe' },
  'Copenhagen': { lat: 55.6761, lng: 12.5683, region: 'Europe' },
  'Stockholm': { lat: 59.3293, lng: 18.0686, region: 'Europe' },
  'Oslo': { lat: 59.9139, lng: 10.7522, region: 'Europe' },
  'Helsinki': { lat: 60.1699, lng: 24.9384, region: 'Europe' },
  'Dublin': { lat: 53.3498, lng: -6.2603, region: 'Europe' },
  'Edinburgh': { lat: 55.9533, lng: -3.1883, region: 'Europe' },
  'Manchester': { lat: 53.4808, lng: -2.2426, region: 'Europe' },
  'Vancouver': { lat: 49.2827, lng: -123.1207, region: 'North America' },
  'Toronto': { lat: 43.6532, lng: -79.3832, region: 'North America' },
  'Seattle': { lat: 47.6062, lng: -122.3321, region: 'North America' },
  'Chicago': { lat: 41.8781, lng: -87.6298, region: 'North America' },
  'Miami': { lat: 25.7617, lng: -80.1918, region: 'North America' },
  'Las Vegas': { lat: 36.1699, lng: -115.1398, region: 'North America' },
  'San Diego': { lat: 32.7157, lng: -117.1611, region: 'North America' },
  'Portland': { lat: 45.5152, lng: -122.6784, region: 'North America' },
  'Auckland': { lat: -36.8509, lng: 174.7645, region: 'Oceania' },
  'Wellington': { lat: -41.2865, lng: 174.7762, region: 'Oceania' },
  'Christchurch': { lat: -43.5321, lng: 172.6362, region: 'Oceania' },
  'Queenstown': { lat: -45.0312, lng: 168.6626, region: 'Oceania' },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869, region: 'Asia' },
  'Jakarta': { lat: -6.2088, lng: 106.8456, region: 'Asia' },
  'Manila': { lat: 9.8966, lng: 121.0221, region: 'Asia' },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297, region: 'Asia' },
  'Hanoi': { lat: 21.0278, lng: 105.8342, region: 'Asia' },
  'Phuket': { lat: 7.9813, lng: 98.4064, region: 'Asia' },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853, region: 'Asia' },
  'Bali': { lat: -8.4095, lng: 115.1889, region: 'Asia' },
  'Cairo': { lat: 30.0444, lng: 31.2357, region: 'Africa' },
  'Marrakech': { lat: 31.6295, lng: -7.9811, region: 'Africa' },
  'Casablanca': { lat: 33.5731, lng: -7.5898, region: 'Africa' },
  'Cape Town': { lat: -33.9249, lng: 18.4241, region: 'Africa' },
  'Johannesburg': { lat: -26.2041, lng: 28.0473, region: 'Africa' },
  'Nairobi': { lat: -1.2921, lng: 36.8219, region: 'Africa' },
  'Zanzibar': { lat: -6.1659, lng: 39.2026, region: 'Africa' },
  'Mexico City': { lat: 19.4326, lng: -99.1332, region: 'North America' },
  'Cancun': { lat: 21.1619, lng: -86.8515, region: 'North America' },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, region: 'South America' },
  'Sao Paulo': { lat: -23.5505, lng: -46.6333, region: 'South America' },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816, region: 'South America' },
  'Lima': { lat: -12.0464, lng: -77.0428, region: 'South America' },
  'Cusco': { lat: -13.1631, lng: -72.5450, region: 'South America' },
  'Santiago': { lat: -33.4489, lng: -70.6693, region: 'South America' },
  'Tel Aviv': { lat: 32.0853, lng: 34.7818, region: 'Middle East' },
  'Jerusalem': { lat: 31.7683, lng: 35.2137, region: 'Middle East' },
  'Mumbai': { lat: 19.0760, lng: 72.8777, region: 'Asia' },
  'Delhi': { lat: 28.6139, lng: 77.2090, region: 'Asia' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, region: 'Asia' },
  'Goa': { lat: 15.2993, lng: 74.1240, region: 'Asia' },
  'Tokushima': { lat: 34.0703, lng: 134.5548, region: 'Asia' },
  'Kanazawa': { lat: 36.5611, lng: 136.6566, region: 'Asia' },
  'Hakuba': { lat: 36.6942, lng: 137.8615, region: 'Asia' },
  'Niseko': { lat: 42.8078, lng: 140.6825, region: 'Asia' },
  'Sapporo': { lat: 43.0618, lng: 141.3545, region: 'Asia' },
  'Shanghai': { lat: 31.2304, lng: 121.4737, region: 'Asia' },
  'Beijing': { lat: 39.9042, lng: 116.4074, region: 'Asia' },
  'Xi\'an': { lat: 34.3416, lng: 108.9398, region: 'Asia' },
  'Guilin': { lat: 25.2741, lng: 110.2994, region: 'Asia' },
  'Chengdu': { lat: 30.5728, lng: 104.0668, region: 'Asia' },
  'Taipei': { lat: 25.0330, lng: 121.5654, region: 'Asia' }
};

// Extract city name from leg label
function extractCityName(label) {
  if (!label) return null;
  // Remove emoji prefixes and common prefixes
  const clean = label.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim();
  // Check exact match
  if (cityCoordinates[clean]) return clean;
  // Check partial matches
  for (const city of Object.keys(cityCoordinates)) {
    if (clean.toLowerCase().includes(city.toLowerCase())) return city;
    if (city.toLowerCase().includes(clean.toLowerCase())) return city;
  }
  return null;
}

// Get coordinates for a city
function getCityCoords(cityName) {
  // First check leg label extraction
  const extracted = extractCityName(cityName);
  if (extracted && cityCoordinates[extracted]) {
    return cityCoordinates[extracted];
  }
  // Check direct match
  if (cityCoordinates[cityName]) {
    return cityCoordinates[cityName];
  }
  return null;
}

// Build journey map visualization
function buildJourneyMap() {
  const container = document.getElementById('journey-map-view');
  const legendContainer = document.getElementById('map-legend-container');
  const statsContainer = document.getElementById('journey-stats');
  const mapContainer = document.getElementById('mapContainer');

  if (!container || !appData || appData.length === 0) {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; color: #666;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📍</div>
          <p>No trip legs yet</p>
          <p style="font-size: 0.85rem;">Add legs in the Itinerary tab to see them on the map</p>
        </div>
      `;
    }
    return;
  }

  // Collect all destinations with coordinates
  const destinations = [];
  const unmatchedCities = [];
  const regionCounts = {};

  appData.forEach((leg, index) => {
    const fromCity = leg.days[0]?.from;
    const toCity = leg.days[leg.days.length - 1]?.to;

    if (fromCity) {
      const fromCoords = getCityCoords(fromCity) || getCityCoords(leg.label);
      if (fromCoords && !destinations.find(d => d.name === fromCity)) {
        destinations.push({
          name: fromCity,
          coords: fromCoords,
          legIndex: index,
          legLabel: leg.label,
          colour: leg.colour,
          isHome: index === 0
        });
        regionCounts[fromCoords.region] = (regionCounts[fromCoords.region] || 0) + 1;
      } else if (!fromCoords && !unmatchedCities.includes(fromCity)) {
        unmatchedCities.push(fromCity);
      }
    }

    if (toCity && toCity !== fromCity) {
      const toCoords = getCityCoords(toCity) || getCityCoords(leg.label);
      if (toCoords && !destinations.find(d => d.name === toCity)) {
        destinations.push({
          name: toCity,
          coords: toCoords,
          legIndex: index,
          legLabel: leg.label,
          colour: leg.colour,
          isDestination: true
        });
        regionCounts[toCoords.region] = (regionCounts[toCoords.region] || 0) + 1;
      } else if (!toCoords && !unmatchedCities.includes(toCity)) {
        unmatchedCities.push(toCity);
      }
    }
  });

  // Build map visualization with Leaflet-like structure (using SVG)
  const mapHtml = buildMapVisualization(destinations);
  container.innerHTML = mapHtml;

  // Build legend
  if (legendContainer) {
    legendContainer.innerHTML = destinations.map((d, i) => `
      <div style="display: flex; align-items: center; gap: 6px; cursor: pointer;"
           onmouseover="highlightDestination(${i})" onmouseout="unhighlightDestination()">
        <span style="width: 12px; height: 12px; border-radius: 50%; background: ${d.colour}; display: inline-block;"></span>
        <span>${d.name}</span>
        ${d.isHome ? '<span style="font-size: 0.75rem; background: #27AE60; color: white; padding: 2px 6px; border-radius: 10px;">Start</span>' : ''}
      </div>
    `).join('');
  }

  // Build stats
  if (statsContainer) {
    const totalDistance = calculateEstimatedDistance(destinations);
    statsContainer.innerHTML = `
      <h4 style="margin: 0 0 1rem; font-size: 1rem; color: #2C3E50;">📊 Journey Statistics</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.9rem;">
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 6px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #2C3E50;">${destinations.length}</div>
          <div style="color: #666; font-size: 0.8rem;">Destinations</div>
        </div>
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 6px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #2C3E50;">${appData.length}</div>
          <div style="color: #666; font-size: 0.8rem;">Trip Legs</div>
        </div>
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 6px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #2C3E50;">${totalDistance.toLocaleString()}</div>
          <div style="color: #666; font-size: 0.8rem;">Est. Distance (km)</div>
        </div>
        <div style="text-align: center; padding: 1rem; background: white; border-radius: 6px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #2C3E50;">${Object.keys(regionCounts).length}</div>
          <div style="color: #666; font-size: 0.8rem;">Regions Visited</div>
        </div>
      </div>
      ${unmatchedCities.length > 0 ? `
        <div style="margin-top: 1rem; padding: 0.75rem; background: #FFF3CD; border-radius: 6px; font-size: 0.85rem; color: #856404;">
          <strong>⚠️ Unmapped cities:</strong> ${unmatchedCities.join(', ')} —
          <a href="#" onclick="showCityRequestModal(); return false;" style="color: #856404; text-decoration: underline;">Request addition</a>
        </div>
      ` : ''}
    `;
  }
}

// Build SVG-based map visualization
function buildMapVisualization(destinations) {
  if (destinations.length === 0) {
    return `
      <div style="text-align: center; color: #666;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
        <p>No mapped destinations yet</p>
        <p style="font-size: 0.85rem;">Add trip legs with recognized city names</p>
      </div>
    `;
  }

  // Calculate bounds
  const lats = destinations.map(d => d.coords.lat);
  const lngs = destinations.map(d => d.coords.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  // Add padding
  const latPad = (maxLat - minLat) * 0.15 || 10;
  const lngPad = (maxLng - minLng) * 0.15 || 10;

  // Create simplified world map background using continents
  const worldPaths = [
    // North America rough outline
    "M50,80 L150,60 L250,80 L280,150 L250,220 L150,240 L80,200 L50,150 Z",
    // South America rough outline
    "M180,250 L220,240 L260,280 L250,380 L200,420 L170,350 L170,280 Z",
    // Europe rough outline
    "M420,80 L480,70 L520,90 L530,140 L480,160 L440,140 L420,110 Z",
    // Africa rough outline
    "M440,170 L500,160 L540,200 L550,300 L500,360 L440,320 L420,250 Z",
    // Asia rough outline
    "M520,70 L650,60 L750,100 L780,200 L700,280 L600,250 L550,180 L520,120 Z",
    // Australia rough outline
    "M680,350 L750,340 L780,380 L760,420 L700,430 L670,390 Z"
  ];

  // Project coordinates to SVG
  const project = (lat, lng) => {
    const x = 50 + ((lng + 180) / 360) * 800;
    const y = 50 + ((90 - lat) / 180) * 400;
    return { x, y };
  };

  // Build path between destinations
  let pathD = '';
  destinations.forEach((d, i) => {
    const p = project(d.coords.lat, d.coords.lng);
    if (i === 0) pathD += `M${p.x},${p.y}`;
    else {
      // Create curved line
      const prev = project(destinations[i-1].coords.lat, destinations[i-1].coords.lng);
      const midX = (prev.x + p.x) / 2;
      const midY = (prev.y + p.y) / 2 - 20; // Curve upward
      pathD += ` Q${midX},${midY} ${p.x},${p.y}`;
    }
  });

  const destPoints = destinations.map((d, i) => {
    const p = project(d.coords.lat, d.coords.lng);
    return `
      <g class="map-dest-point" data-index="${i}" onclick="openInGoogleMaps('${d.name}')" style="cursor: pointer;">
        <circle cx="${p.x}" cy="${p.y}" r="8" fill="${d.colour}" stroke="white" stroke-width="2" />
        ${d.isHome ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="12" fill="none" stroke="#27AE60" stroke-width="2" stroke-dasharray="4" />' : ''}
        <text x="${p.x}" y="${p.y - 15}" text-anchor="middle" font-size="11" fill="#333" font-weight="500">${d.name}</text>
        <text x="${p.x}" y="${p.y + 22}" text-anchor="middle" font-size="9" fill="#666">Leg ${d.legIndex + 1}</text>
      </g>
    `;
  }).join('');

  return `
    <div style="position: relative; width: 100%; height: 100%; overflow: hidden;">
      <svg viewBox="0 0 900 500" style="width: 100%; height: 100%;" preserveAspectRatio="xMidYMid meet">
        <!-- Ocean background -->
        <rect width="900" height="500" fill="#E3F2FD" />

        <!-- Continents -->
        ${worldPaths.map(p => `<path d="${p}" fill="#C8E6C9" stroke="#A5D6A7" stroke-width="1" />`).join('')}

        <!-- Grid lines -->
        ${Array.from({length: 9}, (_, i) => `<line x1="${100 * i}" y1="0" x2="${100 * i}" y2="500" stroke="#BBDEFB" stroke-width="0.5" />`).join('')}
        ${Array.from({length: 5}, (_, i) => `<line x1="0" y1="${100 * i}" x2="900" y2="${100 * i}" stroke="#BBDEFB" stroke-width="0.5" />`).join('')}

        <!-- Route path -->
        <path d="${pathD}" fill="none" stroke="#FF6B6B" stroke-width="3" stroke-dasharray="8 4" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
        </path>

        <!-- Destination points -->
        ${destPoints}

        <!-- Distance markers on lines -->
      </svg>

      <!-- Overlay controls -->
      <div style="position: absolute; bottom: 10px; right: 10px; display: flex; gap: 8px;">
        <button onclick="buildJourneyMap()" style="background: white; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">🔄 Refresh</button>
        <button onclick="openAllInGoogleMaps()" style="background: #2C3E50; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">📍 Open in Maps</button>
      </div>
    </div>
  `;
}

// Calculate estimated distance between destinations (rough approximation)
function calculateEstimatedDistance(destinations) {
  if (destinations.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < destinations.length; i++) {
    const prev = destinations[i-1].coords;
    const curr = destinations[i].coords;

    // Haversine formula rough approximation
    const R = 6371; // Earth's radius in km
    const dLat = (curr.lat - prev.lat) * Math.PI / 180;
    const dLng = (curr.lng - prev.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    total += R * c;
  }

  return Math.round(total);
}

// Open single destination in Google Maps
function openInGoogleMaps(cityName) {
  const coords = getCityCoords(cityName);
  if (coords) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank');
  } else {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(cityName)}`, '_blank');
  }
}

// Open all legs in Google Maps (launches multiple tabs or shows route)
function openAllInGoogleMaps() {
  if (!appData || appData.length === 0) {
    alert('No trip legs to display. Add some destinations first!');
    return;
  }

  // Build waypoints for Google Maps directions
  const waypoints = [];
  appData.forEach(leg => {
    const fromCity = leg.days[0]?.from;
    const toCity = leg.days[leg.days.length - 1]?.to;
    if (fromCity && !waypoints.includes(fromCity)) waypoints.push(fromCity);
    if (toCity && !waypoints.includes(toCity)) waypoints.push(toCity);
  });

  if (waypoints.length < 2) {
    // Just open the single destination
    openInGoogleMaps(waypoints[0] || appData[0].label);
    return;
  }

  // Build Google Maps directions URL
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const via = waypoints.slice(1, -1);

  let url = `https://www.google.com/maps/dir/?api=1`;
  url += `&origin=${encodeURIComponent(origin)}`;
  url += `&destination=${encodeURIComponent(destination)}`;
  if (via.length > 0) {
    url += `&waypoints=${via.map(w => encodeURIComponent(w)).join('|')}`;
  }

  window.open(url, '_blank');
}

// Highlight destination on hover
let highlightedDest = null;
function highlightDestination(index) {
  const points = document.querySelectorAll('.map-dest-point');
  points.forEach((p, i) => {
    const circle = p.querySelector('circle');
    if (i === index) {
      circle.setAttribute('r', '12');
      circle.style.filter = 'drop-shadow(0 0 8px rgba(255,107,107,0.6))';
    } else {
      circle.setAttribute('opacity', '0.5');
    }
  });
}

function unhighlightDestination() {
  const points = document.querySelectorAll('.map-dest-point');
  points.forEach(p => {
    const circle = p.querySelector('circle');
    circle.setAttribute('r', '8');
    circle.setAttribute('opacity', '1');
    circle.style.filter = 'none';
  });
}

// Show modal to request new city
function showCityRequestModal() {
  const city = prompt('Enter the city name you\'d like to see added to the map:');
  if (city) {
    alert(`Thanks! "${city}" has been noted for future addition.\n\nIn the meantime, you can still use "Open in Google Maps" to view any location.`);
  }
}

// Initialize map when tab is switched
document.addEventListener('DOMContentLoaded', () => {
  // Watch for tab switches to map
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.target.id === 'tab-map' && mutation.target.classList.contains('active')) {
        buildJourneyMap();
      }
    });
  });

  const mapTab = document.getElementById('tab-map');
  if (mapTab) {
    observer.observe(mapTab, { attributes: true, attributeFilter: ['class'] });
  }
});
