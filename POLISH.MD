# TASK: Travel Planner — Full UI/UX Polish Audit

You are acting as a senior front-end developer, UX analyst, and QA tester.
Your job is to conduct a complete mobile + desktop polish audit of this PWA,
take before screenshots, describe proposed after states, and self-manage all
findings in a `/polish` folder. Work through every step below in order.

---

## CONTEXT

- **App:** Travel Planner PWA — offline-first JSON-driven itinerary manager
- **Stack:** Vanilla JS, `index.html`, `/js/*.js` modules, `style.css`, service worker
- **Fonts:** Playfair Display (headings) · DM Sans (body) · DM Mono (numbers)
- **Tabs:** Itinerary · Transport · Accommodation · Budget · Packing · Map
- **Dev server:** run `npx serve . --listen 3000` (or check `start.bat`)
- **Test data:** import `backups/2026_June_July_Europe_Thailand.json` so real data is visible

---

## STEP 1 — CREATE THE /polish FOLDER STRUCTURE

Create the following files and folders (empty for now, you'll fill them in later steps):

```
/polish/
  README.md
  AUDIT.md
  TRACKER.md
  screenshots/
    before/   ← you will populate this in Step 2
    after/    ← you will populate this in Step 3
  items/      ← individual WI-XXX.md files, one per work item
```

Write `/polish/README.md` with this content:

```md
# Travel Planner — App Polish Sprint

Self-managed audit + work backlog. No GitHub issues needed.
All items live in `/polish/items/`. Progress tracked in TRACKER.md.

## Quick links
- [Full audit findings](./AUDIT.md)
- [Progress tracker](./TRACKER.md)
- [Work items](./items/)
- [Before screenshots](./screenshots/before/)
- [After proposals](./screenshots/after/)

## How to work through items
1. Open TRACKER.md — pick the next 🔲 Todo item
2. Open its WI-XXX.md for full context, before screenshot ref, and proposed fix
3. Create or switch to a branch named for the work item, for example `WI-001_Desktop-App-Menu-Wraps`
4. Implement the fix
5. Run regression: `node scripts/regression-city-nav.js`
6. Take an after screenshot and save to `screenshots/after/WI-XXX-after.png`
7. Update TRACKER.md status to ✅ Done
8. Commit the completed WI on the WI branch with the WI number in the commit message, then push that same branch.
```

---

## STEP 2 — TAKE BEFORE SCREENSHOTS WITH PUPPETEER

Start the dev server, then use Puppeteer to capture all required screenshots.
Install Puppeteer if not present: `npm install puppeteer --save-dev`

Write and run a script `polish/scripts/take-screenshots.js` that does the following.
If the server is not running, the script should print a clear error and exit.

### Screenshots to capture

**Desktop (viewport: 1440 × 900)**

| Filename | How to capture |
|----------|---------------|
| `desktop-01-home.png` | Full page, Itinerary tab active, real data loaded |
| `desktop-02-menu-bar.png` | Clip: top 60px only (the dark .app-menu-bar) |
| `desktop-03-header.png` | Clip: `header` element |
| `desktop-04-tabs.png` | Clip: `.app-tabs-nav` + `.city-nav` |
| `desktop-05-itinerary.png` | Click to expand first day; screenshot `.tab-pane.active` |
| `desktop-06-transport.png` | Click Transport tab; screenshot `#tab-transport` |
| `desktop-07-budget.png` | Click Budget tab; screenshot `#tab-budget` |
| `desktop-08-packing.png` | Click Packing tab; screenshot `#tab-packing` |
| `desktop-09-map.png` | Click Map tab; screenshot `#tab-map` |
| `desktop-10-journey-modal.png` | Click a journey entry to open modal; full modal screenshot |
| `desktop-11-ai-builder.png` | Open AI Builder modal; full modal screenshot |
| `desktop-12-mobile-menu.png` | Resize to 390px wide; click ☰ Menu; screenshot the bottom sheet |

**Mobile — iPhone 12 Pro (viewport: 390 × 844, deviceScaleFactor: 3)**

| Filename | How to capture |
|----------|---------------|
| `mobile-01-home.png` | Full viewport, Itinerary tab, real data |
| `mobile-02-header.png` | Clip: top 100px |
| `mobile-03-tabs.png` | Clip: `.app-tabs-nav` + `.city-nav` |
| `mobile-04-menu-open.png` | Tap ☰ Menu; screenshot bottom sheet |
| `mobile-05-itinerary.png` | Expanded day card with activities visible |
| `mobile-06-transport.png` | Transport tab |
| `mobile-07-budget.png` | Budget tab |
| `mobile-08-journey-modal-top.png` | Journey modal, scrolled to top |
| `mobile-09-journey-modal-bottom.png` | Journey modal, scrolled to bottom |
| `mobile-10-ai-builder.png` | AI Builder modal |
| `mobile-11-city-nav-overflow.png` | City nav with many cities — scroll affordance visible? |

Save all screenshots to `/polish/screenshots/before/`.

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

Write `/polish/AUDIT.md` using the structure below. Be exhaustive — aim for 20–30 issues minimum.

```md
# APP_POLISH_AUDIT.md
## Travel Planner PWA — UI/UX & Mobile Polish Audit

**Audit date:** [today]  
**Viewports tested:** Desktop 1440×900 · iPhone 12 Pro 390×844  
**Real data used:** 2026_June_July_Europe_Thailand.json  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total issues | X |
| 🔴 Critical | X |
| 🟡 Important | X |
| 🟢 Polish | X |
| Estimated total effort | X hours |
| Design maturity (1–10) | X/10 |
| Single biggest win | [one sentence] |

### Top 5 highest-impact changes
1. ...
2. ...

---

## Screenshot Analysis

For EACH screenshot write a section:

### [filename]
**View:** Desktop / Mobile  
**What's working:** [bullets]  
**Issues found:**  
① [name] — [specific description: element, location, what fails]  
② ...  

---

## Known suspects — explicitly check each one

Check these specific issues and report findings:

| Suspect | Location | Check |
|---------|----------|-------|
| App menu bar 14-button overflow | `.app-menu-bar` | Does it wrap/clip below 1380px? |
| Journey modal height on mobile | `#journey-modal .modal-content` | Does content exceed 844px? Is footer reachable? |
| "Accommodation" tab truncation | `.app-tab-btn[data-tab="accom"]` | Does label fit at 390px? |
| contenteditable H1 tap-to-edit | `#mainTitle`, `#mainSubtitle` | Opens keyboard on any mobile tap? |
| Transport type button row | `.transport-type-group` | Do 5 buttons fit at modal width on 390px? |
| From→To date+time inputs | `#journeyDateFrom` + `#journeyTimeFrom` | Are inputs usable on mobile? |
| City nav scroll affordance | `.city-nav-list` | Any fade/arrow indicating scroll? |
| Modal close button tap target | `.modal-close` | Is it ≥44×44px? |
| Drag handle affordance on mobile | Draggable activity cards | Visible grab handle? Touch events? |
| Map tab placeholder | `#tab-map` | Renders real map or just emoji? |
| Mobile menu 4 export buttons | `#mobileMenuSheet` | Do subtitles/labels explain each action? |
| Budget KPI grid at 390px | `.budget-kpi-grid` | Cards wrap correctly? No number overflow? |

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
[Playfair Display + DM Sans pairing — any issues on mobile?]

### Colour + contrast
[Navy #1A242F menu bar + body palette — any WCAG AA failures?]

### Visual hierarchy
[Heading/body/action hierarchy — any problems?]

---

## Mobile tap target audit

| Element | Selector | Estimated size | Min required | Pass/Fail |
|---------|----------|---------------|--------------|-----------|
| Tab buttons | `.app-tab-btn` | ? | 44px | ? |
| ☰ Menu button | `.mobile-menu-btn` | ? | 44px | ? |
| Modal close | `.modal-close` | ? | 44px | ? |
| Action buttons | `.action-btn` | ? | 44px | ? |
| City nav buttons | `.city-nav-btn` | ? | 44px | ? |
| Expand/collapse | `#expandAll` | ? | 44px | ? |

---

## Modal usability on mobile

| Modal | Scrollable? | Footer reachable? | Rating |
|-------|-------------|-------------------|--------|
| Journey | | | ✅/⚠️/❌ |
| Add Stay | | | |
| Add Leg | | | |
| Cities | | | |
| AI Builder | | | |
| Print Preview | | | |
| Guide | | | |

---

## Functional gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Map tab is a placeholder | 🔴 High | No map library — Leaflet recommended |
| [others found] | | |
```

---

## STEP 4 — CREATE INDIVIDUAL WORK ITEM FILES

For every issue found in the audit, create a file `/polish/items/WI-XXX.md`.

Number sequentially: WI-001, WI-002, etc. Order by priority (Critical first).

Each file must follow this exact template:

```md
# [WI-XXX] [TITLE]

| Field | Value |
|-------|-------|
| Priority | 🔴 Critical / 🟡 Important / 🟢 Polish |
| Effort | 🔴 Major (1–3 days) / 🟡 Medium (2–8 hrs) / 🟢 Quick Win (<1 hr) |
| Dimension | Mobile Layout / Desktop Aesthetic / Functionality / UX Flow |
| Status | 🔲 Todo |
| Before screenshot | `screenshots/before/[filename].png` |
| After proposal | `screenshots/after/WI-XXX-after.png` (see below) |
| Files to change | `style.css` · `js/ui.js` · etc |

---

## Problem

[2–3 sentences. Specific: what element, what screen, what fails and why it matters to the user.]

## Before (current state)

> Screenshot: `../screenshots/before/[filename].png`  
> Callout: [describe exactly what to look at in the screenshot — element, position, what's wrong]

## Proposed fix

[Specific implementation guidance. Name the CSS class, JS function, or HTML element.]

```css
/* BEFORE */
.some-class { ... }

/* AFTER */  
.some-class { ... }
```

Or for JS changes:
```js
// BEFORE
...

// AFTER
...
```

## After (proposed state description)

[Since we cannot auto-generate a real "after" screenshot before the fix is implemented,
describe in precise visual terms what the corrected state should look like.
Be specific enough that a developer knows exactly what "done" looks like.]

Example: "The modal-content div should scroll internally. The Save Journey and Cancel
buttons in the modal footer remain fixed at the bottom of the viewport regardless of
scroll position. On iPhone 12, no more than 88% of the viewport height is occupied."

## Acceptance criteria

- [ ] [Specific, testable outcome]
- [ ] [Another outcome]
- [ ] Regression check passes: `node scripts/regression-city-nav.js`

## How to implement

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

## STEP 5 — WRITE THE TRACKER

Write `/polish/TRACKER.md` — this is the single file used day-to-day to track progress.

```md
# Polish Sprint — Progress Tracker

Last updated: [date]  
Progress: 0/X items complete

---

## 🔴 Critical

| ID | Title | Effort | Status | Done |
|----|-------|--------|--------|------|
| [WI-001](./items/WI-001.md) | [title] | 🟢 Quick Win | 🔲 Todo | — |
| ... | | | | |

## 🟡 Important

| ID | Title | Effort | Status | Done |
|----|-------|--------|--------|------|
| ... | | | | |

## 🟢 Polish

| ID | Title | Effort | Status | Done |
|----|-------|--------|--------|------|
| ... | | | | |

---

## Completed ✅

| ID | Title | Completed |
|----|-------|-----------|
| — | — | — |

---

## How to update this file

When you finish a work item:
1. Change its Status cell to `✅ Done`
2. Fill in the Done date
3. Move the row to the Completed table at the bottom
4. Take an after screenshot → save to `screenshots/after/WI-XXX-after.png`
5. Update the after screenshot reference in `items/WI-XXX.md`
6. Update the progress count at the top of this file
```

---

## STEP 6 — TAKE "AFTER PROPOSAL" VISUAL NOTES

For each Critical and Important work item, create a text file in `/polish/screenshots/after/`
named `WI-XXX-proposal.md` describing the proposed visual state in enough detail to verify
the fix when implemented. This stands in for an actual after screenshot until the fix is done.

Once a fix IS implemented, replace the `.md` proposal with a real `.png` screenshot using
the same Puppeteer script from Step 2 (re-run it after the fix).

---

## STEP 7 — FINAL SUMMARY REPORT

Append a final section to `/polish/AUDIT.md`:

```md
---

## Files created

| File | Purpose |
|------|---------|
| `TRACKER.md` | Day-to-day progress tracker |
| `items/WI-001.md` … `items/WI-XXX.md` | Individual work items |
| `screenshots/before/` | X screenshots captured |
| `screenshots/after/` | Proposal notes (replace with real screenshots post-fix) |

## Recommended order of attack

Work through items in this order for maximum visible improvement fastest:

1. [WI-XXX] — [title] — why first
2. [WI-XXX] — [title] — why second
3. ...

## Definition of done for the full sprint

- [ ] All 🔴 Critical items resolved
- [ ] All 🟡 Important items resolved
- [ ] Regression check passing
- [ ] After screenshots taken for all completed items
- [ ] TRACKER.md showing 100% complete
```

---

## NOTES FOR CLAUDE CODE / CODEX

- Work through Steps 1–7 in order. Do not skip steps.
- If Puppeteer screenshots fail (server not running, selector not found), note the failure in the relevant item's `WI-XXX.md` and continue – do not stop the whole audit.
- Use real CSS selectors from the actual source files – read them before writing fix code.
- Do not invent issues. Only report what you can actually see in screenshots or source code.
- If multiple WIs are active, keep one WI per branch or worktree and verify the current branch before editing anything.
- Do not edit another WI's files or tracker row in a shared worktree; commit and push a verified WI before switching context.
- The `/polish` folder is self-contained. Nothing outside it needs to change until you implement a fix.
- When a WI is moved to Done, commit the change on the WI branch with the WI referenced in the commit message, then push that same branch before closing the item out.
- When done, print a one-line summary: `Polish audit complete — X items found, files in /polish/`

## Prompt for work
- Work on the next Todo item in polish/TRACKER.md. Follow CODEX.md. Complete the item end-to-end, including verification, after screenshot, and tracker updates.

or

- Work on Todo item WI-000 in polish/TRACKER.md. Follow CODEX.md. Complete the item end-to-end, including verification, after screenshot, and tracker updates.
