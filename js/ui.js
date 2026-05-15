let isFunMode = false;
let isCompactView = false;
let isEditMode = true;
let isMobileMenuOpen = false;

function isMobileViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

function updateStickyOffsets() {
  const menuBar = document.querySelector('.app-menu-bar');
  const tabsNav = document.querySelector('.app-tabs-nav');
  if (!tabsNav) return;

  const menuHeight = isMobileViewport() && menuBar ? Math.ceil(menuBar.getBoundingClientRect().height || 0) : 0;
  const tabsHeight = Math.ceil(tabsNav.getBoundingClientRect().height || 0);
  document.documentElement.style.setProperty('--tabs-nav-sticky-top', `${menuHeight}px`);
  document.documentElement.style.setProperty('--city-nav-sticky-top', `${tabsHeight}px`);
  if (isMobileViewport()) {
    document.documentElement.style.setProperty('--city-nav-sticky-top', `${menuHeight + tabsHeight}px`);
  }
}

function syncResponsiveUi() {
  document.body.classList.toggle('mobile-app-mode', isMobileViewport());
  updateStickyOffsets();

  if (!isMobileViewport()) {
    closeMobileMenu();
  }
}

function toggleMobileMenu() {
  isMobileMenuOpen = !isMobileMenuOpen;
  const sheet = document.getElementById('mobileMenuSheet');
  if (sheet) {
    sheet.classList.toggle('open', isMobileMenuOpen);
    sheet.setAttribute('aria-hidden', String(!isMobileMenuOpen));
  }
  document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen);
}

function closeMobileMenu(event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  isMobileMenuOpen = false;
  const sheet = document.getElementById('mobileMenuSheet');
  if (sheet) {
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('mobile-menu-open');
}

function syncModeToggleButtons() {
  const buttonSets = [
    {
      ids: ['editToggleBtn', 'mobileEditToggleBtn'],
      label: isEditMode ? '🔒 Lock: Read Only' : '✏️ Unlock Editing',
      activeClass: 'edit-mode',
      isActive: !isEditMode
    },
    {
      ids: ['compactToggleBtn', 'mobileCompactToggleBtn'],
      label: isCompactView ? '📄 Compact mode' : '📄 Detailed mode',
      activeClass: 'active-mode',
      isActive: isCompactView
    }
  ];

  buttonSets.forEach(({ ids, label, activeClass, isActive }) => {
    ids.forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.innerHTML = label;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle(activeClass, isActive);
    });
  });
}

function saveUiSettings() {
  localStorage.setItem('travelApp_uiSettings_v1', JSON.stringify({
    isCompactView,
    isEditMode,
    isFunMode
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
    isFunMode = savedSettings.isFunMode === true;
    isCompactView = !!savedSettings.isCompactView;
    isEditMode = savedSettings.isEditMode !== false;
  } else if (isMobileViewport()) {
    isCompactView = true;
  }

  // Sync to window for cross-module access
  window.isFunMode = isFunMode;
  window.isCompactView = isCompactView;
  window.isEditMode = isEditMode;

  document.body.classList.toggle('fun-mode', isFunMode);
  document.body.classList.toggle('compact-view-mode', isCompactView);
  document.body.classList.toggle('read-only-mode', !isEditMode);
  syncResponsiveUi();
  syncModeToggleButtons();

  const title = document.getElementById('mainTitle');
  const subtitle = document.getElementById('mainSubtitle');
  if (title) title.contentEditable = isEditMode;
  if (subtitle) subtitle.contentEditable = isEditMode;
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
  closeMobileMenu();

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

function isHistoryEditableTarget(target) {
  if (!target) return false;
  const tagName = String(target.tagName || '').toLowerCase();
  return !!target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

document.addEventListener('keydown', event => {
  const key = String(event.key || '').toLowerCase();
  if (!(event.ctrlKey || event.metaKey) || isHistoryEditableTarget(event.target)) return;

  if (key === 'z' && !event.shiftKey) {
    if (typeof undoTripChange === 'function') undoTripChange();
    event.preventDefault();
    return;
  }

  if (key === 'y' || (key === 'z' && event.shiftKey)) {
    if (typeof redoTripChange === 'function') redoTripChange();
    event.preventDefault();
  }
});

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

function toggleCompactView() {
  isCompactView = !isCompactView;
  saveUiSettings();
  window.isCompactView = isCompactView;
  document.body.classList.toggle('compact-view-mode', isCompactView);
  applyUiSettings();
  const activeTabBtn = document.querySelector('.app-tab-btn.active');
  if (activeTabBtn && activeTabBtn.dataset.tab) {
    switchTab(activeTabBtn.dataset.tab, activeTabBtn);
  } else {
    buildItinerary();
    buildPackingTab();
  }
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  saveUiSettings();
  window.isEditMode = isEditMode;
  document.body.classList.toggle('read-only-mode', !isEditMode);
  const title = document.getElementById('mainTitle');
  const subtitle = document.getElementById('mainSubtitle');
  if (title) title.contentEditable = isEditMode;
  if (subtitle) subtitle.contentEditable = isEditMode;
  if (!isEditMode) saveData();
  applyUiSettings();
  const activeTab = document.querySelector('.app-tab-btn.active')?.innerText || '';
  const cityFilter = typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all';
  if (activeTab.includes('Transport')) buildTransportTab(cityFilter);
  if (activeTab.includes('Accommodation')) buildAccomTab(cityFilter);
  if (activeTab.includes('Packing')) buildPackingTab();
}

function promptResetData() {
  closeMobileMenu();
  const mobileResetMessage = [
    'Reset this app on mobile?',
    '',
    'This will clear your trip data, saved settings, offline cache, and local backups, then reload the planner.'
  ].join('\n');
  return resetData({
    confirmMessage: isMobileViewport() ? mobileResetMessage : undefined
  });
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

window.addEventListener('resize', syncResponsiveUi);
window.addEventListener('orientationchange', syncResponsiveUi);
document.addEventListener('DOMContentLoaded', syncResponsiveUi);
window.addEventListener('load', syncResponsiveUi);

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
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.syncResponsiveUi = syncResponsiveUi;
window.promptResetData = promptResetData;
window.addLeg = addLeg;

