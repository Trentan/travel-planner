// ============================================================================
// MODULE: Unified Activity Modal (js/activity-modal.js)
// Form lifecycle, custom category pickers, cost/time inputs, and submit logic.
// ============================================================================

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

function openActivityModalUnified(legIdx, activityIdx = null, options = {}) {
  const isEditing = activityIdx !== null && activityIdx !== undefined && activityIdx !== -1;
  const leg = appData[legIdx];
  if (!leg) return;
  const activity = isEditing ? leg?.suggestedActivities?.[activityIdx] : null;
  if (isEditing && !activity) return;

  window._currentActivityAttachments = (activity?.attachments && Array.isArray(activity.attachments))
    ? [...activity.attachments]
    : [];

  const originalMatchTexts = activity ? getSuggestedActivityMatchTexts(activity) : [];

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
  const titleSource = options.titleOverride !== undefined ? options.titleOverride : activity?.title;
  const defaults = _splitActivityTitle(titleSource || '');

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

  const startParts = parse24HourTo12HourParts(preferredStart);
  const endParts = parse24HourTo12HourParts(preferredEnd);

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

  // Dual timezone display in activity modal
  let dualTimeNoticeHtml = '';
  if (preferredStart && typeof convertLocalToHomeTime === 'function') {
    const localCity = leg.label || '';
    const homeConverted = convertLocalToHomeTime(preferredStart, leg.days[0]?.date || '', localCity);
    if (homeConverted) {
      dualTimeNoticeHtml = `<div class="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center justify-between"><span>Local Venue Time: ${html(preferredStart)}</span> <span>🏠 ${html(homeConverted)}</span></div>`;
    }
  }

  modal.innerHTML = `
    <div class="modal-content activity-assign-modal modal-lg">
      <div class="modal-header">
        <h2>${isEditing ? '✎ Edit & Schedule Activity' : '➕ Add & Schedule Activity'}</h2>
        <button class="modal-close" type="button" id="activityAssignCloseBtn">&times;</button>
      </div>
      <div class="modal-body">
        ${dualTimeNoticeHtml}
        <div class="activity-assign-layout">
          <!-- Left Panel -->
          <div class="activity-assign-summary activity-assign-summary-layout">
            <div class="activity-assign-grid activity-assign-primary-grid">
              <div class="ai-form-group">
                <label>Category</label>
                <select id="activityCategory" class="form-control form-control--compact">
                  <option value="fitness" ${activity?.category === 'fitness' ? 'selected' : ''}>🏃 Fitness</option>
                  <option value="sight" ${!activity || activity.category === 'sight' ? 'selected' : ''}>🏛️ Sight</option>
                  <option value="attraction" ${activity?.category === 'attraction' ? 'selected' : ''}>🎢 Attraction</option>
                  <option value="wellness" ${activity?.category === 'wellness' ? 'selected' : ''}>🧘 Wellness</option>
                  <option value="food" ${activity?.category === 'food' ? 'selected' : ''}>🍽️ Food</option>
                  <option value="tour" ${activity?.category === 'tour' ? 'selected' : ''}>🚌 Tour</option>
                  <option value="event" ${activity?.category === 'event' ? 'selected' : ''}>🗓️ Event</option>
                  <option value="audioTour" ${activity?.category === 'audioTour' ? 'selected' : ''}>🎧 Audio Tour</option>
                </select>
              </div>
              <div class="ai-form-group">
                <label>Status</label>
                <select id="activityStatus" class="form-control form-control--compact">
                  <option value="" ${!activity || !activity.status ? 'selected' : ''}>-- No Status (None) --</option>
                  <option value="planned" ${activity?.status === 'planned' ? 'selected' : ''}>⏳ Planned</option>
                  <option value="booked" ${activity?.status === 'booked' ? 'selected' : ''}>✓ Booked</option>
                  <option value="confirmed" ${activity?.status === 'confirmed' ? 'selected' : ''}>🎫 Confirmed</option>
                  <option value="cancelled" ${activity?.status === 'cancelled' ? 'selected' : ''}>✗ Cancelled</option>
                </select>
              </div>
              <div class="ai-form-group">
                <label>Description</label>
                <input type="text" id="activityTitle" class="form-control form-control--compact" placeholder="e.g., Morning yoga" value="${html(defaults.title || activity?.title || '')}">
              </div>
            </div>

            <div class="activity-assign-grid activity-assign-detail-grid">
              <div class="ai-form-group">
                <label>Location</label>
                <input type="text" id="activityLocation" class="form-control form-control--compact" placeholder="e.g., Central Park" value="${html(activity?.location || defaults.location || '')}">
              </div>
              <div class="ai-form-group">
                <label>Booking Reference</label>
                <input type="text" id="activityBookingRef" class="form-control form-control--compact" placeholder="e.g., ABC123XYZ" value="${html(activity?.bookingRef || '')}">
              </div>
              <div class="ai-form-group">
                <label>Notes</label>
                <input type="text" id="activityNotes" class="form-control form-control--compact" placeholder="e.g., Book in advance" value="${html(activity?.notes || '')}">
              </div>
              <div class="ai-form-group activity-external-link-field">
                <label>External Link / Ref</label>
                <input type="text" id="activityExternalLink" class="form-control form-control--compact" placeholder="URL, app link, invite, or reference" value="${html(activity?.externalLink || activity?.audioRef || activity?.audioUrl || '')}">
              </div>
            </div>

            <div class="activity-assign-grid activity-assign-estimate-grid">
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
                <input type="text" id="activityAssignStartTime" value="${html(preferredStart)}" style="width: 1px; height: 1px; opacity: 0.01; position: absolute; border: 0; padding: 0; z-index: -1; pointer-events: none;">
                <input type="text" id="activityAssignEndTime" value="${html(preferredEnd)}" style="width: 1px; height: 1px; opacity: 0.01; position: absolute; border: 0; padding: 0; z-index: -1; pointer-events: none;">
                <div class="activity-assign-time-group">
                  <span>Start Time</span>
                  <div class="activity-assign-time-selects">
                    <select id="activityStartHour" class="form-control form-control--compact">
                      ${['12','01','02','03','04','05','06','07','08','09','10','11'].map(h => `<option value="${h}" ${startParts.hour === h ? 'selected' : ''}>${h}</option>`).join('')}
                    </select>
                    <select id="activityStartMinute" class="form-control form-control--compact">
                      ${['00','15','30','45'].map(m => `<option value="${m}" ${startParts.minute === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                    <select id="activityStartAmpm" class="form-control form-control--compact">
                      <option value="AM" ${startParts.ampm === 'AM' ? 'selected' : ''}>AM</option>
                      <option value="PM" ${startParts.ampm === 'PM' ? 'selected' : ''}>PM</option>
                    </select>
                  </div>
                </div>
                <div class="activity-assign-time-group">
                  <span>End Time</span>
                  <div class="activity-assign-time-selects">
                    <select id="activityEndHour" class="form-control form-control--compact">
                      ${['12','01','02','03','04','05','06','07','08','09','10','11'].map(h => `<option value="${h}" ${endParts.hour === h ? 'selected' : ''}>${h}</option>`).join('')}
                    </select>
                    <select id="activityEndMinute" class="form-control form-control--compact">
                      ${['00','15','30','45'].map(m => `<option value="${m}" ${endParts.minute === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                    <select id="activityEndAmpm" class="form-control form-control--compact">
                      <option value="AM" ${endParts.ampm === 'AM' ? 'selected' : ''}>AM</option>
                      <option value="PM" ${endParts.ampm === 'PM' ? 'selected' : ''}>PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="activity-assign-schedule-hint activity-assign-schedule-hint-text">Suggested uses each day's best open slot. Fixed time calculates the end from duration when left blank.</div>
              <div id="activityDualTimeNotice" class="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800/50 mt-2 font-medium" style="display:none;"></div>
            </div>

            <!-- Assignment Info & Remove Button -->
            <div class="activity-assign-current-wrap">
              <div class="activity-assign-current">Current assignment: <strong>${html(currentDayLabel)}</strong></div>
              ${hasCurrentAssignment ? `<button type="button" class="action-btn activity-assign-clear activity-assign-clear-spaced" id="activityAssignClearBtn">Move to Suggested Pool (Unassign)</button>` : ''}
            </div>

            <!-- Attachments & Links -->
            <div class="activity-assign-attachments-section p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/80 mt-3">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200">📎 Receipts, Tickets & Links</label>
                <span class="text-[11px] text-slate-400">PDFs, screenshots, confirmations</span>
              </div>
              <div id="activityAttachmentsList" class="attachments-list flex flex-col gap-1.5 mb-2"></div>
              <div class="flex gap-2">
                <button type="button" class="action-btn action-btn-secondary text-xs px-2 py-1" onclick="promptAddActivityLink()">📎 Add Link</button>
                <button type="button" class="action-btn action-btn-secondary text-xs px-2 py-1" onclick="document.getElementById('activityImageUpload').click()">🖼️ Upload Image</button>
                <input type="file" id="activityImageUpload" accept="image/*" style="display: none;" onchange="handleActivityImageUpload(event)">
              </div>
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
  if (typeof renderActivityAttachmentsList === 'function') {
    renderActivityAttachmentsList();
  }

  const closeModal = () => modal.remove();
  document.getElementById('activityAssignCloseBtn').onclick = closeModal;
  document.getElementById('activityAssignCancelBtn').onclick = closeModal;

  const modeInputs = Array.from(modal.querySelectorAll('input[name="activityAssignScheduleMode"]'));
  
  const getSelectedTimeValue = (hourId, minuteId, ampmId) => {
    const h = document.getElementById(hourId)?.value;
    const m = document.getElementById(minuteId)?.value;
    const ampm = document.getElementById(ampmId)?.value;
    return get24HourTimeFrom12HourParts(h, m, ampm);
  };

  const getScheduleOptions = (button = null) => {
    const selectedMode = modeInputs.find(input => input.checked)?.value || 'suggested';
    const scheduleMode = ['scheduled', 'suggested'].includes(selectedMode) ? selectedMode : 'anytime';
    const targetBtn = button || modal.querySelector('.activity-assign-day.is-current');
    const suggestedStartTime = targetBtn?.getAttribute('data-suggest-start') || '';
    const suggestedEndTime = targetBtn?.getAttribute('data-suggest-end') || '';
    
    const startTime = getSelectedTimeValue('activityStartHour', 'activityStartMinute', 'activityStartAmpm');
    const endTime = getSelectedTimeValue('activityEndHour', 'activityEndMinute', 'activityEndAmpm');

    return {
      scheduleMode,
      startTime,
      endTime,
      suggestedStartTime,
      suggestedEndTime
    };
  };

  const syncScheduleControls = () => {
    const scheduled = modeInputs.find(input => input.checked)?.value === 'scheduled';
    ['activityStartHour', 'activityStartMinute', 'activityStartAmpm', 'activityEndHour', 'activityEndMinute', 'activityEndAmpm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !scheduled;
    });
  };

  const startInput = document.getElementById('activityAssignStartTime');
  const endInput = document.getElementById('activityAssignEndTime');

  const syncSelectsFromInputs = () => {
    if (startInput && startInput.value) {
      const parts = parse24HourTo12HourParts(startInput.value);
      const sh = document.getElementById('activityStartHour');
      const sm = document.getElementById('activityStartMinute');
      const sa = document.getElementById('activityStartAmpm');
      if (sh) sh.value = parts.hour;
      if (sm) sm.value = parts.minute;
      if (sa) sa.value = parts.ampm;
    }
    if (endInput && endInput.value) {
      const parts = parse24HourTo12HourParts(endInput.value);
      const eh = document.getElementById('activityEndHour');
      const em = document.getElementById('activityEndMinute');
      const ea = document.getElementById('activityEndAmpm');
      if (eh) eh.value = parts.hour;
      if (em) em.value = parts.minute;
      if (ea) ea.value = parts.ampm;
    }
  };

  const updateInputsFromSelects = () => {
    if (startInput) {
      startInput.value = getSelectedTimeValue('activityStartHour', 'activityStartMinute', 'activityStartAmpm') || '';
    }
    if (endInput) {
      endInput.value = getSelectedTimeValue('activityEndHour', 'activityEndMinute', 'activityEndAmpm') || '';
    }
  };

  if (startInput) {
    startInput.addEventListener('input', () => {
      const scheduledInput = modeInputs.find(input => input.value === 'scheduled');
      if (scheduledInput) scheduledInput.checked = true;
      syncScheduleControls();
      syncSelectsFromInputs();
      if (startInput.value && endInput) {
        const durationText = document.getElementById('activityTime').value.trim() || '1 hr';
        endInput.value = addMinutesToTimeValue(startInput.value, parseActivityDurationMinutes(durationText)) || '';
        syncSelectsFromInputs();
      }
    });
    startInput.addEventListener('change', () => {
      const scheduledInput = modeInputs.find(input => input.value === 'scheduled');
      if (scheduledInput) scheduledInput.checked = true;
      syncScheduleControls();
      syncSelectsFromInputs();
      if (startInput.value && endInput) {
        const durationText = document.getElementById('activityTime').value.trim() || '1 hr';
        endInput.value = addMinutesToTimeValue(startInput.value, parseActivityDurationMinutes(durationText)) || '';
        syncSelectsFromInputs();
      }
    });
  }

  if (endInput) {
    endInput.addEventListener('input', () => {
      const scheduledInput = modeInputs.find(input => input.value === 'scheduled');
      if (scheduledInput) scheduledInput.checked = true;
      syncScheduleControls();
      syncSelectsFromInputs();
    });
    endInput.addEventListener('change', () => {
      const scheduledInput = modeInputs.find(input => input.value === 'scheduled');
      if (scheduledInput) scheduledInput.checked = true;
      syncScheduleControls();
      syncSelectsFromInputs();
    });
  }

  const updateDualTimeNotice = () => {
    const noticeEl = document.getElementById('activityDualTimeNotice');
    if (!noticeEl) return;
    const timeVal = startInput?.value || getSelectedTimeValue('activityStartHour', 'activityStartMinute', 'activityStartAmpm');
    const cityName = leg?.label || leg?.city || '';
    const localTz = typeof getCityTimezone === 'function' ? getCityTimezone(cityName) : '';
    const homeTz = typeof getHomeTimezone === 'function' ? getHomeTimezone() : '';
    const activeDayBtn = modal.querySelector('.activity-assign-day.is-current');
    const dayIdx = activeDayBtn ? Number(activeDayBtn.getAttribute('data-day-index')) : activity?.assignedDayIdx;
    const dateVal = leg?.days?.[dayIdx]?.date || '';

    if (timeVal && localTz && homeTz && localTz !== homeTz) {
      const dualText = typeof convertLocalToHomeTime === 'function'
        ? convertLocalToHomeTime(timeVal, dateVal, localTz, homeTz)
        : (typeof formatDualTimeDisplay === 'function' ? formatDualTimeDisplay(timeVal, dateVal, localTz, homeTz) : '');
      if (dualText) {
        noticeEl.textContent = `🏡 Home: ${dualText} (${localTz.split('/')[1] || localTz} local time)`;
        noticeEl.style.display = 'block';
        return;
      }
    }
    noticeEl.style.display = 'none';
  };

  const syncTimeAndDayFromMode = () => {
    const selectedMode = modeInputs.find(input => input.checked)?.value || 'suggested';
    let activeDayBtn = modal.querySelector('.activity-assign-day.is-current');
    if (!activeDayBtn) {
      activeDayBtn = modal.querySelector('.activity-assign-day');
      if (activeDayBtn && selectedMode !== 'anytime') {
        activeDayBtn.classList.add('is-current');
        activeDayBtn.setAttribute('aria-pressed', 'true');
        const dayLabel = activeDayBtn.querySelector('.activity-assign-day-date')?.textContent || 'Day';
        const currentAssignmentText = modal.querySelector('.activity-assign-current strong');
        if (currentAssignmentText) currentAssignmentText.textContent = dayLabel;
      }
    }

    if (activeDayBtn) {
      if (selectedMode === 'suggested' || selectedMode === 'scheduled') {
        const suggestStart = activeDayBtn.getAttribute('data-suggest-start') || '';
        const suggestEnd = activeDayBtn.getAttribute('data-suggest-end') || '';
        if (startInput) startInput.value = suggestStart;
        if (endInput) endInput.value = suggestEnd;
        syncSelectsFromInputs();
      } else if (selectedMode === 'anytime') {
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        const sh = document.getElementById('activityStartHour');
        const sm = document.getElementById('activityStartMinute');
        const sa = document.getElementById('activityStartAmpm');
        const eh = document.getElementById('activityEndHour');
        const em = document.getElementById('activityEndMinute');
        const ea = document.getElementById('activityEndAmpm');
        if (sh) sh.value = '12';
        if (sm) sm.value = '00';
        if (sa) sa.value = 'AM';
        if (eh) eh.value = '12';
        if (em) em.value = '00';
        if (ea) ea.value = 'AM';
      }
    }
  };

  modeInputs.forEach(input => input.addEventListener('change', () => {
    syncScheduleControls();
    syncTimeAndDayFromMode();
    updateDualTimeNotice();
  }));

  const updateEndTimeFromDuration = () => {
    const startVal = getSelectedTimeValue('activityStartHour', 'activityStartMinute', 'activityStartAmpm');
    if (startVal) {
      const durationText = document.getElementById('activityTime').value.trim() || '1 hr';
      const endVal = addMinutesToTimeValue(startVal, parseActivityDurationMinutes(durationText)) || '';
      if (endVal) {
        const parts = parse24HourTo12HourParts(endVal);
        const eh = document.getElementById('activityEndHour');
        const em = document.getElementById('activityEndMinute');
        const ea = document.getElementById('activityEndAmpm');
        if (eh) eh.value = parts.hour;
        if (em) em.value = parts.minute;
        if (ea) ea.value = parts.ampm;
      }
    }
  };

  ['activityStartHour', 'activityStartMinute', 'activityStartAmpm', 'activityEndHour', 'activityEndMinute', 'activityEndAmpm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const scheduledInput = modeInputs.find(input => input.value === 'scheduled');
        if (scheduledInput) scheduledInput.checked = true;
        syncScheduleControls();
        updateInputsFromSelects();
        if (['activityStartHour', 'activityStartMinute', 'activityStartAmpm'].includes(id)) {
          updateEndTimeFromDuration();
          updateInputsFromSelects();
        }
        updateDualTimeNotice();
      });
    }
  });

  syncScheduleControls();
  updateDualTimeNotice();

  const getFormData = () => {
    const category = document.getElementById('activityCategory').value;
    const title = document.getElementById('activityTitle').value.trim();
    const location = document.getElementById('activityLocation').value.trim();
    const estTime = document.getElementById('activityTime').value.trim() || '1 hr';
    const estCost = document.getElementById('activityCost').value.trim() || '0';
    const notes = document.getElementById('activityNotes').value.trim();
    const status = document.getElementById('activityStatus').value || '';
    const bookingRef = document.getElementById('activityBookingRef').value.trim();
    const externalLink = document.getElementById('activityExternalLink')?.value.trim() || '';
    const attachments = Array.isArray(window._currentActivityAttachments) ? [...window._currentActivityAttachments] : [];
    if (!title) {
      alert('Please enter a description');
      return null;
    }
    const fullTitle = location ? `${title} — ${location}` : title;
    return { category, title: fullTitle, estTime, estCost, notes, location, status, bookingRef, externalLink, attachments };
  };

  const showAssignDialogFeedback = (message) => {
    if (!message) return;
    let feedback = modal.querySelector('.activity-assign-dialog-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'activity-assign-dialog-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      const daysWrap = modal.querySelector('.activity-assign-days-wrap');
      const daysTitle = modal.querySelector('.activity-assign-days-title');
      if (daysWrap && daysTitle) {
        daysTitle.insertAdjacentElement('afterend', feedback);
      } else {
        modal.querySelector('.modal-body')?.prepend(feedback);
      }
    }
    feedback.textContent = message;
    feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
        if (!target) return;
        target.category = formData.category;
        target.title = formData.title;
        target.estTime = formData.estTime;
        target.estCost = formData.estCost;
        target.notes = formData.notes;
        target.location = formData.location;
        target.status = formData.status;
        target.bookingRef = formData.bookingRef;
        target.externalLink = formData.externalLink;
        target.attachments = formData.attachments;
        delete target.audioTitle;
        delete target.audioRef;
        delete target.audioUrl;
      }

      const assigned = assignSuggestedActivityToDay(legIdx, targetIdx, legIdx, targetDayIdx, {
        ...getScheduleOptions(button),
        originalMatchTexts
      });
      if (!assigned) {
        if (!isEditing && targetIdx === leg.suggestedActivities.length - 1) {
          leg.suggestedActivities.pop();
        }
        showAssignDialogFeedback(assignSuggestedActivityToDay.lastError || 'Could not place this activity on that day.');
        return;
      }

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
      if (!target) return;
      target.category = formData.category;
      target.title = formData.title;
      target.estTime = formData.estTime;
      target.estCost = formData.estCost;
      target.notes = formData.notes;
      target.location = formData.location;
      target.status = formData.status;
      target.bookingRef = formData.bookingRef;
      target.externalLink = formData.externalLink;
      target.attachments = formData.attachments;
      delete target.audioTitle;
      delete target.audioRef;
      delete target.audioUrl;

      const cleared = clearAssignedSuggestedActivityFromDay(legIdx, activityIdx, originalMatchTexts);
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
      if (!target) {
        console.error(`[Activity Editor] No target activity found at index ${activityIdx}`);
        return;
      }
      const previousMatchTexts = originalMatchTexts;
      const previousClean = previousMatchTexts.map(t => getComparisonString(t));

      target.category = formData.category;
      target.title = formData.title;
      target.estTime = formData.estTime;
      target.estCost = formData.estCost;
      target.notes = formData.notes;
      target.location = formData.location;
      target.status = formData.status;
      target.bookingRef = formData.bookingRef;
      target.externalLink = formData.externalLink;
      target.attachments = formData.attachments;
      delete target.audioTitle;
      delete target.audioRef;
      delete target.audioUrl;

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
            const cleanItemText = getComparisonString(item.text);
            if (previousClean.includes(cleanItemText)) {
              item.text = getSuggestedActivityDayText(target);
              item.time = formData.estTime;
              item.cost = formData.estCost;
              item.notes = formData.notes;
              item.location = formData.location;
              item.status = formData.status;
              item.bookingRef = formData.bookingRef;
              item.externalLink = formData.externalLink;
              item.attachments = formData.attachments ? [...formData.attachments] : [];
              delete item.audioTitle;
              delete item.audioRef;
              delete item.audioUrl;
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
    deleteBtn.onclick = async () => {
      if (confirm('Are you sure you want to delete this activity?')) {
        closeModal();
        await deleteActivity(legIdx, activityIdx);
      }
    };
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
}

function _openActivityModal(legIdx, activityIdx = null, options = {}) {
  return openActivityModalUnified(legIdx, activityIdx, options);
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
  const activityId = item.activityId;
  const suggestedActivities = appData[legIdx]?.suggestedActivities || [];

  function isMatch(activity) {
    if (!activity) return false;
    if (activityId && activity.id === activityId) return true;
    if (!itemText) return false;

    const getComparisonString = (str) => {
      return String(str || '')
        .toLowerCase()
        .replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };

    const cleanItem = getComparisonString(itemText);
    const cleanTitle = getComparisonString(activity.title);
    if (cleanItem === cleanTitle) return true;

    // Check base title (without location suffix)
    const baseTitle = getComparisonString(activity.title.split(' — ')[0]);
    if (cleanItem === baseTitle) return true;

    const matchTexts = typeof getSuggestedActivityMatchTexts === 'function'
      ? getSuggestedActivityMatchTexts(activity).map(t => getComparisonString(t))
      : [cleanTitle];

    if (matchTexts.includes(cleanItem)) return true;

    return false;
  }

  // Priority 1: Match strictly by ID if timeline item has activityId
  let activityIdx = -1;
  if (activityId) {
    activityIdx = suggestedActivities.findIndex(activity => (
      activity && activity.id === activityId
    ));
  }

  // Phase 1: Try to find a match assigned to this day
  if (activityIdx === -1) {
    activityIdx = suggestedActivities.findIndex(activity => (
      activity && activity.assignedDayIdx === dayIdx && isMatch(activity)
    ));
  }

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
      if (activityId) {
        activityIdx = refreshedActivities.findIndex(activity => (
          activity && activity.id === activityId
        ));
      }
      if (activityIdx === -1) {
        activityIdx = refreshedActivities.findIndex(activity => (
          activity && activity.assignedDayIdx === dayIdx && isMatch(activity)
        ));
      }
      if (activityIdx === -1) {
        activityIdx = refreshedActivities.findIndex(activity => activity && isMatch(activity));
      }
    }
  }

  if (activityIdx !== undefined && activityIdx !== -1) {
    _openActivityModal(legIdx, activityIdx, { titleOverride: itemText });
  } else {
    // Phase 4: Auto-create a matching suggested activity entry and open it!
    let category = 'sight';
    const text = String(itemText || '').trim();
    if (/food|restaurant|eat|dinner|lunch|breakfast|cafe/i.test(text)) category = 'food';
    else if (/run|fitness|jog|workout|gym/i.test(text)) category = 'fitness';
    else if (/wellness|yoga|spa|massage/i.test(text)) category = 'wellness';
    else if (/event|meet|meeting|family|catchup|catch-up|appointment|reservation|date|hookup/i.test(text)) category = 'event';
    else if (/audio|podcast|self-guided|self guided/i.test(text)) category = 'audioTour';
    else if (/tour|guide|bus/i.test(text)) category = 'tour';
    else if (/attraction|park|ride/i.test(text)) category = 'attraction';

    const split = typeof _splitActivityTitle === 'function' ? _splitActivityTitle(text) : { title: text, location: '' };
    const cleanTitle = String(split.title || '').trim();
    const cleanLocation = item.location || split.location || '';
    if (cleanLocation && !item.location) {
      item.location = cleanLocation;
    }

    if (!Array.isArray(appData[legIdx].suggestedActivities)) {
      appData[legIdx].suggestedActivities = [];
    }

    const newId = 'act-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    item.activityId = newId;

    appData[legIdx].suggestedActivities.push({
      id: newId,
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


// Global & CommonJS Export Bridge
const _actModalExports = {
  _splitActivityTitle,
  openActivityModalUnified,
  _openActivityModal,
  addActivity,
  openEditActivityModal,
  openEditDayActivityModal
};

if (typeof window !== 'undefined') {
  Object.assign(window, _actModalExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _actModalExports;
}
