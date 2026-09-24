/* ==========================================================================
   MODULE: CRUD Operations & Item Management (js/crud.js)
   Responsibilities: Creating, editing, deleting activities, sights, runs, transport, and stays
   ========================================================================== */

function deleteLeg(idx) {
  if (typeof triggerHaptic === "function") triggerHaptic("warning");
  if(confirm("Are you sure you want to delete this entire leg and all its days?")) {
    appData.splice(idx, 1);
    saveData(); buildNav(); buildItinerary();
  }
}
function deleteFood(legIdx, foodIdx) { appData[legIdx].cityFood.splice(foodIdx, 1); saveData(); buildItinerary(); }
function deleteRun(legIdx, runIdx) { appData[legIdx].cityRun.splice(runIdx, 1); saveData(); buildItinerary(); }
function deleteSight(legIdx, sightIdx) { appData[legIdx].suggestedSights.splice(sightIdx, 1); saveData(); buildItinerary(); }
async function deleteActivity(legIdx, activityIdx) {
  const leg = appData[legIdx];
  const activity = leg?.suggestedActivities?.[activityIdx];
  if (!leg || !activity) return;

  const activityId = activity.id;

  const isItemMatch = (item) => {
    if (!item) return false;
    if (activityId && item.activityId === activityId) return true;

    const itemText = item.text;
    if (!itemText) return false;
    const cleanItem = getComparisonString(itemText);
    const cleanTitle = getComparisonString(activity.title);
    if (cleanItem === cleanTitle) return true;

    const baseTitle = getComparisonString(activity.title.split(' — ')[0]);
    if (cleanItem === baseTitle) return true;

    const matchTexts = getSuggestedActivityMatchTexts(activity).map(t => getComparisonString(t));
    if (matchTexts.includes(cleanItem)) return true;

    // Check base parts of the itemText by splitting on separators
    const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];
    for (const sep of separators) {
      if (itemText.includes(sep)) {
        const baseItem = getComparisonString(itemText.split(sep)[0]);
        if (baseItem === cleanTitle || baseItem === baseTitle || matchTexts.includes(baseItem)) {
          return true;
        }
      }
    }

    return false;
  };

  // Scan and clean matching items from all days on this leg (clears legacy duplicate leftovers)
  if (Array.isArray(leg.days)) {
    leg.days.forEach(day => {
      if (day && Array.isArray(day.activityItems)) {
        day.activityItems = day.activityItems.filter(item => {
          if (isItemMatch(item)) return false;
          return true;
        });
      }
    });
  }

  leg.suggestedActivities.splice(activityIdx, 1);
  invalidateSuggestedActivityIndex(legIdx);
  await saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
  else buildItinerary();
}
function deleteLegTip(legIdx, tipIdx) { if (typeof triggerHaptic === "function") triggerHaptic("warning"); appData[legIdx].legTips.splice(tipIdx, 1); saveData(); buildItinerary(); }


function deleteDayItem(legIdx, dayIdx, category, itemIdx) {
  const itemText = appData[legIdx].days[dayIdx][category][itemIdx].text;
  if (category === 'activityItems') {
    const poolActivity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText);
    if (poolActivity) {
      poolActivity.assignedDayIdx = null;
      invalidateSuggestedActivityIndex(legIdx);
    }
    const poolSight = (appData[legIdx].suggestedSights || []).find(s => s.title === itemText && s.assignedDayIdx === dayIdx);
    if (poolSight) poolSight.assignedDayIdx = null;
    const poolRun = (appData[legIdx].cityRun || []).find(s => s.title === itemText && s.assignedDayIdx === dayIdx);
    if (poolRun) poolRun.assignedDayIdx = null;
  }
  appData[legIdx].days[dayIdx][category].splice(itemIdx, 1);
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
  else buildItinerary();
}

function addFood(legIdx) {
  // Create modal for adding new food item
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content modal-sm">
      <div class="modal-header">
        <h2>🍽️ Add Food Item</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ai-form-group">
          <label>Food Item</label>
          <input type="text" id="foodName" class="form-control form-control--compact" placeholder="e.g., Try local pizza">
        </div>
        <div class="ai-form-group">
          <label>Estimated Cost ($)</label>
          <input type="text" id="foodCost" class="form-control form-control--compact" placeholder="0" value="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="action-btn action-btn-secondary" id="saveFoodBtn">Save Food Item</button>
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


function addRun(legIdx) { appData[legIdx].cityRun.push({ title: "New run...", estTime: "1 hr", estCost: "0", assignedDayIdx: null }); saveData(); buildItinerary(); }
function addSight(legIdx) { appData[legIdx].suggestedSights.push({ title: "New sight...", estTime: "1 hr", estCost: "0", assignedDayIdx: null }); saveData(); buildItinerary(); }
function addLegTip(legIdx) { appData[legIdx].legTips.push("New tip..."); saveData(); buildItinerary(); }

function addDayItem(legIdx, dayIdx, category) {
  if (category === 'activityItems') {
    const day = appData[legIdx].days[dayIdx];
    const dayDate = getNormalizedDayDate(day);

    if (!Array.isArray(appData[legIdx].suggestedActivities)) {
      appData[legIdx].suggestedActivities = [];
    }

    appData[legIdx].suggestedActivities.push({
      title: "New item...",
      category: "sight",
      estTime: "1 hr",
      estCost: "0",
      assignedDayIdx: dayIdx,
      assignedDate: dayDate,
      startDate: dayDate,
      startTime: "",
      endDate: dayDate,
      endTime: "",
      done: false,
      status: "planned"
    });

    appData[legIdx].days[dayIdx][category].push({
      text: "New item...",
      cost: "0",
      time: "1 hr",
      startDate: dayDate,
      startTime: "",
      endDate: dayDate,
      endTime: "",
      done: false,
      status: "planned"
    });
  }
  else if (category === 'transportItems' || category === 'accomItems') { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", status: "pending", bookingRef: "", done: false }); }
  else { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", done: false }); }
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
  else buildItinerary();
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
    if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
    else buildItinerary();
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

function addDayNote(legIdx, dayIdx) {
  if (!appData || !appData[legIdx]?.days?.[dayIdx]) return;
  appData[legIdx].days[dayIdx].notes = 'Note: ';
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') {
    rebuildItineraryPreservingScroll();
  } else if (typeof buildItinerary === 'function') {
    buildItinerary();
  }
  setTimeout(() => {
    if (typeof focusCompactInlineEditable === 'function') {
      focusCompactInlineEditable(`#day-note-text-${legIdx}-${dayIdx}`);
    }
  }, 60);
}

function updateDayNote(legIdx, dayIdx, val) {
  if (!appData || !appData[legIdx]?.days?.[dayIdx]) return;
  const cleaned = String(val || '').trim();
  if (!cleaned || cleaned === 'Note:') {
    delete appData[legIdx].days[dayIdx].notes;
  } else {
    appData[legIdx].days[dayIdx].notes = cleaned;
  }
  saveData();
}

function deleteDayNote(legIdx, dayIdx) {
  if (!appData || !appData[legIdx]?.days?.[dayIdx]) return;
  delete appData[legIdx].days[dayIdx].notes;
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') {
    rebuildItineraryPreservingScroll();
  } else if (typeof buildItinerary === 'function') {
    buildItinerary();
  }
}


function updateDayItemText(legIdx, dayIdx, category, itemIdx, text, fromTabs = false) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  const previousText = item.text;
  
  let newText = text;
  if (category === 'activityItems') {
    const split = typeof _splitActivityTitle === 'function' ? _splitActivityTitle(previousText) : { title: previousText, location: '' };
    if (split.location && !text.includes(' — ')) {
      newText = `${text} — ${split.location}`;
    }
  }
  
  item.text = newText;
  if (category === 'activityItems') {
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'title', newText, item.activityId);
  }
  saveData();
  if(!fromTabs) {
    if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll({ focusText: newText });
    else buildItinerary();
  }
}
function updateDayItemCost(legIdx, dayIdx, category, itemIdx, cost, fromTabs = false) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  const previousText = item.text;
  item.cost = cost;
  if (category === 'activityItems') {
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'estCost', cost, item.activityId);
  }
  saveData();
  if(fromTabs) {
    if(category === 'transportItems') buildTransportTab();
    if(category === 'accomItems') buildAccomTab();
  }
  else if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll({ focusText: previousText });
  else buildItinerary();
}
function updateDayItemTime(legIdx, dayIdx, category, itemIdx, time) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  const previousText = item.text;
  item.time = time;
  if (category === 'activityItems') {
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'estTime', time, item.activityId);
  }
  saveData();
}


function findTimelineItemByText(text, root = document) {
  const needle = String(text || '').trim().toLowerCase();
  if (!needle) return null;
  return Array.from(root.querySelectorAll('.daily-timeline-item')).find(item => item.textContent.toLowerCase().includes(needle)) || null;
}

function rebuildItineraryPreservingScroll(options = {}) {
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  if (typeof captureMobilePagerStates === 'function') captureMobilePagerStates(document.getElementById('itinerary') || document);
  if (typeof captureCompactDayPagerStates === 'function') captureCompactDayPagerStates(document.getElementById('itinerary') || document);
  if (typeof buildItinerary === 'function') buildItinerary();
  const finishScroll = () => {
    if (typeof restoreCompactDayPagerScrollPositions === 'function') {
      restoreCompactDayPagerScrollPositions(document.getElementById('itinerary') || document);
    }
    const focusItem = findTimelineItemByText(options.focusText);
    if (focusItem && focusItem.offsetParent !== null && typeof focusItem.scrollIntoView === 'function') {
      focusItem.scrollIntoView({ block: 'center', inline: 'nearest' });
      focusItem.classList.add('is-schedule-focus');
      setTimeout(() => focusItem.classList.remove('is-schedule-focus'), 1200);
    } else if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(scrollX, scrollY);
    }
  };
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(finishScroll);
  } else {
    finishScroll();
  }
}

function toggleFoodCompleted(e, legIdx, foodIdx) { e.stopPropagation(); if (typeof triggerHaptic === "function") triggerHaptic("success"); appData[legIdx].cityFood[foodIdx].done = e.target.checked; saveData(); rebuildItineraryPreservingScroll(); }
function toggleDayCompleted(e, legIdx, dayIdx) { e.stopPropagation(); if (typeof triggerHaptic === "function") triggerHaptic("success"); appData[legIdx].days[dayIdx].completed = e.target.checked; saveData(); rebuildItineraryPreservingScroll(); }
function toggleActivityCompleted(e, legIdx, dayIdx, itemIdx) {
  e.stopPropagation();
  if (typeof triggerHaptic === "function") triggerHaptic("success");
  const item = appData[legIdx].days[dayIdx].activityItems[itemIdx];
  item.done = e.target.checked;
  syncAssignedSuggestedActivityField(legIdx, dayIdx, item.text, 'done', item.done);
  saveData();
  rebuildItineraryPreservingScroll();
}
function toggleJourneyCompleted(e, journeyId) {
  e.stopPropagation();
  const targetId = String(journeyId);
  const matches = (window.journeys || []).filter(j => String(j.id) === targetId || String(j.journeyId || '') === targetId);
  if (matches.length > 0) {
    matches.forEach(journey => {
      journey.done = e.target.checked;
    });
    saveData();
    rebuildItineraryPreservingScroll();
  }
}
function toggleStayCompleted(e, stayId) {
  e.stopPropagation();
  const targetId = String(stayId);
  const stay = (window.stays || []).find(s => String(s.id) === targetId);
  if (stay) {
    stay.done = e.target.checked;
    saveData();
    rebuildItineraryPreservingScroll();
  }
}


function parse24HourTo12HourParts(timeStr) {
  if (!timeStr) return { hour: '12', minute: '00', ampm: 'AM' };
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  
  let minNum = parseInt(m, 10);
  minNum = Math.round(minNum / 15) * 15;
  if (minNum >= 60) {
    minNum = 45;
  }
  const roundedMinStr = String(minNum).padStart(2, '0');

  let ampm = 'AM';
  if (h >= 12) {
    ampm = 'PM';
    if (h > 12) h -= 12;
  } else if (h === 0) {
    h = 12;
  }
  const hourStr = String(h).padStart(2, '0');
  return { hour: hourStr, minute: roundedMinStr, ampm };
}

function get24HourTimeFrom12HourParts(hour, minute, ampm) {
  if (!hour || !minute || !ampm) return '';
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const hourStr = String(h).padStart(2, '0');
  return `${hourStr}:${minute}`;
}

function toggleActivityStatus(e, legIdx, dayIdx, itemIdx) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const item = appData[legIdx]?.days?.[dayIdx]?.activityItems?.[itemIdx];
  if (!item) return;
  const states = ['planned', 'booked', 'confirmed', 'cancelled'];
  const currentStatus = item.status || 'planned';
  const currentIdx = states.indexOf(currentStatus);
  const nextStatus = states[(currentIdx + 1) % states.length];
  item.status = nextStatus;
  
  syncAssignedSuggestedActivityField(legIdx, dayIdx, item.text, 'status', nextStatus);
  
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') {
    rebuildItineraryPreservingScroll();
  } else {
    buildItinerary();
  }
}

function toggleSuggestedActivityStatus(e, legIdx, activityIdx) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const target = appData[legIdx]?.suggestedActivities?.[activityIdx];
  if (!target) return;
  const states = ['planned', 'booked', 'confirmed', 'cancelled'];
  const currentStatus = target.status || 'planned';
  const currentIdx = states.indexOf(currentStatus);
  const nextStatus = states[(currentIdx + 1) % states.length];
  target.status = nextStatus;
  
  if (target.assignedDayIdx !== null && target.assignedDayIdx !== undefined) {
    const day = appData[legIdx]?.days?.[target.assignedDayIdx];
    const previousMatchTexts = getSuggestedActivityMatchTexts(target);
    if (day?.activityItems?.length) {
      day.activityItems.forEach(item => {
        if (previousMatchTexts.includes(String(item.text || '').trim())) {
          item.status = nextStatus;
        }
      });
    }
  }
  
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') {
    rebuildItineraryPreservingScroll();
  } else {
    buildItinerary();
  }
}


// ============================================================================
// Module Loader Bridge for Node / Test Sandboxes
// ============================================================================
if (typeof require !== 'undefined') {
  try {
    const _le = require('./leg-engine.js');
    const _ld = require('./leg-dialog.js');
    const _as = require('./activity-scheduler.js');
    const _am = require('./activity-modal.js');
    const _st = require('./stays.js');
    if (typeof window !== 'undefined') {
      Object.assign(window, _le, _ld, _as, _am, _st);
    }
  } catch (e) {
    // Silently continue if loaded in a mock/vm context where relative require is not set
  }
}

// Global & CommonJS Export Bridge
const _crudCoreExports = {
  deleteLeg,
  deleteFood,
  deleteRun,
  deleteSight,
  deleteLegTip,
  deleteActivity,
  deleteDayItem,
  addFood,
  addRun,
  addSight,
  addLegTip,
  addDayItem,
  addLeg,
  toggleBookingStatus,
  updateBookingRef,
  updateFoodText,
  updateRunPool,
  updateSightPool,
  updateLegTip,
  addDayNote,
  updateDayNote,
  deleteDayNote,
  updateDayItemText,
  updateDayItemCost,
  updateDayItemTime,
  findTimelineItemByText,
  rebuildItineraryPreservingScroll,
  toggleFoodCompleted,
  toggleDayCompleted,
  toggleActivityCompleted,
  toggleJourneyCompleted,
  toggleStayCompleted,
  parse24HourTo12HourParts,
  get24HourTimeFrom12HourParts,
  toggleActivityStatus,
  toggleSuggestedActivityStatus
};

if (typeof window !== 'undefined') {
  Object.assign(window, _crudCoreExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _crudCoreExports;
}
