---
title: "[Audit]: Eliminate Developer File-System Mental Model with Frictionless IndexedDB Auto-Persistence"
labels: ["jules-suggested", "triage", "onboarding", "data-integrity"]
estimate: "L"
---

# [Audit]: Eliminate Developer File-System Mental Model with Frictionless IndexedDB Auto-Persistence

## Before
The onboarding and data persistence flow treats travelers like database administrators. First-time users and users without active file handles are confronted with `file-setup-modal` prompting them to "Save As..." or "Blank Trip", referencing File System Access API handles. On mobile browsers (especially iOS Safari), the File System Access API is completely unsupported, forcing awkward fallback dialogs. Furthermore, primary navigation menus expose technical actions like "Save As JSON", "Open Local File", "Hard Restart", and "Factory Reset (Wipe Data)", causing cognitive friction and accidental data loss fears.

## Evidence
- `index.html`: Line 885 `file-setup-modal` blocks users until they choose file options.
- `js/data.js`: `renderTripStartPathChoice()` forces a fork between "Path A: City & Dates Explorer" and "Path B: Flight Confirmation Import".
- Primary navigation bars expose file management buttons alongside regular tools.

## Proposed
1. **Implicit Local-First Persistence**:
   - Store all active trips automatically in IndexedDB (`travelApp_trip_active` / `travelApp_trips_store`).
   - Eliminate `file-setup-modal` from the initial user path. Users who open the app for the first time should be placed directly into an active trip canvas with a sample itinerary or an instant 10-second quick-starter card.
2. **Progressive 1-Screen Quick-Starter**:
   - Replace the rigid "Path A vs Path B" fork with a single card:
     - [✨ Build with AI] (Title + Destination + rough dates)
     - [✈️ Paste Bookings] (Drop flight/hotel confirmation text)
     - [🗺️ Start Blank] (Name + First City)
3. **Demote Developer/Diagnostic Jargon**:
   - Move "Save As JSON" and "Open Local File" into a clean "Export / Backup" submenu under Trip Settings.
   - Demote "Hard Restart" and "Factory Reset" into an advanced diagnostics panel inside app settings.

## After
Casual travelers can start planning immediately with zero file-system friction or technical jargon, while advanced users retain full offline JSON export capabilities.

## Estimate
- Effort estimate: L

## Files impacted
- `js/data.js`
- `index.html`
- `js/trip-library.js`

## Acceptance criteria
- [ ] First-time users are not shown a blocking "Save As..." or "Choose File System Handle" prompt.
- [ ] Edits to the active trip persist automatically to IndexedDB without requiring manual saves.
- [ ] Initial trip setup allows entering basic trip info or pasting bookings without branching menus.
- [ ] Destructive diagnostics ("Factory Reset") are removed from primary navigation menus.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Mobile Safari and Chrome simulation: Open app in private browsing, verify zero-friction onboarding directly into an editable timeline.
