---
title: "[Audit]: Prevent HTML/Script Injection in Packing and Checklist Item ContentEditable Elements"
labels: ["bug", "priority: critical", "area: mobile"]
estimate: "S"
---

# [Audit]: Prevent HTML/Script Injection in Packing and Checklist Item ContentEditable Elements

## Before
In `js/tabs.js:L523-530` and `js/packing.js:L159-168`, user item texts (`item.text`) and category titles (`cat.title`) are interpolated into HTML template literals without calling `escapeHtmlText()`. If an imported trip or shared link includes HTML tags or `<img src=x onerror=...>` in checklist texts, script execution occurs immediately upon rendering the Packing tab.

## Evidence
In `js/tabs.js`:
```javascript
<h3><span contenteditable="${canEdit}" onblur="updatePackingCat(...)">${cat.title}</span></h3>
...
<span contenteditable="${canEdit}" onblur="updatePackingItem(...)" class="${item.done ? 'content-done' : ''}">${item.text}</span>
```
In `js/packing.js`:
```javascript
<h4 contenteditable="${canEdit}" onblur="updateHotelCheckoutItem(...)">${item.text}</h4>
```

## Proposed
1. Wrap `${cat.title}`, `${item.text}`, and related checklist labels with `escapeHtmlText(...)` in `js/tabs.js` and `js/packing.js`.
2. Ensure `updatePackingItem` and `updateLeaveHomeItem` correctly handle text content without injecting raw unescaped markup.
3. Add a regression test verifying that HTML entities in checklist items render as text without executing scripts.

## After
Checklist and packing items with special HTML characters render safely and do not expose the app to XSS vulnerabilities.

## Estimate
- Effort estimate: S

## Files impacted
- `js/tabs.js`
- `js/packing.js`
- `tests/packing.test.js`

## Acceptance criteria
- [ ] HTML strings in `item.text` and `cat.title` are escaped prior to rendering.
- [ ] Checklist editing retains user text correctly.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
