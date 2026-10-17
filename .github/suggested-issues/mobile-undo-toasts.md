---
title: "[Audit]: Replace Blocking Confirmation Dialogs with Mobile Undo Toasts"
labels: ["jules-suggested", "triage", "mobile-ux"]
estimate: "S"
---

# [Audit]: Replace Blocking Confirmation Dialogs with Mobile Undo Toasts

## Before
Deleting activities, legs, or checklist items uses synchronous or modal `confirm()` dialogs. On mobile touchscreens, modal confirmation dialogs require awkward reach to confirm/cancel buttons and disrupt flow. Accidental mis-clicks on tiny "Delete" icons also punish users immediately.

## Evidence
- `js/crud.js` and `js/itinerary.js`: direct confirm prompts interrupt mobile editing workflows.

## Proposed
1. Implement a non-blocking "Soft Delete + Undo Toast" pattern.
2. When deleting an item, immediately animate out the item with a smooth collapse transition.
3. Show a floating bottom toast notification above the safe area: `"Activity deleted"  [ UNDO ]` for 5 seconds.
4. If the user taps UNDO, restore the item to its exact position; if 5 seconds elapse without undo, finalize the deletion.

## After
Mobile interactions feel fluid, responsive, and forgiving, matching modern native iOS and Android design patterns.

## Estimate
- Effort estimate: S

## Files impacted
- `js/ui.js`
- `js/crud.js`
- `js/itinerary.js`
- `index.html`

## Acceptance criteria
- [ ] Deleting an activity shows an immediate Undo toast without a blocking popup.
- [ ] Tapping Undo restores the activity and its timeline slot.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Mobile viewport manual delete/undo test.
