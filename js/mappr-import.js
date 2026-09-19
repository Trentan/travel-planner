/* ==========================================================================
   MODULE: Mappr Map Importer (js/mappr-import.js)
   Responsibilities: Fetching, parsing, and importing curated spots from
   mappr.com maps into itinerary activities and suggested sights (Issue #163).
   ========================================================================== */

(function (window) {
  'use strict';

  /**
   * Infer activity category from spot name, summary, and why_go
   */
  function inferSpotCategory(name, summary, whyGo) {
    const blob = ` ${name || ''} ${summary || ''} ${whyGo || ''} `.toLowerCase();
    if (/\b(cafe|coffee|roaster|bakery|pastry|breakfast|brunch)\b/.test(blob)) return { category: 'food', icon: '☕', label: 'Cafe' };
    if (/\b(restaurant|dinner|lunch|bistro|cuisine|eats|pizza|burger|tapas|trattoria|pasta|food)\b/.test(blob)) return { category: 'food', icon: '🍽️', label: 'Food & Drink' };
    if (/\b(bar|pub|cocktail|brewery|wine|beer|nightlife)\b/.test(blob)) return { category: 'food', icon: '🍸', label: 'Bar & Drinks' };
    if (/\b(museum|gallery|exhibition|art|sculpture|mural)\b/.test(blob)) return { category: 'sight', icon: '🎨', label: 'Art & Culture' };
    if (/\b(church|basilica|cathedral|temple|monastery|palace|castle|fortress|monument|statue|historic|ruins)\b/.test(blob)) return { category: 'sight', icon: '🏛️', label: 'Landmark' };
    if (/\b(park|garden|botanical|lake|river|waterfall|beach|nature|mountain|viewpoint|lookout|peak)\b/.test(blob)) return { category: 'run', icon: '🌿', label: 'Nature & Views' };
    if (/\b(market|shopping|mall|boutique|store|bazaar)\b/.test(blob)) return { category: 'sight', icon: '🛍️', label: 'Shopping' };
    return { category: 'sight', icon: '📍', label: 'Sightseeing' };
  }

  /**
   * Parse Nuxt 3 flattened array payload or standard JSON
   */
  function parseMapprPayload(rawInput) {
    if (!rawInput) return { spots: [], title: '', city: '' };

    let data = null;
    let title = '';
    let city = '';

    // If input is an HTML string, extract __NUXT_DATA__ script tag and title
    if (typeof rawInput === 'string' && rawInput.includes('<')) {
      const titleMatch = rawInput.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].replace(/\|\s*Mappr.*/i, '').trim();
      }

      const nuxtMatch = rawInput.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i)
        || rawInput.match(/<script[^>]*>\s*window\.__NUXT__\s*=\s*([\s\S]*?);?\s*<\/script>/i);

      if (nuxtMatch) {
        try {
          data = JSON.parse(nuxtMatch[1]);
        } catch (e) {
          console.warn('[MapprImport] Failed to parse extracted Nuxt JSON:', e);
        }
      }
    } else if (typeof rawInput === 'string') {
      try {
        data = JSON.parse(rawInput);
      } catch (e) {
        // Not valid JSON
      }
    } else if (Array.isArray(rawInput) || typeof rawInput === 'object') {
      data = rawInput;
    }

    if (!data) {
      return { spots: [], title: title || 'Mappr Map', city };
    }

    // Nuxt 3 stores flat serialized array of pointers
    if (Array.isArray(data)) {
      function deref(v) {
        if (typeof v === 'number' && data[v] !== undefined) {
          return data[v];
        }
        return v;
      }

      const spots = [];

      // Scan items in array that look like map spot objects
      data.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          // Identify spots by characteristic properties
          if (item.name && (item.lat !== undefined || item.latitude !== undefined) && (item.lon !== undefined || item.lng !== undefined)) {
            const rawName = deref(item.name);
            if (typeof rawName === 'string' && rawName.trim().length > 0) {
              const latVal = parseFloat(deref(item.lat || item.latitude));
              const lngVal = parseFloat(deref(item.lon || item.lng || item.longitude));
              const summary = deref(item.summary) || deref(item.description) || '';
              const tips = deref(item.tips) || '';
              const whyGo = deref(item.why_go) || '';
              const address = deref(item.formatted_address) || '';
              const website = deref(item.website) || '';
              const catInfo = inferSpotCategory(rawName, summary, whyGo);

              // Avoid duplicates
              if (!spots.some(s => s.name.toLowerCase() === rawName.toLowerCase())) {
                spots.push({
                  name: rawName.trim(),
                  lat: Number.isFinite(latVal) ? latVal : null,
                  lng: Number.isFinite(lngVal) ? lngVal : null,
                  summary: typeof summary === 'string' ? summary.trim() : '',
                  tips: typeof tips === 'string' ? tips.trim() : '',
                  whyGo: typeof whyGo === 'string' ? whyGo.trim() : '',
                  formatted_address: typeof address === 'string' ? address.trim() : '',
                  website: typeof website === 'string' ? website.trim() : '',
                  category: catInfo.category,
                  icon: catInfo.icon,
                  categoryLabel: catInfo.label
                });
              }
            }
          }

          // Look for map metadata (title / city)
          if (!title && item.title) {
            const rawTitle = deref(item.title);
            if (typeof rawTitle === 'string') title = rawTitle.trim();
          }
          if (!city && item.city_name) {
            const rawCity = deref(item.city_name);
            if (typeof rawCity === 'string') city = rawCity.trim();
          }
        }
      });

      return { spots, title: title || 'Mappr Curated Map', city };
    }

    return { spots: [], title: title || 'Mappr Map', city };
  }

  /**
   * Fetch a Mappr URL via direct fetch or transparent CORS proxy
   */
  async function fetchMapprMapUrl(mapUrl) {
    const cleanUrl = String(mapUrl || '').trim();
    if (!cleanUrl) throw new Error('Please enter a valid Mappr map URL.');

    // 1. Try direct fetch
    try {
      const res = await fetch(cleanUrl, { mode: 'cors' });
      if (res.ok) {
        const text = await res.text();
        return parseMapprPayload(text);
      }
    } catch (err) {
      // Direct CORS blocked, proceed to fallback proxy
    }

    // 2. Try AllOrigins public CORS proxy
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(cleanUrl);
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        return parseMapprPayload(text);
      }
    } catch (err) {
      // Proxy failed
    }

    throw new Error('Could not fetch map URL directly due to browser CORS policies. Please paste the page HTML into the fallback box below.');
  }

  /**
   * UI: Open the initial Mappr URL paste modal
   */
  function openMapprImportModal() {
    let modal = document.getElementById('mappr-import-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mappr-import-modal';
      modal.className = 'modal mappr-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'mapprModalTitle');
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeMapprImportModal()"></div>
      <div class="modal-content max-w-lg p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🗺️</span>
            <h3 id="mapprModalTitle" class="text-lg font-bold text-slate-800 dark:text-slate-100">Import from Mappr.com</h3>
          </div>
          <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1" onclick="closeMapprImportModal()">✕</button>
        </div>

        <div class="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Paste a curated map link from <a href="https://mappr.com/maps" target="_blank" class="text-teal-600 dark:text-teal-400 underline font-semibold">mappr.com/maps</a> to automatically import attractions, cafes, viewpoints, and photo spots into your trip.
          </p>

          <div>
            <label for="mapprUrlInput" class="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Mappr Map URL:</label>
            <input type="url" id="mapprUrlInput" placeholder="https://mappr.com/maps/the-perfect-2-day-bratislava-itinerary-2c3978" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500">
          </div>

          <div id="mapprFetchStatus" class="hidden p-3 rounded-xl text-xs"></div>

          <details class="text-xs text-slate-500 dark:text-slate-400">
            <summary class="cursor-pointer hover:underline">Or paste raw page source / JSON</summary>
            <div class="mt-2">
              <textarea id="mapprRawInput" rows="4" placeholder="Paste full page HTML or Nuxt payload here if offline or CORS blocked..." class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-xs"></textarea>
            </div>
          </details>
        </div>

        <div class="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" class="action-btn action-btn-secondary px-4 py-2 text-xs" onclick="closeMapprImportModal()">Cancel</button>
          <button type="button" id="mapprFetchBtn" class="action-btn action-btn-primary px-5 py-2 text-xs font-semibold" onclick="handleMapprFetchSubmit()">Fetch Spots</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  function closeMapprImportModal() {
    const modal = document.getElementById('mappr-import-modal');
    if (modal) modal.style.display = 'none';
  }

  /**
   * Handle user submitting the URL or raw HTML
   */
  async function handleMapprFetchSubmit() {
    const urlInput = document.getElementById('mapprUrlInput');
    const rawInput = document.getElementById('mapprRawInput');
    const statusBox = document.getElementById('mapprFetchStatus');
    const fetchBtn = document.getElementById('mapprFetchBtn');

    const url = urlInput ? urlInput.value.trim() : '';
    const raw = rawInput ? rawInput.value.trim() : '';

    if (!url && !raw) {
      if (statusBox) {
        statusBox.className = 'p-3 rounded-xl text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 block';
        statusBox.textContent = 'Please provide a Mappr map URL or paste page content.';
      }
      return;
    }

    if (statusBox) {
      statusBox.className = 'p-3 rounded-xl text-xs bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 block';
      statusBox.textContent = 'Fetching and parsing map spots...';
    }
    if (fetchBtn) fetchBtn.disabled = true;

    try {
      let result = null;
      if (raw) {
        result = parseMapprPayload(raw);
      } else {
        result = await fetchMapprMapUrl(url);
      }

      if (!result || !Array.isArray(result.spots) || result.spots.length === 0) {
        throw new Error('No spots could be extracted from this map. Please check the URL or paste the raw page HTML.');
      }

      closeMapprImportModal();
      openMapprReviewModal(result.spots, result.title, result.city);
    } catch (err) {
      if (statusBox) {
        statusBox.className = 'p-3 rounded-xl text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 block';
        statusBox.textContent = err.message || 'Failed to extract spots.';
      }
    } finally {
      if (fetchBtn) fetchBtn.disabled = false;
    }
  }

  /**
   * UI: Review and selection modal
   */
  function openMapprReviewModal(spotsOrResult, mapTitle, detectedCity) {
    let spots = spotsOrResult;
    let title = mapTitle;
    let city = detectedCity;
    if (spotsOrResult && !Array.isArray(spotsOrResult) && Array.isArray(spotsOrResult.spots)) {
      spots = spotsOrResult.spots;
      title = mapTitle || spotsOrResult.title;
      city = detectedCity || spotsOrResult.city;
    }
    closeMapprImportModal();
    let modal = document.getElementById('mappr-review-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mappr-review-modal';
      modal.className = 'modal mappr-review-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'mapprReviewTitle');
      document.body.appendChild(modal);
    }

    const legs = (typeof appData !== 'undefined' && Array.isArray(appData)) ? appData : [];

    // Pre-select matching leg if detected city matches
    let matchedLegIdx = 0;
    if (detectedCity && legs.length > 0) {
      const idx = legs.findIndex(l => {
        const name = (l.label || l.to || '').toLowerCase();
        return name.includes(detectedCity.toLowerCase());
      });
      if (idx !== -1) matchedLegIdx = idx;
    }

    const legOptionsHtml = legs.map((leg, idx) => {
      const label = leg.label || leg.to || `Leg ${idx + 1}`;
      return `<option value="${idx}" ${idx === matchedLegIdx ? 'selected' : ''}>${escapeCompactText(label)}</option>`;
    }).join('');

    const spotsRowsHtml = spots.map((spot, idx) => {
      const coordLabel = (spot.lat && spot.lng) ? `${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}` : '';
      return `
        <tr class="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
          <td class="p-2.5 text-center">
            <input type="checkbox" class="mappr-spot-check rounded cursor-pointer" data-spot-index="${idx}" checked>
          </td>
          <td class="mappr-spot-name p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
            <span class="mr-1">${spot.icon}</span> ${escapeCompactText(spot.name)}
          </td>
          <td class="p-2.5 text-xs text-slate-500 dark:text-slate-400">
            <span class="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[0.7rem] font-medium">${spot.categoryLabel}</span>
          </td>
          <td class="p-2.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title="${escapeCompactText(spot.summary)}">
            ${escapeCompactText(spot.summary || '—')}
          </td>
          <td class="p-2.5 text-xs font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
            ${coordLabel ? `📍 ${coordLabel}` : '—'}
          </td>
        </tr>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeMapprReviewModal()"></div>
      <div class="modal-content max-w-3xl max-h-[85vh] flex flex-col p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-2xl">🗺️</span>
              <h3 id="mapprReviewTitle" class="text-lg font-bold text-slate-800 dark:text-slate-100">${escapeCompactText(mapTitle || 'Mappr Spots')}</h3>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Found ${spots.length} spots. Select destination and items to merge into your itinerary.</p>
          </div>
          <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1" onclick="closeMapprReviewModal()">✕</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0 text-sm">
          <div>
            <label for="mapprTargetLeg" class="block font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">Target Trip Leg / City:</label>
            <select id="mapprTargetLeg" class="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100" onchange="updateMapprDaysDropdown()">
              ${legOptionsHtml || '<option value="0">Default Trip Leg</option>'}
            </select>
          </div>
          <div>
            <label for="mapprTargetDestination" class="block font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">Destination:</label>
            <select id="mapprTargetDestination" class="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100">
              <option value="suggested" selected>★ Suggested Activities Pool (for Drag & Drop)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between py-2 shrink-0 text-xs">
          <div class="flex items-center gap-2">
            <button type="button" class="text-teal-600 dark:text-teal-400 font-semibold hover:underline" onclick="toggleAllMapprSpots(true)">Select All</button>
            <span class="text-slate-300 dark:text-slate-600">|</span>
            <button type="button" class="text-slate-500 hover:underline" onclick="toggleAllMapprSpots(false)">Deselect All</button>
          </div>
          <span id="mapprSelectedCount" class="font-medium text-slate-500 dark:text-slate-400">${spots.length} selected</span>
        </div>

        <div class="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-700 rounded-xl">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-900 text-[0.72rem] text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-2.5 w-10 text-center">Import</th>
                <th class="p-2.5">Spot Name</th>
                <th class="p-2.5">Category</th>
                <th class="p-2.5">Summary</th>
                <th class="p-2.5">Coordinates</th>
              </tr>
            </thead>
            <tbody>
              ${spotsRowsHtml}
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button type="button" class="action-btn action-btn-secondary px-4 py-2 text-xs" onclick="closeMapprReviewModal()">Cancel</button>
          <button type="button" id="mapprImportConfirmBtn" class="action-btn action-btn-primary px-5 py-2 text-xs font-semibold" onclick="confirmMapprImport()">Import Spots</button>
        </div>
      </div>
    `;

    window._currentMapprSpots = spots;
    modal.style.display = 'flex';
    updateMapprDaysDropdown();
    setupSpotCheckListeners();
  }

  function closeMapprReviewModal() {
    const modal = document.getElementById('mappr-review-modal');
    if (modal) modal.style.display = 'none';
  }

  function setupSpotCheckListeners() {
    const checks = document.querySelectorAll('.mappr-spot-check');
    const counter = document.getElementById('mapprSelectedCount');
    checks.forEach(ch => {
      ch.addEventListener('change', () => {
        const count = document.querySelectorAll('.mappr-spot-check:checked').length;
        if (counter) counter.textContent = `${count} selected`;
      });
    });
  }

  function toggleAllMapprSpots(selectAll) {
    const checks = document.querySelectorAll('.mappr-spot-check');
    checks.forEach(ch => { ch.checked = selectAll; });
    const counter = document.getElementById('mapprSelectedCount');
    if (counter) counter.textContent = `${selectAll ? checks.length : 0} selected`;
  }

  function updateMapprDaysDropdown() {
    const legSelect = document.getElementById('mapprTargetLeg');
    const destSelect = document.getElementById('mapprTargetDestination');
    if (!legSelect || !destSelect) return;

    const legIdx = parseInt(legSelect.value, 10);
    const leg = (typeof appData !== 'undefined' && Array.isArray(appData)) ? appData[legIdx] : null;

    let options = '<option value="suggested" selected>★ Suggested Activities Pool (for Drag & Drop)</option>';
    if (leg && Array.isArray(leg.days)) {
      leg.days.forEach((day, dIdx) => {
        const dateLabel = (typeof formatTripDateForDisplay === 'function') ? formatTripDateForDisplay(day.date) : day.date;
        options += `<option value="day_${dIdx}">Day ${dIdx + 1} (${dateLabel})</option>`;
      });
    }
    destSelect.innerHTML = options;
  }

  /**
   * Final merge of selected spots into the trip itinerary
   */
  function confirmMapprImport() {
    const spots = window._currentMapprSpots;
    if (!Array.isArray(spots) || spots.length === 0) return;

    const legSelect = document.getElementById('mapprTargetLeg');
    const destSelect = document.getElementById('mapprTargetDestination');
    const legIdx = legSelect ? parseInt(legSelect.value, 10) : 0;
    const destVal = destSelect ? destSelect.value : 'suggested';

    if (!appData || !appData[legIdx]) {
      alert('Selected trip leg not found.');
      return;
    }

    const checks = document.querySelectorAll('.mappr-spot-check:checked');
    const selectedIndices = Array.from(checks).map(c => parseInt(c.getAttribute('data-spot-index'), 10));

    if (selectedIndices.length === 0) {
      alert('Please select at least one spot to import.');
      return;
    }

    const targetLeg = appData[legIdx];
    let importedCount = 0;

    selectedIndices.forEach(idx => {
      const spot = spots[idx];
      if (!spot) return;

      const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const noteParts = [spot.summary, spot.tips ? `Tip: ${spot.tips}` : '', spot.whyGo ? `Why go: ${spot.whyGo}` : '', spot.website ? `Website: ${spot.website}` : ''].filter(Boolean);
      const notes = noteParts.join(' · ');
      const location = spot.formatted_address || (spot.lat && spot.lng ? `${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}` : '');

      if (destVal === 'suggested') {
        if (!targetLeg.suggestedActivities) targetLeg.suggestedActivities = [];
        targetLeg.suggestedActivities.push({
          id: actId,
          text: spot.name,
          category: spot.category,
          location: location,
          notes: notes,
          lat: spot.lat,
          lng: spot.lng,
          cost: '',
          time: '1-2 hrs',
          assignedDayIdx: null
        });
        importedCount++;
      } else if (destVal.startsWith('day_')) {
        const dayIdx = parseInt(destVal.replace('day_', ''), 10);
        if (targetLeg.days && targetLeg.days[dayIdx]) {
          if (!targetLeg.days[dayIdx].activityItems) targetLeg.days[dayIdx].activityItems = [];
          targetLeg.days[dayIdx].activityItems.push({
            activityId: actId,
            text: spot.name,
            cost: '',
            location: location,
            notes: notes,
            done: false
          });
          importedCount++;
        }
      }
    });

    saveData();
    closeMapprReviewModal();

    if (typeof rebuildItineraryPreservingScroll === 'function') {
      rebuildItineraryPreservingScroll();
    } else if (typeof buildItinerary === 'function') {
      buildItinerary();
    }

    if (typeof showToast === 'function') {
      showToast(`Successfully imported ${importedCount} spots from Mappr!`);
    } else {
      alert(`Successfully imported ${importedCount} spots from Mappr!`);
    }
  }

  // Export module
  const MapprImportModule = {
    inferSpotCategory,
    parseMapprPayload,
    fetchMapprMapUrl,
    openMapprImportModal,
    closeMapprImportModal,
    openMapprReviewModal,
    closeMapprReviewModal,
    confirmMapprImport
  };

  if (typeof window !== 'undefined') {
    window.MapprImportModule = MapprImportModule;
    window.openMapprImportModal = openMapprImportModal;
    window.closeMapprImportModal = closeMapprImportModal;
    window.handleMapprFetchSubmit = handleMapprFetchSubmit;
    window.closeMapprReviewModal = closeMapprReviewModal;
    window.toggleAllMapprSpots = toggleAllMapprSpots;
    window.updateMapprDaysDropdown = updateMapprDaysDropdown;
    window.confirmMapprImport = confirmMapprImport;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapprImportModule;
  }

})(typeof window !== 'undefined' ? window : globalThis);
