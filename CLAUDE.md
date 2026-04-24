# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Travel Planner PWA is a completely offline, JSON-driven Progressive Web App for managing complex travel itineraries, budgets, and packing lists. No build process or dependencies - pure HTML/CSS/JS that runs entirely in the browser.

**Key architectural decisions:**
- Offline-first: Service Worker caches assets for 100% offline functionality
- JSON data engine: All trip data lives in a single portable JSON file
- No server or database required - uses browser localStorage for persistence
- Single-file architecture: All logic embedded in `index.html` for easy deployment
- Drag-and-drop itinerary planning with live budget calculations

## File Structure

- `index.html` - Main HTML structure, loads external modules
- `style.css` - Complete application styles
- `manifest.json` - PWA configuration for mobile installation
- `sw.js` - Service Worker for offline caching
- `js/` - JavaScript modules:
  - `utils.js` - Helper functions (clocks, cost parsing, constants)
  - `data.js` - Data management (init, save, import/export)
  - `packing.js` - Packing list CRUD operations
  - `dragdrop.js` - Drag-and-drop handlers
  - `crud.js` - Itinerary CRUD operations
  - `tabs.js` - Tab builders (transport, accom, budget, packing)
  - `ai.js` - AI prompt generator
  - `ui.js` - UI state and navigation
  - `itinerary.js` - Main itinerary builder
- `backups/` - Directory for exported trip JSON files

## Development Commands

**Run the app:**
```bash
# Simply open in browser - no build process required
start index.html
# Or use any local server:
python -m http.server 8000
```

**Test changes:**
- Open `index.html` directly in browser
- No compilation needed - changes are instant
- Clear localStorage to reset to defaults: `localStorage.clear()` in browser console

## Data Architecture

The app uses three main data structures stored in localStorage:

### 1. Itinerary Data (`travelApp_v2026_template`)
```javascript
{
  id: 'leg-1',
  label: '📍 City Name',
  colour: '#2C3E50',
  cityFood: [{text: "Food to try", done: false}],
  cityRun: [{title: "5km route", estTime: "1 hr", estCost: "0", assignedDayIdx: null}],
  suggestedSights: [{title: "Museum", estTime: "2 hrs", estCost: "15", assignedDayIdx: null}],
  legTips: ["Download local transit app"],
  days: [{
    date: '1 Jan',
    day: 'Mon',
    from: 'Home',
    to: 'City',
    completed: false,
    desc: 'Travel day',
    transportItems: [{text: "Flight details", cost: "250"}],
    accomItems: [{text: "Hotel name", cost: "120"}],
    activityItems: [{text: "Activity", cost: "0", time: "1 hr", done: false}]
  }]
}
```

### 2. Packing Data (`travelApp_packing_v3`)
Organized by bags: Walk-on gear, Carry-on packed bag, Personal item bag. Each contains categories with items that have `text` and `done` boolean.

### 3. Leave Home Data (`travelApp_leavehome_v3`)
Pre-departure checklist items with `text` and `done` boolean.

### 4. Metadata (`travelApp_meta_template` and `travelApp_filename_v2026`)
Trip title, subtitle, and current file name for display.

## Key Functions

**Core rendering functions:**
- `buildItinerary()` - Renders the main itinerary view with drag-and-drop
- `buildPackingTab()` - Renders packing lists
- `buildTransportTab()` / `buildAccomTab()` / `buildBudgetTab()` - Render summary tables
- `buildNav()` - Creates sticky navigation for trip legs

**Data management:**
- `saveData()` - Persists all data to localStorage (call after any mutation)
- `initData()` - Loads from localStorage or sets defaults on first run
- `exportJSON()` - Downloads current data as JSON file
- `importJSON()` - Loads data from uploaded JSON file

**Drag-and-drop system:**
- `handleDragStart()` / `handleDragOver()` / `handleDrop()` - Move sights/runs from pool to days
- Items track `assignedDayIdx` to show completion status

**CRUD operations:**
- `addLeg()` / `deleteLeg()` - Create/remove entire trip legs
- `addDayItem()` / `deleteDayItem()` - Manage daily items (transport, accom, activities)
- `addPackingItem()` / `togglePackingItem()` - Manage packing list items

## Modes and Features

**Toggle modes:**
- **Fun Mode** (📋 button) - Hides logistics/budget fields, shows activities only
- **Read Only Mode** (🔒 button) - Disables editing, hides all delete buttons  
- **Print Views** - Summary (condensed) or Detailed (full) print layouts

**AI Builder:**
- Generates prompts for ChatGPT/Gemini to create trip JSON
- Found in #tab-ai, generates structured JSON matching app schema

**Timezone clocks:**
- Automatically displays Home (Brisbane), Destination 1 (Europe), Destination 2 (Asia) times
- Update via `updateClocks()` function with setInterval

## Working with the Code

**Making changes1:**
1. All CSS is embedded in `<style>` tag at the top of index.html
2. All JavaScript is in the `<script>` tag at the bottom
3. No external libraries - vanilla JS only
4. Data mutations must call `saveData()` to persist

**Adding new features:**
- Follow existing patterns: data structure → rendering function → event handlers → save
- Reuse UI components: `.action-btn`, `.add-btn`, `.del-btn`, contenteditable spans
- Maintain offline-first: no external API calls

**Import/Export workflow:**
1. User imports via file picker → `importJSON()` parses and loads
2. User exports → `exportJSON()` downloads complete JSON with meta, itinerary, packing, leaveHome
3. Data portability is core feature - preserve structure when modifying

**Service Worker:**
- `sw.js` caches `index.html` and `manifest.json` only
- Update `CACHE_NAME` version to force cache refresh
- Registration in index.html: `navigator.serviceWorker.register('./sw.js')`

## Important Patterns

- **Contenteditable elements**: Use `onblur="updateX()"`, check if empty to delete items
- **Drag-and-drop**: Only enabled in edit mode, tracks `assignedDayIdx` property
- **Checkbox state**: Toggles `done` property and re-rends for strikethrough effect
- **Cost parsing**: Use `parseCost()` helper to extract numbers from strings
- **Sorting**: `sortLegs()` sorts by first day's date, called after date changes
- **Auto-save**: `saveData(false)` for silent saves, `saveData(true)` shows ✓ indicator

## Development Roadmap

### Phase 1: Compact View Mode [DONE]
Ultra-dense layout toggle for efficient viewing.
- [x] Compact View button and toggle
- [x] Compact CSS styling
- [x] `buildCompactItinerary()` function

### Phase 2: Code Refactoring [DONE]
Split 1400-line single-file into modules for maintainability:
- [x] Extract CSS to `style.css`
- [x] Extract JS to 9 modules: `utils.js`, `data.js`, `packing.js`, `dragdrop.js`, `crud.js`, `tabs.js`, `ai.js`, `ui.js`, `itinerary.js`
- [x] Update `sw.js` to cache all new files

### Phase 3: Enhanced Print Features [DONE]
- [x] Date range selection for printing
- [x] Print preview modal with live preview
- [x] Configurable print options (transport, accom, activities, costs)

### Phase 4: Bug Fixes & Polish [DONE]
- [x] JSON import error handling with graceful fallback
- [x] "Last exported/imported" timestamp display
- [x] Auto-save confirmations (already implemented)

### Phase 5: Interactive How-To Guide [PENDING]
- [x] Guide tab with expandable step cards
- [x] Mini demos within each step (buttons, inputs, checkboxes)
- [x] Interactive spotlight tutorial with navigation
- [x] Progress tracking across sessions
- [x] Keyboard navigation (arrows, escape)
- [ ] Global map showing all trip legs with color-coded routes
- [ ] Interactive markers for each city/destination
- [ ] Per-leg local map views
- [ ] Click-to-open in Google Maps

### Phase 6: Fix visuals, layout and compatibility [PENDING]
- [x] Clicking the confirmed or pending on the accommodation and transport tabs does not do anything on those tabs when in view
- [x] Improve the readability and interactivity making the screen space more functional and user-friendly
- [x] Ensure sights and running activities are consolidated into one list and make the money amount and time fit on a single line
- [x] Use the full width of the page to fit the multiple areas per leg
- [x] Make the city tips more like help text and one row/column directly under the collapsible city heading
- [x] fix the layout, make it all 3 columns in the itinerary nice and wide again
- [x] click action on confirmed/pending in the main itinerary is collapsing the dropdown and not updating the other tabs (and vice versa)
- [x] combine City Running/Fitness and Suggested Sights Pool into ONE GROUP - Suggested Activities

## Testing Checklist

Before considering work complete:
- [ ] Open index.html in browser - app loads without errors
- [ ] Create/edit/delete items in all tabs
- [ ] Drag sights/runs from pool to day cards
- [ ] Toggle Fun Mode and Read Only Mode - UI updates correctly
- [ ] Toggle Compact View - layout switches, checkboxes work
- [ ] Export JSON - file downloads with correct data
- [ ] Import JSON - data loads and renders properly
- [ ] Budget calculations update when costs change
- [ ] Packing items check/uncheck and persist after refresh
- [ ] Service Worker registers (check browser DevTools)
- [ ] Print views render correctly (test both Summary and Detailed)

---

## Future Enhancements (Unscheduled)

- Dark mode toggle
- Search/filter functionality
- Undo/redo system
- Image upload for receipts
- Cloud sync (Firebase/Dropbox)
- Multi-user collaboration
- Trip sharing/export formats (PDF, Google Docs)
- Activity duration tracking
- Flight miles tracking
- Budget categories breakdown
