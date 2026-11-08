---
title: "[Audit]: Fix Autopopulated Stay Check-In Date Rolling Back One Day in Western Timezones"
labels: ["bug", "priority: critical", "area: accommodation"]
estimate: "S"
---

# [Audit]: Fix Autopopulated Stay Check-In Date Rolling Back One Day in Western Timezones

## Before
In `js/auto-stays.js:L165-177`, `createStayFromItinerary` parses `startDate` via `new Date(startDate)`. Per the ECMAScript specification, ISO-8601 date strings without time components (e.g. `"2026-06-08"`) parse into UTC midnight (`2026-06-08T00:00:00.000Z`). For users located in time zones behind UTC (e.g. UTC-4 Eastern Time or UTC-7 Pacific Time), `toLocalIsoDate(checkInDate)` retrieves the local date parts, rolling the check-in date backward by one day to `"2026-06-07"`.

## Evidence
In `js/auto-stays.js`:
```javascript
  const checkInDate = new Date(startDate);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + nights);

  return {
    id: stayId,
    cityId: city.id,
    propertyName: '',
    checkIn: typeof toLocalIsoDate === 'function' ? toLocalIsoDate(checkInDate) : checkInDate.toISOString().split('T')[0],
    checkOut: typeof toLocalIsoDate === 'function' ? toLocalIsoDate(checkOutDate) : checkOutDate.toISOString().split('T')[0],
...
```

## Proposed
1. Parse date strings without UTC midnight shift by appending midday time (`new Date(startDate + 'T12:00:00')`) or utilizing `addDaysToIsoDate(startDate, 0)`.
2. Compute `checkOut` date via `addDaysToIsoDate(startDate, nights)`.
3. Add a test in `tests/auto-stays-suite.js` asserting date stability across simulated timezone offsets.

## After
Autopopulated stays maintain the exact calendar date of the itinerary segment regardless of the user's browser time zone.

## Estimate
- Effort estimate: S

## Files impacted
- `js/auto-stays.js`
- `tests/auto-stays-suite.js`

## Acceptance criteria
- [ ] Stays generated from `"2026-06-08"` maintain checkIn `"2026-06-08"` in any time zone.
- [ ] Check-out date matches `checkIn + nights` days precisely.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `node tests/auto-stays-suite.js` and `npm test`.
