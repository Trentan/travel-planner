let isFunMode = false;
let isCompactView = false;
let isEditMode = true;

function saveUiSettings() {
  localStorage.setItem('travelApp_uiSettings_v1', JSON.stringify({
    isCompactView,
    isEditMode
  }));
}

function applyUiSettings() {
  let savedSettings = null;
  try {
    savedSettings = JSON.parse(localStorage.getItem('travelApp_uiSettings_v1') || 'null');
  } catch (e) {
    savedSettings = null;
  }

  if (savedSettings) {
    isFunMode = false;
    isCompactView = !!savedSettings.isCompactView;
    isEditMode = savedSettings.isEditMode !== false;
  }

  // Sync to window for cross-module access
  window.isFunMode = isFunMode;
  window.isCompactView = isCompactView;
  window.isEditMode = isEditMode;

  document.body.classList.toggle('fun-mode', isFunMode);
  document.body.classList.toggle('compact-view-mode', isCompactView);
  document.body.classList.toggle('read-only-mode', !isEditMode);

  const compactBtn = document.getElementById('compactToggleBtn');
  if (compactBtn) {
    compactBtn.innerHTML = isCompactView ? "Exit Compact" : "Compact View";
    compactBtn.classList.toggle('active-mode', isCompactView);
  }

  const editBtn = document.getElementById('editToggleBtn');
  if (editBtn) {
    editBtn.innerHTML = isEditMode ? "Lock: Read Only" : "Unlock Editing";
    editBtn.classList.toggle('edit-mode', !isEditMode);
  }

  const title = document.getElementById('mainTitle');
  const subtitle = document.getElementById('mainSubtitle');
  if (title) title.contentEditable = isEditMode;
  if (subtitle) subtitle.contentEditable = isEditMode;
}

function toggleCompactView() {
  isCompactView = !isCompactView;
  saveUiSettings();

  // Sync to window for cross-module access
  window.isCompactView = isCompactView;

  document.body.classList.toggle('compact-view-mode', isCompactView);

  const btn = document.getElementById('compactToggleBtn');
  if(isCompactView) {
    btn.innerHTML = "📄 Exit Compact";
    btn.classList.add('active-mode');
  } else {
    btn.innerHTML = "📄 Compact View";
    btn.classList.remove('active-mode');
  }

  applyUiSettings();
  const activeTabBtn = document.querySelector('.app-tab-btn.active');
  if (activeTabBtn && activeTabBtn.dataset.tab) {
    switchTab(activeTabBtn.dataset.tab, activeTabBtn);
  } else {
    buildItinerary();
    buildPackingTab();
  }
}

function toggleMode() {
  isFunMode = !isFunMode;
  saveUiSettings();

  // Sync to window for cross-module access
  window.isFunMode = isFunMode;

  document.body.classList.toggle('fun-mode', isFunMode);
  const btn = document.getElementById('modeToggleBtn');
  if(isFunMode) { btn.innerHTML = "🎭 Logistics Mode"; btn.classList.add('active-mode'); }
  else { btn.innerHTML = "📋 Fun Mode"; btn.classList.remove('active-mode'); }
  applyUiSettings();
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  saveUiSettings();

  // Sync to window for cross-module access
  window.isEditMode = isEditMode;

  document.body.classList.toggle('read-only-mode', !isEditMode);
  const btn = document.getElementById('editToggleBtn');
  document.getElementById('mainTitle').contentEditable = isEditMode;
  document.getElementById('mainSubtitle').contentEditable = isEditMode;

  if(isEditMode) { btn.innerHTML = "🔒 Lock"; btn.classList.remove('edit-mode'); }
  else { btn.innerHTML = "✏️ Unlock"; btn.classList.add('edit-mode'); saveData(); }

  applyUiSettings();
  const activeTab = document.querySelector('.app-tab-btn.active').innerText;
  const cityFilter = typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all';
  if(activeTab.includes('Transport')) buildTransportTab(cityFilter);
  if(activeTab.includes('Accommodation')) buildAccomTab(cityFilter);
  if(activeTab.includes('Packing')) buildPackingTab();
}

function switchTab(tabId, btnElement) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.app-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  btnElement.classList.add('active');

  // Scroll selected tab into view on mobile
  if (window.innerWidth <= 768) {
    btnElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Check for current city filter and pass to tab builders
  const cityFilter = typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all';

  if (tabId === 'itinerary') buildItinerary();
  if (tabId === 'transport') buildTransportTab(cityFilter);
  if (tabId === 'accom') buildAccomTab(cityFilter);
  if (tabId === 'budget') buildBudgetTab();
  if (tabId === 'packing') buildPackingTab();
  if (tabId === 'map') buildJourneyMap();
  if (tabId === 'guide') buildGuideSteps();
}

function toggleLeg(headerEl) { headerEl.parentElement.classList.toggle('collapsed'); }

// Dialog functions for top menu buttons
function openAIDialog() {
  const modal = document.getElementById('ai-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('aiOutputBox').style.display = 'none';
  }
}

function closeAIDialog() {
  const modal = document.getElementById('ai-modal');
  if (modal) modal.style.display = 'none';
}

function openGuideDialog() {
  const modal = document.getElementById('guide-modal');
  if (modal) {
    modal.style.display = 'flex';
    if (typeof buildGuideSteps === 'function') buildGuideSteps();
  }
}

function closeGuideDialog() {
  const modal = document.getElementById('guide-modal');
  if (modal) modal.style.display = 'none';
}

function toggleCard(bar) { bar.parentElement.classList.toggle('open'); }

let allExpanded = false;
let allLegsExpanded = true;

function toggleAllDays() {
  allExpanded = !allExpanded;
  document.querySelectorAll('.day-card').forEach(c => c.classList.toggle('open', allExpanded));
  if (allExpanded) {
    allLegsExpanded = true;
    document.querySelectorAll('.leg').forEach(l => l.classList.remove('collapsed'));
    document.getElementById('expandAllLegs').textContent = '▲ Collapse all legs';
  }
  document.getElementById('expandAll').textContent = allExpanded ? '▲ Collapse all days' : '▼ Expand all days';
}

function toggleAllLegs() {
  allLegsExpanded = !allLegsExpanded;
  document.querySelectorAll('.leg').forEach(l => l.classList.toggle('collapsed', !allLegsExpanded));
  document.getElementById('expandAllLegs').textContent = allLegsExpanded ? '▲ Collapse all legs' : '▼ Expand all legs';
}

function printPage(mode) {
  const previousClasses = document.body.className;
  if (mode === 'detailed') {
    document.querySelectorAll('.day-card').forEach(c => c.classList.add('open'));
    document.querySelectorAll('.leg').forEach(l => l.classList.remove('collapsed'));
  }
  document.body.className = '';
  document.body.classList.add('print-' + mode);
  window.print();
  setTimeout(() => { document.body.className = previousClasses; }, 1000);
}

// Print Preview Modal
let printPreviewData = { style: 'summary', dateRange: 'all', showTransport: true, showAccom: true, showActivities: true, showCosts: false };

function openPrintPreview() {
  populateDateRangeOptions();
  document.getElementById('print-preview-modal').style.display = 'flex';
  updatePrintPreview();
}

function closePrintPreview() {
  document.getElementById('print-preview-modal').style.display = 'none';
}

function populateDateRangeOptions() {
  const select = document.getElementById('printDateRange');
  select.innerHTML = '<option value="all">All Dates</option>';

  const dates = [];
  appData.forEach(leg => {
    leg.days.forEach(day => {
      const displayDate = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
      const dateKey = `${day.day} ${displayDate}`;
      if (!dates.find(d => d.key === dateKey)) {
        dates.push({ key: dateKey, leg: leg.label });
      }
    });
  });

  dates.forEach(d => {
    const option = document.createElement('option');
    option.value = d.key;
    option.textContent = `${d.key} (${d.leg})`;
    select.appendChild(option);
  });
}

function updatePrintPreview() {
  const style = document.querySelector('input[name="printStyle"]:checked').value;
  const dateRange = document.getElementById('printDateRange').value;
  const showTransport = document.getElementById('showTransport').checked;
  const showAccom = document.getElementById('showAccom').checked;
  const showActivities = document.getElementById('showActivities').checked;
  const showCosts = document.getElementById('showCosts').checked;

  const preview = document.getElementById('printPreviewContent');
  let html = '<h3>Preview</h3>';

  let filteredData = JSON.parse(JSON.stringify(appData));

  if (dateRange !== 'all') {
    filteredData = filteredData.filter(leg =>
      leg.days.some(day => `${day.day} ${typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date}` === dateRange)
    );
  }

  if (filteredData.length === 0) {
    preview.innerHTML = html + '<p style="color: #666; font-style: italic;">No items match the selected filters.</p>';
    return;
  }

  filteredData.forEach(leg => {
    html += `<div style="margin-bottom: 1rem; border-left: 3px solid ${leg.colour}; padding-left: 0.75rem;">`;
    html += `<strong style="font-size: 0.9rem;">${leg.label}</strong>`;

    leg.days.forEach(day => {
      const displayDate = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
      if (dateRange !== 'all' && `${day.day} ${displayDate}` !== dateRange) return;

      html += `<div style="margin: 0.5rem 0; font-size: 0.85rem;">`;
      html += `<span style="color: #666;">${day.day} ${displayDate}:</span> ${day.from} → ${day.to}`;

      let items = [];
      if (showTransport && day.transportItems?.length) items.push(...day.transportItems.map(i => '🚌 ' + i.text));
      if (showAccom && day.accomItems?.length) items.push(...day.accomItems.map(i => '🏨 ' + i.text));
      if (showActivities && day.activityItems?.length) items.push(...day.activityItems.map(i => '🎯 ' + i.text));

      if (items.length) {
        html += `<div style="margin-left: 1rem; color: #444;">`;
        if (style === 'summary') {
          html += items.slice(0, 3).join(', ');
          if (items.length > 3) html += '...';
        } else {
          html += items.join(', ');
        }
        html += '</div>';
      }

      if (showCosts) {
        const dayCost = ['transportItems', 'accomItems', 'activityItems']
          .reduce((sum, cat) => sum + (day[cat] || []).reduce((s, i) => s + parseCost(i.cost), 0), 0);
        if (dayCost > 0) {
          html += `<div style="margin-left: 1rem; font-family: monospace; color: #27AE60;">Day total: $${dayCost}</div>`;
        }
      }

      html += '</div>';
    });

    html += '</div>';
  });

  preview.innerHTML = html;
}

function executePrint() {
  const style = document.querySelector('input[name="printStyle"]:checked').value;
  closePrintPreview();
  printPage(style);
}

document.addEventListener('change', function(e) {
  if (e.target.closest('.print-options')) {
    updatePrintPreview();
  }
});

document.addEventListener('keyup', function(e) {
  if (e.key === 'Escape') closePrintPreview();
});

document.getElementById('mainTitle').addEventListener('blur', function() { titleData.title = this.innerText; saveData(); trackUserEdit(); });
document.getElementById('mainSubtitle').addEventListener('blur', function() { titleData.subtitle = this.innerText; saveData(); trackUserEdit(); });

function updateData(legIdx, key, val) { appData[legIdx][key] = val; saveData(); }

function updateDayData(legIdx, dayIdx, key, val) {
  appData[legIdx].days[dayIdx][key] = val;
  saveData();
  if (key === 'date') { sortLegs(); }
}

function sortLegs() {
  appData.sort((a, b) => {
    if (!a.days || a.days.length === 0) return 1;
    if (!b.days || b.days.length === 0) return -1;
    const aDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(a.days[0].date) : a.days[0].date;
    const bDate = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(b.days[0].date) : b.days[0].date;
    let dA = new Date(`${aDate}T00:00:00`).getTime();
    let dB = new Date(`${bDate}T00:00:00`).getTime();
    if(isNaN(dA)) dA = 0;
    if(isNaN(dB)) dB = 0;
    return dA - dB;
  });
  saveData(false);
  buildNav();
  buildItinerary();
}

// Navigation observer removed - leg-nav was deprecated in favor of city filter
function reObserveLegs() {
  // No-op - kept for backwards compatibility
}

// Expose UI functions to window scope for HTML onclick handlers
window.toggleLeg = toggleLeg;
window.toggleCard = toggleCard;
window.updateData = updateData;
window.updateDayData = updateDayData;
window.sortLegs = sortLegs;
window.openAIDialog = openAIDialog;
window.closeAIDialog = closeAIDialog;
window.openGuideDialog = openGuideDialog;
window.closeGuideDialog = closeGuideDialog;
window.startTutorial = startTutorial;
window.updateLegTip = updateLegTip;
window.deleteLegTip = deleteLegTip;
window.toggleMode = toggleMode;
window.toggleEditMode = toggleEditMode;
window.toggleCompactView = toggleCompactView;
window.applyUiSettings = applyUiSettings;
window.switchTab = switchTab;
window.openPrintPreview = openPrintPreview;
window.executePrint = executePrint;
window.addLeg = addLeg;
