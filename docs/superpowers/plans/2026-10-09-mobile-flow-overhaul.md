# Mobile Flow Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Travel Planner mobile experience (`<= 768px`) from a cramped nested-carousel layout into a native-feeling mobile flow with a unified top context bar, 5-tab bottom navigation, continuous vertical city timelines, universal bottom sheets, fixed touch drag-and-drop, and a full-viewport synced map.

**Architecture:** We preserve 100% of the desktop experience (`>= 769px`), business logic (`js/data.js`), and Google Drive sync (`js/cloud-storage.js`) while refactoring the mobile presentation and interaction layer across `index.html`, `js/ui.js`, `js/itinerary.js`, `js/dragdrop.js`, `js/map.js`, and the modular CSS partials in `src/css/`. Each task is verified via Node unit/DOM regression tests in `tests/mobile-flow-overhaul.test.js` and the full regression suite (`npm test`).

**Tech Stack:** Vanilla JavaScript (ES6), HTML5, Tailwind CSS v4 (`@tailwindcss/cli`), Leaflet.js, Capacitor 8, Node.js + Playwright test runner.

**Spec:** `docs/superpowers/specs/2026-10-09-mobile-flow-overhaul-design.md`

## Global Constraints

- Scope all mobile visual and layout changes to `@media (max-width: 768px)` or `body.mobile-app-mode` so Desktop (`1440x900`) is 100% untouched.
- Enforce solid `#0f172a` (`slate-900`) and `#1e293b` (`slate-800`) dark mode surfaces with `>= 4.5:1` text contrast.
- Maintain `>= 44x44px` touch targets on all mobile interactive pills, tabs, and action buttons.
- Preserve `#cityNav .city-nav-add-btn` (`+ City`), `[ 🌍 City ]`, and `[ 🧭 Legs ]` buttons required by `release-hardening-audit` and `tests/city-nav-regression.js`.
- Run `npm run build:css` after any edit to `src/css/*.css` so `dist/tailwind.css` stays synchronized.

## Review Focus

- Rapid tab switching between `itinerary`, `budget`, `packing`, and `map` when `document.startViewTransition` is unavailable in older WebViews must still switch tabs synchronously and restore saved `scrollY` positions.
- Calling `switchTab('budget')` or `switchTab('packing')` on mobile must mark the bottom `More` button (`.mobile-tabs-menu-btn`) with `.active` so the user has an active bottom-bar indicator.
- Touch drag-and-drop in `setupMobileTouchLegReordering()` must only call `e.preventDefault()` when an active leg drag is in progress (`touchDragLegIdx !== null`) so normal modal scrolling works when touching outside a drag handle.
- Selecting a Day chip in `.compact-day-rail` on mobile must both update `__mobilePagerState` / `.compact-day-slide.is-active` and scroll the target `.compact-day-slide` into vertical view.
- Rendering `#tab-map` on mobile when a leg has zero geocoded coordinates must render a graceful empty state in `.mobile-map-card-strip` without throwing.

---

### Task 1: Unified Mobile Shell, 5-Tab Bottom Bar & State-Preserving Tab Switching

**Files:**
- Create: `tests/mobile-flow-overhaul.test.js`
- Modify: `index.html:1-10`, `index.html:373-425`
- Modify: `js/ui.js:577-635`
- Modify: `src/css/responsive-core.css:76-155`
- Modify: `src/css/components.css:1914-1990`

**Interfaces:**
- Consumes: `switchTab(tabId, btnElement)`, `closeMobileMenu()` in `js/ui.js`
- Produces: `window.mobileTabScrollPositions`, `window.setupMobileHeaderScrollCollapse()`, `.mobile-menu-quick-tabs` in `index.html`, 5-column `.app-tabs-list` on `<= 768px`, top-sticky `#cityNav` on `<= 768px`

- [ ] **Step 1: Write the failing test in `tests/mobile-flow-overhaul.test.js`**

```javascript
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

if (require.main === module) {
  runTask1ShellTests();
  console.log('Task 1 mobile shell tests passed');
}

module.exports = { runMobileFlowOverhaulTests: runTask1ShellTests };
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile-flow-overhaul.test.js`
Expected: FAIL with `Task 1: index.html viewport meta should include interactive-widget=resizes-content`

- [ ] **Step 3: Implement unified top `#cityNav`, 5-tab bottom bar, `#mobileMenuSheet` quick-switch cards, and state-preserving `switchTab()`**

1. In `index.html:5`, add `interactive-widget=resizes-content` to `<meta name="viewport">`.
2. In `index.html` inside `#mobileMenuSheet` (right below `.mobile-menu-trip-status`), add `.mobile-menu-quick-tabs` with 2 prominent quick-switch cards for **Budget** (`data-mobile-quick-tab="budget"`, `onclick="switchTab('budget'); closeMobileMenu();"`) and **Packing** (`data-mobile-quick-tab="packing"`, `onclick="switchTab('packing'); closeMobileMenu();"`).
3. In `src/css/responsive-core.css` and `src/css/components.css`:
   - Change `.app-tabs-list` mobile grid from `repeat(7, minmax(0, 1fr))` to `repeat(5, minmax(0, 1fr))`.
   - Hide `.app-tabs-nav .app-tab-btn[data-tab="budget"]` and `.app-tabs-nav .app-tab-btn[data-tab="packing"]` on `@media (max-width: 768px)` (`display: none !important`).
   - Change `body.mobile-app-mode #cityNav` from `position: fixed !important; bottom: calc(3.65rem + ...)` to `position: sticky !important; top: env(safe-area-inset-top, 0px) !important; bottom: auto !important; z-index: 310;`.
   - Add `body.mobile-header-condensed .compact-day-rail` smooth collapse rules on `@media (max-width: 768px)`.
4. In `js/ui.js`:
   - Add `window.mobileTabScrollPositions = { itinerary: 0, transport: 0, accom: 0, budget: 0, packing: 0, map: 0 }`.
   - Update `switchTab(tabId, btnElement)` to record the outgoing tab's `window.scrollY`, wrap DOM pane activation in `document.startViewTransition` (when supported and `prefers-reduced-motion` is not active), mark `.mobile-tabs-menu-btn` as `.active` when `tabId === 'budget' || tabId === 'packing'`, and restore `mobileTabScrollPositions[tabId]`.
   - Add `setupMobileHeaderScrollCollapse()` to toggle `body.mobile-header-condensed` when scrolling down (`deltaY > 12 && scrollY > 80`) and clear it when scrolling up (`deltaY < -8 || scrollY <= 80`).
5. Run `npm run build:css`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile-flow-overhaul.test.js`
Expected: PASS (`Task 1 mobile shell tests passed`)

- [ ] **Step 5: Commit and push**

```bash
git add index.html js/ui.js src/css/responsive-core.css src/css/components.css dist/tailwind.css tests/mobile-flow-overhaul.test.js
git commit -m "feat(mobile-nav): unify top sticky cityNav, 5-tab bottom bar, and scroll-preserving tab transitions"
git push
```

---

### Task 2: Continuous Vertical Timeline per City & Scroll-Spy Day Chips

**Files:**
- Modify: `js/itinerary.js:1015-1225`, `js/itinerary.js:1735-1776`
- Modify: `js/utils.js:335-360`
- Modify: `src/css/components.css`
- Modify: `src/css/mobile-features.css`
- Test: `tests/mobile-flow-overhaul.test.js`

**Interfaces:**
- Consumes: `renderCompactDayPager()`, `compactItineraryGoToDay()`, `syncItineraryMobileHeightContainment()` in `js/itinerary.js`
- Produces: `.mobile-city-vertical-timeline`, `.mobile-next-city-card`, `setupMobileVerticalDayScrollSpy(root)`, `compactItineraryGoToCityIndex(legIndex)`

- [ ] **Step 1: Add failing Task 2 tests to `tests/mobile-flow-overhaul.test.js`**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile-flow-overhaul.test.js`
Expected: FAIL with `Task 2: js/itinerary.js should render .mobile-city-vertical-timeline for continuous vertical day flow`

- [ ] **Step 3: Implement Continuous Vertical Timeline per City, Sticky Day Headers, Next-City Card, and Day Chip Scroll-Spy**

1. In `js/itinerary.js`:
   - Add class `mobile-city-vertical-timeline` to `.compact-day-carousel` in `renderCompactDayPager()`, and append a `.mobile-next-city-card` button (`onclick="return compactItineraryGoToCityIndex(event, ${legIndex + 1})"`) when a next leg exists in `appData`.
   - Implement `compactItineraryGoToCityIndex(event, targetLegIndex)` to activate the target leg in `#cityNav` and `__mobilePagerState['compact-city-swipe']`, update `.compact-city-slide.is-active`, and smoothly scroll to the top of `#tab-itinerary`.
   - Update `compactItineraryGoToDay(event, legId, dayIndex)` so that in addition to marking the target `.compact-day-slide` as `.is-active` and updating `__mobilePagerState`, it calls `targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' })` when in vertical timeline mode.
   - Implement `setupMobileVerticalDayScrollSpy(root)` using `IntersectionObserver` to highlight the visible day's `.compact-day-chip` during vertical scroll.
   - Update `syncItineraryMobileHeightContainment(root)` so it does not clamp inline `carousel.style.height` when `.mobile-city-vertical-timeline` is present on `#tab-itinerary` (while still preserving height containment for `#tab-transport` and `#tab-accom` swipe pagers!).
2. In `js/utils.js`:
   - Skip the forced `window.scrollTo` vertical clamp when the pager is inside `#tab-itinerary`.
3. In `src/css/mobile-features.css` & `src/css/components.css`:
   - On `@media (max-width: 768px)`, style `#tab-itinerary .compact-day-carousel.mobile-city-vertical-timeline` with `display: flex !important; flex-direction: column !important; gap: 1rem !important; overflow: visible !important; height: auto !important; scroll-snap-type: none !important;`.
   - Style `#tab-itinerary .compact-day-carousel.mobile-city-vertical-timeline > .compact-day-slide` so all days in the active city are visible vertically (`display: block !important; width: 100% !important; flex: none !important; scroll-margin-top: 6.5rem;`).
   - Style `#tab-itinerary .compact-city-swipe-pager > [data-role="mobile-swipe-carousel"]` so only `.compact-city-slide.is-active` is displayed (`display: block !important; overflow: visible !important; height: auto !important;`), eliminating the outer horizontal swipe trap.
   - Style `.compact-day-header` as a sticky sub-header (`position: sticky; top: calc(env(safe-area-inset-top, 0px) + 3.1rem); z-index: 25;`) and style `.mobile-next-city-card`.
4. Run `npm run build:css`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile-flow-overhaul.test.js`
Expected: PASS

- [ ] **Step 5: Commit and push**

```bash
git add js/itinerary.js js/utils.js src/css/components.css src/css/mobile-features.css dist/tailwind.css tests/mobile-flow-overhaul.test.js
git commit -m "feat(itinerary,mobile): replace nested carousels with continuous vertical city timeline and scroll-spy day chips"
git push
```

---

### Task 3: Universal Mobile Bottom Sheets, Virtual Keyboard Safe Insets & Touch Drag-and-Drop

**Files:**
- Modify: `src/css/mobile-features.css`
- Modify: `js/ui.js`
- Modify: `js/dragdrop.js:98-145`
- Test: `tests/mobile-flow-overhaul.test.js`

**Interfaces:**
- Consumes: `setupMobileTouchLegReordering(container)` in `js/dragdrop.js`
- Produces: `setupMobileBottomSheetGestures()`, `setupMobileKeyboardFocusScroll()` in `js/ui.js`, non-passive `.drag-handle` touch reordering in `js/dragdrop.js`

- [ ] **Step 1: Add failing Task 3 tests to `tests/mobile-flow-overhaul.test.js`**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile-flow-overhaul.test.js`
Expected: FAIL with `Task 3: js/ui.js should implement setupMobileBottomSheetGestures and setupMobileKeyboardFocusScroll`

- [ ] **Step 3: Implement universal mobile bottom sheets, swipe-to-dismiss, keyboard focus scroll, and non-passive drag-and-drop**

1. In `src/css/mobile-features.css`:
   - Under `@media (max-width: 768px)`, anchor `.modal-overlay, .modal-backdrop` with `align-items: flex-end !important; padding: 0 !important;` and style `.modal-content, .modal-card, .modal-panel` with `margin: auto 0 0 0 !important; width: 100% !important; max-width: 100% !important; max-height: 90dvh !important; border-radius: 1.25rem 1.25rem 0 0 !important; padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)) !important;`.
   - Add a subtle top drag-pill pseudo-element (`::before`) to `.modal-header` on mobile and add `touch-action: none` on `.leg-reorder-handle, .drag-handle`.
2. In `js/ui.js`:
   - Implement `setupMobileBottomSheetGestures()` to allow dragging down `> 80px` on `.modal-header` / `.mobile-menu-sheet-header` to trigger the modal's `.modal-close` button.
   - Implement `setupMobileKeyboardFocusScroll()` listening to `focusin` on mobile to scroll focused form controls (`input`, `select`, `textarea`) inside modals into view (`scrollIntoView({ block: 'center', behavior: 'smooth' })`).
3. In `js/dragdrop.js`:
   - Update `setupMobileTouchLegReordering(container)` so `touchmove` is registered with `{ passive: false }` and calls `if (e.cancelable) e.preventDefault();` when `touchDragLegIdx !== null`, preventing background modal scroll while dragging.
4. Run `npm run build:css`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile-flow-overhaul.test.js` && `node tests/dragdrop.test.js`
Expected: PASS

- [ ] **Step 5: Commit and push**

```bash
git add src/css/mobile-features.css js/ui.js js/dragdrop.js dist/tailwind.css tests/mobile-flow-overhaul.test.js
git commit -m "feat(mobile-ux): add bottom-sheet modals, swipe-to-dismiss, keyboard focus scroll, and non-passive touch drag"
git push
```

---

### Task 4: Full-Viewport Mobile Map + Synced Stop Card Strip & Suite Integration

**Files:**
- Modify: `js/map.js`
- Modify: `src/css/shell.css:1130-1145`
- Modify: `src/css/mobile-features.css`
- Modify: `tests/mobile-flow-overhaul.test.js`
- Modify: `tests/browser-suite.js`
- Modify: `tests/run-tests.js`

**Interfaces:**
- Consumes: `buildJourneyMap()` in `js/map.js`
- Produces: `renderMobileMapOverlayControls(mapInstance, stops)` in `js/map.js`, `.mobile-map-filter-rail`, `.mobile-map-card-strip`

- [ ] **Step 1: Add failing Task 4 tests to `tests/mobile-flow-overhaul.test.js`**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile-flow-overhaul.test.js`
Expected: FAIL with `Task 4: js/map.js should render .mobile-map-filter-rail and .mobile-map-card-strip on mobile`

- [ ] **Step 3: Implement Full-Viewport Mobile Map, City Filter Rail, Synced Stop Card Strip, and register in `tests/run-tests.js` + `tests/browser-suite.js`**

1. In `src/css/shell.css` and `src/css/mobile-features.css`:
   - Expand `#journey-map-view` on `@media (max-width: 768px)` from `280px` to `calc(100dvh - 8.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))` (min-height `480px`, `border-radius: 1rem`).
   - Style `.mobile-map-filter-rail` (top overlay horizontal pill bar) and `.mobile-map-card-strip` (bottom `scroll-snap-type: x mandatory` horizontal card strip with dark-mode `#1e293b` cards).
2. In `js/map.js`:
   - Implement `renderMobileMapOverlayControls(mapContainer, mapInstance, plottedStops)` called at the end of `buildJourneyMap()`.
   - Render `.mobile-map-filter-rail` with `All Trip` + per-leg city pills that filter or fly to that leg's bounds.
   - Render `.mobile-map-card-strip` with a card for each plotted stop (or a graceful empty-state card when `plottedStops.length === 0`).
   - Wire two-way sync: clicking/swiping a card in `.mobile-map-card-strip` calls `mapInstance.flyTo([stop.lat, stop.lng], 13, { duration: 0.4 })`; clicking a marker scrolls `.mobile-map-card-strip` to the matching `[data-map-stop-index]` card.
3. In `tests/browser-suite.js`:
   - Update the mobile tab loop and vertical itinerary assertion (`#214`) to verify the new 5-tab bar + `#mobileMenuSheet` quick-switch buttons (`[data-mobile-quick-tab="budget"]`, `[data-mobile-quick-tab="packing"]`) and `.mobile-city-vertical-timeline`.
4. Register `runMobileFlowOverhaulTests` in `tests/run-tests.js`.
5. Run `npm run build:css`.

- [ ] **Step 4: Run tests to verify everything passes**

Run: `node tests/mobile-flow-overhaul.test.js` && `node tests/city-nav-regression.js`
Expected: PASS

- [ ] **Step 5: Commit and push**

```bash
git add js/map.js src/css/shell.css src/css/mobile-features.css dist/tailwind.css tests/mobile-flow-overhaul.test.js tests/browser-suite.js tests/run-tests.js
git commit -m "feat(map,mobile): add full-viewport mobile map with city filter rail and synced stop card strip"
git push
```
