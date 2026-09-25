let isFunMode = false;
let isCompactView = false;
let isEditMode = true;
let editingTripName = false;
let mapSidebarOpen = false;
let allExpanded = true;
let allLegsExpanded = true;
let isCompactMode = false;
let isMobileMenuOpen = false;
let lastViewportWasMobile = null;
let itineraryDayViewMode = 'timeline';
let showMoneyFigures = true;
let showTimelineReminders = true;
let currentTheme = 'light';
let dismissedReminders = new Set();

function loadDismissedReminders() {
  try {
    const saved = JSON.parse(localStorage.getItem('travelApp_dismissedReminders_v1') || '[]');
    if (Array.isArray(saved)) {
      dismissedReminders = new Set(saved);
    }
  } catch (e) {
    dismissedReminders = new Set();
  }
}

function saveDismissedReminders() {
  try {
    localStorage.setItem('travelApp_dismissedReminders_v1', JSON.stringify(Array.from(dismissedReminders)));
  } catch (e) {}
}

function isReminderDismissed(key) {
  return dismissedReminders.has(key);
}

function dismissTimelineReminder(key) {
  dismissedReminders.add(key);
  saveDismissedReminders();
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  }
}

function resetDismissedReminders() {
  dismissedReminders.clear();
  try {
    localStorage.removeItem('travelApp_dismissedReminders_v1');
  } catch (e) {}
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  }
}

window.isReminderDismissed = isReminderDismissed;
window.dismissTimelineReminder = dismissTimelineReminder;
window.resetDismissedReminders = resetDismissedReminders;

function isMobileViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

function isSmallMobileViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 379px)').matches;
}

function updateStickyOffsets() {
  const menuBar = document.querySelector('.app-menu-bar');
  const tabsNav = document.querySelector('.app-tabs-nav');
  const cityNav = document.querySelector('.city-nav');
  if (!tabsNav) return;

  const isMobile = isMobileViewport();
  const menuHeight = !isMobile && menuBar
    ? Math.ceil(menuBar.getBoundingClientRect().height || 0)
    : 0;
  const tabsHeight = Math.ceil(tabsNav.getBoundingClientRect().height || 0);

  if (!isMobile) {
    tabsNav.style.top = `${menuHeight}px`;
  } else {
    tabsNav.style.top = '';
  }

  const cityHeight = cityNav
    ? Math.ceil(cityNav.getBoundingClientRect().height || 0)
    : 0;

  if (cityNav) {
    if (isMobile) {
      cityNav.style.top = '';
    } else {
      const cityTop = Math.max(0, menuHeight + tabsHeight - 1);
      cityNav.style.top = `${cityTop}px`;
    }
  }

  if (!isMobile) {
    document.body.style.paddingTop = `${menuHeight + tabsHeight + cityHeight}px`;
  } else {
    document.body.style.paddingTop = '';
  }

  // Set CSS custom properties on document root for fluid calculations
  if (document.documentElement && document.documentElement.style && typeof document.documentElement.style.setProperty === 'function') {
    document.documentElement.style.setProperty('--app-menu-height', `${menuHeight}px`);
    document.documentElement.style.setProperty('--app-tabs-height', `${tabsHeight}px`);
    document.documentElement.style.setProperty('--app-city-height', `${cityHeight}px`);
    const desktopStickyOffset = !isMobile ? (menuHeight + tabsHeight + cityHeight + 12) : 0;
    document.documentElement.style.setProperty('--desktop-sticky-offset', `${desktopStickyOffset}px`);
  }
}

function syncMobileMenuControls() {
  const shouldHideDisabledControls = isMobileViewport();
  const headerControlIds = ['undoBtn', 'redoBtn'];
  headerControlIds.forEach(id => {
    const button = document.getElementById(id);
    if (!button) return;
    const hidden = shouldHideDisabledControls && button.disabled;
    button.hidden = hidden;
    button.setAttribute('aria-hidden', String(hidden));
  });

  const mobileMenuControlIds = ['mobileUndoBtn', 'mobileRedoBtn'];
  mobileMenuControlIds.forEach(id => {
    const button = document.getElementById(id);
    if (!button) return;
    button.hidden = false;
    if (typeof button.removeAttribute === 'function') {
      button.removeAttribute('aria-hidden');
    } else if (typeof button.setAttribute === 'function') {
      button.setAttribute('aria-hidden', 'false');
    }
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
    if (!isMobileMenuOpen) {
      releaseMobileMenuFocus(sheet);
    }
    sheet.classList.toggle('open', isMobileMenuOpen);
    sheet.setAttribute('aria-hidden', String(!isMobileMenuOpen));
    if (isMobileMenuOpen) {
      sheet.removeAttribute('inert');
    } else {
      sheet.setAttribute('inert', '');
    }
  }
  document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen);
  syncMobileMenuStatus();
}

function releaseMobileMenuFocus(sheet) {
  const activeElement = document.activeElement;
  if (activeElement && sheet && sheet.contains(activeElement)) {
    activeElement.blur();
  }
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
    releaseMobileMenuFocus(sheet);
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.setAttribute('inert', '');
  }
  if (document.body && document.body.classList && typeof document.body.classList.remove === 'function') {
    document.body.classList.remove('mobile-menu-open');
  }
  updateStickyOffsets();
}

function syncModeToggleButtons() {
  const buttonSets = [
    {
      ids: ['editToggleBtn', 'mobileEditToggleBtn'],
      label: isEditMode ? '🔒 Lock: Read Only' : '✏️ Unlock Editing',
      activeClass: 'edit-mode',
      isActive: !isEditMode
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
        // Fallback for missing label logic, kept generic
        labelNode.textContent = label;
      } else if (btn.tagName === 'BUTTON') {
        btn.textContent = label;
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
    showTimelineReminders,
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
    currentTheme = (savedSettings && savedSettings.theme) || 'light';
  }

  let effectiveTheme = currentTheme;
  if (effectiveTheme === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = isDark ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Dynamically update mobile browser / PWA theme-color for crisp status bar contrast
  const isDarkActive = effectiveTheme === 'dark';
  const metaTheme = document.getElementById('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDarkActive ? '#0f172a' : '#0f766e');
  }

  // Sync inputs and button styles
  const toggleInput = document.getElementById('themeToggleInput');
  const mobileToggleInput = document.getElementById('mobileThemeToggleInput');
  const toggleBtn = document.getElementById('themeToggleBtn');
  const mobileToggleBtn = document.getElementById('mobileThemeToggleBtn');

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

  loadDismissedReminders();

  if (savedSettings) {
    isFunMode = savedSettings.isFunMode === true;
    isEditMode = savedSettings.isEditMode !== false;
    itineraryDayViewMode = savedSettings.itineraryDayViewMode === 'grouped' ? 'grouped' : 'timeline';
    showMoneyFigures = savedSettings.showMoneyFigures !== false;
    showTimelineReminders = savedSettings.showTimelineReminders !== false;
    currentTheme = savedSettings.theme || 'light';
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
  window.showTimelineReminders = showTimelineReminders;

  document.body.classList.toggle('fun-mode', isFunMode);
  document.body.classList.toggle('read-only-mode', !isEditMode);
  document.body.classList.toggle('hide-money-figures', !showMoneyFigures);
  applyTheme();
  syncResponsiveUi();
  syncModeToggleButtons();
  syncItineraryViewModeButtons();
  syncShowMoneyButtons();
  syncShowTimelineRemindersButtons();
  setHeaderEditable(isEditMode);
  syncReadOnlyBanner();
  if (typeof updateWakeLockButtons === 'function') updateWakeLockButtons();
}

function syncShowTimelineRemindersButtons() {
  const toggleInput = document.getElementById('showRemindersToggleInput');
  const mobileToggleInput = document.getElementById('mobileShowRemindersToggleInput');
  const toggleBtn = document.getElementById('showRemindersToggleBtn');
  const mobileToggleBtn = document.getElementById('mobileShowRemindersToggleBtn');

  if (toggleInput) toggleInput.checked = showTimelineReminders;
  if (mobileToggleInput) mobileToggleInput.checked = showTimelineReminders;

  if (toggleBtn) {
    toggleBtn.setAttribute('aria-checked', String(showTimelineReminders));
  }
  if (mobileToggleBtn) {
    mobileToggleBtn.setAttribute('aria-checked', String(showTimelineReminders));
  }
}

function toggleTimelineReminders(nextValue = null) {
  showTimelineReminders = nextValue !== null ? !!nextValue : !showTimelineReminders;
  window.showTimelineReminders = showTimelineReminders;
  saveUiSettings();
  syncShowTimelineRemindersButtons();
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  }
}
window.toggleTimelineReminders = toggleTimelineReminders;
window.syncShowTimelineRemindersButtons = syncShowTimelineRemindersButtons;

/**
 * Show or hide the read-only banner based on current isEditMode.
 * If the user has dismissed it this session AND we're still locked, keep it hidden
 * until the mode changes (i.e., unlock then re-lock will re-show it).
 */
function syncReadOnlyBanner() {
  const banner = document.getElementById('readOnlyBanner');
  if (!banner) return;
  if (!isEditMode) {
    // In read-only mode: show unless the user dismissed it this session
    const dismissed = sessionStorage.getItem('readOnlyBannerDismissed') === 'true';
    banner.style.display = dismissed ? 'none' : '';
  } else {
    // In edit mode: clear dismiss flag and hide via CSS (body class removed)
    sessionStorage.removeItem('readOnlyBannerDismissed');
    banner.style.display = '';
  }
}

/**
 * Let the user dismiss the read-only banner for this session.
 * It will re-show if they unlock then re-lock the trip.
 */
function dismissReadOnlyBanner() {
  const banner = document.getElementById('readOnlyBanner');
  if (!banner) return;
  sessionStorage.setItem('readOnlyBannerDismissed', 'true');
  banner.style.display = 'none';
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

  syncReadOnlyBanner();
  applyUiSettings();
  const activeTabBtn = document.querySelector('.app-tab-btn.active');
  const activeTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : '';
  const cityFilter = typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all';
  if (activeTabId === 'itinerary' && typeof buildItinerary === 'function') buildItinerary();
  if (activeTabId === 'transport') buildTransportTab(cityFilter);
  if (activeTabId === 'accom') buildAccomTab(cityFilter);
  if (activeTabId === 'packing') buildPackingTab();
}

function switchTab(tabId, btnElement) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.app-tab-btn').forEach(el => el.classList.remove('active'));
  const pane = document.getElementById('tab-' + tabId);
  if (pane) pane.classList.add('active');

  const btn = btnElement || document.querySelector(`.app-tab-btn[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
  closeMobileMenu();

  // Scroll selected tab into view on mobile
  if (window.innerWidth <= 768 && btn) {
    const tabsList = btn.closest('.app-tabs-list');
    if (tabsList) {
      tabsList.scrollTo({
        left: Math.max(0, btn.offsetLeft - (tabsList.clientWidth - btn.offsetWidth) / 2),
        behavior: 'smooth'
      });
    }
  }

  if (['itinerary', 'transport', 'accom'].includes(tabId) && typeof applyCurrentTripPositionForTab === 'function') {
    applyCurrentTripPositionForTab(tabId);
  } else if (tabId === 'itinerary') {
    if (typeof buildItinerary === 'function') buildItinerary();
  } else if (tabId === 'transport') {
    if (typeof buildTransportTab === 'function') buildTransportTab(typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all');
  } else if (tabId === 'accom') {
    if (typeof buildAccomTab === 'function') buildAccomTab(typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all');
  }
  if (tabId === 'itinerary' && typeof window !== 'undefined' && window.innerWidth >= 1024 && typeof buildDesktopSplitMap === 'function') {
    setTimeout(buildDesktopSplitMap, 60);
  }
  if (tabId === 'budget' && typeof buildBudgetTab === 'function') buildBudgetTab();
  if (tabId === 'packing' && typeof buildPackingTab === 'function') buildPackingTab();
  if (tabId === 'map' && typeof buildJourneyMap === 'function') buildJourneyMap();
  if (tabId === 'guide' && typeof buildGuideSteps === 'function') buildGuideSteps();

  if (window.innerWidth <= 768) {
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }
}

function toggleLeg(headerEl) { 
  const legEl = headerEl.closest('.leg') || headerEl.parentElement;
  legEl.classList.toggle('collapsed'); 
}

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

function setItineraryDayViewMode(nextMode = 'timeline') {
  itineraryDayViewMode = nextMode === 'grouped' ? 'grouped' : 'timeline';
  window.itineraryDayViewMode = itineraryDayViewMode;
  saveUiSettings();
  syncItineraryViewModeButtons();
  document.querySelectorAll('#tab-itinerary .day-planner-shell').forEach(shell => {
    shell.classList.remove('day-planner-shell-timeline', 'day-planner-shell-grouped');
    shell.classList.add(itineraryDayViewMode === 'grouped' ? 'day-planner-shell-grouped' : 'day-planner-shell-timeline');
  });
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



function toggleAllDays() {
  allExpanded = !allExpanded;
  document.querySelectorAll('.day-card').forEach(c => c.classList.toggle('open', allExpanded));
  
  allLegsExpanded = allExpanded;
  document.querySelectorAll('.leg').forEach(l => l.classList.toggle('collapsed', !allLegsExpanded));
  
  const expandAllBtn = document.getElementById('expandAll');
  if (expandAllBtn) {
    expandAllBtn.textContent = allExpanded ? '▲ Collapse all days' : '▼ Expand all days';
  }
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

document.getElementById('mainTitle')?.addEventListener('blur', function() { titleData.title = this.innerText; saveData(); trackUserEdit(); });
document.getElementById('mainSubtitle')?.addEventListener('blur', function() { titleData.subtitle = this.innerText; saveData(); trackUserEdit(); });

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
window.startTutorial = typeof startTutorial !== 'undefined' ? startTutorial : () => {};
window.updateLegTip = typeof updateLegTip !== 'undefined' ? updateLegTip : () => {};
window.deleteLegTip = typeof deleteLegTip !== 'undefined' ? deleteLegTip : () => {};
window.toggleMode = toggleMode;
window.toggleEditMode = toggleEditMode;
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
window.addLeg = typeof addLeg !== 'undefined' ? addLeg : () => {};
window.openRenameTripDialog = openRenameTripDialog;
window.closeRenameTripDialog = closeRenameTripDialog;
window.saveRenameTripDialog = saveRenameTripDialog;
window.syncReadOnlyBanner = syncReadOnlyBanner;
window.dismissReadOnlyBanner = dismissReadOnlyBanner;
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
  if (!isMobileViewport()) return;
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

// Close Actions menu on click away
document.addEventListener('click', event => {
  const menu = document.getElementById('desktopActionsMenu');
  if (menu && menu.open && !menu.contains(event.target)) {
    menu.open = false;
  }
});

// --- Capacitor Mobile Hardware Back Button Support ---
if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener("backButton", ({ canGoBack }) => {
        // 1. Check if mobile menu is open
        if (typeof isMobileMenuOpen !== "undefined" && isMobileMenuOpen) {
          if (typeof toggleMobileMenu === "function") {
            toggleMobileMenu();
            return;
          }
        }

        // 2. Check if a guide tooltip overlay is active
        const tooltipOverlay = document.getElementById("guide-tooltip-overlay");
        if (tooltipOverlay && tooltipOverlay.style.display !== "none") {
          if (typeof nextTutorialStep === "function") {
            // You could skip or go next. We will just hide the tooltip for back button.
            if (typeof skipTutorial === "function") skipTutorial();
            return;
          }
        }

        // 3. Find any open modals and close the topmost one
        const openModals = Array.from(document.querySelectorAll(".modal-overlay")).filter(m => m.style.display && m.style.display !== "none");
        if (openModals.length > 0) {
          // Just hide the last one found in DOM, assuming its the topmost
          const topmostModal = openModals[openModals.length - 1];
          topmostModal.style.display = "none";
          
          // Specifically handle some states if we just closed their modal
          if (topmostModal.id === "rename-trip-modal") {
            if (typeof editingTripName !== "undefined") editingTripName = false;
          }
          return;
        }

        // 4. Check if map sidebar is open on mobile
        if (typeof mapSidebarOpen !== "undefined" && mapSidebarOpen && isMobileViewport()) {
           if (typeof toggleMapSidebar === "function") {
             toggleMapSidebar();
             return;
           }
        }

        // 5. If nothing is open, we can let the app exit or go back
        if (!canGoBack) {
          window.Capacitor.Plugins.App.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  });
}


// --- Haptics Helper ---
window.triggerHaptic = async function(type = "light") {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
    try {
      if (type === "success") {
        await window.Capacitor.Plugins.Haptics.notification({ type: "SUCCESS" });
      } else if (type === "warning") {
        await window.Capacitor.Plugins.Haptics.notification({ type: "WARNING" });
      } else if (type === "error") {
        await window.Capacitor.Plugins.Haptics.notification({ type: "ERROR" });
      } else {
        await window.Capacitor.Plugins.Haptics.impact({ style: type.toUpperCase() }); // LIGHT, MEDIUM, HEAVY
      }
    } catch(e) { /* ignore on unsupported devices */ }
  }
};


// --- Cloud File Resync Flow ---
if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      let lastSuspendedTime = Date.now();
      window.Capacitor.Plugins.App.addListener("appStateChange", async ({ isActive }) => {
        if (!isActive) {
          lastSuspendedTime = Date.now();
        } else {
          // Check if there is an active file handle
          if (typeof window.getActiveFileHandle === "function" && window.getActiveFileHandle()) {
            try {
              const handle = window.getActiveFileHandle();
              const file = await handle.getFile();
              const text = await file.text();
              if (typeof window.calculateDjb2Hash === "function") {
                const currentHash = window.calculateDjb2Hash(text);
                const lastHash = localStorage.getItem("travelApp_last_known_hash");
                if (lastHash && String(currentHash) !== String(lastHash)) {
                  const resyncModal = document.getElementById("resync-modal");
                  if (resyncModal && resyncModal.style.display === "none") {
                    resyncModal.style.display = "flex";
                    if (typeof triggerHaptic === "function") triggerHaptic("light");
                  }
                }
              }
            } catch (err) {
              console.warn("Could not check background file checksum:", err);
            }
          }
        }
      });
    }
  });
}

// --- Screen Wake Lock State Management ---
let wakeLockSentinel = null;
let isWakeLockRequested = false;

function isWakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator && typeof navigator.wakeLock.request === 'function';
}

async function requestScreenWakeLock() {
  if (!isWakeLockSupported()) return false;
  try {
    const sentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel = sentinel;

    sentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
      updateWakeLockButtons();
    });

    updateWakeLockButtons();
    return true;
  } catch (err) {
    console.warn('Screen Wake Lock request failed:', err);
    wakeLockSentinel = null;
    updateWakeLockButtons();
    return false;
  }
}

async function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (err) {
      console.warn('Error releasing Screen Wake Lock:', err);
    }
    wakeLockSentinel = null;
  }
  updateWakeLockButtons();
}

async function toggleScreenWakeLock() {
  if (!isWakeLockSupported()) return;
  if (isWakeLockRequested || wakeLockSentinel) {
    isWakeLockRequested = false;
    await releaseScreenWakeLock();
  } else {
    isWakeLockRequested = true;
    await requestScreenWakeLock();
  }
}

function updateWakeLockButtons() {
  const supported = isWakeLockSupported();
  const isActive = !!wakeLockSentinel;

  const buttons = document.querySelectorAll('.wake-lock-btn');
  buttons.forEach(btn => {
    if (!supported) {
      btn.style.display = 'none';
      btn.disabled = true;
      return;
    }

    btn.style.display = '';
    btn.disabled = false;
    btn.setAttribute('aria-pressed', String(isActive));

    if (isActive) {
      btn.classList.add('is-active');
      btn.setAttribute('title', 'Keep screen awake during travel and transit (Active - screen timeout temporarily disabled)');
      const label = btn.querySelector('.wake-lock-label');
      if (label) label.textContent = 'Screen Awake (On)';
    } else {
      btn.classList.remove('is-active');
      btn.setAttribute('title', 'Keep screen awake during travel and transit');
      const label = btn.querySelector('.wake-lock-label');
      if (label) label.textContent = 'Screen Awake';
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      if (isWakeLockRequested && !wakeLockSentinel) {
        await requestScreenWakeLock();
      }
    } else if (document.visibilityState === 'hidden') {
      if (wakeLockSentinel) {
        wakeLockSentinel = null;
        updateWakeLockButtons();
      }
    }
  });
}

window.isWakeLockSupported = isWakeLockSupported;
window.requestScreenWakeLock = requestScreenWakeLock;
window.releaseScreenWakeLock = releaseScreenWakeLock;
window.toggleScreenWakeLock = toggleScreenWakeLock;
window.updateWakeLockButtons = updateWakeLockButtons;

window.openTripSummaryModal = openTripSummaryModal;
window.closeTripSummaryModal = closeTripSummaryModal;

function openTripSummaryModal() {
  const modal = document.getElementById('trip-summary-modal');
  if (!modal) return;
  const tbody = document.getElementById('tripSummaryTableBody');
  tbody.innerHTML = '';

  if (!appData || appData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No trip data available.</td></tr>';
    modal.style.display = 'flex';
    return;
  }

  // Iterate over all legs and days
  appData.forEach(leg => {
    if (!leg.days) return;
    leg.days.forEach(day => {
      // Date
      let displayDate = 'TBD';
      if (day.date) {
        displayDate = typeof formatDateStringForDisplay === 'function' 
          ? formatDateStringForDisplay(day.date)
          : day.date;
      }
      const safeDisplayDate = typeof escapeHtmlText === 'function' ? escapeHtmlText(displayDate) : displayDate;
      
      // City
      const rawCity = day.to || leg.city || 'Unknown City';
      const safeCity = typeof escapeHtmlText === 'function' ? escapeHtmlText(rawCity) : rawCity;

      // Accom
      let accomStr = '<span class="text-slate-400 italic">None</span>';
      if (day.date && typeof stays !== 'undefined') {
        const nightStays = stays.filter(s => s.checkIn <= day.date && s.checkOut > day.date);
        if (nightStays.length > 0) {
          accomStr = nightStays.map(s => {
            const safeName = typeof escapeHtmlText === 'function' ? escapeHtmlText(s.name || 'Stay') : (s.name || 'Stay');
            let sStr = '<strong class="text-slate-800 dark:text-slate-200">' + safeName + '</strong>';
            if (s.neighborhood) {
              const safeNeigh = typeof escapeHtmlText === 'function' ? escapeHtmlText(s.neighborhood) : s.neighborhood;
              sStr += ' <span class="text-xs text-slate-500 block">' + safeNeigh + '</span>';
            }
            return sStr;
          }).join('<br>');
        }
      }

      // Transport & Activities
      let eventsHtml = '';
      
      if (day.date && typeof journeys !== 'undefined') {
        const dayJourneys = journeys.filter(j => j.dep && j.dep.startsWith(day.date));
        if (dayJourneys.length > 0) {
          eventsHtml += dayJourneys.map(j => {
            const safeFrom = typeof escapeHtmlText === 'function' ? escapeHtmlText(j.from || '?') : (j.from || '?');
            const safeTo = typeof escapeHtmlText === 'function' ? escapeHtmlText(j.to || '?') : (j.to || '?');
            return '<div class="mb-1 text-blue-600 dark:text-blue-400 text-sm flex items-center">' +
                      '<span class="mr-1 text-lg">✈️</span>' +
                      '<span>' + safeFrom + ' &rarr; ' + safeTo + '</span>' +
                    '</div>';
          }).join('');
        }
      }

      if (day.sights && day.sights.length > 0) {
        eventsHtml += '<ul class="list-disc pl-4 text-sm text-slate-700 dark:text-slate-300 mt-1">';
        day.sights.forEach(sight => {
          const safeSightName = typeof escapeHtmlText === 'function' ? escapeHtmlText(sight.name || sight.title || 'Activity') : (sight.name || sight.title || 'Activity');
          eventsHtml += '<li>' + safeSightName + '</li>';
        });
        eventsHtml += '</ul>';
      }

      if (!eventsHtml) {
        eventsHtml = '<span class="text-slate-400 italic text-sm">Free day</span>';
      }

      const row = document.createElement('tr');
      row.className = 'border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors';
      row.innerHTML = '<td class="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap align-top">' + safeDisplayDate + '</td>' +
        '<td class="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 align-top">' + safeCity + '</td>' +
        '<td class="px-4 py-3 text-sm align-top">' + accomStr + '</td>' +
        '<td class="px-4 py-3 text-sm align-top">' + eventsHtml + '</td>';
      tbody.appendChild(row);
    });
  });

  modal.style.display = 'flex';
}

function closeTripSummaryModal() {
  const modal = document.getElementById('trip-summary-modal');
  if (modal) modal.style.display = 'none';
}

// --- Ambient Offline Banner & PWA Shortcuts ---
function updateOfflineStatus() {
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline) {
    banner.style.display = 'flex';
    banner.classList.add('is-offline');
  } else {
    banner.classList.remove('is-offline');
    banner.style.display = 'none';
  }
}

function initOfflineStatusListener() {
  if (typeof window === 'undefined') return;
  window.addEventListener('offline', updateOfflineStatus);
  window.addEventListener('online', updateOfflineStatus);
  updateOfflineStatus();
}

function handleAppPwaShortcuts() {
  if (typeof window === 'undefined' || !window.location) return;
  const params = new URLSearchParams(window.location.search || '');
  const shortcut = params.get('shortcut');
  const hash = (window.location.hash || '').toLowerCase();

  if (shortcut === 'today' || hash === '#itinerary') {
    if (typeof switchTab === 'function') switchTab('itinerary');
    if (shortcut === 'today' && typeof applyCurrentTripPositionForTab === 'function') {
      applyCurrentTripPositionForTab('itinerary');
    }
  } else if (shortcut === 'transport' || hash === '#transport') {
    if (typeof switchTab === 'function') switchTab('transport');
  }
}

window.updateOfflineStatus = updateOfflineStatus;
window.initOfflineStatusListener = initOfflineStatusListener;
window.handleAppPwaShortcuts = handleAppPwaShortcuts;

// ==========================================================================
// Desktop Split-Pane Layout & Interactions (Milestone 6 / Issues #286, #299)
// ==========================================================================

function getDesktopSplitMode() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('tp_desktop_split_mode');
    if (saved === 'full-itinerary' || saved === 'split') return saved;
  }
  return 'split';
}

function toggleDesktopSplitMode(mode) {
  const targetMode = mode === 'full-itinerary' ? 'full-itinerary' : 'split';
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('tp_desktop_split_mode', targetMode);
    } catch (e) {}
  }

  const shell = document.getElementById('desktopSplitShell');
  const splitBtn = document.getElementById('desktopSplitToggleBtn');
  const fullBtn = document.getElementById('desktopFullWidthToggleBtn');

  if (shell) {
    if (targetMode === 'full-itinerary') {
      shell.classList.add('is-full-itinerary');
    } else {
      shell.classList.remove('is-full-itinerary');
    }
  }

  if (splitBtn && fullBtn) {
    if (targetMode === 'split') {
      splitBtn.classList.add('is-active');
      splitBtn.setAttribute('aria-pressed', 'true');
      fullBtn.classList.remove('is-active');
      fullBtn.setAttribute('aria-pressed', 'false');
    } else {
      splitBtn.classList.remove('is-active');
      splitBtn.setAttribute('aria-pressed', 'false');
      fullBtn.classList.add('is-active');
      fullBtn.setAttribute('aria-pressed', 'true');
    }
  }

  updateStickyOffsets();

  if (targetMode === 'split' && typeof window !== 'undefined' && window.innerWidth >= 1024 && typeof buildDesktopSplitMap === 'function') {
    setTimeout(buildDesktopSplitMap, 60);
  }
}

function toggleDesktopSplitView() {
  const current = getDesktopSplitMode();
  toggleDesktopSplitMode(current === 'split' ? 'full-itinerary' : 'split');
}

function initDesktopSplitLayout() {
  const mode = getDesktopSplitMode();
  toggleDesktopSplitMode(mode);

  if (typeof window !== 'undefined' && !window.__desktopSplitListenersBound) {
    window.__desktopSplitListenersBound = true;

    // Direct click synchronization: clicking anywhere on a day slide or card switches the split-map immediately
    const itineraryEl = document.getElementById('itinerary');
    if (itineraryEl && typeof itineraryEl.addEventListener === 'function') {
      itineraryEl.addEventListener('click', (evt) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
        if (evt.target && typeof evt.target.closest === 'function') {
          if (evt.target.closest('input, button, a, select, [contenteditable="true"]')) return;
          const slide = evt.target.closest('.compact-day-slide');
          if (slide) {
            const dayIdx = parseInt(slide.dataset.dayIndex, 10);
            let legIdx = parseInt(slide.dataset.legIndex, 10);
            if (isNaN(legIdx)) {
              const legEl = slide.closest('.compact-desktop-leg, .leg');
              if (legEl && legEl.id && typeof appData !== 'undefined' && Array.isArray(appData)) {
                const legId = legEl.id.replace(/^leg-/, '');
                legIdx = appData.findIndex(l => String(l.id) === String(legId));
              }
            }
            if (!isNaN(dayIdx) && !isNaN(legIdx) && legIdx >= 0) {
              window.__selectedDayContext = { legIndex: legIdx, dayIndex: dayIdx };
              if (!evt.target.closest('.split-item-selectable, .compact-activity-row, .compact-grouped-item')) {
                syncDesktopSplitToDayInView(true, window.__selectedDayContext);
              }
            }
          }
        }
      });
    }

    if (typeof window.addEventListener === 'function') {
      let scrollRaf = null;
      window.addEventListener('scroll', () => {
        if (window.innerWidth < 1024) return;
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          const scrollContext = findDesktopDayFromScrollPosition();
          if (scrollContext) {
            window.__selectedDayContext = scrollContext;
            syncDesktopSplitToDayInView(false, scrollContext);
          }
          scrollRaf = null;
        });
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && getDesktopSplitMode() === 'split') {
          syncDesktopSplitToDayInView(true);
        }
      });
    }
  }

  if (typeof window !== 'undefined' && window.innerWidth >= 1024 && mode === 'split') {
    setTimeout(() => syncDesktopSplitToDayInView(true), 120);
  }
}

function buildSplitDayData(legIndex, dayIndex) {
  if (typeof appData === 'undefined' || !Array.isArray(appData) || appData.length === 0) return null;

  const safeLegIndex = Math.min(appData.length - 1, Math.max(0, legIndex));
  const leg = appData[safeLegIndex];
  if (!leg || !Array.isArray(leg.days) || leg.days.length === 0) return null;

  const safeDayIndex = Math.min(leg.days.length - 1, Math.max(0, dayIndex));
  const day = leg.days[safeDayIndex];

  let dayNumber = 1;
  for (let i = 0; i < safeLegIndex; i++) {
    dayNumber += (appData[i].days || []).length;
  }
  dayNumber += safeDayIndex;

  const cleanToCity = String(day.to || day.from || leg.label || '').replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').replace(/\s*\(\d+\)$/, '').trim();
  const allStays = (typeof window !== 'undefined' && Array.isArray(window.stays))
    ? window.stays
    : ((typeof stays !== 'undefined' && Array.isArray(stays)) ? stays : []);
  const dayStays = allStays.filter(s => {
    if (!s) return false;
    if (s.date && s.date === day.date) return true;
    if (s.checkIn && s.checkOut && day.date >= s.checkIn && day.date <= s.checkOut) return true;
    return false;
  });

  if (Array.isArray(day.accomItems)) {
    day.accomItems.forEach(ai => {
      if (ai && ai.text && ai.text !== '—' && !ai.text.startsWith('Add accom')) {
        const alreadyHas = dayStays.some(s => (s.propertyName || s.name || '').toLowerCase() === ai.text.toLowerCase());
        if (!alreadyHas) {
          dayStays.push({
            name: ai.text,
            propertyName: ai.text,
            location: ai.location || cleanToCity,
            cost: ai.cost,
            bookingRef: ai.bookingRef,
            checkIn: day.date
          });
        }
      }
    });
  }

  const allJourneys = (typeof window !== 'undefined' && Array.isArray(window.journeys))
    ? window.journeys
    : ((typeof journeys !== 'undefined' && Array.isArray(journeys)) ? journeys : []);
  const dayJourneys = allJourneys.filter(j => {
    if (!j) return false;
    if (j.date && j.date === day.date) return true;
    if (j.fromLocation && j.toLocation && day.from && day.to) {
      const jFrom = String(j.fromLocation).toLowerCase();
      const jTo = String(j.toLocation).toLowerCase();
      const dFrom = String(day.from).toLowerCase();
      const dTo = String(day.to).toLowerCase();
      return (jFrom.includes(dFrom) || dFrom.includes(jFrom)) && (jTo.includes(dTo) || dTo.includes(jTo));
    }
    return false;
  });

  const activities = [];
  if (Array.isArray(day.activityItems)) {
    day.activityItems.forEach((item, itemIdx) => {
      const matched = (typeof findAssignedSuggestedActivity === 'function')
        ? findAssignedSuggestedActivity(safeLegIndex, safeDayIndex, item.text, item.activityId)
        : null;
      activities.push({
        title: item.title || item.text || (matched && matched.title) || 'Activity',
        location: item.location || (matched && matched.location) || '',
        time: item.time || item.estTime || (matched && (matched.estTime || matched.time)) || '',
        cost: item.cost || item.estCost || (matched && (matched.estCost || matched.cost)) || '',
        notes: item.notes || (matched && matched.notes) || '',
        done: !!item.done,
        activityId: item.activityId || item.id || (matched && (matched.id || matched.activityId)) || `act-${itemIdx}`,
        lat: item.lat || (matched && matched.lat),
        lng: item.lng || (matched && matched.lng),
        cityId: item.cityId || (matched && matched.cityId) || leg.id || '',
        cityName: day.to || day.from || leg.label || ''
      });
    });
  }
  if (Array.isArray(leg.suggestedActivities)) {
    leg.suggestedActivities
      .filter(a => a.assignedDayIdx === safeDayIndex && !activities.some(act => (act.title || '').trim() === (a.title || a.text || '').trim()))
      .forEach((a, aIdx) => activities.push({
        title: a.title || a.text || 'Activity',
        location: a.location || '',
        time: a.estTime || a.time || '',
        cost: a.estCost || a.cost || '',
        notes: a.notes || '',
        done: !!a.done,
        activityId: a.id || a.activityId || `sug-${aIdx}`,
        lat: a.lat,
        lng: a.lng,
        cityId: a.cityId || leg.id || '',
        cityName: day.to || day.from || leg.label || ''
      }));
  }

  let mapRoute = { stops: [], url: '' };
  if (typeof getDailyTimelineMapRoute === 'function') {
    try {
      mapRoute = getDailyTimelineMapRoute(safeLegIndex, safeDayIndex);
    } catch (e) {}
  }

  return {
    legIndex: safeLegIndex,
    dayIndex: safeDayIndex,
    dayNumber,
    leg,
    day,
    date: day.date,
    dayName: day.day,
    from: day.from || leg.label,
    to: day.to || day.from || leg.label,
    stays: dayStays,
    journeys: dayJourneys,
    activities: activities,
    mapRoute: mapRoute
  };
}

let _cachedSplitHeaderEl = null;
let _cachedSplitDrawerEl = null;

function _getSplitHeaderEl() {
  if (!_cachedSplitHeaderEl || !_cachedSplitHeaderEl.isConnected) {
    _cachedSplitHeaderEl = typeof document !== 'undefined' ? document.querySelector('.desktop-split-right-header') : null;
  }
  return _cachedSplitHeaderEl;
}

function _getSplitDrawerEl() {
  if (!_cachedSplitDrawerEl || !_cachedSplitDrawerEl.isConnected) {
    _cachedSplitDrawerEl = typeof document !== 'undefined' ? document.querySelector('.desktop-split-drawer') : null;
  }
  return _cachedSplitDrawerEl;
}

function findDesktopDayFromScrollPosition() {
  if (typeof document === 'undefined') return null;

  // 1. Calculate hit zone: bounded from the top bar of the map to the bottom of the day detail drawer
  let zoneTop = 184;
  let zoneBottom = typeof window !== 'undefined' ? (window.innerHeight - 16) : 884;

  const header = _getSplitHeaderEl();
  const drawer = _getSplitDrawerEl();
  if (header) {
    const r = header.getBoundingClientRect();
    if (r.height > 0) zoneTop = r.top;
  }
  if (drawer) {
    const r = drawer.getBoundingClientRect();
    if (r.height > 0) zoneBottom = r.bottom;
  }

  if (zoneBottom <= zoneTop) {
    zoneBottom = zoneTop + 400;
  }

  // 2. Evaluate visible day cards/slides within the hit zone [zoneTop, zoneBottom]
  const candidateSlides = Array.from(document.querySelectorAll(
    '#itinerary .compact-day-slide.is-active, #itinerary .compact-day-slide.open, #itinerary .day-card.open, #itinerary .compact-day-slide, #itinerary .day-card'
  ));

  let bestDayCandidate = null;
  let maxDayOverlap = -1;

  for (const card of candidateSlides) {
    const r = card.getBoundingClientRect();
    if (r.height <= 0 || r.width <= 0) continue;

    const overlap = Math.max(0, Math.min(r.bottom, zoneBottom) - Math.max(r.top, zoneTop));
    if (overlap > maxDayOverlap) {
      const dayIdxAttr = card.getAttribute('data-day-index');
      let legIdxAttr = card.getAttribute('data-leg-index');
      if (legIdxAttr === null || legIdxAttr === undefined || legIdxAttr === '') {
        const legEl = card.closest('.compact-desktop-leg, .leg');
        if (legEl && legEl.id && typeof appData !== 'undefined' && Array.isArray(appData)) {
          const legId = legEl.id.replace(/^leg-/, '');
          const foundIdx = appData.findIndex(l => String(l.id) === String(legId));
          if (foundIdx >= 0) legIdxAttr = String(foundIdx);
        }
      }

      if (dayIdxAttr !== null && legIdxAttr !== null) {
        maxDayOverlap = overlap;
        bestDayCandidate = {
          legIndex: Math.max(0, Number(legIdxAttr) || 0),
          dayIndex: Math.max(0, Number(dayIdxAttr) || 0)
        };
      }
    }
  }

  if (bestDayCandidate && maxDayOverlap > 30) {
    return bestDayCandidate;
  }

  // 3. Evaluate leg elements within the hit zone [zoneTop, zoneBottom]
  const legElements = Array.from(document.querySelectorAll('#itinerary .compact-desktop-leg, #itinerary .leg'));
  if (legElements.length === 0) return null;

  let bestLegIndex = 0;
  let maxLegOverlap = -1;

  for (let i = 0; i < legElements.length; i++) {
    const r = legElements[i].getBoundingClientRect();
    if (r.height <= 0) continue;
    const overlap = Math.max(0, Math.min(r.bottom, zoneBottom) - Math.max(r.top, zoneTop));
    if (overlap > maxLegOverlap) {
      maxLegOverlap = overlap;
      bestLegIndex = i;
    }
  }

  let activeDayIndex = 0;
  const activeLegEl = legElements[bestLegIndex];
  if (activeLegEl) {
    const pager = activeLegEl.querySelector('.compact-day-pager');
    if (pager) {
      activeDayIndex = Math.max(0, Number(pager.dataset.activeIndex || 0));
    }
  }

  return { legIndex: bestLegIndex, dayIndex: activeDayIndex };
}

function findCurrentDesktopDayInView(preferredContext = null) {
  if (typeof appData === 'undefined' || !Array.isArray(appData) || appData.length === 0) return null;

  const context = preferredContext || window.__selectedDayContext || findDesktopDayFromScrollPosition();
  const legIdx = context ? Math.max(0, Math.min(appData.length - 1, Number(context.legIndex) || 0)) : 0;
  const dayIdx = context ? Math.max(0, Number(context.dayIndex) || 0) : 0;

  return buildSplitDayData(legIdx, dayIdx);
}

function syncDesktopSplitToDayInView(force = false, preferredContext = null) {
  if (typeof window === 'undefined' || window.innerWidth < 1024) return;
  if (typeof getDesktopSplitMode === 'function' && getDesktopSplitMode() === 'full-itinerary') return;

  const dayData = findCurrentDesktopDayInView(preferredContext);
  if (!dayData) return;

  const dayKey = `${dayData.legIndex}-${dayData.dayIndex}`;
  if (!force && dayKey === window.__lastSplitDayKey) return;
  window.__lastSplitDayKey = dayKey;
  window.__activeSplitDayData = dayData;

  // 1. Update split map
  if (typeof renderDesktopSplitDayMap === 'function') {
    renderDesktopSplitDayMap(dayData);
  }

  // 2. Update split drawer (unless an individual item is currently inspected)
  const drawerContent = document.getElementById('splitDrawerContent');
  const isIndividualItemSelected = drawerContent && !drawerContent.hidden && drawerContent.querySelector('.split-drawer-item-card') && !drawerContent.querySelector('.split-drawer-day-card');
  if (!isIndividualItemSelected || force) {
    renderSplitDrawerForDay(dayData);
  }
}

function renderSplitDrawerForDay(dayData) {
  const drawer = document.getElementById('splitDrawerContent');
  const placeholder = document.getElementById('splitDrawerPlaceholder');
  if (!drawer || !placeholder) return;

  if (!dayData) {
    clearSplitDrawer();
    return;
  }

  const fromCity = String(dayData.from || '').trim();
  const toCity = String(dayData.to || dayData.from || '').trim();
  const cleanFrom = fromCity.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}|^[📍🗺️✈️🏨🏠\s]+/u, '').replace(/\s*\(\d+\)$/, '').trim();
  const cleanTo = toCity.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}|^[📍🗺️✈️🏨🏠\s]+/u, '').replace(/\s*\(\d+\)$/, '').trim();
  const isTravelDay = cleanFrom.toLowerCase() !== cleanTo.toLowerCase() && cleanFrom.length > 0 && cleanTo.length > 0;
  const dayNumber = dayData.dayNumber || 1;
  const dayDateLabel = [dayData.dayName, dayData.date].filter(Boolean).join(', ');

  const journeys = Array.isArray(dayData.journeys) ? dayData.journeys : [];
  const stays = Array.isArray(dayData.stays) ? dayData.stays : [];
  const activities = Array.isArray(dayData.activities) ? dayData.activities : [];

  const pills = [];

  journeys.forEach(j => {
    const label = j.journeyName || j.name || `${j.fromLocation || cleanFrom} → ${j.toLocation || cleanTo}`;
    const tIcon = typeof getTransportIcon === 'function' ? getTransportIcon(j.transportType) : '✈️';
    const time = j.departureTime ? ` (${j.departureTime})` : '';
    pills.push(`
      <span class="split-day-pill transport" title="${typeof escapeHtmlText === 'function' ? escapeHtmlText(label) : label}" onclick="selectSplitPaneItem({ title: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(label) : label}', type: 'transport', transportType: '${j.transportType || 'flight'}', location: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(j.toLocation || cleanTo) : (j.toLocation || cleanTo)}', time: '${j.departureTime || ''}', cost: '${j.cost || ''}', notes: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(j.notes || '') : (j.notes || '')}', bookingRef: '${j.bookingReference || j.bookingRef || ''}' })">
        <span>${tIcon}</span> <span class="truncate">${typeof escapeHtmlText === 'function' ? escapeHtmlText(label) : label}${time}</span>
      </span>
    `);
  });

  stays.forEach(s => {
    const sName = s.name || s.propertyName || 'Accommodation';
    const sLoc = s.location || s.city || cleanTo;
    pills.push(`
      <span class="split-day-pill stay" title="${typeof escapeHtmlText === 'function' ? escapeHtmlText(sName) : sName}" onclick="selectSplitPaneItem({ title: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(sName) : sName}', type: 'stay', location: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(sLoc) : sLoc}', bookingRef: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(s.bookingRef || '') : (s.bookingRef || '')}', cost: '${s.cost || ''}', notes: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(s.notes || '') : (s.notes || '')}' })">
        <span>🏨</span> <span class="truncate">${typeof escapeHtmlText === 'function' ? escapeHtmlText(sName) : sName}</span>
      </span>
    `);
  });

  activities.forEach((a, aIdx) => {
    const title = a.title || a.text || 'Activity';
    const cost = a.cost || a.estCost ? (typeof formatCurrency === 'function' ? formatCurrency(a.cost || a.estCost) : `$${a.cost || a.estCost}`) : '';
    const duration = a.time || a.estTime || '';
    pills.push(`
      <span class="split-day-pill activity" title="${typeof escapeHtmlText === 'function' ? escapeHtmlText(title) : title}" onclick="selectSplitPaneItem({ title: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(title) : title}', type: 'activity', location: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(a.location || cleanTo) : (a.location || cleanTo)}', time: '${duration}', cost: '${cost}', notes: '${typeof escapeHtmlText === 'function' ? escapeHtmlText(a.notes || '') : (a.notes || '')}', activityId: '${a.activityId || ''}' })">
        <span>🎯 ${aIdx + 1}.</span> <span class="truncate ${a.done ? 'line-through opacity-70' : ''}">${typeof escapeHtmlText === 'function' ? escapeHtmlText(title) : title}</span>
      </span>
    `);
  });

  const cityTitle = isTravelDay
    ? `${cleanFrom} → ${cleanTo}`
    : (cleanTo || cleanFrom);

  placeholder.hidden = true;
  drawer.hidden = false;
  drawer.innerHTML = `
    <div class="split-drawer-item-card split-drawer-day-card">
      <div class="split-day-header flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="split-drawer-badge ${isTravelDay ? 'transport' : 'activity'} shrink-0">
            <span>${isTravelDay ? '✈️ Day ' + dayNumber : '📍 Day ' + dayNumber}</span>
          </span>
          <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate m-0">
            ${typeof escapeHtmlText === 'function' ? escapeHtmlText(cityTitle) : cityTitle}
          </h4>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:inline">
            (${typeof escapeHtmlText === 'function' ? escapeHtmlText(dayDateLabel) : dayDateLabel})
          </span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${dayData.mapRoute && dayData.mapRoute.url ? `
            <a href="${dayData.mapRoute.url}" target="_blank" rel="noopener noreferrer" class="text-[11px] px-2 py-0.5 rounded font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 dark:text-teal-300 transition-colors" title="View day route in Google Maps">
              🗺️ Maps ↗
            </a>
          ` : ''}
          <span class="text-[11px] px-1.5 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            ${pills.length} item${pills.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div class="split-day-pills-wrap">
        ${pills.length > 0 ? pills.join('') : '<span class="text-xs text-slate-400 italic py-1">No activities or stops scheduled for this day</span>'}
      </div>
    </div>
  `;
}

function restoreSplitDayOverview() {
  if (window.__activeSplitDayData && typeof renderSplitDrawerForDay === 'function') {
    renderSplitDrawerForDay(window.__activeSplitDayData);
    if (typeof renderDesktopSplitDayMap === 'function') {
      renderDesktopSplitDayMap(window.__activeSplitDayData);
    }
  }
}

function renderSplitDrawerContent(itemData) {
  const drawer = document.getElementById('splitDrawerContent');
  const placeholder = document.getElementById('splitDrawerPlaceholder');
  if (!drawer || !placeholder) return;

  if (!itemData) {
    clearSplitDrawer();
    return;
  }

  const type = String(itemData.type || 'activity').toLowerCase();
  const title = itemData.title || itemData.name || itemData.text || 'Item Details';
  const location = itemData.location || itemData.city || '';
  const duration = itemData.duration || itemData.estTime || itemData.time || '';
  const cost = itemData.cost || itemData.estCost ? (typeof formatCurrency === 'function' ? formatCurrency(itemData.cost || itemData.estCost) : `${itemData.cost || itemData.estCost}`) : '';
  const notes = itemData.notes || '';
  const bookingRef = itemData.bookingRef || '';
  const provider = itemData.provider || '';

  let badgeType = 'activity';
  let badgeLabel = 'Activity';
  let badgeIcon = '📍';

  if (type === 'stay' || type === 'hotel' || type === 'accommodation' || type === 'checkin' || type === 'checkout') {
    badgeType = 'stay';
    badgeLabel = 'Stay';
    badgeIcon = '🏨';
  } else if (type === 'transport' || type === 'flight' || type === 'train' || type === 'bus' || type === 'journey') {
    badgeType = 'transport';
    badgeLabel = itemData.transportType ? (itemData.transportType.charAt(0).toUpperCase() + itemData.transportType.slice(1)) : 'Transport';
    badgeIcon = typeof getTransportIcon === 'function' ? getTransportIcon(itemData.transportType) : '✈️';
  } else if (type === 'city') {
    badgeType = 'activity';
    badgeLabel = itemData.isTransit ? 'Transit City' : 'Destination';
    badgeIcon = '🏙️';
  }

  const mapsUrl = location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : '';

  placeholder.hidden = true;
  drawer.hidden = false;
  drawer.innerHTML = `
    <div class="split-drawer-item-card">
      <div class="flex items-center justify-between gap-2">
        <span class="split-drawer-badge ${badgeType}">
          <span>${badgeIcon}</span> <span>${typeof escapeHtmlText === 'function' ? escapeHtmlText(badgeLabel) : badgeLabel}</span>
        </span>
        <button type="button" class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" onclick="clearSplitDrawer()" title="Clear selection">&times;</button>
      </div>
      <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug m-0">${typeof escapeHtmlText === 'function' ? escapeHtmlText(title) : title}</h4>
      ${location ? `
        <div class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <span>📍</span>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium" title="Open in Google Maps">
            ${typeof escapeHtmlText === 'function' ? escapeHtmlText(location) : location} ↗
          </a>
        </div>
      ` : ''}
      <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
        ${duration ? `<span>⏱️ ${typeof escapeHtmlText === 'function' ? escapeHtmlText(duration) : duration}</span>` : ''}
        ${cost ? `<span>💵 ${typeof escapeHtmlText === 'function' ? escapeHtmlText(cost) : cost}</span>` : ''}
        ${provider ? `<span>🏷️ ${typeof escapeHtmlText === 'function' ? escapeHtmlText(provider) : provider}</span>` : ''}
        ${bookingRef ? `<span>#️⃣ ${typeof escapeHtmlText === 'function' ? escapeHtmlText(bookingRef) : bookingRef}</span>` : ''}
      </div>
      ${notes ? `
        <p class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-100 dark:border-slate-800/80 m-0">
          💬 ${typeof escapeHtmlText === 'function' ? escapeHtmlText(notes) : notes}
        </p>
      ` : ''}
      <div class="flex items-center gap-2 pt-1 flex-wrap">
        <button type="button" class="action-btn text-xs py-1 px-2.5 font-semibold text-teal-700 dark:text-teal-300" onclick="restoreSplitDayOverview()" title="Return to Day Overview">← Day Overview</button>
        ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="action-btn text-xs py-1 px-2.5">Open in Google Maps</a>` : ''}
        <button type="button" class="action-btn text-xs py-1 px-2 text-slate-500" onclick="clearSplitDrawer()">Dismiss</button>
      </div>
    </div>
  `;
}

function clearSplitDrawer() {
  const drawer = document.getElementById('splitDrawerContent');
  const placeholder = document.getElementById('splitDrawerPlaceholder');
  if (drawer) {
    drawer.hidden = true;
    drawer.innerHTML = '';
  }
  if (placeholder) {
    placeholder.hidden = false;
  }
}

function selectSplitPaneItem(itemData, targetElement = null) {
  if (!itemData) return;

  document.querySelectorAll('.split-active-item').forEach(el => el.classList.remove('split-active-item'));
  if (targetElement) {
    targetElement.classList.add('split-active-item');
  }

  renderSplitDrawerContent(itemData);

  const loc = itemData.location || itemData.city || itemData.name || itemData.title;
  if (typeof focusStopOnSplitMap === 'function') {
    focusStopOnSplitMap(loc, itemData);
  }
}

function handleSplitItemClick(itemEl, event) {
  if (!itemEl) return;
  if (event && event.target && typeof event.target.closest === 'function') {
    if (event.target.closest('input[type="checkbox"], button, a, .modal-close, select, [contenteditable="true"]')) {
      return;
    }
  }

  // 1. Direct day sync: ensure the map is centered on this day's locations first
  const slideEl = itemEl.closest('.compact-day-slide');
  if (slideEl) {
    const dayIdx = parseInt(slideEl.dataset.dayIndex, 10);
    let legIdx = parseInt(slideEl.dataset.legIndex, 10);
    if (isNaN(legIdx)) {
      const legEl = slideEl.closest('.compact-desktop-leg, .leg');
      if (legEl && legEl.id && typeof appData !== 'undefined' && Array.isArray(appData)) {
        const legId = legEl.id.replace(/^leg-/, '');
        legIdx = appData.findIndex(l => String(l.id) === String(legId));
      }
    }
    if (!isNaN(dayIdx) && !isNaN(legIdx) && legIdx >= 0) {
      window.__selectedDayContext = { legIndex: legIdx, dayIndex: dayIdx };
      syncDesktopSplitToDayInView(true, window.__selectedDayContext);
    }
  }

  const itemData = {
    title: itemEl.dataset.itemTitle || itemEl.querySelector('.daily-timeline-title, .compact-emoji-text, h4')?.textContent?.trim() || '',
    type: itemEl.dataset.itemType || 'activity',
    transportType: itemEl.dataset.itemTransportType || '',
    location: itemEl.dataset.itemLocation || itemEl.querySelector('.daily-timeline-sub-locations, .transport-sub-location-detail')?.textContent?.trim() || '',
    time: itemEl.dataset.itemTime || itemEl.querySelector('.daily-timeline-time, .compact-emoji-duration')?.textContent?.trim() || '',
    cost: itemEl.dataset.itemCost || itemEl.querySelector('.compact-emoji-cost')?.textContent?.trim() || '',
    notes: itemEl.dataset.itemNotes || '',
    provider: itemEl.dataset.itemProvider || '',
    bookingRef: itemEl.dataset.itemRef || ''
  };

  selectSplitPaneItem(itemData, itemEl);
}

window.handleSplitItemClick = handleSplitItemClick;

// ==========================================================================
// Distraction-Free Printable Itinerary (Milestone 6 / Issues #287, #300)
// ==========================================================================

function populatePrintTripHeader() {
  const titleEl = document.getElementById('printTripTitle');
  const subtitleEl = document.getElementById('printTripSubtitle');
  const iconEl = document.getElementById('printTripIcon');
  const datesEl = document.getElementById('printTripDates');
  const durationEl = document.getElementById('printTripDuration');
  const destsEl = document.getElementById('printTripDestinations');
  const staysCountEl = document.getElementById('printTripStaysCount');
  const tableBody = document.getElementById('printAccomTableBody');

  if (!titleEl) return;

  const currentTripName = document.getElementById('currentTripTitle')?.textContent?.trim() || 'My Trip';
  const currentTripIcon = document.getElementById('currentTripIcon')?.textContent?.trim() || '✈️';
  const currentSubtitle = document.getElementById('mainSubtitle')?.textContent?.trim() || '';

  titleEl.textContent = currentTripName;
  if (iconEl) iconEl.textContent = currentTripIcon;
  if (subtitleEl) subtitleEl.textContent = currentSubtitle;

  // Calculate dates & duration
  let minDate = '';
  let maxDate = '';
  let totalDays = 0;
  const destinationSet = new Set();

  if (typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData.forEach(leg => {
      if (leg.label) destinationSet.add(leg.label.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim());
      (leg.days || []).forEach(d => {
        totalDays++;
        if (d.date) {
          if (!minDate || d.date < minDate) minDate = d.date;
          if (!maxDate || d.date > maxDate) maxDate = d.date;
        }
        if (d.from) destinationSet.add(d.from.trim());
        if (d.to) destinationSet.add(d.to.trim());
      });
    });
  }

  if (datesEl) {
    datesEl.textContent = minDate && maxDate ? `${minDate} to ${maxDate}` : (minDate || 'Dates not set');
  }
  if (durationEl) {
    const nights = Math.max(0, totalDays - 1);
    durationEl.textContent = `${totalDays} Day${totalDays !== 1 ? 's' : ''} (${nights} Night${nights !== 1 ? 's' : ''})`;
  }
  if (destsEl) {
    destsEl.textContent = `${destinationSet.size} Destinations`;
  }

  // Populate accommodations table
  const staysList = (typeof window !== 'undefined' && Array.isArray(window.stays))
    ? window.stays
    : ((typeof window !== 'undefined' && Array.isArray(window.staysData))
      ? window.staysData
      : ((typeof global !== 'undefined' && Array.isArray(global.staysData))
        ? global.staysData
        : ((typeof stays !== 'undefined' && Array.isArray(stays)) ? stays : [])));
  if (staysCountEl) {
    staysCountEl.textContent = `${staysList.length} Booked / Planned`;
  }

  if (tableBody) {
    if (staysList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 8px;">No accommodations listed in this trip.</td></tr>`;
    } else {
      const cityList = (typeof window !== 'undefined' && Array.isArray(window.citiesData)) ? window.citiesData : [];
      tableBody.innerHTML = staysList.map(s => {
        const cityObj = cityList.find(c => c.id === s.cityId);
        const cityName = cityObj ? cityObj.name : (s.city || '—');
        const checkIn = s.checkIn ? (typeof formatDateShort === 'function' ? formatDateShort(s.checkIn) : s.checkIn) : '—';
        const checkOut = s.checkOut ? (typeof formatDateShort === 'function' ? formatDateShort(s.checkOut) : s.checkOut) : '—';
        const locInfo = [s.location, s.notes].filter(Boolean).join(' · ');

        return `
          <tr>
            <td><strong>${typeof escapeHtmlText === 'function' ? escapeHtmlText(cityName) : cityName}</strong></td>
            <td>${typeof escapeHtmlText === 'function' ? escapeHtmlText(s.name || s.propertyName || 'Accommodation') : (s.name || 'Accommodation')}</td>
            <td>${typeof escapeHtmlText === 'function' ? escapeHtmlText(checkIn) : checkIn}</td>
            <td>${typeof escapeHtmlText === 'function' ? escapeHtmlText(checkOut) : checkOut}</td>
            <td><code>${typeof escapeHtmlText === 'function' ? escapeHtmlText(s.bookingRef || '—') : (s.bookingRef || '—')}</code></td>
            <td>${typeof escapeHtmlText === 'function' ? escapeHtmlText(locInfo || '—') : (locInfo || '—')}</td>
          </tr>
        `;
      }).join('');
    }
  }
}

function printItinerary() {
  populatePrintTripHeader();

  // Switch to itinerary tab to ensure all itinerary HTML is present
  if (typeof switchTab === 'function' && typeof document !== 'undefined' && document.getElementById('tab-itinerary')) {
    switchTab('itinerary');
  }

  // Expand all days if helper exists
  if (typeof toggleAllDays === 'function') {
    const expandBtn = document.getElementById('expandAll');
    if (expandBtn && expandBtn.textContent.includes('Expand')) {
      toggleAllDays();
    }
  }

  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.setTimeout(() => {
      window.print();
    }, 150);
  }
}

// Global click delegation on itinerary items to sync right-hand map and detail drawer
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    initDesktopSplitLayout();

    const itineraryContainer = document.getElementById('itinerary');
    if (itineraryContainer && typeof itineraryContainer.addEventListener === 'function') {
      itineraryContainer.addEventListener('click', (event) => {
        if (event.target.closest('input[type="checkbox"], button, a, .modal-close, select, [contenteditable="true"]')) return;

        const itemEl = event.target.closest('.split-item-selectable, .compact-activity-row, .compact-grouped-item, .daily-timeline-item');
        if (itemEl) {
          const itemData = {
            title: itemEl.dataset.itemTitle || itemEl.querySelector('.daily-timeline-title, .compact-emoji-text, h4')?.textContent?.trim() || '',
            type: itemEl.dataset.itemType || 'activity',
            transportType: itemEl.dataset.itemTransportType || '',
            location: itemEl.dataset.itemLocation || itemEl.querySelector('.daily-timeline-sub-locations, .transport-sub-location-detail')?.textContent?.trim() || '',
            time: itemEl.dataset.itemTime || itemEl.querySelector('.daily-timeline-time, .compact-emoji-duration')?.textContent?.trim() || '',
            cost: itemEl.dataset.itemCost || itemEl.querySelector('.compact-emoji-cost')?.textContent?.trim() || '',
            notes: itemEl.dataset.itemNotes || '',
            provider: itemEl.dataset.itemProvider || '',
            bookingRef: itemEl.dataset.itemRef || ''
          };
          selectSplitPaneItem(itemData, itemEl);
        }
      });
    }
  });
}

window.getDesktopSplitMode = getDesktopSplitMode;
window.toggleDesktopSplitMode = toggleDesktopSplitMode;
window.toggleDesktopSplitView = toggleDesktopSplitView;
window.initDesktopSplitLayout = initDesktopSplitLayout;
window.renderSplitDrawerContent = renderSplitDrawerContent;
window.renderSplitDrawerForDay = renderSplitDrawerForDay;
window.restoreSplitDayOverview = restoreSplitDayOverview;
window.findCurrentDesktopDayInView = findCurrentDesktopDayInView;
window.syncDesktopSplitToDayInView = syncDesktopSplitToDayInView;
window.clearSplitDrawer = clearSplitDrawer;
window.selectSplitPaneItem = selectSplitPaneItem;
window.buildSplitDayData = buildSplitDayData;
window.findDesktopDayFromScrollPosition = findDesktopDayFromScrollPosition;
window.populatePrintTripHeader = populatePrintTripHeader;
window.printItinerary = printItinerary;

