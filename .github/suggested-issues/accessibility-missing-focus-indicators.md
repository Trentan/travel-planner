---
title: "[Accessibility]: Missing `outline-none` focus replacement on interactive elements causes keyboard inaccessibility"
labels: ["jules-suggested", "triage", "accessibility", "keyboard"]
estimate: "M"
---

# [Accessibility]: Missing `outline-none` focus replacement on interactive elements causes keyboard inaccessibility

## Before
Multiple interactive elements use `outline: none` or `@apply outline-none` without providing a visible focus replacement. Per WCAG 2.4.7 (Focus Visible, AA), all interactive elements must show a visible focus indicator when navigated via keyboard.

Found violations:
- `components.css:119` — `.form-control:focus { @apply border-border-strong outline-none... }` — only a border color change, no ring; in dark mode the `border-accent-teal` ring is added, but light mode has none.
- `components.css:1251` — some component: `@apply border-cyan-300 bg-cyan-100 text-cyan-900 outline-none` — no replacement focus style visible.
- `mobile-features.css:248` — `.trip-start-choice:hover, .trip-start-choice:focus-visible { ... outline: none; }` — the choice cards used in the onboarding wizard have focus-visible suppressed.
- `mobile-features.css:272` — `.trip-path-card:hover, .trip-path-card:focus-visible { ... outline: none; }` — the "Explorer" vs "Flight-Import" path cards suppress outline but only show a border change.
- `shell.css:594` — `header .header-text h1 { @apply ... outline-none }` — the trip name heading is contenteditable; focus outline suppressed.
- `shell.css:599` — `header .header-text p { @apply ... outline-none }` — same for trip description paragraph (also contenteditable).

## Evidence
```css
/* components.css:119 */
.form-control:focus {
  @apply border-border-strong outline-none dark:border-accent-teal;
  box-shadow: 0 0 0 3px color-mix(...); /* ring present but only in dark mode? */
}

/* mobile-features.css:248 */
.trip-start-choice:hover, .trip-start-choice:focus-visible {
  transform: translateY(-2px);
  border-color: #168277;
  box-shadow: 0 .6rem 1.3rem rgba(22,117,107,.13);
  outline: none;  /* ← suppressed, no ring added */
}

/* shell.css:594 */
.header-text h1 {
  @apply font-serif font-bold mb-2 outline-none text-white;
  /* contenteditable h1 — no focus indicator */
}
```

## Proposed
1. **`.form-control:focus`**: Verify `box-shadow: 0 0 0 3px ...` renders in light mode too (confirm it's not dark-mode-only). If missing in light mode, add `focus:ring-2 focus:ring-teal-500/30` equivalent.
2. **`.trip-start-choice:focus-visible`**: Replace `outline: none` with `outline: 2px solid #168277; outline-offset: 2px` or `box-shadow: 0 0 0 3px rgba(22,117,107,0.35)`.
3. **`.trip-path-card:focus-visible`**: Same — add a visible ring while keeping the border color change.
4. **`h1`, `p` in `.header-text`**: Add `:focus-visible { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 2px; border-radius: 4px; }` — applies only to keyboard navigation, not mouse clicks (via `:focus-visible`).
5. **All `outline-none` usages**: audit to ensure every removal is paired with an equivalent `focus-visible:ring-*` or custom `box-shadow` replacement.

## After
All interactive elements (forms, cards, content-editable headings) show a clear, visible focus ring when keyboard-navigated. The app becomes fully keyboard-accessible, meeting WCAG 2.4.7 (AA).

## Estimate
- Effort estimate: **M**

## Files impacted
- `src/css/components.css`
- `src/css/mobile-features.css`
- `src/css/shell.css`

## Acceptance criteria
- [ ] No `outline-none` / `outline: none` without a paired focus replacement visible to keyboard users
- [ ] All focus states use `:focus-visible` (not `:focus`) to avoid focus rings on mouse clicks
- [ ] Trip start wizard choice cards show visible focus ring when tabbed to
- [ ] Contenteditable trip name/description shows visible focus ring on keyboard navigation
- [ ] All form controls show consistent ring in both light and dark mode
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated tests: `npm test`
- Manual: Tab through all interactive elements on DESKTOP (1440×900) — every control must show a visible focus indicator
- Manual: Check onboarding wizard — tab through choice cards
- Manual: Tab to trip name heading (h1), verify focus ring visible
