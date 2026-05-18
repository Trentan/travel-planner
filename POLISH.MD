# TASK: Travel Planner — Full UI/UX Polish Audit (v2)

You are acting as a senior front-end developer, UX analyst, and QA tester.
Your job is to conduct a complete polish audit of this PWA across **four view modes**,
take before screenshots, describe proposed after states, and self-manage all
findings in a `/polish` folder.

**This prompt is safe to re-run.** It will never delete or overwrite existing work.
Read the safe-run rules in STEP 0 before doing anything else.

---

## CONTEXT

- **App:** Travel Planner PWA — offline-first JSON-driven itinerary manager
- **Stack:** Vanilla JS, `index.html`, `/js/*.js` modules, `style.css`, service worker
- **Fonts:** Playfair Display (headings) · DM Sans (body) · DM Mono (numbers)
- **Tabs:** Itinerary · Transport · Accommodation · Budget · Packing · Map
- **Dev server:** run `npx serve . --listen 3000` (or check `start.bat`)
- **Test data:** import `backups/2026_June_July_Europe_Thailand.json` so real data is visible

### Four view modes (every issue must declare which modes it affects)

| Mode ID | Label | Viewport | Density setting |
|---------|-------|----------|-----------------|
| `DDE` | Desktop / Detailed | 1440 × 900 | Default (expanded cards, full labels) |
| `DCO` | Desktop / Compact | 1440 × 900 | Compact toggle active (condensed rows, shorter labels) |
| `MDE` | Mobile / Detailed | 390 × 844 | Default |
| `MCO` | Mobile / Compact | 390 × 844 | Compact toggle active |

Screenshots and WI files must tag which modes they cover.

---

## STEP 0 — SAFE-RUN CHECK (DO THIS FIRST, EVERY TIME)

Before creating any file or folder, run the following checks.

### 0a — Detect existing polish folder

```bash
ls polish/ 2>/dev/null && echo "EXISTS" || echo "FRESH"
```

- If **FRESH**: proceed with all steps as a first run.
- If **EXISTS**: this is an incremental run. Follow the incremental rules below for every step.

### 0b — Find the highest existing WI number

```bash
ls polish/items/WI-*.md 2>/dev/null | sort | tail -1
```

Store the result as `$LAST_WI`. All new work items must be numbered `$LAST_WI + 1` onward.
If no items exist yet, start at WI-001.

### 0c — Find the highest existing screenshot index per mode

```bash
ls polish/screenshots/before/ 2>/dev/null | sort
```

For each mode prefix (`dde-`, `dco-`, `mde-`, `mco-`), note the highest numbered file.
New screenshots must use the next available number for that prefix.
**Never overwrite an existing screenshot.**

### 0d — Read existing TRACKER.md

If `polish/TRACKER.md` exists, read it fully before writing any new rows.
New items must be **appended** to the correct priority section — not replace existing rows.
Items already marked ✅ Done must never be touched.

### 0e — Read existing AUDIT.md

If `polish/AUDIT.md` exists, read it. Append new findings as a dated section:

```md
---
## Incremental Audit — [today's date]
[new findings only]
```

Do not modify the original audit content.

### Incremental run summary

| Action | Rule |
|--------|------|
| `/polish/` folder | Create only if missing |
| `/polish/README.md` | Create only if missing |
| `/polish/AUDIT.md` | Create if missing; otherwise append new section |
| `/polish/TRACKER.md` | Create if missing; otherwise append new rows only |
| `items/WI-XXX.md` | Only create new files; never edit existing ones |
| Screenshots (before) | Skip if filename already exists; only capture missing ones |
| Screenshots (after) | Only create if the fix is done and file is missing |

---

## STEP 1 — CREATE OR VERIFY THE /polish FOLDER STRUCTURE

Only create files/folders that do not already exist.

```
/polish/
  README.md
  AUDIT.md
  TRACKER.md
  screenshots/
    before/   ← mode-prefixed filenames (see Step 2)
    after/    ← WI-XXX-after.png or WI-XXX-proposal.md
  items/      ← WI-XXX.md files
  scripts/
    take-screenshots.js
```

If creating fresh, write `/polish/README.md` with this content:

```md
# Travel Planner — App Polish Sprint

Self-managed audit + work backlog. No GitHub issues needed.
All items live in `/polish/items/`. Progress tracked in TRACKER.md.

## View modes
| ID | Label | Viewport | Notes |
|----|-------|----------|-------|
| DDE | Desktop / Detailed | 1440×900 | Default density |
| DCO | Desktop / Compact | 1440×900 | Compact toggle on |
| MDE | Mobile / Detailed | 390×844 | Default density |
| MCO | Mobile / Compact | 390×844 | Compact toggle on |

## Quick links
- [Full audit findings](./AUDIT.md)
- [Progress tracker](./TRACKER.md)
- [Work items](./items/)
- [Before screenshots](./screenshots/before/)
- [After proposals/screenshots](./screenshots/after/)

## How to work through items
1. Open TRACKER.md — pick the next 🔲 Todo item
2. Open its WI-XXX.md for full context, before screenshot ref, and proposed fix
3. Create or switch to a branch named for the work item e.g. `WI-001_Desktop-Menu-Wraps`
4. Implement the fix
5. Run regression: `node scripts/regression-city-nav.js`
6. Take an after screenshot: `node polish/scripts/take-screenshots.js --wi WI-XXX --mode [DDE|DCO|MDE|MCO]`
7. Update TRACKER.md status to ✅ Done
8. Commit on the WI branch with the WI number in the message, then push.
```

---

## STEP 2 — TAKE BEFORE SCREENSHOTS WITH PUPPETEER

Install Puppeteer if not present: `npm install puppeteer --save-dev`

Write (or overwrite only if it doesn't exist) `polish/scripts/take-screenshots.js`.

The script must:
- Accept an optional `--wi WI-XXX` flag to retake only screenshots for a specific work item
- Accept an optional `--mode [DDE|DCO|MDE|MCO]` flag to target a single mode
- **Skip any screenshot file that already exists in `screenshots/before/`** (never clobber)
- Print a clear error and exit if the dev server is not running on port 3000
- Activate the compact density toggle (if one exists in the app) before capturing Compact mode screenshots; deactivate it for Detailed mode screenshots
- Save all files to `/polish/screenshots/before/` using the naming convention below

### Naming convention

```
[mode]-[NN]-[slug].png
```

Examples: `dde-01-home.png`, `mco-05-itinerary.png`

### Screenshots to capture — Desktop Detailed (DDE) — viewport 1440 × 900

| Filename | How to capture |
|----------|---------------|
| `dde-01-home.png` | Full page, Itinerary tab active, real data loaded |
| `dde-02-menu-bar.png` | Clip: top 60px (`.app-menu-bar`) |
| `dde-03-header.png` | Clip: `header` element |
| `dde-04-tabs.png` | Clip: `.app-tabs-nav` + `.city-nav` |
| `dde-05-itinerary.png` | Expand first day; screenshot `.tab-pane.active` |
| `dde-06-transport.png` | Transport tab: `#tab-transport` |
| `dde-07-budget.png` | Budget tab: `#tab-budget` |
| `dde-08-packing.png` | Packing tab: `#tab-packing` |
| `dde-09-map.png` | Map tab: `#tab-map` |
| `dde-10-journey-modal.png` | Open a journey entry modal; full modal |
| `dde-11-ai-builder.png` | AI Builder modal; full modal |
| `dde-12-accom.png` | Accommodation tab: `#tab-accom` |

### Screenshots to capture — Desktop Compact (DCO) — viewport 1440 × 900, compact on

| Filename | How to capture |
|----------|---------------|
| `dco-01-home.png` | Full page, Itinerary tab, compact mode active |
| `dco-02-menu-bar.png` | Clip: top 60px — does it still fit? |
| `dco-03-tabs.png` | Clip: `.app-tabs-nav` + `.city-nav` — labels truncate? |
| `dco-04-itinerary.png` | Expand first day; condensed card rows visible |
| `dco-05-transport.png` | Transport tab in compact mode |
| `dco-06-budget.png` | Budget tab in compact mode |
| `dco-07-journey-modal.png` | Journey modal — does compact affect modal layout? |

### Screenshots to capture — Mobile Detailed (MDE) — viewport 390 × 844, deviceScaleFactor 3

| Filename | How to capture |
|----------|---------------|
| `mde-01-home.png` | Full viewport, Itinerary tab, real data |
| `mde-02-header.png` | Clip: top 100px |
| `mde-03-tabs.png` | Clip: `.app-tabs-nav` + `.city-nav` |
| `mde-04-menu-open.png` | Tap ☰ Menu; screenshot bottom sheet |
| `mde-05-itinerary.png` | Expanded day card with activities visible |
| `mde-06-transport.png` | Transport tab |
| `mde-07-budget.png` | Budget tab |
| `mde-08-journey-modal-top.png` | Journey modal scrolled to top |
| `mde-09-journey-modal-bottom.png` | Journey modal scrolled to bottom |
| `mde-10-ai-builder.png` | AI Builder modal |
| `mde-11-city-nav-overflow.png` | City nav with many cities — scroll affordance visible? |
| `mde-12-accom.png` | Accommodation tab |

### Screenshots to capture — Mobile Compact (MCO) — viewport 390 × 844, compact on

| Filename | How to capture |
|----------|---------------|
| `mco-01-home.png` | Full viewport, Itinerary tab, compact mode active |
| `mco-02-tabs.png` | `.app-tabs-nav` — do tab labels survive compact + small screen? |
| `mco-03-menu-open.png` | Bottom sheet in compact mode |
| `mco-04-itinerary.png` | Expanded day card, compact row height |
| `mco-05-budget.png` | Budget KPI grid — does compact mode help at 390px? |
| `mco-06-journey-modal-top.png` | Journey modal top in compact mode |
| `mco-07-city-nav-overflow.png` | City nav in compact mode |

---

## STEP 3 — AUDIT THE APP (CODE + SCREENSHOT ANALYSIS)

Read the following source files in full before writing the audit:
- `index.html`
- `style.css`
- `js/ui.js`
- `js/itinerary.js`
- `js/tabs.js`
- `js/dragdrop.js`
- `js/map.js`

Then review every before screenshot you captured.

If `polish/AUDIT.md` already exists, **append** a new dated section rather than overwriting.

Write (or append to) `/polish/AUDIT.md` using the structure below. Aim for 20–30 issues minimum per run.

```md
# Travel Planner PWA — UI/UX & Polish Audit

**Audit date:** [today]
**Viewports tested:** DDE (1440×900 Detailed) · DCO (1440×900 Compact) · MDE (390×844 Detailed) · MCO (390×844 Compact)
**Real data used:** 2026_June_July_Europe_Thailand.json

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total issues (this run) | X |
| 🔴 Critical | X |
| 🟡 Important | X |
| 🟢 Polish | X |
| Estimated total effort | X hours |
| Design maturity (1–10) | X/10 |
| Single biggest win | [one sentence] |
| Modes most affected | [e.g. MCO, MDE] |

### Top 5 highest-impact changes
1. ...

---

## Screenshot Analysis

For EACH screenshot write a section:

### [filename] — [Mode label]
**What's working:** [bullets]
**Issues found:**
① [name] — [element · location · what fails · which modes affected: DDE / DCO / MDE / MCO]
② ...

---

## Known suspects — explicitly check each one across all four modes

| Suspect | Location | DDE | DCO | MDE | MCO |
|---------|----------|-----|-----|-----|-----|
| App menu bar 14-button overflow | `.app-menu-bar` | ? | ? | n/a | n/a |
| Compact mode toggle — does it exist? | UI chrome | ? | ? | ? | ? |
| Compact mode — card row height changes | `.day-card`, `.activity-row` | ? | ? | ? | ? |
| Compact mode — modal layout impact | all modals | ? | ? | ? | ? |
| Journey modal height on mobile | `#journey-modal .modal-content` | n/a | n/a | ? | ? |
| "Accommodation" tab truncation | `.app-tab-btn[data-tab="accom"]` | ? | ? | ? | ? |
| contenteditable H1 tap-to-edit | `#mainTitle`, `#mainSubtitle` | ? | ? | ? | ? |
| Transport type button row | `.transport-type-group` | ? | ? | ? | ? |
| City nav scroll affordance | `.city-nav-list` | ? | ? | ? | ? |
| Modal close button tap target ≥44px | `.modal-close` | ? | ? | ? | ? |
| Drag handle affordance on mobile | Draggable activity cards | n/a | n/a | ? | ? |
| Map tab placeholder | `#tab-map` | ? | ? | ? | ? |
| Mobile menu 4 export buttons | `#mobileMenuSheet` | n/a | n/a | ? | ? |
| Budget KPI grid at 390px | `.budget-kpi-grid` | n/a | n/a | ? | ? |
| Compact mode — tab label truncation at 390px | `.app-tab-btn` | n/a | n/a | n/a | ? |

---

## Mode comparison — issues unique to each mode

| Mode | Issue count | Unique issues (not present in other modes) |
|------|------------|-------------------------------------------|
| DDE | X | ... |
| DCO | X | ... |
| MDE | X | ... |
| MCO | X | ... |

---

## Aesthetic Review

### Design maturity: X/10

**Strengths:** [bullets]
**Weaknesses:** [bullets]

| Benchmark | What they do better | Takeaway for this app |
|-----------|--------------------|-----------------------|
| Wanderlog | | |
| TripIt | | |
| Linear (UI patterns) | | |
| Notion | | |

### Typography assessment
[Playfair Display + DM Sans — issues at small sizes in compact mode?]

### Colour + contrast
[Navy #1A242F + body palette — any WCAG AA failures?]

### Visual hierarchy
[Heading/body/action hierarchy — does compact mode collapse it too aggressively?]

---

## Mobile tap target audit

| Element | Selector | DDE | DCO | MDE | MCO | Min | Pass/Fail |
|---------|----------|-----|-----|-----|-----|-----|-----------|
| Tab buttons | `.app-tab-btn` | ? | ? | ? | ? | 44px | ? |
| ☰ Menu button | `.mobile-menu-btn` | n/a | n/a | ? | ? | 44px | ? |
| Modal close | `.modal-close` | ? | ? | ? | ? | 44px | ? |
| Action buttons | `.action-btn` | ? | ? | ? | ? | 44px | ? |
| City nav buttons | `.city-nav-btn` | ? | ? | ? | ? | 44px | ? |
| Expand/collapse | `#expandAll` | ? | ? | ? | ? | 44px | ? |

---

## Modal usability

| Modal | DDE scroll? | DCO scroll? | MDE scroll? | MCO scroll? | Footer reachable? |
|-------|-------------|-------------|-------------|-------------|-------------------|
| Journey | | | | | |
| Add Stay | | | | | |
| Add Leg | | | | | |
| Cities | | | | | |
| AI Builder | | | | | |
| Print Preview | | | | | |
| Guide | | | | | |

---

## Functional gaps

| Gap | Severity | Modes affected | Notes |
|-----|----------|---------------|-------|
| Map tab is a placeholder | 🔴 High | All | No map library — Leaflet recommended |
| [others] | | | |
```

---

## STEP 4 — CREATE INDIVIDUAL WORK ITEM FILES

For every **new** issue found in this audit run, create `/polish/items/WI-XXX.md`.

- Number from `$LAST_WI + 1` (determined in Step 0b)
- Order by priority within this run (Critical first)
- **Never edit an existing WI file**

Each file must follow this exact template:

```md
# [WI-XXX] [TITLE]

| Field | Value |
|-------|-------|
| Priority | 🔴 Critical / 🟡 Important / 🟢 Polish |
| Effort | 🔴 Major (1–3 days) / 🟡 Medium (2–8 hrs) / 🟢 Quick Win (<1 hr) |
| Modes affected | DDE · DCO · MDE · MCO (list only those that show the issue) |
| Dimension | Mobile Layout / Desktop Aesthetic / Compact Mode / Functionality / UX Flow |
| Status | 🔲 Todo |
| Before screenshot | `../screenshots/before/[mode-NN-slug].png` |
| After proposal | `../screenshots/after/WI-XXX-proposal.md` |
| Files to change | `style.css` · `js/ui.js` · etc |

---

## Problem

[2–3 sentences. What element, what screen(s)/mode(s), what fails, why it matters.]

## Before (current state)

> Screenshot: `../screenshots/before/[filename].png`
> Mode: [DDE / DCO / MDE / MCO]
> Callout: [exactly what to look at — element, position, what's wrong]

## Proposed fix

[Specific implementation. Name the CSS class, JS function, or HTML element.
Note if the fix must be mode-conditional (e.g. only applies when `.compact` class is active).]

```css
/* BEFORE */
.some-class { ... }

/* AFTER */
.some-class { ... }

/* Compact-mode override example */
.compact .some-class { ... }
```

Or for JS changes:
```js
// BEFORE
...

// AFTER
...
```

## After (proposed state description)

[Describe the corrected state precisely for each affected mode.
E.g.: "In MDE, the modal footer is pinned and reachable without scrolling.
In MCO, the same fix applies with 10% tighter padding.
DDE and DCO are unaffected."]

## Acceptance criteria

- [ ] Fix verified in [list each affected mode]
- [ ] No regression in unaffected modes
- [ ] Tap targets remain ≥44px on mobile after fix
- [ ] Regression check passes: `node scripts/regression-city-nav.js`

## How to implement

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

## STEP 5 — UPDATE THE TRACKER

If `polish/TRACKER.md` does not exist, create it fresh.
If it **does** exist, **only append new rows** to the correct priority section.
Never modify or delete rows for existing items.

```md
# Polish Sprint — Progress Tracker

Last updated: [date]
Progress: [existing done count]/[total including new] items complete

---

## 🔴 Critical

| ID | Title | Modes | Effort | Status | Done |
|----|-------|-------|--------|--------|------|
| [WI-001](./items/WI-001.md) | [title] | DDE · MDE | 🟢 Quick Win | 🔲 Todo | — |

## 🟡 Important

| ID | Title | Modes | Effort | Status | Done |
|----|-------|-------|--------|--------|------|

## 🟢 Polish

| ID | Title | Modes | Effort | Status | Done |
|----|-------|-------|--------|--------|------|

---

## Completed ✅

| ID | Title | Modes | Completed |
|----|-------|-------|-----------|
| — | — | — | — |

---

## How to update this file

When you finish a work item:
1. Change its Status cell to `✅ Done`
2. Fill in the Done date
3. Move the row to the Completed table at the bottom
4. Take after screenshot: `node polish/scripts/take-screenshots.js --wi WI-XXX --mode [MODE]`
5. Replace `WI-XXX-proposal.md` with real `WI-XXX-after.png` in `screenshots/after/`
6. Update the after screenshot reference in `items/WI-XXX.md`
7. Update the progress count at the top of this file
```

---

## STEP 6 — CREATE PROPOSAL MOCKUPS

For each **new** Critical or Important work item, you MUST create a visual proposal.

1. **Option A (HTML Mockup):** Create a standalone `polish/items/proposals/WI-XXX-mockup.html`. This file should:
   - Import `style.css`.
   - Contain a minimal HTML structure demonstrating the "fixed" state of the component.
   - Be screenshotted and saved as `polish/screenshots/after/WI-XXX-proposal.png`.
2. **Option B (Detailed Markdown):** If Option A is impractical, create `polish/screenshots/after/WI-XXX-proposal.md` with an exhaustive visual spec and any reference imagery.

**The TRACKER.md and WI-XXX.md must link to these proposal files.**

---

## STEP 7 — FINAL SUMMARY REPORT

Append this section to `/polish/AUDIT.md` (after the main findings):

```md
---

## Run summary — [today's date]

| File | Count |
|------|-------|
| New WI files created | X |
| New screenshots captured | X |
| Screenshots skipped (already existed) | X |
| New TRACKER rows added | X |

## Files created this run

[list only new files]

## Recommended order of attack (this run's new items)

1. [WI-XXX] — [title] — [why first]
2. ...

## Definition of done for the full sprint

- [ ] All 🔴 Critical items resolved across all four modes
- [ ] All 🟡 Important items resolved
- [ ] Regression check passing
- [ ] After screenshots taken for all completed items in each affected mode
- [ ] TRACKER.md showing 100% complete
```

---

## NOTES FOR CLAUDE CODE

- **Always complete Step 0 before anything else.** It determines whether you are in fresh or incremental mode and sets `$LAST_WI`.
- Work through Steps 1–7 in order. Do not skip steps.
- If Puppeteer screenshots fail (server not running, selector not found), note the failure in the relevant WI file and continue — do not abort the whole audit.
- Use real CSS selectors from the actual source files — read them before writing fix code.
- Do not invent issues. Only report what you can see in screenshots or source code.
- For every issue, explicitly state which of the four modes (DDE / DCO / MDE / MCO) it affects.
- Issues that only appear in Compact mode must be tagged `DCO` or `MCO` (or both) and the fix must use the `.compact` class scope where appropriate.
- If multiple WIs are active, keep one WI per branch; verify the current branch before editing.
- Do not edit another WI's files in a shared worktree; commit and push a verified WI before switching context.
- The `/polish` folder is self-contained. Nothing outside it changes until you implement a fix.
- When a WI is moved to Done, commit on the WI branch with the WI number in the commit message, then push before closing out.
- When done, print: `Polish audit complete — X new items found, X screenshots taken, files in /polish/`

---

## PROMPT TO BEGIN (copy this into Claude Code to start or resume the audit)

```
Read POLISH.MD in full. Then:

1. Run the Step 0 safe-run checks to detect whether /polish already exists and find the highest existing WI number and screenshot index.
2. Work through Steps 1–7 in order using the incremental rules — never overwrite existing files.
3. Capture all missing before screenshots across all four modes: DDE (Desktop Detailed), DCO (Desktop Compact), MDE (Mobile Detailed), MCO (Mobile Compact). Skip any screenshot file that already exists.
4. Audit the app from source + screenshots. Tag every issue with the modes it affects.
5. Create new WI files numbered from the next available ID. Append new rows to TRACKER.md.
6. Print a one-line completion summary when done.

Do not stop if individual screenshots fail — log the failure in the relevant WI and continue.
```

### Prompt to work a single item

```
Work on the next Todo item in polish/TRACKER.md.
Complete it end-to-end: implement the fix, verify in all modes listed on the WI, take after screenshot(s), update TRACKER.md.
Follow all safe-run rules — do not touch other WI files or tracker rows.
```

### Prompt to work a specific item

```
Work on WI-[XXX] in polish/TRACKER.md.
Complete it end-to-end: implement the fix, verify in modes [DDE / DCO / MDE / MCO],
take after screenshot(s) using the Puppeteer script with --wi WI-XXX --mode [MODE],
update TRACKER.md status to ✅ Done and move row to Completed.
Commit on branch WI-[XXX] and push.
```