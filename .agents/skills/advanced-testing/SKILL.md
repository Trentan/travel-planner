---
name: advanced-testing
description: "Specialized Quality & Test Engineer to audit onboarding flow, data safety, file loading, saving procedures, dark mode contrast, and mobile viewport ergonomics under simulated exceptions."
metadata:
  author: Antigravity Team
  version: 2.0.0
---

# Advanced Quality & Test Engineer Protocol

This skill provides a rigorous quality engineering framework for the Travel Planner application, focusing on end-to-end reliability, data persistence resilience, dark mode accessibility, and mobile UI ergonomics.

---

## 1. Quality & Verification Domains

### A. Data Persistence & File I/O Resilience
- **Corrupted Storage Recovery**: Corrupted or truncated `localStorage` / `IndexedDB` entries must automatically fall back to default models without unhandled exceptions or white-screen crashes.
- **File System Access API & Blob Fallback**: Test file saving under native File System Access API support and fallback `<a download>` modes.
- **Atomic Pre-Save Snapshots**: Before overwriting any local or cloud trip, verify that an in-memory emergency backup snapshot is captured.
- **Share Payload Compression**: Verify Gzip compression, URL hash decoding, minification, and key expansion (`tests/share-presets-verify.js`).

### B. Dark Mode & Accessibility Audit
- **WCAG 2.1 AA Contrast Ratios**: All text elements (including badges, pills, muted subtexts, and button labels) must maintain $\ge 4.5:1$ contrast ratio against background surfaces (`#0f172a`, `#1e293b`, `#334155`).
- **Interactive State Feedback**: Hover, active, focus-visible, and disabled states must be clearly differentiated across both Light and Dark themes.
- **Touch Target Sizing**: Minimum interactive tap target of $44 \times 44\text{px}$ on mobile viewports (`390x844`).

### C. Mobile Ergonomics & City/Leg Navigation
- **City Navigation Pill Bar (`#cityNav`)**: Verify horizontal touch-scroll behavior, active pill highlight, transit leg indicators, and inline `+ Add City` trigger.
- **Itinerary Timeline & Grouped Views**: Verify seamless toggling between Timeline and Grouped day modes.
- **Modal Input Focus & Viewport Insets**: Virtual keyboard appearance must not hide input fields or action buttons on mobile screens.

---

## 2. Test Execution Protocol

Always execute test suites sequentially and verify 100% pass rate:

```powershell
# 1. Core Automated Test Suite (23+ automated checks)
npm test

# 2. City Navigation & Route Mutation Regressions
node tests/city-nav-regression.js

# 3. Share Presets & Gzip Decompression Regressions
node tests/share-presets-verify.js

# 4. File I/O Robustness & Corrupted Payload Resync
node tests/file-io-robustness-suite.js
```

---

## 3. Viewport Verification Standards

| Mode ID | Label | Viewport | Target Checks |
|---------|-------|----------|---------------|
| `DESKTOP` | Desktop View | 1440 x 900 | Multi-column grid, top header switcher, side-by-side leg dialogs |
| `MOBILE` | Mobile View | 390 x 844 | Bottom navigation, mobile menu drawer, condensed trip cards, touch targets |

---

## 4. Defect Reporting Template

When identifying UI or functional regressions, document:
- **Component**: Exact DOM selector / JS module.
- **Observed Behavior**: Error message, visual clip, contrast failure, or unhandled rejection.
- **Expected Behavior**: Specification requirement.
- **Remediation**: Exact CSS rule or JS patch required.

