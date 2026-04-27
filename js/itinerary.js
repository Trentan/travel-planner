function buildCompactItinerary() {
  const container = document.getElementById('itinerary');
  container.innerHTML = '';

  appData.forEach((leg, legIndex) => {
    const section = document.createElement('div');
    section.className = 'leg';
    section.id = 'leg-' + leg.id;

    const daysCount = leg.days.length;
    const nightLabel = `${daysCount} night${daysCount !== 1 ? 's' : ''}`;

    let html = `
    <div class="leg-header" style="background:${leg.colour}; cursor:default;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <h2 style="margin:0; font-size:14px; cursor:default;">${leg.label}</h2>
          <span style="font-size:11px; margin-left:10px;">${nightLabel}</span>
        </div>
      </div>
    </div>
    `;

    html += '<div style="padding:8px;">';
    leg.days.forEach((day, dayIdx) => {
      const dayTotal = getDayTotal(day);
      html += `<div style="border-left:4px solid ${leg.colour}; margin:6px 0; padding:6px; background:#fafafa;">
      <div style="display:flex; gap:6px; align-items:center; font-size:11px;">
        <input type="checkbox" ${day.completed ? 'checked' : ''}
          onchange="toggleDayCompleted(event, ${legIndex}, ${dayIdx})"
          style="width:14px; height:14px; accent-color:#27AE60;">
        <span style="font-weight:600;">${day.day} ${day.date}</span>
        <span style="font-size:10px;">${day.from} → ${day.to}</span>
        <span style="font-size:9px; color:#666; flex:1;">${day.desc || ''}</span>
        ${dayTotal ? `<span style="font-weight:600; font-family:monospace;">${dayTotal}</span>` : ''}
      </div>

      <div style="display:flex; gap:8px; margin-top:4px; font-size:10px;">`;

      // Display transport from journeys
      const dayJourneys = getDayJourneys(day.date, day.from, day.to);
      if (dayJourneys.length > 0) {
        html += '<div style="flex:1;"><strong>🚌</strong> ';
        html += dayJourneys.map(j => {
          const status = j.status || 'planned';
          const statusIcon = status === 'booked' ? '✓' : '⏳';
          const icon = getTransportIcon(j.transportType);
          return `${icon} ${j.notes || j.fromLocation + '→' + j.toLocation}${j.cost ? ` ($${j.cost})` : ''} <span style="color:${status === 'booked' ? '#27AE60' : '#E67E22'}">${statusIcon}</span>`;
        }).join(', ');
        html += '</div>';
      }

      // Display accommodation
      const dayStays = stays.filter(s => s.legId === leg.id && s.date === day.date);
      if (dayStays.length > 0) {
        html += '<div style="flex:1;"><strong>🏨</strong> ';
        html += dayStays.map(item => {
          const status = item.status || 'pending';
          const statusIcon = status === 'confirmed' ? '✓' : '⏳';
          return `${item.text}${item.cost ? ` ($${item.cost})` : ''} <span style="color:${status === 'confirmed' ? '#27AE60' : '#E67E22'}">${statusIcon}</span>`;
        }).join(', ');
        html += '</div>';
      }

      html += '</div>';

      if ((day.activityItems?.length || 0) > 0) {
        html += '<div style="margin-top:3px; font-size:10px;"><strong>Target</strong> ';
        html += day.activityItems.map((item, itemIdx) => {
          const doneStyle = item.done ? 'text-decoration:line-through; opacity:0.7;' : '';
          return `<span style="margin-right:12px; ${doneStyle}">
            <input type="checkbox" ${item.done ? 'checked' : ''}
              onchange="toggleActivityCompleted(event, ${legIndex}, ${dayIdx}, ${itemIdx})"
              style="width:12px; height:12px; accent-color:#27AE60; margin-right:4px;">
            ${item.text}${item.cost ? ` ($${item.cost})` : ''}
          </span>`;
        }).join('');
        html += '</div>';
      }

      html += '</div></div>';
    });

    html += '</div>';
    section.innerHTML = html;
    container.appendChild(section);
  });
}

// Track open day cards across rebuilds
let openDayCardIds = new Set();

function buildItinerary() {
  if (isCompactView) {
    buildCompactItinerary();
    return;
  }

  // Save open state of day cards before rebuilding
  openDayCardIds.clear();
  document.querySelectorAll('.day-card.open').forEach(card => {
    const dayBar = card.querySelector('.day-bar');
    if (dayBar) {
      const dayNum = dayBar.querySelector('.day-num')?.textContent;
      const dayName = dayBar.querySelector('.day-name')?.textContent;
      if (dayNum && dayName) {
        openDayCardIds.add(`${dayName}-${dayNum}`);
      }
    }
  });

  const container = document.getElementById('itinerary');
  container.innerHTML = '';

  appData.forEach((leg, legIndex) => {
    const section = document.createElement('div');
    section.className = 'leg';
    section.id = 'leg-' + leg.id;

    const daysCount = leg.days.length;
    const firstAccom = daysCount > 0 && leg.days[0].accomItems && leg.days[0].accomItems.length > 0 ? leg.days[0].accomItems[0].text : "";

    let isTransit = false;
    if (firstAccom.toLowerCase().includes('transit') || firstAccom === '—') {
      isTransit = true;
    } else if (daysCount === 1) {
      const toCity = leg.days[0].to;
      if (!leg.label.includes(toCity) && leg.days[0].from !== toCity) {
        isTransit = true;
      }
    }

    const nightLabel = isTransit ? '✈ Day Transit / Stop' : `${daysCount} night${daysCount !== 1 ? 's' : ''}`;
    const badgeClass = isTransit ? 'leg-night-count badge-transit' : 'leg-night-count';

    const firstDateObj = daysCount > 0 ? leg.days[0] : null;
    const lastDateObj = daysCount > 0 ? leg.days[daysCount - 1] : null;
    const firstDateStr = firstDateObj ? `${firstDateObj.day} ${firstDateObj.date}` : '';
    const lastDateStr = lastDateObj ? `${lastDateObj.day} ${lastDateObj.date}` : '';
    const dateRange = (firstDateStr && lastDateStr && firstDateStr !== lastDateStr) ? `${firstDateStr} – ${lastDateStr}` : firstDateStr;

    const unassigned = (leg.suggestedActivities||[]).filter(s => s.assignedDayIdx === null || s.assignedDayIdx === undefined);
    const subtitle = unassigned.length === 0 ? "All suggested activities assigned! 🎉" : `Remaining Ideas: ${unassigned.slice(0, 3).map(s => s.title.split('—')[0].trim()).join(', ')}${unassigned.length > 3 ? '...' : ''}`;

    let html = `
    <div class="leg-header" style="background:${leg.colour}" onclick="toggleLeg(this)">
      <div class="leg-header-top">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <h2 contenteditable="${isEditMode}" onclick="event.stopPropagation()" onblur="updateData(${legIndex}, 'label', this.innerText)">${leg.label}</h2>
          <span style="opacity:0.8; font-size:0.9rem; font-family:'DM Mono', monospace;">${dateRange}</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="${badgeClass}">${nightLabel}</span>
          ${isEditMode ? `<button class="header-del-btn" title="Delete Leg" onclick="event.stopPropagation(); deleteLeg(${legIndex})">🗑</button>` : ''}
          <span class="leg-chevron">▼</span>
        </div>
      </div>
      <div class="leg-subtitle">${subtitle}</div>
    </div>
    <div class="leg-content">
    `;

    // Get emoji for activity category
    const getCategoryEmoji = (cat) => {
      const emojis = { fitness: '🏃', sight: '🏛️', attraction: '🎢', wellness: '🧘', food: '🍽️', tour: '🚌' };
      return emojis[cat] || '📍';
    };

    html += `<div class="city-dashboard">
      <div class="city-block city-block-tips">
        <h4>💡 Tips</h4>
        <ul class="tips-list">${(leg.legTips || []).map((t, i) => `<li class="tip-item"><span contenteditable="${isEditMode}" onblur="updateLegTip(${legIndex}, ${i}, this.innerText)">${t.text || t}</span><button class="del-btn" title="Delete Tip" onclick="event.stopPropagation(); deleteLegTip(${legIndex}, ${i})">×</button></li>`).join('')}</ul>
        <button class="add-btn" onclick="event.stopPropagation(); addLegTip(${legIndex})">+ Add Tip</button>
      </div>
      <div class="city-block city-block-food">
        <h4>🍔 Food Quests</h4>
        <ul class="food-list">${(leg.cityFood || []).map((f, i) => `<li class="quest-item"><button class="del-btn" title="Delete Food" onclick="event.stopPropagation(); deleteFood(${legIndex}, ${i})">×</button><input type="checkbox" ${f.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleFoodCompleted(event, ${legIndex}, ${i})"><span contenteditable="${isEditMode}" onblur="updateFoodText(${legIndex}, ${i}, this.innerText)" style="${f.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${f.text}</span></li>`).join('')}</ul>
        <button class="add-btn" onclick="event.stopPropagation(); addFood(${legIndex})">+ Add Food</button>
      </div>
      <div class="city-block city-block-activities">
        <h4>📌 Suggested Activities</h4>
        <ul class="activity-list unified-activities">${(leg.suggestedActivities || []).map((activity, activityIdx) => {
          const isAssigned = activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined;
          let isCompleted = false; let dayLabel = '';
          if (isAssigned && leg.days[activity.assignedDayIdx]) {
            dayLabel = leg.days[activity.assignedDayIdx].date;
            const matchedActivity = leg.days[activity.assignedDayIdx].activityItems.find(a => a.text === activity.title);
            if (matchedActivity && matchedActivity.done) isCompleted = true;
          }
          const badgeColor = isCompleted ? '#27AE60' : '#E67E22';
          const badgeIcon = isCompleted ? '✓' : '⏳';
          const badgeHoverText = isCompleted ? `Completed on ${dayLabel}` : (isAssigned ? `Scheduled for ${dayLabel}` : 'Drag to day');
          const categoryEmoji = getCategoryEmoji(activity.category);
          return `<li class="${isAssigned ? 'assigned-sight' : 'draggable-sight'} activity-item" ${!isAssigned ? `draggable="true" ondragstart="handleDragStart(event, ${legIndex}, 'activity', ${activityIdx})"` : ''}><button class="del-btn" title="Delete" onclick="event.stopPropagation(); deleteActivity(${legIndex}, ${activityIdx})">×</button>${!isAssigned ? `<span class="drag-handle" title="Drag to assign">⠿</span>` : `<span class="assigned-badge" style="background: ${badgeColor};" title="${badgeHoverText}">${badgeIcon}</span>`}<span class="activity-emoji">${categoryEmoji}</span><span contenteditable="${!isAssigned && isEditMode}" onblur="updateActivity(${legIndex}, ${activityIdx}, 'title', this.innerText)" style="${isCompleted ? 'text-decoration:line-through;' : ''}; flex:1;">${activity.title}</span><span class="sight-inline-meta">⏱ ${activity.estTime} · $${activity.estCost}</span></li>`;
        }).join('')}</ul>
        <button class="add-btn" onclick="event.stopPropagation(); addActivity(${legIndex})">+ Add Activity</button>
      </div>
    </div>`;

    leg.days.forEach((day, dayIndex) => {
      const cityHTML = day.from === day.to ? `<span class="city-same">${day.from}</span>` : `${day.from} <span style="opacity:0.4">→</span> ${day.to}`;
      const completedClass = day.completed ? 'is-completed' : '';
      const dayTotal = getDayTotal(day);

      // Get journeys for this day
      const dayJourneys = getDayJourneys(day.date, day.from, day.to);

      // Check if this day should be open
      const dayKey = `${day.day}-${day.date}`;
      const shouldBeOpen = openDayCardIds.has(dayKey);
      const openClass = shouldBeOpen ? 'open' : '';

      html += `
      <div class="day-card ${completedClass} ${openClass}">
        <div class="day-bar" style="--leg-colour:${leg.colour}" onclick="toggleCard(this)">
          <input type="checkbox" class="day-checkbox" ${day.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleDayCompleted(event, ${legIndex}, ${dayIndex})">
          <div class="day-date"><span class="day-num">${day.date}</span><span class="day-name">${day.day}</span></div>
          <div class="day-title"><div class="day-cities">${cityHTML}</div><div class="day-desc" contenteditable="${isEditMode}" onclick="event.stopPropagation()" onblur="updateDayData(${legIndex}, ${dayIndex}, 'desc', this.innerText)">${day.desc}</div></div>
          ${dayTotal ? `<div class="day-total-cost" title="Total estimated cost for the day">${dayTotal}</div>` : ''}<span class="day-chevron">▼</span>
        </div>
        <div class="day-detail"><div class="detail-grid">

          <div class="detail-block block-transport">
            <h4>Transport</h4><div class="item-list">
            ${dayJourneys.map((journey) => {
              const status = journey.status || 'planned';
              const statusColor = status === 'booked' ? '#27AE60' : '#E67E22';
              const statusIcon = status === 'booked' ? '✓' : '⏳';
              const icon = getTransportIcon(journey.transportType);
              const showRef = status === 'booked';

              // For multi-leg journeys, show the full route chain; otherwise show name or route
              let label = '';
              if (journey.isMultiLeg && journey.journeyId) {
                // Find all segments and build chain
                const allSegs = (window.journeys || [])
                  .filter(j => j.journeyId === journey.journeyId)
                  .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
                const stops = allSegs.length > 0
                  ? [allSegs[0].fromLocation, ...allSegs.map(s => s.toLocation)].join(' → ')
                  : (journey.journeyName || journey.fromLocation + ' → ' + journey.toLocation);
                label = `${icon} ${journey.journeyName ? journey.journeyName + ' · ' : ''}${stops}`;
              } else {
                label = `${icon} ${journey.journeyName || journey.notes || journey.fromLocation + ' → ' + journey.toLocation}`;
              }

              // Show departure time if available
              const timeHint = journey.departureTime ? ` <span style="color:#999;font-size:0.75rem;font-family:monospace;">${journey.departureTime}</span>` : '';

              return `<div class="cost-item journey-item">
                <button class="del-btn" title="Remove Journey" onclick="event.stopPropagation(); deleteJourney('${journey.id}'); rebuildCurrentView();">×</button>
                <span class="cost-item-text">${label}${timeHint}</span>
                <div class="cost-item-actions">
                  <span class="status-badge" style="background:${statusColor}; ${isEditMode ? 'cursor:pointer;' : ''}" title="${isEditMode ? 'Click to toggle status' : 'Booking status'}" onclick="event.stopPropagation(); toggleJourneyStatus('${journey.id}');">${statusIcon} ${status === 'booked' ? 'Booked' : 'Planned'}</span>
                  ${showRef ? `<input type="text" class="booking-ref-input confirmed" value="${journey.bookingReference || ''}" placeholder="Ref #" onchange="event.stopPropagation(); updateJourneyBookingRef('${journey.id}', this.value);" ${isEditMode ? '' : 'readonly'}/>` : ''}
                  <span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateJourneyCost('${journey.id}', this.innerText)">${journey.cost || '0'}</span></span>
                </div>
              </div>`;
            }).join('')}
            </div>${isEditMode ? `<button class="add-btn" onclick="event.stopPropagation(); openAddJourneyModal();">+ Add Journey</button>` : ''}
          </div>

          <div class="detail-block block-accom">
            <h4>Accommodation</h4><div class="item-list">
            ${(day.accomItems || []).map((item, i) => {
              const status = item.status || 'pending';
              const statusColor = status === 'confirmed' ? '#27AE60' : '#E67E22';
              const statusIcon = status === 'confirmed' ? '✓' : '⏳';
              const showRef = status === 'confirmed';
              return `<div class="cost-item">
                <button class="del-btn" title="Remove Accommodation" onclick="event.stopPropagation(); deleteDayItem(${legIndex}, ${dayIndex}, 'accomItems', ${i})">×</button>
                <span class="cost-item-text" contenteditable="${isEditMode}" onblur="updateDayItemText(${legIndex}, ${dayIndex}, 'accomItems', ${i}, this.innerText)">${item.text}</span>
                <div class="cost-item-actions">
                  <span class="status-badge" style="background:${statusColor}; ${isEditMode ? 'cursor:pointer;' : ''}" title="${isEditMode ? 'Click to toggle status' : 'Booking status'}" onclick="event.stopPropagation(); toggleBookingStatus(event, ${legIndex}, ${dayIndex}, 'accomItems', ${i})">${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  ${showRef ? `<input type="text" class="booking-ref-input ${status === 'confirmed' ? 'confirmed' : ''}" value="${item.bookingRef || ''}" placeholder="Ref #" onchange="event.stopPropagation(); updateBookingRef(${legIndex}, ${dayIndex}, 'accomItems', ${i}, this.value)" ${isEditMode ? '' : 'readonly'}/>` : ''}
                  <span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${legIndex}, ${dayIndex}, 'accomItems', ${i}, this.innerText)">${item.cost}</span></span>
                </div>
              </div>`;
            }).join('')}
            </div><button class="add-btn" onclick="event.stopPropagation(); openAddStayModal()">+ Add Accom</button>
          </div>

          <div class="detail-block block-activities drop-zone" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${legIndex}, ${dayIndex})">
            <h4>Planned Activities</h4><div class="item-list">
            ${(day.activityItems || []).map((item, i) => `<div class="cost-item"><button class="del-btn" title="Remove Activity" onclick="event.stopPropagation(); deleteDayItem(${legIndex}, ${dayIndex}, 'activityItems', ${i})">×</button><input type="checkbox" class="activity-checkbox" ${item.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleActivityCompleted(event, ${legIndex}, ${dayIndex}, ${i})"><span class="cost-item-text" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}" contenteditable="${isEditMode}" onblur="updateDayItemText(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.text}</span><span class="budget-field" style="color:#666;">⏱ <span contenteditable="${isEditMode}" onblur="updateDayItemTime(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.time || '1 hr'}</span></span><span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.cost}</span></span></div>`).join('')}
            </div><button class="add-btn" onclick="event.stopPropagation(); addDayItem(${legIndex}, ${dayIndex}, 'activityItems')">+ Add Activity</button>
          </div>

        </div></div>
      </div>
      `;
    });

    html += `</div>`;
    section.innerHTML = html;
    container.appendChild(section);
  });
  if (typeof reObserveLegs === "function") reObserveLegs();
}

// Helper to rebuild the current active view
function rebuildCurrentView() {
  const activeTab = document.querySelector('.app-tabs-content .tab-pane.active');
  if (!activeTab) return;

  const tabId = activeTab.id;
  if (tabId === 'tab-itinerary') {
    buildItinerary();
  } else if (tabId === 'tab-transport' && typeof buildTransportTab === 'function') {
    buildTransportTab();
  } else if (tabId === 'tab-accom' && typeof buildAccomTab === 'function') {
    buildAccomTab();
  } else if (tabId === 'tab-budget' && typeof buildBudgetTab === 'function') {
    buildBudgetTab();
  } else if (tabId === 'tab-packing' && typeof buildPackingTab === 'function') {
    buildPackingTab();
  }
}

function buildNav() {
  // Build city filter nav only (leg-nav removed per 6h)
  buildCityNav();
}

// Active city filter - 'all' or city ID (access via window.currentCityFilter for cross-module access)
function buildCityNav() {
  const nav = document.getElementById('cityNav');
  const navList = nav.querySelector('.city-nav-list');
  const filter = window.currentCityFilter || 'all';

  // Keep the "All" button
  navList.innerHTML = `
    <button class="city-nav-btn ${filter === 'all' ? 'active' : ''}" data-city="all" onclick="selectCityFilter('all', this)">
      <span>🏙️ All</span>
    </button>
  `;

  // Add city buttons with color indicators
  citiesData.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'city-nav-btn' + (filter === city.id ? ' active' : '');
    btn.setAttribute('data-city', city.id);
    // Add vertical color bar to button
    const color = city.colour || '#2C3E50';
    btn.style.borderLeft = `4px solid ${color}`;
    const flagHtml = typeof getCityFlagHTML === 'function' ? getCityFlagHTML(city.name) : '<span class="city-flag">📍</span>';
    btn.innerHTML = `<span class="city-nav-content">${flagHtml} ${city.name}</span>`;
    btn.onclick = () => selectCityFilter(city.id, btn);
    navList.appendChild(btn);
  });
}

function selectCityFilter(cityId, btn) {
  window.currentCityFilter = cityId;

  // Update button states
  const nav = document.getElementById('cityNav');
  nav.querySelectorAll('.city-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Rebuild tabs that have city filtering
  const activeTab = document.querySelector('.app-tab-btn.active');
  const tabType = activeTab ? activeTab.getAttribute('data-tab') : 'itinerary';

  if (cityId === 'all') {
    // Show all - rebuild normally
    if (tabType === 'transport' && typeof buildTransportTab === 'function') {
      buildTransportTab();
    } else if (tabType === 'accom' && typeof buildAccomTab === 'function') {
      buildAccomTab();
    } else if (tabType === 'itinerary') {
      buildItinerary();
    }
  } else {
    // Filter by city
    const cityName = getCityNameById ? getCityNameById(cityId) : cityId;
    console.log(`[CityFilter] Selected: ${cityName} (${cityId})`);

    // Rebuild with filtering
    if (tabType === 'transport' && typeof buildTransportTab === 'function') {
      buildTransportTab(cityId);
    } else if (tabType === 'accom' && typeof buildAccomTab === 'function') {
      buildAccomTab(cityId);
    } else if (tabType === 'itinerary') {
      // Scroll to first leg with this city
      scrollToCity(cityId);
    }
  }
}

function scrollToCity(cityId) {
  const cityName = getCityNameById(cityId);
  if (!cityName) return;

  // Find first leg containing this city
  for (let i = 0; i < appData.length; i++) {
    const leg = appData[i];
    const hasCity = leg.days.some(day => day.from === cityName || day.to === cityName);

    if (hasCity) {
      const el = document.getElementById('leg-' + leg.id);
      if (el) {
        el.classList.remove('collapsed');
        // Scroll with offset to account for sticky nav bars
        const navHeight = document.querySelector('.app-tabs-nav')?.offsetHeight || 56;
        const cityNavHeight = document.querySelector('.city-nav')?.offsetHeight || 56;
        const offset = navHeight + cityNavHeight + 20; // +20px padding
        const elTop = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elTop - offset,
          behavior: 'smooth'
        });
        break;
      }
    }
  }
}

// Expose itinerary functions to window scope for HTML onclick handlers
window.rebuildCurrentView = rebuildCurrentView;
window.selectCityFilter = selectCityFilter;
window.expandToCity = expandToCity;
