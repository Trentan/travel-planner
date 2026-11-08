---
title: "[Audit]: Replace Hardcoded 2026 Year Constants with Dynamic Calendar Year in Date Normalizers"
labels: ["bug", "priority: important", "area: data"]
estimate: "S"
---

# [Audit]: Replace Hardcoded 2026 Year Constants with Dynamic Calendar Year in Date Normalizers

## Before
In `js/data.js:L5207`, `js/itinerary.js:L2134`, and `js/timezone.js:L391`, date normalization functions accept an optional fallback year that is hardcoded to `2026`:
- `function normalizeTripDateValue(dateStr, fallbackYear = 2026)`
- `function normalizeDate(dateStr, year = 2026)`
- `dateStr ? dateStr.trim() : '2026-06-15'`
In 2027 and future years, any date parsed without an explicit year (e.g. from bookings or user input) will be incorrectly assigned to 2026.

## Evidence
In `js/data.js`:
```javascript
function normalizeTripDateValue(dateStr, fallbackYear = 2026) {
  ...
  return `${fallbackYear}-${months[monthKey]}-${day}`;
}
```

## Proposed
1. Default `fallbackYear` to `new Date().getFullYear()` (or derive the active trip's year if available from `appData[0]?.days[0]?.date`).
2. Replace static `'2026-06-15'` in `convertLocalToHomeTime` with a dynamic date representation.

## After
Date normalizers dynamically adapt to current and future calendar years without requiring manual codebase updates every year.

## Estimate
- Effort estimate: S

## Files impacted
- `js/data.js`
- `js/itinerary.js`
- `js/timezone.js`

## Acceptance criteria
- [ ] Short date strings parse using current or contextual year when omitted.
- [ ] Explicit year strings (e.g., "2027-04-10") remain unchanged.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
