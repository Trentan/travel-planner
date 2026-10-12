const path = require('path');
const { assert, loadSource } = require('./lib/test-helpers');

function runTask1ShellTests() {
  const indexHtml = loadSource('index.html');
  const responsiveCss = loadSource(path.join('src', 'css', 'responsive-core.css'));
  const componentsCss = loadSource(path.join('src', 'css', 'components.css'));
  const uiJs = loadSource(path.join('js', 'ui.js'));

  assert(
    indexHtml.includes('interactive-widget=resizes-content'),
    'Task 1: index.html viewport meta should include interactive-widget=resizes-content'
  );
  assert(
    !indexHtml.includes('mobile-menu-quick-tabs') &&
      indexHtml.includes('open-map-action'),
    'Task 1: #mobileMenuSheet should remove .mobile-menu-quick-tabs and #tab-itinerary should include .open-map-action button next to Legs'
  );
  assert(
    responsiveCss.includes('grid-template-columns: repeat(6, minmax(0, 1fr))') &&
      responsiveCss.includes('.app-tabs-nav .app-tab-btn[data-tab="map"]'),
    'Task 1: responsive-core.css should use a 6-column mobile bottom tab bar (Itinerary, Transit, Stays, Budget, Packing, Menu) and hide Map from bottom bar'
  );
  assert(
    componentsCss.includes('body.mobile-app-mode #cityNav') &&
      componentsCss.includes('position: sticky !important;'),
    'Task 1: components.css should dock #cityNav as sticky at the top on mobile instead of fixed above bottom tabs'
  );
  assert(
    uiJs.includes('mobileTabScrollPositions') && uiJs.includes('startViewTransition'),
    'Task 1: switchTab in js/ui.js should preserve per-tab scroll positions and use startViewTransition when available'
  );
}

function runTask2VerticalTimelineTests() {
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const utilsJs = loadSource(path.join('js', 'utils.js'));
  const tailwindCss = loadSource(path.join('src', 'tailwind.css'));
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    itineraryJs.includes('mobile-city-vertical-timeline'),
    'Task 2: js/itinerary.js should render .mobile-city-vertical-timeline for continuous vertical day flow'
  );
  assert(
    utilsJs.includes('compact-day-header'),
    'Task 2: renderMobileSurfaceCard in js/utils.js should include .compact-day-header so day headings stick while scrolling vertically'
  );
  assert(
    tailwindCss.includes('overflow-x: clip !important;'),
    'Task 2: src/tailwind.css should use overflow-x: clip !important so mobile itinerary wrappers do not break position: sticky on day headings'
  );
  assert(
    itineraryJs.includes('mobile-vertical-days-banner') &&
      itineraryJs.includes('mobile-day-scroll-bridge') &&
      itineraryJs.includes('mobile-day-next-jump-chip'),
    'Task 2: js/itinerary.js should render vertical day scroll signals (.mobile-vertical-days-banner, .mobile-day-scroll-bridge, .mobile-day-next-jump-chip)'
  );
  assert(
    itineraryJs.includes('__citySwipeGestureBound'),
    'Task 2: js/itinerary.js should support horizontal left/right swipe between cities alongside vertical day scroll'
  );
  assert(
    itineraryJs.includes('mobile-next-city-card') && itineraryJs.includes('compactItineraryGoToCityIndex'),
    'Task 2: js/itinerary.js should render a Next City footer card at the end of a city timeline'
  );
  assert(
    itineraryJs.includes('setupMobileVerticalDayScrollSpy'),
    'Task 2: js/itinerary.js should wire an IntersectionObserver scroll-spy for day chips'
  );
  assert(
    mobileFeaturesCss.includes('.mobile-city-vertical-timeline') &&
      mobileFeaturesCss.includes('flex-direction: column') &&
      mobileFeaturesCss.includes('.mobile-day-scroll-bridge'),
    'Task 2: mobile-features.css should stack days vertically inside .mobile-city-vertical-timeline and style vertical scroll signals'
  );
}

function runTask3BottomSheetAndDragTests() {
  const uiJs = loadSource(path.join('js', 'ui.js'));
  const dragdropJs = loadSource(path.join('js', 'dragdrop.js'));
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    uiJs.includes('setupMobileBottomSheetGestures') && uiJs.includes('setupMobileKeyboardFocusScroll'),
    'Task 3: js/ui.js should implement setupMobileBottomSheetGestures and setupMobileKeyboardFocusScroll'
  );
  assert(
    dragdropJs.includes('passive: false') && dragdropJs.includes('e.preventDefault()'),
    'Task 3: js/dragdrop.js should use { passive: false } and call e.preventDefault() during active touch leg reordering'
  );
  assert(
    mobileFeaturesCss.includes('border-radius: 1.25rem 1.25rem 0 0'),
    'Task 3: mobile-features.css should style mobile dialogs as bottom-anchored sheets'
  );
}

function runTask4MobileMapTests() {
  const indexHtml = loadSource('index.html');
  const uiJs = loadSource(path.join('js', 'ui.js'));
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const mapJs = loadSource(path.join('js', 'map.js'));
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    !indexHtml.includes('add-city-action') && indexHtml.includes('id="cityNavPullHandle"'),
    'Task 4: index.html should remove redundant .add-city-action button and include #cityNavPullHandle inside #cityNav'
  );
  assert(
    uiJs.includes('toggleCityNavDrawer') && uiJs.includes('setupCityNavPullGesture'),
    'Task 4: js/ui.js should implement toggleCityNavDrawer and setupCityNavPullGesture for the pull-down cross-tab #cityNav drawer'
  );
  assert(
    itineraryJs.includes('scrollMobileSwipePagerToCity') && itineraryJs.includes('focusCityInBudgetTab'),
    'Task 4: selectCityFilter in js/itinerary.js should interact with Transit, Stays, Map, and Budget tabs'
  );
  assert(
    mapJs.includes('mobile-map-card-strip') &&
      mapJs.includes('highlightCityNavByCityId') &&
      mapJs.includes('resetMapViewToAll'),
    'Task 4: js/map.js should sync .mobile-map-card-strip with the unified top #cityNav scroll bar'
  );
  assert(
    mapJs.includes('renderMobileMapOverlayControls'),
    'Task 4: js/map.js should expose renderMobileMapOverlayControls for synced mobile map cards'
  );
  assert(
    mobileFeaturesCss.includes('.mobile-map-card-strip') &&
      mobileFeaturesCss.includes('#cityNav.is-tucked') &&
      mobileFeaturesCss.includes('min-height: 1.68rem !important') &&
      mobileFeaturesCss.includes('100dvh'),
    'Task 4: mobile-features.css should style slimmer #cityNav buttons, #cityNav.is-tucked pull-down drawer, and full-viewport mobile map'
  );
}

function runTask5VisualPolishTests() {
  const uiJs = loadSource(path.join('js', 'ui.js'));
  const utilsJs = loadSource(path.join('js', 'utils.js'));
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    uiJs.includes("cityNav.classList.remove('is-tucked')") &&
      utilsJs.includes("b.classList.toggle('is-visited'") &&
      mobileFeaturesCss.includes('.city-nav-btn[data-city="all"]') &&
      mobileFeaturesCss.includes('.city-nav-btn.is-visited'),
    'Task 5: #cityNav should always be displayed on mobile, include the All button, and highlight visited/active city progression across tabs'
  );
  assert(
    itineraryJs.includes('compact-day-slide--${dayParity}') &&
      itineraryJs.includes('compact-day-surface--${dayParity}'),
    'Task 5: js/itinerary.js should attach day parity classes to compact day slides and surfaces'
  );
  assert(
    mobileFeaturesCss.includes('.compact-day-slide--even .compact-day-surface') &&
      mobileFeaturesCss.includes('.compact-day-slide--odd .compact-day-surface') &&
      mobileFeaturesCss.includes('#tab-itinerary .compact-leg-card') &&
      mobileFeaturesCss.includes('#tab-itinerary .compact-day-pager') &&
      mobileFeaturesCss.includes('.city-nav-pull-handle .city-flag-img'),
    'Task 5: mobile-features.css should style full-width mobile containers without nested panel insets and alternating day shading'
  );
}

function runTask6CrossTabMobileOptimizationTests() {
  const transportJs = loadSource(path.join('js', 'transport.js'));
  const tabsJs = loadSource(path.join('js', 'tabs.js'));
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    transportJs.includes('transport-segment-card--${segParity}'),
    'Task 6: js/transport.js should attach alternating parity classes to compact transport segment cards'
  );
  assert(
    tabsJs.includes('budget-mobile-row--${parity}') &&
      tabsJs.includes('checkInDisplay') &&
      tabsJs.includes('checkOutDisplay'),
    'Task 6: js/tabs.js should combine Check In/Out dates with times on Stays cards and attach parity classes to mobile Budget leg rows'
  );
  assert(
    mobileFeaturesCss.includes('#tab-transport') &&
      mobileFeaturesCss.includes('#tab-accom') &&
      mobileFeaturesCss.includes('#tab-budget') &&
      mobileFeaturesCss.includes('#tab-packing') &&
      mobileFeaturesCss.includes('.budget-mobile-row--even') &&
      mobileFeaturesCss.includes('.budget-mobile-row--odd') &&
      mobileFeaturesCss.includes('.transport-segment-card--odd') &&
      mobileFeaturesCss.includes('#tab-packing .packing-card .packing-item:nth-of-type(even)'),
    'Task 6: mobile-features.css should apply edge-to-edge full-width layout and alternating row shading across Transit, Stays, Budget, Packing, and Map tabs'
  );
}

function runTask7CheckboxCityPreservationTests() {
  const utilsJs = loadSource(path.join('js', 'utils.js'));
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));

  assert(
    utilsJs.includes('isStackedCityPager') &&
      utilsJs.includes('hasHorizontalLayout'),
    'Task 7: captureMobilePagerStates in js/utils.js should preserve the active city index for stacked .compact-city-swipe-pager slides instead of resetting to 0'
  );
  assert(
    itineraryJs.includes('renderCompactCitySlide(entry, legIndex, journeysByJourneyId, activeCityIndex)') &&
      itineraryJs.includes("getMobilePagerActiveIndex('compact-city-swipe', 0)"),
    'Task 7: createCompactCitySwipeElement in js/itinerary.js should render the saved activeCityIndex slide and sticky header on rebuild'
  );
}

function runAll() {
  runTask1ShellTests();
  runTask2VerticalTimelineTests();
  runTask3BottomSheetAndDragTests();
  runTask4MobileMapTests();
  runTask5VisualPolishTests();
  runTask6CrossTabMobileOptimizationTests();
  runTask7CheckboxCityPreservationTests();
}

if (require.main === module) {
  runAll();
  console.log('Task 1-7 mobile flow overhaul tests passed');
}

module.exports = { runMobileFlowOverhaulTests: runAll };


