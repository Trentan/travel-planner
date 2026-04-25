# TODO.md

All active work items for Travel Planner PWA.
Read this file at the start of every session. Update status blocks and checkboxes as work progresses.

---

## Completed

### ~~Item 1: Layout issue~~ ✅ COMPLETED
**Status:** Completed — branch `item-1b-sync-fixes` merged
**Completed:** 2026-04-25 — three-column layout + collapsible tab sync + button fix

- [x] a) Three-column layout: Tips, Food Quests, Suggested Activities
- [x] b) Collapsible action button bug fixed; tab synchronization working

---

## Active

### Item 2: Resolve Journey/Transport integration
**Status:** In progress — branch `item-2a`
**Last completed:** item-6 — cities now have proper IDs for journey linking
**Next:** item-2b/2c/2d — assess and fix journey loading/display

- [x] a) Transport used to work flawlessly in itinerary and display correctly in the Transport tab. Items have all transitioned to Journeys and are not being handled or displayed correctly — resolve.
- [x] b) Journeys import from JSON working — saved to localStorage and loaded in initData
- [x] c) Journeys have fromCityId/toCityId linking to defined cities
- [x] d) Transport tab reverted to table format with columns: Type, Date, Route, Time, Provider, Route #, Cost, Status, Booking Ref, Actions 
 
**Summary:** Budget tab was still calculating transport costs from obsolete `day.transportItems`. Fixed by using `journeys.filter()` matched against `day.date`, `day.from`, and `day.to`.

---

### Item 3: Style.css issues
**Status:** Not started
**Last completed:** —
**Next:** `item-3a`

- [ ] a) style.css has errors displaying, fix and tidy and confirm look and layout good
- [ ] b) The title and subtitle from .json is not being applied and it is not easy to edit / readable (white on white) when editing

---

### Item 4: Convert Accommodation
**Status:** Not started
**Last completed:** —
**Next:** `item-4a`
**Spec:** `todo/accomodation-spec-conversion.md`

- [ ] a) Accommodation needs fixing — read and work through `todo/accomodation-spec-conversion.md` before starting - perhaps consolidate that information into this todolist under item 4 - if you have questions regarding the changes and when adding to the todo list: ask

---

### Item 5: Packing fixes
**Status:** Not started
**Last completed:** —
**Next:** `item-5a`

- [ ] a) Carry-on Packed Bag (Main Luggage) - REMOVE "Before leaving home" from the default
- [ ] b) The collapsible Before leaving home, hotel sink washing, Example capsule - can be setup in a row 1 x 3 col - grid style so they take up less space. By default / on tab open (packing) they should all be collapsed.

---

### ~~Item 6: Database alignment~~ ✅ COMPLETED
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

### Item 7: Interactive How-To Guide
**Status:** Not started
**Last completed:** —
**Next:** `item-7a`

- [ ] a) The interactive guide on how to use the app is not working — fix and improve it to reflect the latest changes
- [ ] b) The default json example for the app can be updated for all the changes and the logic improved
- [ ] c) The AI script generator can be updated now, include the cities options as a multi add option and all the other functionalities. Make sure it assignKs the city when generating the content for each thing, eg tips, food quests, suggested activities.

---

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
