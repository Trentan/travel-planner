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
**Status:** Completed — branch `item-2a` pushed for review
**Last completed:** `81150e4` — item-2a: Fix budget tab to use journeys array
**Next:** —

- [x] a) Transport used to work flawlessly in itinerary and display correctly in the Transport tab. Items have all transitioned to Journeys and are not being handled or displayed correctly — resolve.
- [ ] b) Journeys are in json backups/2026_June_July_Europe_Thailand.json - but not loading / viewing in itinerary or transport. Need to intersperse from itinerary or transport the journeys to pair with each other and display in tables / itinerary where possible. It is not displaying anything from json. **[ON HOLD - pending Item 6]**
- [ ] c) I think the merging transition from transport to journeys has corrupted everything. We want the original functionality of trasport - but it is now a journey. Perhaps journey needs enhancing to, only operate between defined cities. We may need to do Item 6 first so journeys only exists between sequential cities - then can remove all traces of the old transport style as journeys will work.
- [ ] d) Rather than have it as a table with rows of collapsible in the transport tab, revert the display to a table with columns for the data elements of the journey 

**Summary:** Budget tab was still calculating transport costs from obsolete `day.transportItems`. Fixed by using `journeys.filter()` matched against `day.date`, `day.from`, and `day.to`.

---

### Item 3: Style.css issues
**Status:** Not started
**Last completed:** —
**Next:** `item-3a`

- [ ] a) style.css has errors displaying, fix and tidy and confirm look and layout good

---

### Item 4: Convert Accommodation
**Status:** Not started
**Last completed:** —
**Next:** `item-4a`
**Spec:** `todo/accomodation-spec-conversion.md`

- [ ] a) Accommodation needs fixing — read and work through `todo/accomodation-spec-conversion.md` before starting

---

### Item 5: Packing fixes
**Status:** Not started
**Last completed:** —
**Next:** `item-5a`

- [ ] a) Carry-on Packed Bag (Main Luggage) - REMOVE "Before leaving home" from the default
- [ ] b) The collapsible Before leaving home, hotel sink washing, Example capsule - can be setup in a row 1 x 3 col - grid style so they take up less space. By default / on tab open (packing) they should all be collapsed.

---

### Item 6: Database alignment (city grouping + city option)
**Status:** In progress — branch `item-6b`
**Last completed:** `item-6a` — Cities data structure with auto-extraction from itinerary
**Next:** `item-6g` — Add cityId to journeys (done), tips, food, activities, accommodation

- [x] a) Tips, suggested activities, food quests, accommodation, and transport should all be alignable to cities — add a `cities` field stored on each entity in the JSON, usable for filtering and future display in individual tabs outside itinerary mode. Perhaps each city defined should have the country, name, date from, date to, duration. 
- [x] b) Convert the current trip file `2026_June_July_Europe_Thailand.json` to handle this new structure
- [x] c) City subheadings (currently above the main tabs) disappear on scroll — they should remain visible and interactive when scrolling, and appear below the main tab bar
- [x] d) For add cityId - I mean add a VARIABLE `cities` to each object class (eg tips, food, accom, journey, sights) - not just rename the variables in the json structure fix it (`2026_June_July_Europe_Thailand.json` to handle this new structure)
- [x] e) Add an "All" option (default) to the cities subheading filter
- [x] f) When a city is selected in the subheading filter: show only that city's entries in the Accommodation and Transport tabs; (like the jump to that city in the Itinerary view (already implemented))
- [ ] g) Need a way to edit and manage cities - also if there is a start and return city (eg first and last legs) maybe make that 'home' - or some way to handle the initial departure and last arrival.
- [ ] h) The city selections are working great - BUT - we can now remove the old city sub menu - and when doing this, implement the nice labeling of the flag/country prior to the city name in the selection menu.
- [ ] i) Tips look broken, they just display [object Object]

---

### Item 7: Interactive How-To Guide
**Status:** Not started
**Last completed:** —
**Next:** `item-7a`

- [ ] a) The interactive guide on how to use the app is not working — fix and improve it to reflect the latest changes
- [ ] b) The default json example for the app can be updated for all the changes and the logic improved
- [ ] c) The AI script generator can be updated now, include the cities options as a multi add option and all the other functionalities

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
