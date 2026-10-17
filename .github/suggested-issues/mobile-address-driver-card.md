---
title: "[Audit]: High-Contrast Local Language Driver/Address Card & Travel Mode Quick Action"
labels: ["jules-suggested", "triage", "mobile-ux"]
estimate: "M"
---

# [Audit]: High-Contrast Local Language Driver/Address Card & Travel Mode Quick Action

## Before
When actively traveling (e.g. arriving in a foreign city at night or hailing a taxi), travelers need immediate, friction-free access to their hotel or activity destination in the local language, without navigating deep edit dialogs or small screen text. Small text on stay cards is hard to read for drivers and customs agents.

## Evidence
- `js/stays.js` and `js/itinerary.js`: addresses are rendered in small metadata text (`text-xs text-slate-500`).
- No dedicated quick "Show Taxi Driver / Local Address" full-screen card exists.

## Proposed
1. Add a **"Show Address / Driver Card"** button on Stays and key activities.
2. Tapping it opens a high-contrast, large-typography card (`32px` bold font) displaying the venue name, localized address, and booking reference.
3. Include a 1-tap "Copy" button and direct link to native maps (Google Maps / Apple Maps).

## After
Travelers can hand their phone directly to taxi drivers or hotel staff with high legibility across dark and bright daylight conditions.

## Estimate
- Effort estimate: M

## Files impacted
- `js/stays.js`
- `js/itinerary.js`
- `index.html`

## Acceptance criteria
- [ ] Address card opens in high-contrast large font.
- [ ] One-tap copy address and launch directions.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Mobile display test on 390x844 in both dark and light modes.
