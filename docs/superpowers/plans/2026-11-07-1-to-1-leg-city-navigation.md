# 1:1 Chronological Leg Navigation & Day-Trip Blips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the top city navigation rail and mobile slider to match the itinerary's chronological journey legs 1:1, featuring dynamic visit numbering (e.g. `Brisbane (1)` / `Brisbane (2)`), inline day-trip blips (`↳ <City>`), and pinpoint timeline scrolling across desktop and mobile.

**Architecture:** Replace the deduplicated `citiesData` mapping in `#cityNav` with a first-class sequence generator `getChronologicalLegSequence()` based on `appData` legs. Each leg receives its own pill/card keyed by `leg.id`, with repeat overnight city visits automatically indexed `(1)`, `(2)`, etc. Day trips inside a city stay render as connected blips (`↳ <City>`) that jump directly to that day without fragmenting hotel stays. Cross-tab filtering targets the specific leg in Itinerary, Stays, and Transit, while Budget preserves consolidated city totals.

**Tech Stack:** Vanilla JavaScript (ES6+), DOM APIs, Tailwind CSS, Jest/Node.js testing harnesses.

**Spec:** [spec-1-to-1-leg-city-navigation.md](file:///C:/Users/trent/.gemini/antigravity/brain/33892c7a-9d65-4c1a-ba9e-6354e9f71827/spec-1-to-1-leg-city-navigation.md)

## Global Constraints
- `AGENTS.md` rules: Incremental commits, conventional commit messages, token conservation (launch-and-inspect tests, no verbose stdout dumping).
- Standard UI viewports: `DESKTOP` (1440 x 900) and `MOBILE` (390 x 844).
- No regression in `tests/city-nav-regression.js`, `npm test`, `npm run build:mobile`, or Android `gradlew assembleDebug`.
- Day-trip connector format: `↳ <City>` (clean return/enter arrow, no extra emoji).
- Budget tab must preserve grouping by overall city destination.

## Review Focus
1. **Repeat Visit Labeling**: Verify trips with repeat cities (e.g. Brisbane Start/Finish or Bangkok 3x) correctly show `(1)`, `(2)`, `(3)` unless already having an explicit custom label.
2. **Day-Trip Continuity**: Verify day trips do NOT increment the parent city's visit counter or fragment hotel stays in the Accommodation tab.
3. **Pinpoint Timeline Scrolling**: Clicking a leg pill or day-trip blip scrolls smoothly and accounts for sticky header height.
4. **Active State Synchronization**: As user scrolls or swipes, the corresponding pill in `#cityNav` highlights accurately without flickering.
5. **Empty/Single-City Trips**: Gracefully handles itineraries with 0 or 1 legs without NaN or broken arrays.

---

## File Structure

- **Core Logic & Navigation UI**: [js/itinerary.js](file:///c:/Apps/Projects/travel-planner/js/itinerary.js)
  - Implements `getChronologicalLegSequence()`.
  - Re-implements `buildCityNav()` and `selectCityFilter()`.
  - Aligns `createCompactCitySwipeElement()` and mobile swipe slides.
- **Cross-Tab Filters**:
  - [js/tabs.js](file:///c:/Apps/Projects/travel-planner/js/tabs.js) (Accom & Budget tab compatibility)
  - [js/transport.js](file:///c:/Apps/Projects/travel-planner/js/transport.js) (Transit tab leg compatibility)
- **Test Suites**:
  - `tests/chronological-leg-navigation.test.js` (New unit test suite)
  - [tests/city-nav-regression.js](file:///c:/Apps/Projects/travel-planner/tests/city-nav-regression.js) (Regression assertions)
  - [tests/run-tests.js](file:///c:/Apps/Projects/travel-planner/tests/run-tests.js) (Suite registration)

---

### Task 1: Unit Test Suite for Chronological Leg Sequence & Visit Numbering

**Files:**
- Create: `tests/chronological-leg-navigation.test.js`
- Modify: `tests/run-tests.js`

- [ ] **Step 1.1**: Write failing unit tests in `tests/chronological-leg-navigation.test.js` covering:
  - Sequencing from multi-leg fixtures (`2026_June_July_Europe_Thailand.json`).
  - Dynamic visit numbering: `Brisbane (1)` & `Brisbane (2)`, `Bangkok (1)`, `(2)`, `(3)`.
  - Day-trip blip detection: `↳ Venice` attached to `Verona (1)`.
  - Preserving single-visit cities without numbers (e.g. `Taipei`, `Vienna`).
- [ ] **Step 1.2**: Register `runChronologicalLegNavigationTests()` in `tests/run-tests.js`.
- [ ] **Step 1.3**: Run `node tests/chronological-leg-navigation.test.js` and verify it fails before implementation.
- [ ] **Step 1.4**: Commit task scaffolding.

---

### Task 2: Implement `getChronologicalLegSequence()` Engine in `js/itinerary.js`

**Files:**
- Modify: `js/itinerary.js`

- [ ] **Step 2.1**: Implement `getChronologicalLegSequence()` in `js/itinerary.js`:
  - Calculate frequency of each normalized city name across `appData`.
  - Track occurrence index and format labels (`(1)`, `(2)`, etc. for multi-visit cities; preserve custom labels if present).
  - Extract day-trip excursions from leg days and append inline blip entries: `{ type: 'daytrip-blip', cityName, displayLabel: '↳ ' + cityName, parentLegId, dayIndex }`.
- [ ] **Step 2.2**: Export `getChronologicalLegSequence` to `window` for testability and UI consumers.
- [ ] **Step 2.3**: Run `node tests/chronological-leg-navigation.test.js` to verify all unit tests pass.
- [ ] **Step 2.4**: Commit implementation with conventional message.

---

### Task 3: Redesign `#cityNav` (Desktop & Mobile Rail) to Render 1:1 Leg Sequence

**Files:**
- Modify: `js/itinerary.js`
- Modify: `js/ui.js`

- [ ] **Step 3.1**: Update `buildCityNav()` in `js/itinerary.js` to render buttons from `getChronologicalLegSequence()`:
  - Render `🏙️ All` button as the leading pill.
  - Render each leg button with `data-leg-id` and `data-city-name`.
  - Render day-trip blips with `data-role="daytrip-blip"`, `↳ <City>` text, and distinctive dashed styling.
  - Append `➕ City` button at the end.
- [ ] **Step 3.2**: Update `selectCityFilter()` and click handlers:
  - If a leg pill is clicked, jump/scroll to `#leg-${legId}` in the itinerary timeline (with sticky header offset).
  - If a day-trip blip is clicked, jump/scroll directly to `#day-${parentLegIndex}-${dayIndex}`.
- [ ] **Step 3.3**: Update scrollspy/IntersectionObserver logic in `setupCompactCityNavSync` to track active `legId`.
- [ ] **Step 3.4**: Commit `#cityNav` updates.

---

### Task 4: Align Mobile Swipe Slider (`compact-city-swipe-pager`) and Cross-Tab Filters

**Files:**
- Modify: `js/itinerary.js`
- Modify: `js/tabs.js`
- Modify: `js/transport.js`

- [ ] **Step 4.1**: Update `getCompactMobileLegSequence()` to use `getChronologicalLegSequence()` so mobile swipe slides and chips match the exact 1:1 sequence.
- [ ] **Step 4.2**: In Accom (`js/tabs.js`) and Transit (`js/transport.js`), ensure filtering supports `legId` for isolated leg view while keeping `all` functional.
- [ ] **Step 4.3**: Ensure Budget tab continues to group by consolidated city destination.
- [ ] **Step 4.4**: Commit cross-tab integration.

---

### Task 5: Full Regression Testing, Viewport Verification, and Android Build

**Files:**
- Modify: `tests/city-nav-regression.js`

- [ ] **Step 5.1**: Update `tests/city-nav-regression.js` assertions to reflect 1:1 leg sequence and run `node tests/city-nav-regression.js`.
- [ ] **Step 5.2**: Run full test suite `npm test` across Desktop (`1440x900`) and Mobile (`390x844`).
- [ ] **Step 5.3**: Run `npm run build:mobile` and Gradle `gradlew assembleDebug` to confirm build parity.
- [ ] **Step 5.4**: Final commit and push.
