// ============================================================================
// MODULE: Leg Dialog & Sequence Editor (js/leg-dialog.js)
// Modal lifecycle, UI controls, reorder sequence list, and form validation.
// ============================================================================

// Dialog functions for Add New Leg
var legDialogState = (typeof window !== 'undefined' && window.legDialogState)
  ? window.legDialogState
  : { mode: 'add', isAddingNewLeg: false, editLegIdx: null, stagedLegs: [], originalLegDates: {} };
if (typeof window !== 'undefined') window.legDialogState = legDialogState;


function getLegDialogState() {
  return (typeof window !== 'undefined' && window.legDialogState) ? window.legDialogState : legDialogState;
}


function setLegDialogState(newState) {
  legDialogState = newState;
  if (typeof window !== 'undefined') window.legDialogState = legDialogState;
}


function openLegEditorDialog(initialTab = 'edit') {
  openAddLegDialog(initialTab);
}


function openLegEditorDirect(legIdx) {
  openAddLegDialog('edit');
  const editSelect = document.getElementById('editLegSelect');
  if (editSelect) {
    editSelect.value = String(legIdx);
    onEditLegSelectionChange();
  }
}


function openAddLegDialog(initialTab = 'edit') {
  const modal = document.getElementById('add-leg-modal');
  if (modal) {
    const origDates = {};
    (appData || []).forEach(leg => {
      if (leg && leg.id && Array.isArray(leg.days) && leg.days.length > 0) {
        origDates[leg.id] = {
          startDate: leg.days[0].date,
          endDate: leg.days[leg.days.length - 1].date
        };
      }
    });

    setLegDialogState({
      mode: 'add',
      isAddingNewLeg: false,
      editLegIdx: null,
      stagedLegs: Array.isArray(appData) ? JSON.parse(JSON.stringify(appData)) : [],
      originalLegDates: origDates
    });

    _populateAddLegCityDropdowns();
    modal.style.display = 'flex';
    const editSelect = document.getElementById('editLegSelect');
    if (editSelect) {
      editSelect.value = '';
      editSelect.onchange = onEditLegSelectionChange;
    }
    resetLegDialogToAddNew();
    switchLegModalTab(initialTab);
    validateLegEditorForm();
  }
}


function _populateAddLegCityDropdowns() {
  const existingSelect = document.getElementById('existingCitySelect');
  const fromSelect = document.getElementById('fromCitySelect');
  const toSelect = document.getElementById('toCitySelect');
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const editLegSelect = document.getElementById('editLegSelect');

  const homeCityName = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : '';
  const homeCodes = homeCityName && typeof getCityAirportCodesDisplay === 'function' ? getCityAirportCodesDisplay(homeCityName) : '';
  const homeOptionHtml = `<option value="Home">🏠 Home${homeCityName ? ` (${homeCityName}${homeCodes ? ' - ' + homeCodes : ''})` : ''}</option>`;

  // Build options HTML with Home + cities
  let cityOptionsHtml = '';
  if (typeof citiesData !== 'undefined') {
    cityOptionsHtml = [...citiesData]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(city => {
        const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '📍';
        const codes = typeof getCityAirportCodesDisplay === 'function'
          ? getCityAirportCodesDisplay(city.name)
          : (city.code || (typeof getCityIataCode === 'function' ? getCityIataCode(city.name) : ''));
        const displayName = codes ? `${city.name} (${codes})` : city.name;
        return `<option value="${city.name}">${flag} ${displayName}</option>`;
      })
      .join('');
  }

  // Populate existingCitySelect: Home + cities
  if (existingSelect) {
    const currentValue = existingSelect.value;
    existingSelect.innerHTML = '<option value="">-- Choose a city --</option>' + homeOptionHtml + cityOptionsHtml;
    if (currentValue) existingSelect.value = currentValue;
  }

  // Populate fromCitySelect: Home + cities (for travel legs)
  if (fromSelect) {
    const currentValue = fromSelect.value;
    fromSelect.innerHTML = homeOptionHtml + cityOptionsHtml;
    if (currentValue) fromSelect.value = currentValue;
  }

  // Populate toCitySelect: Home + cities (for travel & return legs)
  if (toSelect) {
    const currentValue = toSelect.value;
    toSelect.innerHTML = '<option value="">-- Choose destination --</option>' + homeOptionHtml + cityOptionsHtml;
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
    const options = [
      '<option value="">-- Select existing leg to edit --</option>'
    ];
    const sourceLegs = (legDialogState && Array.isArray(legDialogState.stagedLegs) && legDialogState.stagedLegs.length > 0)
      ? legDialogState.stagedLegs
      : (appData || []);
    sourceLegs.forEach((leg, idx) => {
      const firstDay = leg?.days?.[0];
      const lastDay = leg?.days?.[leg?.days?.length - 1] || firstDay;
      const legDate = firstDay?.date || '';
      const isTerminal = typeof isTerminalLeg === 'function' ? isTerminalLeg(leg) : (idx === 0 || idx === sourceLegs.length - 1);
      const daysCount = Array.isArray(leg?.days) ? leg.days.length : 0;
      const isSameDay = daysCount === 1 || (daysCount > 1 && firstDay?.date && lastDay?.date && firstDay.date === lastDay.date);
      const isTransit = !isTerminal && (leg?.type === 'transit' || isSameDay || (leg?.label || '').toLowerCase().includes('transit'));

      let baseLabel = (leg?.label || 'Untitled leg').trim();
      if (isTransit) {
        if (!/<transit>/i.test(baseLabel) && !/\(transit\)/i.test(baseLabel)) {
          baseLabel = `${baseLabel} <Transit>`;
        } else if (/\(transit\)/i.test(baseLabel)) {
          baseLabel = baseLabel.replace(/\s*\(transit\)/i, ' <Transit>');
        }
      }
      const rawLabel = `${idx + 1}. ${baseLabel}${legDate ? ` (${legDate})` : ''}`;
      const safeLabel = typeof escapeHtmlText === 'function' ? escapeHtmlText(rawLabel) : rawLabel;
      options.push(`<option value="${idx}">${safeLabel}</option>`);
    });
    editLegSelect.innerHTML = options.join('');
    if (currentValue && Number.isFinite(Number(currentValue))) {
      editLegSelect.value = currentValue;
    } else {
      editLegSelect.value = '';
    }
  }

  _populateLegPlacementDropdown();
}


function _populateLegPlacementDropdown() {
  const placementSelect = document.getElementById('legPlacementSelect');
  if (!placementSelect) return;

  const legs = (legDialogState && Array.isArray(legDialogState.stagedLegs))
    ? legDialogState.stagedLegs
    : (appData || []);

  const options = [];
  const returnIdx = legs.findIndex(l => {
    const lbl = (l.label || '').toLowerCase();
    return lbl.includes('return') || lbl.includes('trip finish');
  });

  if (returnIdx >= 0) {
    const returnLeg = legs[returnIdx];
    const cleanLbl = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(returnLeg.label) : (returnLeg.label || 'Return Home');
    options.push(`<option value="before_return" selected>📍 Append before Return (${cleanLbl})</option>`);
  } else if (legs.length > 0) {
    options.push(`<option value="end" selected>📍 At end of trip</option>`);
  }

  legs.forEach((leg, idx) => {
    const firstDay = leg?.days?.[0];
    const lastDay = leg?.days?.[leg?.days?.length - 1] || firstDay;
    const isTerminal = typeof isTerminalLeg === 'function' ? isTerminalLeg(leg) : (idx === 0 || idx === legs.length - 1);
    const daysCount = Array.isArray(leg?.days) ? leg.days.length : 0;
    const isSameDay = daysCount === 1 || (daysCount > 1 && firstDay?.date && lastDay?.date && firstDay.date === lastDay.date);
    const isTransit = !isTerminal && (leg?.type === 'transit' || isSameDay || (leg?.label || '').toLowerCase().includes('transit'));

    let cleanLbl = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(leg.label) : (leg.label || `Leg ${idx + 1}`);
    if (isTransit) {
      cleanLbl = `${cleanLbl} <Transit>`;
    }
    const safeLbl = typeof escapeHtmlText === 'function' ? escapeHtmlText(cleanLbl) : cleanLbl;
    options.push(`<option value="after_${idx}">After ${idx + 1}. ${safeLbl}</option>`);
  });

  if (returnIdx < 0 && legs.length > 0) {
    // Already pushed 'end'
  } else {
    options.push(`<option value="end">At end of trip</option>`);
  }
  const firstLeg = legs[0];
  if (!firstLeg || !isTerminalLeg(firstLeg)) {
    options.push(`<option value="start">At start of trip</option>`);
  }

  const prevVal = placementSelect.value;
  placementSelect.innerHTML = options.join('');
  if (prevVal && options.some(opt => opt.includes(`value="${prevVal}"`))) {
    placementSelect.value = prevVal;
  }
}


function getPlacementDefaultDates(placementVal = 'before_return') {
  const legs = (legDialogState && Array.isArray(legDialogState.stagedLegs))
    ? legDialogState.stagedLegs
    : (appData || []);

  if (!legs || legs.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    const endDate = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(today, 3) : today;
    return { startDate: today, endDate: endDate, duration: 3 };
  }

  let startDate = '';
  const returnIdx = legs.findIndex(l => {
    const lbl = (l.label || '').toLowerCase();
    return lbl.includes('return') || lbl.includes('trip finish');
  });

  if (placementVal === 'before_return') {
    if (returnIdx > 0) {
      const prev = legs[returnIdx - 1];
      startDate = prev?.days?.[prev.days.length - 1]?.date || '';
    } else if (returnIdx === 0) {
      startDate = legs[0]?.days?.[0]?.date || '';
    } else {
      const last = legs[legs.length - 1];
      startDate = last?.days?.[last.days.length - 1]?.date || '';
    }
  } else if (placementVal && placementVal.startsWith('after_')) {
    const idx = Number(placementVal.replace('after_', ''));
    if (Number.isFinite(idx) && legs[idx]) {
      const leg = legs[idx];
      startDate = leg?.days?.[leg.days.length - 1]?.date || '';
    }
  } else if (placementVal === 'start') {
    startDate = legs[0]?.days?.[0]?.date || '';
  } else {
    // end
    const last = legs[legs.length - 1];
    startDate = last?.days?.[last.days.length - 1]?.date || '';
  }

  if (!startDate) {
    startDate = legs[0]?.days?.[0]?.date || new Date().toISOString().split('T')[0];
  }

  const duration = 3;
  const endDate = typeof addDaysToIsoDate === 'function' ? addDaysToIsoDate(startDate, duration) : startDate;
  return { startDate, endDate, duration };
}


function updateLegDialogUiMode() {
  const title = document.getElementById('legDialogTitle') || document.querySelector('#add-leg-modal .modal-header h2');
  const saveBtn = document.getElementById('legDialogSaveBtn');
  const placementGroup = document.getElementById('legPlacementGroup');
  const existingCitySelect = document.getElementById('existingCitySelect');
  const toggleNewCityBtn = document.getElementById('toggleNewCityBtn');
  const newCityInlineGroup = document.getElementById('newCityInlineGroup');
  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  const isAddingNew = Boolean(legDialogState.isAddingNewLeg && !isEdit);

  if (title) title.textContent = isEdit ? 'Edit Trip Leg' : 'Add New Trip Leg';
  if (saveBtn) saveBtn.textContent = isEdit ? 'Save Leg' : 'Add Leg';
  if (placementGroup) placementGroup.style.display = isAddingNew ? 'block' : 'none';

  if (existingCitySelect) {
    existingCitySelect.disabled = isEdit;
  }
  if (toggleNewCityBtn) {
    toggleNewCityBtn.style.display = isEdit ? 'none' : 'inline-block';
  }
  if (newCityInlineGroup && isEdit) {
    newCityInlineGroup.style.display = 'none';
  }

  _syncLegDialogActions();
}


function _syncLegDialogActions() {
  const deleteBtn = document.getElementById('legDialogDeleteBtn');
  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);
  if (deleteBtn) deleteBtn.style.display = isEdit ? 'inline-flex' : 'none';
}


function updateLegOriginHelperUI(inferredOriginCity) {
  const helperGroup = document.getElementById('legOriginHelperGroup');
  const helperCity = document.getElementById('legOriginHelperCity');
  const legType = document.getElementById('legTypeSelect')?.value || 'city';
  if (!helperGroup || !helperCity) return;
  if ((legType === 'city' || legType === 'transit') && inferredOriginCity) {
    helperCity.textContent = inferredOriginCity;
    helperGroup.style.display = 'flex';
  } else {
    helperGroup.style.display = 'none';
  }
}

/**
 * Ensures appData[0] is a 'start' leg and appData[last] is a 'return' leg.
 * If either is missing, adds a placeholder.
 * Call from normalizeTripLegsData and before confirmSaveLegSequence.
 */

function setSelectValueMatchingCity(selectEl, rawCityValue, fallbackVal = '') {
  if (!selectEl) return;
  const raw = String(rawCityValue || '').trim();
  if (!raw) {
    if (fallbackVal) selectEl.value = fallbackVal;
    return;
  }

  // 1. Direct match on raw value
  const options = Array.from(selectEl.options || []);
  const exactOpt = options.find(opt => opt && opt.value === raw);
  if (exactOpt) {
    selectEl.value = raw;
    return;
  }

  // 2. Check for "Home" or match with titleData.homeCity
  const homeCity = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : '';
  let cleanRaw = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(raw) : raw.replace(/\s*\([^)]*\)/gu, '').replace(/[^\w\s-]/gu, '').trim();
  cleanRaw = (cleanRaw || '').replace(/\s*\d+$/, '').trim();
  const cleanHome = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(homeCity) : (homeCity || '').replace(/\s*\([^)]*\)/gu, '').replace(/[^\w\s-]/gu, '').trim();
  const isHome = raw.toLowerCase() === 'home' ||
    (homeCity && cleanRaw.toLowerCase() === cleanHome.toLowerCase()) ||
    raw.toLowerCase().includes('(trip start)') ||
    raw.toLowerCase().includes('(trip finish)') ||
    raw.toLowerCase().includes('(trip end)');
  if (isHome && options.some(opt => opt && opt.value === 'Home')) {
    selectEl.value = 'Home';
    return;
  }

  // 3. Clean value and match
  if (cleanRaw) {
    const cleanOpt = options.find(opt => opt && typeof opt.value === 'string' && opt.value.toLowerCase() === cleanRaw.toLowerCase());
    if (cleanOpt) {
      selectEl.value = cleanOpt.value;
      return;
    }
    const namedFromRaw = typeof getCityByName === 'function' ? (getCityByName(raw) || getCityByName(cleanRaw)) : null;
    if (namedFromRaw) {
      const cityOpt = options.find(opt => opt && typeof opt.value === 'string' && opt.value.toLowerCase() === namedFromRaw.name.toLowerCase());
      if (cityOpt) {
        selectEl.value = cityOpt.value;
        return;
      }
    }
    const textOpt = options.find(opt => opt && typeof (opt.text || opt.textContent) === 'string' && (opt.text || opt.textContent).toLowerCase().includes(cleanRaw.toLowerCase()));
    if (textOpt) {
      selectEl.value = textOpt.value;
      return;
    }
  }

  // Strictly only select valid pre-existing options or Home; NEVER dynamically append fake cities
  if (fallbackVal) {
    selectEl.value = fallbackVal;
  } else {
    selectEl.value = '';
  }
}


function resetLegDialogToAddNew() {
  const editLegSelect = document.getElementById('editLegSelect');
  if (editLegSelect) editLegSelect.value = '';
  legDialogState.mode = 'add';
  legDialogState.isAddingNewLeg = true;
  legDialogState.editLegIdx = null;

  const legTypeSelect = document.getElementById('legTypeSelect');
  const fromCitySelect = document.getElementById('fromCitySelect');
  const toCitySelect = document.getElementById('toCitySelect');
  const existingCitySelect = document.getElementById('existingCitySelect');
  const newCityName = document.getElementById('newLegCityName');
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const countryOther = document.getElementById('newLegCityCountryOther');
  const newCityInline = document.getElementById('newCityInlineGroup');
  const toggleNewCityBtn = document.getElementById('toggleNewCityBtn');
  const dateFrom = document.getElementById('newLegStartDate');
  const dateTo = document.getElementById('newLegEndDate');
  const durInput = document.getElementById('legDurationNights');
  const dayNotesInput = document.getElementById('legDayNotesInput');

  _populateLegPlacementDropdown();
  const placementSelect = document.getElementById('legPlacementSelect');
  const placementVal = placementSelect?.value || 'before_return';
  const defaults = getPlacementDefaultDates(placementVal);

  const isSameDay = defaults.startDate && defaults.endDate && defaults.startDate === defaults.endDate;
  if (legTypeSelect) legTypeSelect.value = isSameDay ? 'transit' : 'city';
  if (fromCitySelect) fromCitySelect.value = 'Home';
  if (toCitySelect) toCitySelect.value = '';
  if (existingCitySelect) existingCitySelect.value = '';
  if (newCityName) newCityName.value = '';
  if (countrySelect) countrySelect.value = '';
  if (countryOther) {
    countryOther.value = '';
    countryOther.style.display = 'none';
  }
  if (newCityInline) newCityInline.style.display = 'none';
  if (toggleNewCityBtn) toggleNewCityBtn.textContent = '+ Add a new city';
  if (dayNotesInput) dayNotesInput.value = '';

  if (dateFrom) {
    dateFrom.value = defaults.startDate;
    dateFrom.classList.remove('border-rose-500');
  }
  if (dateTo) {
    dateTo.value = defaults.endDate;
    dateTo.classList.remove('border-rose-500');
  }
  if (durInput) {
    durInput.value = defaults.duration;
  }
  updateLegDurationSubtext(defaults.duration);

  updateLegDialogUiMode();
  onLegTypeChange();
  renderLegReorderList();
  switchLegModalTab('edit');
  validateLegEditorForm();
  if (existingCitySelect && typeof existingCitySelect.focus === 'function') {
    existingCitySelect.focus();
  }
}


function onEditLegSelectionChange() {
  const editSelect = document.getElementById('editLegSelect');
  const rawVal = editSelect?.value;
  if (!rawVal || rawVal === 'ADD_NEW') {
    resetLegDialogToAddNew();
    return;
  }
  const selected = Number(rawVal);
  if (!Number.isFinite(selected)) {
    resetLegDialogToAddNew();
    return;
  }
  const sourceLegs = (legDialogState && Array.isArray(legDialogState.stagedLegs) && legDialogState.stagedLegs.length > 0)
    ? legDialogState.stagedLegs
    : (appData || []);
  if (legDialogState && (!Array.isArray(legDialogState.stagedLegs) || legDialogState.stagedLegs.length === 0)) {
    legDialogState.stagedLegs = JSON.parse(JSON.stringify(sourceLegs));
  }
  const leg = sourceLegs?.[selected];
  if (!leg) return;
  legDialogState.mode = 'edit';
  legDialogState.isAddingNewLeg = false;
  legDialogState.editLegIdx = selected;

  const firstDay = leg.days?.[0] || {};
  const lastDay = leg.days?.[leg.days.length - 1] || firstDay;
  const normalizedLabel = String(leg.label || '').toLowerCase();

  // Extract already-entered city from and city to
  const rawFrom = firstDay.from || (leg.days || []).find(d => d && d.from)?.from || '';
  const rawTo = firstDay.to || (leg.days || []).find(d => d && d.to)?.to || '';

  // Resolve valid city from leg properties
  const legCityObj = (leg.cityId && typeof citiesData !== 'undefined' ? citiesData.find(c => c.id === leg.cityId) : null) ||
    (leg.cityFood?.[0]?.cityId && typeof citiesData !== 'undefined' ? citiesData.find(c => c.id === leg.cityFood[0].cityId) : null) ||
    (leg.suggestedActivities?.[0]?.cityId && typeof citiesData !== 'undefined' ? citiesData.find(c => c.id === leg.suggestedActivities[0].cityId) : null) ||
    (leg.legTips?.[0]?.cityId && typeof citiesData !== 'undefined' ? citiesData.find(c => c.id === leg.legTips[0].cityId) : null) ||
    (typeof getCityByName === 'function' ? (getCityByName(rawTo) || getCityByName(rawFrom) || getCityByName(leg.label)) : null);
  const resolvedCityName = legCityObj ? legCityObj.name : '';

  let legType = leg.type;
  if (!legType) {
    if (normalizedLabel.includes('start') || normalizedLabel.includes('departure') || String(leg.id || '').endsWith('-start')) legType = 'start';
    else if (normalizedLabel.includes('return') || normalizedLabel.includes('finish') || String(leg.id || '').endsWith('-finish')) legType = 'return';
    else if (firstDay.date && lastDay.date && firstDay.date === lastDay.date) legType = 'transit';
    else if (normalizedLabel.startsWith('✈️') || normalizedLabel.includes(' to ') || normalizedLabel.includes('transit') || normalizedLabel.includes('travel')) legType = 'transit';
    else legType = 'city';
  } else if (legType !== 'start' && legType !== 'return') {
    if (firstDay.date && lastDay.date && firstDay.date === lastDay.date) legType = 'transit';
    else if (firstDay.date && lastDay.date && firstDay.date < lastDay.date) legType = 'city';
  }

  const legTypeSelect = document.getElementById('legTypeSelect');
  if (legTypeSelect) legTypeSelect.value = legType;
  const fromCitySelect = document.getElementById('fromCitySelect');
  const toCitySelect = document.getElementById('toCitySelect');
  const existingCitySelect = document.getElementById('existingCitySelect');
  const newCityName = document.getElementById('newLegCityName');
  const newCityInline = document.getElementById('newCityInlineGroup');
  const toggleNewCityBtn = document.getElementById('toggleNewCityBtn');
  const dateFrom = document.getElementById('newLegStartDate');
  const dateTo = document.getElementById('newLegEndDate');
  const durInput = document.getElementById('legDurationNights');
  const dayNotesInput = document.getElementById('legDayNotesInput');

  if (newCityInline) newCityInline.style.display = 'none';
  if (toggleNewCityBtn) toggleNewCityBtn.textContent = '+ Add a new city';

  // Populate city from and city to dropdowns if already entered
  if (legType === 'start') {
    setSelectValueMatchingCity(fromCitySelect, 'Home', 'Home');
    setSelectValueMatchingCity(toCitySelect, resolvedCityName || rawTo, '');
    setSelectValueMatchingCity(existingCitySelect, resolvedCityName || rawTo, '');
  } else if (legType === 'return') {
    setSelectValueMatchingCity(fromCitySelect, resolvedCityName || rawFrom, 'Home');
    setSelectValueMatchingCity(toCitySelect, 'Home', 'Home');
    setSelectValueMatchingCity(existingCitySelect, 'Home', 'Home');
  } else if (legType === 'travel') {
    setSelectValueMatchingCity(fromCitySelect, rawFrom || 'Home', 'Home');
    setSelectValueMatchingCity(toCitySelect, resolvedCityName || rawTo, '');
    setSelectValueMatchingCity(existingCitySelect, resolvedCityName || rawTo, '');
  } else {
    // standard destination city or transit stop
    const homeCityName = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : 'Home';
    const inferredPriorCity = getPriorLegCity(sourceLegs, selected, homeCityName);
    const destCity = resolvedCityName || rawTo || rawFrom;

    setSelectValueMatchingCity(existingCitySelect, destCity, '');
    setSelectValueMatchingCity(fromCitySelect, rawFrom || inferredPriorCity || destCity, 'Home');
    setSelectValueMatchingCity(toCitySelect, destCity || '', '');
    updateLegOriginHelperUI(inferredPriorCity);
  }

  // Ensure appropriate selection groups and labels are displayed for the leg type
  onLegTypeChange();
  if (legType !== 'city' && legType !== 'transit') {
    updateLegOriginHelperUI('');
  }

  if (newCityName) newCityName.value = '';
  if (dateFrom) {
    dateFrom.value = firstDay.date || '';
    dateFrom.classList.remove('border-rose-500');
  }
  if (dateTo) {
    dateTo.value = lastDay.date || '';
    dateTo.classList.remove('border-rose-500');
  }
  const isSameDay = Boolean(firstDay.date && lastDay.date && firstDay.date === lastDay.date);
  const daysCount = (leg.days || []).length;
  const durVal = isSameDay ? 0 : Math.max(0, daysCount > 1 ? daysCount - 1 : 0);
  if (durInput) {
    durInput.value = durVal;
  }
  updateLegDurationSubtext(durVal);

  if (dayNotesInput) {
    dayNotesInput.value = (leg.days || [])
      .map(day => String(day?.desc || '').trim())
      .join('\n');
  }
  updateLegDialogUiMode();
  renderLegReorderList();
  validateLegEditorForm();
}


function updateLegDurationSubtext(nights) {
  const subtext = document.getElementById('legDurationSubtext');
  if (!subtext) return;
  const n = Math.max(0, Number(nights) || 0);
  if (n === 0) {
    subtext.textContent = '0 nights • ✈️ Transit (same-day stop)';
  } else if (n === 1) {
    subtext.textContent = '1 night';
  } else {
    subtext.textContent = `${n} nights`;
  }
}
if (typeof window !== 'undefined') window.updateLegDurationSubtext = updateLegDurationSubtext;


function stepLegDuration(delta) {
  const durationInput = document.getElementById('legDurationNights');
  const current = Math.max(0, (Number(durationInput?.value) || 0) + delta);
  if (durationInput) durationInput.value = current;
  updateLegDurationSubtext(current);
  onLegDurationInputChange();
}


function onLegDurationInputChange() {
  const startDateInput = document.getElementById('newLegStartDate');
  const endDateInput = document.getElementById('newLegEndDate');
  const durationInput = document.getElementById('legDurationNights');
  if (!startDateInput || !endDateInput || !durationInput) return;

  const start = startDateInput.value;
  const rawDur = Number(durationInput.value);
  const dur = Math.max(0, Number.isFinite(rawDur) ? rawDur : 0);
  if (start && typeof addDaysToIsoDate === 'function') {
    endDateInput.value = addDaysToIsoDate(start, dur);
  }
  updateLegDurationSubtext(dur);

  const legTypeSelect = document.getElementById('legTypeSelect');
  const legState = getLegDialogState();
  const isEditingTerminal = legState.mode === 'edit' && Number.isFinite(legState.editLegIdx) && legState.stagedLegs?.[legState.editLegIdx] && isTerminalLeg(legState.stagedLegs[legState.editLegIdx]);
  if (!isEditingTerminal && legTypeSelect) {
    legTypeSelect.value = dur === 0 ? 'transit' : 'city';
  }

  onLegDateInputChange();
}


function onLegStartDateChange() {
  const startDateInput = document.getElementById('newLegStartDate');
  const endDateInput = document.getElementById('newLegEndDate');
  const durationInput = document.getElementById('legDurationNights');
  if (!startDateInput || !endDateInput) return;

  const start = startDateInput.value;
  const rawDur = Number(durationInput?.value);
  const dur = Math.max(0, Number.isFinite(rawDur) ? rawDur : 3);
  if (start && typeof addDaysToIsoDate === 'function') {
    endDateInput.value = addDaysToIsoDate(start, dur);
  }
  updateLegDurationSubtext(dur);

  const legTypeSelect = document.getElementById('legTypeSelect');
  const legState = getLegDialogState();
  const isEditingTerminal = legState.mode === 'edit' && Number.isFinite(legState.editLegIdx) && legState.stagedLegs?.[legState.editLegIdx] && isTerminalLeg(legState.stagedLegs[legState.editLegIdx]);
  if (!isEditingTerminal && legTypeSelect) {
    legTypeSelect.value = dur === 0 ? 'transit' : 'city';
  }

  onLegDateInputChange();
}


function onLegEndDateChange() {
  const startDateInput = document.getElementById('newLegStartDate');
  const endDateInput = document.getElementById('newLegEndDate');
  const durationInput = document.getElementById('legDurationNights');
  if (!startDateInput || !endDateInput) return;

  const start = startDateInput.value;
  const end = endDateInput.value;
  let diffDays = 0;
  if (start && end && end >= start) {
    const t1 = new Date(`${start}T00:00:00`).getTime();
    const t2 = new Date(`${end}T00:00:00`).getTime();
    diffDays = Math.max(0, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
    if (durationInput) durationInput.value = diffDays;
  }
  updateLegDurationSubtext(diffDays);

  const legTypeSelect = document.getElementById('legTypeSelect');
  const legState = getLegDialogState();
  const isEditingTerminal = legState.mode === 'edit' && Number.isFinite(legState.editLegIdx) && legState.stagedLegs?.[legState.editLegIdx] && isTerminalLeg(legState.stagedLegs[legState.editLegIdx]);
  if (!isEditingTerminal && legTypeSelect) {
    legTypeSelect.value = diffDays === 0 ? 'transit' : 'city';
  }

  onLegDateInputChange();
}


function onLegPlacementChange() {
  const placementSelect = document.getElementById('legPlacementSelect');
  if (!placementSelect) return;
  const val = placementSelect.value;
  const defaults = getPlacementDefaultDates(val);

  const startDateInput = document.getElementById('newLegStartDate');
  const endDateInput = document.getElementById('newLegEndDate');
  const durationInput = document.getElementById('legDurationNights');

  const dur = Math.max(0, Number(durationInput?.value) || defaults.duration);
  if (startDateInput) startDateInput.value = defaults.startDate;
  if (endDateInput && typeof addDaysToIsoDate === 'function') {
    endDateInput.value = addDaysToIsoDate(defaults.startDate, dur);
  }
  updateLegDurationSubtext(dur);
  onLegDateInputChange();
}


function toggleNewCityInline() {
  const inlineGroup = document.getElementById('newCityInlineGroup');
  const toggleBtn = document.getElementById('toggleNewCityBtn');
  const existingSelect = document.getElementById('existingCitySelect');
  const nameInput = document.getElementById('newLegCityName');

  if (!inlineGroup) return;
  if (inlineGroup.style.display === 'none' || !inlineGroup.style.display) {
    inlineGroup.style.display = 'flex';
    if (toggleBtn) toggleBtn.textContent = '✕ Choose Existing City';
    if (existingSelect) existingSelect.value = '';
    if (nameInput) nameInput.focus();
  } else {
    inlineGroup.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '+ Add a new city';
    if (nameInput) nameInput.value = '';
  }
}


function onExistingCitySelectChange() {
  const existingSelect = document.getElementById('existingCitySelect');
  const inlineGroup = document.getElementById('newCityInlineGroup');
  const toggleBtn = document.getElementById('toggleNewCityBtn');
  const nameInput = document.getElementById('newLegCityName');

  if (existingSelect && existingSelect.value) {
    if (inlineGroup) inlineGroup.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '+ Add a new city';
    if (nameInput) nameInput.value = '';
  }
}


function syncFormInputsFromStagedLeg() {
  if (legDialogState.mode !== 'edit' || !Number.isFinite(legDialogState.editLegIdx)) return;
  const sourceLegs = (legDialogState && Array.isArray(legDialogState.stagedLegs))
    ? legDialogState.stagedLegs
    : (appData || []);
  const leg = sourceLegs?.[legDialogState.editLegIdx];
  if (!leg) return;

  const firstDay = leg.days?.[0] || {};
  const lastDay = leg.days?.[leg.days.length - 1] || firstDay;
  const dateFrom = document.getElementById('newLegStartDate');
  const dateTo = document.getElementById('newLegEndDate');
  if (dateFrom && firstDay.date) dateFrom.value = firstDay.date;
  if (dateTo && lastDay.date) dateTo.value = lastDay.date;
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
  setLegDialogState({ mode: 'add', isAddingNewLeg: false, editLegIdx: null, stagedLegs: [], originalLegDates: {} });

  // Clear form inputs
  const existingCitySelect = document.getElementById('existingCitySelect');
  const newCityName = document.getElementById('newLegCityName');
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const countryOther = document.getElementById('newLegCityCountryOther');
  const newCityInline = document.getElementById('newCityInlineGroup');
  const toggleNewCityBtn = document.getElementById('toggleNewCityBtn');
  const fromDate = document.getElementById('newLegStartDate');
  const toDate = document.getElementById('newLegEndDate');
  const durInput = document.getElementById('legDurationNights');
  const editLegSelect = document.getElementById('editLegSelect');
  const dayNotesInput = document.getElementById('legDayNotesInput');
  const warningBanner = document.getElementById('legClashWarningBanner');

  if (existingCitySelect) existingCitySelect.value = '';
  if (newCityName) newCityName.value = '';
  if (countrySelect) countrySelect.value = '';
  if (countryOther) {
    countryOther.value = '';
    countryOther.style.display = 'none';
  }
  if (newCityInline) newCityInline.style.display = 'none';
  if (toggleNewCityBtn) toggleNewCityBtn.textContent = '+ Add a new city';
  if (fromDate) {
    fromDate.value = '';
    fromDate.classList.remove('border-rose-500');
  }
  if (toDate) {
    toDate.value = '';
    toDate.classList.remove('border-rose-500');
  }
  if (durInput) durInput.value = '3';
  if (editLegSelect) editLegSelect.value = '';
  if (dayNotesInput) dayNotesInput.value = '';
  if (warningBanner) warningBanner.style.display = 'none';
  const terminalBanner = document.getElementById('legTerminalWarningBanner');
  if (terminalBanner) terminalBanner.style.display = 'none';
  updateLegDialogUiMode();
}


function renderLegReorderList() {
  const container = document.getElementById('legReorderList');
  if (!container) return;

  const legs = (legDialogState && Array.isArray(legDialogState.stagedLegs))
    ? legDialogState.stagedLegs
    : (appData || []);

  const terminalBanner = document.getElementById('legTerminalWarningBanner');
  const terminalMsg = document.getElementById('legTerminalWarningMsg');
  if (terminalBanner && terminalMsg) {
    let warning = '';
    const hasStart = legs.length > 0 && (legs[0].type === 'start' || (typeof isTerminalLeg === 'function' && isTerminalLeg(legs[0])));
    const hasReturn = legs.length > 1 && (legs[legs.length - 1].type === 'return' || (typeof isTerminalLeg === 'function' && isTerminalLeg(legs[legs.length - 1])));
    if (!hasStart) {
      warning = 'Trip start leg missing: First leg should depart from Home.';
    } else if (!hasReturn && legs.length > 1) {
      warning = 'Trip finish leg missing: Final leg should return to Home.';
    }
    if (warning) {
      terminalMsg.textContent = warning;
      terminalBanner.style.display = 'flex';
    } else {
      terminalBanner.style.display = 'none';
    }
  }

  if (!Array.isArray(legs) || legs.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 italic p-2 text-center">No legs added yet</div>`;
    return;
  }

  let html = '';
  legs.forEach((leg, idx) => {
    const daysCount = Array.isArray(leg.days) ? leg.days.length : 0;
    const firstDay = leg.days?.[0]?.date || '';
    const lastDay = leg.days?.[daysCount - 1]?.date || firstDay;
    const dateRangeStr = firstDay
      ? (firstDay === lastDay ? firstDay : `${firstDay} → ${lastDay}`)
      : 'No dates';
    const nightsStr = daysCount > 1
      ? `${daysCount - 1} night${daysCount > 2 ? 's' : ''}`
      : (daysCount === 1 ? (leg.type === 'transit' ? '✈️ Transit (same day)' : '1 day') : '0 days');
    const isEditing = legDialogState.mode === 'edit' && legDialogState.editLegIdx === idx;
    const terminal = typeof isTerminalLeg === 'function' ? isTerminalLeg(leg) : (idx === 0 || idx === legs.length - 1);
    const isSameDay = daysCount === 1 || (daysCount > 1 && firstDay && lastDay && firstDay === lastDay);
    const isTransit = !terminal && (leg.type === 'transit' || isSameDay || (leg.label || '').toLowerCase().includes('transit'));

    let displayLabel = (leg.label || 'Untitled leg').trim();
    if (isTransit) {
      if (!/<transit>/i.test(displayLabel) && !/\(transit\)/i.test(displayLabel)) {
        displayLabel = `${displayLabel} <Transit>`;
      } else if (/\(transit\)/i.test(displayLabel)) {
        displayLabel = displayLabel.replace(/\s*\(transit\)/i, ' <Transit>');
      }
    }
    const safeLabel = typeof escapeHtmlText === 'function' ? escapeHtmlText(displayLabel) : displayLabel;
    const isFirst = idx === 0;
    const isLast = idx === legs.length - 1;
    const isLocked = terminal && (isFirst || isLast);

    html += `
      <div class="leg-reorder-item flex items-center justify-between gap-2 p-2 ${isEditing ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} rounded-lg border shadow-xs ${isLocked ? 'cursor-default' : 'cursor-grab'} select-none hover:border-teal-500 dark:hover:border-teal-400 transition-colors"
           draggable="${!isLocked}"
           data-leg-index="${idx}"
           ${isLocked ? '' : `ondragstart="handleLegDragStart(event, ${idx})"`}
           ondragover="handleLegDragOver(event, ${idx})"
           ondragleave="handleLegDragLeave(event)"
           ondrop="handleLegDrop(event, ${idx})"
           ${isLocked ? '' : `ondragend="handleLegDragEnd(event)"`}>
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="leg-drag-handle ${isLocked ? 'opacity-40 cursor-default' : 'cursor-grab'} text-slate-400 dark:text-slate-500 text-sm font-mono px-1 touch-none" title="${isLocked ? 'Terminal leg — position is fixed' : 'Drag to reorder'}">${isLocked ? '🔒' : '⋮⋮'}</span>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">${idx + 1}. ${safeLabel}${isEditing ? ' <span class="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">(Editing)</span>' : ''}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">${dateRangeStr} • ${nightsStr}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" class="px-2 py-0.5 text-xs rounded bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-medium cursor-pointer"
                  onclick="editLegDirectFromReorder(${idx})" title="Edit leg details">✏️ Edit</button>
          <button type="button" class="px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 ${(idx === 0 || isLocked) ? 'opacity-30 cursor-not-allowed' : ''}"
                  onclick="moveLegInSequence(${idx}, ${idx - 1})" ${(idx === 0 || isLocked) ? 'disabled' : ''} title="Move up">▲</button>
          <button type="button" class="px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 ${(idx === legs.length - 1 || isLocked) ? 'opacity-30 cursor-not-allowed' : ''}"
                  onclick="moveLegInSequence(${idx}, ${idx + 1})" ${(idx === legs.length - 1 || isLocked) ? 'disabled' : ''} title="Move down">▼</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  if (typeof setupMobileTouchLegReordering === 'function') {
    setupMobileTouchLegReordering(container);
  }
}


function moveLegInSequence(fromIdx, toIdx) {
  const legState = getLegDialogState();
  if (!legState || !Array.isArray(legState.stagedLegs)) return;
  const legs = legState.stagedLegs;
  if (fromIdx < 0 || fromIdx >= legs.length || toIdx < 0 || toIdx >= legs.length) return;
  if (fromIdx === toIdx) return;

  // Guard: prevent moving terminal legs
  const movingLeg = legs[fromIdx];
  if (typeof isTerminalLeg === 'function' && isTerminalLeg(movingLeg) && (fromIdx === 0 || fromIdx === legs.length - 1)) {
    if (typeof showToast === 'function') showToast('Trip start and finish legs cannot be reordered.', 'warning');
    return;
  }
  // Guard: prevent moving other legs into position 0 or last if those are terminal legs
  if (toIdx === 0 && typeof isTerminalLeg === 'function' && isTerminalLeg(legs[0])) {
    if (typeof showToast === 'function') showToast('Trip start leg must remain at position 1.', 'warning');
    return;
  }
  if (toIdx === legs.length - 1 && typeof isTerminalLeg === 'function' && isTerminalLeg(legs[legs.length - 1])) {
    if (typeof showToast === 'function') showToast('Trip finish leg must remain at the final position.', 'warning');
    return;
  }

  const [movedLeg] = legs.splice(fromIdx, 1);
  legs.splice(toIdx, 0, movedLeg);

  if (legState.mode === 'edit' && Number.isFinite(legState.editLegIdx)) {
    if (legState.editLegIdx === fromIdx) {
      legState.editLegIdx = toIdx;
    } else if (fromIdx < legState.editLegIdx && toIdx >= legState.editLegIdx) {
      legState.editLegIdx--;
    } else if (fromIdx > legState.editLegIdx && toIdx <= legState.editLegIdx) {
      legState.editLegIdx++;
    }
  }

  const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
  if (cascadeCheckbox && cascadeCheckbox.checked) {
    cascadeStagedLegDates(1);
  }

  renderLegReorderList();
  if (typeof _populateAddLegCityDropdowns === 'function') {
    _populateAddLegCityDropdowns();
  }
  const editSelect = document.getElementById('editLegSelect');
  if (editSelect && legState.mode === 'edit') {
    editSelect.value = String(legState.editLegIdx);
  }
  syncFormInputsFromStagedLeg();
  validateLegEditorForm();
  // Strictly isolated to modal state: no premature saveData() or live mutation
}


function switchLegModalTab(tabName) {
  const reorderBtn = document.getElementById('legTabReorderBtn');
  const editBtn = document.getElementById('legTabEditBtn');
  const reorderSec = document.getElementById('legReorderSection');
  const editSec = document.getElementById('legEditSection');
  const modalTitle = document.getElementById('legDialogTitle');

  const activeBtnClasses = 'flex-1 py-2 px-3 text-center font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-sm bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 border border-slate-200/80 dark:border-slate-600 cursor-pointer';
  const inactiveBtnClasses = 'flex-1 py-2 px-3 text-center font-semibold text-xs sm:text-sm rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent cursor-pointer';

  if (tabName === 'reorder') {
    if (reorderBtn) {
      reorderBtn.className = activeBtnClasses;
      reorderBtn.setAttribute('aria-selected', 'true');
    }
    if (editBtn) {
      editBtn.className = inactiveBtnClasses;
      editBtn.setAttribute('aria-selected', 'false');
    }
    if (reorderSec) reorderSec.style.display = 'block';
    if (editSec) editSec.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Trip Route & Sequence';
    renderLegReorderList();
  } else {
    if (editBtn) {
      editBtn.className = activeBtnClasses;
      editBtn.setAttribute('aria-selected', 'true');
    }
    if (reorderBtn) {
      reorderBtn.className = inactiveBtnClasses;
      reorderBtn.setAttribute('aria-selected', 'false');
    }
    if (reorderSec) reorderSec.style.display = 'none';
    if (editSec) editSec.style.display = 'block';
    if (modalTitle) modalTitle.textContent = (legDialogState && legDialogState.mode === 'edit') ? 'Edit Trip Leg' : 'Add New Trip Leg';
    validateLegEditorForm();
  }
}


function editLegDirectFromReorder(idx) {
  switchLegModalTab('edit');
  const editSelect = document.getElementById('editLegSelect');
  if (editSelect) {
    editSelect.value = String(idx);
    onEditLegSelectionChange();
  }
}


function onLegDateInputChange() {
  const startDateInput = document.getElementById('newLegStartDate');
  const endDateInput = document.getElementById('newLegEndDate');
  const startDate = startDateInput?.value;
  const endDate = endDateInput?.value;
  const legState = getLegDialogState();

  if (legState.mode === 'edit' && Number.isFinite(legState.editLegIdx) && Array.isArray(legState.stagedLegs)) {
    const leg = legState.stagedLegs[legState.editLegIdx];
    if (leg && startDate && endDate && startDate <= endDate) {
      const dayNotes = parseLegDayNotes();
      const firstDay = leg.days?.[0] || {};
      const newDays = buildLegDaysWithNotes({
        dateFrom: startDate,
        dateTo: endDate,
        fromCity: firstDay.from || leg.label || 'Home',
        toCity: firstDay.to || leg.label || 'Home',
        legType: 'city',
        dayNotes: dayNotes
      });
      leg.days = newDays;

      const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
      if (cascadeCheckbox && cascadeCheckbox.checked) {
        cascadeStagedLegDates(legState.editLegIdx + 1);
      }
      renderLegReorderList();
    }
  }
  validateLegEditorForm();
}


function onLegCascadeToggleChange() {
  const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
  const legState = getLegDialogState();
  if (cascadeCheckbox && cascadeCheckbox.checked && Array.isArray(legState.stagedLegs) && legState.stagedLegs.length > 1) {
    cascadeStagedLegDates(1);
    renderLegReorderList();
    syncFormInputsFromStagedLeg();
  }
  validateLegEditorForm();
}


function validateLegEditorForm() {
  const doc = (typeof window !== 'undefined' && window.document)
    ? window.document
    : ((typeof global !== 'undefined' && global.document)
      ? global.document
      : (typeof document !== 'undefined' ? document : null));
  const startDateInput = doc ? doc.getElementById('newLegStartDate') : null;
  const endDateInput = doc ? doc.getElementById('newLegEndDate') : null;
  const warningBanner = doc ? doc.getElementById('legClashWarningBanner') : null;
  const warningMessage = doc ? doc.getElementById('legClashWarningMessage') : null;
  const saveBtn = doc ? doc.getElementById('legDialogSaveBtn') : null;

  if (!startDateInput || !endDateInput) return true;

  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const currentLegState = getLegDialogState();
  const isEdit = currentLegState.mode === 'edit' && Number.isFinite(currentLegState.editLegIdx);
  const currentEditingIdx = isEdit ? currentLegState.editLegIdx : null;
  const stagedLegs = Array.isArray(currentLegState.stagedLegs) ? currentLegState.stagedLegs : (appData || []);

  startDateInput.classList.remove('border-rose-500');
  endDateInput.classList.remove('border-rose-500');

  let clashText = '';

  // 1. Inverted date range
  if (startDate && endDate && startDate > endDate) {
    clashText = `End date (${endDate}) cannot be earlier than start date (${startDate}).`;
    endDateInput.classList.add('border-rose-500');
  }

  // 2. Overlapping date check
  if (!clashText && startDate && endDate && Array.isArray(stagedLegs)) {
    const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
    const isCascadeEnabled = cascadeCheckbox ? cascadeCheckbox.checked : true;
    const placementSelect = document.getElementById('legPlacementSelect');
    const placementVal = placementSelect?.value || 'before_return';

    let skipIndexStart = -1;
    if (isCascadeEnabled) {
      if (isEdit && Number.isFinite(currentEditingIdx)) {
        skipIndexStart = currentEditingIdx + 1;
      } else if (!isEdit) {
        if (placementVal === 'before_return') {
          const retIdx = stagedLegs.findIndex(l => {
            const lbl = (l.label || '').toLowerCase();
            return lbl.includes('return') || lbl.includes('trip finish');
          });
          if (retIdx >= 0) skipIndexStart = retIdx;
        } else if (placementVal.startsWith('after_')) {
          const afterIdx = Number(placementVal.replace('after_', ''));
          if (Number.isFinite(afterIdx)) skipIndexStart = afterIdx + 1;
        } else if (placementVal === 'start') {
          skipIndexStart = 0;
        }
      }
    }

    for (let i = 0; i < stagedLegs.length; i++) {
      if (currentEditingIdx !== null && i === currentEditingIdx) continue;
      if (skipIndexStart >= 0 && i >= skipIndexStart) continue;

      const otherLeg = stagedLegs[i];
      if (!otherLeg.days || otherLeg.days.length === 0) continue;

      const otherStart = otherLeg.days[0].date;
      const otherEnd = otherLeg.days[otherLeg.days.length - 1].date;

      if (otherStart && otherEnd && checkLegDateClash(startDate, endDate, otherStart, otherEnd)) {
        clashText = `Date range (${startDate} to ${endDate}) overlaps with Leg '${otherLeg.label || ('Leg ' + (i + 1))}' (${otherStart} to ${otherEnd}).`;
        startDateInput.classList.add('border-rose-500');
        endDateInput.classList.add('border-rose-500');
        break;
      }
    }
  }

  // 3. Chronological inversion if auto-cascade is disabled
  const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
  const isCascadeEnabled = cascadeCheckbox ? cascadeCheckbox.checked : true;

  if (!clashText && !isCascadeEnabled && Array.isArray(stagedLegs) && stagedLegs.length > 1) {
    for (let i = 0; i < stagedLegs.length - 1; i++) {
      const legA = stagedLegs[i];
      const legB = stagedLegs[i + 1];
      const startA = (currentEditingIdx === i && startDate) ? startDate : legA.days?.[0]?.date;
      const startB = (currentEditingIdx === i + 1 && startDate) ? startDate : legB.days?.[0]?.date;

      if (startA && startB && startA > startB) {
        clashText = `Chronological inversion: Leg ${i + 1} (${legA.label || 'Leg ' + (i + 1)}) date (${startA}) is after Leg ${i + 2} (${legB.label || 'Leg ' + (i + 2)}) date (${startB}).`;
        break;
      }
    }
  }

  if (clashText) {
    if (warningMessage) warningMessage.textContent = clashText;
    if (warningBanner) warningBanner.style.display = 'flex';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    return false;
  } else {
    if (warningBanner) warningBanner.style.display = 'none';
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    return true;
  }
}


function onLegTypeChange() {
  const type = document.getElementById('legTypeSelect')?.value || 'city';
  const citySection = document.getElementById('citySelectionGroup');
  const routeSection = document.getElementById('routeSelectionGroup');
  const datesLabel = document.getElementById('datesLabel');
  const isRouteType = type === 'travel' || type === 'start' || type === 'return';
  const isCityType = type === 'city' || type === 'transit';
  if (citySection) citySection.style.display = isCityType ? 'block' : 'none';
  if (routeSection) routeSection.style.display = isRouteType ? 'block' : 'none';
  if (datesLabel) datesLabel.textContent = type === 'transit' ? 'Transit Date' : (isRouteType ? 'Journey Date Range' : 'Dates in City');

  const fromCitySelect = document.getElementById('fromCitySelect');
  const toCitySelect = document.getElementById('toCitySelect');
  if (type === 'start') {
    if (fromCitySelect) {
      setSelectValueMatchingCity(fromCitySelect, 'Home', 'Home');
      fromCitySelect.disabled = true;
    }
    if (toCitySelect) toCitySelect.disabled = false;
  } else if (type === 'return') {
    if (toCitySelect) {
      setSelectValueMatchingCity(toCitySelect, 'Home', 'Home');
      toCitySelect.disabled = true;
    }
    if (fromCitySelect) fromCitySelect.disabled = false;
  } else {
    if (fromCitySelect) fromCitySelect.disabled = false;
    if (toCitySelect) toCitySelect.disabled = false;
  }
}


function confirmAddLeg() {
  if (!validateLegEditorForm()) {
    return;
  }

  const dateFrom = document.getElementById('newLegStartDate')?.value;
  const dateTo = document.getElementById('newLegEndDate')?.value;
  const dayNotes = parseLegDayNotes();
  const isSameDay = Boolean(dateFrom && dateTo && dateFrom === dateTo);

  const isEdit = legDialogState.mode === 'edit' && Number.isFinite(legDialogState.editLegIdx);

  if (isEdit && Array.isArray(legDialogState.stagedLegs) && legDialogState.stagedLegs[legDialogState.editLegIdx]) {
    const target = legDialogState.stagedLegs[legDialogState.editLegIdx];

    // Automatically infer legType: terminal start/return or transit (0 nights) or city (1+ nights)
    let legType = 'city';
    if (isTerminalLeg(target)) {
      const lid = String(target.id || '').toLowerCase();
      const lbl = String(target.label || '').toLowerCase();
      legType = (target.type === 'return' || lid.endsWith('-finish') || lbl.includes('finish') || lbl.includes('return')) ? 'return' : 'start';
    } else {
      legType = isSameDay ? 'transit' : 'city';
    }
    target.type = legType;

    // --- Determine fromCity, toCity, and label based on legType (mirrors "add new" branch) ---
    let fromCity, toCity;
    const selectedFrom = document.getElementById('fromCitySelect')?.value;
    const selectedTo = document.getElementById('toCitySelect')?.value || document.getElementById('existingCitySelect')?.value;
    const homeCityName = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : 'Home';

    if (legType === 'start') {
      fromCity = homeCityName;
      const rawDest = selectedTo || 'Home';
      const cleanDest = (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(rawDest) : rawDest.replace(/[^\x00-\x7F]/g, '').trim()) || rawDest;
      toCity = cleanDest;
      target.label = `${homeCityName} (Trip Start)`;
    } else if (legType === 'return') {
      const rawOrig = selectedFrom || 'Home';
      const cleanOrig = (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(rawOrig) : rawOrig.replace(/[^\x00-\x7F]/g, '').trim()) || rawOrig;
      fromCity = cleanOrig;
      toCity = homeCityName;
      target.label = `${homeCityName} (Trip Finish)`;
    } else if (legType === 'travel') {
      fromCity = selectedFrom || homeCityName;
      toCity = selectedTo || '';
      if (!toCity) {
        alert('Please choose a destination city for this travel leg.');
        return;
      }
      target.label = `✈️ ${fromCity} to ${toCity}`;
    } else {
      // legType === 'city' or 'transit'
      const existingCity = selectedTo;
      const cityObj = (existingCity && existingCity !== 'Home') ? (typeof getCityByName === 'function' ? getCityByName(existingCity) : null) : null;
      let validCityName = cityObj ? cityObj.name : ((existingCity && existingCity !== 'Home') ? existingCity : '');
      if (!validCityName) {
        validCityName = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(target.label) : String(target.label || '').replace(/\s*\([^)]*\)/g, '').replace(/[^\x00-\x7F]/g, '').trim();
      }

      const inferredPriorCity = getPriorLegCity(legDialogState.stagedLegs, legDialogState.editLegIdx, homeCityName);

      if (validCityName) {
        const flag = typeof getCityFlag === 'function' ? getCityFlag(validCityName) : '📍';
        target.label = legType === 'transit' ? `${flag} ${validCityName} (Transit)` : `${flag} ${validCityName}`;
        fromCity = inferredPriorCity || validCityName;
        toCity = validCityName;
        if (cityObj) target.cityId = cityObj.id;
      } else {
        const firstDay = target.days?.[0] || {};
        const cleanVal = (val) => String(val || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*\(\d+\)$/, '').trim();
        fromCity = cleanVal(selectedFrom || inferredPriorCity || firstDay.from || target.label);
        toCity = cleanVal(existingCity || firstDay.to || target.label);
      }
    }

    // --- Preserve existing day items before rebuilding days ---
    const oldDays = target.days ? target.days.slice() : [];

    target.days = buildLegDaysWithNotes({
      dateFrom: dateFrom || target.days?.[0]?.date,
      dateTo: dateTo || target.days?.[target.days.length - 1]?.date,
      fromCity: fromCity,
      toCity: toCity,
      legType: legType,
      dayNotes: dayNotes
    });

    // Merge back existing day items for matching dates
    target.days.forEach(newDay => {
      const oldDay = oldDays.find(od => od.date === newDay.date);
      if (oldDay) {
        if (oldDay.from) {
          const cleanFrom = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(oldDay.from) : oldDay.from;
          newDay.from = cleanFrom || oldDay.from;
        }
        if (oldDay.to) {
          const cleanTo = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(oldDay.to) : oldDay.to;
          newDay.to = cleanTo || oldDay.to;
        }
        if (oldDay.accomItems) newDay.accomItems = oldDay.accomItems;
        if (oldDay.activityItems) newDay.activityItems = oldDay.activityItems;
        if (oldDay.transportItems) newDay.transportItems = oldDay.transportItems;
        if (oldDay.notes) newDay.notes = oldDay.notes;
        if (typeof oldDay.completed !== 'undefined') newDay.completed = oldDay.completed;
        if (oldDay.desc && (!dayNotes || dayNotes.length === 0)) newDay.desc = oldDay.desc;
      }
    });

    const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
    if (cascadeCheckbox && cascadeCheckbox.checked) {
      cascadeStagedLegDates(legDialogState.editLegIdx + 1);
    }
  } else {
    // Adding a new leg: automatically infer transit (0 nights) or city (1+ nights)
    const legType = isSameDay ? 'transit' : 'city';
    let label, fromCity, toCity, matchedCityObj;
    const homeCityName = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : 'Home';

    if (legType === 'travel') {
      fromCity = document.getElementById('fromCitySelect')?.value || homeCityName;
      toCity = document.getElementById('toCitySelect')?.value || '';
      if (!toCity) {
        alert('Please choose a destination city for this travel leg.');
        return;
      }
      label = `✈️ ${fromCity} to ${toCity}`;
    } else {
      const existingCity = document.getElementById('existingCitySelect')?.value;
      const newCityName = document.getElementById('newLegCityName')?.value?.trim();

      if (newCityName) {
        const countrySelect = document.getElementById('newLegCityCountrySelect')?.value;
        const countryOther = document.getElementById('newLegCityCountryOther')?.value?.trim();
        let countryName = '';
        let countryCode = '';

        if (countrySelect && countrySelect !== 'OTHER') {
          const countryMatch = (typeof COUNTRY_DATA !== 'undefined') ? COUNTRY_DATA.find(c => c.code === countrySelect) : null;
          if (countryMatch) {
            countryName = countryMatch.name;
            countryCode = countryMatch.code;
          }
        } else if (countryOther) {
          countryName = countryOther;
        }

        const newCity = (typeof addOrUpdateCity === 'function') ? addOrUpdateCity(newCityName, countryName, '', '', '', countryCode) : null;
        if (newCity && typeof buildCityNav === 'function') {
          buildCityNav();
        }

        const flag = typeof getCityFlag === 'function' ? getCityFlag(newCityName) : '📍';
        label = legType === 'transit' ? `${flag} ${newCityName} (Transit)` : `${flag} ${newCityName}`;
        fromCity = newCityName;
        toCity = newCityName;
        if (newCity) matchedCityObj = newCity;
      } else if (existingCity && existingCity !== 'Home') {
        const cityObj = typeof getCityByName === 'function' ? getCityByName(existingCity) : null;
        const validCityName = cityObj ? cityObj.name : existingCity;
        const flag = typeof getCityFlag === 'function' ? getCityFlag(validCityName) : '📍';
        label = legType === 'transit' ? `${flag} ${validCityName} (Transit)` : `${flag} ${validCityName}`;
        fromCity = validCityName;
        toCity = validCityName;
        if (cityObj) matchedCityObj = cityObj;
      } else {
        label = legType === 'transit' ? '✈️ Transit Stop' : '📍 New City';
        fromCity = 'Home';
        toCity = 'Home';
      }
    }

    if (!Array.isArray(legDialogState.stagedLegs)) {
      legDialogState.stagedLegs = [];
    }

    const placementSelect = document.getElementById('legPlacementSelect');
    const placementVal = placementSelect?.value || 'before_return';
    let insertionIdx = legDialogState.stagedLegs.length;

    if (placementVal === 'before_return') {
      const retIdx = legDialogState.stagedLegs.findIndex(l => {
        const lbl = (l.label || '').toLowerCase();
        return lbl.includes('return') || lbl.includes('trip finish');
      });
      if (retIdx >= 0) insertionIdx = retIdx;
    } else if (placementVal.startsWith('after_')) {
      const afterIdx = Number(placementVal.replace('after_', ''));
      if (Number.isFinite(afterIdx)) insertionIdx = afterIdx + 1;
    } else if (placementVal === 'start') {
      insertionIdx = 0;
    }

    insertionIdx = Math.max(0, Math.min(insertionIdx, legDialogState.stagedLegs.length));

    if (legType === 'city' || legType === 'transit') {
      const inferredPriorCity = getPriorLegCity(legDialogState.stagedLegs, insertionIdx, homeCityName);
      fromCity = inferredPriorCity || toCity || 'Home';
    }

    const legPayload = {
      id: 'leg_' + Date.now(),
      type: legType,
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
    if (matchedCityObj && matchedCityObj.id) {
      legPayload.cityId = matchedCityObj.id;
    }

    legDialogState.stagedLegs.splice(insertionIdx, 0, legPayload);

    const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
    if (!cascadeCheckbox || cascadeCheckbox.checked) {
      cascadeStagedLegDates(insertionIdx + 1);
    }
  }

  // --- SYNCHRONIZE JOURNEYS AND STAYS BASED ON LEG DATE SHIFTS ---
  applyStagedLegsAndSync();

  // Keep dialog open for continued editing: re-sync state and rebuild mappings
  if (legDialogState) {
    const updatedOrigDates = {};
    (appData || []).forEach(leg => {
      if (leg && leg.id && Array.isArray(leg.days) && leg.days.length > 0) {
        updatedOrigDates[leg.id] = {
          startDate: leg.days[0].date,
          endDate: leg.days[leg.days.length - 1].date
        };
      }
    });
    legDialogState.originalLegDates = updatedOrigDates;
    legDialogState.stagedLegs = Array.isArray(appData) ? JSON.parse(JSON.stringify(appData)) : [];
  }

  if (typeof sortLegs === 'function') sortLegs();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildCityNav === 'function') buildCityNav();
  if (typeof buildTransportTab === 'function') buildTransportTab();
  if (typeof buildAccomTab === 'function') buildAccomTab();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
  if (typeof buildDesktopSplitMap === 'function') buildDesktopSplitMap();
  if (typeof saveData === 'function') saveData(false);
  if (typeof showToast === 'function') {
    showToast('Leg saved!');
  }

  // Refresh dialog UI and dropdowns for continuing editing
  if (typeof _populateAddLegCityDropdowns === 'function') {
    _populateAddLegCityDropdowns();
  }
  if (typeof renderLegReorderList === 'function') {
    renderLegReorderList();
  }
  validateLegEditorForm();
}


function applyStagedLegsAndSync() {
  if (!legDialogState || !Array.isArray(legDialogState.stagedLegs)) return;

  syncStaysAndJourneysFromDateChanges(legDialogState.originalLegDates, legDialogState.stagedLegs);

  // Commit stagedLegs to appData
  if (Array.isArray(appData)) {
    appData.length = 0;
    legDialogState.stagedLegs.forEach(leg => appData.push(leg));
  }
}


function confirmSaveLegSequence() {
  const legs = legDialogState?.stagedLegs;
  if (Array.isArray(legs) && legs.length > 0) {
    const first = legs[0];
    const last = legs[legs.length - 1];
    if (typeof isTerminalLeg === 'function') {
      if (!isTerminalLeg(first) || (first.type && first.type !== 'start')) {
        const proceed = confirm(`Warning: The first leg (${first.label || 'Leg 1'}) is not a Trip Start leg. Continue anyway?`);
        if (!proceed) return;
      }
      if (legs.length > 1 && (!isTerminalLeg(last) || (last.type && last.type !== 'return'))) {
        const proceed = confirm(`Warning: The final leg (${last.label || 'Last Leg'}) is not a Trip Finish leg. Continue anyway?`);
        if (!proceed) return;
      }
    }
  }

  const cascadeCheckbox = document.getElementById('legAutoCascadeCheckbox');
  if (cascadeCheckbox && cascadeCheckbox.checked && Array.isArray(legDialogState.stagedLegs) && legDialogState.stagedLegs.length > 0) {
    cascadeStagedLegDates(0);
  }

  applyStagedLegsAndSync();
  closeAddLegDialog();

  if (typeof rebuildTripFromLegs === 'function') {
    rebuildTripFromLegs({ showToast: true, message: 'Trip route sequence saved & itinerary rebuilt!' });
  } else if (typeof rebuildItineraryAndDataMappings === 'function') {
    rebuildItineraryAndDataMappings({ showToast: true, message: 'Trip route sequence saved & itinerary rebuilt!' });
  } else {
    if (typeof sortLegs === 'function') sortLegs();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildCityNav === 'function') buildCityNav();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
    if (typeof saveData === 'function') saveData(false);
    if (typeof syncAllLegDays === 'function') {
      syncAllLegDays(true);
    }
    if (typeof showToast === 'function') {
      showToast('Trip route sequence saved successfully!');
    }
  }
}


// Global & CommonJS Export Bridge
const _legDialogExports = {
  getLegDialogState,
  setLegDialogState,
  openLegEditorDialog,
  openLegEditorDirect,
  openAddLegDialog,
  closeAddLegDialog,
  _populateAddLegCityDropdowns,
  _populateLegPlacementDropdown,
  getPlacementDefaultDates,
  updateLegDialogUiMode,
  _syncLegDialogActions,
  updateLegOriginHelperUI,
  setSelectValueMatchingCity,
  resetLegDialogToAddNew,
  onEditLegSelectionChange,
  updateLegDurationSubtext,
  stepLegDuration,
  onLegDurationInputChange,
  onLegStartDateChange,
  onLegEndDateChange,
  onLegPlacementChange,
  toggleNewCityInline,
  onExistingCitySelectChange,
  syncFormInputsFromStagedLeg,
  deleteLegFromDialog,
  onNewLegCountryChange,
  renderLegReorderList,
  moveLegInSequence,
  switchLegModalTab,
  editLegDirectFromReorder,
  onLegDateInputChange,
  onLegCascadeToggleChange,
  validateLegEditorForm,
  onLegTypeChange,
  confirmAddLeg,
  applyStagedLegsAndSync,
  confirmSaveLegSequence
};

if (typeof window !== 'undefined') {
  Object.assign(window, _legDialogExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _legDialogExports;
}
