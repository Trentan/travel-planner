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

  // Header with title and Add Stay button at the top
  const headerHtml = `
  <div class="accom-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
    <h3 style="margin:0; font-family:'Playfair Display',serif; color:#2C3E50;">🏨 Accommodation</h3>
    <button class="action-btn" onclick="openAddStayModal()">+ Add Stay</button>
  </div>
  `;

  container.innerHTML = headerHtml + html;
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

  // Packing guides with tab-style navigation (hidden until needed)
  const pendingCount = leaveHomeData.filter(i => !i.done).length;
  const activePanel = activeGuidePanel;
  
  // Build panel content based on active guide
  let panelContent = '';
  if (activePanel === 'home') {
    panelContent = `
      <div class="guide-panel-header">
        <h4>🏠 Pre-Departure Checklist</h4>
        <button class="guide-close-btn" onclick="collapseAllGuides()" title="Close">✕</button>
      </div>
      <div class="guide-panel-content packing-checklist">
        ${leaveHomeData.length === 0 ? '<p class="guide-empty">No tasks yet. Click + to add.</p>' : ''}
        ${leaveHomeData.map((item, iIdx) => `
          <div class="packing-item">
            <button class="del-btn" title="Delete Item" onclick="deleteLeaveHomeItem(${iIdx})">×</button>
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleLeaveHomeItem(event, ${iIdx})">
            <span contenteditable="${isEditMode}" onblur="updateLeaveHomeItem(${iIdx}, this.innerText)" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
          </div>
        `).join('')}
        <button class="add-btn" style="width:auto; margin-top:10px;" onclick="addLeaveHomeItem()">+ Add Task</button>
      </div>
    `;
  } else if (activePanel === 'laundry') {
    panelContent = `
      <div class="guide-panel-header">
        <h4>🧼 Hotel Sink Washing Guide</h4>
        <button class="guide-close-btn" onclick="collapseAllGuides()" title="Close">✕</button>
      </div>
      <div class="guide-panel-content">
        <ol class="guide-steps-list">
          <li><strong>Clean Your Sink:</strong> Start fresh by giving your sink a quick wash.</li>
          <li><strong>Fill With Water:</strong> Plug the drain and fill with lukewarm water.</li>
          <li><strong>Add Detergent:</strong> Drop in a laundry detergent sheet and swish.</li>
          <li><strong>Wash Clothes:</strong> Add clothes and swish to soak (5-15 min).</li>
          <li><strong>Agitate:</strong> Gently move clothes to release dirt.</li>
          <li><strong>Drain & Rinse:</strong> Squeeze out soapy water, drain, refill, swish again.</li>
          <li><strong>Remove Water:</strong> Fold clothes into a "brick" and press gently.</li>
          <li><strong>Towel Burrito Method:</strong> Lay towel, place clothing, roll up, step on it.</li>
          <li><strong>Hang to Dry:</strong> Drape over shower rod or hangers.</li>
        </ol>
        <div class="guide-tip"><strong>💡 Pro Tip:</strong> Rolling clothes in a microfiber towel works better than hotel towels.</div>
      </div>
    `;
  } else if (activePanel === 'capsule') {
    panelContent = `
      <div class="guide-panel-header">
        <h4>💡 Capsule Wardrobe Prompt</h4>
        <button class="guide-close-btn" onclick="collapseAllGuides()" title="Close">✕</button>
      </div>
      <div class="guide-panel-content">
        <div class="guide-example-box">
          <p style="margin-bottom: 0.75rem;"><strong>Ask your AI:</strong></p>
          <blockquote>
            "I'm going on a 14-day trip to Europe, packing carry-on only. Build me a minimalist capsule wardrobe using the 3×3 method for 14 outfits..."
          </blockquote>
        </div>
        <h5>Typical Output:</h5>
        <ul class="guide-bullets">
          <li><strong>Main bag:</strong> Hoodie, wool shirts, pants, activewear, underwear, socks</li>
          <li><strong>Wear onto plane:</strong> Jeans, belt, sports shoes, hoodie, sunglasses</li>
          <li><strong>Personal bag:</strong> Chargers, travel kit, formal shoes, hat, towel</li>
        </ul>
      </div>
    `;
  }
  
  const guidesHTML = `
    <div class="packing-guides-nav">
      <button class="guide-nav-btn${activeGuidePanel === 'home' ? ' active' : ''}" onclick="toggleGuidePanel('home')">
        <span class="guide-nav-icon">🏠</span>
        <span class="guide-nav-text">Pre-Departure</span>
        ${pendingCount > 0 ? `<span class="guide-nav-badge">${pendingCount}</span>` : ''}
      </button>
      <button class="guide-nav-btn${activeGuidePanel === 'laundry' ? ' active' : ''}" onclick="toggleGuidePanel('laundry')">
        <span class="guide-nav-icon">🧼</span>
        <span class="guide-nav-text">Sink Washing</span>
      </button>
      <button class="guide-nav-btn${activeGuidePanel === 'capsule' ? ' active' : ''}" onclick="toggleGuidePanel('capsule')">
        <span class="guide-nav-icon">💡</span>
        <span class="guide-nav-text">Capsule Guide</span>
      </button>
    </div>
    ${activeGuidePanel ? `<div class="guide-panel">${panelContent}</div>` : ''}
  `;
  guidesContainer.innerHTML = guidesHTML;

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
