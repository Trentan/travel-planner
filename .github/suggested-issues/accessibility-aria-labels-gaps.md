---
title: "[Accessibility/Forms]: Missing `aria-label` on icon-only buttons, empty labels, and form fields without accessible names"
labels: ["jules-suggested", "triage", "accessibility"]
estimate: "M"
---

# [Accessibility/Forms]: Missing `aria-label` on icon-only buttons, empty labels, and form fields without accessible names

## Before
A scan of `index.html` reveals critical accessibility gaps in button and form labelling:

1. **Empty `<label>` element** on the city name input (`index.html:1203`):
   ```html
   <label for="newCityName"></label>
   <input type="text" id="newCityName" class="form-control city-add-input" autocomplete="off" placeholder="City name...">
   ```
   The label element exists but is **empty** — assistive technologies will announce this as an unlabelled field. Placeholder text is not a substitute for a visible/accessible label.

2. **Icon-only interactive elements** throughout the app likely lack `aria-label`:
   - `.modal-close` buttons (×): no `aria-label="Close"` evident in the HTML scan
   - `.readonly-banner-dismiss-btn` (×): no `aria-label`
   - `.day-chevron` expand/collapse indicators: not verified to have accessible names
   - `.app-menu-btn` icon buttons in the top bar

3. **Decorative icons** used inside buttons are not hidden from screen readers with `aria-hidden="true"`. Emoji and icon characters read aloud as their Unicode name by screen readers (e.g., "✈ airplane" instead of just "Flight").

4. **`aria-live` region for async updates**: Toast/notification messages (save status, offline banner) do not appear to use `aria-live="polite"` regions, so screen reader users won't be informed of async state changes.

## Evidence
```html
<!-- index.html:1203 — empty label -->
<label for="newCityName"></label>
<input type="text" id="newCityName" ... placeholder="City name (e.g., Bangkok...)">

<!-- index.html:30 — one aria-hidden found, but only for overlay -->
<div class="mobile-status-bar-overlay" aria-hidden="true"></div>
```

Only 1 `aria-hidden` attribute found in the entire HTML file — decorative emoji/icons in buttons are almost certainly not hidden.

## Proposed
1. **Fix empty label**: Either populate it (`<label for="newCityName">City name</label>`) or use `aria-label` on the input directly. Consider visually hiding the label with `.sr-only` if space is a constraint.
2. **Add `aria-label` to all icon-only buttons**: Modal close buttons, dismiss buttons, chevrons. E.g., `<button class="modal-close" aria-label="Close dialog">×</button>`.
3. **Add `aria-hidden="true"` to decorative emoji** inside labelled buttons, so screen readers read the button label, not the emoji name.
4. **Add `aria-live="polite"` to toast/status regions** — especially the save status indicator and offline banner.
5. **Audit `<button>` vs `<div onClick>`**: Verify all interactive elements in the dynamically-rendered JS output are proper `<button>` or `<a>` elements, not clickable `<div>`s (check the JS rendering layer in `js/`).

## After
Screen reader users (VoiceOver, TalkBack, NVDA) can navigate the full application without encountering unlabelled controls or confusing emoji narration. Save/offline status changes are announced. The app meets WCAG 2.4.6 Headings and Labels (AA) and 4.1.2 Name, Role, Value (AA).

## Estimate
- Effort estimate: **M**

## Files impacted
- `index.html`
- `js/` (dynamically rendered buttons)
- `src/css/components.css` (`.sr-only` utility if not present)

## Acceptance criteria
- [ ] All `<label>` elements have visible text content or `aria-labelledby` pointing to labelled content
- [ ] All icon-only buttons have `aria-label` or `aria-labelledby`
- [ ] Decorative emoji/icons inside buttons have `aria-hidden="true"`
- [ ] Save status and offline banner have `role="status"` or `aria-live="polite"`
- [ ] No `<div onClick>` interactive elements (all use `<button>` or `<a>`)
- [ ] VoiceOver (iOS) manual test: navigate to Add City section — field announced with a meaningful label
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated: `npm test`; also run `npx axe-cli http://localhost:3000` if axe-core is available
- Manual: Enable VoiceOver (iOS Simulator) or NVDA — navigate to Add City input, verify label is announced
- Manual: Tab to all modal close (×) buttons — verify "Close dialog" or similar announced
- Manual: Toggle offline mode — verify offline banner announcement by screen reader
