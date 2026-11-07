---
title: "[Audit]: Provide Clear User Guidance When Uploading Non-Text PDF Confirmations in Booking Intake"
labels: ["ux", "area: mobile"]
estimate: "S"
---

# [Audit]: Provide Clear User Guidance When Uploading Non-Text PDF Confirmations in Booking Intake

## Before
In `js/booking-intake.js:L487-505`, the file input specifies `accept=".txt,.eml,.pdf,.png,.jpg,.jpeg"`. For image files, the app shows a helpful notice explaining that local OCR is not available. However, for `.pdf` files, `handleBookingIntakeFile()` executes `await file.text()`. When given a binary or compressed PDF, unreadable binary character garbage is injected into the text area.

## Evidence
In `js/booking-intake.js`:
```javascript
  const lowerName = file.name.toLowerCase();
  if (/\.(png|jpg|jpeg)$/.test(lowerName)) {
    if (statusEl) statusEl.textContent = `${file.name} attached. Image OCR is not available locally...`;
    return;
  }
  try {
    const text = await file.text();
```

## Proposed
1. Check if the file is a PDF. If the extracted text appears to contain binary markers or lacks readable ASCII words, display a friendly notice: `PDF attached. If text does not appear above, copy and paste the booking text directly from your PDF reader.`
2. Filter unprintable binary control characters before appending to the text input.

## After
Users uploading tickets in PDF format receive clear guidance and are not confronted with raw binary streams.

## Estimate
- Effort estimate: S

## Files impacted
- `js/booking-intake.js`

## Acceptance criteria
- [ ] Uploading a PDF does not dump binary gibberish into the textarea.
- [ ] Informative status guidance is provided when PDF text cannot be read directly.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Manual verification: Upload a PDF file in Booking Intake dialog.
