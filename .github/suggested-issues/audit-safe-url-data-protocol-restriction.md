---
title: "[Audit]: Restrict Data URIs in isSafeUrl to Image MIME Types to Prevent HTML Payloads"
labels: ["bug", "priority: important"]
estimate: "S"
---

# [Audit]: Restrict Data URIs in isSafeUrl to Image MIME Types to Prevent HTML Payloads

## Before
In `js/utils.js:L109-121`, `isSafeUrl()` checks whether a URL's protocol is `http:`, `https:`, or `data:`. Allowing unrestricted `data:` URIs permits `data:text/html,<script>...` to pass validation as a "safe" URL, which can be rendered into external links or iframes.

## Evidence
In `js/utils.js`:
```javascript
function isSafeUrl(url) {
  ...
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'data:';
}
```
Meanwhile, in `js/trip-library.js:L567`, image data URIs are correctly restricted:
```javascript
return /^(https?:|\/|data:image\/)/i.test(url.trim());
```

## Proposed
1. Update `isSafeUrl` in `js/utils.js` so `data:` protocols are only considered safe if they start with `data:image/`.
2. Update unit tests in `tests/is-safe-url.test.js` to ensure `data:text/html` returns `false` while `data:image/png` returns `true`.

## After
Only safe HTTP/HTTPS links and image data URIs pass the URL safety validator.

## Estimate
- Effort estimate: S

## Files impacted
- `js/utils.js`
- `tests/is-safe-url.test.js`

## Acceptance criteria
- [ ] `isSafeUrl('data:text/html,<script>...')` returns `false`.
- [ ] `isSafeUrl('data:image/png;base64,...')` returns `true`.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `node tests/is-safe-url.test.js` and `npm test`.
