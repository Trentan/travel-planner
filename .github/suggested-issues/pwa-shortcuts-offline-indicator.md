---
title: "feat(pwa): Add Web App Manifest quick shortcuts and persistent offline status banner"
labels: ["feat", "area: mobile", "ux", "priority: polish", "jules-suggested"]
estimate: "S"
milestone: "Sprint 1: Mobile UI Polish & Fast Ergonomic Wins (v1.3.0)"
---

# feat(pwa): Add Web App Manifest quick shortcuts and persistent offline status banner

## Before
`manifest.json` configures icons and standalone display mode, but lacks standard PWA `shortcuts` for rapid launcher access (e.g., long-pressing the home screen icon on Android or iOS gives no quick actions such as "Today's Schedule" or "Add Booking"). Furthermore, when internet connectivity drops, there is no global, subtle offline status indicator informing the traveler that the application is operating purely from local cache.

## Evidence
- In `manifest.json`, the configuration ends after `icons`:
  ```json
  "orientation": "any",
  "icons": [...]
  ```
- Missing `shortcuts: [...]` block in `manifest.json`.
- There is no listener for `window.addEventListener('offline')` / `online` providing an ambient connection status banner across the app shell.

## Proposed
1. Add `shortcuts` to `manifest.json` pointing to:
   - "Today's Itinerary" (`/?shortcut=today#itinerary`)
   - "Transport Passes" (`/?shortcut=transport#transport`)
2. Handle `?shortcut=today` in app boot to auto-focus today's itinerary day slide.
3. Add an ambient, subtle connection pill / banner that smoothly slides in when the device goes offline (`window.addEventListener('offline')`), confirming: `"Offline mode active • Changes saved locally"`.

## After
Travelers can launch directly into their daily itinerary from their device home screen, and receive clear ambient feedback that the app remains fully functional while offline.

## Estimate
- Effort estimate: S (1-2 hours)

## Files impacted
- `manifest.json`
- `index.html`
- `js/ui.js`
- `js/tabs.js`

## Acceptance criteria
- [ ] `manifest.json` contains valid PWA `shortcuts` with icons and target URLs.
- [ ] Launching via shortcut deep-links into the designated tab/day.
- [ ] An ambient offline banner alerts the user when disconnected and dismisses when online.
- [ ] PWA installation validation passes in Chrome DevTools / Lighthouse.

## Verification plan
- Automated tests: Validate JSON structure of `manifest.json`.
- Manual verification: Inspect manifest in Chrome DevTools Application tab; simulate offline mode in Network tab and observe ambient indicator banner.
