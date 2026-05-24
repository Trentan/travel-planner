let isFunMode = false;
let isCompactView = false;
let isEditMode = true;
let isMobileMenuOpen = false;
let lastViewportWasMobile = null;
let itineraryDayViewMode = 'timeline';
let showMoneyFigures = true;
let currentTheme = 'system';

function isMobileViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

function updateStickyOffsets() {
  const menuBar = document.querySelector('.app-menu-bar');
  const tabsNav = document.querySelector('.app-tabs-nav');
  if (!tabsNav) return;

  const menuHeight = !isMobileViewport() && menuBar
    ? Math.ceil(menuBar.getBoundingClientRect().height || 0)
    : 0;
  const tabsHeight = Math.ceil(tabsNav.getBoundingClientRect().height || 0);
  document.documentElement.style.setProperty('--tabs-nav-sticky-top', `${menuHeight}px`);
  document.documentElement.style.setProperty('--city-nav-sticky-top', `${menuHeight + tabsHeight}px`);
  if (isMobileViewport()) {
    document.documentElement.style.setProperty('--city-nav-sticky-top', `${menuHeight + tabsHeight}px`);
  }
}

function syncMobileMenuControls() {
  const shouldHideDisabledControls = isMobileViewport();
  const controlIds = ['undoBtn', 'redoBtn', 'mobileUndoBtn', 'mobileRedoBtn'];

  controlIds.forEach(id => {
    const button = document.getElementById(id);
    if (!button) return;
    const hidden = shouldHideDisabledControls && button.disabled;
    button.hidden = hidden;
    button.setAttribute('aria-hidden', String(hidden));
  });
}

function syncMobileMenuStatus() {
  const sourceMap = [
    ['activeFileDisplay', 'mobileActiveFileDisplay'],
    ['saveStatus', 'mobileSaveStatus'],
    ['timestampStatus', 'mobileTimestampStatus']
  ];

  sourceMap.forEach(([sourceId, targetId]) => {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (!source || !target) return;
    target.textContent = (source.textContent || '').trim() || (target.dataset.fallback || '');
  });
}

function syncResponsiveUi() {
  const mobile = isMobileViewport();
  const viewportChanged = lastViewportWasMobile !== null && mobile !== lastViewportWasMobile;
  lastViewportWasMobile = mobile;

  document.body.classList.toggle('mobile-app-mode', mobile);
  // Compact view is now viewport-driven
  isCompactView = mobile;
  document.body.classList.toggle('compact-view-mode', isCompactView);
  window.isCompactView = isCompactView;
  updateStickyOffsets();
  syncMobileMenuControls();
  syncMobileMenuStatus();

  if (!mobile) {
    closeMobileMenu();
    closeDesktopActionsMenu();
  }

  if (viewportChanged) {
    // Rebuild view when switching between mobile/desktop
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    }
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
  syncMobileMenuStatus();
}

function closeDesktopActionsMenu() {
  const menu = document.getElementById('desktopActionsMenu');
  if (menu) {
    menu.open = false;
  }
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
  updateStickyOffsets();
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
      const switchInput = btn.querySelector('input[type="checkbox"]');
      const labelNode = btn.querySelector('.app-menu-switch-label');
      if (switchInput) {
        switchInput.checked = isActive;
      }
      if (labelNode) {
        labelNode.textContent = isActive ? 'Compact mode' : 'Detailed mode';
      }
      btn.setAttribute('aria-checked', String(isActive));
      btn.classList.toggle(activeClass, isActive);
    });
  });
}

function syncItineraryViewModeButtons() {
  const isTimeline = itineraryDayViewMode !== 'grouped';
  const timelineBtn = document.getElementById('itineraryTimelineModeBtn');
  const groupedBtn = document.getElementById('itineraryGroupedModeBtn');
  if (timelineBtn) {
    timelineBtn.classList.toggle('is-active', isTimeline);
    timelineBtn.setAttribute('aria-pressed', String(isTimeline));
  }
  if (groupedBtn) {
    groupedBtn.classList.toggle('is-active', !isTimeline);
    groupedBtn.setAttribute('aria-pressed', String(!isTimeline));
  }
}

function saveUiSettings() {
  localStorage.setItem('travelApp_uiSettings_v1', JSON.stringify({
    isEditMode,
    isFunMode,
    itineraryDayViewMode,
    showMoneyFigures,
    theme: currentTheme
  }));
}

function setHeaderEditable(isEditable) {
  const title = document.getElementById('mainTitle');
  const subtitle = document.getElementById('mainSubtitle');
  const allowEdit = !!isEditable && !isMobileViewport();
  if (title) title.contentEditable = allowEdit;
  if (subtitle) subtitle.contentEditable = allowEdit;
}

function applyTheme(theme = null) {
  if (theme) {
    currentTheme = theme;
  } else {
    let savedSettings = null;
    try {
      savedSettings = JSON.parse(localStorage.getItem('travelApp_uiSettings_v1') || 'null');
    } catch (e) {
      savedSettings = null;
    }
    currentTheme = (savedSettings && savedSettings.theme) || 'system';
  }

  let effectiveTheme = currentTheme;
  if (effectiveTheme === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = isDark ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Sync inputs and button styles
  const toggleInput = document.getElementById('themeToggleInput');
  const mobileToggleInput = document.getElementById('mobileThemeToggleInput');
  const toggleBtn = document.getElementById('themeToggleBtn');
  const mobileToggleBtn = document.getElementById('mobileThemeToggleBtn');
  const isDarkActive = effectiveTheme === 'dark';

  if (toggleInput) toggleInput.checked = isDarkActive;
  if (mobileToggleInput) mobileToggleInput.checked = isDarkActive;

  if (toggleBtn) {
    toggleBtn.setAttribute('aria-checked', String(isDarkActive));
    toggleBtn.classList.toggle('active-mode', isDarkActive);
  }
  if (mobileToggleBtn) {
    mobileToggleBtn.setAttribute('aria-checked', String(isDarkActive));
    mobileToggleBtn.classList.toggle('active-mode', isDarkActive);
  }

  saveUiSettings();
}

function toggleThemeMode(isDark) {
  const nextTheme = isDark ? 'dark' : 'light';
  applyTheme(nextTheme);
}
window.toggleThemeMode = toggleThemeMode;
window.applyTheme = applyTheme;

function applyUiSettings() {
  let savedSettings = null;
  try {
    savedSettings = JSON.parse(localStorage.getItem('travelApp_uiSettings_v1') || 'null');
  } catch (e) {
    savedSettings = null;
  }

  if (savedSettings) {
    isFunMode = savedSettings.isFunMode === true;
    isEditMode = savedSettings.isEditMode !== false;
    itineraryDayViewMode = savedSettings.itineraryDayViewMode === 'grouped' ? 'grouped' : 'timeline';
    showMoneyFigures = savedSettings.showMoneyFigures !== false;
    currentTheme = savedSettings.theme || 'system';
  }

  // Compact view is now viewport-driven (applied in syncResponsiveUi)
  // Set initial compact view based on viewport
  isCompactView = isMobileViewport();
  window.isCompactView = isCompactView;

  // Sync to window for cross-module access
  window.isFunMode = isFunMode;
  window.isEditMode = isEditMode;
  window.itineraryDayViewMode = itineraryDayViewMode;
  window.showMoneyFigures = showMoneyFigures;

  document.body.classList.toggle('fun-mode', isFunMode);
  document.body.classList.toggle('read-only-mode', !isEditMode);
  document.body.classList.toggle('hide-money-figures', !showMoneyFigures);
  applyTheme();
  syncResponsiveUi();
  syncModeToggleButtons();
  syncItineraryViewModeButtons();
  syncShowMoneyButtons();
  setHeaderEditable(isEditMode);
}

function syncShowMoneyButtons() {
  const showMoneyToggleBtn = document.getElementById('showMoneyToggleBtn');
  const mobileShowMoneyToggleBtn = document.getElementById('mobileShowMoneyToggleBtn');
  if (showMoneyToggleBtn) {
    showMoneyToggleBtn.textContent = showMoneyFigures ? '💵 Hide Prices' : '💵 Show Prices';
  }
  if (mobileShowMoneyToggleBtn) {
    mobileShowMoneyToggleBtn.textContent = showMoneyFigures ? '💵 Hide Prices' : '💵 Show Prices';
  }
}

function toggleShowMoney(nextValue = null) {
  showMoneyFigures = nextValue !== null ? !!nextValue : !showMoneyFigures;
  saveUiSettings();
  applyUiSettings();
}
window.toggleShowMoney = toggleShowMoney;

function openRenameTripDialog() {
  const dialog = document.getElementById('rename-trip-modal');
  const title = document.getElementById('mainTitle');
  const subtitle = document.getElementById('mainSubtitle');
  const titleInput = document.getElementById('renameTripTitle');
  const subtitleInput = document.getElementById('renameTripSubtitle');
  if (!dialog || !title || !titleInput || !subtitleInput) return;

  if (!isEditMode) {
    toggleEditMode();
  }

  titleInput.value = (title.innerText || '').trim();
  subtitleInput.value = subtitle ? (subtitle.innerText || '').trim() : '';
  dialog.style.display = 'flex';
  dialog.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => titleInput.focus());
}

function closeRenameTripDialog() {
  const dialog = document.getElementById('rename-trip-modal');
  if (!dialog) return;
  dialog.style.display = 'none';
  dialog.setAttribute('aria-hidden', 'true');
}

function saveRenameTripDialog() {
  const title = document.getElementById('mainTitle');
  const subtitle = document.getElementById('mainSubtitle');
  const titleInput = document.getElementById('renameTripTitle');
  const subtitleInput = document.getElementById('renameTripSubtitle');
  if (!title || !titleInput || !subtitleInput) return;

  const nextTitle = titleInput.value.trim() || 'New Trip Plan';
  const nextSubtitle = subtitleInput.value.trim();
  title.innerText = nextTitle;
  if (subtitle) subtitle.innerText = nextSubtitle;
  titleData.title = nextTitle;
  titleData.subtitle = nextSubtitle;
  saveData();
  trackUserEdit();
  closeRenameTripDialog();
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
  setHeaderEditable(isEditMode);

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
    const tabsList = btnElement.closest('.app-tabs-list');
    if (tabsList) {
      tabsList.scrollTo({
        left: Math.max(0, btnElement.offsetLeft - (tabsList.clientWidth - btnElement.offsetWidth) / 2),
        behavior: 'smooth'
      });
    }
  }

  // Check for current city filter and pass to tab builders
  const cityFilter = typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all';

  if (tabId === 'itinerary') {
    if (typeof resetMobilePagerActiveIndex === 'function') {
      resetMobilePagerActiveIndex('compact-city-swipe');
    }
    buildItinerary();
  }
  if (tabId === 'transport') buildTransportTab(cityFilter);
  if (tabId === 'accom') buildAccomTab(cityFilter);
  if (tabId === 'budget') buildBudgetTab();
  if (tabId === 'packing') buildPackingTab();
  if (tabId === 'map') buildJourneyMap();
  if (tabId === 'guide') buildGuideSteps();

  if (window.innerWidth <= 768) {
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }
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
    if (typeof prefillAIDialogFields === 'function') prefillAIDialogFields();
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

function applyViewportDrivenMode() {
  // Automatically set compact view based on viewport width (< 769px = compact)
  const isMobile = isMobileViewport();
  isCompactView = isMobile;
  window.isCompactView = isCompactView;
  document.body.classList.toggle('compact-view-mode', isCompactView);
  // Rebuild current view to apply the correct layout
  const activeTabBtn = document.querySelector('.app-tab-btn.active');
  if (activeTabBtn && activeTabBtn.dataset.tab) {
    switchTab(activeTabBtn.dataset.tab, activeTabBtn);
  } else {
    buildItinerary();
    buildPackingTab();
  }
}

function toggleCompactView(nextValue = null) {
  // Deprecated: This function is now viewport-driven only.
  // The nextValue parameter is ignored; compact view is determined by viewport width.
  applyViewportDrivenMode();
  console.warn('toggleCompactView() is deprecated. Compact view is now auto-detected from viewport.');
}

function setItineraryDayViewMode(nextMode = 'timeline') {
  itineraryDayViewMode = nextMode === 'grouped' ? 'grouped' : 'timeline';
  window.itineraryDayViewMode = itineraryDayViewMode;
  saveUiSettings();
  syncItineraryViewModeButtons();
  if (typeof rebuildItineraryPreservingScroll === 'function') rebuildItineraryPreservingScroll();
  else if (typeof buildItinerary === 'function') buildItinerary();
}

function promptHardRestart() {
  if (typeof hardRestartApp === 'function') {
    hardRestartApp();
  }
}

function promptFactoryReset() {
  closeMobileMenu();
  const mobileResetMessage = [
    '⚠️ WIPE ALL DATA?',
    '',
    'This will delete your trip, custom cities, and all local settings. It cannot be undone.',
    '',
    'Continue?'
  ].join('\n');

  if (typeof factoryResetData === 'function') {
    return factoryResetData({
      confirmMessage: isMobileViewport() ? mobileResetMessage : undefined
    });
  }
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

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyTheme();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ['activeFileDisplay', 'saveStatus', 'timestampStatus'].forEach(id => {
    const node = document.getElementById(id);
    if (!node || typeof MutationObserver === 'undefined') return;
    new MutationObserver(syncMobileMenuStatus).observe(node, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
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

// Helper to rebuild the current active view
function rebuildCurrentView() {
  const activeTab = document.querySelector('.app-tab-btn.active') || document.querySelector('.app-tabs-content .tab-pane.active');
  if (!activeTab) return;

  const tabType = activeTab.getAttribute('data-tab') || activeTab.id.replace('tab-', '');
  const filter = typeof window !== 'undefined' && window.currentCityFilter ? window.currentCityFilter : 'all';

  if (tabType === 'itinerary') {
    if (typeof buildItinerary === 'function') buildItinerary();
  } else if (tabType === 'transport') {
    if (typeof buildTransportTab === 'function') buildTransportTab(filter);
  } else if (tabType === 'accom') {
    if (typeof buildAccomTab === 'function') buildAccomTab(filter);
  } else if (tabType === 'budget') {
    if (typeof buildBudgetTab === 'function') buildBudgetTab();
  } else if (tabType === 'packing') {
    if (typeof buildPackingTab === 'function') buildPackingTab();
  }
}

// Expose UI functions to window scope for HTML onclick handlers
window.rebuildCurrentView = rebuildCurrentView;
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
window.setItineraryDayViewMode = setItineraryDayViewMode;
window.applyUiSettings = applyUiSettings;
window.switchTab = switchTab;
window.toggleMobileMenu = toggleMobileMenu;
window.closeDesktopActionsMenu = closeDesktopActionsMenu;
window.closeMobileMenu = closeMobileMenu;
window.syncResponsiveUi = syncResponsiveUi;
window.syncMobileMenuControls = syncMobileMenuControls;
window.syncMobileMenuStatus = syncMobileMenuStatus;
window.promptHardRestart = promptHardRestart;
window.promptFactoryReset = promptFactoryReset;
window.addLeg = addLeg;
window.openRenameTripDialog = openRenameTripDialog;
window.closeRenameTripDialog = closeRenameTripDialog;
window.saveRenameTripDialog = saveRenameTripDialog;
let lastScrollY = window.scrollY || 0;
let cityNavEl = null;

function initMobileScrollNav() {
  window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('mobile-app-mode')) return;
    
    if (!cityNavEl) {
      cityNavEl = document.getElementById('cityNav');
      if (!cityNavEl) return;
    }
    
    const currentScrollY = window.scrollY;
    
    // Only apply hide on scroll if we are scrolled past the initial top threshold
    if (currentScrollY > 60) {
      if (currentScrollY > lastScrollY + 5) {
        // Scrolling down (with threshold)
        cityNavEl.classList.add('city-nav-hidden');
      } else if (currentScrollY < lastScrollY - 5) {
        // Scrolling up
        cityNavEl.classList.remove('city-nav-hidden');
      }
    } else {
      cityNavEl.classList.remove('city-nav-hidden');
    }
    
    cityNavLastScrollY = currentScrollY;
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', initMobileScrollNav);


// -- City Nav Scroll Behavior --
let cityNavLastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  const cityNav = document.getElementById('cityNav');
  if (!cityNav) return;
  const currentScrollY = window.scrollY;
  // If scrolled down past 60px, hide the nav by translating it up
  if (currentScrollY > cityNavLastScrollY && currentScrollY > 60) {
    cityNav.classList.add('-translate-y-full');
  } else {
    cityNav.classList.remove('-translate-y-full');
  }
  cityNavLastScrollY = currentScrollY;
}, { passive: true });
