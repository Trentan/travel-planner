function deleteLeg(idx) {
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

  // If scheduled on a day, remove matching day activity row as well.
  const assignedDayIdx = activity.assignedDayIdx;
  if (assignedDayIdx !== null && assignedDayIdx !== undefined && leg.days?.[assignedDayIdx]) {
    const day = leg.days[assignedDayIdx];
    if (Array.isArray(day.activityItems)) {
      const matchTexts = typeof getSuggestedActivityMatchTexts === 'function'
        ? getSuggestedActivityMatchTexts(activity).map(t => String(t || '').trim())
        : [String(activity.title || '').trim()];
      const matchSet = new Set(matchTexts.filter(Boolean));
      day.activityItems = day.activityItems.filter(item => !matchSet.has(String(item?.text || '').trim()));
    }
  }

  leg.suggestedActivities.splice(activityIdx, 1);
  await saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
  else buildItinerary();
}
function deleteLegTip(legIdx, tipIdx) { appData[legIdx].legTips.splice(tipIdx, 1); saveData(); buildItinerary(); }

function getSuggestedActivityDayText(activity) {
  const title = String(activity?.title || '').trim();
  const emoji = typeof getActivityEmoji === 'function' ? getActivityEmoji(activity?.category) : '';
  if (!emoji || !title) return title;
  return title.startsWith(emoji) ? title : `${emoji} ${title}`;
}

function getSuggestedActivityMatchTexts(activity) {
  return [...new Set([
    String(activity?.title || '').trim(),
    getSuggestedActivityDayText(activity)
  ].filter(Boolean))];
}

function findAssignedSuggestedActivity(legIdx, dayIdx, itemText) {
  const activities = appData[legIdx]?.suggestedActivities || [];
  const cleanItem = String(itemText || '').trim().toLowerCase();
  if (!cleanItem) return null;

  const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
  const cleanItemNoEmoji = cleanItem.replace(emojiPattern, '').trim();

  return activities.find(activity => {
    if (!activity) return false;
    
    // Must match the assigned day
    if (activity.assignedDayIdx !== dayIdx) return false;

    const cleanTitle = String(activity.title || '').trim().toLowerCase();
    if (cleanItem === cleanTitle) return true;

    const cleanTitleNoEmoji = cleanTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === cleanTitleNoEmoji) return true;

    // Split on first separator to get the base title
    const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];
    let baseTitle = cleanTitle;
    for (const separator of separators) {
      const idx = cleanTitle.indexOf(separator);
      if (idx !== -1) {
        baseTitle = cleanTitle.slice(0, idx).trim();
        break;
      }
    }
    
    const baseTitleNoEmoji = baseTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === baseTitleNoEmoji) return true;

    if (typeof getSuggestedActivityMatchTexts === 'function') {
      const matchTexts = getSuggestedActivityMatchTexts(activity).map(t => String(t).trim().toLowerCase());
      if (matchTexts.includes(cleanItem)) return true;
      const matchTextsNoEmoji = matchTexts.map(t => t.replace(emojiPattern, '').trim());
      if (matchTextsNoEmoji.includes(cleanItemNoEmoji)) return true;
    }

    return false;
  }) || null;
}

function syncAssignedSuggestedActivityField(legIdx, dayIdx, itemText, field, value) {
  const activity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText);
  if (!activity) return;
  activity[field] = value;
}

function getNormalizedDayDate(day) {
  if (!day) return '';
  return typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(day.date || '') : (day.date || '');
}

function applyActivityScheduleFields(target, day, schedule = {}) {
  if (!target) return;
  const dayDate = getNormalizedDayDate(day);
  const startTime = String(schedule.startTime || '').trim();
  const endTime = String(schedule.endTime || '').trim();
  target.startDate = schedule.startDate || dayDate;
  target.startTime = startTime;
  target.endDate = schedule.endDate || target.startDate || dayDate;
  target.endTime = endTime;
}

function clearActivityScheduleFields(target, day) {
  if (!target) return;
  const dayDate = getNormalizedDayDate(day);
  target.startDate = dayDate;
  target.startTime = '';
  target.endDate = dayDate;
  target.endTime = '';
}

function syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, itemText, schedule = {}) {
  const activity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText);
  if (!activity) return;
  activity.assignedDayIdx = dayIdx;
  activity.assignedDate = schedule.startDate || getNormalizedDayDate(appData[legIdx]?.days?.[dayIdx]);
  applyActivityScheduleFields(activity, appData[legIdx]?.days?.[dayIdx], schedule);
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

function _splitActivityTitle(title) {
  const raw = (title || '').trim();
  if (!raw) return { title: '', location: '' };
  const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];
  for (const separator of separators) {
    const separatorIdx = raw.indexOf(separator);
    if (separatorIdx !== -1) {
      return {
        title: raw.slice(0, separatorIdx).trim(),
        location: raw.slice(separatorIdx + separator.length).trim()
      };
    }
  }
  return { title: raw, location: '' };
}

function openActivityModalUnified(legIdx, activityIdx = null) {
  const isEditing = activityIdx !== null && activityIdx !== undefined;
  const leg = appData[legIdx];
  if (!leg) return;
  const activity = isEditing ? leg?.suggestedActivities?.[activityIdx] : null;
  if (isEditing && !activity) return;

  const existingModal = document.getElementById('activity-assign-modal');
  if (existingModal) existingModal.remove();
  const existingModalActivity = document.getElementById('activity-modal');
  if (existingModalActivity) existingModalActivity.remove();

  const html = typeof escapeHtmlText === 'function' ? escapeHtmlText : (value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;'));
  const defaults = _splitActivityTitle(activity?.title || '');

  const currentDayLabel = activity && activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined && leg.days[activity.assignedDayIdx]
    ? `Day ${leg.days[activity.assignedDayIdx].day} ${leg.days[activity.assignedDayIdx].date}`
    : 'Unassigned';
  const hasCurrentAssignment = activity && activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined;

  let preferredStart = activity?.startTime || '';
  let preferredEnd = activity?.endTime || '';
  let preferredMode = 'suggested';
  if (isEditing && activity) {
    const assignedItem = getAssignedSuggestedActivityDayItem(legIdx, activityIdx);
    if (assignedItem) {
      preferredStart = assignedItem.startTime || activity.startTime || '';
      preferredEnd = assignedItem.endTime || activity.endTime || '';
      preferredMode = preferredStart || preferredEnd ? 'scheduled' : 'suggested';
    } else if (activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined) {
      preferredMode = 'anytime';
    }
  }

  const daySuggestions = leg.days.map(day => {
    const activityLike = {
      title: activity?.title || 'New item...',
      category: activity?.category || 'sight',
      estTime: activity?.estTime || '1 hr',
      estCost: activity?.estCost || '0'
    };
    return suggestActivityTimeForDay(leg, day, activityLike);
  });

  const dayButtons = leg.days.map((day, dayIdx) => {
    const isCurrent = activity && activity.assignedDayIdx === dayIdx;
    const suggestion = daySuggestions[dayIdx];
    const plannedCount = Array.isArray(day.activityItems)
      ? day.activityItems.filter(item => !isPlaceholderActivityItem(item)).length
      : 0;
    const dateLabel = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
    const dayLabel = `Day ${day.day || dayIdx + 1} ${dateLabel || ''}`;
    const routeLabel = day.from === day.to ? day.to : `${day.from || ''} -> ${day.to || ''}`;
    const desc = String(day.desc || '').trim();
    return `
      <button type="button" class="activity-assign-day ${isCurrent ? 'is-current' : ''}" data-day-index="${dayIdx}" data-suggest-start="${html(suggestion.startTime)}" data-suggest-end="${html(suggestion.endTime)}" data-suggest-available="${suggestion.available ? 'true' : 'false'}" aria-pressed="${isCurrent ? 'true' : 'false'}">
        <span class="activity-assign-day-main">
          <span class="activity-assign-day-date">${html(dayLabel)}</span>
          <span class="activity-assign-day-route">${html(routeLabel)}</span>
        </span>
        ${desc ? `<span class="activity-assign-day-desc">${html(desc)}</span>` : ''}
        <span class="activity-assign-day-meta">${isCurrent ? 'Current day' : `${plannedCount} planned activit${plannedCount === 1 ? 'y' : 'ies'}`}</span>
        <span class="activity-assign-day-suggestion ${suggestion.available ? '' : 'is-empty'}">${suggestion.available ? `Suggested ${html(suggestion.label)} · ${html(suggestion.reason)}` : html(suggestion.reason)}</span>
      </button>
    `;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'activity-assign-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';

  modal.innerHTML = `
    <div class="modal-content activity-assign-modal modal-lg">
      <div class="modal-header">
        <h2>${isEditing ? '✎ Edit & Schedule Activity' : '➕ Add & Schedule Activity'}</h2>
        <button class="modal-close" type="button" id="activityAssignCloseBtn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="activity-assign-layout">
          <!-- Left Panel -->
          <div class="activity-assign-summary activity-assign-summary-layout">
            <div class="activity-assign-grid activity-assign-grid-split">
              <div class="ai-form-group">
                <label>Category</label>
                <select id="activityCategory" class="form-control form-control--compact">
                  <option value="fitness" ${activity?.category === 'fitness' ? 'selected' : ''}>🏃 Fitness</option>
                  <option value="sight" ${!activity || activity.category === 'sight' ? 'selected' : ''}>🏛️ Sight</option>
                  <option value="attraction" ${activity?.category === 'attraction' ? 'selected' : ''}>🎢 Attraction</option>
                  <option value="wellness" ${activity?.category === 'wellness' ? 'selected' : ''}>🧘 Wellness</option>
                  <option value="food" ${activity?.category === 'food' ? 'selected' : ''}>🍽️ Food</option>
                  <option value="tour" ${activity?.category === 'tour' ? 'selected' : ''}>🚌 Tour</option>
                </select>
              </div>
              <div class="ai-form-group">
                <label>Description</label>
                <input type="text" id="activityTitle" class="form-control form-control--compact" placeholder="e.g., Morning yoga" value="${html(defaults.title || activity?.title || '')}">
              </div>
            </div>

            <div class="activity-assign-grid activity-assign-grid-equal">
              <div class="ai-form-group">
                <label>Location</label>
                <input type="text" id="activityLocation" class="form-control form-control--compact" placeholder="e.g., Central Park" value="${html(activity?.location || defaults.location || '')}">
              </div>
              <div class="ai-form-group">
                <label>Notes</label>
                <input type="text" id="activityNotes" class="form-control form-control--compact" placeholder="e.g., Book in advance" value="${html(activity?.notes || '')}">
              </div>
            </div>

            <div class="activity-assign-grid activity-assign-grid-equal">
              <div class="ai-form-group">
                <label>Estimated Time</label>
                <input type="text" id="activityTime" class="form-control form-control--compact" placeholder="e.g., 1 hr" value="${html(activity?.estTime || '1 hr')}">
              </div>
              <div class="ai-form-group">
                <label>Estimated Cost ($)</label>
                <input type="text" id="activityCost" class="form-control form-control--compact" placeholder="0" value="${html(activity?.estCost || '0')}">
              </div>
            </div>

            <!-- Schedule Preferences -->
            <div class="activity-assign-schedule activity-assign-schedule-layout">
              <div class="activity-assign-schedule-title">Schedule preference</div>
              <div class="activity-assign-mode">
                <label>
                  <input type="radio" name="activityAssignScheduleMode" value="anytime" ${preferredMode === 'anytime' ? 'checked' : ''}>
                  <span>Anytime</span>
                </label>
                <label>
                  <input type="radio" name="activityAssignScheduleMode" value="suggested" ${preferredMode === 'suggested' ? 'checked' : ''}>
                  <span>Suggested</span>
                </label>
                <label>
                  <input type="radio" name="activityAssignScheduleMode" value="scheduled" ${preferredMode === 'scheduled' ? 'checked' : ''}>
                  <span>Fixed time</span>
                </label>
              </div>
              <div class="activity-assign-time-row">
                <label>Start <input type="time" id="activityAssignStartTime" value="${html(preferredStart)}"></label>
                <label>End <input type="time" id="activityAssignEndTime" value="${html(preferredEnd)}"></label>
              </div>
              <div class="activity-assign-schedule-hint activity-assign-schedule-hint-text">Suggested uses each day's best open slot. Fixed time calculates the end from duration when left blank.</div>
            </div>

            <!-- Assignment Info & Remove Button -->
            <div class="activity-assign-current-wrap">
              <div class="activity-assign-current">Current assignment: <strong>${html(currentDayLabel)}</strong></div>
              ${hasCurrentAssignment ? `<button type="button" class="action-btn activity-assign-clear activity-assign-clear-spaced" id="activityAssignClearBtn">Move to Suggested Pool (Unassign)</button>` : ''}
            </div>
          </div>

          <!-- Right Panel: Choose Day -->
          <div class="activity-assign-days-wrap">
            <div class="activity-assign-schedule-title activity-assign-days-title">Allocate to Day</div>
            <div class="activity-assign-days activity-assign-days-scroll" aria-label="Choose a day">
              ${dayButtons}
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer activity-assign-footer">
        <div>
          ${isEditing ? `<button class="action-btn activity-assign-delete-btn" id="activityAssignDeleteBtn">Delete</button>` : ''}
        </div>
        <div class="activity-assign-footer-actions">
          <button class="action-btn" type="button" id="activityAssignCancelBtn">Cancel</button>
          <button class="action-btn action-btn-secondary activity-assign-save-btn" id="saveActivityBtn">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('activityAssignCloseBtn').onclick = closeModal;
  document.getElementById('activityAssignCancelBtn').onclick = closeModal;

  const modeInputs = Array.from(modal.querySelectorAll('input[name="activityAssignScheduleMode"]'));
  const startInput = document.getElementById('activityAssignStartTime');
  const endInput = document.getElementById('activityAssignEndTime');

  const getScheduleOptions = (button = null) => {
    const selectedMode = modeInputs.find(input => input.checked)?.value || 'suggested';
    const scheduleMode = ['scheduled', 'suggested'].includes(selectedMode) ? selectedMode : 'anytime';
    const suggestedStartTime = button?.getAttribute('data-suggest-start') || '';
    const suggestedEndTime = button?.getAttribute('data-suggest-end') || '';
    return {
      scheduleMode,
      startTime: startInput?.value || '',
      endTime: endInput?.value || '',
      suggestedStartTime,
      suggestedEndTime
    };
  };

  const syncScheduleControls = () => {
    const scheduled = modeInputs.find(input => input.checked)?.value === 'scheduled';
    if (startInput) startInput.disabled = !scheduled;
    if (endInput) endInput.disabled = !scheduled;
  };

  modeInputs.forEach(input => input.addEventListener('change', syncScheduleControls));

  if (startInput) {
    startInput.addEventListener('input', () => {
      const scheduledInput = modeInputs.find(input => input.value === 'scheduled');
      if (scheduledInput) scheduledInput.checked = true;
      syncScheduleControls();
      if (startInput.value && endInput) {
        const durationText = document.getElementById('activityTime').value.trim() || '1 hr';
        endInput.value = addMinutesToTimeValue(startInput.value, parseActivityDurationMinutes(durationText)) || '';
      }
    });
  }

  syncScheduleControls();

  const getFormData = () => {
    const category = document.getElementById('activityCategory').value;
    const title = document.getElementById('activityTitle').value.trim();
    const location = document.getElementById('activityLocation').value.trim();
    const estTime = document.getElementById('activityTime').value.trim() || '1 hr';
    const estCost = document.getElementById('activityCost').value.trim() || '0';
    const notes = document.getElementById('activityNotes').value.trim();
    if (!title) {
      alert('Please enter a description');
      return null;
    }
    const fullTitle = location ? `${title} — ${location}` : title;
    return { category, title: fullTitle, estTime, estCost, notes, location };
  };

  modal.querySelectorAll('[data-day-index]').forEach(button => {
    button.addEventListener('click', () => {
      const targetDayIdx = Number(button.getAttribute('data-day-index'));
      if (!Number.isFinite(targetDayIdx)) return;

      const formData = getFormData();
      if (!formData) return;

      let targetIdx = activityIdx;
      if (!isEditing) {
        if (!Array.isArray(leg.suggestedActivities)) {
          leg.suggestedActivities = [];
        }
        leg.suggestedActivities.push({
          ...formData,
          assignedDayIdx: null,
          assignedDate: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: ''
        });
        targetIdx = leg.suggestedActivities.length - 1;
      } else {
        const target = leg.suggestedActivities[activityIdx];
        target.category = formData.category;
        target.title = formData.title;
        target.estTime = formData.estTime;
        target.estCost = formData.estCost;
        target.notes = formData.notes;
        target.location = formData.location;
      }

      const assigned = assignSuggestedActivityToDay(legIdx, targetIdx, legIdx, targetDayIdx, getScheduleOptions(button));
      if (!assigned) return;

      saveData();
      if (typeof rebuildItineraryPreservingScroll === 'function') {
        rebuildItineraryPreservingScroll({ focusText: formData.title });
      } else {
        buildItinerary();
      }
      closeModal();
    });
  });

  const clearButton = document.getElementById('activityAssignClearBtn');
  if (clearButton) {
    clearButton.onclick = () => {
      const formData = getFormData();
      if (!formData) return;

      const target = leg.suggestedActivities[activityIdx];
      target.category = formData.category;
      target.title = formData.title;
      target.estTime = formData.estTime;
      target.estCost = formData.estCost;
      target.notes = formData.notes;
      target.location = formData.location;

      const cleared = clearAssignedSuggestedActivityFromDay(legIdx, activityIdx);
      if (!cleared) return;

      saveData();
      if (typeof rebuildItineraryPreservingScroll === 'function') {
        rebuildItineraryPreservingScroll({ focusText: formData.title });
      } else {
        buildItinerary();
      }
      closeModal();
    };
  }

  document.getElementById('saveActivityBtn').onclick = () => {
    const formData = getFormData();
    if (!formData) return;

    if (!isEditing) {
      if (!Array.isArray(leg.suggestedActivities)) {
        leg.suggestedActivities = [];
      }
      leg.suggestedActivities.push({
        ...formData,
        assignedDayIdx: null,
        assignedDate: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
      });
    } else {
      const target = leg.suggestedActivities[activityIdx];
      const previousMatchTexts = getSuggestedActivityMatchTexts(target);

      target.category = formData.category;
      target.title = formData.title;
      target.estTime = formData.estTime;
      target.estCost = formData.estCost;
      target.notes = formData.notes;
      target.location = formData.location;

      if (target.assignedDayIdx !== null && target.assignedDayIdx !== undefined) {
        const day = leg.days[target.assignedDayIdx];
        const scheduleOpts = getScheduleOptions();
        const schedule = getActivityScheduleFromOptions(target, scheduleOpts);
        const datedSchedule = {
          ...schedule,
          startDate: getNormalizedDayDate(day),
          endDate: getNormalizedDayDate(day)
        };

        applyActivityScheduleFields(target, day, datedSchedule);
        target.assignedDate = target.startDate || getNormalizedDayDate(day);

        if (day?.activityItems?.length) {
          day.activityItems.forEach(item => {
            if (previousMatchTexts.includes(String(item.text || '').trim())) {
              item.text = getSuggestedActivityDayText(target);
              item.time = formData.estTime;
              item.cost = formData.estCost;
              item.notes = formData.notes;
              item.location = formData.location;
              applyActivityScheduleFields(item, day, datedSchedule);
            }
          });
        }
      } else {
        const scheduleOpts = getScheduleOptions();
        target.startTime = scheduleOpts.startTime;
        target.endTime = scheduleOpts.endTime;
      }
    }

    saveData();
    if (typeof rebuildItineraryPreservingScroll === 'function') {
      rebuildItineraryPreservingScroll({ focusText: formData.title });
    } else {
      buildItinerary();
    }
    closeModal();
  };

  const deleteBtn = document.getElementById('activityAssignDeleteBtn');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (confirm('Are you sure you want to delete this activity?')) {
        deleteActivity(legIdx, activityIdx);
        closeModal();
      }
    };
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
}

function _openActivityModal(legIdx, activityIdx = null) {
  return openActivityModalUnified(legIdx, activityIdx);
}

function addActivity(legIdx) {
  return openActivityModalUnified(legIdx);
}

function openEditActivityModal(legIdx, activityIdx) {
  return openActivityModalUnified(legIdx, activityIdx);
}

function openEditDayActivityModal(legIdx, dayIdx, itemIdx) {
  const day = appData[legIdx]?.days?.[dayIdx];
  const item = day?.activityItems?.[itemIdx];
  if (!item) return;

  const itemText = item.text;
  const suggestedActivities = appData[legIdx]?.suggestedActivities || [];

  function isMatch(activity) {
    if (!activity || !itemText) return false;
    const cleanItem = String(itemText).trim().toLowerCase();
    const cleanTitle = String(activity.title || '').trim().toLowerCase();
    if (cleanItem === cleanTitle) return true;

    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
    const cleanItemNoEmoji = cleanItem.replace(emojiPattern, '').trim();
    const cleanTitleNoEmoji = cleanTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === cleanTitleNoEmoji) return true;

    // Check base title (without location suffix)
    const baseTitle = cleanTitle.split(' — ')[0].trim();
    const baseTitleNoEmoji = baseTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === baseTitleNoEmoji) return true;

    const matchTexts = typeof getSuggestedActivityMatchTexts === 'function'
      ? getSuggestedActivityMatchTexts(activity).map(t => String(t).trim().toLowerCase())
      : [cleanTitle];

    if (matchTexts.includes(cleanItem)) return true;

    const matchTextsNoEmoji = matchTexts.map(t => t.replace(emojiPattern, '').trim());
    if (matchTextsNoEmoji.includes(cleanItemNoEmoji)) return true;

    return false;
  }

  // Phase 1: Try to find a match assigned to this day
  let activityIdx = suggestedActivities.findIndex(activity => (
    activity && activity.assignedDayIdx === dayIdx && isMatch(activity)
  ));

  // Phase 2: Try to find a match assigned to any day or unassigned
  if (activityIdx === -1) {
    activityIdx = suggestedActivities.findIndex(activity => activity && isMatch(activity));
  }

  // Phase 3: Run normalization fallback
  if (activityIdx === -1) {
    if (typeof normalizeTripLegsData === 'function') {
      normalizeTripLegsData(appData);
      saveData(false);
      
      const refreshedActivities = appData[legIdx]?.suggestedActivities || [];
      activityIdx = refreshedActivities.findIndex(activity => (
        activity && activity.assignedDayIdx === dayIdx && isMatch(activity)
      ));
      if (activityIdx === -1) {
        activityIdx = refreshedActivities.findIndex(activity => activity && isMatch(activity));
      }
    }
  }

  if (activityIdx !== undefined && activityIdx !== -1) {
    _openActivityModal(legIdx, activityIdx);
  } else {
    // Phase 4: Auto-create a matching suggested activity entry and open it!
    let category = 'sight';
    const text = String(itemText || '').trim();
    if (/food|restaurant|eat|dinner|lunch|breakfast|cafe/i.test(text)) category = 'food';
    else if (/run|fitness|jog|workout|gym/i.test(text)) category = 'fitness';
    else if (/wellness|yoga|spa|massage/i.test(text)) category = 'wellness';
    else if (/tour|guide|bus/i.test(text)) category = 'tour';
    else if (/attraction|park|ride/i.test(text)) category = 'attraction';

    const split = typeof _splitActivityTitle === 'function' ? _splitActivityTitle(text) : { title: text, location: '' };
    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
    const cleanTitle = split.title.replace(emojiPattern, '').trim();
    const cleanLocation = item.location || split.location || '';
    if (cleanLocation && !item.location) {
      item.location = cleanLocation;
    }

    if (!Array.isArray(appData[legIdx].suggestedActivities)) {
      appData[legIdx].suggestedActivities = [];
    }

    appData[legIdx].suggestedActivities.push({
      title: cleanTitle,
      category: category,
      estTime: item.time || '1 hr',
      estCost: item.cost || '0',
      notes: item.notes || '',
      location: cleanLocation,
      assignedDayIdx: dayIdx,
      assignedDate: day.date || '',
      startDate: item.startDate || day.date || '',
      startTime: item.startTime || '',
      endDate: item.endDate || day.date || '',
      endTime: item.endTime || ''
    });

    saveData(false);
    _openActivityModal(legIdx, appData[legIdx].suggestedActivities.length - 1);
  }
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
      done: false
    });

    appData[legIdx].days[dayIdx][category].push({
      text: "New item...",
      cost: "0",
      time: "1 hr",
      startDate: dayDate,
      startTime: "",
      endDate: dayDate,
      endTime: "",
      done: false
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
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'title', newText);
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
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'estCost', cost);
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
    syncAssignedSuggestedActivityField(legIdx, dayIdx, previousText, 'estTime', time);
  }
  saveData();
}

function updateDayItemScheduleTime(legIdx, dayIdx, category, itemIdx, field, time) {
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  if (!item || !['startTime', 'endTime'].includes(field)) return;
  const day = appData[legIdx].days[dayIdx];
  const previousText = item.text;
  item[field] = time;
  if (category === 'activityItems' && field === 'startTime') {
    const durationMinutes = parseActivityDurationMinutes(item.time || '');
    item.endTime = time ? (item.endTime || addMinutesToTimeValue(time, durationMinutes)) : '';
  }
  if (category === 'activityItems') {
    if (item.startTime || item.endTime) {
      applyActivityScheduleFields(item, day, { startTime: item.startTime || '', endTime: item.endTime || '' });
      syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, previousText, item);
    } else {
      clearActivityScheduleFields(item, day);
      syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, previousText, item);
    }
  }
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll({ focusText: previousText });
  else buildItinerary();
}

function setDayItemScheduleMode(legIdx, dayIdx, category, itemIdx, mode) {
  const item = appData[legIdx]?.days?.[dayIdx]?.[category]?.[itemIdx];
  if (!item || category !== 'activityItems') return;
  const previousText = item.text;
  if (mode === 'anytime') {
    clearActivityScheduleFields(item, appData[legIdx].days[dayIdx]);
  } else if (mode === 'scheduled' && !item.startTime) {
    applyActivityScheduleFields(item, appData[legIdx].days[dayIdx], {
      startTime: '09:00',
      endTime: addMinutesToTimeValue('09:00', parseActivityDurationMinutes(item.time || '')) || ''
    });
  }
  syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, previousText, item);
  saveData();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll({ focusText: previousText });
  else buildItinerary();
}

function escapeScheduleDialogText(value) {
  if (typeof escapeCompactText === 'function') return escapeCompactText(value);
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openDayItemScheduleDialog(legIdx, dayIdx, category, itemIdx) {
  if (category === 'activityItems') {
    return openEditDayActivityModal(legIdx, dayIdx, itemIdx);
  }
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
  buildItinerary();
  requestAnimationFrame(() => {
    if (typeof restoreCompactDayPagerScrollPositions === 'function') {
      restoreCompactDayPagerScrollPositions(document.getElementById('itinerary') || document);
    }
    const focusItem = findTimelineItemByText(options.focusText);
    if (focusItem && focusItem.offsetParent !== null && typeof focusItem.scrollIntoView === 'function') {
      focusItem.scrollIntoView({ block: 'center', inline: 'nearest' });
      focusItem.classList.add('is-schedule-focus');
      setTimeout(() => focusItem.classList.remove('is-schedule-focus'), 1200);
    } else if (typeof window.scrollTo === 'function') {
      window.scrollTo(scrollX, scrollY);
    }
  });
}

function toggleFoodCompleted(e, legIdx, foodIdx) { e.stopPropagation(); appData[legIdx].cityFood[foodIdx].done = e.target.checked; saveData(); rebuildItineraryPreservingScroll(); }
function toggleDayCompleted(e, legIdx, dayIdx) { e.stopPropagation(); appData[legIdx].days[dayIdx].completed = e.target.checked; saveData(); rebuildItineraryPreservingScroll(); }
function toggleActivityCompleted(e, legIdx, dayIdx, itemIdx) {
  e.stopPropagation();
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

function parseActivityDurationMinutes(durationText) {
  const text = String(durationText || '').toLowerCase();
  let minutes = 0;
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/);
  if (hourMatch) minutes += Math.round(Number(hourMatch[1]) * 60);
  if (minuteMatch) minutes += Math.round(Number(minuteMatch[1]));
  if (!minutes) {
    const numericOnly = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
    if (numericOnly) minutes = Math.round(Number(numericOnly[1]) * 60);
  }
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

function addMinutesToTimeValue(timeValue, minutesToAdd) {
  const time = String(timeValue || '').trim();
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  const duration = Number(minutesToAdd) || 0;
  if (!match || duration <= 0) return '';
  const startMinutes = (Number(match[1]) * 60) + Number(match[2]);
  const total = (startMinutes + duration) % (24 * 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeValueToMinutes(timeValue) {
  const match = String(timeValue || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return (hours * 60) + minutes;
}

function minutesToTimeValue(totalMinutes) {
  const minutesNumber = Number(totalMinutes);
  if (!Number.isFinite(minutesNumber)) return '';
  const clamped = Math.max(0, Math.min((24 * 60) - 1, Math.round(minutesNumber)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatScheduleTimeRange(startTime, endTime) {
  return endTime ? `${startTime}-${endTime}` : startTime;
}

function getActivityScheduleFromOptions(activity, options = {}) {
  const scheduleMode = ['scheduled', 'suggested'].includes(options.scheduleMode) ? options.scheduleMode : 'anytime';
  const startTime = scheduleMode === 'scheduled'
    ? String(options.startTime || '').trim()
    : scheduleMode === 'suggested'
      ? String(options.suggestedStartTime || '').trim()
      : '';
  const explicitEndTime = scheduleMode === 'scheduled'
    ? String(options.endTime || '').trim()
    : scheduleMode === 'suggested'
      ? String(options.suggestedEndTime || '').trim()
      : '';
  const durationMinutes = parseActivityDurationMinutes(activity?.estTime || activity?.time || '');
  const endTime = startTime ? (explicitEndTime || addMinutesToTimeValue(startTime, durationMinutes)) : '';
  return { startTime, endTime };
}

function activityLooksLikeMeal(activity, mealPattern) {
  const text = `${activity?.title || activity?.text || ''} ${activity?.category || ''}`.toLowerCase();
  return mealPattern.test(text);
}

function getActivityPreferredWindows(activity) {
  if (activityLooksLikeMeal(activity, /\b(breakfast|coffee|cafe|bakery|brunch)\b/)) return [{ start: 8 * 60, end: 11 * 60, label: 'morning food window' }];
  if (activityLooksLikeMeal(activity, /\b(lunch|restaurant|food|market)\b/)) return [{ start: 12 * 60, end: 14 * 60, label: 'lunch window' }];
  if (activityLooksLikeMeal(activity, /\b(dinner|supper|bar|drinks|night)\b/)) return [{ start: 18 * 60, end: 21 * 60, label: 'evening window' }];
  return [
    { start: 9 * 60, end: 12 * 60, label: 'morning opening' },
    { start: 14 * 60, end: 18 * 60, label: 'afternoon opening' },
    { start: 18 * 60, end: 21 * 60, label: 'evening opening' }
  ];
}

function addBusyInterval(intervals, startTime, endTime, label, fallbackMinutes = 60) {
  let start = timeValueToMinutes(startTime);
  let end = timeValueToMinutes(endTime);
  if (start === null && end === null) return;
  if (start === null && end !== null) start = end - fallbackMinutes;
  if (end === null && start !== null) end = start + fallbackMinutes;
  if (end <= start) end = 24 * 60;
  intervals.push({
    start: Math.max(0, Math.min(24 * 60, start)),
    end: Math.max(0, Math.min(24 * 60, end)),
    label
  });
}

function getDaySchedulingBusyIntervals(leg, day, activity) {
  const intervals = [];
  const matchTexts = getSuggestedActivityMatchTexts(activity);

  (day.activityItems || []).forEach(item => {
    if (!item || !String(item.startTime || item.endTime || '').trim()) return;
    if (matchTexts.includes(String(item.text || '').trim())) return;
    addBusyInterval(intervals, item.startTime, item.endTime, item.text || 'activity', parseActivityDurationMinutes(item.time || '') || 60);
  });

  const dayJourneys = typeof getDayJourneys === 'function'
    ? getDayJourneys(day.date, day.from, day.to, leg.id)
    : [];
  const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
    ? window.journeys
    : (typeof journeys !== 'undefined' && Array.isArray(journeys) ? journeys : []);

  dayJourneys.forEach(journey => {
    const segments = journeysSource
      .filter(seg => (seg.journeyId || seg.id) === (journey.journeyId || journey.id))
      .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    const first = segments[0] || journey;
    const last = segments[segments.length - 1] || journey;
    addBusyInterval(
      intervals,
      first.departureTime || journey.departureTime || '',
      last.arrivalTime || journey.arrivalTime || '',
      journey.journeyName || 'transport',
      90
    );
  });

  if (typeof getStayDisplayForDay === 'function') {
    getStayDisplayForDay(day.date, day.to).forEach(stayInfo => {
      if (!stayInfo?.startTime) return;
      const label = stayInfo.type === 'checkout' ? 'check-out' : stayInfo.type === 'checkin' ? 'check-in' : 'stay';
      addBusyInterval(intervals, stayInfo.startTime, addMinutesToTimeValue(stayInfo.startTime, 30), label, 30);
    });
  }

  return intervals;
}

function mergeBusyIntervals(intervals, dayStart, dayEnd, bufferMinutes = 15) {
  const normalized = intervals
    .map(interval => ({
      start: Math.max(dayStart, interval.start - bufferMinutes),
      end: Math.min(dayEnd, interval.end + bufferMinutes),
      label: interval.label
    }))
    .filter(interval => interval.end > dayStart && interval.start < dayEnd)
    .sort((a, b) => a.start - b.start);

  return normalized.reduce((merged, interval) => {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else {
      last.end = Math.max(last.end, interval.end);
      if (interval.label) last.label = interval.label;
    }
    return merged;
  }, []);
}

function getAvailableGaps(mergedIntervals, dayStart, dayEnd) {
  const gaps = [];
  let cursor = dayStart;
  mergedIntervals.forEach(interval => {
    if (interval.start > cursor) gaps.push({ start: cursor, end: interval.start });
    cursor = Math.max(cursor, interval.end);
  });
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd });
  return gaps;
}

function chooseBestScheduleGap(gaps, durationMinutes, preferredWindows) {
  for (const window of preferredWindows) {
    for (const gap of gaps) {
      const start = Math.max(gap.start, window.start);
      const end = start + durationMinutes;
      if (end <= Math.min(gap.end, window.end)) return { start, end, windowLabel: window.label };
    }
  }

  for (const gap of gaps) {
    const start = gap.start;
    const end = start + durationMinutes;
    if (end <= gap.end) return { start, end, windowLabel: 'open gap' };
  }

  return null;
}

function describeScheduleSuggestion(choice, intervals) {
  if (!choice) return 'No clean slot found';
  const previous = intervals.filter(interval => interval.end <= choice.start).sort((a, b) => b.end - a.end)[0];
  const next = intervals.filter(interval => interval.start >= choice.end).sort((a, b) => a.start - b.start)[0];
  if (previous?.label && next?.label) return `Fits between ${previous.label} and ${next.label}`;
  if (previous?.label) return `Best opening after ${previous.label}`;
  if (next?.label) return `Best opening before ${next.label}`;
  return `Best ${choice.windowLabel}`;
}

function suggestActivityTimeForDay(leg, day, activity) {
  const durationMinutes = parseActivityDurationMinutes(activity?.estTime || activity?.time || '') || 60;
  const dayStart = 8 * 60;
  const dayEnd = 22 * 60;
  const busyIntervals = getDaySchedulingBusyIntervals(leg, day, activity);
  const mergedIntervals = mergeBusyIntervals(busyIntervals, dayStart, dayEnd, 15);
  const gaps = getAvailableGaps(mergedIntervals, dayStart, dayEnd);
  const choice = chooseBestScheduleGap(gaps, durationMinutes, getActivityPreferredWindows(activity));
  if (!choice) {
    return { startTime: '', endTime: '', label: 'No clean slot', reason: 'Keep as Anytime or choose a fixed time', available: false };
  }
  const startTime = minutesToTimeValue(choice.start);
  const endTime = minutesToTimeValue(choice.end);
  return {
    startTime,
    endTime,
    label: formatScheduleTimeRange(startTime, endTime),
    reason: describeScheduleSuggestion(choice, mergedIntervals),
    available: true
  };
}

function getAssignedSuggestedActivityDayItem(sourceLegIdx, activityIdx) {
  const sourceLeg = appData[sourceLegIdx];
  const activity = sourceLeg?.suggestedActivities?.[activityIdx];
  const dayIdx = activity?.assignedDayIdx;
  const day = dayIdx !== null && dayIdx !== undefined ? sourceLeg?.days?.[dayIdx] : null;
  if (!activity || !day || !Array.isArray(day.activityItems)) return null;
  const matchTexts = getSuggestedActivityMatchTexts(activity);
  return day.activityItems.find(item => matchTexts.includes(String(item.text || '').trim())) || null;
}

function assignSuggestedActivityToDay(sourceLegIdx, activityIdx, targetLegIdx, targetDayIdx, options = {}) {
  const sourceLeg = appData[sourceLegIdx];
  const targetLeg = appData[targetLegIdx];
  const activity = sourceLeg?.suggestedActivities?.[activityIdx];
  const targetDay = targetLeg?.days?.[targetDayIdx];
  if (!activity || !targetDay) return false;

  const previousDayIdx = activity.assignedDayIdx;
  if (previousDayIdx !== null && previousDayIdx !== undefined && sourceLegIdx === targetLegIdx && previousDayIdx !== targetDayIdx) {
    const previousDay = targetLeg.days[previousDayIdx];
    if (previousDay && Array.isArray(previousDay.activityItems)) {
      const matchTexts = getSuggestedActivityMatchTexts(activity);
      const prevIndex = previousDay.activityItems.findIndex(item => matchTexts.includes(String(item.text || '').trim()));
      if (prevIndex !== -1) previousDay.activityItems.splice(prevIndex, 1);
    }
  }

  if (!Array.isArray(targetDay.activityItems)) targetDay.activityItems = [];
  if (targetDay.activityItems.length === 1 && isPlaceholderActivityItem(targetDay.activityItems[0])) {
    targetDay.activityItems = [];
  }

  const assignedText = getSuggestedActivityDayText(activity);
  const matchTexts = getSuggestedActivityMatchTexts(activity);
  const schedule = getActivityScheduleFromOptions(activity, options);
  const datedSchedule = {
    ...schedule,
    startDate: getNormalizedDayDate(targetDay),
    endDate: getNormalizedDayDate(targetDay)
  };
  let targetItem = targetDay.activityItems.find(item => matchTexts.includes(String(item.text || '').trim()));
  if (!targetItem) {
    targetItem = {
      text: assignedText,
      cost: activity.estCost || '0',
      time: activity.estTime || '1 hr',
      done: false,
      notes: activity.notes || '',
      location: activity.location || ''
    };
    applyActivityScheduleFields(targetItem, targetDay, datedSchedule);
    targetDay.activityItems.push(targetItem);
  } else {
    targetItem.notes = activity.notes || '';
    targetItem.location = activity.location || '';
    applyActivityScheduleFields(targetItem, targetDay, datedSchedule);
  }

  activity.assignedDayIdx = targetDayIdx;
  activity.assignedDate = datedSchedule.startDate;
  applyActivityScheduleFields(activity, targetDay, datedSchedule);
  return true;
}

function clearAssignedSuggestedActivityFromDay(sourceLegIdx, activityIdx) {
  const sourceLeg = appData[sourceLegIdx];
  const activity = sourceLeg?.suggestedActivities?.[activityIdx];
  if (!activity) return false;

  const previousDayIdx = activity.assignedDayIdx;
  if (previousDayIdx === null || previousDayIdx === undefined) return false;

  const previousDay = sourceLeg?.days?.[previousDayIdx];
  if (previousDay && Array.isArray(previousDay.activityItems)) {
    const matchTexts = getSuggestedActivityMatchTexts(activity);
    const prevIndex = previousDay.activityItems.findIndex(item => matchTexts.includes(String(item.text || '').trim()));
    if (prevIndex !== -1) previousDay.activityItems.splice(prevIndex, 1);
    if (previousDay.activityItems.length === 1 && isPlaceholderActivityItem(previousDay.activityItems[0])) {
      previousDay.activityItems = [];
    }
  }

  activity.assignedDayIdx = null;
  activity.assignedDate = '';
  activity.startDate = '';
  activity.startTime = '';
  activity.endDate = '';
  activity.endTime = '';
  return true;
}

function showActivityAssignFeedback(message) {
  if (!message) return;
  const existing = document.getElementById('activity-assign-feedback');
  if (existing) existing.remove();

  const feedback = document.createElement('div');
  feedback.id = 'activity-assign-feedback';
  feedback.className = 'activity-assign-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => feedback.classList.add('is-visible'), 10);
  setTimeout(() => {
    feedback.classList.remove('is-visible');
    setTimeout(() => feedback.remove(), 220);
  }, 2600);
}

function openActivityAssignModalLegacy(legIdx, activityIdx) {
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
  const hasCurrentAssignment = activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined;
  const assignedItem = getAssignedSuggestedActivityDayItem(legIdx, activityIdx);
  const preferredStart = assignedItem?.startTime || activity.startTime || '';
  const preferredEnd = assignedItem?.endTime || activity.endTime || '';
  const preferredMode = preferredStart || preferredEnd ? 'scheduled' : 'anytime';

  const dayButtons = leg.days.map((day, dayIdx) => {
    const isCurrent = activity.assignedDayIdx === dayIdx;
    return `
      <button type="button" class="action-btn" data-day-index="${dayIdx}" style="width:100%; margin:0; display:flex; flex-direction:column; align-items:flex-start; gap:0.25rem; text-align:left; ${isCurrent ? 'background:#2C3E50; color:white; border-color:#2C3E50;' : ''}">
        <span style="font-weight:700;">Day ${day.day} ${day.date}</span>
        <span style="font-size:0.8rem; opacity:${isCurrent ? '0.85' : '0.75'};">${day.from} → ${day.to}</span>
        <span style="font-size:0.75rem; opacity:${isCurrent ? '0.85' : '0.7'};">${isCurrent ? 'Current day' : 'Tap to add here'}</span>
      </button>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h2>◎ Add to Day</h2>
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
            ${hasCurrentAssignment ? `<button type="button" class="action-btn" id="activityAssignClearBtn" style="margin-top:0.75rem; width:100%; justify-content:center;">Remove from day</button>` : ''}
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
  const clearButton = document.getElementById('activityAssignClearBtn');
  if (clearButton) {
    clearButton.onclick = () => {
      const cleared = clearAssignedSuggestedActivityFromDay(legIdx, activityIdx);
      if (!cleared) return;
      saveData();
      buildItinerary();
      closeModal();
    };
  }
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  const firstButton = modal.querySelector('[data-day-index]');
  if (firstButton) {
    setTimeout(() => firstButton.focus({ preventScroll: true }), 50);
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

function openActivityAssignModal(legIdx, activityIdx) {
  return openActivityModalUnified(legIdx, activityIdx);
}

// Dialog functions for Add New Leg
let legDialogState = { mode: 'add', editLegIdx: null };

function openLegEditorDialog() {
  legDialogState = { mode: 'add', editLegIdx: null };
  openAddLegDialog();
}

function openLegEditorDirect(legIdx) {
  openAddLegDialog();
  const editSelect = document.getElementById('editLegSelect');
  if (editSelect) {
    editSelect.value = legIdx;
    onEditLegSelectionChange();
  }
}

function openAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (modal) {
    _populateAddLegCityDropdowns();
    modal.style.display = 'flex';
    const editSelect = document.getElementById('editLegSelect');
    if (editSelect) {
      editSelect.value = '';
      editSelect.onchange = onEditLegSelectionChange;
    }
    updateLegDialogUiMode();
    onLegTypeChange();
  }
}

function _populateAddLegCityDropdowns() {
  const existingSelect = document.getElementById('existingCitySelect');
  const fromSelect = document.getElementById('fromCitySelect');
  const toSelect = document.getElementById('toCitySelect');
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const editLegSelect = document.getElementById('editLegSelect');

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

  if (editLegSelect) {
    const currentValue = editLegSelect.value;
    const options = ['<option value="">-- Add a new leg --</option>'];
    (appData || []).forEach((leg, idx) => {
      const firstDay = leg?.days?.[0];
      const legDate = firstDay?.date || '';
      const label = `${idx + 1}. ${leg?.label || 'Untitled leg'}${legDate ? ` (${legDate})` : ''}`;
      options.push(`<option value="${idx}">${label}</option>`);
    });
    editLegSelect.innerHTML = options.join('');
    if (currentValue) editLegSelect.value = currentValue;
  }
}

function updateLegDialogUiMode() {
  const title = document.getElementById('legDialogTitle') || document.querySelector('#add-leg-modal .modal-header h2');
  const saveBtn = document.getElementById('legDialogSaveBtn');
  const modeHint = document.getElementById('legDialogModeHint');
  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  if (title) title.textContent = 'Edit Legs';
  if (saveBtn) saveBtn.textContent = isEdit ? 'Confirm Leg Changes' : 'Add Leg';
  if (modeHint) {
    modeHint.textContent = isEdit
      ? 'Editing selected leg. Update details below or delete this leg.'
      : 'Choose a leg to edit it, or leave blank to add a new one.';
  }
  _syncLegDialogActions();
}

function _syncLegDialogActions() {
  const deleteBtn = document.getElementById('legDialogDeleteBtn');
  const recalcBtn = document.getElementById('legDialogRecalcBtn');
  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  if (deleteBtn) deleteBtn.style.display = isEdit ? 'inline-flex' : 'none';
  if (recalcBtn) recalcBtn.style.display = isEdit ? 'inline-flex' : 'none';
}

function recalculateLegFromJourneys() {
  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  if (!isEdit) {
    alert('Choose a leg first, then recalculate from journeys.');
    return;
  }

  const leg = appData?.[legDialogState.editLegIdx];
  if (!leg?.id) {
    alert('Could not find the selected leg.');
    return;
  }

  const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
    ? window.journeys
    : (typeof journeys !== 'undefined' && Array.isArray(journeys) ? journeys : []);
  const linked = journeysSource.filter(j => String(j?.legId || '') === String(leg.id));
  if (!linked.length) {
    alert('No journeys linked to this leg yet.');
    return;
  }

  const toSortable = (val) => {
    if (!val) return '';
    if (typeof normalizeTripDateValue === 'function') {
      const normalized = normalizeTripDateValue(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized || '')) return normalized;
    }
    return String(val);
  };
  const getDepDate = (j) => toSortable(j.departureDate || j.dayDate || '');
  const getArrDate = (j) => toSortable(j.arrivalDate || j.departureDate || j.dayDate || '');
  const getDepTime = (j) => String(j.departureTime || '').padStart(5, '0');
  const getArrTime = (j) => String(j.arrivalTime || '').padStart(5, '0');

  linked.sort((a, b) => {
    const dateCmp = getDepDate(a).localeCompare(getDepDate(b));
    if (dateCmp !== 0) return dateCmp;
    return getDepTime(a).localeCompare(getDepTime(b));
  });

  const first = linked[0];
  const last = [...linked].sort((a, b) => {
    const dateCmp = getArrDate(a).localeCompare(getArrDate(b));
    if (dateCmp !== 0) return dateCmp;
    return getArrTime(a).localeCompare(getArrTime(b));
  }).slice(-1)[0];

  const fromLoc = String(first?.fromLocation || '').trim();
  const toLoc = String(last?.toLocation || '').trim();
  const dateFrom = getDepDate(first);
  const dateTo = getArrDate(last) || dateFrom;
  const looksTravel = !!fromLoc && !!toLoc && fromLoc.toLowerCase() !== toLoc.toLowerCase();

  const legTypeSelect = document.getElementById('legTypeSelect');
  const fromCitySelect = document.getElementById('fromCitySelect');
  const toCitySelect = document.getElementById('toCitySelect');
  const existingCitySelect = document.getElementById('existingCitySelect');
  const startInput = document.getElementById('newLegStartDate');
  const endInput = document.getElementById('newLegEndDate');

  if (legTypeSelect) legTypeSelect.value = looksTravel ? 'travel' : 'city';
  onLegTypeChange();
  if (fromCitySelect && fromLoc) fromCitySelect.value = fromLoc;
  if (toCitySelect && toLoc) toCitySelect.value = toLoc;
  if (existingCitySelect && toLoc) existingCitySelect.value = toLoc;
  if (startInput && dateFrom) startInput.value = dateFrom;
  if (endInput && dateTo) endInput.value = dateTo;
}

function onEditLegSelectionChange() {
  const editSelect = document.getElementById('editLegSelect');
  const selected = Number(editSelect?.value);
  if (!Number.isFinite(selected)) {
    legDialogState = { mode: 'add', editLegIdx: null };
    updateLegDialogUiMode();
    return;
  }
  const leg = appData?.[selected];
  if (!leg) return;
  legDialogState = { mode: 'edit', editLegIdx: selected };

  const firstDay = leg.days?.[0] || {};
  const lastDay = leg.days?.[leg.days.length - 1] || firstDay;
  const normalizedLabel = String(leg.label || '').toLowerCase();
  let legType = 'city';
  if (normalizedLabel.includes('start')) legType = 'start';
  else if (normalizedLabel.includes('return')) legType = 'return';
  else if (firstDay.from && firstDay.to && firstDay.from !== firstDay.to) legType = 'travel';

  const legTypeSelect = document.getElementById('legTypeSelect');
  if (legTypeSelect) legTypeSelect.value = legType;
  const fromCitySelect = document.getElementById('fromCitySelect');
  const toCitySelect = document.getElementById('toCitySelect');
  const existingCitySelect = document.getElementById('existingCitySelect');
  const newCityName = document.getElementById('newLegCityName');
  const dateFrom = document.getElementById('newLegStartDate');
  const dateTo = document.getElementById('newLegEndDate');
  const dayNotesInput = document.getElementById('legDayNotesInput');

  if (fromCitySelect && firstDay.from) fromCitySelect.value = firstDay.from;
  if (toCitySelect && firstDay.to) toCitySelect.value = firstDay.to;
  if (existingCitySelect && firstDay.to) existingCitySelect.value = firstDay.to;
  if (newCityName) newCityName.value = '';
  if (dateFrom) dateFrom.value = firstDay.date || '';
  if (dateTo) dateTo.value = lastDay.date || '';
  if (dayNotesInput) {
    dayNotesInput.value = (leg.days || [])
      .map(day => String(day?.desc || '').trim())
      .join('\n');
  }
  updateLegDialogUiMode();
  onLegTypeChange();
}

function deleteLegFromDialog() {
  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  if (!isEdit) return;
  const legIdx = legDialogState.editLegIdx;
  const legLabel = appData?.[legIdx]?.label || `Leg ${legIdx + 1}`;
  const confirmed = confirm(`Delete ${legLabel} and all its days? This cannot be undone.`);
  if (!confirmed) return;
  deleteLeg(legIdx);
  closeAddLegDialog();
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
  legDialogState = { mode: 'add', editLegIdx: null };

  // Clear form inputs
  const existingCitySelect = document.getElementById('existingCitySelect');
  const newCityName = document.getElementById('newLegCityName');
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const countryOther = document.getElementById('newLegCityCountryOther');
  const fromDate = document.getElementById('newLegStartDate');
  const toDate = document.getElementById('newLegEndDate');
  const editLegSelect = document.getElementById('editLegSelect');
  const dayNotesInput = document.getElementById('legDayNotesInput');

  if (existingCitySelect) existingCitySelect.value = '';
  if (newCityName) newCityName.value = '';
  if (countrySelect) countrySelect.value = '';
  if (countryOther) {
    countryOther.value = '';
    countryOther.style.display = 'none';
  }
  if (fromDate) fromDate.value = '';
  if (toDate) toDate.value = '';
  if (editLegSelect) editLegSelect.value = '';
  if (dayNotesInput) dayNotesInput.value = '';
  updateLegDialogUiMode();
}

function parseLegDayNotes() {
  const raw = document.getElementById('legDayNotesInput')?.value || '';
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function buildLegDaysWithNotes({ dateFrom, dateTo, fromCity, toCity, legType, dayNotes }) {
  const normalizedFrom = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateFrom) : dateFrom;
  const normalizedTo = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateTo) : dateTo;
  const validFrom = /^\d{4}-\d{2}-\d{2}$/.test(normalizedFrom || '');
  const validTo = /^\d{4}-\d{2}-\d{2}$/.test(normalizedTo || '');
  const defaultFirstDesc = legType === 'start' ? 'Departure day' : (legType === 'return' ? 'Return home' : 'Travel and arrival day');
  const defaultOtherDesc = 'Exploring';

  const buildDay = (dateValue, idx) => ({
    date: dateValue,
    day: getWeekdayLabelForTripDate(dateValue),
    from: idx === 0 ? fromCity : toCity,
    to: toCity,
    completed: false,
    desc: dayNotes[idx] || (idx === 0 ? defaultFirstDesc : defaultOtherDesc),
    transportItems: idx === 0 ? [{ text: "Add transport...", cost: "0" }] : [],
    accomItems: [{ text: "Add accommodation...", cost: "0" }],
    activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
  });

  if (validFrom && validTo && normalizedFrom <= normalizedTo) {
    const days = [];
    let current = normalizedFrom;
    let guard = 0;
    while (current && current <= normalizedTo && guard < 120) {
      days.push(buildDay(current, days.length));
      current = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(current, 1) : '';
      guard++;
    }
    if (days.length > 0) return days;
  }

  const firstDate = dateFrom || 'DD Mon';
  const days = [buildDay(firstDate, 0)];
  if (dateTo && dateFrom !== dateTo) {
    days.push(buildDay(dateTo, 1));
  }
  return days;
}

function onLegTypeChange() {
  const type = document.getElementById('legTypeSelect')?.value || 'city';
  const citySection = document.getElementById('citySelectionGroup');
  const routeSection = document.getElementById('routeSelectionGroup');
  const datesLabel = document.getElementById('datesLabel');
  const isRouteType = type === 'travel' || type === 'start' || type === 'return';
  if (citySection) citySection.style.display = type === 'city' ? 'block' : 'none';
  if (routeSection) routeSection.style.display = isRouteType ? 'block' : 'none';
  if (datesLabel) datesLabel.textContent = isRouteType ? 'Journey Date Range' : 'Dates in City';
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
  const dayNotes = parseLegDayNotes();

  // Check for date conflicts
  if (dateFrom && dateTo) {
    const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
    const excludeIdx = isEdit ? legDialogState.editLegIdx : undefined;
    const startConflict = checkDateConflict(dateFrom, excludeIdx);
    if (startConflict) {
      if (!confirm('Warning: Start date conflicts with ' + startConflict.legLabel + '. Do you want to proceed and handle the conflict later?')) {
        return;
      }
    }
  }

  let label, fromCity, toCity;
  if (legType === 'start') {
    label = '🚀 Start';
    fromCity = 'Home';
    toCity = document.getElementById('toCitySelect')?.value || 'Home';
  } else if (legType === 'return') {
    label = '🏠 Return';
    fromCity = document.getElementById('fromCitySelect')?.value || 'Home';
    toCity = 'Home';
  } else if (legType === 'travel') {
    fromCity = document.getElementById('fromCitySelect')?.value || 'Home';
    toCity = document.getElementById('toCitySelect')?.value || '';
    if (!toCity) {
      alert('Please choose a destination city for this travel leg.');
      return;
    }
    label = `✈️ ${fromCity} to ${toCity}`;
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

  const legPayload = {
    id: 'leg_' + Date.now(),
    label: label,
    colour: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
    cityFood: [{ text: "Local dish to try", done: false }],
    cityRun: [{ title: "5km park loop", estTime: "1 hr", estCost: "0", assignedDayIdx: null }],
    suggestedSights: [],
    legTips: ["Add tip..."],
    days: buildLegDaysWithNotes({
      dateFrom,
      dateTo,
      fromCity,
      toCity,
      legType,
      dayNotes
    })
  };

  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  if (isEdit && appData[legDialogState.editLegIdx]) {
    const target = appData[legDialogState.editLegIdx];
    const preservedId = target.id;
    target.label = legPayload.label;
    target.colour = target.colour || legPayload.colour;
    target.days = legPayload.days;
    target.id = preservedId;
  } else {
    appData.push(legPayload);
  }
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
window.updateDayItemScheduleTime = updateDayItemScheduleTime;
window.setDayItemScheduleMode = setDayItemScheduleMode;
window.openDayItemScheduleDialog = openDayItemScheduleDialog;
window.toggleFoodCompleted = toggleFoodCompleted;
window.toggleDayCompleted = toggleDayCompleted;
window.toggleActivityCompleted = toggleActivityCompleted;
window.toggleJourneyCompleted = toggleJourneyCompleted;
window.toggleStayCompleted = toggleStayCompleted;
window.openAddLegDialog = openAddLegDialog;
window.openLegEditorDialog = openLegEditorDialog;
window.openLegEditorDirect = openLegEditorDirect;
window.closeAddLegDialog = closeAddLegDialog;
window.openEditActivityModal = openEditActivityModal;
window.openEditDayActivityModal = openEditDayActivityModal;
window.onLegTypeChange = onLegTypeChange;
window.checkDateConflict = checkDateConflict;
window.adjustLegDays = adjustLegDays;
window.confirmAddLeg = confirmAddLeg;
window.deleteLegFromDialog = deleteLegFromDialog;
window.recalculateLegFromJourneys = recalculateLegFromJourneys;
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
  document.getElementById('stayLocation').value = '';
  document.getElementById('stayCheckIn').value = '';
  document.getElementById('stayCheckInTime').value = '';
  document.getElementById('stayCheckOut').value = '';
  document.getElementById('stayCheckOutTime').value = '';
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
  document.getElementById('stayLocation').value = stay.location || '';
  document.getElementById('stayCheckIn').value = stay.checkIn || '';
  document.getElementById('stayCheckInTime').value = stay.checkInTime || '';
  document.getElementById('stayCheckOut').value = stay.checkOut || '';
  document.getElementById('stayCheckOutTime').value = stay.checkOutTime || '';
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
  const location = document.getElementById('stayLocation').value.trim();
  const checkIn = document.getElementById('stayCheckIn').value;
  const checkInTime = document.getElementById('stayCheckInTime').value;
  const checkOut = document.getElementById('stayCheckOut').value;
  const checkOutTime = document.getElementById('stayCheckOutTime').value;
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
      stay.location = location;
      stay.checkIn = checkIn;
      stay.checkInTime = checkInTime;
      stay.checkOut = checkOut;
      stay.checkOutTime = checkOutTime;
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
      location: location,
      checkIn: checkIn,
      checkInTime: checkInTime,
      checkOut: checkOut,
      checkOutTime: checkOutTime,
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
