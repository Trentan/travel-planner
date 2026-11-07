---
title: "[Audit]: Prevent Cross-Site Scripting (XSS) and Code Execution in Ticket Attachments & Lightbox"
labels: ["bug", "priority: critical"]
estimate: "S"
---

# [Audit]: Prevent Cross-Site Scripting (XSS) and Code Execution in Ticket Attachments & Lightbox

## Before
In `js/attachments.js:L30-58`, attachment URLs (`att.value`) and titles (`att.name`) are interpolated into inline event handlers and anchor tags without sufficient escaping:
- `onclick="openLightbox('${att.value}')"`: Breaks out if `att.value` contains single quotes or brackets.
- `<a href="${att.value}">`: Allows `javascript:` protocol execution when clicked, and allows breaking out of attribute quotes if `att.value` contains double quotes.

## Evidence
In `js/attachments.js`:
```javascript
const linkStr = isImage
  ? `<button type="button" class="text-blue-600 underline text-left" onclick="openLightbox('${att.value}')">${escapeHtmlText(att.name)}</button>`
  : `<a href="${att.value}" target="_blank" class="text-blue-600 underline">${escapeHtmlText(att.name)}</a>`;
```
No protocol validation (`isSafeUrl`) is applied to `att.value`.

## Proposed
1. Validate `att.value` using `isSafeUrl()` before rendering links; if unsafe, render as plain sanitized text or `#`.
2. Escape `att.value` with `escapeHtmlText()` in attributes.
3. In `onclick="openLightbox(...)"`, avoid raw string injection: pass index or use a data-attribute listener, or safely escape single quotes / use an event handler.
4. Add unit test suite `tests/attachments-xss.test.js`.

## After
Trip files with malicious attachment payloads cannot execute arbitrary code or scripts when clicked or rendered.

## Estimate
- Effort estimate: S

## Files impacted
- `js/attachments.js`
- `tests/attachments-xss.test.js`

## Acceptance criteria
- [ ] `javascript:` and dangerous protocols are rejected.
- [ ] Double and single quotes in `att.value` cannot break out of attributes or inline handlers.
- [ ] Unit tests verify XSS payload sanitization.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `node tests/attachments-xss.test.js` and `npm test`.
