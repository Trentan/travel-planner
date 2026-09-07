---
title: "feat(export): Distraction-free printable itinerary stylesheet for A4 and Letter paper"
labels: ["feat", "area: desktop", "ux", "priority: polish", "jules-suggested"]
estimate: "S"
milestone: "Sprint 6: Desktop Split-Pane & Print Productivity (v2.1.0)"
---

# feat(export): Distraction-free printable itinerary stylesheet for A4 and Letter paper

## Before
When users attempt to print their itinerary from the browser (`Ctrl+P` / `Cmd+P` or via Print export) for physical backup copies, the output is cluttered with application UI chrome: floating action bars, tab navigation buttons, dark mode background fills, edit icons, modals, and irregular page breaks that sever days and activity cards across page boundaries.

## Evidence
- Search for `@media print` in the stylesheet and HTML files yields zero results.
- Attempting to print the page in Chrome renders background colors, unprintable SVG controls, and leaves awkward blank spaces.
- Many international travelers require physical paper printouts for immigration border checks, offline backups, or emergency battery depletion scenarios.

## Proposed
1. Add a dedicated `@media print` stylesheet block in `style.css` / Tailwind compilation.
2. Hide all non-printable UI controls:
   - Navigation tabs, bottom bar, action menus, edit/delete buttons, modal overlays, file sync pills.
3. Optimize print layout typography:
   - Force pure black text on white backgrounds (`color: #000; background: #fff !important`).
   - Clean tabular display for daily schedules with time, activity title, location, and confirmation/ticket notes.
   - Enforce page breaks between major legs (`page-break-before: always; break-before: page`).
   - Prevent cards from splitting awkwardly across pages (`page-break-inside: avoid; break-inside: avoid`).
4. Include a clean trip summary header on page 1 with trip dates, emergency contacts, and accommodation list.

## After
Users can generate crisp, professional, printer-friendly paper itineraries or PDFs formatted perfectly for standard A4 and US Letter sheets.

## Estimate
- Effort estimate: S (1-2 hours)

## Files impacted
- `dist/tailwind.css`
- `index.html`
- `js/ui.js`

## Acceptance criteria
- [ ] Dedicated `@media print` rules hide interactive chrome, modals, buttons, and navigation elements.
- [ ] Days and activities are styled with high-contrast monochrome readability.
- [ ] Major trip legs have clean page breaks; individual day cards avoid mid-card page splits.
- [ ] Browser print preview (`Ctrl+P`) renders formatted A4/Letter pages cleanly.

## Verification plan
- Automated tests: Verify `@media print` CSS selectors exist in stylesheet build.
- Manual verification: Open print preview in desktop Chrome & Safari; verify clean A4 output without clipped text or app buttons.
