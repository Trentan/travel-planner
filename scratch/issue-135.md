# Issue 135: Autonomous Leg Days Synchronization

**Before**: The system required manual updates to leg day cards whenever a journey or stay was changed.
**Before screenshot**: Not UI-specific (logic/modal update).
**Evidence**: The user requested a "big BUTTON" in the Edit Legs dialog to "recalc based off journeys to UPDATE all the day cards for cities and dates etc".

**Proposed**: Add a `syncAllLegDays` function and a prominent button in the "Edit Legs" dialog to automatically recalculate and regenerate days based on `journeys` and `stays` data, while preserving manual notes.
**Proposed screenshot / mockup**: Not UI-specific.

**After**: Clicking "Auto-Sync Days from Journeys" in the Edit Legs dialog triggers a sync that evaluates all legs, checks stays and journeys, and updates day cards accurately, preserving any notes previously written by the user.

**Estimate**: Quick Win (<1 hr)
**Files impacted**: `index.html`, `js/crud.js`
**Tags**: `enhancement`, `area: itinerary`, `priority: important`

**Acceptance criteria**:
- Button exists in Edit Legs modal.
- Clicking the button runs logic that recalculates all days accurately.
- `appData` saves correctly.

**Verification plan**:
- Run `npm test` to verify no regressions in existing logic.
- Verify UI rendering in browser.

## Completion
- **Estimate**: Held.
- **Files changed**: `index.html`, `js/crud.js`
- **Labels**: `enhancement`, `area: itinerary`, `priority: important`
- **Verification**: `npm test` successfully passed.
- **Remaining notes**: None.
