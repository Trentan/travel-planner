// buildTransportTab is now defined in transport.js

let expandedStayRows = new Set();

function isStayRowExpanded(stayId) {
  return expandedStayRows.has(stayId);
}

function toggleStayRowDetails(stayId) {
  if (expandedStayRows.has(stayId)) {
    expandedStayRows.delete(stayId);
  } else {
    expandedStayRows.add(stayId);
  }
  buildAccomTab(typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all');
}

function renderStayDetailBlock(title, value, extraClass = '') {
  return `
    <div class="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800/60 ${extraClass}">
      <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">${escapeHtmlText(title)}</span>
      <span class="text-sm font-medium text-slate-800 dark:text-slate-200">${escapeHtmlText(value || '—')}</span>
    </div>
  `;
}

function renderStayLocationDetails(stay, extraClass = '', showLabel = true) {
  if (!stay || !stay.location) return '';

  let cityName = '';
  if (stay.cityId && typeof citiesData !== 'undefined') {
    const city = citiesData.find(c => c.id === stay.cityId);
    if (city) cityName = city.name;
  }

  return `
    <div class="transport-sub-location-details stay-location-details ${extraClass}">
      <span class="transport-sub-location-detail" title="${escapeHtmlText(stay.location)}">
        ${showLabel ? '<span class="transport-sub-location-label">Location</span>' : ''}
        <span class="transport-sub-location-value">
          <a href="${getMapSearchUrl(stay.location, cityName)}" target="_blank" rel="noopener noreferrer" class="transport-sub-location-value-link" onclick="event.stopPropagation();" title="Open in Google Maps">
            <span class="location-map-icon">&#x1F5FA;&#xFE0F;</span> ${escapeHtmlText(stay.location)}
          </a>
        </span>
      </span>
    </div>
  `;
}

function renderStayLocationSummary(stay, extraClass = '') {
  if (!stay || !stay.location) return '';

  let cityName = '';
  if (stay.cityId && typeof citiesData !== 'undefined') {
    const city = citiesData.find(c => c.id === stay.cityId);
    if (city) cityName = city.name;
  }

  return `
    <div class="stay-card-location-summary ${extraClass}" title="${escapeHtmlText(stay.location)}">
      <span class="stay-card-location-label">Location:</span>
      <a href="${getMapSearchUrl(stay.location, cityName)}" target="_blank" rel="noopener noreferrer" class="stay-card-location-link" onclick="event.stopPropagation();" title="Open in Google Maps">${escapeHtmlText(stay.location)}</a>
    </div>
  `;
}

function renderStayMobileFact(label, value, extraClass = '') {
  return `
    <div class="stay-mobile-fact ${extraClass}">
      <span class="stay-mobile-fact-label">${escapeHtmlText(label)}</span>
      <span class="stay-mobile-fact-value">${escapeHtmlText(value || '')}</span>
    </div>
  `;
}

function renderStayMobileLinkedFact(label, value, href, extraClass = '') {
  return `
    <div class="stay-mobile-fact ${extraClass}">
      <span class="stay-mobile-fact-label">${escapeHtmlText(label)}</span>
      ${value ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="stay-card-location-link stay-mobile-fact-link" onclick="event.stopPropagation();" title="Open in Google Maps">${escapeHtmlText(value)}</a>` : '<span class="stay-mobile-fact-value"></span>'}
    </div>
  `;
}

function renderStayMobileSummary(stay, status, statusIcon, cityName) {
  const providerText = [stay.provider || '—', stay.bookingRef ? `#${stay.bookingRef}` : ''].filter(Boolean).join(' ');

  return `
    <div class="mobile-table-meta stay-mobile-meta">
      <span><strong>Details:</strong> ${cityName}${providerText !== '—' ? ` · ${providerText}` : ''}</span>
      ${renderStayLocationDetails(stay, 'stay-mobile-location')}
    </div>
  `;
}

function renderStayDateSummary(stay, status, statusIcon) {
  const checkOut = formatDateShort(stay.checkOut);

  return `
    <div class="mobile-table-meta stay-date-meta">
      <span class="stay-meta-checkout"><strong>Out:</strong> ${checkOut}</span>
    </div>
  `;
}

function renderStayStatusCostSummary(stay, status, statusIcon) {
  const normalizedStatus = normalizeItemStatus(status);
  const mobileMeta = typeof renderMobileStatusCostMeta === 'function'
      ? renderMobileStatusCostMeta({
        status: normalizedStatus,
        costValue: stay.totalCost || '0',
        bookingReference: stay.bookingRef || '',
        statusOnClick: isEditMode ? `event.stopPropagation(); toggleStayStatus(event, '${stay.id}')` : '',
        costOnBlur: `updateStayField('${stay.id}', 'totalCost', this.innerText)`,
        statusButtonTitle: 'Change status',
        metaClass: 'stay-status-cost-meta mobile-status-cost-meta',
        editableCost: isEditMode
      })
      : '';

  return `
    ${renderStatusBadge(normalizedStatus, {
      onClick: isEditMode ? `event.stopPropagation(); toggleStayStatus(event, '${stay.id}')` : '',
      title: 'Change stay status',
      className: 'stay-status-badge stay-status-badge-clickable'
    })}
    ${mobileMeta}
  `;
}

function isAccomMobileCardLayout() {
  return typeof isMobileViewport === 'function'
      ? isMobileViewport()
      : (typeof window !== 'undefined' && window.innerWidth <= 768);
}

function renderStayMobileDetails(stay, cityName) {
  const nights = stay.nights || calculateNights(stay.checkIn, stay.checkOut);
  const costValue = formatCurrency(stay.totalCost || '0');
  const locationUrl = stay.location ? getMapSearchUrl(stay.location, cityName) : '';

  return `
    <div class="stay-mobile-facts-grid">
      ${renderStayMobileFact('Check In', formatDateShort(stay.checkIn))}
      ${renderStayMobileFact('Check In Time', stay.checkInTime || '')}
      ${renderStayMobileFact('Check Out', formatDateShort(stay.checkOut))}
      ${renderStayMobileFact('Check Out Time', stay.checkOutTime || '')}
      ${renderStayMobileFact('City', cityName)}
      ${renderStayMobileFact('Nights', String(nights))}
      ${renderStayMobileLinkedFact('Location', stay.location || '', locationUrl, 'stay-mobile-fact--wide')}
      ${renderStayMobileFact('Property Name', stay.propertyName || '')}
      ${renderStayMobileFact('Provider', stay.provider || '')}
      ${renderStayMobileFact('Cost', costValue)}
      ${renderStayMobileFact('Booking #', stay.bookingRef || '')}
      ${renderStayMobileFact('Notes', stay.notes || '', 'stay-mobile-fact--wide')}
    </div>
  `;
}

function buildAccomTab(cityFilter = null) {
  const container = document.getElementById('accom-table-container');
  const staysData = (typeof stays !== 'undefined') ? stays : [];

  // Filter stays by city if specified
  let filteredStays = staysData;
  if (cityFilter && cityFilter !== 'all') {
    filteredStays = staysData.filter(s => s.cityId === cityFilter);
  }

  // Sort by check-in date
  const sortedStays = filteredStays.slice().sort((a, b) => {
    return new Date(a.checkIn) - new Date(b.checkIn);
  });

  if (sortedStays.length === 0) {
    container.innerHTML = `
      <div class="section-header accom-header">
        <h3 class="section-header-title">&#x1F3E8; Accommodation</h3>
        ${isEditMode ? '<button class="action-btn" onclick="openAddStayModal()">+ Add Stay</button>' : ''}
      </div>
      <div class="empty-placeholder">
        <p>No stays found.</p>
        <p class="section-header-note">Click "+ Add Stay" to add your first accommodation.</p>
      </div>
    `;
    return;
  }

  const autopopulateHTML = (typeof initAutopopulateButton === 'function') ? initAutopopulateButton() : '';

  const headerHtml = `
    <div class="section-header accom-header">
      <h3 class="section-header-title">&#x1F3E8; Accommodation</h3>
      ${isEditMode ? '<button class="action-btn" onclick="openAddStayModal()">+ Add Stay</button>' : ''}
    </div>
  `;

  if (isAccomMobileCardLayout()) {
    const slidesHtml = [];
    const railHtml = [];

    sortedStays.forEach((stay, index) => {
      const city = citiesData.find(c => c.id === stay.cityId);
      const cityName = city ? city.name : 'Unknown';
      const cityColor = city?.colour || '#2C3E50';
      const status = normalizeItemStatus(stay.status);
      const statusMetaInfo = getStatusMeta(status);
      const statusColor = statusMetaInfo.color;
      const statusIcon = '';
      const statusText = statusMetaInfo.label;
      const nights = stay.nights || calculateNights(stay.checkIn, stay.checkOut);
      const checkIn = formatDateShort(stay.checkIn);
      const checkOut = formatDateShort(stay.checkOut);
      const primaryAction = renderStatusBadge(status, {
        onClick: isEditMode ? `event.stopPropagation(); toggleStayStatus(event, '${stay.id}')` : '',
        title: 'Change stay status',
        className: 'stay-status-badge stay-status-badge-clickable'
      });
      const meta = '';
      const actions = isEditMode ? `
        <button class="mobile-surface-card-button stay-edit-btn" onclick="event.stopPropagation(); openEditStayModal('${stay.id}')" title="Edit Stay" aria-label="Edit stay">Edit</button>
        <button class="mobile-surface-card-button mobile-surface-card-button--danger stay-del-btn" onclick="event.stopPropagation(); deleteStay('${stay.id}')" title="Delete Stay" aria-label="Delete stay">Delete</button>
      ` : '';
      const details = renderStayMobileDetails(stay, cityName);
      const summary = '';
      const cardHtml = renderMobileSurfaceCard({
        cardClass: 'stay-mobile-card row-accent',
        accentColor: cityColor,
        dateLabel: '',
        title: stay.propertyName || '—',
        subtitle: [`In ${checkIn}`, `Out ${checkOut}`, stay.provider || '', stay.bookingRef ? `#${stay.bookingRef}` : ''].filter(Boolean).join(' · '),
        summary,
        meta,
        primaryAction,
        actions,
        details,
        detailsOpen: true
      });
      slidesHtml.push(`
        <div id="stay-slide-${index}" class="mobile-swipe-slide stay-swipe-slide" data-role="mobile-swipe-slide" data-slide-index="${index}" data-city-id="${escapeHtmlText(stay.cityId || '')}">
          ${cardHtml}
        </div>
      `);
      railHtml.push(`
        <button type="button" class="mobile-swipe-chip" data-role="mobile-swipe-chip" data-slide-index="${index}" aria-controls="stay-slide-${index}" aria-selected="${index === 0 ? 'true' : 'false'}">
          <span class="mobile-swipe-chip-eyebrow">${escapeHtmlText(cityName)}</span>
          <span class="mobile-swipe-chip-title">${escapeHtmlText(stay.propertyName || 'Stay')}</span>
          <span class="mobile-swipe-chip-route">${escapeHtmlText([checkIn, checkOut].filter(Boolean).join(' · '))}</span>
        </button>
      `);
    });

    const mobileHtml = renderMobileSwipePager({
      pagerClass: 'stay-swipe-pager',
      pagerKey: 'stay-swipe',
      syncCityNav: true,
      railHtml: railHtml.join(''),
      slidesHtml: slidesHtml.join(''),
      ariaLabel: 'Accommodation stays'
    });

    container.innerHTML = headerHtml + autopopulateHTML + mobileHtml;
    if (typeof setupMobileSwipePagers === 'function') setupMobileSwipePagers(container);
    return;
  }

  let html = `<div class="w-full overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm mt-4">
    <table class="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60">
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Property</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Provider</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-in</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-out</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Nights</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booking Ref</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Cost</th>
          ${isEditMode ? '<th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>' : ''}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">`;

  sortedStays.forEach(stay => {
    const city = citiesData.find(c => c.id === stay.cityId);
    const cityName = city ? city.name : 'Unknown';
    const cityColor = city?.colour || '#2C3E50';

    const status = normalizeItemStatus(stay.status);
    const statusMetaInfo = getStatusMeta(status);
    const statusColor = statusMetaInfo.color;
    const statusIcon = '';

    html += `<tr class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" style="border-left: 4px solid ${cityColor};">
      <td class="px-4 py-3 align-middle text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
        <div class="flex items-center gap-1.5">${getCityFlagHTML(cityName)} <span class="ml-1">${cityName}</span></div>
      </td>
      <td class="px-4 py-3 align-middle text-slate-800 dark:text-slate-200 font-medium min-w-[200px]">
        <span>${escapeHtml(stay.propertyName)}</span>
        <div class="md:hidden mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
          ${renderStayMobileSummary(stay, status, statusIcon, cityName)}
        </div>
      </td>
      <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">
        ${stay.location ? renderStayLocationDetails(stay, 'text-xs', false) : '—'}
      </td>
      <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm">${escapeHtmlText(stay.provider || '—')}</td>
      <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm">
        ${formatDateShort(stay.checkIn)}
        <div class="md:hidden mt-1 text-slate-500">
          ${renderStayDateSummary(stay, status, statusIcon)}
        </div>
      </td>
      <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm">${formatDateShort(stay.checkOut)}</td>
      <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm text-center">${stay.nights || calculateNights(stay.checkIn, stay.checkOut)}</td>
      <td class="px-4 py-3 align-middle text-slate-500 dark:text-slate-400 font-mono text-sm uppercase whitespace-nowrap">${escapeHtmlText(stay.bookingRef || '—')}</td>
      
      <!-- Notes -->
      <td class="px-4 py-3 align-middle text-slate-400 dark:text-slate-500 text-xs max-w-[250px] break-words" title="${escapeHtmlText(stay.notes || '')}">
        ${escapeHtmlText(stay.notes || '—')}
      </td>

      <td class="px-4 py-3 align-middle text-center">
        ${renderStatusBadge(status, {
          onClick: isEditMode ? `event.stopPropagation(); toggleStayStatus(event, '${stay.id}')` : '',
          title: 'Change stay status'
        })}
      </td>
      <td class="px-4 py-3 align-middle text-right font-medium text-slate-800 dark:text-slate-200">
        $<span>${formatCurrency(stay.totalCost || '0', { includeSymbol: false })}</span>
      </td>
      ${isEditMode ? `<td class="px-4 py-3 align-middle text-center whitespace-nowrap">
        <div class="inline-flex gap-2">
          <button class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" onclick="event.stopPropagation(); openEditStayModal('${stay.id}')" title="Edit Stay" aria-label="Edit Stay">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
          </button>
          <button class="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors" onclick="event.stopPropagation(); deleteStay('${stay.id}')" title="Delete Stay" aria-label="Delete Stay">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
          </button>
        </div>
      </td>` : ''}
    </tr>`;
  });

  html += `</tbody></table></div>`;

  // Add autopopulate button if there are missing stays
  container.innerHTML = headerHtml + autopopulateHTML + html;
}

// Helper to calculate nights between dates
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper to format date as DD MMM
function formatDateShort(dateStr) {
  if (typeof formatTripDateForDisplay === 'function') return formatTripDateForDisplay(dateStr);
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-AU', { month: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  return `${day} ${month}`;
}

function parseBudgetDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getExclusiveDateRangeEnd(dateStr) {
  const date = parseBudgetDate(dateStr);
  if (!date) return null;
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

function getStayOverlapDays(stay, leg) {
  if (!stay || !leg || !Array.isArray(leg.days) || leg.days.length === 0) return 0;

  const stayStart = parseBudgetDate(stay.checkIn);
  const stayEnd = parseBudgetDate(stay.checkOut);
  const legStart = parseBudgetDate(leg.days[0].date);
  const legEnd = getExclusiveDateRangeEnd(leg.days[leg.days.length - 1].date);

  if (!stayStart || !stayEnd || !legStart || !legEnd) return 0;

  const overlapStart = Math.max(stayStart.getTime(), legStart.getTime());
  const overlapEnd = Math.min(stayEnd.getTime(), legEnd.getTime());
  const overlapMs = overlapEnd - overlapStart;

  return overlapMs > 0 ? overlapMs / (24 * 60 * 60 * 1000) : 0;
}

function findBestStayLegIndex(stay, legs) {
  if (!stay || !Array.isArray(legs) || legs.length === 0) return -1;

  let bestIndex = -1;
  let bestOverlap = 0;

  legs.forEach((leg, index) => {
    const overlap = getStayOverlapDays(stay, leg);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestIndex = index;
    }
  });

  return bestIndex;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function buildPackingTab() {
  const guidesContainer = document.getElementById('guides-container');
  const listsContainer = document.getElementById('packing-areas-container');

  // Ensure default packing areas exist - add missing ones with defaults
  const defaultAreaNames = {
    "🚶 Walk-on Gear (Wear onto plane)": "#E67E22",
    "🧳 Carry-on Packed Bag (Main Luggage)": "#2980B9",
    "🎒 Personal Item Bag (Under Seat)": "#8E44AD"
  };

  defaultAreaNames["📝 Trip Notes"] = "#6C5CE7";

  Object.entries(defaultAreaNames).forEach(([areaName, areaColor]) => {
    const existing = packingData.find(a => a.areaName === areaName);
    if (!existing) {
      // Find the default template for this area
      const defaultArea = DEFAULT_PACKING.find(a => a.areaName === areaName);
      if (defaultArea) {
        // Deep copy and add to packingData
        packingData.push(JSON.parse(JSON.stringify(defaultArea)));
        saveData(false);
      }
    }
  });

  let guidesHTML = `
    <div class="guides-grid">
      <details class="guide-details">
        <summary class="guide-summary red-alert">🏠 Before Leaving Home</summary>
        <div class="guide-content">
          ${leaveHomeData.map((item, iIdx) => `
            <div class="packing-item">
              <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleLeaveHomeItem(event, ${iIdx})">
        <span contenteditable="${isEditMode}" onblur="updateLeaveHomeItem(${iIdx}, this.innerText)" class="${item.done ? 'content-done' : ''}">${item.text}</span>
              ${isEditMode ? `<button class="del-btn" title="Delete Item" onclick="deleteLeaveHomeItem(${iIdx})">&times;</button>` : ''}
            </div>
          `).join('')}
          ${isEditMode ? '<button class="add-btn add-btn-home-task" onclick="addLeaveHomeItem()">+ Add Home Task</button>' : ''}
        </div>
      </details>

      <details class="guide-details">
        <summary class="guide-summary">🧼 Hotel Sink Washing Guide</summary>
        <div class="guide-content">
          <h4>How to Do Laundry in Your Hotel Room:</h4>
          <ol>
            <li><strong>Clean Your Sink:</strong> Start fresh by giving your sink a quick wash with soap and water.</li>
            <li><strong>Fill With Water:</strong> Plug the drain and fill the sink with lukewarm water.</li>
            <li><strong>Add Detergent:</strong> Drop in a laundry detergent sheet. Swish it around until it dissolves.</li>
            <li><strong>Wash Your Clothes:</strong> Add your clothes to the sink and give them a quick swish to soak (5 to 15 minutes).</li>
            <li><strong>Agitate:</strong> Gently agitate and move the clothes around to release dirt and sweat.</li>
            <li><strong>Drain & Rinse:</strong> Squeeze out the soapy water, drain, refill with clean water, swish again.</li>
            <li><strong>Remove Excess Water:</strong> Fold clothes into a compact "brick" and press gently to release water (don't wring).</li>
            <li><strong>The Towel Burrito Method:</strong> Lay a clean towel on the floor, place clothing flat on top, roll it up, and step on the towel to squeeze out extra moisture.</li>
            <li><strong>Hang to Dry:</strong> Drape over clothes hangers or the shower rod.</li>
          </ol>
          <div class="guide-tip"><strong>👉 Pro Tip:</strong> Rolling clothes in a microfiber towel works even better than hotel towels.</div>
        </div>
      </details>

      <details class="guide-details">
        <summary class="guide-summary">💡 Example Capsule Wardrobe Prompt</summary>
        <div class="guide-content">
          <p class="guide-prompt-block">
            "I'm going on a 14-day trip to Europe in June and want to pack carry-on only. I want to create a minimalist capsule wardrobe with as few pieces as possible that will give me 14 different outfits (can be achieved with a 3x3 method - 3 shirts, 3 bottoms, 3 layers). Please build me a packing list by telling me the number of tops, bottoms and layering pieces that can be mixed and matched. My style is classic and practical with neutral colors. I want outfits that are comfortable and stylish for activities like sightseeing, casual dinners, and lots of walking. No more than 2 shoes (formal and sports). I need outfits for touring ports, lounging, and a couple of dressy dinners + I will need swimmers for asia or any hotel pools."
          </p>
          <h4>Example Output Breakdown:</h4>
          <ul>
            <li><strong>Main bag:</strong> Hoodie, Business long sleeve thin wool shirt, Nice dress shirt, Plain everday wool short sleeve shirt, Business short sleeve shirt, Dress Work style pants, Dress shorts, 2 activewear shirts, 2 activewear shorts, Underwear x 3, Socks 2 x sports, 2 x black, Swimmers x 2, Thongs/Sandals, Toiletry bag.</li>
            <li><strong>Wear onto plane:</strong> Underwear, Jeans, Belt, Sports shoes, Socks, Activewear shirt, Hoodie, Sunglasses.</li>
            <li><strong>Personal bag:</strong> Fanny pack/cross body bag, Charging cables, Wireless mouse/keyboard, Travel phone holder, Travel kit, Med Kit, Formal shoes, Broad Rim Hat, Microfibre towel, Pillow case.</li>
          </ul>
        </div>
      </details>
    </div>
  `;
  const guidesContent = typeof renderPackingGuidesShell === 'function' ? renderPackingGuidesShell() : guidesHTML;

  guidesContainer.innerHTML = guidesContent;

  let areasHTML = '';
  packingData.forEach((area, aIdx) => {
    areasHTML += `
      <div id="packing-area-${aIdx}" class="packing-area-section packing-area-spaced">
        <h2 class="packing-area-heading area-color-var border-color-var" style="color:${area.areaColor}; border-color:${area.areaColor};">
          <span contenteditable="${isEditMode}" onblur="updatePackingAreaName(${aIdx}, this.innerText)">${area.areaName}</span>
        </h2>
        <div class="packing-grid">
          ${area.categories.map((cat, cIdx) => `
            <div class="packing-card">
              <div class="packing-card-header">
                <h3><span contenteditable="${isEditMode}" onblur="updatePackingCat(${aIdx}, ${cIdx}, this.innerText)">${cat.title}</span></h3>
                ${isEditMode ? `<button class="del-btn" title="Delete Category Block" onclick="deletePackingCat(${aIdx}, ${cIdx})">&times;</button>` : ''}
              </div>
              ${cat.items.map((item, iIdx) => `
                <div class="packing-item">
                  <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackingItem(event, ${aIdx}, ${cIdx}, ${iIdx})">
                  <span contenteditable="${isEditMode}" onblur="updatePackingItem(${aIdx}, ${cIdx}, ${iIdx}, this.innerText)" class="${item.done ? 'content-done' : ''}">${item.text}</span>
                  ${isEditMode ? `<button class="del-btn" title="Delete Item" onclick="deletePackingItem(${aIdx}, ${cIdx}, ${iIdx})">&times;</button>` : ''}
                </div>
              `).join('')}
              ${isEditMode ? `<button class="add-btn" onclick="addPackingItem(${aIdx}, ${cIdx})">+ Add Item</button>` : ''}
            </div>
          `).join('')}
          ${isEditMode ? `<div class="packing-card packing-card-add-block" onclick="addPackingCat(${aIdx})">
            <span class="packing-card-add-label">+ Add New Category Block</span>
          </div>` : ''}
        </div>
      </div>`;
  });

  const restoreFooterHTML = `
    <div class="packing-guides-actions packing-page-footer">
      ${isEditMode ? '<button class="action-btn packing-restore-btn" type="button" onclick="restorePackingToDefault()">Restore Packing to Default</button>' : ''}
    </div>
  `;

  listsContainer.innerHTML = areasHTML + restoreFooterHTML;
}

function formatBudgetAmount(value) {
  return formatCurrency(value);
}

function buildBudgetTab() {
  const container = document.getElementById('budget-table-container');
  const kpiContainer = document.getElementById('budget-kpi-container');
  let totalTrans = 0, totalAccom = 0, totalAct = 0; let legBreakdown = [];

  // Get journeys array (global from transport.js) or fallback to empty
  const journeysData = (typeof journeys !== 'undefined') ? journeys : [];
  // Get stays array (global from data.js) or fallback to empty
  const staysData = (typeof stays !== 'undefined') ? stays : [];
  const matchedJourneyIds = new Set();

  const stayCostsByLeg = new Array(appData.length).fill(0);
  let unallocatedStayCost = 0;

  staysData.forEach(stay => {
    const stayCost = parseCost(stay.totalCost);
    if (stayCost <= 0) return;

    const bestLegIndex = findBestStayLegIndex(stay, appData);
    if (bestLegIndex >= 0) {
      stayCostsByLeg[bestLegIndex] += stayCost;
    } else {
      unallocatedStayCost += stayCost;
    }
  });

  appData.forEach((leg, legIndex) => {
    let legTrans = 0, legAccom = 0, legAct = 0;
    const legDestinations = [];

    // 1. Match journeys by legId first
    const legJourneys = journeysData.filter(j => j.legId === leg.id);
    legJourneys.forEach(j => {
      legTrans += parseCost(j.cost);
      if (j.journeyId) matchedJourneyIds.add(j.journeyId);
      else if (j.id) matchedJourneyIds.add(j.id);
      if (j.toLocation && !legDestinations.includes(j.toLocation)) {
        legDestinations.push(j.toLocation);
      }
    });

    leg.days.forEach(day => {
      // 2. Match journeys by day date and from/to only if they don't have a legId
      const dayJourneys = journeysData.filter(j =>
          !j.legId && j.dayDate === day.date && j.fromLocation === day.from && j.toLocation === day.to
      );
      dayJourneys.forEach((j) => {
        legTrans += parseCost(j.cost);
        if (j.journeyId) matchedJourneyIds.add(j.journeyId);
        else if (j.id) matchedJourneyIds.add(j.id);
        if (j.toLocation && !legDestinations.includes(j.toLocation)) {
          legDestinations.push(j.toLocation);
        }
      });

      // Legacy: still count old accomItems for backward compatibility
      (day.accomItems || []).forEach(i => legAccom += parseCost(i.cost));
      (day.activityItems || []).forEach(i => legAct += parseCost(i.cost));
    });

    legAccom += stayCostsByLeg[legIndex] || 0;

    const legTotal = legTrans + legAccom + legAct;
    if (legTotal > 0) {
      const displayLabel = leg.label || (legDestinations.length > 0 ? legDestinations[legDestinations.length - 1] : 'Trip Leg');
      legBreakdown.push({ label: displayLabel, colour: leg.colour, trans: legTrans, accom: legAccom, act: legAct, total: legTotal });
      totalTrans += legTrans; totalAccom += legAccom; totalAct += legAct;
    }
  });

  const journeyGroups = journeysData.reduce((groups, journey) => {
    const key = journey.journeyId || journey.id || `${journey.dayDate || ''}|${journey.fromLocation || ''}|${journey.toLocation || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(journey);
    return groups;
  }, {});

  Object.values(journeyGroups).forEach(group => {
    const sortedGroup = group.slice().sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    const groupId = sortedGroup[0]?.journeyId || sortedGroup[0]?.id || '';
    if (groupId && matchedJourneyIds.has(groupId)) return;

    const label = sortedGroup.length > 0
        ? (sortedGroup[sortedGroup.length - 1].toLocation || sortedGroup[sortedGroup.length - 1].journeyName || sortedGroup[0].journeyName || 'Transport')
        : 'Transport';
    const cost = sortedGroup.reduce((sum, journey) => sum + parseCost(journey.cost), 0);
    if (cost <= 0) return;

    legBreakdown.push({
      label,
      colour: '#2C3E50',
      trans: cost,
      accom: 0,
      act: 0,
      total: cost
    });
    totalTrans += cost;
  });

  totalAccom += unallocatedStayCost;

  const grandTotal = totalTrans + totalAccom + totalAct;

  kpiContainer.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-center">
        <h3 class="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transport</h3>
        <div class="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">${formatBudgetAmount(totalTrans)}</div>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-center">
        <h3 class="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Accommodation</h3>
        <div class="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">${formatBudgetAmount(totalAccom)}</div>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-center">
        <h3 class="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Activities</h3>
        <div class="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">${formatBudgetAmount(totalAct)}</div>
      </div>
      <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-16 h-16 bg-indigo-100 dark:bg-indigo-800/40 rounded-full blur-xl"></div>
        <h3 class="text-[10px] md:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 relative z-10">Grand Total</h3>
        <div class="text-2xl md:text-3xl font-black text-indigo-700 dark:text-indigo-300 relative z-10">${formatBudgetAmount(grandTotal)}</div>
      </div>
    </div>
  `;

  const maxLegTotal = Math.max(...legBreakdown.map(l => l.total), 1);
  const mobileBreakdownHtml = legBreakdown.map(l => {
    const barWidth = Math.max(6, Math.round((l.total / maxLegTotal) * 100));
    const accent = escapeHtml(l.colour || '#24485d');
    return `
      <article class="budget-mobile-row" style="--budget-accent:${accent};">
        <div class="budget-mobile-row-head">
          <h3>${escapeHtml(l.label)}</h3>
          <strong>${formatBudgetAmount(l.total)}</strong>
        </div>
        <div class="budget-mobile-meter" aria-hidden="true"><span style="width:${barWidth}%;"></span></div>
        <dl class="budget-mobile-splits">
          <div><dt>Transport</dt><dd>${formatBudgetAmount(l.trans)}</dd></div>
          <div><dt>Stay</dt><dd>${formatBudgetAmount(l.accom)}</dd></div>
          <div><dt>Activities</dt><dd>${formatBudgetAmount(l.act)}</dd></div>
        </dl>
      </article>
    `;
  }).join('');

  let html = `<div class="budget-desktop-table w-full overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm mt-4"><table class="w-full text-left border-collapse"><thead><tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60"><th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trip Leg</th><th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Transport</th><th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Accommodation</th><th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Activities</th><th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Leg Total</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">`;
  legBreakdown.forEach(l => {
    html += `<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" style="border-left: 4px solid ${l.colour}"><td class="px-4 py-3 align-middle text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">${l.label}</td><td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-right font-medium">${formatBudgetAmount(l.trans)}</td><td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-right font-medium">${formatBudgetAmount(l.accom)}</td><td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-right font-medium">${formatBudgetAmount(l.act)}</td><td class="px-4 py-3 align-middle text-slate-800 dark:text-slate-200 whitespace-nowrap text-right font-bold">${formatBudgetAmount(l.total)}</td></tr>`;
  });
  html += `</tbody></table></div>
    <div class="budget-mobile-breakdown" aria-label="Budget by trip leg">
      <div class="budget-mobile-breakdown-head">
        <h3>Trip Leg Breakdown</h3>
        <span>${legBreakdown.length} legs</span>
      </div>
      ${mobileBreakdownHtml || '<div class="budget-mobile-empty">No budget items yet.</div>'}
    </div>`;
  container.innerHTML = html;
}


