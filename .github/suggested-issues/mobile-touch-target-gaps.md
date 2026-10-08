---
title: "[Mobile UX]: Several interactive controls fall below 44×44px touch target minimum"
labels: ["jules-suggested", "triage", "mobile", "accessibility"]
estimate: "M"
---

# [Mobile UX]: Several interactive controls fall below 44×44px touch target minimum

## Before
While the existing `@media (max-width: 768px)` block in `mobile-features.css:557-572` does enforce `min-height: 44px` on `.action-btn`, `.modal-close`, `.app-menu-btn`, `.tab-btn`, and `.guide-step-header`, several other frequently-tapped interactive controls are missing from this list:

- **`.add-btn`** (`components.css:381`): `py-1.5` = 12px vertical padding + small font = ~32px total height. Used to add accommodations, transport, activities — high-frequency tap targets.
- **`.pwa-prompt-close-btn`** (`mobile-features.css:844`): padding 0.25rem = ~8px pad, renders ≈28px — too small to dismiss reliably.
- **`.readonly-banner-dismiss-btn`** (`mobile-features.css:168`): explicitly `width: 1.75rem; height: 1.75rem` = 28px — significantly below threshold.
- **`.trip-start-quiet` / `.trip-start-back`** (`mobile-features.css:252`): transparent buttons with no explicit min-height — likely renders below 44px on mobile.
- **`.transport-alert-action-btn`** (`mobile-features.css:634`): `padding: 0.25rem 0.5rem` = tiny target embedded in alert banners.
- **`.city-nav-btn`** (`shell.css:165`): `py-2` = 16px padding + 0.85rem text ≈ 38px total — close but below 44px. City switching is a primary mobile action.

## Evidence
```css
/* mobile-features.css:168-182 */
.readonly-banner-dismiss-btn {
  width: 1.75rem;    /* 28px — well below 44px minimum */
  height: 1.75rem;
  ...
}

/* mobile-features.css:844-854 */
.pwa-prompt-close-btn {
  padding: 0.25rem;  /* ~4px — renders ≈28px total */
}

/* components.css:381-385 */
.add-btn {
  padding: 0.25rem ... 0.1.5rem; /* ~32px total height */
}
```

## Proposed
For each under-sized target:
1. `.readonly-banner-dismiss-btn` → set `min-width: 2.75rem; min-height: 2.75rem` (44px) on mobile.
2. `.pwa-prompt-close-btn` → set `min-width: 2.75rem; min-height: 2.75rem` on mobile.
3. `.add-btn` on mobile → increase `padding-block` to at least `0.625rem` or add explicit `min-height: 2.75rem`.
4. `.trip-start-quiet` / `.trip-start-back` → add `min-height: 2.75rem; display: inline-flex; align-items: center`.
5. `.transport-alert-action-btn` → add `min-height: 2.75rem` on mobile.
6. `.city-nav-btn` → bump `py-2` to `py-2.5` or add `min-height: 2.75rem` to ensure reliable city switching.
7. Extend the existing `@media (max-width: 768px)` touch-target block to cover all the above.

## After
Every interactive tap target on mobile meets Apple HIG / Android Material Design 48dp (44px equivalent CSS) minimum. City switching, dismissing banners, adding items, and back navigation all become reliably tappable without mis-fires on all touch devices.

## Estimate
- Effort estimate: **M**

## Files impacted
- `src/css/mobile-features.css`
- `src/css/components.css`
- `src/css/shell.css`

## Acceptance criteria
- [ ] All interactive tap targets have `min-height: 44px` (2.75rem) on viewports ≤768px
- [ ] `.readonly-banner-dismiss-btn` ≥44px on mobile
- [ ] `.pwa-prompt-close-btn` ≥44px on mobile
- [ ] `.add-btn` ≥44px on mobile
- [ ] `.city-nav-btn` ≥44px on mobile
- [ ] No visual breakage or layout overflow from enlarged targets
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated tests: `npm test`
- Manual: MOBILE (390×844) — tap each corrected target with a fingertip simulator (Chrome DevTools touch mode), confirm no accidental mis-fires on adjacent elements
- Verify in read-only mode that the banner dismiss button is easily tappable
