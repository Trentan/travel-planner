function deleteLeg(idx) {
  if(confirm("Are you sure you want to delete this entire leg and all its days?")) {
    appData.splice(idx, 1);
    saveData(); buildNav(); buildItinerary();
  }
}
function deleteFood(legIdx, foodIdx) { appData[legIdx].cityFood.splice(foodIdx, 1); saveData(); buildItinerary(); }
function deleteRun(legIdx, runIdx) { appData[legIdx].cityRun.splice(runIdx, 1); saveData(); buildItinerary(); }
function deleteSight(legIdx, sightIdx) { appData[legIdx].suggestedSights.splice(sightIdx, 1); saveData(); buildItinerary(); }
function deleteLegTip(legIdx, tipIdx) { appData[legIdx].legTips.splice(tipIdx, 1); saveData(); buildItinerary(); }

function deleteDayItem(legIdx, dayIdx, category, itemIdx) {
  const itemText = appData[legIdx].days[dayIdx][category][itemIdx].text;
  if (category === 'activityItems') {
    const poolSight = appData[legIdx].suggestedSights.find(s => s.title === itemText && s.assignedDayIdx === dayIdx);
    if (poolSight) poolSight.assignedDayIdx = null;
    const poolRun = appData[legIdx].cityRun.find(s => s.title === itemText && s.assignedDayIdx === dayIdx);
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

function addActivity(legIdx) {
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
  appData[legIdx].days[dayIdx][category][itemIdx].text = text; saveData();
  if(!fromTabs) buildItinerary();
}
function updateDayItemCost(legIdx, dayIdx, category, itemIdx, cost, fromTabs = false) {
  appData[legIdx].days[dayIdx][category][itemIdx].cost = cost; saveData();
  if(fromTabs) {
    if(category === 'transportItems') buildTransportTab();
    if(category === 'accomItems') buildAccomTab();
  }
  else buildItinerary();
}
function updateDayItemTime(legIdx, dayIdx, category, itemIdx, time) {
  appData[legIdx].days[dayIdx][category][itemIdx].time = time; saveData();
}

function toggleFoodCompleted(e, legIdx, foodIdx) { appData[legIdx].cityFood[foodIdx].done = e.target.checked; saveData(); buildItinerary(); }
function toggleDayCompleted(e, legIdx, dayIdx) { e.stopPropagation(); appData[legIdx].days[dayIdx].completed = e.target.checked; saveData(); buildItinerary(); }
function toggleActivityCompleted(e, legIdx, dayIdx, itemIdx) { appData[legIdx].days[dayIdx].activityItems[itemIdx].done = e.target.checked; saveData(); buildItinerary(); }

// Dialog functions for Add New Leg
function openAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (modal) {
    modal.style.display = 'flex';
    onLegTypeChange();
  }
}

function closeAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (modal) modal.style.display = 'none';
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

function confirmAddLeg() {
  const legType = document.getElementById('legTypeSelect')?.value || 'city';
  const dateFrom = document.getElementById('legDateFrom')?.value;
  const dateTo = document.getElementById('legDateTo')?.value;

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
    const existingCity = document.getElementById('fromCitySelect')?.value;
    const toCitySelect = document.getElementById('toCitySelect')?.value;
    label = existingCity ? ('📍 ' + existingCity) : '📍 New City';
    fromCity = existingCity || 'Home';
    toCity = toCitySelect || existingCity || 'Home';
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
window.onLegTypeChange = onLegTypeChange;
window.checkDateConflict = checkDateConflict;
window.confirmAddLeg = confirmAddLeg;
