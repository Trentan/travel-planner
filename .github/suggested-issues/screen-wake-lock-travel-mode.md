---
title: "feat(device): Screen Wake Lock toggle for travel boarding, transit, and security passes"
labels: ["feat", "ux", "area: itinerary", "priority: important", "jules-suggested"]
estimate: "S"
milestone: "Sprint 2: Destination Management & Timeline Intelligence (v1.4.0)"
---

# feat(device): Screen Wake Lock toggle for travel boarding, transit, and security passes

## Before
During critical high-touch travel moments—such as standing in airport security queues, showing digital boarding passes, navigating subway turnstiles, or following step-by-step city directions—the user's device screen frequently dims and locks after 30-60 seconds of inactivity. This forces repeated biometric unlocks with full hands or bags.

## Evidence
- Search for `wakeLock` in the repository yields zero results.
- `navigator.wakeLock.request('screen')` is a widely supported Web API in modern mobile browsers (Chrome, Edge, Safari iOS 16.4+).
- Currently, users must manually alter their OS-level display timeout settings to keep travel schedules visible.

## Proposed
1. Introduce a "Keep Screen Awake" toggle button in the itinerary and transport headers (e.g., `[ 🔆 Screen Awake ]`).
2. When toggled on, invoke `navigator.wakeLock.request('screen')` and store reference to the wake lock sentinel.
3. Automatically release the wake lock and reset the UI state if the user navigates away or switches tabs via `document.addEventListener('visibilitychange')`.
4. Re-acquire the wake lock when returning to the tab if the user had left the toggle active.
5. Provide accessible tooltip explaining that screen timeout is temporarily disabled.

## After
Travelers can keep their itinerary, vouchers, or transport passes continuously visible without screen lock interruptions during busy transit moments, with battery-safe auto-release when backgrounded.

## Estimate
- Effort estimate: S (1-2 hours)

## Files impacted
- `js/ui.js`
- `js/itinerary.js`
- `index.html`

## Acceptance criteria
- [ ] Toggle button appears in itinerary/transport headers on supported devices.
- [ ] Activating toggle requests screen wake lock via `navigator.wakeLock.request('screen')`.
- [ ] Page visibility changes gracefully release the sentinel to prevent battery drain.
- [ ] Unsupported browsers gracefully hide or disable the toggle without errors.

## Verification plan
- Automated tests: Mock `navigator.wakeLock` in unit tests.
- Manual verification: Test on mobile viewport; toggle wake lock on/off; verify sentinel acquisition and release on visibility change.
