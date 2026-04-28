# VERIFIED.md

Confirmed completed items. Append-only archive — do not edit existing entries.

---

### Item 1: Layout Issue ✅
**Completed:** 2026-04-25 — branch `item-1b-sync-fixes` merged

- Three-column layout: Tips, Food Quests, Suggested Activities
- Collapsible action button bug fixed; tab synchronization working

---

### Item 2: Resolve Journey/Transport Integration ✅
**Completed:** 2026-04-26

- Transport tab reverted to table format with correct columns
- Journeys import from JSON, saved to localStorage and loaded in initData
- Journeys have fromCityId/toCityId linking to defined cities
- Journey/transport refactored with journeyName and journeyId
- Add journey dialog fixed

---

### Item 3: Multi-leg Journey Object & Table Redesign ✅
**Completed:** 2026-04-26

- Journey object extended: `legs[]`, `isMultiLeg`, `journeyName`, `journeyId`
- `saveJourneyFromModal()` — multiple segments before saving
- `buildTransportTab()` — rows grouped by journeyId with expand toggle
- `getDayJourneys()` — matches multi-leg journeys by departureDate
- Itinerary transport block displays `journeyName` and full route chain
- `getSortedJourneys()` — sorts by first segment's departureDate/Time
- `openAddJourneyModal()` — pre-populates journeyId for segments

---

### Item 4: Style.css Issues ✅
**Completed:** 2026-04-27 — branch `item-4a`

- style.css errors fixed, tidied, layout confirmed good
- Title and subtitle from .json now applied and editable (white on white resolved)
- Country flags now display correctly in PC browser (city submenu)

---

### Item 6: Database Alignment (Cities) ✅
**Completed:** 2026-04-27 — branch `item-6a`

- Cities field added to all entities: tips, food, accom, journey, sights
- Trip JSON converted to new structure
- "All" option added to city filter (default)
- City filter applied to Accommodation and Transport tabs
- City management dialog: add new or select existing, Start/Return handling
- City subheadings sticky below main tab bar, flag/country label in menu
- Tips "[object Object]" display fixed
- Itinerary city scroll adjusted — day and city name stays in view
- City color randomization — submenu and map match city color
- Departure leg renamed/handled as Start; Return as special option
- Add leg dialog: city from/to, days/dates, conflict warning

---

### Item 6: Packing Fixes ✅
**Completed:** 2026-04-28

- Packing guides ("Before leaving home", "Sink washing", "Capsule") in 3-column grid, collapsed by default
- DEFAULT_LEAVE_HOME checklist applied on blank or initial load
- "Before leaving home" removed from Carry-on Packed Bag defaults

---

### Item 7: Interactive How-To Guide ✅
**Completed:** 2026-04-28 — branch `item-7a`

- Interactive guide fixed and updated to reflect latest app changes
- Default JSON example updated for all changes
- AI script generator updated: cities as multi-add, assigns cityId to tips/food/activities
- Guide button fixed (was doing nothing — missing `window.*` exports in `guide.js`)
- DEFAULT_LEAVE_HOME applied when content blank or on initial load
- Packing guides redesigned: tab-style pill navigation, badge on Pre-Departure, hidden by default with close buttons