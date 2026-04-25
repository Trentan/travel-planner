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
- `TODO.md` - Active task list (read this on every session start)
- `todo/` - Per-item spec files (e.g. `todo/item-3-accommodation.md`)

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

**Making changes:**
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

---

## Development Workflow

> **Re-entering a session?** Read `CLAUDE.md` → read `TODO.md` → check git log for last `item-*` branch → declare status → wait for go-ahead.

All active work items live in **`TODO.md`**. Always read that file on session start. Spec files for individual items live in `todo/`.

---

#### When resolving items

**On session start / re-entry:**
1. Read this entire `CLAUDE.md` before doing anything else
2. Read `TODO.md` — note the target item's status block, active branch, and next sub-task
3. If a spec file exists for the item (`todo/item-{N}-*.md`), read that too
4. Check git log for the last `item-{N}` branch to confirm what has already landed
5. Declare your status report out loud:
  - Which item/sub-task you are starting or resuming
  - What the last completed commit was (if resuming)
  - What files will be touched
  - An estimated commit count for this sub-task (e.g. "expect 2–3 commits")
6. If you cannot confidently determine where things left off — **ask, don't guess**
7. Wait for user confirmation before writing any code

---

**Scope rules (strictly enforced):**
- Work ONLY on the requested item/sub-task — nothing else
- If you notice a related bug or improvement while working, add it to the `## Noticed (unscheduled)` section in `TODO.md` — do not fix it
- If the requested change requires touching something outside stated scope, **flag it and ask** before proceeding

---

**Working through sub-tasks (a, b, c…):**
- Do ONE sub-task at a time — no bundling unless explicitly instructed
- Before starting, verify the app loads without errors in its current state
- Keep each commit small and focused — one logical change per commit
- After completing a sub-task:
  1. Run through the relevant items in the **Testing Checklist** below
  2. Summarise exactly what changed, what files were touched, and why
  3. Create a branch: `item-{N}{letter}` (e.g. `item-2a`)
  4. Commit with message: `Item {N}{letter} [X of Y]: {what was fixed and how}`
  5. Push and open a PR for review
  6. Update `TODO.md`: check `[x]` on that sub-task and update the item's **Status** block
  7. **Stop and wait** — do not continue to the next sub-task until the user confirms

---

**If you hit a blocker mid-task:**
- Stop immediately — do not attempt workarounds without flagging
- Describe exactly what the blocker is and what options exist
- State which option you recommend and why
- Wait for the user to choose before continuing

---

**If a sub-task looks too large for one session:**
- Say so before starting: "This sub-task may exceed one session — recommend splitting into: a-i) X, a-ii) Y"
- Only proceed once the user has agreed on the split
- At the end of each session chunk, leave a `// RESUME: next step is X` comment in the relevant file so the next session can orient from code, not just git log

---

**Adding new items:**
- Increment the item number (never reuse numbers)
- Break into lettered sub-tasks upfront before starting any work
- Add the full item to `TODO.md` under `## Active` before touching code
- If the user describes something vague, ask clarifying questions and confirm the sub-task breakdown before writing it down

---

**Completing items:**
- Only check `[x]` on a sub-task in `TODO.md` after explicit user confirmation
- Only move an item to `## Completed` in `TODO.md` after ALL sub-tasks are confirmed done
- Completed items are fully deleted from `TODO.md` on next scheduled cleanup