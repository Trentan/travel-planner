# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-vii
- **Branch:** item-8a-vii-country-entry
- **What needs to be done:** Allow users to enter/create a new country when "Other" is selected in Manage Cities dialog. This requires:
  - Adding an input field for custom country entry when "Other" is selected
  - Storing custom countries with {code, name, flag} in localStorage
  - Loading custom countries on init and displaying them alongside built-in COUNTRY_DATA
  - Using a default country code (e.g., "XX" or user-defined) and allowing the user to specify both country name and code
- **Next step:** Examine current country select implementation in Manage Cities dialog to understand the flow
- **Files to touch:** js/data.js (COUNTRY_DATA handling, custom country storage, datalist creation)
- **Estimated commits:** 2-3 commits
- **Known blockers / risks:** Need to decide on country code format for user-defined countries
ation in Manage Cities dialog to understand the flow
- **Files to touch:** `js/data.js` (COUNTRY_DATA handling, custom country storage, datalist creation)
- **Estimated commits:** 2-3 commits
- **Known blockers / risks:** Need to decide on country code format for user-defined countries

## 👀 Awaiting Review / Merge

- **Item/Feature:** 8a-vi — Branch `item-8a-vi-edit-segment-refactor` — PR ready
- Summary: Multi-leg journey edit dialog refactor with status dropdown, cities persistence, journey name fixes, and improved city add UX

## Completed (to be merged to main)

none

## Archived (merged to main, awaiting user verification)

none

---

*Last updated: 2026-05-02 — Starting item 8a-vii*
