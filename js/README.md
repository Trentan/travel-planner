# JavaScript Architecture & Module Guide

This directory contains the client-side JavaScript modules powering the Travel Planner application.
The application uses browser-native scripts loaded in sequence into global scope in `index.html`.

## Script Load Order & Dependencies

```
1. js/default-data.js   --> Initial template data structures
2. js/utils.js          --> Date parsing, modal helpers, currency & UI utility functions
3. js/attachments.js    --> File attachment handling & storage helpers
4. js/data.js           --> Core data models, trip normalization, city/leg resolution
5. js/packing.js        --> Packing list generator, categories & item state
6. js/dragdrop.js       --> Drag-and-drop reordering helpers
7. js/crud.js           --> Item creation, editing, deletion & modal submit logic
8. js/tabs.js           --> Tab switching, section navigation & view toggling
9. js/ai.js             --> AI prompt generation & trip assistant logic
10. js/guide.js         --> Destination guide & activity recommendation rendering
11. js/map.js           --> Leaflet map integration, markers, routes & interactive bounds
12. js/ui.js            --> Main UI updates, stat counters & DOM binding orchestrator
13. js/itinerary.js     --> Itinerary view rendering, timeline builders, leg cards
14. js/backup.js        --> Export, import, JSON backup & restore handlers
15. js/auto-stays.js    --> Accommodation gap detection & automated stay generation
16. js/transport.js     --> Transport leg management, route links & detail renderers
17. js/booking-intake.js--> Booking parsing & auto-import intake wizard
```

---

## Module Overview & File Responsibilities

### Core Data & State Management
- **[js/default-data.js](file:///c:/Apps/Projects/travel-planner/js/default-data.js)**: Holds fallback default trip dataset structure (`DEFAULT_TRIP_DATA`).
- **[js/data.js](file:///c:/Apps/Projects/travel-planner/js/data.js)**: Main state container (`currentTripData`), trip normalization logic (`normalizeTripCitiesDateData`), city index lookup, and leg date calculators.
- **[js/utils.js](file:///c:/Apps/Projects/travel-planner/js/utils.js)**: Date formatting, time calculations, notification popups, modal toggling, and escape HTML helpers.

### Itinerary & Transport Domain
- **[js/itinerary.js](file:///c:/Apps/Projects/travel-planner/js/itinerary.js)**: Renders main itinerary view, city summary cards, day-by-day activity timelines, and leg status tags.
- **[js/transport.js](file:///c:/Apps/Projects/travel-planner/js/transport.js)**: Manages flight/train/bus/ferry transport items, duration calculations, and transport leg visualizers.
- **[js/auto-stays.js](file:///c:/Apps/Projects/travel-planner/js/auto-stays.js)**: Inspects city dates against transport arrivals/departures to identify missing hotel nights and auto-populate stays.

### UI & Modal Interactions
- **[js/crud.js](file:///c:/Apps/Projects/travel-planner/js/crud.js)**: Handlers for modal forms (add/edit activity, transport, stay, note), item deletion, and field validation.
- **[js/ui.js](file:///c:/Apps/Projects/travel-planner/js/ui.js)**: General UI state management, dark mode toggling, trip stats calculation, and global event bindings.
- **[js/tabs.js](file:///c:/Apps/Projects/travel-planner/js/tabs.js)**: Manages top-level navigation tabs (Itinerary, Transport, Packing, Guide, Map).

### Utilities & Integrations
- **[js/map.js](file:///c:/Apps/Projects/travel-planner/js/map.js)**: Renders interactive Leaflet map with custom city markers, transport polylines, and popups.
- **[js/packing.js](file:///c:/Apps/Projects/travel-planner/js/packing.js)**: Packing checklist state, category filtering, item additions, and completion tracking.
- **[js/booking-intake.js](file:///c:/Apps/Projects/travel-planner/js/booking-intake.js)**: Intelligent parser for email/booking text imports (flights, hotel confirmations).
- **[js/backup.js](file:///c:/Apps/Projects/travel-planner/js/backup.js)**: Manages JSON file import/export and backup history.
- **[js/ai.js](file:///c:/Apps/Projects/travel-planner/js/ai.js)**: AI recommendation helper prompts and smart itinerary suggestions.
- **[js/attachments.js](file:///c:/Apps/Projects/travel-planner/js/attachments.js)**: Attach PDF/image tickets to itinerary items.
- **[js/dragdrop.js](file:///c:/Apps/Projects/travel-planner/js/dragdrop.js)**: Native drag-and-drop support for reordering activities.

---

## Developer Guidelines for Repairs & Modifications

1. **Global Scope Scope Safety**: Avoid global variable collisions. All cross-module functions must maintain their existing function names because inline HTML `onclick` handlers and test extraction helpers rely on them.
2. **Data Model Integrity**: When adding fields to activities or transport, update `normalizeTripCitiesDateData` in `js/data.js` to ensure fallback values exist for legacy trip files.
3. **Automated Verification**: Always test changes with `npm test` and `node tests/city-nav-regression.js` after structural edits.
