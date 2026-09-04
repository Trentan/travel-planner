# Google Play Release Checklist

## 1. App Configuration & Assets
- [ ] App Version (`versionName` and `versionCode`): verified via `npm run version:info` (automated in CI).
- [ ] Application ID matches the intended package name (`com.trenscends.travelplanner`).
- [ ] App Icon and Splash Screen display correctly on modern Android versions.
- [ ] Automated Release Pipeline: `.github/workflows/release-android.yml` builds `.aab` and `.apk` on every `main` merge (see `docs/ANDROID_RELEASES.md`).

## 2. Security & Compliance
- [ ] Release build signed with production keystore.
- [ ] Debugging disabled in release build (`debuggable false`).
- [ ] Privacy Policy URL accessible and active.
- [ ] Required Android permissions reviewed (remove unused/dangerous permissions).

## 3. Stability & Quality
- [ ] Zero unhandled crashes in core workflows.
- [ ] Target SDK updated to Google Play requirements.
- [ ] Tested on varying screen densities and dark mode.
