---
title: "[Mobile UX]: 7-column bottom navigation is too cramped on narrow phones — tabs overflow or truncate"
labels: ["jules-suggested", "triage", "mobile", "navigation"]
estimate: "L"
---

# [Mobile UX]: 7-column bottom navigation is too cramped on narrow phones — tabs overflow or truncate

## Before
The mobile bottom navigation bar renders all tabs as a fixed 7-column grid:

```css
/* responsive-core.css:99 */
.app-tabs-list {
  grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
}
```

On a 390px-wide viewport, each column is **390 / 7 ≈ 55.7px wide**. Each tab icon is 1.15rem (≈18px) and labels are forced to 10px with `text-overflow: ellipsis`. With 7 tabs, this produces:
- Labels truncated to 3–4 characters on most tabs (e.g., "Itin…", "Budg…", "Pack…")
- No visual breathing room between tabs
- The "More" overflow button (`.mobile-tabs-menu-btn`) is the 7th item, competing with actual navigation tabs for space

On devices narrower than 375px (iPhone SE, small Android phones), the situation is even worse.

The tab labels at `10px` are already below the WCAG minimum — but even raising them would worsen truncation with 7 columns.

## Evidence
```css
/* responsive-core.css:97-107 */
.app-tabs-list {
  display: grid !important;
  grid-template-columns: repeat(7, minmax(0, 1fr)) !important; /* 7 equally-sized columns */
  ...
}

/* responsive-core.css:138 */
font-size: 10px !important;   /* tab label — below minimum */

/* responsive-core.css:141-145 */
.app-tab-btn .tab-label {
  ...
  text-overflow: ellipsis;    /* labels routinely truncate */
  white-space: nowrap;
}
```

The app has at least 7 distinct tabs (Itinerary, Transport, Budget, Packing, Map, Guide, + overflow), meaning all primary content tabs are always competing for space.

## Proposed
Several approaches, in order of preference:

**Option A (Recommended): Primary tabs + overflow menu pattern**
- Show only the 4–5 most-used tabs in the bottom nav by default (Itinerary, Transport, Budget, Map, + More)
- The "More" button opens a full-screen or sheet menu with remaining tabs
- This is the iOS/Android native pattern used by Maps, YouTube, etc.

**Option B: Scrollable bottom nav**
- Make the tab list horizontally scrollable with `overflow-x: auto; scroll-snap-type: x mandatory`
- Show only ~4 tabs at a time with scroll indicator dots
- Pro: all tabs accessible; Con: discoverability lower

**Option C: Two-row bottom nav on very narrow screens**
- Below 375px: arrange tabs in 2 rows of 4
- Pro: all visible; Con: takes more vertical space

Regardless of approach:
- Raise tab label font from `10px` to minimum `11px` or `0.6875rem`
- Consider icon-only tabs (no labels) with haptic feedback / tooltip on long-press for very narrow screens

## After
The bottom navigation is comfortably usable on all mobile devices including iPhone SE (375px) and standard Android phones (390px+). No tab labels are truncated. Touch targets remain ≥44px. Navigation is discoverable and ergonomic.

## Estimate
- Effort estimate: **L**

## Files impacted
- `src/css/responsive-core.css`
- `index.html` (tab structure)
- `js/` (any tab switching JS logic)

## Acceptance criteria
- [ ] No more than 5 tab items visible at once in the bottom nav bar on ≤390px viewport
- [ ] Tab labels never truncated (ellipsis) at the default viewport
- [ ] Tab label font-size ≥11px on mobile
- [ ] All app sections remain accessible (either directly or via overflow/More menu)
- [ ] Touch targets remain ≥44px height
- [ ] Regression tests pass (`npm test`)
- [ ] Tested on MOBILE (390×844) and on 375×667 (iPhone SE size)

## Verification plan
- Automated: `npm test`
- Manual: Open app on MOBILE (390×844) — count visible tabs, check for label truncation
- Manual: Resize to 375px width — verify same or better result
- Manual: Access all 7 app sections via the navigation to confirm discoverability
