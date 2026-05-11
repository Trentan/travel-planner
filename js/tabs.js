// buildTransportTab is now defined in transport.js

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

  let html = `<div class="data-table-wrapper"><table class="data-table"><thead>
    <tr>
      <th>City</th>
      <th>Property</th>
      <th>Check-in</th>
      <th>Check-out</th>
      <th>Nights</th>
      <th>Status</th>
      <th>Cost</th>
      <th>Actions</th>
    </tr>
  </thead><tbody>`;

  sortedStays.forEach(stay => {
    const city = citiesData.find(c => c.id === stay.cityId);
    const cityName = city ? city.name : 'Unknown';
    const cityColor = city?.colour || '#2C3E50';

    const status = stay.status || 'pending';
    const statusColors = {
      confirmed: '#27AE60',
      pending: '#E67E22',
      cancelled: '#E74C3C'
    };
    const statusColor = statusColors[status] || statusColors.pending;
    const statusIcon = status === 'confirmed' ? '✓' : status === 'cancelled' ? '✕' : '⏳';

    const bookingRef = stay.bookingRef ? `<br><span class="booking-ref" style="font-family:monospace; font-size:0.75rem; color:#666;">${stay.bookingRef}</span>` : '';
    const provider = stay.provider ? `<br><span style="font-size:0.8rem; color:#888;">${stay.provider}</span>` : '';

    html += `<tr style="border-left-color: ${cityColor}">
      <td class="city-col">${getCityFlagHTML(cityName)} ${cityName}</td>
      <td class="property-col">
        <span style="font-weight:600;" contenteditable="${isEditMode}" onblur="updateStayField('${stay.id}', 'propertyName', this.innerText)">${escapeHtml(stay.propertyName)}</span>
        ${provider}
      </td>
      <td class="date-col">${formatDateShort(stay.checkIn)}</td>
      <td class="date-col">${formatDateShort(stay.checkOut)}</td>
      <td class="nights-col">${stay.nights || calculateNights(stay.checkIn, stay.checkOut)}</td>
      <td>
        <span class="status-badge" style="background:${statusColor}; cursor:pointer;" onclick="event.stopPropagation(); toggleStayStatus(event, '${stay.id}')">${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        ${bookingRef}
      </td>
      <td class="budget-field" style="width:100px;">
        $<span contenteditable="${isEditMode}" onblur="updateStayField('${stay.id}', 'totalCost', this.innerText)">${stay.totalCost || '0'}</span>
      </td>
      <td class="actions-col">
        <button class="edit-btn" title="Edit Stay" onclick="event.stopPropagation(); openEditStayModal('${stay.id}')">✎</button>
        <button class="del-btn" title="Delete Stay" onclick="event.stopPropagation(); deleteStay('${stay.id}')">×</button>
      </td>
    </tr>`;

    // Add notes row if exists
    if (stay.notes) {
      html += `<tr style="border-left-color: ${cityColor}">
        <td colspan="8" style="padding: 8px 16px; background: #f9f9f9; font-size: 0.85rem; color: #666; border-top: none;">
          <em>${escapeHtml(stay.notes)}</em>
        </td>
      </tr>`;
    }
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
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper to format date as DD MMM
function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00'); // Force local time
  const day = date.getDate();
  const month = date.toLocaleDateString('en-AU', { month: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  return `${day} ${month}`;
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
  guidesContainer.innerHTML = guidesHTML;

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
              <h3><span contenteditable="${isEditMode}" onblur="updatePackingCat(${aIdx}, ${cIdx}, this.innerText)">${cat.title}</span></h3>
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

  listsContainer.innerHTML = areasHTML;
}

function buildBudgetTab() {
  const container = document.getElementById('budget-table-container');
  const kpiContainer = document.getElementById('budget-kpi-container');
  let totalTrans = 0, totalAccom = 0, totalAct = 0; let legBreakdown = [];

  // Get journeys array (global from transport.js) or fallback to empty
  const journeysData = (typeof journeys !== 'undefined') ? journeys : [];
  // Get stays array (global from data.js) or fallback to empty
  const staysData = (typeof stays !== 'undefined') ? stays : [];

  appData.forEach(leg => {
    let legTrans = 0, legAccom = 0, legAct = 0;
    leg.days.forEach(day => {
      // Calculate transport costs from journeys array
      const dayJourneys = journeysData.filter(j =>
        j.dayDate === day.date && j.fromLocation === day.from && j.toLocation === day.to
      );
      dayJourneys.forEach(j => legTrans += parseCost(j.cost));

      // Legacy: still count old accomItems for backward compatibility
      (day.accomItems || []).forEach(i => legAccom += parseCost(i.cost));
      (day.activityItems || []).forEach(i => legAct += parseCost(i.cost));
    });

    // Add stays costs for this leg based on overlapping dates
    // Get leg date range
    const legStartDate = leg.days.length > 0 ? leg.days[0].date : null;
    const legEndDate = leg.days.length > 0 ? leg.days[leg.days.length - 1].date : null;

    if (legStartDate && legEndDate) {
      staysData.forEach(stay => {
        // Check if stay overlaps with this leg's date range
        if (stay.checkIn <= legEndDate && stay.checkOut >= legStartDate) {
          legAccom += parseCost(stay.totalCost);
        }
      });
    }

    const legTotal = legTrans + legAccom + legAct;
    if (legTotal > 0) {
      legBreakdown.push({ label: leg.label, colour: leg.colour, trans: legTrans, accom: legAccom, act: legAct, total: legTotal });
      totalTrans += legTrans; totalAccom += legAccom; totalAct += legAct;
    }
  });

  // Also add stays that don't match any leg (orphaned stays)
  staysData.forEach(stay => {
    const stayCost = parseCost(stay.totalCost);
    let matched = false;
    for (const leg of appData) {
      const legStartDate = leg.days.length > 0 ? leg.days[0].date : null;
      const legEndDate = leg.days.length > 0 ? leg.days[leg.days.length - 1].date : null;
      if (legStartDate && legEndDate && stay.checkIn <= legEndDate && stay.checkOut >= legStartDate) {
        matched = true;
        break;
      }
    }
    if (!matched && stayCost > 0) {
      totalAccom += stayCost;
    }
  });

  const grandTotal = totalTrans + totalAccom + totalAct;

  kpiContainer.innerHTML = `
    <div class="budget-kpi"><h3>Transport</h3><div class="amount">$${totalTrans}</div></div>
    <div class="budget-kpi"><h3>Accommodation</h3><div class="amount">$${totalAccom}</div></div>
    <div class="budget-kpi"><h3>Activities</h3><div class="amount">$${totalAct}</div></div>
    <div class="budget-kpi grand-total"><h3>Grand Total</h3><div class="amount">$${grandTotal}</div></div>
  `;

  let html = `<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Trip Leg</th><th>Transport</th><th>Accommodation</th><th>Activities</th><th>Leg Total</th></tr></thead><tbody>`;
  legBreakdown.forEach(l => {
    html += `<tr style="border-left-color: ${l.colour}"><td style="font-weight:600;">${l.label}</td><td>$${l.trans}</td><td>$${l.accom}</td><td>$${l.act}</td><td style="font-family:'DM Mono',monospace; font-weight:600;">$${l.total}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}
