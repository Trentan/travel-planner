---
title: "[Audit]: Contextual Date & Time Picker Friction in Mobile Itinerary"
labels: ["jules-suggested", "triage", "mobile-ux"]
estimate: "M"
---

# [Audit]: Contextual Date & Time Picker Friction in Mobile Itinerary

## Before
When a user adds an activity (`+ Add Activity`) or transit leg while viewing an upcoming trip month (e.g. October), empty native `<input type="date">` inputs default to today's date (e.g. March), forcing the user to repeatedly swipe months for every activity. Additionally, native `<input type="time">` enforces device locale (forcing 12-hr AM/PM roller conversions for 24-hr European transit schedules), and common activity times must be entered manually from scratch.

## Evidence
- `js/activity-modal.js`: `openActivityModal()` does not consistently infer default date from the active/selected day header in the itinerary.
- Users report cognitive conversion errors with 12/24-hour schedules and fatigue entering sequential activities.

## Proposed
1. Pre-populate `date` in activity/leg modals from the active city arrival date or currently viewed day timeline.
2. In the activity modal, suggest contextual quick-tap time chips: `[ Morning 09:00 ]`, `[ Lunch 12:30 ]`, `[ Afternoon 15:00 ]`, `[ Evening 19:30 ]`, `[ Unscheduled ]`.
3. Provide a `+2 hrs from prior activity` smart default button when adding consecutive items.

## After
Adding activities to a day's schedule requires 1 tap instead of multiple month/hour picker scrolls.

## Estimate
- Effort estimate: M

## Files impacted
- `js/activity-modal.js`
- `js/itinerary.js`
- `index.html`

## Acceptance criteria
- [ ] Opening `+ Add Activity` on Day N pre-fills Day N's date.
- [ ] Quick-tap time chips allow 1-tap time selection.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Interactive mobile verification adding activities to mid-trip days.
