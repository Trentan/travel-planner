# Mobile Flow Overhaul — Architectural & UX Design Spec

**Date:** 2026-10-09
**Branch:** `feature/mobile-flow-overhaul`
**Status:** Draft for Review
**Scope:** Mobile Viewports (`<= 768px` / `body.mobile-app-mode`), zero visual or behavioral impact on Desktop (`>= 769px`).

---

## 1. Context & Problem Statement

The Travel Planner application works seamlessly on desktop (`1440x900`) with its side-by-side split pane, rich modals, and spacious navigation. On mobile (`390x844`), however, the user experience feels clunky and constrained because mobile support evolved through incremental CSS overrides and nested horizontal carousels rather than native-feeling mobile interaction primitives.

Specifically, six structural issues degrade the mobile experience:
1. **The "Screen Sandwich"**: Stacking top headers, `.compact-day-rail`, a bottom-fixed `#cityNav`, and a 7-tab bottom bar (`.app-tabs-nav`) consumes ~35%–40% (~297px) of an 844px vertical screen, leaving `< 540px` for actual content.
2. **Nested Horizontal Carousels ("Swipe Trap" & Height Thrashing)**: Nesting `.compact-day-carousel` inside `.compact-city-swipe-pager` (alongside two horizontal chip rails) creates touch gesture conflicts and requires `syncItineraryMobileHeightContainment()` to repeatedly query DOM heights and force `window.scrollTo()`, causing vertical scroll jumps.
3. **Cramped 7-Tab Bar & Destructive Tab Switching**: Fitting 7 tabs into 390px leaves ~55px per tab with 10px micro-labels. Calling `switchTab()` wipes `.innerHTML` and forces `window.scrollTo(0, 0)` without preserving scroll state or using view transitions.
4. **Centered Desktop Modals & Missing Keyboard Insets**: Almost all ~20 dialogs in `index.html` render as centered floating boxes on mobile without swipe-to-dismiss gestures or `interactive-widget=resizes-content`, allowing the virtual keyboard to obscure form inputs.
5. **Disconnected 280px Mobile Map**: On mobile, `#tab-map` renders inside a small `280px` box (`src/css/shell.css`) disconnected from the itinerary stops.
6. **Passive Touch Listener Breaking Drag-and-Drop**: `setupMobileTouchLegReordering()` in `js/dragdrop.js` attaches `touchmove` with `{ passive: true }`, preventing `e.preventDefault()` and causing the background modal to scroll while dragging legs.

---

## 2. Goals & Non-Goals

### Goals
- Reclaim `>= 95px` of vertical viewport height on mobile (`390x844`) by consolidating `#cityNav` into a unified top sticky header and auto-collapsing the secondary day chip rail on downward scroll.
- Streamline the mobile bottom navigation bar from 7 cramped tabs to **5 thumb-friendly tabs** (`Itinerary`, `Transit`, `Stays`, `Map`, `More`) while keeping `Budget` and `Packing` 1 tap away inside the `More` bottom sheet.
- Replace the nested City + Day horizontal swipe carousels on the mobile Itinerary tab with a **Continuous Vertical Timeline per City**, complete with sticky day headers and bidirectional scroll-spy day chips.
- Preserve per-tab vertical scroll position across tab switches and animate transitions with `document.startViewTransition()`.
- Convert mobile `[role="dialog"]` modals into bottom-anchored sheets with drag-handle swipe-to-dismiss and global virtual keyboard safe-area handling.
- Upgrade the Mobile Map tab into a full-viewport interactive map (`calc(100dvh - top - bottom)`) with floating City/Day filter pills and a bottom horizontal stop card strip synced with map pins.
- Fix touch drag-and-drop leg reordering so dragging the handle never scrolls the background container.

### Non-Goals
- No framework rewrite (keep Vanilla JS + Tailwind CSS v4 + Capacitor 8).
- No changes to desktop layout, desktop split-pane behavior, or desktop modal positioning (`@media (min-width: 769px)`).
- No changes to data persistence schemas in `js/data.js` or cloud sync protocols in `js/cloud-storage.js`.

---

## 3. Architecture & Component Specifications

### 3.1 Unified Mobile Shell & 5-Tab Navigation
**Files Impacted:** `index.html`, `js/ui.js`, `src/css/shell.css`, `src/css/responsive-core.css`, `src/css/components.css`

1. **Unified Top Sticky Context Bar (`<= 768px`)**:
   - Remove `position: fixed; bottom: calc(3.65rem + env(safe-area-inset-bottom, 0px))` from `#cityNav` on mobile (`src/css/components.css`).
   - Dock `#cityNav` at the top of the viewport (`position: sticky; top: env(safe-area-inset-top, 0px); z-index: 310`) when `data-active-tab="itinerary"`.
   - Retain the direct `+ City` pill button inside `#cityNav` (satisfying `release-hardening-audit` and `tests/city-nav-regression.js`).
   - Dock `.compact-day-rail` immediately below `#cityNav`. Attach a lightweight passive `window` scroll direction tracker in `js/ui.js`:
     - Scrolling down (`deltaY > 12px` and `scrollY > 80px`) toggles `body.mobile-header-condensed`, collapsing `.compact-day-rail` smoothly (`max-height: 0; opacity: 0; transform: translateY(-8px); pointer-events: none`).
     - Scrolling up (`deltaY < -8px` or `scrollY <= 80px`) removes `body.mobile-header-condensed`, restoring the day rail.
2. **5-Tab Bottom Bar (`<= 768px`)**:
   - Update `.app-tabs-nav` grid on `@media (max-width: 768px)` from `repeat(7, minmax(0, 1fr))` to `repeat(5, minmax(0, 1fr))`.
   - Primary bottom tabs on mobile:
     1. `Itinerary` (`data-tab="itinerary"`)
     2. `Transit` (`data-tab="transport"`)
     3. `Stays` (`data-tab="accom"`)
     4. `Map` (`data-tab="map"`)
     5. `More` (`#mobileBottomMenuBtn`)
   - Hide the bottom bar's direct `Budget` and `Packing` tab buttons on `<= 768px` via CSS (`display: none` on `.app-tabs-nav [data-tab="budget"], .app-tabs-nav [data-tab="packing"]` in mobile mode; keep them visible on desktop).
   - Inside `#mobileMenuSheet` (`index.html`), add a prominent 2-card quick-switch row at the very top for **Budget & Expenses** (`switchTab('budget'); closeMobileMenuSheet()`) and **Packing List** (`switchTab('packing'); closeMobileMenuSheet()`).
   - When `data-active-tab` is `"budget"` or `"packing"`, highlight `#mobileBottomMenuBtn` (`More`) with the active tab indicator style so the user always has visual feedback of their location.
3. **State-Preserving Tab Switching & View Transitions (`js/ui.js`)**:
   - Introduce `const mobileTabScrollPositions = { itinerary: 0, transport: 0, accom: 0, budget: 0, packing: 0, map: 0 };` and a `mobileTabRenderedDirty` map.
   - When `switchTab(tabName)` is invoked:
     - Record `mobileTabScrollPositions[previousTab] = window.scrollY`.
     - Execute the DOM visibility switch inside `document.startViewTransition ? document.startViewTransition(applySwitch) : applySwitch()` (skipped when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true).
     - Restore `window.scrollTo({ top: mobileTabScrollPositions[tabName] || 0, behavior: 'instant' })` after transition instead of unconditionally resetting to `0`.

---

### 3.2 Continuous Vertical Timeline per City
**Files Impacted:** `js/itinerary.js`, `js/utils.js`, `src/css/components.css`, `src/css/mobile-features.css`

1. **Single-Axis Vertical Day Stack (`<= 768px`)**:
   - In `js/itinerary.js`, when rendering the mobile itinerary view for the active city/leg (`activeMobileCityIndex`), render all days belonging to that city sequentially inside a vertical container `.mobile-city-vertical-timeline` (`display: flex; flex-direction: column; gap: 1rem`).
   - Do **not** wrap days in a horizontal `.compact-day-carousel` or wrap cities in `.compact-city-swipe-pager` on mobile vertical flow.
   - Each day section `.mobile-day-section[data-day-num="N"]` renders a sticky header `.mobile-day-sticky-header` (`position: sticky; top: var(--mobile-sticky-day-offset, 52px); z-index: 20`) displaying the day badge, formatted date, city name, and quick `[+ Activity]` button.
   - Append a footer card at the end of the active city's days:
     - If a subsequent leg exists: render a thumb-friendly **"Next City: [Leg Name] →"** button that selects the next city in `#cityNav` and smoothly transitions to the top of that city's timeline.
     - Always include the high-contrast `[ 🌍 City ]` and `[ 🧭 Legs ]` management buttons in the itinerary section header per `release-hardening-audit`.
2. **Bidirectional Scroll-Spy Day Chip Rail**:
   - Tapping a day chip `[data-day-chip="N"]` in `.compact-day-rail` scrolls smoothly to `.mobile-day-section[data-day-num="N"]` with `scroll-margin-top` accounting for the sticky header.
   - Attach an `IntersectionObserver` (`rootMargin: '-20% 0px -65% 0px'`) to `.mobile-day-section` elements so scrolling vertically automatically highlights the corresponding day chip in `.compact-day-rail` and keeps the active chip scrolled into horizontal view within the rail.
3. **Retiring JS Height Thrashing**:
   - Make `syncItineraryMobileHeightContainment()` in `js/itinerary.js` a no-op when `.mobile-city-vertical-timeline` is active, and remove the forced vertical `window.scrollTo` clamp in `setupMobileSwipePagers()` (`js/utils.js`).

---

### 3.3 Universal Mobile Bottom Sheets, Virtual Keyboard Insets & Touch Drag-and-Drop
**Files Impacted:** `index.html`, `src/css/mobile-features.css`, `src/css/components.css`, `js/ui.js`, `js/dragdrop.js`

1. **Bottom-Sheet Modal System (`<= 768px`)**:
   - In `src/css/mobile-features.css`, style all `.modal-backdrop, [role="dialog"]` wrappers on `@media (max-width: 768px)` so the inner dialog panel anchors to the bottom of the viewport:
     - `margin: auto 0 0 0; width: 100%; max-width: 100%; max-height: 90dvh; border-radius: 1.25rem 1.25rem 0 0; padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));`
     - Render a centered `36px x 4px` pill drag handle (`::before`) at the top of each mobile sheet header.
     - Animate sheet entrance/exit with `transform: translateY(...)` using `cubic-bezier(0.22, 1, 0.36, 1)`.
2. **Swipe-Down-to-Dismiss Gesture (`js/ui.js`)**:
   - Implement `setupMobileBottomSheetGestures()` in `js/ui.js`:
     - Listen for `touchstart`, `touchmove`, and `touchend` on the header area (or top 48px) of any open modal sheet on mobile.
     - Translate the sheet panel downward with `translateY(${deltaY}px)` when `deltaY > 0` and scroll position of the modal body is at `0`.
     - If released with `deltaY > 80px` or downward velocity `> 0.5 px/ms`, trigger the modal's close button/handler and fire subtle haptic feedback; otherwise spring back to `translateY(0)`.
3. **Virtual Keyboard Safe Insets (`index.html`, `js/ui.js`)**:
   - Update `<meta name="viewport">` in `index.html#L5` to:
     `content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content"`
   - Add a global delegated `focusin` listener on `document` in `js/ui.js` (active when `isMobileViewport()` is true) that waits `150ms` for the keyboard/viewport resize and calls `target.scrollIntoView({ block: 'center', behavior: 'smooth' })` inside any open modal or form container.
4. **Touch Drag-and-Drop Fix (`js/dragdrop.js`)**:
   - In `setupMobileTouchLegReordering(container)`:
     - Require touch drag initiation on `.drag-handle` (or `[data-drag-handle]`) with CSS `touch-action: none` on the handle.
     - Register `touchmove` with `{ passive: false }` and call `e.preventDefault()` whenever `draggedItem` is active, preventing the parent modal from scrolling during reorder.

---

### 3.4 Full-Viewport Mobile Map + Synced Stop Card Strip
**Files Impacted:** `js/map.js`, `src/css/shell.css`, `src/css/mobile-features.css`

1. **Full-Bleed Map Viewport (`<= 768px`)**:
   - Override `#tab-map` and `#map-container` height in `src/css/shell.css` and `src/css/mobile-features.css` so that when `data-active-tab="map"` on mobile, the map container fills `calc(100dvh - var(--mobile-top-bar-height, 56px) - calc(3.65rem + env(safe-area-inset-bottom, 0px)))` (minimum `520px`) with zero outer card padding.
   - Call `map.invalidateSize()` inside `switchTab('map')` after the view transition frame.
2. **Floating Filter Pills & Synced Bottom Stop Card Strip (`js/map.js`)**:
   - Render `.mobile-map-filter-rail` overlaid at `top: 12px; left: 12px; right: 12px; z-index: 450` with horizontal pills for `All Trip` and each City/Leg.
   - Render `.mobile-map-card-strip` overlaid at `bottom: 12px; left: 0; right: 0; z-index: 450` using horizontal `scroll-snap-type: x mandatory; display: flex; gap: 0.75rem; padding: 0 1rem; overflow-x: auto`.
   - Each card (`width: 82vw; max-width: 320px; scroll-snap-align: center`) displays the stop's sequence badge, title, day/time badge, category icon, and a `"View in Day"` button.
   - **Two-Way Sync**:
     - Scrolling `.mobile-map-card-strip` uses an `IntersectionObserver` (`threshold: 0.6`) to detect the centered card and calls `map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.45 })` and highlights the marker.
     - Clicking a Leaflet marker scrolls `.mobile-map-card-strip` smoothly to the corresponding `[data-stop-id]` card.

---

## 4. Error Handling, Dark Mode & Accessibility Safeguards

- **Dark Mode Contrast (WCAG 2.1 AA)**: All new sticky headers, bottom sheets, map overlay cards, and quick-switch cards in `#mobileMenuSheet` use `#0f172a` (`slate-900`) and `#1e293b` (`slate-800`) surfaces with `#f8fafc` primary text and `#94a3b8` (`slate-400`) metadata.
- **Touch Target Ergonomics**: Every interactive button, chip, drag handle, and tab satisfies `>= 44x44px` hit area.
- **Graceful Fallbacks**:
  - If `document.startViewTransition` is unsupported (older WebViews), `switchTab()` executes synchronously without throwing.
  - If a city has `0` geocoded stops on the Map tab, `.mobile-map-card-strip` displays a compact empty-state card (`"No pinned stops in this city yet"`) with a 1-tap button to return to the Itinerary tab.

---

## 5. Verification & Regression Test Plan

1. **Automated Regression Suites**:
   - `node tests/city-nav-regression.js` — Verify city navigation, `+ City` button presence, leg switching, and itinerary rendering pass 100%.
   - `npm test` — Verify all unit and integration tests pass.
   - `npm run build:css` — Ensure compiled `dist/tailwind.css` includes all updated mobile rules cleanly.
2. **Viewport Verification (`DESKTOP: 1440x900` & `MOBILE: 390x844`)**:
   - Load `backups/2026_June_July_Europe_Thailand.json` on `http://localhost:3000`.
   - Verify Desktop (`1440x900`) split-pane layout, 7-tab top nav, and centered modals are completely unchanged.
   - Verify Mobile (`390x844`):
     - 5-tab bottom bar + `More` sheet switching to `Budget` and `Packing`.
     - Unified top `#cityNav` + auto-collapsing `.compact-day-rail` on downward scroll.
     - Continuous vertical day timeline per city + scroll-spy day chips + `"Next City →"` footer button.
     - Bottom-sheet modal presentation, swipe-down-to-dismiss, and focus scroll behavior.
     - Touch drag-and-drop leg reordering without background scroll.
     - Full-viewport Mobile Map with synced bottom stop card strip.
