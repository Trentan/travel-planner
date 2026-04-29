# UNFINISHED.md

## 🔄 Active
none

## 👀 Awaiting Review / Merge
- **Item 8b** — branch `item-8b-city-iso-standards`
  - Commit `142631f`: City dialog with ISO/ICAO standards and IATA codes
  - Commit `0c76ed3`: 8b-i - Fix Add Trip Leg button to open dialog
  - Commit `8c1bf3`: 8b-ii - Fix city country dropdown pre-selection
  - Commit `a44caea`: 8b-iii - Populate existing city dropdown in Add Leg dialog
  - Commit `b98f98b`: 8b-iv - Convert Add Leg country field to dropdown with "Other..." option

## Summary of Changes (Item 8b - complete)

### 8b-i: Add Trip Leg dialog fix
- Fixed `openAddLegDialog()` call in index.html:98
- Was calling `addLeg()` directly instead of opening dialog

### 8b-ii: Country dropdown pre-selection
- Fixed `populateCountrySelect()` in data.js:850
- Added null/undefined handling for country matching

### 8b-iii: Existing city dropdown population
- Added `_populateAddLegCityDropdowns()` in crud.js:243
- Populates `existingCitySelect`, `fromCitySelect`, `toCitySelect`
- Uses Home + cities from citiesData with flags

### 8b-iv: Country dropdown in Add Leg dialog
- Replaced text input `newLegCityCountry` with select dropdown
- Added `newLegCityCountrySelect` with COUNTRY_DATA options + "Other..."
- Added `newLegCityCountryOther` text input shown when "Other..." selected
- Updated `confirmAddLeg()` to handle new city creation with dropdown
- Added `onNewLegCountryChange()` toggle handler
- Clear form inputs in `closeAddLegDialog()`

---

*Last updated: 2026-04-29 — Item 8b complete, awaiting review*
