---
title: "[Performance/Animation]: Pervasive use of `transition: all` causes paint/composite bottlenecks"
labels: ["jules-suggested", "triage", "performance", "animation"]
estimate: "M"
---

# [Performance/Animation]: Pervasive use of `transition: all` causes paint/composite bottlenecks

## Before
`transition: all` is used in **25+ locations** across the CSS codebase. Per the Web Interface Guidelines and browser compositing best practices, `transition: all` forces the browser to watch every animatable CSS property for changes — including layout-triggering properties like `width`, `height`, `padding`, `border-width` — which can cause janky, non-composited animations on lower-end mobile hardware.

Key offenders:
- `mobile-features.css:260` — `.trip-start-chip { transition: all .15s ease }` — runs on every chip interaction
- `mobile-features.css:271` — `.trip-path-card { transition: all 0.2s cubic-bezier... }` — large card with many sub-elements
- `mobile-features.css:297` — `.trip-flight-extract-btn { transition: all 0.15s ease }`
- `mobile-features.css:350,362,435,450,645,921` — multiple more `transition: all`
- `components.css:1322,2333,3634` — core component transitions
- `responsive-core.css:127` — tab button: `transition: all 0.15s ease-in-out !important`
- `split-pane.css:39,226,318,385` — split pane handles and panels
- `trip-library.css:22,138,216,703,938,963,1093` — library cards

Additionally, **no `@media (prefers-reduced-motion: reduce)` query exists** in any CSS file, violating WCAG 2.3.3 Animation from Interactions (AAA) and the Web Interface Guidelines animation rules.

## Evidence
```css
/* responsive-core.css:127 — applied to every tab button tap */
transition: all 0.15s ease-in-out !important;

/* mobile-features.css:271 — trip path selection card */
transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

/* trip-library.css:22 — library cards */
transition: all 0.2s ease;
```
No `prefers-reduced-motion` block found in any `src/css/*.css` file.

## Proposed
1. Replace all `transition: all` with explicit property lists — use only compositor-safe properties: `transform`, `opacity`, `color`, `background-color`, `border-color`, `box-shadow`.
   - e.g. `transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease`
2. Add a global `@media (prefers-reduced-motion: reduce)` block (ideally in `theme-tokens.css` or `shell.css`) that disables or shortens all transition/animation durations:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
3. Audit `@keyframes bannerSlideDown`, `pwaSlideUp`, tab fade-in animations — wrap in `prefers-reduced-motion` check.

## After
Animations will be handled only by the GPU compositor (transform + opacity), eliminating layout/paint thrashing on mobile devices. Users who prefer reduced motion will have all animations effectively disabled, meeting WCAG and HIG guidelines.

## Estimate
- Effort estimate: **M**

## Files impacted
- `src/css/mobile-features.css`
- `src/css/components.css`
- `src/css/responsive-core.css`
- `src/css/split-pane.css`
- `src/css/trip-library.css`
- `src/css/shell.css`
- `src/css/theme-tokens.css`

## Acceptance criteria
- [ ] Zero instances of `transition: all` remain in any CSS file
- [ ] All transitions use explicit property lists with only compositor-safe properties
- [ ] `@media (prefers-reduced-motion: reduce)` block present and effective
- [ ] `@keyframes` animations respect reduced motion
- [ ] No visual regression on desktop or mobile
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated tests: `npm test`
- Manual: Enable "Emulate CSS prefers-reduced-motion" in Chrome DevTools → verify all animations/transitions stop
- Performance: Run DevTools Performance trace on MOBILE (390×844) before/after — confirm no layout/paint during card hover/tap transitions
