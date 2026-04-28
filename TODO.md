# TODO.md

All active work items for Travel Planner PWA.
Read this file at the start of every session. Update status blocks and checkboxes as work progresses.

---

## Completed

### ~~Item 2: Resolve Journey/Transport integration~~ ✅ COMPLETED
**Status:** Completed — integrated journeys with transport tab
**Completed:** 2026-04-26

- [x] a) Transport used to work flawlessly in itinerary and display correctly in the Transport tab. Items have all transitioned to Journeys and are not being handled or displayed correctly — resolve.
- [x] b) Journeys import from JSON working — saved to localStorage and loaded in initData
- [x] c) Journeys have fromCityId/toCityId linking to defined cities
- [x] d) Transport tab reverted to table format with columns: Type, Date, Route, Time, Provider, Route #, Cost, Status, Booking Ref, Actions
- [x] e) Journey/transport needs a refactor with journeyName and journeyId for multi-segment trips
- [x] f) The add journey dialog not displaying — fixed

---

### ~~Item 3: Multi-leg Journey Object & Table Redesign~~ ✅ COMPLETED
**Status:** Completed — multi-leg journey structure implemented
**Completed:** 2026-04-26

- [x] a) Extend journey object to support multi-leg trips — add legs: [] array, isMultiLeg: boolean, journeyName, journeyId
- [x] b) Update saveJourneyFromModal() in transport.js — allow adding multiple segments before saving
- [x] c) Update buildTransportTab() table render — group rows by journeyId with expand toggle
- [x] d) Update getDayJourneys() in transport.js — match multi-leg journeys by departureDate
- [x] e) Update itinerary.js transport block render — display journey.journeyName and full route chain
- [x] f) Update getSortedJourneys() — sort by first segment's departureDate/Time
- [x] g) Update openAddJourneyModal() — pre-populate journeyId for segments

---

### ~~Item 1: Layout issue~~ ✅ COMPLETED
**Status:** Completed — branch `item-1b-sync-fixes` merged
**Completed:** 2026-04-25 — three-column layout + collapsible tab sync + button fix

- [x] a) Three-column layout: Tips, Food Quests, Suggested Activities
- [x] b) Collapsible action button bug fixed; tab synchronization working

---

### ~~Item 4: Style.css issues~~ ✅ COMPLETED
**Status:** Completed — branch `item-4a`
**Completed:** 2026-04-27

- [x] a) style.css has errors displaying, fix and tidy and confirm look and layout good
- [x] b) The title and subtitle from .json is not being applied and it is not easy to edit / readable (white on white) when editing
- [x] c) Country flags are displaying perfectly in mobile but not a pc based web browser (for the city submenu)

---

### ~~Item 1: Database alignment~~ ✅ COMPLETED
**Status:** Completed — branch `item-6a`
**Last completed:** `item-6f` — Cities selection
**Next:** `item-6g` — Add cityId to journeys (done), tips, food, activities, accommodation

- [x] a) Tips, suggested activities, food quests, accommodation, and transport should all be alignable to cities — add a `cities` field stored on each entity in the JSON, usable for filtering and future display in individual tabs outside itinerary mode. Perhaps each city defined should have the country, name, date from, date to, duration.
- [x] b) Convert the current trip file `2026_June_July_Europe_Thailand.json` to handle this new structure
- [X] c) moved
- [x] d) For add cityId - I mean add a VARIABLE `cities` to each object class (eg tips, food, accom, journey, sights) - not just rename the variables in the json structure fix it (`2026_June_July_Europe_Thailand.json` to handle this new structure)
- [x] e) Add an "All" option (default) to the cities subheading filter
- [x] f) When a city is selected in the subheading filter: show only that city's entries in the Accommodation and Transport tabs; (like the jump to that city in the Itinerary view (already implemented))
- [x] g) Need a way to edit and manage cities (perhaps from the add new leg button - make this a dialog now with either new city or select preexisting) - also if there is a start and return city (eg first and last legs) maybe make that 'home' - or some way to handle the initial departure and last arrival (eg day 1 Departure - Last day Return).
- [x] h) City subheadings (currently above the main tabs) disappear on scroll — they should remain visible and interactive when scrolling, and appear below the main tab bar throughout the entire app. The city selections are working great - BUT - implement the nice labeling of the flag/country prior to the city name in the selection menu (like it used to be).
- [x] i) Tips look broken, they just display "[object Object]"
- [x] j) The city selection in itinerary view is scrolling just a bit to far, the day and city name should still be in view (not just the city tips etc)
- [x] k) City color randomization - assign random color for new cities, maybe make submenu and map match city color scheme
- [x] l) You can perhaps also - rename the departure leg to start - perhaps make an option to handle it better. Eg make it like a city (so you can select Start or Return options - they are the only special ones which are not city specific (but represent an actual leg not a city).
- [x] m) I don't know how to handle adding days in legs etc., perhaps add legs should have the multiple cities and days handled when adding (eg city from, to, days / dates from to). Also maybe warn about conflict if a day already help - this might need more questions to work out a logical solution

---

## Active

### Item 5: Convert Accommodation ✅ COMPLETED
**Status:** In progress — 5f complete
**Last completed:** 5f
**Next:** `item-5g`
**Note:** No migration of old accomItems — new stays model only going forward. Old accomItems stay in data until a separate JSON conversion is done later.

- [x] a) Phase 1 — Data model: add top-level `stays []` global in `data.js`; load/save with key `travelApp_stays_v1`; add `stays` to `exportJSON()` and `importJSON()`; add `stays` cityId cleanup in `deleteCity()`
- [x] b) Phase 2 — Add Stay dialog: build "Add Stay" modal in `index.html` (fields: city, property name, check-in date, check-out date, status, provider, booking ref, total cost, notes; auto-calc nights); add `openAddStayModal()`, `saveStayFromModal()`, `deleteStay()`, `toggleStayStatus()` in `js/crud.js`; replace "Add Accom" button in `itinerary.js` (~line 279) to call `openAddStayModal()` instead
  - **⚠️ Carry-forward (next session):** A partial implementation was applied (branch `item-4a`) but targets the wrong data model — pushes to `day.accomItems` instead of `stays[]`, uses `openStayModal` not `openAddStayModal`, missing fields (city, dates, provider, notes), missing `deleteStay()`/`toggleStayStatus()`. Revert or overwrite those changes and implement correctly against `stays[]`.
- [x] c) Phase 3 — Accommodation tab: rewrite `buildAccomTab()` in `tabs.js` to render from `stays[]` sorted by check-in date (columns: City, Property, Check-in → Check-out, Nights, Status, Cost); city filter uses `stay.city` field directly; update `buildBudgetTab()` to sum `stays[].total_cost` by leg instead of `day.accomItems`
- [x] d) Phase 4 — Itinerary day card: replace `accomItems` block render in `itinerary.js` (~lines 54–58 compact, ~lines 262–280 full card) with derived stay display: check-in on start date, "Staying at X" for middle days, check-out on final day; update transit detection at ~line 120
- [x] e) Phase 5 — Accommodation needs an add accommodation button to launch an add accommodation dialog and be able to save
- [x] f) Phase 6 — The accommodation/stays options in the itinerary and table needs the ability to edit stays and launch dialog and save
- [ ] g) Phase 7 — The add stay button should not be at the bottom, but in the same with a heading of Accommodation just like the transport page and similar (up the top)
- [ ] h) Phase 8 — Convert all the old accommodation in my json file (backups/2026_June_July_Europe_Thailand.json) to the new format for stays

---

### Item 6: Packing fixes ✅ COMPLETED
**Status:** Complete - all sub-tasks done
**Status:** Not started
**Last completed:** —
**Next:** `item-6a`

- [x] a) Layout update The collapsibles "Before leaving home", "hotel sink washing", "Example capsule" - Should be setup be setup in a single row with 3 columns (each collapsible in its own column) - grid style so they take up less space. By default / on packing tab open / default state they should always be collapsed until opened.
- [x] b) Before leaving home should have a default checklist 
- [x] c) For the Carry-on Packed Bag (Main Luggage) - REMOVE "Before leaving home" from the default
- [x] d) Layout update The collapsibles "Before leaving home", "hotel sink washing", "Example capsule" - Should be setup be setup in a single row with 3 columns (each collapsible in its own column) - grid style so they take up less space. By default / on packing tab open / default state they should always be collapsed until opened.

---

### ~~Item 7: Interactive How-To Guide~~ ✅ COMPLETED
**Status:** Completed — branch `item-7a`
**Completed:** 2026-04-28

- [x] a) The interactive guide on how to use the app is not working — fix and improve it to reflect the latest changes
- [x] b) The default json example for the app can be updated for all the changes and the logic improved
- [x] c) The AI script generator can be updated now, include the cities options as a multi add option and all the other functionalities. Make sure it assigns the city when generating the content for each thing, eg tips, food quests, suggested activities.
- [x] d) The interactive guide is not working - the button press does nothing
- [x] e) For before leaving home, this default list should be applied DEFAULT_LEAVE_HOME - if the content is blank or on initial load
- [x] f) The collapsibles of "Before leaving home", "hotel sink washing", "Example capsule" look strange, there could be a better layout/idea (kind of hidden until needed, there might be better design options)

---

### Item 8: Improve Country and City standards
**Status:** Not started
**Last completed:** —
**Next:** `item-7a`

- [ ] a) Should the table layout for journeys be improved to display the fields better? 
- [ ] b) ALso I noticed when adding new cities they are not appearing in the second submenu (like I just did for verona, italy) - that dialog should provide country dropdowns and if not existing, add one too (but try to use built in icao/iso standards - maybe use the 3 char port codes and short dscriptions for ports eg BNE Brisbane). Also, the country and cities should really be fixed selections / options ... I know not perfect - but mainstream and perhaps icao / iso standards for them. Have a quick built in list, but any outside that can be added in json by the user. eg <datalist id="iso-countries"> AU, Australia, <datalist id="icaoCities"> BNE, Brisbane. The cities should be stored with their matching ISO 2 char code (eg, BNE, Brisbane, AU)

## Noticed (unscheduled)

<!-- Claude: add any bugs or improvements spotted during work here. Do not fix them — flag only. -->

---

## Testing Checklist

Before considering any work complete:
- [ ] Open index.html in browser - app loads without errors
- [ ] Create/edit/delete items in all tabs
- [ ] Drag sights/runs from pool to day cards
- [ ] Toggle Fun Mode and Read Only Mode - UI updates correctly
- [ ] Toggle Compact View - layout switches, checkboxes work
- [ ] Export JSON - file downloads with correct data
- [ ] Import JSON - data loads and renders properly
- [ ] Budget calculations update when costs change
- [ ] Packing items check/uncheck and persist after refresh
- [ ] Service Worker registers (check browser DevTools)
- [ ] Print views render correctly (test both Summary and Detailed)

---

## Future Enhancements (Unscheduled)

- Dark mode toggle
- Search/filter functionality
- Undo/redo system
- Image upload for receipts
- Cloud sync (Firebase/Dropbox)
- Multi-user collaboration
- Trip sharing/export formats (PDF, Google Docs)
- Activity duration tracking
- Flight miles tracking
- Budget categories breakdown
- Change colors for cities
- Add multiple cities to a leg
- Add or subtract a day to an existing leg
