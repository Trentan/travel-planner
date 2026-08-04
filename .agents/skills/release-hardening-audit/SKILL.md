---
name: release-hardening-audit
description: Advanced quality, UX, dark mode, accessibility, and release hardening protocol for mobile & web travel planner apps. Use when performing deep autonomous audits, release verification, or Play Store hardening.
metadata:
  author: Antigravity Team
  version: 1.0.0
---

# Release Hardening Audit Skill

This skill provides a systematic protocol for auditing, hardening, and verifying travel planner releases for production distribution (Google Play / App Store).

## Audit Domains & Verification Rules

### 1. Interactive UX & Input Validation
- All modal dialogs (Add/Edit Stay, Add/Edit Journey, Add/Edit Leg, Manage Cities) must provide immediate visual feedback (e.g. border-rose-500 bg-rose-50) on mandatory input failure before showing text prompts.
- Input fields must preserve state and handle unexpected string inputs gracefully without crashing.

### 2. Comprehensive Dark Mode & Accessibility
- Components must rely on system/theme tokens (data-theme=dark) rather than hardcoded light background colors.
- Dark theme text contrast ratio must satisfy WCAG AA standards against slate/dark background surfaces.

### 3. Cross-Viewport Responsiveness
- Test layout and touch target bounds at standard viewports:
  - **DESKTOP**: 1440 x 900
  - **MOBILE**: 390 x 844
- Critical controls must remain accessible without horizontal page overflow.

### 4. Build & Capacitor Validation
- Web asset pipeline (npm run build:css, npm run prepare:capacitor-web) must run clean.
- Production native release builds (./gradlew assembleRelease) must compile cleanly without fatal Gradle warnings or missing assets.

## Execution Checklist

1. Run full test suite (npm test) and log output.
2. Audit CSS variables & theme overrides in src/tailwind.css.
3. Verify open GitHub Issues under the target milestone using gh issue list.
4. Validate production Android APK build via ./gradlew assembleRelease.
5. Output comprehensive determination in docs/RELEASE_REPORT.md.