---
name: release-hardening-audit
description: Advanced quality, UX, dark mode contrast, accessibility, Android 15 Edge-to-Edge, and release hardening protocol for mobile & web travel planner apps. Use when performing deep autonomous audits, release verification, or Play Store hardening.
metadata:
  author: Antigravity Team
  version: 2.0.0
---

# Release Hardening & Dark Mode Audit Protocol

This skill provides a systematic protocol for auditing, hardening, and verifying travel planner releases for production distribution across the Google Play Store, App Store, and Web PWAs.

---

## 1. Audit Domains & Verification Rules

### A. Dark Mode Contrast & Readability (WCAG 2.1 AA)
- **Background Surfaces**: Enforce solid `#0f172a` (slate-900) and `#1e293b` (slate-800) dark surfaces. Prevent transparent window bleed or bright splash image artifacts.
- **Text Readability**: Normal text must maintain $\ge 4.5:1$ contrast ratio against background cards. Subtitles and metadata must use `#94a3b8` (slate-400) or higher.
- **Form Controls in Dark Mode**: All text inputs, textareas, selects, and pickers must use `bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-teal-500`.

### B. Mobile Navigation Ergonomics & City/Leg Management
- **City Nav Bar (`#cityNav`)**: Must include a direct `+ City` pill button for 1-tap city addition while browsing.
- **Itinerary Section Controls**: Must offer high-contrast `[ 🌍 City ]` and `[ 🧭 Legs ]` buttons directly in the section header.
- **Touch Target Minimums**: All interactive buttons, tabs, pills, and toggles must satisfy minimum $44 \times 44\text{px}$ touch targets.
- **Virtual Keyboard Safe Insets**: Inputs must scroll into view cleanly with adequate clearance (`env(safe-area-inset-bottom)`).

### C. Android 15 Edge-to-Edge & Capacitor Integration
- **System Insets**: Android window background must be enforced as `#0f172a` in `MainActivity.java` and `styles.xml` (`values-night/styles.xml`).
- **OAuth Plugins**: `@codetrix-studio/capacitor-google-auth` must be initialized with Google Drive scopes and ProGuard optimization rules (`proguard-android-optimize.txt`).
- **Gradle 9 & AGP 8 Build Compatibility**: Build scripts in `scripts/prepare-capacitor-web.js` must verify clean Java 21 compilation.

### D. Production Build & Release Artifacts
- **APK & AAB Bundles**: Verify release builds compile cleanly via `./gradlew assembleRelease` and `./gradlew bundleRelease`.
- **R8 / ProGuard Optimization**: Ensure dead-code stripping preserves necessary plugin reflection classes (`com.codetrixstudio.capacitor.GoogleAuth.**`).

---

## 2. Release Execution Checklist

1. Execute full regression test suite (`npm test`).
2. Run city navigation suite (`node tests/city-nav-regression.js`).
3. Compile native Android debug APK (`.\gradlew.bat assembleDebug` in `android/`).
4. Audit dark mode contrast and responsive viewports (`DESKTOP: 1440x900`, `MOBILE: 390x844`).
5. Update release notes in `docs/RELEASE_REPORT.md` or `walkthrough.md`.