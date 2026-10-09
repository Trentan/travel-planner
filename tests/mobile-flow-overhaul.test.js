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
    indexHtml.includes('mobile-menu-quick-tabs'),
    'Task 1: #mobileMenuSheet should include .mobile-menu-quick-tabs for Budget and Packing quick access'
  );
  assert(
    responsiveCss.includes('grid-template-columns: repeat(5, minmax(0, 1fr))'),
    'Task 1: responsive-core.css should use a 5-column mobile bottom tab bar'
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
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    itineraryJs.includes('mobile-city-vertical-timeline'),
    'Task 2: js/itinerary.js should render .mobile-city-vertical-timeline for continuous vertical day flow'
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
      mobileFeaturesCss.includes('flex-direction: column'),
    'Task 2: mobile-features.css should stack days vertically inside .mobile-city-vertical-timeline'
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
  const mapJs = loadSource(path.join('js', 'map.js'));
  const mobileFeaturesCss = loadSource(path.join('src', 'css', 'mobile-features.css'));

  assert(
    mapJs.includes('mobile-map-filter-rail') && mapJs.includes('mobile-map-card-strip'),
    'Task 4: js/map.js should render .mobile-map-filter-rail and .mobile-map-card-strip on mobile'
  );
  assert(
    mapJs.includes('renderMobileMapOverlayControls'),
    'Task 4: js/map.js should expose renderMobileMapOverlayControls for synced mobile map cards'
  );
  assert(
    mobileFeaturesCss.includes('.mobile-map-card-strip') &&
      mobileFeaturesCss.includes('100dvh'),
    'Task 4: mobile-features.css should expand #journey-map-view to full mobile viewport height and style .mobile-map-card-strip'
  );
}

function runAll() {
  runTask1ShellTests();
  runTask2VerticalTimelineTests();
  runTask3BottomSheetAndDragTests();
  runTask4MobileMapTests();
}

if (require.main === module) {
  runAll();
  console.log('Task 1-4 mobile flow overhaul tests passed');
}

module.exports = { runMobileFlowOverhaulTests: runAll };
