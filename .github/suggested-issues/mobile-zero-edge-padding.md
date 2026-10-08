---
title: "[Mobile Layout]: Content panels have near-zero horizontal padding on mobile, causing text to touch screen edge"
labels: ["jules-suggested", "triage", "mobile", "layout"]
estimate: "S"
---

# [Mobile Layout]: Content panels have near-zero horizontal padding on mobile, causing text to touch screen edge

## Before
The `@media (max-width: 768px)` block in `responsive-core.css` aggressively removes horizontal padding for space efficiency, but several overrides go too far — leaving content text within **1–4px of the physical screen edge** on a 390px phone:

```css
/* responsive-core.css:272-282 */
main, .max-w-7xl, .container {
  padding-left: 0.25rem !important;   /* 4px — very close to screen edge */
  padding-right: 0.25rem !important;
}

.app-tabs-content {
  padding-left: 0.15rem !important;   /* 2.4px — almost flush */
  padding-right: 0.15rem !important;
}
```

And deeper overrides:
```css
/* responsive-core.css:443-447 */
.day-detail {
  padding-left: 0.1rem !important;    /* 1.6px — effectively zero */
  padding-right: 0.1rem !important;
}

/* responsive-core.css:249-251 */
.daily-timeline-shell {
  padding-left: 0.1rem !important;    /* 1.6px */
  padding-right: 0.1rem !important;
}
```

On a physical device, `0.1rem` (1.6px at 16px root) means the inner edge of text cards is within 1–2px of the device's physical bezel. This is ergonomically risky as it:
- Makes edge-swipe gestures (back navigation on iOS, system gestures on Android) unreliable — gesture zones typically extend ~16px from the edge
- Creates text that looks "stuck" to the screen edge with no visual breathing room
- Does not account for device manufacturer's software padding/rounded corner safe zones

## Evidence
```css
/* responsive-core.css:248-251 */
.daily-timeline-shell {
  padding-left: 0.1rem !important;  /* = 1.6px */
  padding-right: 0.1rem !important;
}

/* responsive-core.css:239-243 */
.day-planner-shell-timeline .detail-block {
  padding-left: 0 !important;       /* zero edge padding */
  padding-right: 0 !important;
}
```

Additionally, `responsive-core.css:233-237` sets `.day-card { margin-left: 0.1rem; margin-right: 0.1rem }` — effectively zero margin cards on mobile.

## Proposed
Establish a minimum horizontal safe zone for all content on mobile:
- **Minimum content padding**: `0.5rem (8px)` from screen edge for all scrollable content containers.
- **Minimum card margin**: `0.35rem (5.6px)` side margin on all day cards.
- Update the aggressive overrides in `responsive-core.css`:
  ```css
  @media (max-width: 768px) {
    main, .max-w-7xl, .container {
      padding-left: 0.5rem !important;   /* was 0.25rem */
      padding-right: 0.5rem !important;
    }
    .app-tabs-content {
      padding-left: 0.35rem !important;  /* was 0.15rem */
      padding-right: 0.35rem !important;
    }
    .daily-timeline-shell {
      padding-left: 0.35rem !important;  /* was 0.1rem */
      padding-right: 0.35rem !important;
    }
    .day-detail {
      padding-left: 0.35rem !important;  /* was 0.1rem */
      padding-right: 0.35rem !important;
    }
  }
  ```
- The `padding-left: 0 !important` on `.day-planner-shell-timeline .detail-block` should be relaxed to `0.25rem`.

## After
All mobile content has at minimum 5–8px clearance from the physical screen edge on both sides. System gesture zones (iOS swipe-back: 16px; Android edge-swipe: 20px) no longer overlap content. Cards look visually contained rather than flush with the bezel. The layout breathes slightly more, improving readability — a small padding increase has minimal impact on usable width but significant impact on polish.

## Estimate
- Effort estimate: **S**

## Files impacted
- `src/css/responsive-core.css`

## Acceptance criteria
- [ ] No `padding-left/right` or `margin-left/right` value below `0.35rem` (5.6px) on visible content containers on mobile
- [ ] `0.1rem` and `0px` edge values replaced with ≥0.35rem minimum
- [ ] iOS swipe-back gesture works cleanly from screen edge without triggering card interaction
- [ ] No horizontal scroll introduced by increased padding
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated: `npm test`
- Manual: Open app on MOBILE (390×844) — verify a visible gap between day cards and screen edge on both sides
- Manual: Attempt iOS swipe-back gesture from left edge — should navigate back without triggering a card expansion
- Manual: Check that no container overflows horizontally (no horizontal scroll introduced)
- Manual: Compare before/after screenshots on Itinerary tab at MOBILE viewport
