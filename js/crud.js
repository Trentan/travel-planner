function deleteLeg(idx) {
  if(confirm("Are you sure you want to delete this entire leg and all its days?")) {
    appData.splice(idx, 1);
    saveData(); buildNav(); buildItinerary();
  }
}
function deleteFood(legIdx, foodIdx) { appData[legIdx].cityFood.splice(foodIdx, 1); saveData(); buildItinerary(); }
function deleteRun(legIdx, runIdx) { appData[legIdx].cityRun.splice(runIdx, 1); saveData(); buildItinerary(); }
function deleteSight(legIdx, sightIdx) { appData[legIdx].suggestedSights.splice(sightIdx, 1); saveData(); buildItinerary(); }
function deleteActivity(legIdx, activityIdx) { appData[legIdx].suggestedActivities.splice(activityIdx, 1); saveData(); buildItinerary(); }
function deleteLegTip(legIdx, tipIdx) { appData[legIdx].legTips.splice(tipIdx, 1); saveData(); buildItinerary(); }

function findAssignedSuggestedActivity(legIdx, dayIdx, itemText) {
  const activities = appData[legIdx]?.suggestedActivities || [];
  return activities.find(activity => activity && activity.assignedDayIdx === dayIdx && activity.title === itemText) || null;
}

function syncAssignedSuggestedActivityField(legIdx, dayIdx, itemText, field, value) {
  const activity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText);
  if (!activity) return;
  activity[field] = value;
}

function isPlaceholderActivityItem(item) {
  const text = String(item?.text || '').trim();
  return /^[-—]$/.test(text) || text === 'Explore local area' || text === 'Add item...' || text === 'New item...';
}

function deleteDayItem(legIdx, dayIdx, category, itemIdx) {
  const itemText = appData[legIdx].days[dayIdx][category][itemIdx].text;
  if (category === 'activityItems') {
    const poolActivity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText);
    if (poolActivity) poolActivity.assignedDayIdx = null;
    const poolSight = (appData[legIdx].suggestedSights || []).find(s => s.title === itemText && s.assignedDayIdx === dayIdx);
    if (poolSight) poolSight.assignedDayIdx = null;
    const poolRun = (appData[legIdx].cityRun || []).find(s => s.title === itemText && s.assignedDayIdx === dayIdx);
    if (poolRun) poolRun.assignedDayIdx = null;
  }
  appData[legIdx].days[dayIdx][category].splice(itemIdx, 1); saveData(); buildItinerary();
}

function addFood(legIdx) {
  // Create modal for adding new food item
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h2>🍽️ Add Food Item</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ai-form-group">
          <label>Food Item</label>
          <input type="text" id="foodName" placeholder="e.g., Try local pizza" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Cost ($)</label>
          <input type="text" id="foodCost" placeholder="0" value="0" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="action-btn" style="background: #2C3E50; color: white;" id="saveFoodBtn">Save Food Item</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('foodName').focus(), 100);
  document.getElementById('saveFoodBtn').onclick = () => {
    const name = document.getElementById('foodName').value.trim();
    if (!name) { alert('Please enter a food item'); return; }
    const cost = document.getElementById('foodCost').value.trim() || '0';
    appData[legIdx].cityFood.push({ text: name, cost: cost, done: false });
    modal.remove();
    saveData(); buildItinerary();
  };
  modal.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('saveFoodBtn').click(); });
  });
}

function _splitActivityTitle(title) {
  const raw = (title || '').trim();
  if (!raw) return { title: '', location: '' };
  const separator = ' — ';
  const separatorIdx = raw.indexOf(separator);
  if (separatorIdx === -1) return { title: raw, location: '' };
  return {
    title: raw.slice(0, separatorIdx).trim(),
    location: raw.slice(separatorIdx + separator.length).trim()
  };
}

function _openActivityModal(legIdx, activityIdx = null) {
  const isEditing = activityIdx !== null && activityIdx !== undefined;
  const activity = isEditing ? appData[legIdx]?.suggestedActivities?.[activityIdx] : null;
  if (isEditing && !activity) return;

  const existingModal = document.getElementById('activity-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'activity-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  const defaults = _splitActivityTitle(activity?.title || '');
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 420px;">
      <div class="modal-header">
        <h2>${isEditing ? '✎ Edit Suggested Activity' : '➕ Add Suggested Activity'}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ai-form-group">
          <label>Category</label>
          <select id="activityCategory" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
            <option value="fitness">🏃 Fitness</option>
            <option value="sight" selected>🏛️ Sight</option>
            <option value="attraction">🎢 Attraction</option>
            <option value="wellness">🧘 Wellness</option>
            <option value="food">🍽️ Food</option>
            <option value="tour">🚌 Tour</option>
          </select>
        </div>
        <div class="ai-form-group">
          <label>Description</label>
          <input type="text" id="activityTitle" placeholder="e.g., Morning yoga in the park" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Location</label>
          <input type="text" id="activityLocation" placeholder="e.g., Central Park" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Time</label>
          <input type="text" id="activityTime" placeholder="e.g., 1 hr" value="1 hr" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Cost ($)</label>
          <input type="text" id="activityCost" placeholder="0" value="0" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="action-btn" style="background: #2C3E50; color: white;" id="saveActivityBtn">${isEditing ? 'Save Changes' : 'Save Activity'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const categoryEl = document.getElementById('activityCategory');
  const titleEl = document.getElementById('activityTitle');
  const locationEl = document.getElementById('activityLocation');
  const timeEl = document.getElementById('activityTime');
  const costEl = document.getElementById('activityCost');

  if (isEditing && activity) {
    if (categoryEl) categoryEl.value = activity.category || 'sight';
    if (titleEl) titleEl.value = defaults.title || activity.title || '';
    if (locationEl) locationEl.value = defaults.location || '';
    if (timeEl) timeEl.value = activity.estTime || '1 hr';
    if (costEl) costEl.value = activity.estCost || '0';
  }

  setTimeout(() => titleEl?.focus(), 100);

  function saveActivityHandler() {
    const category = document.getElementById('activityCategory').value;
    const title = document.getElementById('activityTitle').value.trim();
    const location = document.getElementById('activityLocation').value.trim();
    const estTime = document.getElementById('activityTime').value.trim() || '1 hr';
    const estCost = document.getElementById('activityCost').value.trim() || '0';
    if (!title) { alert('Please enter a description'); return; }

    const fullTitle = location ? `${title} — ${location}` : title;

    if (isEditing) {
      const target = appData[legIdx]?.suggestedActivities?.[activityIdx];
      if (!target) {
        modal.remove();
        return;
      }

      const previousTitle = target.title;
      target.title = fullTitle;
      target.category = category;
      target.estTime = estTime;
      target.estCost = estCost;

      if (target.assignedDayIdx !== null && target.assignedDayIdx !== undefined) {
        const day = appData[legIdx]?.days?.[target.assignedDayIdx];
        if (day?.activityItems?.length) {
          day.activityItems.forEach(item => {
            if (item.text === previousTitle) item.text = fullTitle;
          });
        }
      }
    } else {
      appData[legIdx].suggestedActivities.push({
        title: fullTitle,
        category: category,
        estTime: estTime,
        estCost: estCost,
        assignedDayIdx: null
      });
    }

    modal.remove();
    saveData();
    buildItinerary();
  }

  document.getElementById('saveActivityBtn').onclick = (e) => { e.stopPropagation(); saveActivityHandler(); };
  modal.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveActivityHandler(); });
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function addActivity(legIdx) {
  return _openActivityModal(legIdx);
  // Create modal for adding new activity
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h2>➕ Add Suggested Activity</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ai-form-group">
          <label>Category</label>
          <select id="activityCategory" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
            <option value="fitness">🏃 Fitness</option>
            <option value="sight" selected>🏛️ Sight</option>
            <option value="attraction">🎢 Attraction</option>
            <option value="wellness">🧘 Wellness</option>
            <option value="food">🍽️ Food</option>
            <option value="tour">🚌 Tour</option>
          </select>
        </div>
        <div class="ai-form-group">
          <label>Description</label>
          <input type="text" id="activityTitle" placeholder="e.g., Morning yoga in the park" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Location</label>
          <input type="text" id="activityLocation" placeholder="e.g., Central Park" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Time</label>
          <input type="text" id="activityTime" placeholder="e.g., 1 hr" value="1 hr" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Cost ($)</label>
          <input type="text" id="activityCost" placeholder="0" value="0" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="action-btn" style="background: #2C3E50; color: white;" id="saveActivityBtn">Save Activity</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('activityTitle').focus(), 100);
  function saveActivityHandler() {
    const category = document.getElementById('activityCategory').value;
    const title = document.getElementById('activityTitle').value.trim();
    const location = document.getElementById('activityLocation').value.trim();
    const estTime = document.getElementById('activityTime').value.trim() || '1 hr';
    const estCost = document.getElementById('activityCost').value.trim() || '0';
    if (!title) { alert('Please enter a description'); return; }
    const fullTitle = location ? `${title} — ${location}` : title;
    appData[legIdx].suggestedActivities.push({ title: fullTitle, category: category, estTime: estTime, estCost: estCost, assignedDayIdx: null });
    modal.remove();
    saveData(); buildItinerary();
  }
  document.getElementById('saveActivityBtn').onclick = (e) => { e.stopPropagation(); saveActivityHandler(); };
  modal.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveActivityHandler(); });
  });
}

function openEditActivityModal(legIdx, activityIdx) {
  return _openActivityModal(legIdx, activityIdx);
}

function addRun(legIdx) { appData[legIdx].cityRun.push({ title: "New run...", estTime: "1 hr", estCost: "0", assignedDayIdx: null }); saveData(); buildItinerary(); }
function addSight(legIdx) { appData[legIdx].suggestedSights.push({ title: "New sight...", estTime: "1 hr", estCost: "0", assignedDayIdx: null }); saveData(); buildItinerary(); }
function addLegTip(legIdx) { appData[legIdx].legTips.push("New tip..."); saveData(); buildItinerary(); }

function addDayItem(legIdx, dayIdx, category) {
  if (category === 'activityItems') { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", time: "1 hr", done: false }); }
  else if (category === 'transportItems' || category === 'accomItems') { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", status: "pending", bookingRef: "", done: false }); }
  else { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", done: false }); }
  saveData(); buildItinerary();
}

function toggleBookingStatus(e, legIdx, dayIdx, category, itemIdx) {
  e.stopPropagation();
  e.preventDefault();
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  item.status = item.status === 'confirmed' ? 'pending' : 'confirmed';
  if (item.status === 'pending') item.bookingRef = '';
  saveData();
  // Check which tab is active and only rebuild relevant views
  const activeTab = document.querySelector('.tab-pane.active');
  const tabId = activeTab ? activeTab.id : '';
  if (tabId === 'tab-itinerary') {
    buildItinerary();
  } else if (tabId === 'tab-transport') {
    if (typeof buildTransportTab === 'function') buildTransportTab();
  } else if (tabId === 'tab-accom') {
    if (typeof buildAccomTab === 'function') buildAccomTab();
  } else {
    // Default: rebuild itinerary for other tabs
    buildItinerary();
  }
}

function updateBookingRef(legIdx, dayIdx, category, itemIdx, value) {
  appData[legIdx].days[dayIdx][category][itemIdx].bookingRef = value;
  saveData();
  // Check which tab is active and only rebuild relevant views
  const activeTab = document.querySelector('.tab-pane.active');
  const tabId = activeTab ? activeTab.id : '';
  if (tabId === 'tab-transport') {
    if (typeof buildTransportTab === 'function') buildTransportTab();
  } else if (tabId === 'tab-accom') {
    if (typeof buildAccomTab === 'function') buildAccomTab();
  }
}

function addLeg() {
  const newLeg = {
    id: 'leg_' + Date.now(),
    label: '📍 New City',
    colour: '#2C3E50',
    cityFood: [{ text: "Local dish to try", done: false }],
    cityRun: [{ title: "5km park loop", estTime: "1 hr", estCost: "0", assignedDayIdx: null }],
    suggestedSights: [],
    legTips: ["Add tip..."],
    days: [{
      date: 'DD Mon', day: 'Mon', from: 'City', to: 'City',
      completed: false, desc: 'Travel and arrival day',
      transportItems: [{ text: "Add transport...", cost: "0" }],
      accomItems: [{ text: "Add accommodation...", cost: "0" }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
    }]
  };
  appData.push(newLeg);
  sortLegs();
}

function updateFoodText(legIdx, foodIdx, text) { appData[legIdx].cityFood[foodIdx].text = text; saveData(); }
function updateRunPool(legIdx, runIdx, key, val) {
  if (!val.trim() && key === 'title') { appData[legIdx].cityRun.splice(runIdx, 1); saveData(); buildItinerary(); }
  else { appData[legIdx].cityRun[runIdx][key] = val; saveData(); }
}
function updateSightPool(legIdx, sightIdx, key, val) {
  if (!val.trim() && key === 'title') { appData[legIdx].suggestedSights.splice(sightIdx, 1); saveData(); buildItinerary(); }
  else { appData[legIdx].suggestedSights[sightIdx][key] = val; saveData(); }
}
function updateLegTip(legIdx, tipIdx, val) {
  if (!val.trim()) { appData[legIdx].legTips.splice(tipIdx, 1); saveData(); buildItinerary(); }
  else { appData[legIdx].legTips[tipIdx] = val; saveData(); }
}

function updateDayItemText(legIdx, dayIdx, category, itemIdx, text, fromTabs = false) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  const previousText = item.text;
  item.text = text;
  if (category === 'activityItems') {
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'title', text);
  }
  saveData();
  if(!fromTabs) buildItinerary();
}
function updateDayItemCost(legIdx, dayIdx, category, itemIdx, cost, fromTabs = false) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  const previousText = item.text;
  item.cost = cost;
  if (category === 'activityItems') {
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'estCost', cost);
  }
  saveData();
  if(fromTabs) {
    if(category === 'transportItems') buildTransportTab();
    if(category === 'accomItems') buildAccomTab();
  }
  else buildItinerary();
}
function updateDayItemTime(legIdx, dayIdx, category, itemIdx, time) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  const previousText = item.text;
  item.time = time;
  if (category === 'activityItems') {
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'estTime', time);
  }
  saveData();
}

function toggleFoodCompleted(e, legIdx, foodIdx) { appData[legIdx].cityFood[foodIdx].done = e.target.checked; saveData(); buildItinerary(); }
function toggleDayCompleted(e, legIdx, dayIdx) { e.stopPropagation(); appData[legIdx].days[dayIdx].completed = e.target.checked; saveData(); buildItinerary(); }
function toggleActivityCompleted(e, legIdx, dayIdx, itemIdx) { appData[legIdx].days[dayIdx].activityItems[itemIdx].done = e.target.checked; saveData(); buildItinerary(); }

function assignSuggestedActivityToDay(sourceLegIdx, activityIdx, targetLegIdx, targetDayIdx) {
  const sourceLeg = appData[sourceLegIdx];
  const targetLeg = appData[targetLegIdx];
  const activity = sourceLeg?.suggestedActivities?.[activityIdx];
  const targetDay = targetLeg?.days?.[targetDayIdx];
  if (!activity || !targetDay) return false;

  const previousDayIdx = activity.assignedDayIdx;
  if (previousDayIdx !== null && previousDayIdx !== undefined && sourceLegIdx === targetLegIdx && previousDayIdx !== targetDayIdx) {
    const previousDay = targetLeg.days[previousDayIdx];
    if (previousDay && Array.isArray(previousDay.activityItems)) {
      const prevIndex = previousDay.activityItems.findIndex(item => item.text === activity.title);
      if (prevIndex !== -1) previousDay.activityItems.splice(prevIndex, 1);
    }
  }

  if (!Array.isArray(targetDay.activityItems)) targetDay.activityItems = [];
  if (targetDay.activityItems.length === 1 && isPlaceholderActivityItem(targetDay.activityItems[0])) {
    targetDay.activityItems = [];
  }

  if (!targetDay.activityItems.some(item => item.text === activity.title)) {
    targetDay.activityItems.push({
      text: activity.title,
      cost: activity.estCost || '0',
      time: activity.estTime || '1 hr',
      done: false
    });
  }

  activity.assignedDayIdx = targetDayIdx;
  return true;
}

function openActivityAssignModal(legIdx, activityIdx) {
  const leg = appData[legIdx];
  const activity = leg?.suggestedActivities?.[activityIdx];
  if (!leg || !activity || !Array.isArray(leg.days) || leg.days.length === 0) return;

  const existingModal = document.getElementById('activity-assign-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'activity-assign-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';

  const currentDayLabel = activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined && leg.days[activity.assignedDayIdx]
    ? `${leg.days[activity.assignedDayIdx].day} ${leg.days[activity.assignedDayIdx].date}`
    : 'Unassigned';

  const dayButtons = leg.days.map((day, dayIdx) => {
    const isCurrent = activity.assignedDayIdx === dayIdx;
    return `
      <button type="button" class="action-btn" data-day-index="${dayIdx}" style="width:100%; margin:0; display:flex; flex-direction:column; align-items:flex-start; gap:0.25rem; text-align:left; ${isCurrent ? 'background:#2C3E50; color:white; border-color:#2C3E50;' : ''}">
        <span style="font-weight:700;">Day ${day.day} ${day.date}</span>
        <span style="font-size:0.8rem; opacity:${isCurrent ? '0.85' : '0.75'};">${day.from} → ${day.to}</span>
        <span style="font-size:0.75rem; opacity:${isCurrent ? '0.85' : '0.7'};">${isCurrent ? 'Current day' : 'Tap to assign here'}</span>
      </button>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h2>📌 Assign Suggested Activity</h2>
        <button class="modal-close" type="button" id="activityAssignCloseBtn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div style="padding:0.9rem 1rem; border:1px solid var(--border); border-radius:12px; background:var(--card-strong);">
            <div style="font-weight:700; margin-bottom:0.25rem;">${activity.title}</div>
            <div style="font-size:0.85rem; color:var(--muted);">
              ${activity.category ? `${activity.category} · ` : ''}${activity.estTime || '1 hr'} · $${activity.estCost || '0'}
            </div>
            <div style="font-size:0.78rem; color:var(--muted); margin-top:0.35rem;">Current assignment: ${currentDayLabel}</div>
          </div>
          <div style="display:grid; gap:0.6rem; max-height:52vh; overflow:auto; padding-right:0.2rem;">
            ${dayButtons}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" type="button" id="activityAssignCancelBtn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('activityAssignCloseBtn').onclick = closeModal;
  document.getElementById('activityAssignCancelBtn').onclick = closeModal;
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  const firstButton = modal.querySelector('[data-day-index]');
  if (firstButton) {
    setTimeout(() => firstButton.focus(), 50);
  }

  modal.querySelectorAll('[data-day-index]').forEach(button => {
    button.addEventListener('click', () => {
      const targetDayIdx = Number(button.getAttribute('data-day-index'));
      if (!Number.isFinite(targetDayIdx)) return;
      const assigned = assignSuggestedActivityToDay(legIdx, activityIdx, legIdx, targetDayIdx);
      if (!assigned) return;
      saveData();
      buildItinerary();
      closeModal();
    });
  });
}

// Dialog functions for Add New Leg
function openAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (modal) {
    _populateAddLegCityDropdowns();
    modal.style.display = 'flex';
    onLegTypeChange();
  }
}

function _populateAddLegCityDropdowns() {
  const existingSelect = document.getElementById('existingCitySelect');
  const fromSelect = document.getElementById('fromCitySelect');
  const toSelect = document.getElementById('toCitySelect');
  const countrySelect = document.getElementById('newLegCityCountrySelect');

  // Build options HTML with Home + cities
  let cityOptionsHtml = '';
  if (typeof citiesData !== 'undefined') {
    [...citiesData].sort((a, b) => a.name.localeCompare(b.name)).forEach(city => {
      const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '📍';
      cityOptionsHtml += `<option value="${city.name}">${flag} ${city.name}</option>`;
    });
  }

  // Populate existingCitySelect: Home + cities
  if (existingSelect) {
    const currentValue = existingSelect.value;
    existingSelect.innerHTML = '<option value="">-- Choose a city --</option><option value="Home">🏠 Home</option>' + cityOptionsHtml;
    if (currentValue) existingSelect.value = currentValue;
  }

  // Populate fromCitySelect: Home + cities (for travel legs)
  if (fromSelect) {
    const currentValue = fromSelect.value;
    fromSelect.innerHTML = '<option value="Home">🏠 Home</option>' + cityOptionsHtml;
    if (currentValue) fromSelect.value = currentValue;
  }

  // Populate toCitySelect: cities only (for travel legs)
  if (toSelect) {
    const currentValue = toSelect.value;
    toSelect.innerHTML = '<option value="">-- Choose destination --</option>' + cityOptionsHtml;
    if (currentValue) toSelect.value = currentValue;
  }

  // Populate country dropdown for new city creation
  if (countrySelect && typeof COUNTRY_DATA !== 'undefined') {
    const currentValue = countrySelect.value;
    countrySelect.innerHTML = '<option value="">Select country...</option>' +
      COUNTRY_DATA
        .filter(c => c.code !== 'ZZ')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => `<option value="${c.code}">${c.flag} ${c.name}</option>`)
        .join('') +
      '<option value="OTHER">✏️ Other...</option>';
    if (currentValue) countrySelect.value = currentValue;
  }
}

function onNewLegCountryChange() {
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const otherInput = document.getElementById('newLegCityCountryOther');
  if (!countrySelect || !otherInput) return;

  if (countrySelect.value === 'OTHER') {
    otherInput.style.display = 'block';
    otherInput.focus();
  } else {
    otherInput.style.display = 'none';
    otherInput.value = '';
  }
}

function closeAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (modal) modal.style.display = 'none';

  // Clear form inputs
  const existingCitySelect = document.getElementById('existingCitySelect');
  const newCityName = document.getElementById('newLegCityName');
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const countryOther = document.getElementById('newLegCityCountryOther');
  const fromDate = document.getElementById('newLegStartDate');
  const toDate = document.getElementById('newLegEndDate');

  if (existingCitySelect) existingCitySelect.value = '';
  if (newCityName) newCityName.value = '';
  if (countrySelect) countrySelect.value = '';
  if (countryOther) {
    countryOther.value = '';
    countryOther.style.display = 'none';
  }
  if (fromDate) fromDate.value = '';
  if (toDate) toDate.value = '';
}

function onLegTypeChange() {
  const type = document.getElementById('legTypeSelect')?.value || 'city';
  const citySection = document.getElementById('city-section');
  const startSection = document.getElementById('start-section');
  const returnSection = document.getElementById('return-section');
  if (citySection) citySection.style.display = type === 'city' ? 'block' : 'none';
  if (startSection) startSection.style.display = type === 'start' ? 'block' : 'none';
  if (returnSection) returnSection.style.display = type === 'return' ? 'block' : 'none';
}

function checkDateConflict(dateStr, excludeLegIdx) {
  // Check for date conflicts across all legs
  for (let i = 0; i < appData.length; i++) {
    if (excludeLegIdx !== undefined && i === excludeLegIdx) continue;
    const leg = appData[i];
    if (!leg.days || leg.days.length === 0) continue;
    for (const day of leg.days) {
      if (day.date === dateStr) {
        return { legIndex: i, legLabel: leg.label, day: day };
      }
    }
  }
  return null;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekdayLabelForTripDate(dateStr) {
  const normalized = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateStr) : dateStr;
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return 'Mon';

  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Mon';
  return WEEKDAY_LABELS[date.getDay()];
}

function cloneDayItems(items) {
  return Array.isArray(items) ? JSON.parse(JSON.stringify(items)) : [];
}

function createLegDayTemplate(sourceDay, dateStr) {
  const anchorCity = sourceDay?.to || sourceDay?.from || 'Home';
  const isStayDay = sourceDay?.from === sourceDay?.to;
  const day = {
    date: dateStr,
    day: getWeekdayLabelForTripDate(dateStr),
    from: anchorCity,
    to: anchorCity,
    completed: false,
    desc: isStayDay
      ? `Additional day in ${anchorCity}`
      : `Additional day in ${anchorCity}`,
    transportItems: [],
    accomItems: cloneDayItems(sourceDay?.accomItems),
    activityItems: []
  };

  if (day.accomItems.length === 0) {
    day.accomItems = [{ text: 'Add accommodation...', cost: '0', status: 'pending', bookingRef: '', done: false }];
  }

  if (isStayDay && Array.isArray(sourceDay?.activityItems) && sourceDay.activityItems.length > 0) {
    day.activityItems = cloneDayItems(sourceDay.activityItems);
  } else {
    day.activityItems = [{ text: 'Explore local area', cost: '0', time: '1 hr', done: false }];
  }

  return day;
}

function adjustLegDays(legIdx, delta) {
  const leg = appData[legIdx];
  if (!leg || !Array.isArray(leg.days) || leg.days.length === 0) return;

  if (delta === 0) return;

  if (delta > 0) {
    const lastDay = leg.days[leg.days.length - 1];
    const lastDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(lastDay.date) : lastDay.date;
    const nextDate = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(lastDate, delta) : '';

    if (!nextDate) {
      alert('Could not calculate the next day for this leg.');
      return;
    }

    const conflict = checkDateConflict(nextDate, legIdx);
    if (conflict) {
      const conflictDate = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(nextDate) : nextDate;
      const proceed = confirm(
        `Adding a day to ${leg.label} creates a date overlap on ${conflictDate} with ${conflict.legLabel}. Continue anyway?`
      );
      if (!proceed) return;
    }

    leg.days.push(createLegDayTemplate(lastDay, nextDate));
    saveData();
    sortLegs();
    return;
  }

  if (leg.days.length === 1) {
    const proceed = confirm(`Removing the only day from ${leg.label} will delete the entire leg. Continue?`);
    if (!proceed) return;
    deleteLeg(legIdx);
    return;
  }

  leg.days.pop();
  saveData();
  buildItinerary();
}

function confirmAddLeg() {
  const legType = document.getElementById('legTypeSelect')?.value || 'city';
  const dateFrom = document.getElementById('newLegStartDate')?.value;
  const dateTo = document.getElementById('newLegEndDate')?.value;

  // Check for date conflicts
  if (dateFrom && dateTo) {
    const startConflict = checkDateConflict(dateFrom);
    if (startConflict) {
      alert('Warning: Start date conflicts with ' + startConflict.legLabel);
      return;
    }
  }

  let label, fromCity, toCity;
  if (legType === 'start') {
    label = '🚀 Start';
    fromCity = 'Home';
    toCity = document.getElementById('startCitySelect')?.value || 'Home';
  } else if (legType === 'return') {
    label = '🏠 Return';
    fromCity = document.getElementById('returnCitySelect')?.value || 'Home';
    toCity = 'Home';
  } else {
    // Regular city leg
    const existingCity = document.getElementById('existingCitySelect')?.value;
    const newCityName = document.getElementById('newLegCityName')?.value?.trim();

    if (existingCity && existingCity !== 'Home') {
      // Using existing city
      label = '📍 ' + existingCity;
      fromCity = existingCity;
      toCity = existingCity;
    } else if (newCityName) {
      // Creating new city - get country from dropdown or other input
      const countrySelect = document.getElementById('newLegCityCountrySelect')?.value;
      const countryOther = document.getElementById('newLegCityCountryOther')?.value?.trim();
      let countryName = '';
      let countryCode = '';

      if (countrySelect && countrySelect !== 'OTHER') {
        const countryMatch = COUNTRY_DATA.find(c => c.code === countrySelect);
        if (countryMatch) {
          countryName = countryMatch.name;
          countryCode = countryMatch.code;
        }
      } else if (countryOther) {
        countryName = countryOther;
      }

      // Add the new city
      const newCity = addOrUpdateCity(newCityName, countryName, '', '', '', countryCode);
      if (newCity && typeof buildCityNav === 'function') {
        buildCityNav();
      }

      label = '📍 ' + newCityName;
      fromCity = newCityName;
      toCity = newCityName;
    } else {
      label = '📍 New City';
      fromCity = 'Home';
      toCity = 'Home';
    }
  }

  const newLeg = {
    id: 'leg_' + Date.now(),
    label: label,
    colour: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
    cityFood: [{ text: "Local dish to try", done: false }],
    cityRun: [{ title: "5km park loop", estTime: "1 hr", estCost: "0", assignedDayIdx: null }],
    suggestedSights: [],
    legTips: ["Add tip..."],
    days: [{
      date: dateFrom || 'DD Mon',
      day: 'Mon',
      from: fromCity,
      to: toCity,
      completed: false,
      desc: legType === 'start' ? 'Departure day' : (legType === 'return' ? 'Return home' : 'Travel and arrival day'),
      transportItems: [{ text: "Add transport...", cost: "0" }],
      accomItems: [{ text: "Add accommodation...", cost: "0" }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
    }]
  };

  if (dateTo && dateFrom !== dateTo) {
    // Add end date day if different
    newLeg.days.push({
      date: dateTo,
      day: 'Tue',
      from: toCity,
      to: toCity,
      completed: false,
      desc: 'Exploring',
      transportItems: [],
      accomItems: [{ text: "Add accommodation...", cost: "0" }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
    });
  }

  appData.push(newLeg);
  closeAddLegDialog();
  sortLegs();
}

// Expose functions to window scope for HTML onclick handlers
window.deleteLeg = deleteLeg;
window.deleteFood = deleteFood;
window.deleteRun = deleteRun;
window.deleteSight = deleteSight;
window.deleteLegTip = deleteLegTip;
window.deleteDayItem = deleteDayItem;
window.addFood = addFood;
window.addRun = addRun;
window.addSight = addSight;
window.addLegTip = addLegTip;
window.addDayItem = addDayItem;
window.toggleBookingStatus = toggleBookingStatus;
window.updateBookingRef = updateBookingRef;
window.addLeg = addLeg;
window.updateFoodText = updateFoodText;
window.updateRunPool = updateRunPool;
window.updateSightPool = updateSightPool;
window.updateLegTip = updateLegTip;
window.updateDayItemText = updateDayItemText;
window.updateDayItemCost = updateDayItemCost;
window.updateDayItemTime = updateDayItemTime;
window.toggleFoodCompleted = toggleFoodCompleted;
window.toggleDayCompleted = toggleDayCompleted;
window.toggleActivityCompleted = toggleActivityCompleted;
window.openAddLegDialog = openAddLegDialog;
window.closeAddLegDialog = closeAddLegDialog;
window.openEditActivityModal = openEditActivityModal;
window.onLegTypeChange = onLegTypeChange;
window.checkDateConflict = checkDateConflict;
window.adjustLegDays = adjustLegDays;
window.confirmAddLeg = confirmAddLeg;
window.deleteActivity = deleteActivity;
window._populateAddLegCityDropdowns = _populateAddLegCityDropdowns;
window.onNewLegCountryChange = onNewLegCountryChange;

// Add Stay Modal Functions
let editingStayId = null; // Track if we're editing an existing stay

function _syncStayModalActions() {
  const deleteBtn = document.getElementById('stayDeleteBtn');
  if (deleteBtn) deleteBtn.style.display = editingStayId ? 'inline-flex' : 'none';
}

function openAddStayModal() {
  const modal = document.getElementById('stay-modal');
  if (!modal) return;

  editingStayId = null; // Reset editing state

  // Update modal title
  const title = modal.querySelector('h2');
  if (title) title.textContent = '🏨 Add Stay';

  // Populate city dropdown
  const citySelect = document.getElementById('stayCitySelect');
  if (citySelect) {
    citySelect.innerHTML = '<option value="">-- Select city --</option>';
    (citiesData || []).forEach(city => {
      const option = document.createElement('option');
      option.value = city.id;
      option.textContent = city.name + (city.country ? ` (${city.country})` : '');
      citySelect.appendChild(option);
    });
  }

  // Clear form fields
  document.getElementById('stayPropertyName').value = '';
  document.getElementById('stayCheckIn').value = '';
  document.getElementById('stayCheckOut').value = '';
  document.getElementById('stayNights').value = '';
  document.getElementById('stayStatus').value = 'planned';
  document.getElementById('stayProvider').value = '';
  document.getElementById('stayBookingRef').value = '';
  document.getElementById('stayTotalCost').value = '';
  document.getElementById('stayNotes').value = '';

  // Set up auto-calc for nights
  const checkIn = document.getElementById('stayCheckIn');
  const checkOut = document.getElementById('stayCheckOut');
  const nights = document.getElementById('stayNights');

  function calcNights() {
    if (checkIn.value && checkOut.value) {
      const start = new Date(checkIn.value);
      const end = new Date(checkOut.value);
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
      nights.value = diff > 0 ? diff : 0;
    }
  }

  checkIn.onchange = calcNights;
  checkOut.onchange = calcNights;

  _syncStayModalActions();
  modal.style.display = 'flex';
}

function openEditStayModal(stayId) {
  const modal = document.getElementById('stay-modal');
  if (!modal) return;

  const stay = stays.find(s => s.id === stayId);
  if (!stay) return;

  editingStayId = stayId; // Set editing state

  // Update modal title
  const title = modal.querySelector('h2');
  if (title) title.textContent = '🏨 Edit Stay';

  // Populate city dropdown and select current
  const citySelect = document.getElementById('stayCitySelect');
  if (citySelect) {
    citySelect.innerHTML = '<option value="">-- Select city --</option>';
    (citiesData || []).forEach(city => {
      const option = document.createElement('option');
      option.value = city.id;
      option.textContent = city.name + (city.country ? ` (${city.country})` : '');
      if (city.id === stay.cityId) option.selected = true;
      citySelect.appendChild(option);
    });
  }

  // Populate form fields
  document.getElementById('stayPropertyName').value = stay.propertyName || '';
  document.getElementById('stayCheckIn').value = stay.checkIn || '';
  document.getElementById('stayCheckOut').value = stay.checkOut || '';
  document.getElementById('stayNights').value = stay.nights || '';
  document.getElementById('stayStatus').value = stay.status === 'pending' ? 'planned' : (stay.status || 'planned');
  document.getElementById('stayProvider').value = stay.provider || '';
  document.getElementById('stayBookingRef').value = stay.bookingRef || '';
  document.getElementById('stayTotalCost').value = stay.totalCost || '';
  document.getElementById('stayNotes').value = stay.notes || '';

  // Set up auto-calc for nights
  const checkIn = document.getElementById('stayCheckIn');
  const checkOut = document.getElementById('stayCheckOut');
  const nights = document.getElementById('stayNights');

  function calcNights() {
    if (checkIn.value && checkOut.value) {
      const start = new Date(checkIn.value);
      const end = new Date(checkOut.value);
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
      nights.value = diff > 0 ? diff : 0;
    }
  }

  checkIn.onchange = calcNights;
  checkOut.onchange = calcNights;

  _syncStayModalActions();
  modal.style.display = 'flex';
}

function closeAddStayModal() {
  const modal = document.getElementById('stay-modal');
  if (modal) modal.style.display = 'none';
  editingStayId = null;
  _syncStayModalActions();
}

function saveStayFromModal() {
  const cityId = document.getElementById('stayCitySelect').value;
  const propertyName = document.getElementById('stayPropertyName').value.trim();
  const checkIn = document.getElementById('stayCheckIn').value;
  const checkOut = document.getElementById('stayCheckOut').value;
  const nights = parseInt(document.getElementById('stayNights').value) || 0;
  const status = document.getElementById('stayStatus').value || 'planned';
  const provider = document.getElementById('stayProvider').value.trim();
  const bookingRef = document.getElementById('stayBookingRef').value.trim();
  const totalCost = document.getElementById('stayTotalCost').value.trim() || '0';
  const notes = document.getElementById('stayNotes').value.trim();

  if (!cityId) return alert('Please select a city');
  if (!propertyName) return alert('Please enter a property name');
  if (!checkIn || !checkOut) return alert('Please enter check-in and check-out dates');

  if (editingStayId) {
    // Editing existing stay
    const stay = stays.find(s => s.id === editingStayId);
    if (stay) {
      stay.cityId = cityId;
      stay.propertyName = propertyName;
      stay.checkIn = checkIn;
      stay.checkOut = checkOut;
      stay.nights = nights;
      stay.status = status;
      stay.provider = provider;
      stay.bookingRef = bookingRef;
      stay.totalCost = totalCost;
      stay.notes = notes;
    }
    editingStayId = null; // Reset editing state
  } else {
    // Creating new stay
    const stay = {
      id: 'stay_' + Date.now(),
      cityId: cityId,
      propertyName: propertyName,
      checkIn: checkIn,
      checkOut: checkOut,
      nights: nights,
      status: status,
      provider: provider,
      bookingRef: bookingRef,
      totalCost: totalCost,
      notes: notes
    };
    stays.push(stay);
  }

  closeAddStayModal();
  saveData();

  // Rebuild current view
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  } else {
    buildItinerary();
  }
}

function deleteStay(id) {
  if (!confirm('Delete this stay?')) return;
  const idx = stays.findIndex(s => s.id === id);
  if (idx > -1) {
    stays.splice(idx, 1);
    saveData();
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    } else {
      buildItinerary();
    }
  }
}

function deleteStayFromModal() {
  if (!editingStayId) return;
  if (!confirm('Delete this stay?')) return;
  const id = editingStayId;
  editingStayId = null;
  deleteStay(id);
  closeAddStayModal();
}

function toggleStayStatus(e, id) {
  if (e) e.stopPropagation();
  const s = stays.find(s => s.id === id);
  if (s) {
    const states = ['planned', 'booked', 'confirmed', 'cancelled'];
    if (s.status === 'pending') s.status = 'planned';
    const currentIdx = states.indexOf(s.status);
    s.status = states[(currentIdx + 1) % states.length];
    saveData();
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    } else {
      buildItinerary();
    }
  }
}

function updateStayField(id, field, value) {
  const s = stays.find(s => s.id === id);
  if (s) {
    s[field] = value;
    saveData();
  }
}

// Backward compatibility - old function names for existing code
function openStayModal(l, d) { openAddStayModal(); }
function closeStayModal() { closeAddStayModal(); }

Object.assign(window, {
  openAddStayModal, closeAddStayModal, saveStayFromModal, openEditStayModal,
  deleteStay, deleteStayFromModal, toggleStayStatus, updateStayField,
  openStayModal, closeStayModal  // backward compat
});
