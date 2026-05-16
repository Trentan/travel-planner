# APP_POLISH_AUDIT.md
## Travel Planner PWA - UI/UX & Mobile Polish Audit

**Audit date:** 2026-05-16  
**Viewports tested:** Desktop 1440x900 · iPhone 12 Pro 390x844  
**Real data used:** 2026_June_July_Europe_Thailand.json  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total issues | 24 |
| 🔴 Critical | 8 |
| 🟡 Important | 12 |
| 🟢 Polish | 4 |
| Estimated total effort | 68-118 hours |
| Design maturity (1-10) | 6/10 |
| Single biggest win | Fix the mobile chrome/nav/modal overflow first so the app feels intentionally responsive. |

### Top 5 highest-impact changes
1. Collapse the desktop menu into one row and reduce mobile app chrome height.
2. Rebuild the mobile journey modal layout to eliminate horizontal clipping.
3. Add visible overflow affordances to the primary tab and city nav rails.
4. Replace the mobile transport table with compact journey cards.
5. Normalize budget currency formatting and KPI density.

---

## Screenshot Analysis

### desktop-01-home.png
**View:** Desktop  
**What's working:**  
- Real trip data is visible and leg color coding gives orientation.
- The full itinerary is dense but scannable on a large screen.  
**Issues found:**  
1. Desktop app menu has wrapped into multiple rows.
2. City nav is horizontally clipped without a scroll cue.
3. Editing controls and add rows are visually noisy across every leg.

### desktop-02-menu-bar.png
**View:** Desktop  
**What's working:**  
- Filename badge is visible and high contrast.  
**Issues found:**  
1. Only the first row is captured in the top 60px; controls are pushed below by wrapping.
2. Toolbar grouping is not resilient at 1440px.

### desktop-03-header.png
**View:** Desktop  
**What's working:**  
- Hero has strong brand character and readable title.
- Subtitle communicates trip scope.  
**Issues found:**  
1. Header edit affordance is implicit only.
2. Hero consumes vertical space that compounds with wrapped toolbar.

### desktop-04-tabs.png
**View:** Desktop  
**What's working:**  
- Primary tabs are clear and sticky.
- City chips use flags/colors effectively.  
**Issues found:**  
1. City chip rail overflows at desktop width with no fade/scrollbar.
2. Last visible chip is cut off.

### desktop-05-itinerary.png
**View:** Desktop  
**What's working:**  
- Expanded day content is functional and data-rich.
- Transport/accommodation/activity sections are separated.  
**Issues found:**  
1. Too many edit/delete/add affordances are always visible.
2. Activity assignment is drag/drop centric and not discoverable for touch.

### desktop-06-transport.png
**View:** Desktop  
**What's working:**  
- Chronological transport rows show real providers and routes.
- Multi-leg journeys can expand.  
**Issues found:**  
1. Table is dense and action affordances compete with data.
2. Same-city placeholder journeys create repetitive noise.

### desktop-07-budget.png
**View:** Desktop  
**What's working:**  
- Budget KPIs give immediate totals.
- Leg breakdown exists below.  
**Issues found:**  
1. Currency formatting uses raw decimals.
2. Budget table feels utilitarian compared with the rest of the app.

### desktop-08-packing.png
**View:** Desktop  
**What's working:**  
- Packing content is comprehensive.
- Guide panels provide useful context.  
**Issues found:**  
1. No at-a-glance progress summary.
2. Guide content competes with checklist tasks.

### desktop-09-map.png
**View:** Desktop  
**What's working:**  
- Map tab renders a visual route and stats.
- Open in Google Maps actions are present.  
**Issues found:**  
1. Map is a static SVG approximation, not an interactive map.
2. Several real cities are reported as unmapped.

### desktop-10-journey-modal.png
**View:** Desktop  
**What's working:**  
- Journey modal supports multi-segment editing.
- Segment tracker gives useful context.  
**Issues found:**  
1. Modal relies heavily on inline fixed rows.
2. Footer action grouping will not translate to small screens.

### desktop-11-ai-builder.png
**View:** Desktop  
**What's working:**  
- AI Builder purpose is understandable.
- Form fields are simple.  
**Issues found:**  
1. Fields are blank despite real trip data.
2. No explanation that output is a prompt only.

### desktop-12-mobile-menu.png
**View:** Mobile  
**What's working:**  
- Bottom sheet groups actions and uses large buttons.
- Primary mobile-only controls are available.  
**Issues found:**  
1. Export/file actions lack explanatory subtitles.
2. Sheet contains many equally weighted controls.

### mobile-01-home.png
**View:** Mobile  
**What's working:**  
- Trip title remains readable.
- Important controls are reachable.  
**Issues found:**  
1. Top chrome and hero consume too much of the viewport.
2. Accommodation tab is clipped.
3. City nav has no scroll affordance.

### mobile-02-header.png
**View:** Mobile  
**What's working:**  
- Hero typography has personality.
- Subtitle wraps legibly.  
**Issues found:**  
1. Editable title/subtitle can trigger keyboard unexpectedly.
2. Header height pushes itinerary content down.

### mobile-03-tabs.png
**View:** Mobile  
**What's working:**  
- Sticky nav keeps route filters close.  
**Issues found:**  
1. Primary and city navs both hide overflow without cues.
2. City pills are slightly below 44px target.

### mobile-04-menu-open.png
**View:** Mobile  
**What's working:**  
- Action sheet uses large comfortable buttons.
- Close icon is visible.  
**Issues found:**  
1. Close target has no explicit 44px guarantee.
2. Export actions need helper subtitles.

### mobile-05-itinerary.png
**View:** Mobile  
**What's working:**  
- Expanded itinerary card is readable.
- Large controls are easy to tap.  
**Issues found:**  
1. Card is over-scaled; only a small part of the day fits.
2. Drag assignment affordance has no touch implementation.

### mobile-06-transport.png
**View:** Mobile  
**What's working:**  
- Routes and dates are visible.
- Multi-leg routes are distinguishable.  
**Issues found:**  
1. Transport remains table-like and inefficient on mobile.
2. Edit/actions are not visible in the main scan.

### mobile-07-budget.png
**View:** Mobile  
**What's working:**  
- Grand total is prominent.
- Leg cards are separated with color rails.  
**Issues found:**  
1. Raw decimal currency looks broken.
2. KPI grid stacks into very tall blocks.

### mobile-08-journey-modal-top.png
**View:** Mobile  
**What's working:**  
- Modal opens with existing journey data.
- Segment context is clear.  
**Issues found:**  
1. Form and footer clip horizontally.
2. Transport type buttons and date/time inputs overflow.

### mobile-09-journey-modal-bottom.png
**View:** Mobile  
**What's working:**  
- Footer can be reached after scrolling.  
**Issues found:**  
1. Footer buttons remain clipped and crowded.
2. Save action is partially offscreen.

### mobile-10-ai-builder.png
**View:** Mobile  
**What's working:**  
- Fields are large and readable.
- Generate button is prominent.  
**Issues found:**  
1. No real trip data is prefilled.
2. Long placeholders clip horizontally.

### mobile-11-city-nav-overflow.png
**View:** Mobile  
**What's working:**  
- City filters are large and visually clear.  
**Issues found:**  
1. Most city chips are hidden with no fade/arrow.
2. The visible edge cuts through a chip.

---

## Known suspects - explicitly check each one

| Suspect | Location | Check |
|---------|----------|-------|
| App menu bar 14-button overflow | `.app-menu-bar` | Fails. Desktop measured 154px high at 1440px and wraps controls into multiple rows. |
| Journey modal height on mobile | `#journey-modal .modal-content` | Fails. Content is scrollable but horizontal clipping affects fields and footer actions; footer is reachable but not fully usable. |
| "Accommodation" tab truncation | `.app-tab-btn[data-tab="accom"]` | Fails. At 390px the label is visibly cropped to "Accomm" in the tab rail. |
| contenteditable H1 tap-to-edit | `#mainTitle`, `#mainSubtitle` | Risk confirmed in source. Both are contenteditable in edit mode and can focus on mobile tap. |
| Transport type button row | `.transport-type-group` | Fails. Five buttons do not fit cleanly in the 390px modal; row is clipped. |
| From→To date+time inputs | `#journeyDateFrom` + `#journeyTimeFrom` | Fails. Inline date/time pairs overflow horizontally in mobile modal. |
| City nav scroll affordance | `.city-nav-list` | Fails. Scrollbar is hidden; mobile scrollWidth is 1829px with no visible fade/arrow. |
| Modal close button tap target | `.modal-close` | Fails by CSS guarantee. No min-width/min-height is set, so 44x44 is not guaranteed. |
| Drag handle affordance on mobile | Draggable activity cards | Fails functionally. Drag/drop module only handles desktop HTML5 drag events. |
| Map tab placeholder | `#tab-map` | Partial fail. It renders an SVG route, not a real interactive map, and reports unmapped real cities. |
| Mobile menu 4 export buttons | `#mobileMenuSheet` | Fails. Buttons are clear but lack subtitles explaining differences. |
| Budget KPI grid at 390px | `.budget-kpi-grid` | Partial fail. Cards wrap without horizontal overflow, but stack very tall and raw decimals look broken. |

---

## Aesthetic Review

### Design maturity: 6/10

**Strengths:**
- Strong type pairing with Playfair Display and DM Sans gives the app personality.
- Color-coded trip legs make the itinerary memorable and useful.
- Real data density is high; the app is functionally capable.

**Weaknesses:**
- Responsive behavior is inconsistent because many layouts are inline-styled in JS/HTML.
- Mobile uses oversized desktop aesthetics rather than purpose-built compact layouts.
- Scrollable navs hide overflow cues, making content feel clipped.
- Editing controls are too prominent in default browsing.

| Benchmark | What they do better | Takeaway for this app |
|-----------|--------------------|-----------------------|
| Wanderlog | Mobile cards prioritize route, date, and action hierarchy. | Convert dense tables into cards on mobile. |
| TripIt | Itinerary segments are compact and travel-document focused. | Reduce always-visible editing controls. |
| Linear (UI patterns) | Action density is managed with grouped menus and crisp hierarchy. | Group secondary app actions and define shared components. |
| Notion | Editing is powerful but quiet until focus/hover. | Make read mode feel like the default, with editing intentional. |

### Typography assessment
Playfair Display works well for the brand-level trip title and modal headings, but it is overused at mobile scale. DM Sans remains readable, but mobile font sizes are often too large for data-heavy screens.

### Colour + contrast
The navy menu/header palette has strong contrast with white text. Some muted grey labels and disabled controls are low contrast, especially ghost undo/redo pills on mobile.

### Visual hierarchy
The app has strong top-level hierarchy but weak second-level hierarchy. Itinerary edit affordances, add rows, status badges, and content all compete visually.

---

## Mobile tap target audit

| Element | Selector | Estimated size | Min required | Pass/Fail |
|---------|----------|---------------|--------------|-----------|
| Tab buttons | `.app-tab-btn` | ~51px high | 44px | Pass |
| ☰ Menu button | `.mobile-menu-btn` | 71x40 | 44px | Fail height |
| Modal close | `.modal-close` | not guaranteed by CSS | 44px | Fail |
| Action buttons | `.action-btn` | ~40px high | 44px | Fail |
| City nav buttons | `.city-nav-btn` | ~67x42 | 44px | Fail height |
| Expand/collapse | `#expandAll` | large mobile button visually passes, base action style 40px | 44px | Mixed |

---

## Modal usability on mobile

| Modal | Scrollable? | Footer reachable? | Rating |
|-------|-------------|-------------------|--------|
| Journey | Yes | Reachable but clipped | ❌ |
| Add Stay | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |
| Add Leg | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |
| Cities | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |
| AI Builder | Yes | Main action reachable in screenshot | ⚠️ |
| Print Preview | Not present in captured flows | Not tested | ⚠️ |
| Guide | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |

---

## Functional gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Map tab is not a real interactive map | 🔴 High | SVG approximation; Leaflet recommended. |
| Touch assignment for suggested activities | 🔴 High | Drag/drop relies on desktop drag events only. |
| AI Builder does not use current trip context | 🟡 Medium | Blank fields duplicate data entry. |
| Budget formatting is inconsistent | 🟡 Medium | Raw decimal output undermines trust. |
| Mobile transport is table-first | 🔴 High | Needs a card-first mobile layout. |

---

## Files created

| File | Purpose |
|------|---------|
| `TRACKER.md` | Day-to-day progress tracker |
| `items/WI-001.md` ... `items/WI-024.md` | Individual work items |
| `screenshots/before/` | 23 screenshots captured |
| `items/proposals/` | Proposal mockup images and proposal notes for work items |
| `screenshots/after/` | Reserved for actual after screenshots captured after fixes are implemented |

## Recommended order of attack

Work through items in this order for maximum visible improvement fastest:

1. [WI-003] - Journey Modal Clips Horizontally On Mobile - fixes the most severe mobile task failure.
2. [WI-002] - Mobile Top Chrome Consumes Too Much Viewport - immediately improves first impression.
3. [WI-004] - Primary Tab Strip Crops Labels On Mobile - improves navigation confidence.
4. [WI-005] - City Nav Overflow Has No Scroll Affordance - makes hidden trip cities discoverable.
5. [WI-007] - Budget Mobile Numbers Look Like Broken Precision - quick trust improvement.
6. [WI-001] - Desktop App Menu Wraps Into A 154px Header - restores desktop polish.
7. [WI-006] - Mobile Transport Table Is Dense And Loses Actions - largest mobile content win.

## Definition of done for the full sprint

- [ ] All 🔴 Critical items resolved
- [ ] All 🟡 Important items resolved
- [ ] Regression check passing
- [ ] After screenshots taken for all completed items
- [ ] TRACKER.md showing 100% complete
