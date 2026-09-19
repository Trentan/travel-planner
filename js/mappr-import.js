/* ==========================================================================
   MODULE: Mappr Map Importer (js/mappr-import.js)
   Responsibilities: Fetching, parsing, and importing curated spots from
   mappr.com maps into itinerary activities and suggested sights (Issue #163).
   ========================================================================== */

(function (window) {
  'use strict';

  function escapeHtml(text) {
    if (typeof escapeCompactText === 'function') return escapeCompactText(text);
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
   * Parse Nuxt 3 flattened array payload or standard JSON or HTML
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
        // Not valid JSON directly
      }
    } else if (Array.isArray(rawInput) || typeof rawInput === 'object') {
      data = rawInput;
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

      data.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
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

      if (spots.length > 0) {
        return { spots, title: title || 'Mappr Curated Map', city };
      }
    }

    // Markdown link fallback (e.g. from Jina Reader markdown or text extraction)
    if (typeof rawInput === 'string' && rawInput.includes('/spots/')) {
      const spots = [];
      const titleMatch = rawInput.match(/Title:\s*([^\n|]+)/i);
      if (titleMatch) title = titleMatch[1].trim();

      const spotRegex = /\[([A-Z0-9][^\]\n]{2,80})\]\((https?:\/\/[^\s)]+\/spots\/[^)#\s]+)[^)]*\)/g;
      let match;
      while ((match = spotRegex.exec(rawInput)) !== null) {
        const fullText = match[1].trim();
        const spotUrl = match[2];
        const parts = fullText.split(/(?<=[.!?])\s+|(?<=[a-z])\s+(?=[A-Z])/);
        const name = parts[0] || fullText;
        const summary = parts.slice(1).join(' ') || '';
        const catInfo = inferSpotCategory(name, summary, '');

        if (!spots.some(s => s.name.toLowerCase() === name.toLowerCase())) {
          spots.push({
            name: name.trim(),
            lat: null,
            lng: null,
            summary: summary.trim(),
            tips: '',
            whyGo: '',
            formatted_address: '',
            website: spotUrl,
            category: catInfo.category,
            icon: catInfo.icon,
            categoryLabel: catInfo.label
          });
        }
      }

      if (spots.length > 0) {
        return { spots, title: title || 'Mappr Curated Map', city };
      }
    }

    return { spots: [], title: title || 'Mappr Map', city };
  }

  /**
   * Fetch a Mappr URL via direct fetch or transparent CORS proxy
   */
  async function fetchMapprMapUrl(mapUrl) {
    const cleanUrl = String(mapUrl || '').trim();
    if (!cleanUrl) throw new Error('Please enter a valid Mappr map URL.');

    // If user accidentally pasted HTML or JSON into URL field, parse it directly
    if (cleanUrl.includes('<script') || cleanUrl.startsWith('{') || cleanUrl.startsWith('[')) {
      return parseMapprPayload(cleanUrl);
    }

    // 1. Try Jina Reader with HTML format (bypasses Cloudflare bot block and provides full __NUXT_DATA__)
    try {
      const jinaUrl = 'https://r.jina.ai/' + cleanUrl;
      const res = await fetch(jinaUrl, {
        headers: { 'x-return-format': 'html' }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('__NUXT_DATA__') || text.includes('spots') || text.includes('<html'))) {
          const parsed = parseMapprPayload(text);
          if (parsed && parsed.spots && parsed.spots.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[MapprImport] Jina reader fallback error:', err);
    }

    // 2. Try direct fetch
    try {
      const res = await fetch(cleanUrl, { mode: 'cors' });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseMapprPayload(text);
        if (parsed && parsed.spots && parsed.spots.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      // Direct CORS blocked
    }

    // 3. Try AllOrigins public CORS proxy
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(cleanUrl);
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        const parsed = parseMapprPayload(text);
        if (parsed && parsed.spots && parsed.spots.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      // Proxy failed
    }

    throw new Error('Could not automatically fetch map spots due to CORS/Cloudflare restrictions. Please open the link in your browser, copy the page source or text, and paste it into the box below.');
  }

  /**
   * UI: Open the initial Mappr URL paste modal
   */
  function openMapprImportModal() {
    let modal = document.getElementById('mappr-import-modal');
    if (!modal) {
      console.warn('[MapprImport] #mappr-import-modal not found in DOM.');
      return;
    }

    const statusBox = document.getElementById('mapprFetchStatus');
    if (statusBox) {
      statusBox.className = 'hidden p-3 rounded-xl text-xs';
      statusBox.textContent = '';
    }
    const urlInput = document.getElementById('mapprUrlInput');
    if (urlInput) urlInput.value = '';
    const rawInput = document.getElementById('mapprRawInput');
    if (rawInput) rawInput.value = '';

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => urlInput?.focus());
  }

  function closeMapprImportModal() {
    const modal = document.getElementById('mappr-import-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
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
      statusBox.textContent = '⏳ Fetching and extracting map spots...';
    }
    if (fetchBtn) {
      fetchBtn.disabled = true;
      fetchBtn.textContent = 'Fetching...';
    }

    try {
      let result = null;
      if (raw) {
        result = parseMapprPayload(raw);
      } else {
        result = await fetchMapprMapUrl(url);
      }

      if (!result || !Array.isArray(result.spots) || result.spots.length === 0) {
        throw new Error('No spots could be extracted from this map. Please check the URL or paste the raw page HTML into the fallback box.');
      }

      if (statusBox) {
        statusBox.className = 'p-3 rounded-xl text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 block';
        statusBox.textContent = `✓ Extracted ${result.spots.length} spots! Opening review...`;
      }

      setTimeout(() => {
        closeMapprImportModal();
        openMapprReviewModal(result.spots, result.title, result.city);
      }, 400);
    } catch (err) {
      if (statusBox) {
        statusBox.className = 'p-3 rounded-xl text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 block';
        statusBox.textContent = err.message || 'Failed to extract spots.';
      }
    } finally {
      if (fetchBtn) {
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'Fetch Spots';
      }
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

    const modal = document.getElementById('mappr-review-modal');
    if (!modal) {
      console.warn('[MapprImport] #mappr-review-modal not found in DOM.');
      return;
    }

    window._currentMapprSpots = spots || [];

    const titleEl = document.getElementById('mapprReviewTitle');
    if (titleEl) titleEl.textContent = '🗺️ ' + (title || 'Mappr Curated Spots');

    const subtitleEl = document.getElementById('mapprReviewSubtitle');
    if (subtitleEl) subtitleEl.textContent = `Found ${spots ? spots.length : 0} spots. Select destination and items to merge into your itinerary.`;

    const legs = (typeof appData !== 'undefined' && Array.isArray(appData)) ? appData : [];
    let matchedLegIdx = 0;
    if (city && legs.length > 0) {
      const idx = legs.findIndex(l => {
        const name = (l.label || l.to || '').toLowerCase();
        return name.includes(city.toLowerCase());
      });
      if (idx !== -1) matchedLegIdx = idx;
    }

    const legSelect = document.getElementById('mapprTargetLeg');
    if (legSelect) {
      legSelect.innerHTML = legs.map((leg, idx) => {
        const label = leg.label || leg.to || `Leg ${idx + 1}`;
        return `<option value="${idx}" ${idx === matchedLegIdx ? 'selected' : ''}>${escapeHtml(label)}</option>`;
      }).join('') || '<option value="0">Default Trip Leg</option>';
    }

    const tbody = document.getElementById('mapprSpotsTableBody');
    if (tbody && Array.isArray(spots)) {
      tbody.innerHTML = spots.map((spot, idx) => {
        const coordLabel = (spot.lat && spot.lng) ? `${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}` : '';
        return `
          <tr class="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="p-2 text-center">
              <input type="checkbox" class="mappr-spot-check rounded cursor-pointer" data-spot-index="${idx}" checked>
            </td>
            <td class="mappr-spot-name p-2 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
              <span class="mr-1">${spot.icon}</span> ${escapeHtml(spot.name)}
            </td>
            <td class="p-2 text-slate-500 dark:text-slate-400">
              <span class="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-750 text-[0.7rem] font-medium">${escapeHtml(spot.categoryLabel)}</span>
            </td>
            <td class="p-2 text-slate-600 dark:text-slate-300 max-w-xs truncate" title="${escapeHtml(spot.summary)}">
              ${escapeHtml(spot.summary || '—')}
            </td>
            <td class="p-2 font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
              ${coordLabel ? `📍 ${coordLabel}` : '—'}
            </td>
          </tr>
        `;
      }).join('');
    }

    const counter = document.getElementById('mapprSelectedCount');
    if (counter) counter.textContent = `${spots ? spots.length : 0} selected`;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    updateMapprDaysDropdown();
    setupSpotCheckListeners();
  }

  function closeMapprReviewModal() {
    const modal = document.getElementById('mappr-review-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
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

      if (destVal === 'suggested') {
        if (!Array.isArray(targetLeg.sights)) targetLeg.sights = [];
        targetLeg.sights.push({
          id: actId,
          name: spot.name,
          category: spot.category || 'sight',
          notes: notes,
          address: spot.formatted_address || '',
          lat: spot.lat,
          lng: spot.lng,
          link: spot.website || ''
        });
        importedCount++;
      } else if (destVal.startsWith('day_')) {
        const dayIdx = parseInt(destVal.replace('day_', ''), 10);
        if (targetLeg.days && targetLeg.days[dayIdx]) {
          if (!Array.isArray(targetLeg.days[dayIdx].activities)) targetLeg.days[dayIdx].activities = [];
          targetLeg.days[dayIdx].activities.push({
            id: actId,
            time: '1 hr',
            title: `${spot.icon} ${spot.name}`,
            category: spot.category || 'sight',
            cost: '',
            notes: notes,
            address: spot.formatted_address || '',
            lat: spot.lat,
            lng: spot.lng,
            link: spot.website || '',
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
    escapeHtml,
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
    window.openMapprReviewModal = openMapprReviewModal;
    window.closeMapprReviewModal = closeMapprReviewModal;
    window.toggleAllMapprSpots = toggleAllMapprSpots;
    window.updateMapprDaysDropdown = updateMapprDaysDropdown;
    window.confirmMapprImport = confirmMapprImport;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapprImportModule;
  }

})(typeof window !== 'undefined' ? window : globalThis);
