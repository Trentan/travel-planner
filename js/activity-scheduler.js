// ============================================================================
// MODULE: Activity Scheduling & Gap Analysis (js/activity-scheduler.js)
// Heuristics for finding free time slots, schedule dialogs, and activity sync.
// ============================================================================

function getSuggestedActivityDayText(activity) {
  const title = String(activity?.title || '').trim();
  return title;
}

function getComparisonString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getSuggestedActivityMatchTexts(activity) {
  return [...new Set([
    String(activity?.title || '').trim(),
    getSuggestedActivityDayText(activity)
  ].filter(Boolean))];
}

function getSuggestedActivityIndex(activities) {
  if (!Array.isArray(activities) || activities.length === 0) return null;
  if (activities._index) return activities._index;

  const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
  const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];

  const byId = new Map();
  const byDayAndKey = new Map();

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    if (!activity) continue;

    if (activity.id) {
      byId.set(activity.id, activity);
    }

    const dayIdx = activity.assignedDayIdx;
    if (dayIdx === null || dayIdx === undefined) continue;

    const rawTitle = String(activity.title || '').trim().toLowerCase();
    if (!rawTitle) continue;

    const cleanTitleNoEmoji = rawTitle.replace(emojiPattern, '').trim();

    let baseTitle = rawTitle;
    for (const separator of separators) {
      const idx = rawTitle.indexOf(separator);
      if (idx !== -1) {
        baseTitle = rawTitle.slice(0, idx).trim();
        break;
      }
    }
    const baseTitleNoEmoji = baseTitle.replace(emojiPattern, '').trim();

    const keys = new Set();
    if (rawTitle) keys.add(rawTitle);
    if (cleanTitleNoEmoji) keys.add(cleanTitleNoEmoji);
    if (baseTitle) keys.add(baseTitle);
    if (baseTitleNoEmoji) keys.add(baseTitleNoEmoji);

    if (typeof getSuggestedActivityMatchTexts === 'function') {
      const matchTexts = getSuggestedActivityMatchTexts(activity);
      for (let m = 0; m < matchTexts.length; m++) {
        const mt = String(matchTexts[m] || '').trim().toLowerCase();
        if (mt) {
          keys.add(mt);
          const mtNoEmoji = mt.replace(emojiPattern, '').trim();
          if (mtNoEmoji) keys.add(mtNoEmoji);
        }
      }
    }

    for (const key of keys) {
      const mapKey = `${dayIdx}:${key}`;
      if (!byDayAndKey.has(mapKey)) {
        byDayAndKey.set(mapKey, activity);
      }
    }
  }

  const index = { byId, byDayAndKey };
  Object.defineProperty(activities, '_index', {
    value: index,
    writable: true,
    configurable: true,
    enumerable: false
  });
  return index;
}

function invalidateSuggestedActivityIndex(target) {
  if (!target && typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData.forEach(leg => {
      if (Array.isArray(leg?.suggestedActivities) && leg.suggestedActivities._index) {
        delete leg.suggestedActivities._index;
      }
    });
    return;
  }
  if (typeof target === 'number' && typeof appData !== 'undefined') {
    target = appData[target]?.suggestedActivities;
  } else if (target && target.suggestedActivities) {
    target = target.suggestedActivities;
  }
  if (Array.isArray(target) && target._index) {
    delete target._index;
  }
}

function findAssignedSuggestedActivity(legIdx, dayIdx, itemText, activityId = null) {
  const activities = appData[legIdx]?.suggestedActivities || [];
  if (activities.length === 0) return null;

  const index = getSuggestedActivityIndex(activities);

  if (activityId) {
    if (index && index.byId) {
      const found = index.byId.get(activityId);
      if (found) return found;
    } else {
      const found = activities.find(activity => activity && activity.id === activityId);
      if (found) return found;
    }
  }

  const cleanItem = String(itemText || '').trim().toLowerCase();
  if (!cleanItem) return null;

  if (index && index.byDayAndKey) {
    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
    const cleanItemNoEmoji = cleanItem.replace(emojiPattern, '').trim();

    const key1 = `${dayIdx}:${cleanItem}`;
    let matched = index.byDayAndKey.get(key1);
    if (matched) return matched;

    if (cleanItemNoEmoji && cleanItemNoEmoji !== cleanItem) {
      const key2 = `${dayIdx}:${cleanItemNoEmoji}`;
      matched = index.byDayAndKey.get(key2);
      if (matched) return matched;
    }

    const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];
    let baseItem = cleanItem;
    for (const separator of separators) {
      const idx = cleanItem.indexOf(separator);
      if (idx !== -1) {
        baseItem = cleanItem.slice(0, idx).trim();
        break;
      }
    }
    if (baseItem !== cleanItem) {
      matched = index.byDayAndKey.get(`${dayIdx}:${baseItem}`);
      if (matched) return matched;

      const baseItemNoEmoji = baseItem.replace(emojiPattern, '').trim();
      if (baseItemNoEmoji && baseItemNoEmoji !== baseItem) {
        matched = index.byDayAndKey.get(`${dayIdx}:${baseItemNoEmoji}`);
        if (matched) return matched;
      }
    }

    return null;
  }

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

function syncAssignedSuggestedActivityField(legIdx, dayIdx, itemText, field, value, activityId = null) {
  const activity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText, activityId);
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

function syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, itemText, schedule = {}, activityId = null) {
  const activity = findAssignedSuggestedActivity(legIdx, dayIdx, itemText, activityId);
  if (!activity) return;
  activity.assignedDayIdx = dayIdx;
  activity.assignedDate = schedule.startDate || getNormalizedDayDate(appData[legIdx]?.days?.[dayIdx]);
  applyActivityScheduleFields(activity, appData[legIdx]?.days?.[dayIdx], schedule);
}

function isPlaceholderActivityItem(item) {
  const text = String(item?.text || '').trim();
  return /^[-—]$/.test(text) || text === 'Explore local area' || text === 'Add item...' || text === 'New item...';
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
      syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, previousText, item, item.activityId);
    } else {
      clearActivityScheduleFields(item, day);
      syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, previousText, item, item.activityId);
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
  syncAssignedSuggestedActivitySchedule(legIdx, dayIdx, previousText, item, item.activityId);
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
  const startMinutes = timeValueToMinutes(startTime);
  const explicitEndMinutes = timeValueToMinutes(explicitEndTime);
  const shouldUseExplicitEnd = explicitEndTime && startMinutes !== null && explicitEndMinutes !== null && explicitEndMinutes > startMinutes;
  const endTime = startTime ? (shouldUseExplicitEnd ? explicitEndTime : addMinutesToTimeValue(startTime, durationMinutes)) : '';
  return { startTime, endTime };
}

function getActivityScheduleConflict(leg, day, activity, schedule) {
  const start = timeValueToMinutes(schedule?.startTime);
  if (start === null) return null;
  const durationMinutes = parseActivityDurationMinutes(activity?.estTime || activity?.time || '') || 60;
  const end = timeValueToMinutes(schedule?.endTime) ?? (start + durationMinutes);
  const conflict = getDaySchedulingBusyIntervals(leg, day, activity)
    .find(interval => start < interval.end && end > interval.start);
  if (!conflict) return null;

  const suggestion = suggestActivityTimeForDay(leg, day, activity);
  const suggestionText = suggestion?.available
    ? `Suggested slot: ${suggestion.label}.`
    : 'No clean suggested slot is available on this day.';
  return {
    label: conflict.label || 'another timed item',
    suggestion,
    message: `That time overlaps ${conflict.label || 'another timed item'}. ${suggestionText}`
  };
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
  return day.activityItems.find(item => activity.id ? item.activityId === activity.id : getSuggestedActivityMatchTexts(activity).includes(String(item.text || '').trim())) || null;
}

function assignSuggestedActivityToDay(sourceLegIdx, activityIdx, targetLegIdx, targetDayIdx, options = {}) {
  assignSuggestedActivityToDay.lastError = '';
  const sourceLeg = appData[sourceLegIdx];
  const targetLeg = appData[targetLegIdx];
  const activity = sourceLeg?.suggestedActivities?.[activityIdx];
  const targetDay = targetLeg?.days?.[targetDayIdx];
  if (!activity || !targetDay) {
    assignSuggestedActivityToDay.lastError = 'Could not assign this activity to that day.';
    return false;
  }

  if (!activity.id) {
    activity.id = 'act-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }
  const activityId = activity.id;

  const getComparisonString = (str) => {
    return String(str || '')
      .toLowerCase()
      .replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const originalClean = Array.isArray(options.originalMatchTexts)
    ? options.originalMatchTexts.map(t => getComparisonString(t))
    : [];

  const isItemMatch = (item) => {
    if (!item) return false;
    if (activityId && item.activityId === activityId) return true;

    const itemText = item.text;
    if (!itemText) return false;
    const cleanItem = getComparisonString(itemText);
    
    if (originalClean.includes(cleanItem)) return true;

    const cleanTitle = getComparisonString(activity.title);
    if (cleanItem === cleanTitle) return true;

    const baseTitle = getComparisonString(activity.title.split(' — ')[0]);
    if (cleanItem === baseTitle) return true;

    const matchTexts = getSuggestedActivityMatchTexts(activity).map(t => getComparisonString(t));
    if (matchTexts.includes(cleanItem)) return true;

    return false;
  };

  const previousDayIdx = activity.assignedDayIdx;
  const assignedText = getSuggestedActivityDayText(activity);
  const schedule = getActivityScheduleFromOptions(activity, options);
  const conflict = options.scheduleMode === 'scheduled'
    ? getActivityScheduleConflict(targetLeg, targetDay, activity, schedule)
    : null;
  if (conflict) {
    assignSuggestedActivityToDay.lastError = conflict.message;
    return false;
  }

  if (previousDayIdx !== null && previousDayIdx !== undefined && sourceLegIdx === targetLegIdx && previousDayIdx !== targetDayIdx) {
    const previousDay = targetLeg.days[previousDayIdx];
    if (previousDay && Array.isArray(previousDay.activityItems)) {
      const prevIndex = previousDay.activityItems.findIndex(item => isItemMatch(item));
      if (prevIndex !== -1) previousDay.activityItems.splice(prevIndex, 1);
    }
  }

  if (!Array.isArray(targetDay.activityItems)) targetDay.activityItems = [];
  if (targetDay.activityItems.length === 1 && isPlaceholderActivityItem(targetDay.activityItems[0])) {
    targetDay.activityItems = [];
  }

  const datedSchedule = {
    ...schedule,
    startDate: getNormalizedDayDate(targetDay),
    endDate: getNormalizedDayDate(targetDay)
  };
  let targetItem = targetDay.activityItems.find(item => isItemMatch(item));
  if (!targetItem) {
    targetItem = {
      activityId: activity.id,
      text: assignedText,
      cost: activity.estCost || '0',
      time: activity.estTime || '1 hr',
      done: false,
      notes: activity.notes || '',
      location: activity.location || '',
      status: activity.status || '',
      bookingRef: activity.bookingRef || '',
      externalLink: activity.externalLink || activity.audioRef || activity.audioUrl || ''
    };
    applyActivityScheduleFields(targetItem, targetDay, datedSchedule);
    targetDay.activityItems.push(targetItem);
  } else {
    targetItem.activityId = activity.id;
    targetItem.notes = activity.notes || '';
    targetItem.location = activity.location || '';
    targetItem.status = activity.status || '';
    targetItem.bookingRef = activity.bookingRef || '';
    targetItem.externalLink = activity.externalLink || activity.audioRef || activity.audioUrl || '';
    delete targetItem.audioTitle;
    delete targetItem.audioRef;
    delete targetItem.audioUrl;
    applyActivityScheduleFields(targetItem, targetDay, datedSchedule);
  }

  activity.assignedDayIdx = targetDayIdx;
  activity.assignedDate = datedSchedule.startDate;
  applyActivityScheduleFields(activity, targetDay, datedSchedule);
  invalidateSuggestedActivityIndex(sourceLegIdx);
  if (sourceLegIdx !== targetLegIdx) invalidateSuggestedActivityIndex(targetLegIdx);
  return true;
}

function clearAssignedSuggestedActivityFromDay(sourceLegIdx, activityIdx, originalMatchTexts = null) {
  const sourceLeg = appData[sourceLegIdx];
  const activity = sourceLeg?.suggestedActivities?.[activityIdx];
  if (!activity) return false;

  if (!activity.id) {
    activity.id = 'act-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }
  const activityId = activity.id;

  const previousDayIdx = activity.assignedDayIdx;
  if (previousDayIdx === null || previousDayIdx === undefined) return false;

  const getComparisonString = (str) => {
    return String(str || '')
      .toLowerCase()
      .replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

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

    return false;
  };

  const previousDay = sourceLeg?.days?.[previousDayIdx];
  if (previousDay && Array.isArray(previousDay.activityItems)) {
    const prevIndex = previousDay.activityItems.findIndex(item => isItemMatch(item));
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
  invalidateSuggestedActivityIndex(sourceLegIdx);
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

function openActivityAssignModal(legIdx, activityIdx) {
  return openActivityModalUnified(legIdx, activityIdx);
}

// Dialog functions for Add New Leg

// Global & CommonJS Export Bridge
const _schedulerExports = {
  getSuggestedActivityDayText,
  getComparisonString,
  getSuggestedActivityMatchTexts,
  getSuggestedActivityIndex,
  invalidateSuggestedActivityIndex,
  findAssignedSuggestedActivity,
  syncAssignedSuggestedActivityField,
  getNormalizedDayDate,
  applyActivityScheduleFields,
  clearActivityScheduleFields,
  syncAssignedSuggestedActivitySchedule,
  isPlaceholderActivityItem,
  updateDayItemScheduleTime,
  setDayItemScheduleMode,
  escapeScheduleDialogText,
  openDayItemScheduleDialog,
  parseActivityDurationMinutes,
  addMinutesToTimeValue,
  timeValueToMinutes,
  minutesToTimeValue,
  formatScheduleTimeRange,
  getActivityScheduleFromOptions,
  getActivityScheduleConflict,
  activityLooksLikeMeal,
  getActivityPreferredWindows,
  addBusyInterval,
  getDaySchedulingBusyIntervals,
  mergeBusyIntervals,
  getAvailableGaps,
  chooseBestScheduleGap,
  describeScheduleSuggestion,
  suggestActivityTimeForDay,
  getAssignedSuggestedActivityDayItem,
  assignSuggestedActivityToDay,
  clearAssignedSuggestedActivityFromDay,
  showActivityAssignFeedback,
  openActivityAssignModal
};

if (typeof window !== 'undefined') {
  Object.assign(window, _schedulerExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _schedulerExports;
}
