# UNFINISHED.md

## 🔄 Active
- **Item/sub-task:** 8b
- **Branch:** item-8b-city-iso-standards
- **Last commit:** none
- **What was done:** Complete city dialog overhaul with ISO/ICAO standards:
  - Added COUNTRY_DATA array with 43 countries (ISO codes + flags)
  - Added CITY_DATABASE with 60 major cities (IATA codes like BNE, CDG, JFK)
  - Added userCities for user-extensible city database (persisted to localStorage)
  - Updated addOrUpdateCity() to handle {code, name, countryCode} structure
  - City list now shows country dropdowns and IATA codes with flags
  - Auto-populate country when known city is entered
  - Auto-detect IATA codes for new cities
  - Migration in initData() to add codes to existing cities
  - **Known issues to fix:**
    - Add trip leg dialog not showing - loads new leg straight into itinerary instead of opening dialog
    - City selection dropdowns not populating to their pre-selected countries by default
- **Next step:** Commit and push for review
- **Files touched:** js/data.js, index.html, style.css
- **Known blockers / risks:** none

## 👀 Awaiting Review / Merge
none

## ✅ Recently Completed
none

---

*Last updated: 2026-04-28 — Item 8b ready for commit*
