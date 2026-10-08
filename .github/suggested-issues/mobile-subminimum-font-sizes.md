---
title: "[Mobile UX]: Sub-minimum font sizes degrade readability on mobile viewports"
labels: ["jules-suggested", "triage", "mobile", "accessibility"]
estimate: "M"
---

# [Mobile UX]: Sub-minimum font sizes degrade readability on mobile viewports

## Before
Numerous CSS rules set `font-size` values below the WCAG-recommended minimum of ~11px (≈0.75rem) for body copy, and below 10px for supporting metadata — many of these applied specifically inside `@media (max-width: 768px)` blocks, meaning they are **worst on the smallest screens**.

Notable offenders:
- `responsive-core.css:138` — `.tab-label` font-size: **10px** (bottom nav tab labels on mobile)
- `responsive-core.css:307` — `.day-name` font-size: **0.65rem** (≈10.4px — weekday label in day cards)
- `responsive-core.css:320` — `.day-desc` font-size: **0.72rem** (≈11.5px)
- `responsive-core.css:326` — `.day-chevron` font-size: **0.7rem**
- `responsive-core.css:363` — `.detail-block h4` font-size: **0.7rem**
- `responsive-core.css:437` — `.add-btn` font-size: **0.72rem**
- `components.css:344` — `.city-live-search-badge-source` font-size: **0.65rem** (≈10.4px)
- `components.css:1563` — some badge/metadata element: **0.68rem**
- `mobile-features.css:12` — `.status-badge` font-size: **0.68rem** (≈10.9px — always visible)

On a 390×844 mobile viewport, content rendered at 10–11px is extremely difficult to read, particularly in low-light or for users with slight visual impairment.

## Evidence
```css
/* responsive-core.css:138 */
font-size: 10px !important;           /* .tab-label — MOBILE ONLY */

/* responsive-core.css:307 */
font-size: 0.65rem !important;        /* .day-name — weekday label */

/* mobile-features.css:12 */
font-size: 0.68rem !important;        /* .status-badge */

/* components.css:344 */
font-size: 0.65rem;                   /* .city-live-search-badge-source */
```

## Proposed
1. Raise the minimum mobile `font-size` floor to **0.75rem (12px)** across all visible text.
2. Replace `10px` tab label with **11px** minimum or **0.6875rem**; use tighter letter-spacing / truncation instead of shrinking text further.
3. For `.day-name`, `.day-desc`, `.detail-block h4`, use ≥0.75rem on mobile.
4. Status badges and search result meta text: raise from 0.65–0.68rem to **0.75rem** minimum, adjusting padding to compensate.
5. Where labels must be compact (bottom nav), consider icon-only on very narrow screens with tooltip on long-press instead of shrinking text below 11px.

## After
All visible text on mobile (390×844) will meet the 12px minimum size, improving legibility for all users and meeting WCAG 1.4.4 Resize Text and general mobile readability best practices. The bottom nav labels, day-card weekday labels, and badge metadata become comfortably readable without zooming.

## Estimate
- Effort estimate: **M**

## Files impacted
- `src/css/responsive-core.css`
- `src/css/mobile-features.css`
- `src/css/components.css`

## Acceptance criteria
- [ ] No `font-size` value below 0.75rem (12px) is applied on viewports ≤768px for visible user-facing text
- [ ] Bottom nav tab labels (`10px`) raised to ≥11px minimum
- [ ] `.day-name`, `.day-desc`, `.detail-block h4`, `.status-badge` all ≥0.75rem on mobile
- [ ] Visual regression check: no layout overflow from larger text
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated tests: `npm test`
- Manual: load app at MOBILE (390×844), view Itinerary tab — check day-card weekday labels, detail block headers, and tab-nav labels
- Check status badges in all states (confirmed, pending, etc.) remain readable
- Zoom browser to 200% and verify no overflow
