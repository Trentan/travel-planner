---
title: "[Audit]: Guard Fallback LocalStorage SetItem Calls Against QuotaExceededError to Protect Disk Saving"
labels: ["bug", "priority: important", "area: data"]
estimate: "S"
---

# [Audit]: Guard Fallback LocalStorage SetItem Calls Against QuotaExceededError to Protect Disk Saving

## Before
In `js/data.js:L5133-5145`, during `saveData()`, data is written to IndexedDB inside a `try...catch` block. Immediately following, raw `localStorage.setItem` calls are executed for legacy fallback keys without any error handling. If `localStorage` hits the browser origin quota (commonly 5MB) or throws a `QuotaExceededError`, execution terminates before `await saveFileToDisk()` (L5145) can run, causing file changes to be dropped.

## Evidence
In `js/data.js`:
```javascript
  // Always also save to localStorage as fallback
  localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));
  localStorage.setItem('travelApp_v2026_template', JSON.stringify(appData));
  localStorage.setItem('travelApp_packing_v3', JSON.stringify(packingData));
  ...
  const savedToFile = await saveFileToDisk();
```

## Proposed
Wrap the `localStorage` serialization statements in a `try...catch` block so that a full or restricted `localStorage` cannot abort File System Access disk persistence or save status UI updates.

## After
Local file system saves continue successfully even if `localStorage` is full or unavailable in restricted contexts.

## Estimate
- Effort estimate: S

## Files impacted
- `js/data.js`

## Acceptance criteria
- [ ] `localStorage.setItem` failures do not block `saveFileToDisk()`.
- [ ] Save status pill displays correct status when disk write succeeds.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
