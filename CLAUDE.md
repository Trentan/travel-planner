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
- `TODO.md` - Active task list (read on every session start)
- `todo/SESSION.md` - Live session state (read on every session start)
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

> **Re-entering a session?** Read `CLAUDE.md` → read `TODO.md` → read `todo/SESSION.md` → declare status → wait for go-ahead.

All active work items live in **`TODO.md`**. Live session state lives in **`todo/SESSION.md`**. Spec files for individual items live in `todo/`.

---

### When resolving items

---

**On session start / re-entry:**
1. Read this entire `CLAUDE.md` before doing anything else
2. Read `TODO.md` — note the target item's status block, active branch, and next sub-task
3. Read `todo/SESSION.md` — this is the most precise resume point; it contains the last commit, exact next step, files touched, and any known blockers. Prioritise this over git log for orientation
4. Read `todo/item-{N}-*.md` if a spec file exists for the target item
5. Only check git log if `SESSION.md` is missing or its contents are unclear
6. Declare your status report out loud:
  - Which item/sub-task you are starting or resuming
  - What the last completed commit was (if resuming)
  - What the next concrete step is (from SESSION.md if resuming)
  - What files will be touched
  - An estimated commit count for this sub-task
  
    Immediately write that status report to `todo/SESSION.md` before touching any code —
    even before the first commit exists. This ensures a dropout at any point after
    orientation leaves a recoverable state.

7. If you cannot confidently determine where things left off — **ask, don't guess**
8. Wait for user confirmation before writing any code

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
- After each commit, in this exact order:
  1. **Write `todo/SESSION.md` immediately** (see format below) — do this before anything else, every single commit, no exceptions
  2. Run through the relevant items in the **Testing Checklist** below
  3. Summarise exactly what changed, what files were touched, and why
  4. Branch name: `item-{N}{letter}` (e.g. `item-2a`)
  5. Commit message: `Item {N}{letter} [X of Y]: {what was fixed and how}`
  6. Push and open a PR for review
- After the final commit of a sub-task:
  1. Check `[x]` on that sub-task in `TODO.md` and update the item's **Status** block
  2. Write the closed SESSION.md state (see format below)
  3. **Stop and wait** — do not continue to the next sub-task until the user confirms

---

**SESSION.md format — write this after orientation AND after every commit:**

```markdown
## Session State

- **Item/sub-task:** 1b
- **Branch:** item-1b
- **Last commit:** `Item 1b [2 of 3]: fixed collapsible toggle event binding`
- **What was done:** Brief plain-english description of what changed and why
- **Next step:** Exact description of what comes next — include the relevant file and approximate line number if known (e.g. "Hook saveData() call in crud.js ~line 84 to trigger buildTransportTab() re-render")
- **Files touched:** All files changed so far in this sub-task
- **Known blockers / risks:** Anything that may need a decision or could cause problems next step
- **Noticed (unscheduled):** Any bugs or improvements spotted but not acted on — copy these to TODO.md Noticed section too
```

When a sub-task is fully confirmed complete by the user, replace contents with:

```markdown
## Session State

- **Status:** Complete
- **Last completed:** Item 1b — all commits landed and confirmed by user
- **Next:** Item 1c (or next item if all sub-tasks done)
```

---

**If you hit a blocker mid-task:**
- Update `todo/SESSION.md` with the blocker details before stopping
- Describe exactly what the blocker is and what options exist
- State which option you recommend and why
- Wait for the user to choose before continuing

---

**If a sub-task looks too large for one session:**
- Say so before starting: "This sub-task may exceed one session — recommend splitting into: a-i) X, a-ii) Y"
- Only proceed once the user has agreed on the split
- Write the agreed split into `todo/SESSION.md` under **Next step** before starting any code

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
- Clear and close out `todo/SESSION.md` when an item is fully done

---

## Testing Checklist

Before considering any work complete:
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