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
    <div class="stay-detail-block ${extraClass}">
      <span class="stay-detail-label">${title}</span>
      <span class="stay-detail-value">${value || '—'}</span>
    </div>
  `;
}

function renderStayMobileSummary(stay, status, statusIcon, cityName) {
  const providerText = [stay.provider || '—', stay.bookingRef ? `#${stay.bookingRef}` : ''].filter(Boolean).join(' ');

  return `
    <div class="mobile-table-meta stay-mobile-meta">
      <span><strong>Details:</strong> ${cityName}${providerText !== '—' ? ` · ${providerText}` : ''}</span>
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
  const normalizedStatus = (status === 'pending' ? 'planned' : status) || 'planned';
  const statusColors = {
    planned: '#E67E22',
    booked: '#27AE60',
    confirmed: '#27AE60',
    cancelled: '#E74C3C'
  };
  const statusIcons = {
    planned: '⏳',
    booked: '✓',
    confirmed: '🎫',
    cancelled: '❌'
  };
  const statusText = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  const statusColor = statusColors[normalizedStatus] || statusColors.planned;
  const statusIconGlyph = statusIcons[normalizedStatus] || '⏳';
  const mobileMeta = typeof renderMobileStatusCostMeta === 'function'
    ? renderMobileStatusCostMeta({
        status: normalizedStatus,
        costValue: stay.totalCost || '0',
        bookingReference: stay.bookingRef || '',
        statusOnClick: isEditMode ? `event.stopPropagation(); toggleStayStatus(event, '${stay.id}')` : '',
        costOnBlur: `updateStayField('${stay.id}', 'totalCost', this.innerText)`,
        statusButtonTitle: 'Change status',
        metaClass: 'stay-status-cost-meta',
        editableCost: isEditMode
      })
    : '';

  return `
    <span class="status-badge stay-status-badge" style="background:${statusColor};cursor:pointer;" onclick="if(${isEditMode})toggleStayStatus(event, '${stay.id}')">
      ${statusIconGlyph} ${statusText}
    </span>
    ${mobileMeta}
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
      <div class="accom-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="margin:0; font-family:'Playfair Display',serif; color:#2C3E50;">🏨 Accommodation</h3>
        <button class="action-btn" onclick="openAddStayModal()">+ Add Stay</button>
      </div>
      <div class="empty-placeholder">
        <p>No stays found.</p>
        <p style="font-size:0.9rem;color:#666;margin-top:0.5rem;">Click "+ Add Stay" to add your first accommodation.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="data-table-wrapper accom-table-wrapper mobile-table-wrapper"><table class="data-table accom-table mobile-table"><thead>
    <tr>
      <th style="width:28px;"></th>
      <th>City</th>
      <th>Property</th>
      <th>Provider</th>
      <th>Booking Ref</th>
      <th>Check-in</th>
      <th>Check-out</th>
      <th>Nights</th>
      <th>Status</th>
      <th>Cost</th>
      <th>Actions</th>
    </tr>
    <tr class="stay-mobile-head-row" aria-hidden="true">
      <th>Stay</th>
      <th>Schedule</th>
      <th>Status & Cost</th>
      <th aria-hidden="true"></th>
    </tr>
  </thead><tbody>`;

  sortedStays.forEach(stay => {
    const city = citiesData.find(c => c.id === stay.cityId);
    const cityName = city ? city.name : 'Unknown';
    const cityColor = city?.colour || '#2C3E50';

    const status = stay.status === 'pending' ? 'planned' : (stay.status || 'planned');
    const statusColors = {
      planned: '#E67E22',
      booked: '#27AE60',
      confirmed: '#27AE60',
      cancelled: '#E74C3C'
    };
    const statusIcons = {
      planned: '⏳',
      booked: '✓',
      confirmed: '🎫',
      cancelled: '❌'
    };
    const statusColor = statusColors[status] || statusColors.planned;
    const statusIcon = statusIcons[status] || '⏳';
    const isExpanded = isStayRowExpanded(stay.id);
    const expandBtn = `<button class="journey-expand-btn ${isExpanded ? 'expanded' : ''}" onclick="event.stopPropagation(); toggleStayRowDetails('${stay.id}')" title="Show stay details" aria-expanded="${isExpanded}">${isExpanded ? '▼' : '▶'}</button>`;

    html += `<tr class="stay-parent-row" style="border-left-color: ${cityColor}">
      <td class="stay-expand-col" data-label="Expand">${expandBtn}</td>
      <td class="city-col" data-label="City">${getCityFlagHTML(cityName)} ${cityName}</td>
      <td class="property-col" data-label="Property">
        <span class="stay-property-name" contenteditable="${isEditMode}" onblur="updateStayField('${stay.id}', 'propertyName', this.innerText)">${escapeHtml(stay.propertyName)}</span>
      </td>
      <td class="stay-provider-col" data-label="Provider">${stay.provider || '—'}</td>
      <td class="stay-bookingref-col" data-label="Booking Ref">${stay.bookingRef || '—'}</td>
      <td class="date-col stay-dates-col" data-label="Stay">
        ${formatDateShort(stay.checkIn)}
        ${renderStayDateSummary(stay, status, statusIcon)}
      </td>
      <td class="date-col stay-out-col" data-label="Check-out">${formatDateShort(stay.checkOut)}</td>
      <td class="nights-col" data-label="Nights">${stay.nights || calculateNights(stay.checkIn, stay.checkOut)}</td>
      <td class="stay-status-col" data-label="Status">
        ${renderStayStatusCostSummary(stay, status, statusIcon)}
      </td>
      <td class="budget-field" data-label="Cost" style="width:100px;">
        $<span contenteditable="${isEditMode}" onblur="updateStayField('${stay.id}', 'totalCost', this.innerText)">${stay.totalCost || '0'}</span>
      </td>
      <td class="stay-actions-col" data-label="Actions">
        <button class="edit-btn" title="Edit Stay" onclick="event.stopPropagation(); openEditStayModal('${stay.id}')">✎</button>
        <button class="del-btn" title="Delete Stay" onclick="event.stopPropagation(); deleteStay('${stay.id}')">×</button>
      </td>
    </tr>`;

    html += `
      <tr class="stay-detail-row ${isExpanded ? 'expanded' : ''}" data-stay-id="${stay.id}" style="display:${isExpanded ? 'table-row' : 'none'}; border-left-color: ${cityColor}">
        <td colspan="11">
          <div class="stay-detail-grid">
            ${renderStayDetailBlock('Status', `${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}`)}
            ${renderStayDetailBlock('Booking Ref', stay.bookingRef)}
            ${renderStayDetailBlock('Provider', stay.provider)}
            ${renderStayDetailBlock('Nights', String(stay.nights || calculateNights(stay.checkIn, stay.checkOut)))}
            ${renderStayDetailBlock('Cost', `$${stay.totalCost || '0'}`)}
            ${stay.notes ? renderStayDetailBlock('Notes', escapeHtml(stay.notes), 'full-width') : ''}
            <div class="stay-detail-block full-width">
              <span class="stay-detail-label">Actions</span>
              <span class="stay-detail-actions">
                <button class="edit-btn" title="Edit Stay" onclick="event.stopPropagation(); openEditStayModal('${stay.id}')">✎</button>
                <button class="del-btn" title="Delete Stay" onclick="event.stopPropagation(); deleteStay('${stay.id}')">×</button>
              </span>
            </div>
          </div>
        </td>
      </tr>`;
  });

  html += `</tbody></table></div>`;

  // Add autopopulate button if there are missing stays
  const autopopulateHTML = (typeof initAutopopulateButton === 'function') ? initAutopopulateButton() : '';

  // Header with title and Add Stay button at the top
  const headerHtml = `
    <div class="accom-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <h3 style="margin:0; font-family:'Playfair Display',serif; color:#2C3E50;">🏨 Accommodation</h3>
      <button class="action-btn" onclick="openAddStayModal()">+ Add Stay</button>
    </div>
  `;

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
              <button class="del-btn" title="Delete Item" onclick="deleteLeaveHomeItem(${iIdx})">×</button>
              <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleLeaveHomeItem(event, ${iIdx})">
              <span contenteditable="${isEditMode}" onblur="updateLeaveHomeItem(${iIdx}, this.innerText)" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
            </div>
          `).join('')}
          <button class="add-btn" style="width:auto; margin-top:10px; border-color:#E74C3C; color:#C0392B;" onclick="addLeaveHomeItem()">+ Add Home Task</button>
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
          <p style="font-style: italic; background: #f9f9f9; padding: 10px; border-left: 3px solid #ccc;">
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
  guidesContainer.innerHTML = typeof renderPackingGuidesShell === 'function' ? renderPackingGuidesShell() : guidesHTML;

  let areasHTML = '';
  packingData.forEach((area, aIdx) => {
    areasHTML += `
      <div style="margin-bottom: 3.5rem;">
        <h2 style="font-family:'Playfair Display', serif; color:${area.areaColor}; border-bottom: 2px solid ${area.areaColor}; padding-bottom:0.5rem; margin-bottom:1.5rem;">
          <span contenteditable="${isEditMode}" onblur="updatePackingAreaName(${aIdx}, this.innerText)">${area.areaName}</span>
        </h2>
        <div class="packing-grid">
          ${area.categories.map((cat, cIdx) => `
            <div class="packing-card">
              <div class="packing-card-header">
                <h3><span contenteditable="${isEditMode}" onblur="updatePackingCat(${aIdx}, ${cIdx}, this.innerText)">${cat.title}</span></h3>
                <button class="del-btn" title="Delete Category Block" onclick="deletePackingCat(${aIdx}, ${cIdx})">×</button>
              </div>
              ${cat.items.map((item, iIdx) => `
                <div class="packing-item">
                  <button class="del-btn" title="Delete Item" onclick="deletePackingItem(${aIdx}, ${cIdx}, ${iIdx})">×</button>
                  <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackingItem(event, ${aIdx}, ${cIdx}, ${iIdx})">
                  <span contenteditable="${isEditMode}" onblur="updatePackingItem(${aIdx}, ${cIdx}, ${iIdx}, this.innerText)" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
                </div>
              `).join('')}
              <button class="add-btn" onclick="addPackingItem(${aIdx}, ${cIdx})">+ Add Item</button>
            </div>
          `).join('')}
          <div class="packing-card" style="border: 2px dashed var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="addPackingCat(${aIdx})">
            <span style="color:var(--muted); font-weight:500;">+ Add New Category Block</span>
          </div>
        </div>
      </div>`;
  });

  const restoreFooterHTML = `
    <div class="packing-guides-actions packing-page-footer">
      <button class="action-btn packing-restore-btn" type="button" onclick="restorePackingToDefault()">Restore Packing to Default</button>
    </div>
  `;

  listsContainer.innerHTML = areasHTML + restoreFooterHTML;
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
    leg.days.forEach(day => {
      // Calculate transport costs from journeys array
      const dayJourneys = journeysData.filter(j =>
        j.dayDate === day.date && j.fromLocation === day.from && j.toLocation === day.to
      );
      dayJourneys.forEach((j) => {
        legTrans += parseCost(j.cost);
        if (j.journeyId) matchedJourneyIds.add(j.journeyId);
        if (j.toLocation && !legDestinations.includes(j.toLocation)) legDestinations.push(j.toLocation);
      });

      // Legacy: still count old accomItems for backward compatibility
      (day.accomItems || []).forEach(i => legAccom += parseCost(i.cost));
      (day.activityItems || []).forEach(i => legAct += parseCost(i.cost));
    });

    legAccom += stayCostsByLeg[legIndex] || 0;

    const legTotal = legTrans + legAccom + legAct;
    if (legTotal > 0) {
      const displayLabel = legDestinations.length > 0 ? legDestinations[legDestinations.length - 1] : leg.label;
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
    <div class="budget-kpi"><h3>Transport</h3><div class="amount">$${totalTrans}</div></div>
    <div class="budget-kpi"><h3>Accommodation</h3><div class="amount">$${totalAccom}</div></div>
    <div class="budget-kpi"><h3>Activities</h3><div class="amount">$${totalAct}</div></div>
    <div class="budget-kpi grand-total"><h3>Grand Total</h3><div class="amount">$${grandTotal}</div></div>
  `;

  let html = `<div class="data-table-wrapper budget-table-wrapper"><table class="data-table budget-table"><thead><tr><th>Trip Leg</th><th>Transport</th><th>Accommodation</th><th>Activities</th><th>Leg Total</th></tr></thead><tbody>`;
  legBreakdown.forEach(l => {
    html += `<tr style="border-left-color: ${l.colour}"><td data-label="Trip Leg" style="font-weight:600;">${l.label}</td><td data-label="Transport">$${l.trans}</td><td data-label="Accommodation">$${l.accom}</td><td data-label="Activities">$${l.act}</td><td data-label="Leg Total" style="font-family:'DM Mono',monospace; font-weight:600;">$${l.total}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}
