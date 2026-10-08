---
title: "[Mobile UX]: Trip start wizard and onboarding panel have poor mobile layout and over-dense text"
labels: ["jules-suggested", "triage", "mobile", "onboarding"]
estimate: "M"
---

# [Mobile UX]: Trip start wizard and onboarding panel have poor mobile layout and over-dense text

## Before
The trip start wizard (`.trip-start-panel`) and dual-path trip builder (`.trip-path-grid`) have several mobile-specific layout issues:

1. **Wizard panel max-height vs. keyboard overlap**: The panel uses `max-height: min(48rem, calc(100dvh - 2.5rem))`. On mobile (844px device height), when the virtual keyboard opens during city name entry (Step 3 of wizard), the keyboard covers ~40% of the screen. The panel will be clipped to ~52rem, and focused inputs may be hidden behind the keyboard despite `overflow-y: auto` — the panel doesn't account for `env(keyboard-inset-height)` or `visual-viewport` resize.

2. **Wizard stop-row grid too tight on mobile**: `.trip-start-stop-row` uses `grid-template-columns: minmax(0, 1fr) 3.3rem 5.2rem 2rem` — the night-count (3.3rem) and transport select (5.2rem) inputs are barely tappable on a 390px viewport, especially after subtracting padding. The delete button (2rem = 32px) is below the 44px touch target minimum.

3. **Trip path cards on narrow mobile** (`mobile-features.css:268`): The fallback is `grid-template-columns: 1fr` at 640px but the switch point is too late — on 390px, the cards stack but each card has `padding: 1.25rem` with dense feature lists at `0.8rem` font-size, making the cards hard to scan quickly.

4. **`.trip-start-panel h2` serif heading**: `font-size: clamp(1.8rem, 7vw, 2.6rem)` — at 390px viewport, `7vw = 27.3px (≈1.7rem)`, which falls below the clamp minimum of `1.8rem`. The clamp is correctly floored, but the heading still takes 2+ lines on a narrow viewport, consuming precious vertical space above the fold.

5. **`.trip-start-choice-icon`** width: 2.25rem = 36px — below 44px touch target if the icon is the primary tap affordance. The entire `.trip-start-choice` row is tappable (good), but icon contrast in dark mode (`.dark .trip-start-panel`) should be verified.

## Evidence
```css
/* mobile-features.css:241 */
.trip-start-panel {
  max-height: min(48rem, calc(100dvh - 2.5rem)); /* no keyboard-inset accounting */
  ...
}

/* mobile-features.css:258 */
.trip-start-stop-row {
  grid-template-columns: minmax(0, 1fr) 3.3rem 5.2rem 2rem; /* delete = 32px */
}

/* mobile-features.css:268 */
@media (max-width: 640px) {
  .trip-path-grid { grid-template-columns: 1fr; }
  /* Breakpoint too late — should be ≤480px for better UX */
}
```

## Proposed
1. **Keyboard inset handling**: Listen for `visualViewport.resize` event and update the panel's max-height dynamically, or use `height: env(keyboard-inset-height, 0px)` to push the panel above the keyboard.
2. **Wizard stop row**: Increase `.trip-start-stop-row` delete button to `min-width: 2.75rem; min-height: 2.75rem`. Consider collapsing the nights + transport inputs into a tap-to-edit inline field on mobile.
3. **Path cards**: Lower the single-column breakpoint to `480px`. On very small screens (375px), reduce card padding to `0.85rem` and feature list font-size to `0.82rem` (minimum).
4. **Wizard heading**: Consider reducing to `1.5rem` on ≤390px to free up vertical space.
5. **Dark mode icon contrast**: Verify `.trip-start-choice-icon` background (`#d8ebe4`) and text (`#0d625b`) in dark mode has sufficient contrast ratio.

## After
The trip start wizard works cleanly even when the virtual keyboard is open on mobile. Stop rows are comfortably tappable. Path selection cards are easy to read and tap on 375–390px phones. First-run onboarding is frictionless on mobile, which is critical for user acquisition.

## Estimate
- Effort estimate: **M**

## Files impacted
- `src/css/mobile-features.css`
- `js/` (onboarding wizard JS — visualViewport listener)
- `index.html` (if structural changes to stop-row)

## Acceptance criteria
- [ ] Opening the keyboard while on wizard city-entry step does not hide the focused input on MOBILE (390×844)
- [ ] Delete button in stop-row has min-height/width 44px on mobile
- [ ] Trip path cards stack at ≤480px viewport, not just ≤640px
- [ ] No text below 0.8rem in the wizard panels on mobile
- [ ] Dark mode wizard panel passes WCAG AA contrast for all text
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated: `npm test`
- Manual: Open new trip wizard on MOBILE (390×844), reach the "List your stops" step, tap the city name input — keyboard must not cover the input
- Manual: Attempt to tap the delete (×) row button — should activate reliably
- Manual: Resize to 375px — verify path cards stack cleanly with readable text
- Manual: Toggle dark mode, verify icon and text contrast in wizard
