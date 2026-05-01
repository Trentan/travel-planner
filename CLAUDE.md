# CLAUDE.md

> ⚡ **If the user's message matches a command below, execute it immediately and stop reading. Do not read further unless the command explicitly requires project context.**

---

## Command Dictionary

> **Key:** `{N}` = item number · `{a}` = sub-task letter · `{i}` = sub-item roman numeral · e.g. `Start 3b` or `Confirm 3b-ii`

### Session Commands
| Command | Action |
|---|---|
| `Start {Nai}` | Read `TODO.md` → `UNFINISHED.md`. Record and commit to `UNFINISHED.md`: item name, branch, full sub-task/sub-item breakdown, expected files to touch, estimated commits. Reply with this information and remind the user to proceed with `Confirm {Nai}`. |
| `Confirm {Nai}` | Proceed with the stated sub-task or sub-item using information from `UNFINISHED.md`. No further confirmation needed unless information is missing or clarification is required. Update `UNFINISHED.md` with recent changes; move `Item-{Nai}` to Awaiting Review with a change summary and matching commit IDs. Commit and push branch. Reply notifying the user to review changes for `Item-{Nai}`. |
| `Resume` | Read `UNFINISHED.md` + `git log`. Reply with: branch, last commit, what was done, exact next step. Wait for go-ahead before doing anything. |
| `Park` | Update `UNFINISHED.md` with current state and exact next step. Push branch. Reply with branch name and next step. Stop all work immediately. |

### Status Commands
| Command | Action |
|---|---|
| `Where up to` | Read `UNFINISHED.md`. Reply with one line only: item + sub-task, branch, last commit message. Nothing else. |
| `Status` | Read `UNFINISHED.md`. Reply with: active item + sub-task, branch, last commit, next step, anything awaiting review. Do not start work. |
| `Pending` | Read `UNFINISHED.md`. List all Awaiting Review items — item, branch, one-line summary. Do not start work. |

### TODO Commands
| Command | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|---|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `New Item` | Ask the user to describe the item. Auto-increment item number from `TODO.md`. Write to `TODO.md` with task and sub-task breakdown. Commit and push. Reply with exactly what was written.                                                                                                                                                                                                                                                                                                                                                                  |
| `Add to {Na}` | Ask the user to describe the new sub-task or sub-item. Append to the correct item in `TODO.md` using the next available letter or roman numeral. Commit and push. Reply with exactly what was written.                                                                                                                                                                                                                                                                                                                                                    |
| `Complete {Nai}` | The user is declaring this item done — do not verify, read code, grep, or check implementation. Trust the user. Immediately: mark referenced item/sub-task/sub-item`[x]` in `TODO.md` for the stated sub-task/sub-item. Cascade upward: if all sub-items under a sub-task are done, mark the sub-task `[x]`; if all sub-tasks under a task are done, mark the task `[x]`. Move the item from Awaiting Review to Completed in `UNFINISHED.md`. Commit, push branch, and create a pull request for review to main. Reply with branch and Pull Request link. |
| `Finish {Nai}` | Complete the pending Pull Request for the item referenced in `UNFINISHED.md` Completed section. Move the item from Completed in `UNFINISHED.md` to `VERIFIED.md`. Commit and push. Reply with outcome.                                                                                                                                                                                                                                                                                                                                                    |

---

> 📄 **Commands above require no further context. Only read below if starting a new session, resuming work, or beginning a `Start` / `Confirm` command.**

---

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
- `TODO.md` - Active task queue — read from main branch, owned by user
- `UNFINISHED.md` - Live session state — owned by Claude Code, lives on feature branch
- `VERIFIED.md` - Completed and confirmed items — owned by user, append-only archive
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
- **Checkbox state**: Toggles `done` property and re-renders for strikethrough effect
- **Cost parsing**: Use `parseCost()` helper to extract numbers from strings
- **Sorting**: `sortLegs()` sorts by first day's date, called after date changes
- **Auto-save**: `saveData(false)` for silent saves, `saveData(true)` shows ✓ indicator

---

## Development Workflow

### Three-file system
- `TODO.md` — Read from main branch to compare to current branch; owned by user
- `UNFINISHED.md` — Claude Code owns this; lives on feature branch; tracks active + awaiting review
- `VERIFIED.md` — Append-only archive of confirmed completed items; owned by user

---

### On session start / re-entry

> **Re-entering a session?** Read `CLAUDE.md` → `TODO.md` → `UNFINISHED.md` → declare status → wait for go-ahead.

1. Read this entire `CLAUDE.md` before doing anything else
2. Sync and orient:
    - `git fetch origin main`
    - `git show origin/main:CLAUDE.md` — read latest instructions from main
    - `git diff origin/main -- TODO.md` — check if TODO.md differs from main
    - If main TODO.md is ahead of local: `git checkout origin/main -- TODO.md` to sync it, then read it
    - If same: read local TODO.md as-is
    - Determine target branch — in order:
        1. TODO.md active item `**Branch:**` field — use this first
        2. UNFINISHED.md `**Branch:**` field — confirms it
        3. `git branch -a` — verify it exists on remote
        4. If branch doesn't exist yet: create from main — `git checkout main && git pull origin main && git checkout -b item-{N}{letter}-{short-desc}`
        5. If still unclear: ask the user, don't guess
    - `git checkout {target-branch}` and `git pull origin {target-branch}`
    - Read `UNFINISHED.md` — most precise resume point. Prioritise over git log for orientation. Only check git log if UNFINISHED.md is missing or unclear.

3. Declare your status report:
    - Which item/sub-task you are starting or resuming
    - What the last completed commit was (if resuming)
    - What the next concrete step is (from UNFINISHED.md if resuming)
    - What files will be touched
    - Estimated commit count for this sub-task
    - Any items currently awaiting review in UNFINISHED.md

   Immediately update `UNFINISHED.md` with this status before touching any code — even before the first commit exists.

4. Wait for user confirmation before writing any code.

---

### Scope rules (strictly enforced)
- Work ONLY on the requested item/sub-task — nothing else
- If you notice a related bug or improvement while working, add it to `## Noticed (unscheduled)` in `TODO.md` — do not fix it
- If the requested change requires touching something outside stated scope, **flag it and ask** before proceeding

---

### Item format in TODO.md

Items use lettered sub-tasks (a, b, c...). Sub-tasks can have roman numeral sub-items (i, ii, iii...):

```
- [ ] a) Top level sub-task
- [ ] b) Another sub-task
    - [ ] i) Sub-item of b
    - [ ] ii) Another sub-item of b
```

**Branch naming:**
- `item-8a` — top level sub-task
- `item-8b-i` — sub-item
- `item-8b-ii` — next sub-item

**Commit message format:**
- `Item 8a [1 of 2]: what changed`
- `Item 8b-i [1 of 3]: what changed`

---

### Working through sub-tasks

- Do ONE sub-task at a time — no bundling unless explicitly instructed
- Before starting, verify the app loads without errors in its current state
- Keep each commit small and focused — one logical change per commit
- After each commit, in this exact order:
    1. **Update `UNFINISHED.md` immediately** — before anything else, every commit, no exceptions
    2. Run through relevant items in the **Testing Checklist** in TODO.md
    3. Summarise exactly what changed, what files were touched, and why
    4. `git push origin {branch}` immediately after every commit — no exceptions
    5. Report back to user: branch name, commit message, one-line summary
- After the final commit of a sub-task:
    1. Push and open a PR for review
    2. Check `[x]` on that sub-task in `TODO.md` and update the item's **Status** block
    3. Move active item to `## Awaiting Review` in `UNFINISHED.md` with change summary
    4. **Stop and wait** — do not continue to the next sub-task until the user confirms

---

### UNFINISHED.md format

Update after orientation AND after every commit:

```markdown
# UNFINISHED.md

## 🔄 Active
- **Item/sub-task:** 8a
- **Branch:** item-8a-country-city
- **Last commit:** `Item 8a [1 of 3]: added ISO country datalist`
- **What was done:** Brief plain-english description of what changed and why
- **Next step:** Exact next step — include file and approximate line if known
- **Files touched:** All files changed so far in this sub-task
- **Known blockers / risks:** Anything needing a decision or that could cause problems
- **Noticed (unscheduled):** Bugs or improvements spotted — copy to TODO.md Noticed too

## 👀 Awaiting Review / Merge
- **Item:** 7f — branch `item-7f-packing` — PR open, waiting merge
  - Summary of what changed (brief, one line per significant change)
```

When active item is confirmed complete, clear the Active block:

```markdown
## 🔄 Active
none
```

When item is merged and verified, remove it from Awaiting Review entirely. User archives to `VERIFIED.md`.

---

### Blockers

If you hit a blocker mid-task:
- Update `UNFINISHED.md` with the blocker details before stopping
- Describe exactly what the blocker is and what options exist
- State which option you recommend and why
- Wait for the user to choose before continuing

---

### Oversized sub-tasks

If a sub-task looks too large for one session:
- Say so before starting: "This sub-task may exceed one session — recommend splitting into: a-i) X, a-ii) Y"
- Only proceed once the user has agreed on the split
- Write the agreed split into `UNFINISHED.md` under **Next step** before starting any code

---

### Adding new items
- Increment the item number (never reuse numbers)
- Break into lettered sub-tasks upfront before starting any work
- Add the full item to `TODO.md` under `## Active` before touching code
- If the user describes something vague, ask clarifying questions and confirm the sub-task breakdown before writing it down

---

### Completing items
- Only check `[x]` on a sub-task in `TODO.md` after explicit user confirmation
- Only move an item out of TODO.md after ALL sub-tasks are confirmed done
- Claude Code does NOT write to `VERIFIED.md` — user archives completed items there
- Clear the Active block in `UNFINISHED.md` when an item is fully confirmed done